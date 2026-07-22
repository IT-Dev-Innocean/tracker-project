#!/usr/bin/env bash
# Jalankan FastAPI backend dari folder backend/ (setelah refactor monorepo)
set -euo pipefail
cd "$(dirname "$0")/backend"
exec uvicorn backend_api:app --reload --host 0.0.0.0 --port "${PORT:-8000}" "$@"
