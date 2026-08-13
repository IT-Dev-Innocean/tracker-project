#!/usr/bin/env python3
"""
Buat Neon branch `staging` (atau fallback DB `neondb_staging`) dan tulis
STAGING_DATABASE_URL ke .env (pooled, untuk Render staging).

Butuh di .env:
  NEON_API_KEY=...
  NEON_PROJECT_ID=...

Jalankan:
  python scripts/create-neon-staging-branch.py

Catatan Free plan:
  Jika data transfer quota habis, API mengembalikan HTTP 423.
  Tunggu reset billing / upgrade, lalu jalankan ulang script ini.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def upsert_env(path: Path, key: str, value: str, comment: str | None = None) -> None:
    lines = path.read_text().splitlines() if path.exists() else []
    out: list[str] = []
    found = False
    for line in lines:
        if line.startswith(f"{key}="):
            out.append(f"{key}={value}")
            found = True
        else:
            out.append(line)
    if not found:
        if comment:
            out.append("")
            out.append(f"# {comment}")
        out.append(f"{key}={value}")
    path.write_text("\n".join(out) + "\n")


def mask_uri(uri: str) -> str:
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", uri)


def main() -> int:
    try:
        from dotenv import load_dotenv  # optional

        load_dotenv(ROOT / ".env", override=False)
    except ImportError:
        pass

    env = load_env(ROOT / ".env")
    api_key = (env.get("NEON_API_KEY") or "").strip()
    project_id = (env.get("NEON_PROJECT_ID") or "").strip()
    if not api_key or not project_id:
        print(
            "NEON_API_KEY dan NEON_PROJECT_ID wajib di .env.\n"
            "  Console → Account → API keys\n"
            "  Project → Settings → Project ID"
        )
        return 1

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    def req(method: str, path: str, body: dict | None = None):
        data = None if body is None else json.dumps(body).encode()
        request = urllib.request.Request(
            f"https://console.neon.tech/api/v2{path}",
            data=data,
            headers=headers,
            method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=60) as resp:
                return resp.status, json.loads(resp.read().decode())
        except urllib.error.HTTPError as exc:
            return exc.code, exc.read().decode()

    status, payload = req("GET", f"/projects/{project_id}/branches")
    if status != 200:
        print(f"Gagal list branches ({status}): {str(payload)[:400]}")
        return 1

    branches = payload.get("branches", [])
    default = next((b for b in branches if b.get("default")), branches[0])
    staging = next((b for b in branches if b.get("name") == "staging"), None)

    mode = "branch"
    branch_id: str
    db_name = "neondb"

    if staging:
        branch_id = staging["id"]
        print(f"Branch staging sudah ada: {branch_id}")
    else:
        print(f"Membuat branch staging dari {default.get('name')} ({default.get('id')})...")
        status, created = req(
            "POST",
            f"/projects/{project_id}/branches",
            {
                "branch": {"name": "staging", "parent_id": default["id"]},
                "endpoints": [{"type": "read_write"}],
            },
        )
        if status in (200, 201):
            branch_id = created["branch"]["id"]
            print(f"Branch staging dibuat: {branch_id}")
        elif status == 423 or "quota exceeded" in str(created).lower():
            print(
                "Neon transfer/compute quota habis — tidak bisa membuat branch.\n"
                "Fallback: coba buat database kosong neondb_staging di branch production..."
            )
            branch_id = default["id"]
            mode = "database"
            status, roles = req("GET", f"/projects/{project_id}/branches/{branch_id}/roles")
            if status != 200:
                print(f"Gagal list roles ({status}): {str(roles)[:400]}")
                return 1
            role_names = [r.get("name") for r in roles.get("roles", [])]
            owner = "neondb_owner" if "neondb_owner" in role_names else role_names[0]
            status, dbs = req("GET", f"/projects/{project_id}/branches/{branch_id}/databases")
            if status != 200:
                print(f"Gagal list databases ({status}): {str(dbs)[:400]}")
                return 1
            existing = [d.get("name") for d in dbs.get("databases", [])]
            db_name = "neondb_staging"
            if db_name not in existing:
                status, created_db = req(
                    "POST",
                    f"/projects/{project_id}/branches/{branch_id}/databases",
                    {"database": {"name": db_name, "owner_name": owner}},
                )
                if status not in (200, 201):
                    print(
                        f"Fallback DB juga gagal ({status}): {str(created_db)[:400]}\n"
                        "Tunggu reset quota Neon, lalu jalankan ulang script ini."
                    )
                    return 1
                print(f"Database {db_name} dibuat di branch {default.get('name')}.")
            else:
                print(f"Database {db_name} sudah ada.")
        else:
            print(f"Gagal create branch ({status}): {str(created)[:400]}")
            return 1

    status, roles = req("GET", f"/projects/{project_id}/branches/{branch_id}/roles")
    if status != 200:
        print(f"Gagal list roles ({status}): {str(roles)[:400]}")
        return 1
    role_names = [r.get("name") for r in roles.get("roles", [])]
    role_name = "neondb_owner" if "neondb_owner" in role_names else role_names[0]

    if mode == "branch":
        status, dbs = req("GET", f"/projects/{project_id}/branches/{branch_id}/databases")
        if status == 200:
            names = [d.get("name") for d in dbs.get("databases", [])]
            if "neondb" in names:
                db_name = "neondb"
            elif names:
                db_name = names[0]

    qs = urllib.parse.urlencode(
        {
            "branch_id": branch_id,
            "database_name": db_name,
            "role_name": role_name,
            "pooled": "true",
        }
    )
    status, uri_payload = req("GET", f"/projects/{project_id}/connection_uri?{qs}")
    if status != 200:
        print(f"Gagal ambil connection URI ({status}): {str(uri_payload)[:400]}")
        return 1

    uri = uri_payload.get("uri") or ""
    if not uri:
        print("connection_uri kosong.")
        return 1

    comment = (
        "Neon staging branch (pooled) — tempel ke Render service staging sebagai DATABASE_URL"
        if mode == "branch"
        else "Neon neondb_staging (pooled, fallback tanpa branch) — jalankan alembic upgrade di staging"
    )
    upsert_env(ROOT / ".env", "STAGING_DATABASE_URL", uri, comment=comment)
    print(f"STAGING_DATABASE_URL ditulis ke .env")
    print(f"Masked: {mask_uri(uri)}")
    print(f"Mode: {mode} | db={db_name} | branch_id={branch_id}")
    if mode == "database":
        print(
            "Setelah Render staging live, jalankan migrasi:\n"
            "  DATABASE_URL=\"$STAGING_DATABASE_URL\" alembic upgrade head"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
