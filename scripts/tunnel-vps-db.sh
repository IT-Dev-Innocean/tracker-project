#!/usr/bin/env bash
# Teruskan PostgreSQL VPS (127.0.0.1:5434) ke laptop (localhost:5434)
# supaya backend lokal bisa pakai DATABASE_URL di .env.
#
# Cara pakai:
#   1. Terminal baru: ./scripts/tunnel-vps-db.sh
#   2. Isi password SSH root (sama seperti DBeaver / ssh root@31.97.188.65)
#   3. Biarkan terminal ini terbuka, lalu restart ./run-backend.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VPS_HOST="${VPS_HOST:-31.97.188.65}"
LOCAL_PORT="${LOCAL_PORT:-5434}"
REMOTE_PORT="${REMOTE_PORT:-5434}"

SSH_OPTS=(
  -o StrictHostKeyChecking=accept-new
  -o ExitOnForwardFailure=yes
  -o ServerAliveInterval=30
  -o ServerAliveCountMax=3
)

if lsof -nP -iTCP:"$LOCAL_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "[tunnel-vps-db] Port $LOCAL_PORT sudah listen — tunnel kemungkinan sudah jalan."
  exit 0
fi

echo "[tunnel-vps-db] localhost:$LOCAL_PORT -> $VPS_HOST:127.0.0.1:$REMOTE_PORT"
echo "[tunnel-vps-db] Login SSH sebagai root, lalu biarkan terminal ini terbuka. Stop: Ctrl+C"
exec ssh "${SSH_OPTS[@]}" -N -L "${LOCAL_PORT}:127.0.0.1:${REMOTE_PORT}" "root@${VPS_HOST}"
