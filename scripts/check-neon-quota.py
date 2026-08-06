#!/usr/bin/env python3
"""
Cek usage & tanggal reset quota Neon (Free plan).
Butuh di .env:
  NEON_API_KEY=...        # Console → Account → API keys
  NEON_PROJECT_ID=...     # Console → Project → Settings → Project ID

Jalankan:
  python scripts/check-neon-quota.py
"""
from __future__ import annotations

import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent

# Limit Free plan (per project, per billing period)
FREE_LIMITS = {
    "data_transfer_gb": 5.0,
    "compute_cu_hours": 100.0,
    "storage_gb": 0.5,
}


def parse_iso(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def add_one_month(dt: datetime) -> datetime:
    """Perkiraan awal billing period berikutnya."""
    month = dt.month + 1
    year = dt.year
    if month > 12:
        month = 1
        year += 1
    # Clamp hari (Feb 31 → Feb 28/29)
    import calendar

    max_day = calendar.monthrange(year, month)[1]
    day = min(dt.day, max_day)
    return dt.replace(year=year, month=month, day=day)


def main() -> int:
    load_dotenv(ROOT / ".env", override=False)

    api_key = (os.getenv("NEON_API_KEY") or "").strip()
    project_id = (os.getenv("NEON_PROJECT_ID") or "").strip()

    if not api_key or not project_id:
        print(
            "NEON_API_KEY dan NEON_PROJECT_ID belum di-set di .env.\n\n"
            "Cara dapatkan:\n"
            "  1. Login https://console.neon.tech\n"
            "  2. Account → API keys → Create\n"
            "  3. Project → Settings → Project ID\n\n"
            "Tambahkan ke .env:\n"
            '  NEON_API_KEY="neon_api_..."\n'
            '  NEON_PROJECT_ID="..."\n'
        )
        print("--- Tanpa API, cek manual di Console ---")
        print("  Organization → Billing  (tanggal billing period)")
        print("  Projects → [project Anda] → Usage panel")
        print("  Lihat: Public network transfer & Compute CU-hours")
        return 1

    url = f"https://console.neon.tech/api/v2/projects/{project_id}"
    resp = requests.get(url, headers={"Authorization": f"Bearer {api_key}"}, timeout=30)

    if resp.status_code == 401:
        print("NEON_API_KEY tidak valid atau expired.")
        return 1
    if resp.status_code == 404:
        print("NEON_PROJECT_ID tidak ditemukan.")
        return 1
    if not resp.ok:
        print(f"Neon API error {resp.status_code}: {resp.text[:300]}")
        return 1

    project = resp.json().get("project", resp.json())
    period_start_raw = project.get("consumption_period_start")
    transfer_bytes = int(project.get("data_transfer_bytes") or 0)
    compute_seconds = int(project.get("compute_time_seconds") or 0)
    storage_byte_hours = int(project.get("data_storage_bytes_hour") or 0)

    transfer_gb = transfer_bytes / 1_000_000_000
    compute_cu_hours = compute_seconds / 3600

    print("=== Neon Quota (periode billing saat ini) ===\n")

    if period_start_raw:
        period_start = parse_iso(period_start_raw)
        next_reset = add_one_month(period_start)
        now = datetime.now(period_start.tzinfo)
        days_left = max(0, (next_reset - now).days)

        print(f"Billing period mulai : {period_start.strftime('%Y-%m-%d %H:%M %Z')}")
        print(f"Perkiraan reset quota : {next_reset.strftime('%Y-%m-%d %H:%M %Z')} (~{days_left} hari lagi)")
        print("(Tanggal pasti: lihat Organization → Billing di Neon Console)\n")
    else:
        print("consumption_period_start tidak tersedia — cek di Console → Billing\n")

    transfer_pct = min(100, transfer_gb / FREE_LIMITS["data_transfer_gb"] * 100)
    compute_pct = min(100, compute_cu_hours / FREE_LIMITS["compute_cu_hours"] * 100)

    print("Public network transfer (data egress):")
    print(f"  Terpakai : {transfer_gb:.2f} GB / {FREE_LIMITS['data_transfer_gb']:.0f} GB ({transfer_pct:.0f}%)")
    if transfer_gb >= FREE_LIMITS["data_transfer_gb"]:
        print("  Status   : HABIS — compute suspended sampai reset atau upgrade")

    print("\nCompute (CU-hours):")
    print(f"  Terpakai : {compute_cu_hours:.1f} / {FREE_LIMITS['compute_cu_hours']:.0f} CU-h ({compute_pct:.0f}%)")

    print("\nStorage (byte-hours, perkiraan):")
    print(f"  Raw      : {storage_byte_hours:,} byte-hours (limit Free: 0.5 GB total logical size)")

    print("\n--- Catatan ---")
    print("- Quota transfer & compute RESET setiap awal billing period (bulanan).")
    print("- DATA di database TIDAK dihapus saat reset — hanya counter usage yang nol lagi.")
    print("- Setelah reset, koneksi & pg_dump bisa dipakai lagi (jika tidak kena limit lain).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
