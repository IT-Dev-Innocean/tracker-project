#!/usr/bin/env bash
# Jalankan FastAPI backend dari folder backend/ (setelah refactor monorepo)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/backend"

if [[ -f "$ROOT/.venv/bin/activate" ]]; then
  # shellcheck disable=SC1091
  source "$ROOT/.venv/bin/activate"
elif [[ -f "$ROOT/backend/.venv/bin/activate" ]]; then
  # shellcheck disable=SC1091
  source "$ROOT/backend/.venv/bin/activate"
fi

exec uvicorn backend_api:app --reload --host 0.0.0.0 --port "${PORT:-8000}" "$@"
