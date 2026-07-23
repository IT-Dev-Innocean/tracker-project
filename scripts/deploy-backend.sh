#!/usr/bin/env bash
# Trigger deploy Render hanya jika ada perubahan di backend/ atau file deploy backend
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

read -r frontend_changed backend_changed <<< "$(bash scripts/detect-changes.sh "${1:-}" "${2:-HEAD}")"

if [[ "$backend_changed" != "1" ]]; then
  echo "[deploy-backend] Skip — tidak ada perubahan backend."
  exit 0
fi

if [[ -z "${RENDER_DEPLOY_HOOK_URL:-}" ]]; then
  echo "[deploy-backend] ERROR: set RENDER_DEPLOY_HOOK_URL (Deploy hook dari Render dashboard)." >&2
  exit 1
fi

echo "[deploy-backend] Perubahan backend terdeteksi. Trigger Render..."
curl -sS -X POST "$RENDER_DEPLOY_HOOK_URL"
echo ""
echo "[deploy-backend] Deploy Render triggered."
