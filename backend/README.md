# Backend Setup Guide — Smart Hospital Queue Project

This guide is written for teammates with **zero prior experience** setting up a Python/FastAPI backend. Follow every step in order, don't skip anything, and don't panic if something looks unfamiliar — that's normal the first time.

If you get stuck at any point, screenshot the error and ask in the team group or ask Claude directly. Don't sit stuck silently.

---

## What you're setting up

A local copy of our backend that:
- Runs a FastAPI server on your laptop
- Connects to our shared Neon PostgreSQL database (cloud-hosted, not on your laptop)
- Lets you build and test API endpoints before pushing code

---

---

## Current Project Status

- ✅ **Phase 0 — Environment Setup:** Complete. FastAPI skeleton runs locally, connects to Neon successfully.
- ✅ **Phase 1 — Database Design:** Complete. All 7 tables created in Neon (`department`, `doctor`, `patient`, `symptommapping`, `staffuser`, `appointment`, `queuelog`) via `create_tables.py`, verified with real sample data via `seed.py`.
- 🔄 **Phase 2 — Backend Core APIs:** In progress (Auth → Doctors/Departments → Symptom mapping → Appointments → Queue status).

See `PROGRESS.md` in this folder for detailed session-by-session logs.

---

## Step 1 — Install the tools (one-time, do this first)

| Tool | Why | Download |
|---|---|---|
| Python 3.11+ | Runs our backend code | [python.org/downloads](https://python.org/downloads) — **tick "Add Python to PATH" during install on Windows** |
| VS Code | Where you'll write code | [code.visualstudio.com](https://code.visualstudio.com) |
| Git | Already set up if you cloned the repo | — |

Verify installs by opening a terminal and running:
```powershell
python --version
git --version
```
Both should print a version number. If not, restart your laptop and try again (this fixes PATH issues).

---

## Step 2 — Clone the repo (skip if you already have it)

```powershell
git clone https://github.com/Abhilash-K-R/smart-hospital-queue-Major-Project.git
cd smart-hospital-queue-Major-Project
```

---

## Step 3 — Switch to your own branch

Never work directly on `main`. Use your assigned branch:

```powershell
git checkout your-branch-name
```

Example: `git checkout backend-dev`

---

## Step 4 — Set up the Python environment

Move into the backend folder:
```powershell
cd backend
```

Create a virtual environment (keeps our project's packages separate from everything else on your laptop):
```powershell
python -m venv venv
```

Activate it:
```powershell
venv\Scripts\activate
```
*(Mac/Linux: `source venv/bin/activate`)*

You'll know it worked when you see `(venv)` at the start of your terminal line. **You must activate this every time you open a new terminal to work on the backend.**

---

## Step 5 — Install project dependencies

```powershell
pip install fastapi uvicorn sqlmodel python-dotenv psycopg2-binary
```

This installs:
- **fastapi** — our backend framework
- **uvicorn** — the server that runs it
- **sqlmodel** — lets us define database tables as Python classes
- **python-dotenv** — reads secret config (like passwords) safely
- **psycopg2-binary** — lets Python talk to PostgreSQL

---

## Step 6 — Get the database connection string

Our shared database lives on **Neon** (cloud PostgreSQL, free tier). Ask **Abhilash** for the connection string — it looks like:
```
postgresql://neondb_owner:PASSWORD@ep-something.neon.tech/neondb?sslmode=require
```

**Never share this in a public place (team group is fine, GitHub is NOT).**

---

## Step 7 — Create your `.env` file

Inside the `backend/` folder, create a new file named exactly `.env` (starts with a dot, no name before it).

Paste in:
```
DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-something.neon.tech/neondb?sslmode=require
```

Save it. This file is already excluded from git via `.gitignore` — **never remove `.env` from `.gitignore`, and never commit this file.**

---

## Step 8 — Run the server

Make sure `(venv)` is showing in your terminal, then run:
```powershell
uvicorn main:app --reload
```


You should see a line like `Uvicorn running on http://127.0.0.1:8000`.

Open your browser and go to:
- `http://localhost:8000` → should show `{"status":"alive","db_configured":true}`
- `http://localhost:8000/docs` → FastAPI's interactive testing page — you'll use this constantly

If `db_configured` shows `false`, double check your `.env` file — it likely means the connection string wasn't saved correctly.

---

---

## Working with the database (Phase 1 onward)

Once your server is running, our database tables already exist in Neon (shared across the team — you don't need to create them yourself). Key files:

- `database.py` — sets up the shared connection to Neon. Don't duplicate this in other files, just import `engine` from here.
- `models.py` — defines all 7 tables as Python classes. If you need to see the database structure, read this file first.
- `create_tables.py` — already run once by Abhilash. You do NOT need to run this again unless models.py changes with a new table.
- `seed.py` — inserts sample test data. Safe to re-run for testing, but note it will create duplicate rows each time (no duplicate-checking yet).

To view live data visually, use DBeaver connected to the same Neon connection string in your `.env`.

---

## Common errors and fixes

| Error | Fix |
|---|---|
| `python not recognized` | Python wasn't added to PATH — reinstall and tick that box |
| `pip: command not found` | Same as above, or try `python -m pip install ...` instead |
| `ModuleNotFoundError: No module named 'fastapi'` | You forgot to activate `venv` — run `venv\Scripts\activate` first |
| Git push fails with "no upstream branch" | Run `git push --set-upstream origin your-branch-name` once |
| `git rm` says "pathspec did not match" | Git paths are relative to the **repo root**, not your current folder — check where you are with `git status` |

---

## Daily workflow (once set up)

Every time you sit down to work:

```powershell
cd smart-hospital-queue-Major-Project/backend
venv\Scripts\activate
git pull origin main
```

Do your work, then:
```powershell
git add .
git commit -m "short description of what you did"
git push
```

Then open a Pull Request on GitHub when a feature is ready — see the main repo README for the full PR process.

---

## Remember

- Always activate `venv` before running anything Python-related in this project
- Never commit `.env` — it holds real credentials
- Update `PROGRESS.md` in your folder after every session
- Ask for help early — don't stay stuck silently    