# INNOCEAN Tracker — Frontend (Revamp)

Frontend baru dengan tech stack modern dan UI inspirasi ClickUp.

## Tech Stack

- **React 18** + **Vite 8**
- **Tailwind CSS 3** — dark theme ClickUp-style
- **Radix UI** — Dialog, Dropdown, Tabs, Avatar, dll.
- **Zustand** — state management
- **React Router 6** — routing (menggantikan boolean modal navigation)
- **@hello-pangea/dnd** — Kanban drag & drop
- **Axios** — API client

## Menjalankan

```bash
# Dari root tracker-project
./run-frontend-new.sh

# Atau manual
cd frontend
npm install
npm run dev
```

Frontend dev server: **http://localhost:5174**

Backend harus berjalan di **http://localhost:8000** (via `./run-backend.sh`).

## Environment

Salin `.env.example` ke `.env`:

```
VITE_API_BASE_URL=          # kosong = localhost:8000
VITE_GOOGLE_CLIENT_ID=      # opsional, Google OAuth
```

## Struktur

```
src/
├── api/           # Axios client + semua endpoint API
├── stores/        # Zustand stores (auth, board, ui, notification)
├── routes/        # React Router config
├── pages/         # Halaman (Home, Board, Auth, Timesheet, dll.)
├── components/
│   ├── layout/    # Sidebar, TopBar, AppShell
│   ├── board/     # Kanban, List, Calendar, TaskCard
│   ├── modals/    # Radix Dialog (Task, Team, Settings, dll.)
│   └── ui/        # Reusable UI primitives
└── lib/           # Utils & constants
```

## Fitur

- Auth: Login, Register, Google OAuth, Forgot/Reset Password
- Home Dashboard dengan stats & my top queue
- Kanban Board (drag & drop), List View, Calendar View
- Task CRUD dengan subtasks & comments
- Project/Board management & team invite
- Notifications & invitations
- Timesheets
- Public task preview (`/task/:id`)

## Perbedaan dari `frontend-app`

| Aspek | frontend-app (lama) | frontend (baru) |
|-------|---------------------|-----------------|
| Routing | State + boolean modal | React Router |
| State | useAppLogic monolith | Zustand stores |
| UI | Custom modals | Radix UI Dialog |
| Theme | Multi-theme | ClickUp dark (fixed) |
| React | 19 | 18 |
