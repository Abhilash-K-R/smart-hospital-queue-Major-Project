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

## Phase 2 — Backend Core APIs (in progress)
**Date:** 25 August 2026
**Branch:** dev-abhi

### What was done
1. Installed python-jose[cryptography] and passlib[bcrypt] for JWT auth and password hashing.
2. Added JWT_SECRET_KEY to .env.
3. Created auth.py — password hashing (bcrypt), JWT creation/verification (HS256, 60-min expiry), and get_current_user dependency for protecting routes.
4. Created schemas.py — Pydantic request/response models, kept separate from models.py so sensitive fields (e.g. password_hash) never leak into API responses.
5. Built /signup/patient and /login/patient endpoints in main.py — tested successfully via /docs.
6. Built GET /departments and GET /doctors (with optional department_id filter) — tested successfully.
7. Built GET /symptom-mapping and PUT /symptom-mapping/{id} — tested successfully.

### Known gaps — flagged, not yet fixed
- **PUT /symptom-mapping/{id} currently has NO auth check.** Any caller can edit the symptom-to-department mapping right now, not just staff. This must be locked down with role-based protection (staff-only) before final deployment. Flagged in code comment, tracked here so it isn't forgotten.
- Route protection so far only checks "is this a valid logged-in user," not "does this user have the right ROLE" (patient vs staff). Role-based checks need to be added as a follow-up once more staff-only routes exist (e.g. emergency insertion in Phase 6).

### What's next
- Appointments endpoints (POST /appointments, GET /appointments/my) — using get_current_user so patients can only book/view their own appointments.
- Then queue status endpoint to complete Phase 2's build order.

### Update — Phase 2 continued (26 August 2026)
1. Fixed a passlib/bcrypt version mismatch causing signup to fail with 500 — downgraded bcrypt to 4.0.1 (newer bcrypt 5.x removed an attribute passlib 1.7.4 depends on).
2. Fixed Swagger's Authorize popup failing with 422 — switched auth.py from OAuth2PasswordBearer (expects form-encoded username/password) to HTTPBearer (expects a simple pasted token), matching our actual JSON-based login flow.
3. Built and tested POST /appointments and GET /appointments/my — booking is tied to the logged-in patient's token, not a client-supplied patient_id, preventing a patient from booking on someone else's behalf.
4. Built and tested GET /appointments/{id}/queue-status — returns live count of pending patients ahead in the same doctor's queue. Includes an ownership check (403 if a patient tries to view another patient's appointment status).

### Phase 2 — COMPLETE
All 5 planned endpoints built and verified via /docs: Auth, Doctors/Departments, Symptom mapping, Appointments, Queue status.

### Known gaps carried forward
- PUT /symptom-mapping/{id} still has no role-based auth check — any logged-in-or-not caller can currently edit it. Needs staff-only protection before Phase 6 (staff dashboard) goes live.
- No role-based (patient vs staff) distinction enforced anywhere yet — get_current_user only confirms "valid token," not "correct role for this action."

### What's next
- Phase 3: ML model (Random Forest wait-time prediction) — can now use queue-status logic as its live queue_length_ahead feature.

## Phase 3 — ML Model (27 August 2026)
**Branch:** dev-abhi

### What was done
1. Created ml-model/generate_dataset.py — generates 4,000 synthetic hospital visit records matching paper methodology (Poisson-distributed queue lengths, day/hour multiplicative peak effects, ~7% emergency cases, Gaussian noise). Verified stats align with realistic OPD wait-time distributions (median 54.9 min, mean 63.6 min).
2. Created ml-model/train_model.py — trains and compares Linear Regression baseline vs Random Forest Regressor (200 estimators, max depth 10) on an 80/20 split with one-hot encoded features. Results: Linear Regression MAE 16.02/R² 0.755, Random Forest MAE 5.45/R² 0.967 — Random Forest reduced MAE by 66%, confirming paper's core finding (RF significantly outperforms linear baseline due to multiplicative queue dynamics). Numbers differ slightly from paper's published results (MAE 4.69/10.64) due to synthetic dataset regeneration with a different random seed run — direction and magnitude of the finding remain consistent.
3. Verified feature importance — queue_length_ahead is the dominant predictor (0.387), followed by doctor_avg_consult_minutes (0.180) and hour_of_day (0.123), matching paper's Fig. 3 ordering.
4. Created ml-model/predict.py — standalone predict_wait() function, loads the trained model and returns a wait-time range (±15% band) plus a plain-language explanation, tested directly via command line.
5. Copied wait_time_model.pkl and model_columns.pkl into backend/, created backend/ml_predictor.py (mirrors predict.py logic) so FastAPI can import and use the model directly — no separate ML microservice, per paper's architecture.
6. Added POST /predict-wait endpoint in main.py — tested via /docs, confirmed prediction matches standalone test exactly (109.3 min for the same test input).

### Decisions made
- Chose to COMMIT the .pkl model files directly into backend/ (rather than gitignoring them) for simplicity — teammates can clone and run without an extra "copy the model files" step. Tradeoff: git history will grow each time the model is retrained and re-committed. Acceptable for a student project on a deadline.
- Fixed a numpy float64 serialization issue in predict.py/ml_predictor.py — wrapped all returned numbers in float() so FastAPI's JSON responses don't error out (numpy's native types aren't directly JSON-serializable).

### What's next
- Phase 4: Google Maps travel-time integration + departure-time notification logic (Naveen, staff-dashboard branch)
- Later: /predict-wait will be wired to pull LIVE queue data automatically (via existing /appointments/{id}/queue-status logic) instead of requiring manually-supplied values — that manual-input version was for Phase 3 testing only.