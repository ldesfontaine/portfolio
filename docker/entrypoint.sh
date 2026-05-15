#!/bin/sh
set -e

# ─── Payload schema push ──────────────────────────────────────────────────────
# Payload's SQLite adapter only auto-pushes the schema when NODE_ENV != production.
# For a single-user portfolio we want push (no migration history to maintain),
# so we run the bootstrap step with NODE_ENV=development. The Next server then
# starts in production mode against the already-provisioned database.
echo "→ Provisioning Payload DB schema (push)…"
NODE_ENV=development npx payload run scripts/bootstrap-schema.ts || {
  echo "⚠ Payload bootstrap failed; continuing so logs can be inspected."
}

# ─── GoatCounter bootstrap + background start ─────────────────────────────────
GC_DB="${GOATCOUNTER_DB:-/data/goatcounter.sqlite3}"
GC_LISTEN="${GOATCOUNTER_LISTEN:-127.0.0.1:8080}"
GC_VHOST="${GOATCOUNTER_VHOST:-${SITE_URL#http*://}}"
GC_VHOST="${GC_VHOST%%/*}"
GC_VHOST="${GC_VHOST:-localhost.local}"

# GoatCounter requires a vhost with at least 2 labels (e.g. "site.tld"); fall
# back to a synthetic ".local" suffix so single-label dev defaults still work.
case "${GC_VHOST}" in
  *.*) : ;;
  *)   GC_VHOST="${GC_VHOST}.local" ;;
esac

if [ ! -f "${GC_DB}" ]; then
  # GoatCounter requires a site owner. We never log in via the UI (auth is
  # delegated to Payload via the Next.js middleware, and the site is set
  # `public` below), so the credentials are derived rather than user-supplied.
  GC_ADMIN_EMAIL="admin@${GC_VHOST}"
  GC_ADMIN_PASS_FILE="/data/goatcounter-admin-password"
  GC_ADMIN_PASS=$(head -c 24 /dev/urandom | base64)

  echo "→ Bootstrapping GoatCounter DB at ${GC_DB} for vhost=${GC_VHOST}"
  if ! goatcounter db create site \
      -createdb \
      -vhost="${GC_VHOST}" \
      -user.email="${GC_ADMIN_EMAIL}" \
      -user.password="${GC_ADMIN_PASS}" \
      -db="sqlite+${GC_DB}"; then
    echo "✗ GoatCounter bootstrap failed; removing partial DB and aborting." >&2
    rm -f "${GC_DB}" "${GC_DB}-wal" "${GC_DB}-shm"
    exit 1
  fi

  # Persist the generated password for break-glass UI access. Default usage
  # path is `docker exec <ctr> cat /data/goatcounter-admin-password`; you'd
  # only need it to tweak settings that aren't exposed by the CLI.
  printf "email: %s\npassword: %s\n" "${GC_ADMIN_EMAIL}" "${GC_ADMIN_PASS}" > "${GC_ADMIN_PASS_FILE}"
  chmod 0600 "${GC_ADMIN_PASS_FILE}"

  # Mark the site as public so the dashboard is reachable without GoatCounter's
  # own login. Auth is enforced upstream by the Next.js middleware against the
  # Payload session.
  sqlite3 "${GC_DB}" \
    "UPDATE sites SET settings = json_set(settings, '\$.public', 'public') WHERE site_id = 1;"
fi

# Ensure a read-only API token exists for the admin dashboard summary widget.
# The CLI exposes count/export/site_*/site_update perms but NOT "stats" (bit 64)
# which is what /api/v0/stats/* requires in v2.7.0 — we OR it in via SQL.
GC_TOKEN_FILE="${GC_TOKEN_FILE:-/data/goatcounter-api-token}"
if [ ! -f "${GC_TOKEN_FILE}" ]; then
  echo "→ Provisioning GoatCounter API token"
  goatcounter db create apitoken \
    -user=1 \
    -name="admin-dashboard-readonly" \
    -perm=site_read,export \
    -db="sqlite+${GC_DB}" >/dev/null
  # Add the `stats` permission bit (64) on top of CLI-exposed perms.
  sqlite3 "${GC_DB}" \
    "UPDATE api_tokens SET permissions = permissions | 64 WHERE name = 'admin-dashboard-readonly';"
  # Persist the token value where Next.js can read it (read-only mode).
  sqlite3 "${GC_DB}" \
    "SELECT token FROM api_tokens WHERE name = 'admin-dashboard-readonly' LIMIT 1;" \
    > "${GC_TOKEN_FILE}"
  chmod 0600 "${GC_TOKEN_FILE}"
fi

echo "→ Starting goatcounter on ${GC_LISTEN} (base-path=/stats db=${GC_DB})"
# GoatCounter rejects unknown GOATCOUNTER_* env vars; drop our private ones
# in a subshell so we don't disturb anything else.
(
  unset GOATCOUNTER_VHOST GOATCOUNTER_DB GOATCOUNTER_LISTEN GOATCOUNTER_INTERNAL_URL
  exec goatcounter serve \
    -listen="${GC_LISTEN}" \
    -base-path=/stats \
    -tls=none \
    -db="sqlite+${GC_DB}"
) &

# Hand off PID 1 of this shell to Next.js. tini (declared in the Dockerfile
# ENTRYPOINT) is the real PID 1 and forwards signals to both children.
exec "$@"
