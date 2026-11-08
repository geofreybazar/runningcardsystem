#!/usr/bin/env bash
# Nightly database dump, kept 14 days. Run from cron on the VPS (see docs/development/deployment.md).
# shortcut: dumps stay on the VPS, copy them off-server (or enable Hostinger backups) for disaster recovery.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
out="backups/runningcard-$(date +%F-%H%M).sql.gz"
# Write to a temp name first, so a failed dump never looks like a good backup.
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db pg_dump -U postgres runningcard | gzip > "$out.tmp"
mv "$out.tmp" "$out"
find backups -name 'runningcard-*.sql.gz' -mtime +14 -delete
