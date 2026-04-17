#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# scripts/backup.sh — PostgreSQL backup for WealthTracker
#
# Creates a timestamped, compressed dump of the wealthtracker DB.
# Keeps the most recent N backups; older ones are deleted.
#
# Usage:
#   ./scripts/backup.sh                    # interactive (manual)
#   make backup                            # via Makefile
#   crontab: 0 2 * * * /path/to/backup.sh # daily at 2 AM
#
# Restoring a backup:
#   make restore FILE=backups/wealthtracker_2026-03-11_02-00-00.sql.gz
# ─────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-$(dirname "$0")/../backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"          # delete backups older than N days
DB_CONTAINER="${DB_CONTAINER:-wealthtracker-db}"
DB_USER="${DB_USER:-wealthuser}"
DB_NAME="${DB_NAME:-wealthtracker}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="${BACKUP_DIR}/wealthtracker_${TIMESTAMP}.sql.gz"

# ── Setup ─────────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

echo "💾 WealthTracker Backup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  DB:      ${DB_NAME} @ ${DB_CONTAINER}"
echo "  Output:  ${BACKUP_FILE}"
echo "  Keeping: last ${KEEP_DAYS} days"
echo ""

# ── Check container is running ────────────────────────────────────
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo "❌ Container '${DB_CONTAINER}' is not running."
    echo "   Start the stack first: make up"
    exit 1
fi

# ── Dump and compress ─────────────────────────────────────────────
echo "🔄 Dumping database..."
docker exec "${DB_CONTAINER}" \
    pg_dump -U "${DB_USER}" -d "${DB_NAME}" --no-password \
    | gzip > "${BACKUP_FILE}"

SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
echo "✅ Backup complete: ${BACKUP_FILE} (${SIZE})"

# ── Rotate old backups ────────────────────────────────────────────
echo ""
echo "🧹 Rotating backups older than ${KEEP_DAYS} days..."
DELETED=0
while IFS= read -r old_file; do
    rm -f "$old_file"
    echo "   Removed: $(basename "$old_file")"
    DELETED=$((DELETED + 1))
done < <(find "$BACKUP_DIR" -name "wealthtracker_*.sql.gz" -mtime +"${KEEP_DAYS}" 2>/dev/null)

if [ "$DELETED" -eq 0 ]; then
    echo "   Nothing to remove."
fi

# ── Summary ───────────────────────────────────────────────────────
echo ""
echo "📦 Current backups:"
ls -lh "${BACKUP_DIR}"/wealthtracker_*.sql.gz 2>/dev/null \
    | awk '{print "   " $5 "  " $9}' \
    || echo "   (none)"
echo ""
echo "Done. To restore: make restore FILE=${BACKUP_FILE}"
