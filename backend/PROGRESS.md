# Backend Progress Log

## Phase 0 — Environment Setup
**Date:** 24 August 2026
**Branch:** dev-abhi

### What was done
1. Confirmed repo structure already had backend/, ml-model/, patient-app/, staff-dashboard/ folders with .gitkeep placeholders.
2. Created Python virtual environment inside backend/ using `python -m venv venv`, activated via `venv\Scripts\activate`.
3. Installed core dependencies: fastapi, uvicorn, sqlmodel, python-dotenv, psycopg2-binary.
4. Created Neon PostgreSQL project (free tier), copied connection string.
5. Installed DBeaver Community Edition locally, connected to Neon using the connection string pasted into the URL/JDBC tab (required prefixing with `jdbc:` since DBeaver's URL field needs that format, unlike a plain psycopg2 connection string). Successfully connected — confirmed PostgreSQL 18 on Neon's Ubuntu-hosted instance.
6. Created `.env` file in backend/ storing DATABASE_URL (Neon connection string, including `sslmode=require`).
7. Created `main.py` with a minimal FastAPI app: a single GET `/` route returning `{"status": "alive", "db_configured": ...}`, using python-dotenv to confirm the .env variable loads correctly without exposing it.
8. Ran the app with `uvicorn main:app --reload`, verified `http://localhost:8000` returns `{"status":"alive","db_configured":true}`, and `/docs` renders FastAPI's interactive Swagger UI correctly.

### Errors hit & fixes
- `git rm -r --cached backend/__pycache__` failed with "pathspec did not match" — cause: was already inside the backend/ folder, so git needed a repo-root-relative path. Fixed by running `git rm -r --cached __pycache__` instead (relative to current directory).
- `__pycache__/` and initially missing `venv/` were not excluded in `.gitignore` — updated `.gitignore` to include `venv/`, `__pycache__/`, `.env`, `node_modules/`.
- First `git push` failed with "no upstream branch" since dev-abhi had never been pushed before — resolved using `git push --set-upstream origin dev-abhi`.

### What's next
- Phase 1: define database schema using SQLModel (patients, doctors, departments, symptom_mapping, appointments, queue_logs, staff_users) and create the tables for real in the Neon database.