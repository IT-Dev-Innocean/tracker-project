#!/usr/bin/env bash
# Deploy pintar monorepo: Netlify (frontend) dan/atau Render (backend) sesuai diff commit
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASE="${1:-}"
HEAD="${2:-HEAD}"

read -r frontend_changed backend_changed <<< "$(bash scripts/detect-changes.sh "$BASE" "$HEAD")"

echo "[deploy-smart] frontend_changed=$frontend_changed backend_changed=$backend_changed"

if [[ "$frontend_changed" == "0" && "$backend_changed" == "0" ]]; then
  echo "[deploy-smart] Tidak ada perubahan deployable. Selesai."
  exit 0
fi

if [[ "$frontend_changed" == "1" ]]; then
  bash scripts/deploy-frontend.sh "$BASE" "$HEAD"
else
  echo "[deploy-smart] Skip Netlify — tidak ada perubahan frontend."
fi

if [[ "$backend_changed" == "1" ]]; then
  bash scripts/deploy-backend.sh "$BASE" "$HEAD"
else
  echo "[deploy-smart] Skip Render — tidak ada perubahan backend."
fi

echo "[deploy-smart] Selesai."
