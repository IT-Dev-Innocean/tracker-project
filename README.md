# INNOCEAN Tracker

Aplikasi internal project tracker (Kanban, timesheet, chat, AI assistant) dengan:

| Layer | Stack | Hosting |
|-------|--------|---------|
| Backend | FastAPI + Uvicorn | [Render](https://render.com) |
| Frontend | React + Vite | [Netlify](https://netlify.com) |
| Database | PostgreSQL | [Neon](https://neon.tech) |

```
tracker-project/
├── backend/                # Python FastAPI backend
│   ├── backend_api.py      # Entry point FastAPI
│   ├── database.py         # SQLAlchemy models + koneksi DB
│   ├── dependencies.py     # JWT auth
│   ├── routers/            # Auth, boards, tasks, AI, timesheets, dll.
│   ├── services/           # Email service
│   ├── alembic/            # Database migrations
│   ├── tests/              # Pytest
│   └── requirements.txt
├── Procfile                # Start command Render
├── netlify.toml            # Build & redirect Netlify
└── frontend-app/           # React (Vite) frontend
```

---

## Prasyarat

- **Python** 3.10+ (disarankan 3.11/3.12)
- **Node.js** 18+ (disarankan 20 LTS)
- Akun [Neon](https://neon.tech), [Render](https://render.com), [Netlify](https://netlify.com)
- Git + repo ini sudah di-push ke GitHub/GitLab

---

## 1. Database Neon

1. Buat project di [console.neon.tech](https://console.neon.tech).
2. Salin **Connection string** (pilih URI / pooled connection).
3. Pastikan formatnya `postgresql://...` (bukan `postgres://`).
4. Sertakan `?sslmode=require` di akhir URL jika belum ada.

Contoh:

```text
postgresql://USER:PASSWORD@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

> **Tips:** Untuk Render, gunakan **pooled** connection string dari Neon (port `-pooler`) agar lebih tahan terhadap idle disconnect. Kode sudah memakai `pool_pre_ping` dan `pool_recycle=300`.

---

## 2. Setup lokal (localhost)

### 2.1 Backend

```bash
cd tracker-project/backend

# Virtual environment (bisa di root repo atau di backend/)
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

pip install -r requirements.txt

# Salin dan isi environment
cp .env.example .env
# Atau letakkan .env di root repo (tracker-project/.env) — keduanya didukung
```

Isi minimal di `.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
SECRET_KEY=ganti-dengan-secret-acak
FRONTEND_URL=http://localhost:5173
```

Generate `SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Jalankan migrasi (opsional tapi disarankan), lalu start API:

```bash
# Migrasi skema
cd backend && alembic upgrade head && cd ..

# Dari root repo — gunakan helper script (disarankan)
./run-backend.sh

# Atau manual dari folder backend/
cd backend
uvicorn backend_api:app --reload --host 0.0.0.0 --port 8000
```

> **Penting:** Jangan jalankan `uvicorn backend_api:app` dari root repo — modul sudah pindah ke folder `backend/`.

Saat pertama kali jalan, `setup_db()` akan:

- membuat tabel jika belum ada
- membuat user default **`admin` / `admin123`** (superadmin) bila belum ada

Cek kesehatan API: [http://localhost:8000](http://localhost:8000)  
Docs interaktif: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2.2 Frontend

```bash
cd frontend-app
cp .env.example .env
npm install
npm run dev
```

Buka [http://localhost:5173](http://localhost:5173).

Di lokal, API otomatis mengarah ke `http://localhost:8000` (lihat `frontend-app/src/api/axiosSetup.js`).

Opsional di `frontend-app/.env`:

```env
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
# VITE_API_BASE_URL=http://localhost:8000   # hanya jika perlu override
```

### 2.3 Variabel environment (ringkas)

| Variabel | Dimana | Wajib | Keterangan |
|----------|--------|-------|------------|
| `DATABASE_URL` | Backend | Ya | Connection string Neon/Postgres |
| `SECRET_KEY` | Backend | Ya | Signing JWT |
| `FRONTEND_URL` | Backend | Ya (prod) | Origin frontend untuk CORS & link email |
| `GEMINI_API_KEY` | Backend | Tidak | Fitur AI (Gemini) |
| `GROQ_API_KEY` | Backend | Tidak | Fitur AI (Groq) |
| `SMTP_*` | Backend | Tidak | Email verifikasi / notifikasi |
| `VITE_API_BASE_URL` | Frontend | Ya (prod) | URL backend Render |
| `VITE_GOOGLE_CLIENT_ID` | Frontend | Tidak | Login Google |

---

## 3. Deploy database (Neon)

Neon sudah siap dipakai setelah connection string didapat (langkah 1). Tidak perlu deploy terpisah.

Setelah backend pertama kali connect (atau setelah `alembic upgrade head`), skema siap digunakan.

---

## 4. Deploy backend (Render)

1. Push repo ke GitHub.
2. Di Render → **New → Web Service** → hubungkan repo.
3. Pengaturan build/start:

| Setting | Value |
|---------|--------|
| **Root Directory** | *(kosong / root repo)* |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r backend/requirements.txt` |
| **Start Command** | `cd backend && uvicorn backend_api:app --host 0.0.0.0 --port $PORT` |

   Atau biarkan memakai `Procfile` yang sudah ada:

   ```text
   web: cd backend && uvicorn backend_api:app --host 0.0.0.0 --port $PORT
   ```

4. Tambahkan **Environment Variables** di Render:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Connection string Neon (`postgresql://...?...sslmode=require`) |
| `SECRET_KEY` | Secret kuat (sama seperti lokal / generate baru) |
| `FRONTEND_URL` | URL Netlify nanti, mis. `https://your-app.netlify.app` |
| `GEMINI_API_KEY` | *(opsional)* |
| `GROQ_API_KEY` | *(opsional)* |
| `SMTP_SERVER` | *(opsional)* `smtp.gmail.com` |
| `SMTP_PORT` | *(opsional)* `587` |
| `SMTP_USERNAME` | *(opsional)* |
| `SMTP_PASSWORD` | *(opsional)* App Password |

5. Deploy → catat URL backend, contoh:  
   `https://innocean-tracker.onrender.com`

6. (Disarankan) Jalankan migrasi sekali dari mesin lokal dengan `DATABASE_URL` Neon yang sama:

   ```bash
   cd backend && alembic upgrade head
   ```

   Atau tambahkan di Build Command Render:

   ```bash
   pip install -r backend/requirements.txt && cd backend && alembic upgrade head
   ```

> **Catatan free tier Render:** service bisa sleep setelah idle. Request pertama setelah sleep bisa lambat (~30–60 detik).

---

## 5. Deploy frontend (Netlify)

File `netlify.toml` di root sudah mengatur:

- build dari folder `frontend-app`
- publish `dist`
- SPA redirect ke `index.html`

### Via UI Netlify

1. **Add new site → Import an existing project** → pilih repo.
2. Netlify akan membaca `netlify.toml`. Pastikan:

| Setting | Value |
|---------|--------|
| **Base directory** | `frontend-app` *(dari netlify.toml)* |
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |

3. **Site configuration → Environment variables** — tambahkan:

| Key | Value |
|-----|--------|
| `VITE_API_BASE_URL` | `https://your-backend.onrender.com` *(tanpa slash di akhir)* |
| `VITE_GOOGLE_CLIENT_ID` | *(opsional)* Google OAuth Client ID |

4. Deploy site → catat URL, contoh: `https://your-app.netlify.app`

### Via Netlify CLI (opsional)

```bash
npm install -g netlify-cli
cd tracker-project
netlify login
netlify init
# Set env di dashboard atau:
netlify env:set VITE_API_BASE_URL https://your-backend.onrender.com
netlify deploy --prod
```

### Setelah frontend live

Kembali ke **Render** dan update:

```env
FRONTEND_URL=https://your-app.netlify.app
```

Lalu redeploy backend agar CORS mengizinkan domain Netlify.

---

## 6. Checklist pasca-deploy

1. Buka URL Netlify → halaman landing muncul.
2. Buka `{BACKEND_URL}/` → JSON `status: online`.
3. Register / login (email domain `@innocean.co.id` atau `@innocean.com`).
4. Atau login admin default: `admin` / `admin123` — **ganti password segera**.
5. Pastikan board/task bisa dibuat (koneksi DB OK).
6. Jika Google login dipakai: di Google Cloud Console, tambahkan Authorized JavaScript origins = URL Netlify.

---

## 7. Troubleshooting

| Gejala | Penyebab umum | Solusi |
|--------|---------------|--------|
| Backend crash saat start | `DATABASE_URL` / `SECRET_KEY` kosong | Isi env di Render |
| `dialect does not support ... postgres://` | URL Neon pakai skema lama | Ganti prefix jadi `postgresql://` |
| CORS error di browser | `FRONTEND_URL` tidak cocok | Samakan dengan URL Netlify (tanpa trailing slash) |
| Frontend memanggil localhost di prod | `VITE_API_BASE_URL` belum di-set | Set di Netlify env lalu **Clear cache and deploy** |
| DB connection reset | Neon idle / pool | Pakai pooled URL + pastikan `sslmode=require` |
| Email verifikasi tidak terkirim | SMTP belum dikonfigurasi | Isi `SMTP_*` atau verifikasi manual via admin |
| Render 502 / lambat pertama kali | Cold start free tier | Tunggu & refresh; pertimbangkan keep-alive |

---

## 8. Perintah berguna

```bash
# Backend lokal (dari root repo)
./run-backend.sh

# Atau manual
cd backend && uvicorn backend_api:app --reload --port 8000

# Frontend lokal
cd frontend-app && npm run dev

# Migrasi
cd backend
alembic upgrade head
alembic revision --autogenerate -m "deskripsi"
alembic current

# Build frontend (uji sebelum deploy)
cd frontend-app && npm run build && npm run preview
```

---

## 9. Keamanan singkat

- Jangan commit file `.env`.
- Ganti password `admin` / `admin123` di production.
- Pakai `SECRET_KEY` yang berbeda antara lokal dan production.
- Batasi CORS hanya ke domain Netlify via `FRONTEND_URL`.
- Registrasi dibatasi ke email `@innocean.co.id` dan `@innocean.com`.

---

## Lisensi / penggunaan

Internal tools — penggunaan sesuai kebijakan organisasi.
