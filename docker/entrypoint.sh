#!/bin/sh
set -e

# Schema push at boot.
#
# Payload's SQLite adapter only auto-pushes the schema when NODE_ENV != production.
# For a single-user portfolio we want push (no migration history to maintain),
# so we run the bootstrap step with NODE_ENV=development. The Next server then
# starts in production mode against the already-provisioned database.
echo "→ Provisioning DB schema (push)…"
NODE_ENV=development npx payload run scripts/bootstrap-schema.ts || {
  echo "⚠ Bootstrap step failed; continuing with server startup so logs can be inspected."
}

exec "$@"
