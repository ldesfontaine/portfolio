#!/bin/sh
# Snapshot the Payload SQLite DB and tarball /app/media, then optionally
# sync the result to an offsite rclone remote.
#
# Designed to run *inside* the portfolio container:
#   docker exec portfolio /app/scripts/backup.sh
#
# Idempotent for the same day (overwrites the snapshot). Local retention is
# 30 days. The offsite remote (if configured) keeps everything pushed to it.

set -eu

DATE="$(date -u +%Y%m%d-%H%M%S)"
BACKUP_DIR="/data/backups"
DB_PATH="/data/payload.db"
MEDIA_DIR="/app/media"

mkdir -p "$BACKUP_DIR"

SNAPSHOT="$BACKUP_DIR/payload-$DATE.db"
MEDIA_ARCHIVE="$BACKUP_DIR/media-$DATE.tar.gz"

echo "→ Snapshotting SQLite (online-safe, .backup)"
sqlite3 "$DB_PATH" ".backup '$SNAPSHOT'"

echo "→ Tarballing $MEDIA_DIR"
tar czf "$MEDIA_ARCHIVE" -C "$MEDIA_DIR" .

# 30-day local retention.
find "$BACKUP_DIR" -type f \( -name 'payload-*.db' -o -name 'media-*.tar.gz' \) \
  -mtime +30 -delete

if [ -n "${RCLONE_REMOTE:-}" ]; then
  if command -v rclone >/dev/null 2>&1; then
    echo "→ rclone copy → $RCLONE_REMOTE"
    rclone copy "$SNAPSHOT" "$RCLONE_REMOTE"
    rclone copy "$MEDIA_ARCHIVE" "$RCLONE_REMOTE"
  else
    echo "⚠ RCLONE_REMOTE set but rclone is not installed in the image."
    echo "  Run rclone from the host instead, against /var/lib/docker/volumes/portfolio-data/_data/backups/."
  fi
fi

echo "✓ Backup done"
echo "  $SNAPSHOT"
echo "  $MEDIA_ARCHIVE"
