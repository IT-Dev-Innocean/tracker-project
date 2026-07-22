import pytest
from fastapi.testclient import TestClient
import sys
import os

# Menambahkan root direktori ke system path agar file pengujian bisa membaca backend_api.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend_api import app

client = TestClient(app)


def test_cors_policy_misconfiguration():
    """AUDIT: Memastikan CORS mencegah domain asing membajak sesi (CSWSH/CSRF)"""
    response = client.options(
        "/api/login",
        headers={
            "Origin": "http://evil-hacker-domain.com",
            "Access-Control-Request-Method": "POST",
        },
    )
    # Header tidak boleh mengizinkan domain jahat
    assert "evil-hacker-domain.com" not in response.headers.get(
        "access-control-allow-origin", ""
    ), "Celah: CORS Policy terlalu terbuka!"


def test_xss_in_registration_username():
    """AUDIT: Memastikan registrasi menolak injeksi script HTML pada username (Stored XSS)"""
    payload = {
        "full_name": "Hacker",
        "email": "hacker@innocean.co.id",
        "username": "<script>alert('XSS')</script>",
        "password": "ValidPassword123!",
    }
    response = client.post("/api/register", json=payload)
    # Harusnya ditolak (400) oleh validasi regex yang kita buat, jika lolos (200) berarti rentan!
    assert (
        response.status_code == 400
    ), "Celah: Username rentan terhadap serangan XSS/HTML Injection!"


def test_brute_force_login_protection():
    """AUDIT: Memastikan sistem mengunci akun setelah 5 percobaan gagal (Brute-Force & Credential Stuffing)"""
    # Lakukan 5x percobaan gagal
    for _ in range(5):
        client.post(
            "/api/login", json={"username": "admin", "password": "wrongpassword"}
        )

    # Percobaan ke-6 harusnya menghasilkan 429 (Too Many Requests), bukan 401 (Unauthorized)
    response = client.post(
        "/api/login", json={"username": "admin", "password": "wrongpassword"}
    )
    assert (
        response.status_code == 429
    ), "Celah: Rate Limiter pada Login tidak berfungsi. Rentan di-bruteforce!"


def test_email_bombing_protection():
    """AUDIT: Memastikan endpoint Lupa Sandi memiliki cooldown/jeda (Mencegah Spam / DoS)"""
    payload = {"email": "admin@innocean.co.id", "origin": "http://localhost"}

    # Tembak API 2 kali berturut-turut tanpa jeda
    client.post("/api/forgot-password", json=payload)
    response = client.post("/api/forgot-password", json=payload)

    assert (
        response.status_code == 429
    ), "Celah: Endpoint Lupa Sandi dapat dieksploitasi untuk Email Bombing!"


def test_idor_board_settings_protection():
    """AUDIT: Memastikan celah IDOR (Insecure Direct Object Reference) pada pengaturan Board aman"""
    from backend_api import get_current_user

    # Bypass autentikasi: Mensimulasikan login secara paksa sebagai 'attacker_user'
    app.dependency_overrides[get_current_user] = lambda: "attacker_user"

    # Attacker mencoba mengubah pengaturan proyek dengan ID 1 (yang diasumsikan milik orang lain)
    response = client.put(
        "/api/boards/1/settings",
        json={"statuses": '["Hacked"]', "categories": '["Hacked"]'},
    )

    # Harus menghasilkan 403 Forbidden (Atau 404 Not Found). Tidak boleh 200 OK!
    assert response.status_code in [
        403,
        404,
    ], "Celah: IDOR terdeteksi! Pengguna biasa bisa mengubah pengaturan proyek orang lain!"

    # Bersihkan override agar tidak mengganggu test lain di masa depan
    app.dependency_overrides.clear()


def test_data_leakage_user_directory():
    """AUDIT: Memastikan endpoint direktori tidak membocorkan email ke pengguna biasa (Information Disclosure)"""
    from backend_api import get_current_user

    # Mensimulasikan akses oleh pengguna non-admin (karyawan biasa)
    app.dependency_overrides[get_current_user] = lambda: "normal_user"

    response = client.get("/api/users/avatars")
    assert response.status_code == 200

    data = response.json()
    for user in data.get("directory", []):
        assert (
            user.get("email") == "Email hidden for privacy"
        ), "Celah: Email pengguna bocor ke pengguna non-admin!"

    app.dependency_overrides.clear()


def test_dos_long_input_protection():
    """AUDIT: Memastikan sistem menolak payload teks berlebih untuk mencegah DoS / Database Bloat"""
    from backend_api import get_current_user

    app.dependency_overrides[get_current_user] = lambda: "attacker_user"

    # Mencoba mengirim komentar sepanjang 4000 karakter (batas aman kita: 3000 karakter)
    huge_payload = {"text": "A" * 4000}

    response = client.post("/api/tasks/1/comments", json=huge_payload)
    assert (
        response.status_code == 400
    ), "Celah: API rentan terhadap Denial of Service via payload besar!"

    app.dependency_overrides.clear()


