#!/usr/bin/env bash
# Trigger deploy Netlify hanya jika ada perubahan di frontend-app/ atau netlify.toml
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

read -r frontend_changed backend_changed <<< "$(bash scripts/detect-changes.sh "${1:-}" "${2:-HEAD}")"

if [[ "$frontend_changed" != "1" ]]; then
  echo "[deploy-frontend] Skip — tidak ada perubahan frontend."
  exit 0
fi

if [[ -z "${NETLIFY_BUILD_HOOK_URL:-}" ]]; then
  echo "[deploy-frontend] ERROR: set NETLIFY_BUILD_HOOK_URL (Deploy hook dari Netlify dashboard)." >&2
  exit 1
fi

echo "[deploy-frontend] Perubahan frontend terdeteksi. Trigger Netlify..."
curl -sS -X POST -d {} "$NETLIFY_BUILD_HOOK_URL"
echo ""
echo "[deploy-frontend] Deploy Netlify triggered."
