#!/usr/bin/env bash
# Deteksi perubahan frontend vs backend antara dua commit/ref Git.
# Output: "<frontend_changed> <backend_changed>" (1 = ya, 0 = tidak)
set -euo pipefail

BASE="${1:-}"
HEAD="${2:-HEAD}"

if [[ -z "$BASE" ]]; then
  if git rev-parse HEAD~1 >/dev/null 2>&1; then
    BASE="HEAD~1"
  else
    # Commit pertama / shallow clone — anggap keduanya berubah
    echo "1 1"
    exit 0
  fi
fi

FRONTEND_PATHS=(
  frontend-app
  netlify.toml
)

BACKEND_PATHS=(
  backend
  Procfile
  requirements.txt
  runtime.txt
  render.yaml
  run-backend.sh
)

frontend_changed=0
backend_changed=0

if git diff --name-only "$BASE" "$HEAD" -- "${FRONTEND_PATHS[@]}" | grep -q .; then
  frontend_changed=1
fi

if git diff --name-only "$BASE" "$HEAD" -- "${BACKEND_PATHS[@]}" | grep -q .; then
  backend_changed=1
fi

echo "$frontend_changed $backend_changed"
