## Repository (V2)

This codebase is published as **TAP V2** at [https://github.com/reubenZtomy/TAPv2](https://github.com/reubenZtomy/TAPv2.git). It is separate from the original client repository ([TAP](https://github.com/reubenZtomy/TAP)).

**How to create and publish a quiz:** See **[docs/HOW_TO_USE.md](docs/HOW_TO_USE.md)** — step-by-step guide for the admin builder (create quiz, design questions, map answers, publish, and share public links).

## Client quick start (one-time setup)

Use the setup script for your operating system. Each script runs **once** (or whenever you want a fresh install): it creates a Python virtual environment, installs backend and frontend dependencies, creates `backend/.env` from the template if missing, starts both servers, and prints the URLs and admin login in the terminal.

| File | Platform | What it does |
|------|----------|--------------|
| [`scripts/setup-mac.sh`](scripts/setup-mac.sh) | macOS / Linux | Installs deps, creates `backend/.env` from template **only if missing**, starts servers, prints **actual** login from `backend/.env` |
| [`scripts/setup-windows.ps1`](scripts/setup-windows.ps1) | Windows | Same as Mac script; run from repo root in PowerShell |

**Prerequisites:** [Python 3.11+](https://www.python.org/downloads/), [Node.js 18+](https://nodejs.org/) (includes `npm`), and Git.

### macOS / Linux

```bash
cd /path/to/TAPv2
chmod +x scripts/setup-mac.sh
./scripts/setup-mac.sh
```

Leave the terminal open while you use the app. Press **Ctrl+C** to stop both servers.

### Windows

Open **PowerShell**, go to the project folder, then:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -ExecutionPolicy Bypass
.\scripts\setup-windows.ps1
```

Leave the window open while you use the app. Press **Ctrl+C** to stop both servers.

If something fails, check `.setup-backend.log` and `.setup-frontend.log` in the project root.

---

## Admin login (client)

Sign in at **http://localhost:5173/admin/login**.

**Your login is whatever is in `backend/.env`** — not necessarily what you see in this README.

| Setting | Where to look |
|---------|----------------|
| Email | `ADMIN_EMAIL` in [`backend/.env`](backend/.env) |
| Password | `ADMIN_PASSWORD` in [`backend/.env`](backend/.env) |

**First-time setup only:** if `backend/.env` does not exist yet, the setup script copies [`backend/.env.example`](backend/.env.example), which defaults to:

- Email: `admin@tap.local`
- Password: `TAPadmin2026`

**If `backend/.env` already exists** (for example you cloned the repo or ran setup before), the script **does not overwrite it**. The README defaults may be wrong for your machine — open `backend/.env` or read the values printed at the end of `setup-windows.ps1` / `setup-mac.sh`.

After changing `ADMIN_EMAIL` or `ADMIN_PASSWORD`, **restart the Flask backend** so the admin user in the database is updated.

**Dev auto-login:** In development, visiting http://localhost:5173/admin/login may sign you in automatically. Disable with `DEV_AUTO_LOGIN=false` in `backend/.env`.

**Important URLs (development)**

| Purpose | URL |
|---------|-----|
| Admin login | http://localhost:5173/admin/login |
| Admin dashboard | http://localhost:5173/admin/dashboard |
| Quiz builder | http://localhost:5173/admin/quizzes |
| Published student quiz | http://localhost:5173/q/{slug} |
| Backend API | http://127.0.0.1:5000 |

The site root (`/`) redirects to the admin login. Students only use published links under `/q/...`.

---

## Project layout

- `backend/` — Flask API (admin auth, quiz builder, public quiz by slug)
- `frontend/` — React admin UI + public quiz player for published links
- `scripts/` — One-time setup scripts for macOS and Windows
- `docs/` — Client how-to guide

## How to run (development)

Use the [setup scripts](#client-quick-start-one-time-setup), or:

**Backend**

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
python backend/app.py
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Vite runs at http://localhost:5173 and proxies `/api` to Flask at http://127.0.0.1:5000.

## Production-like

```bash
cd frontend && npm run build
cd .. && python backend/app.py
```

Flask serves `frontend/dist` when built.

## Notes

- Quiz content, layouts, and translations live in SQLite (`backend/auth.db`), not static question files.
- Custom result rules are configured in the admin **Answers** tab (stored in the browser for preview; students use rules saved in that browser when testing locally).
- CORS is enabled for development via `flask-cors`.
