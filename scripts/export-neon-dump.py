#!/usr/bin/env python3
"""
Export database Neon PostgreSQL ke file .sql (pg_dump).
File hasil bisa di-import lewat DBeaver: Execute SQL Script.

Prasyarat:
  - pg_dump terpasang (brew install libpq)
  - Quota Neon masih aktif / koneksi Neon bisa dibuka
  - Set NEON_EXPORT_URL di .env (connection string Neon)

Contoh:
  cd tracker-project
  source .venv/bin/activate
  python scripts/export-neon-dump.py
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"


def get_neon_url() -> str | None:
    load_dotenv(ROOT / ".env", override=False)
    load_dotenv(BACKEND / ".env", override=True)

    for key in ("NEON_EXPORT_URL", "NEON_DATABASE_URL"):
        url = (os.getenv(key) or "").strip()
        if url.startswith(("postgresql://", "postgres://")):
            return url

    db_url = (os.getenv("DATABASE_URL") or "").strip()
    if db_url.startswith(("postgresql://", "postgres://")):
        return db_url

    return None


def main() -> int:
    url = get_neon_url()
    if not url:
        print(
            "NEON_EXPORT_URL tidak ditemukan.\n"
            "Tambahkan di .env (connection string Neon), contoh:\n"
            '  NEON_EXPORT_URL="postgresql://USER:PASS@HOST/neondb?sslmode=require"'
        )
        return 1

    pg_dump = shutil.which("pg_dump")
    if not pg_dump:
        print("pg_dump tidak ditemukan. Install: brew install libpq")
        return 1

    out_dir = ROOT / "backups"
    out_dir.mkdir(exist_ok=True)
    out_file = out_dir / f"neon_dump_{datetime.now():%Y%m%d_%H%M%S}.sql"

    cmd = [
        pg_dump,
        url,
        "--no-owner",
        "--no-acl",
        "--clean",
        "--if-exists",
        "--encoding=UTF8",
        "-f",
        str(out_file),
    ]

    print(f"Mengekspor ke: {out_file}")
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as exc:
        print(f"\nExport gagal (exit {exc.returncode}).")
        print(
            "Jika pesannya 'exceeded the data transfer quota', quota Neon masih habis.\n"
            "Opsi: upgrade plan Neon, tunggu reset quota bulanan, atau export dari Neon Console."
        )
        if out_file.exists() and out_file.stat().st_size == 0:
            out_file.unlink()
        return exc.returncode or 1

    size_mb = out_file.stat().st_size / (1024 * 1024)
    print(f"Selesai: {out_file} ({size_mb:.2f} MB)")
    print("\nImport di DBeaver:")
    print("  1. Buat database PostgreSQL baru (lokal / Neon baru)")
    print("  2. Klik kanan database → SQL Editor → Open SQL Script")
    print("  3. Pilih file dump ini → Execute (Ctrl+Enter)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
