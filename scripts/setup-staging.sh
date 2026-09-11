#!/usr/bin/env bash
# Checklist setup staging. Staging memakai DATABASE_URL yang sama dengan production.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Staging setup helper ==="
echo
echo "1) Neon — SKIP (pakai DATABASE_URL production yang sama, pooled -pooler)"
echo "   Jangan jalankan create-neon-staging-branch.py."
echo
echo "2) Render: buat service innocean-tracker-staging dari render.yaml"
echo "   - Branch: staging"
echo "   - DATABASE_URL = sama dengan production (pooled)"
echo "   - SECRET_KEY = generate baru (jangan copy production)"
echo "   - FRONTEND_URL = https://<project>.vercel.app (setelah Vercel live)"
echo
echo "3) Vercel: import repo, Root Directory = frontend-app"
echo "   - Production Branch: staging"
echo "   - ignoreCommand sudah di frontend-app/vercel.json (hanya staging yang build)"
echo "   - VITE_API_BASE_URL = https://innocean-tracker-staging.onrender.com"
echo "   - VITE_GOOGLE_CLIENT_ID = (opsional)"
echo
echo "4) Google Cloud Console → OAuth client → Authorized JavaScript origins"
echo "   tambahkan URL Vercel staging"
echo
echo "5) Alur kerja"
echo "   push staging → Vercel + Render staging"
echo "   push main    → Netlify + Render production (saat credit Netlify tersedia)"
echo

if command -v python3 >/dev/null 2>&1; then
  echo "SECRET_KEY baru untuk Render staging:"
  python3 -c "import secrets; print(secrets.token_hex(32))"
fi