def test_privilege_escalation_admin_panel():
    """AUDIT: Memastikan pengguna biasa tidak bisa mengakses panel Super Admin (BFLA/Privilege Escalation)"""
    from backend_api import get_current_user

    # Mensimulasikan akses oleh pengguna non-admin (karyawan biasa)
    app.dependency_overrides[get_current_user] = lambda: "normal_user"

    response = client.get("/api/admin/users")
    assert (
        response.status_code == 403
    ), "Celah: Peningkatan Hak Akses! Pengguna biasa bisa mengakses data Admin!"

    app.dependency_overrides.clear()


def test_bola_task_deletion():
    """AUDIT: Memastikan pengguna tidak bisa menghapus tugas di proyek orang lain (BOLA/IDOR)"""
    from backend_api import get_current_user

    # Mensimulasikan login secara paksa sebagai 'attacker_user'
    app.dependency_overrides[get_current_user] = lambda: "attacker_user"

    # Attacker mencoba menghapus Task ID 1 (yang diasumsikan milik orang lain/admin)
    response = client.delete("/api/tasks/1")

    # Harus ditolak dengan 403 Forbidden atau 404 Not Found
    assert response.status_code in [
        403,
        404,
    ], "Celah: BOLA terdeteksi! Pengguna bisa menghapus task orang lain!"

    app.dependency_overrides.clear()


def test_ai_quota_exhaustion_protection():
    """AUDIT: Memastikan endpoint AI memiliki Rate Limiter (Kelelahan Kuota)"""
    from backend_api import get_current_user
    from database import SessionLocal, set_security_log
    import time

    app.dependency_overrides[get_current_user] = lambda: "attacker_user"

    # Manipulasi memori log secara manual di database agar kita tidak perlu menunggu respon jaringan AI asli
    db = SessionLocal()
    set_security_log(db, "ai_generate:attacker_user", time.time())
    db.close()

    payload = {"prompt": "test prompt", "provider": "gemini"}

    # Permintaan simulasi langsung (Harusnya langsung ditolak oleh Rate Limiter)
    response = client.post("/api/ai/generate", json=payload)

    assert (
        response.status_code == 429
    ), "Celah: AI Endpoint tidak memiliki Rate Limiter! Rentan kehabisan kuota!"

    app.dependency_overrides.clear()


def test_database_bloat_avatar_protection():
    """AUDIT: Memastikan sistem menolak Base64 Avatar yang melebihi batas 2MB (Database Bloat)"""
    from backend_api import get_current_user

    app.dependency_overrides[get_current_user] = lambda: "attacker_user"

    # Buat string avatar fiktif sebesar ~2.5MB
    huge_avatar = "data:image/png;base64," + ("A" * 2500000)
    payload = {
        "full_name": "Attacker",
        "email": "attacker@innocean.co.id",
        "avatar": huge_avatar,
    }

    response = client.put("/api/profile", json=payload)
    assert (
        response.status_code == 400
    ), "Celah: API menerima payload avatar raksasa (Rentan terhadap Database Bloat)!"

    app.dependency_overrides.clear()


def test_dos_task_creation_protection():
    """AUDIT: Memastikan sistem menolak pembuatan task dengan deskripsi raksasa (Database Bloat)"""
    from backend_api import get_current_user

    app.dependency_overrides[get_current_user] = lambda: "attacker_user"

    # Payload dengan deskripsi teks raksasa (25.000 karakter)
    huge_payload = {
        "project_name": "Normal Title",
        "requester": "attacker_user",
        "category": "Development",
        "description": "A" * 25000,
        "supporting_access": "",
        "start_date": "2024-01-01",
        "deadline": "2024-12-31",
        "subtasks": [],
    }

    response = client.post("/api/boards/1/tasks", json=huge_payload)
    assert (
        response.status_code == 400
    ), "Celah: API menerima payload deskripsi tugas raksasa (Rentan DoS)!"

    app.dependency_overrides.clear()


def test_system_feedback_comment_access():
    """AUDIT: Memastikan pembuat tiket feedback sistem bisa berkomentar di tiketnya, tetapi user lain tidak"""
    from backend_api import get_current_user
    from database import SessionLocal, Request

    # 1. Buat feedback sebagai "ticket_owner"
    app.dependency_overrides[get_current_user] = lambda: "ticket_owner"
    response = client.post("/api/feedback", json={"text": "This is a system ticket request from owner"})
    assert response.status_code == 200

    # 2. Cari task ID dari database
    db = SessionLocal()
    task = db.query(Request).filter(Request.requester == "ticket_owner").order_by(Request.id.desc()).first()
    db.close()

    assert task is not None, "Task feedback tidak tersimpan di database"
    task_id = task.id

    try:
        # 3. ticket_owner mencoba memberikan komentar di tiket miliknya sendiri (harus berhasil 200 OK)
        response = client.post(f"/api/tasks/{task_id}/comments", json={"text": "Owner reply"})
        assert response.status_code == 200

        # 4. User lain ("other_user") mencoba memberikan komentar (harus ditolak 403)
        app.dependency_overrides[get_current_user] = lambda: "other_user"
        response = client.post(f"/api/tasks/{task_id}/comments", json={"text": "Unauthorized comment"})
        assert response.status_code == 403
    finally:
        # 5. Clean up database task
        db = SessionLocal()
        from database import Comment
        db.query(Comment).filter(Comment.request_id == task_id).delete()
        db.query(Request).filter(Request.id == task_id).delete()
        db.commit()
        db.close()
        app.dependency_overrides.clear()

