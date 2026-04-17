#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# scripts/restore.sh — Restore a PostgreSQL backup
#
# Usage:
#   ./scripts/restore.sh backups/wealthtracker_2026-03-11_02-00-00.sql.gz
#   make restore FILE=backups/wealthtracker_2026-03-11_02-00-00.sql.gz
#
# WARNING: This DROPS and recreates the wealthtracker database.
#          All current data will be replaced by the backup.
# ─────────────────────────────────────────────────────────────────

set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-wealthtracker-db}"
DB_USER="${DB_USER:-wealthuser}"
DB_NAME="${DB_NAME:-wealthtracker}"

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh backups/wealthtracker_*.sql.gz 2>/dev/null | awk '{print "  " $9}' || echo "  (none found in ./backups/)"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ File not found: $BACKUP_FILE"
    exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo "❌ Container '${DB_CONTAINER}' is not running. Start the stack: make up"
    exit 1
fi

echo "⚠️  WARNING: This will REPLACE all data in '${DB_NAME}' with:"
echo "   ${BACKUP_FILE}"
echo ""
read -rp "Type 'yes' to confirm: " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "🔄 Restoring ${BACKUP_FILE}..."

# Drop connections, drop DB, recreate, restore
docker exec "${DB_CONTAINER}" psql -U "${DB_USER}" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}';" \
    > /dev/null 2>&1 || true

docker exec "${DB_CONTAINER}" psql -U "${DB_USER}" -d postgres -c \
    "DROP DATABASE IF EXISTS ${DB_NAME};" > /dev/null

docker exec "${DB_CONTAINER}" psql -U "${DB_USER}" -d postgres -c \
    "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" > /dev/null

gunzip -c "${BACKUP_FILE}" | docker exec -i "${DB_CONTAINER}" \
    psql -U "${DB_USER}" -d "${DB_NAME}" -q

echo "✅ Restore complete. Restart the backend to reconnect: make restart s=backend"
