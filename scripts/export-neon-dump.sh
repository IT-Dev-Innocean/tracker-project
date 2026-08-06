#!/usr/bin/env bash
# Wrapper bash untuk export Neon → SQL (DBeaver-ready)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/.venv/bin/activate" ]]; then
  # shellcheck disable=SC1091
  source "$ROOT/.venv/bin/activate"
fi

exec python "$ROOT/scripts/export-neon-dump.py" "$@"
