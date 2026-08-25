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

## Phase 1 — Database Design
**Date:** 25 August 2026
**Branch:** dev-abhi

### What was done
1. Created `database.py` — sets up a single shared SQLAlchemy/SQLModel `engine` object, reading DATABASE_URL from `.env` via python-dotenv. `echo=True` enabled temporarily to print raw SQL to terminal for learning/debugging purposes.
2. Created `models.py` — defined all 7 tables as SQLModel classes: Department, Doctor, Patient, SymptomMapping, StaffUser, Appointment, QueueLog. Added docstrings and inline comments explaining each field and relationship for teammate readability. Confirmed `symptom_mapping` has its own `id` primary key (not just a composite key), per the requirement flagged for Phase 2.
3. Created `create_tables.py` — one-time script that imports all models and runs `SQLModel.metadata.create_all(engine)` to create tables for real inside Neon. Ran successfully — confirmed via terminal SQL logs and visually in DBeaver that all 7 tables now exist with correct columns and foreign key constraints (doctor→department, symptommapping→department, appointment→patient/doctor, queuelog→appointment).
4. Created `seed.py` — inserts one sample row into each table, in dependency order (parent tables before child tables that reference them via foreign key) to avoid foreign key violations. Order used: Department → Doctor → Patient → SymptomMapping → StaffUser → Appointment → QueueLog.
5. Ran `seed.py` successfully — confirmed real rows exist in all 7 tables via DBeaver's "View Data" panel.

### Errors hit & fixes
- None blocking. Noted a `DeprecationWarning` for `datetime.utcnow()` in `seed.py` (Python flags this as scheduled for removal in favor of timezone-aware `datetime.now(datetime.UTC)`). Non-blocking — flagged for a future cleanup pass, not fixed yet since it doesn't affect functionality.

### What's next
- Phase 1 complete — all 7 tables confirmed with real data in Neon, gate condition met.
- Handing off to Phase 2: Backend Core APIs (owned by Abhilash). Build order: Auth (JWT) → Doctors/Departments endpoints → Symptom mapping → Appointments → Queue status.
- Note carried over: staff accounts must be pre-seeded, no public signup endpoint for staff (already respected in seed.py — StaffUser inserted directly, not via any API).