# INNOCEAN Tracker

Aplikasi internal project tracker (Kanban, timesheet, chat, AI assistant) dengan:

| Layer | Stack | Hosting (production) | Hosting (staging) |
|-------|--------|----------------------|-------------------|
| Backend | FastAPI + Uvicorn | [Render](https://render.com) `innocean-tracker` (`main`) | Render `innocean-tracker-staging` (`staging`) |
| Frontend | React + Vite | [Netlify](https://netlify.com) (`main`) | [Vercel](https://vercel.com) Hobby (`staging` only) |
| Database | PostgreSQL | [Neon](https://neon.tech) production | **Sama** dengan production (`DATABASE_URL` pooled) |

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
- Akun [Vercel](https://vercel.com) (staging frontend; Hobby hanya untuk preview sementara — ToS melarang commercial/internal jangka panjang)
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

### Neon untuk staging

Staging **tidak** memakai database terpisah. Render staging memakai `DATABASE_URL` yang sama dengan production (pooled, host `-pooler`).

Akibatnya: data login, board, dan timesheet di staging = data production. Jangan uji destructive (hapus board/user) di staging.

Opsional nanti: `python scripts/create-neon-staging-branch.py` jika ingin memisahkan DB.

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

   > **Catatan:** Root `requirements.txt` adalah shim (`-r backend/requirements.txt`) agar build lama Render tetap jalan. File `runtime.txt` pin Python 3.12.

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

## 5.1 Staging (Vercel + Render terpisah)

Jalur staging dipakai saat kuota **production deploy Netlify** habis, atau untuk uji UI/API tanpa menyentuh production.

| Branch | Frontend | Backend | Database |
|--------|----------|---------|----------|
| `main` | Netlify (production) | `innocean-tracker` | Neon `production` (pooled `DATABASE_URL`) |
| `staging` | Vercel (hanya branch ini) | `innocean-tracker-staging` | **Sama** — Neon `production` |

> **Lisensi Vercel Hobby:** hanya personal/non-commercial. Untuk tool internal Innocean jangka panjang, upgrade ke Vercel Pro. Setup di bawah untuk preview sementara.

### Ringkas

```bash
./scripts/setup-staging.sh
```

### A. Neon (poin 1) — selesai tanpa DB baru

Tidak perlu buat branch/database Neon. Di Render staging, isi `DATABASE_URL` dengan nilai **yang sama** seperti production (pooled `-pooler` di `.env` lokal).

Dashboard Neon cukup punya branch `production` (1/10). Script `create-neon-staging-branch.py` **jangan dijalankan** untuk setup ini.

### B. Render service staging

[`render.yaml`](render.yaml) mendefinisikan `innocean-tracker-staging` (branch `staging`, `buildFilter` backend-only). **Jangan** auto-`alembic` — DB shared dengan production.

Karena perubahan `render.yaml` mungkin belum di-push, buat service **manual** (bukan Blueprint):

1. Render → **New → Web Service** → repo `IT-Dev-Innocean/tracker-project`.
2. Settings:

| Setting | Value |
|---------|--------|
| **Name** | `innocean-tracker-staging` |
| **Branch** | `staging` |
| **Root Directory** | *(kosong)* |
| **Runtime** | Python 3 |
| **Instance type** | Free |
| **Build Command** | `pip install -r backend/requirements.txt` |
| **Start Command** | `cd backend && uvicorn backend_api:app --host 0.0.0.0 --port $PORT` |
| **Included Paths** | `backend/**`, `Procfile`, `requirements.txt`, `runtime.txt`, `render.yaml`, `run-backend.sh` |

3. Environment (staging). `DATABASE_URL` **sama** dengan production; `SECRET_KEY` **baru**; `FRONTEND_URL` sementara `http://localhost:5173` dulu (diganti URL Vercel di poin 3–4):

| Key | Value |
|-----|--------|
| `DATABASE_URL` | **Sama** dengan production (pooled Neon) |
| `SECRET_KEY` | Generate baru (`./scripts/setup-staging.sh`) — **jangan** copy production |
| `FRONTEND_URL` | URL Vercel staging, mis. `https://your-app.vercel.app` (isi setelah langkah C) |
| `GOOGLE_CLIENT_ID` / SMTP / AI keys | Sesuai kebutuhan staging |

4. Setelah deploy: buka `{STAGING_BACKEND_URL}/` → JSON online.

### C. Vercel frontend staging

[`frontend-app/vercel.json`](frontend-app/vercel.json) sudah berisi SPA rewrite + `ignoreCommand` agar **hanya** commit di branch `staging` yang di-build.

1. [vercel.com](https://vercel.com) → **Add New Project** → import repo GitHub.
2. Settings:

| Setting | Value |
|---------|--------|
| **Root Directory** | `frontend-app` |
| **Framework** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Production Branch** | `staging` |

3. Environment Variables (Production):

| Key | Value |
|-----|--------|
| `VITE_API_BASE_URL` | `https://innocean-tracker-staging.onrender.com` *(tanpa trailing slash)* |
| `VITE_GOOGLE_CLIENT_ID` | *(opsional)* |

4. Deploy → catat URL `https://….vercel.app`.
5. Kembali ke Render staging → set `FRONTEND_URL` ke URL itu → **Manual Deploy**.

### D. CORS & Google OAuth

- Backend staging membaca `FRONTEND_URL` (dan opsional `FRONTEND_URLS`) di `backend/backend_api.py`.
- Google Cloud Console → OAuth Client → **Authorized JavaScript origins**: tambahkan URL Vercel staging.
- Production Render **tidak** perlu origin Vercel selama staging memakai backend sendiri.

### E. Alur kerja harian

- Kerjakan / push ke **`staging`** → Vercel + Render staging auto-deploy (Git). Jangan tambah build hook Vercel di GitHub Actions (hindari double deploy).
- Workflow [`.github/workflows/deploy-smart.yml`](.github/workflows/deploy-smart.yml) tetap hanya `main` → Netlify + Render production.
- Setelah Netlify credit reset: merge `staging` → `main` untuk rilis production.
- Di Netlify, biarkan Production Branch = `main`. Branch deploy dari `staging` biasanya 0 credit; boleh dimatikan jika mengganggu.

### Checklist verifikasi staging

1. Push ke `staging` → Vercel build **jalan**; push ke `main` → Vercel **Skipped** (`ignoreCommand`).
2. Render staging health OK; **data = production** (shared DB — hati-hati uji hapus).
3. Buka URL Vercel → login/API tanpa CORS error.
4. Push frontend-only ke `staging` → Render staging **tidak** redeploy (`buildFilter`).

---

## 6. Smart Deploy (Monorepo)

Repo ini monorepo (`frontend-app/` + `backend/`). Deploy hanya di-trigger untuk bagian yang berubah.

### Path yang memicu deploy

| Target | Path yang dipantau |
|--------|-------------------|
| **Netlify** (frontend prod, `main`) | `frontend-app/**`, `netlify.toml` |
| **Vercel** (frontend staging, `staging`) | Root `frontend-app` + `ignoreCommand` hanya `staging` |
| **Render** (backend prod/staging) | `backend/**`, `Procfile`, `requirements.txt`, `runtime.txt`, `render.yaml`, `run-backend.sh` |

### Opsi A — Auto-deploy platform (disarankan)

**Netlify** — `netlify.toml` sudah berisi `ignore` build:

- Commit **hanya backend** → Netlify **skip** build (status: *Build skipped*)
- Commit **frontend** → Netlify build normal

**Render** — set **Included Paths** di Dashboard → Service → Settings → Build & Deploy:

```text
backend/**
Procfile
requirements.txt
runtime.txt
render.yaml
run-backend.sh
```

- Commit **hanya frontend** → Render **tidak** deploy
- Commit **backend** → Render deploy normal

### Opsi B — GitHub Actions + Deploy Hooks

Workflow: `.github/workflows/deploy-smart.yml`

1. Buat **Deploy Hook** di Netlify (Site settings → Build & deploy → Build hooks)
2. Buat **Deploy Hook** di Render (Service → Settings → Deploy Hook)
3. Tambahkan GitHub Secrets di repo:
   - `NETLIFY_BUILD_HOOK_URL`
   - `RENDER_DEPLOY_HOOK_URL`
4. (Opsional) Matikan auto-deploy Git di Netlify/Render agar hanya Actions yang trigger

Push ke `main` → Actions mendeteksi diff → trigger Netlify dan/atau Render sesuai folder yang berubah.

### Script lokal / manual

```bash
# Cek apa yang berubah (output: "frontend backend", 1=ya 0=tidak)
./scripts/detect-changes.sh HEAD~1 HEAD

# Deploy pintar (perlu env hook URL)
export NETLIFY_BUILD_HOOK_URL="https://api.netlify.com/build_hooks/..."
export RENDER_DEPLOY_HOOK_URL="https://api.render.com/deploy/srv-..."

./scripts/deploy-smart.sh          # keduanya sesuai diff
./scripts/deploy-frontend.sh       # Netlify saja (skip jika tidak ada perubahan frontend)
./scripts/deploy-backend.sh        # Render saja (skip jika tidak ada perubahan backend)
```

---

## 7. Checklist pasca-deploy

1. Buka URL Netlify → halaman landing muncul.
2. Buka `{BACKEND_URL}/` → JSON `status: online`.
3. Register / login (email domain `@innocean.co.id` atau `@innocean.com`).
4. Atau login admin default: `admin` / `admin123` — **ganti password segera**.
5. Pastikan board/task bisa dibuat (koneksi DB OK).
6. Jika Google login dipakai: di Google Cloud Console, tambahkan Authorized JavaScript origins = URL Netlify.

---

## 8. Troubleshooting

| Gejala | Penyebab umum | Solusi |
|--------|---------------|--------|
| Backend crash saat start | `DATABASE_URL` / `SECRET_KEY` kosong | Isi env di Render |
| `dialect does not support ... postgres://` | URL Neon pakai skema lama | Ganti prefix jadi `postgresql://` |
| CORS error di browser | `FRONTEND_URL` tidak cocok | Samakan dengan URL Netlify / Vercel staging (tanpa trailing slash) |
| Frontend memanggil localhost di prod | `VITE_API_BASE_URL` belum di-set | Set di Netlify/Vercel env lalu redeploy |
| DB connection reset | Neon idle / pool | Pakai pooled URL + pastikan `sslmode=require` |
| Email verifikasi tidak terkirim | SMTP belum dikonfigurasi | Isi `SMTP_*` atau verifikasi manual via admin |
| Render deploy saat hanya ubah frontend | Auto-deploy Render tanpa filter path | Set **Included Paths** / `buildFilter` di `render.yaml` (lihat §6) |
| Netlify deploy saat hanya ubah backend | Ignore build belum aktif | Pastikan `netlify.toml` sudah di-push |
| Vercel build dari branch `main` | Production Branch / ignore salah | Production Branch = `staging`; cek `ignoreCommand` di `frontend-app/vercel.json` |
| Staging mengubah data prod | Shared `DATABASE_URL` | Jangan uji hapus; pisahkan DB nanti jika perlu |

---

## 9. Perintah berguna

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

## 10. Keamanan singkat

- Jangan commit file `.env`.
- Ganti password `admin` / `admin123` di production.
- Pakai `SECRET_KEY` yang berbeda antara lokal, staging, dan production.
- Batasi CORS ke domain Netlify (prod) / Vercel (staging) via `FRONTEND_URL`.
- Registrasi dibatasi ke email `@innocean.co.id` dan `@innocean.com`.
- Vercel Hobby: jangan andalkan untuk hosting internal jangka panjang (ToS non-commercial).

---

## Lisensi / penggunaan

Internal tools — penggunaan sesuai kebijakan organisasi.
