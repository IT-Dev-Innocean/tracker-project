#!/usr/bin/env bash
# Sinkronkan branch setup-vps: lokal dulu, lalu git pull + recreate container di VPS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VPS_HOST="${VPS_HOST:-31.97.188.65}"
VPS_DIR="${VPS_DIR:-/var/www/tracker-innocean}"
VPS_BRANCH="${VPS_BRANCH:-setup-vps}"
SSH_KEY="${SSH_KEY:-$ROOT/deploy/.secrets/vps_migrate}"
SSH_OPTS=(-i "$SSH_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)

echo "[sync-vps] Lokal: checkout + pull $VPS_BRANCH"
git fetch origin "$VPS_BRANCH"
git checkout "$VPS_BRANCH"
git pull --ff-only origin "$VPS_BRANCH"

echo "[sync-vps] VPS $VPS_HOST: git pull $VPS_BRANCH + docker compose up"
ssh "${SSH_OPTS[@]}" "root@$VPS_HOST" bash -s -- "$VPS_DIR" "$VPS_BRANCH" <<'REMOTE'
set -euo pipefail
VPS_DIR="$1"
VPS_BRANCH="$2"
cd "$VPS_DIR"
git fetch origin "$VPS_BRANCH"
git checkout "$VPS_BRANCH"
git pull --ff-only origin "$VPS_BRANCH"
docker compose up -d --build
docker compose ps
REMOTE

echo "[sync-vps] Selesai."
