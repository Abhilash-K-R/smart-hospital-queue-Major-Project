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

## Phase 4 — Google Maps Travel Time & Departure-Time Notification (10 September 2026)
**Branch:** dev-abhi

### What was done
1. Created `travel_time.py` — implements `get_mock_travel_time()` using the Haversine formula (Earth radius 6,371 km, straight-line distance to SIET Tumakuru at 13.376230, 77.097439, assuming 25 km/h city speed with random traffic variation, min 3 min). Also contains `get_real_travel_time()` for Google Maps Distance Matrix API (active when GOOGLE_MAPS_API_KEY is provided in .env).
2. Added `POST /departure-check` in `main.py` — core departure decision algorithm. Queries real-time pending queue length ahead for the appointment, fetches doctor and department details, invokes the Random Forest `predict_wait()` model, calculates travel time, and triggers `should_leave_now = travel_time >= predicted_wait` with buffer estimation.
3. Added `CORSMiddleware` in `main.py` — enables seamless cross-origin requests from React frontends running on Vite (localhost:3000 / 5173).
4. Added Frontend Bridge Layer in `main.py` & `schemas.py` to support Laxuman's and Naveen's React applications out-of-the-box:
   - `POST /auth/login` (supports email or phone login)
   - `POST /patients/register` (instant account creation and appointment booking)
   - `GET /patients/profile` & `PUT /patients/profile` (profile inspection and update)
   - `GET /queue/status/{token_identifier}` (delivers queue data shaped for QueueCard & ProgressCard)
   - `POST /calculate-departure` (alias for Naveen's GPS coordinate format)
   - `GET /ai/predict-arrival` (powers Laxuman's ArrivalPrediction.jsx countdown and route simulation)
   - `GET /notifications` & `PUT /notifications/{id}/read` (in-app notification feed)
5. Created `test_departure_check.py` — automated test suite covering patient auth, appointment booking, nearby patient check (should_leave_now == False), far patient check (should_leave_now == True), cross-patient 403 security check, and all frontend bridge routes. Verified 100% pass across all tests against Neon PostgreSQL and the loaded ML model.

### Decisions made
- Chose an in-app notification / polling architecture instead of Firebase Cloud Messaging (FCM) after auditing Laxuman's frontend: his React UI does not have FCM service workers, but already includes a 30s auto-refresh loop and dedicated Arrival Prediction / Notification screens.
- Fixed `doctor_id` formatting (`f"DOC{doctor.id}"`) and department query in `/departure-check` so predictions match the model's trained one-hot dummy features.

### What's next
- Phase 5: Staff dashboard queue control and emergency insertion (Phase 6 features).

## Phase 4 Completion & Frontend Bridge Integration (10 September 2026)
**Branch:** dev-abhi

### What was done
1. **Option A Live Backend Verification:**
   - Ran `POST /departure-check` over live HTTP (`http://127.0.0.1:8000`) with real appointment data.
   - Nearby test (~500m): predicted wait 130.4m, travel time 3m, `should_leave_now: false`.
   - Distant test (~70km in Bangalore): predicted wait 130.4m, travel time 194m, `should_leave_now: true`.
2. **Git Hygiene & Clean Merge:**
   - Deleted inaccurate premature `v0.4.0` tag locally and from remote origin.
   - Cleanly merged `origin/laxuman-frontend` into `dev-abhi`.
   - Added comprehensive `patient-app/.gitignore` and purged cached `node_modules/` and `dist/` from Git tracking (`git rm -r --cached`).
3. **5 Frontend Bridge Connections Applied:**
   - **Base URL:** Added `.env` with `VITE_API_BASE_URL=http://localhost:8000` and updated fallback in `patient-app/src/services/api.js`.
   - **Token Persistence:** Updated `patientService.login` & `patientService.registerPatient` to store `mediflow_auth_token` in `localStorage`.
   - **Real Login Call:** Hooked `Login.jsx` to call `patientService.login()` on form submit.
   - **Live Departure Engine:** Rewrote `ArrivalPrediction.jsx` to call `queueService.checkDeparture()` (`POST /departure-check`), displaying real countdown, dynamic "LEAVE NOW!" alerts, travel durations, and hospital route to SIET Tumakuru.
   - **Queue Auto-Refresh Sync:** Connected `QueueContext.jsx` 30-second interval to `queueService.getQueueStatus()` so live token progression is synchronized from the database.
   - **Safe Token Parsing:** Fixed token rendering and progress calculations in `QueueCard.jsx` and `ProgressCard.jsx` to prevent `NaN%` display when receiving formatted tokens.
4. **End-to-End Live Verification:**
   - Created `test_frontend_integration.py` simulating full React client lifecycle: Registration → JWT extraction → Login → 30s Queue Status sync → Nearby / Distant Departure Check.
   - Ran against live FastAPI server on port 8000 — 100% pass across all endpoints.
   - Verified Vite frontend production build (`npm run build`) — bundled 2,398 modules in 12.37s with 0 errors.

### Project Details Updated:
- Guide: Dr. Rajeswari R (Dept. of CSE)
- Team: Abhilash K R (Lead & ML/Backend), Laxuman Ghotale (Frontend UI/UX), Anjanadri T N (System/Cloud), Naveen L (Data/QA)
- Location: Shridevi Hospital & Research Hospital, SIET Campus, Tumakuru

### Release:
- Tagged and released `v0.4.0` on GitHub: *"Release v0.4.0: Phase 4 Google Maps departure check and full patient-app frontend bridge integration"*.

## Phase 6 — Staff Dashboard & Emergency Queue Control (11 September 2026)
**Branch:** dev-abhi

### What was done
1. **Pydantic Schemas Added in `schemas.py`:**
   - `StaffLoginRequest`, `StaffLoginResponse`, `StaffQueueItem`
   - `EmergencyInsertRequest`, `EmergencyInsertResponse`
   - `QueueAdvanceRequest`, `DoctorStatusUpdateRequest`, `StaffStatsResponse`
   - `SymptomAnalyzeRequest`, `SymptomAnalyzeResponse`, `SymptomAnalyzeResult`
2. **Phase 6 Staff Endpoints Implemented in `main.py`:**
   - `POST /token` & `POST /auth/staff/login`: Unified staff authentication accepting form-data or JSON, issuing role-based JWTs.
   - `GET /staff/queue`: Live triage queue with wait-time calculation, doctor mapping, and critical/urgent triage badges.
   - `POST /staff/emergency-insert`: Core triage insertion endpoint. Automatically sets emergency appointment at Position #1 and atomically shifts all pending regular patient appointments back by +1.
   - `POST /staff/queue/call-next`: Advances queue, moving active patient to completed and next pending patient to serving.
   - `PUT /staff/appointments/{id}/status`: Manual status overrides (`completed`, `skipped`, `serving`) with atomic queue adjustments.
   - `GET /staff/stats`: Live KPIs (total patients today, currently waiting, average predicted wait time, emergency cases count, dynamic recent activity feed).
   - `POST /staff/symptom-analyze`: AI-assisted symptom classifier mapping clinical complaints to appropriate specialties (Cardiology, Pulmonology, General Medicine) with confidence scores.
   - `GET /staff/doctors`: Live doctor roster with consultation metrics and active queue lengths.
3. **High-Performance Atomic SQL Optimization:**
   - Replaced multi-step sequential ORM update loops with single atomic PostgreSQL statements (`UPDATE appointment SET queue_position = ...`), drastically accelerating emergency insertion (<100ms) and preventing SSL socket timeouts on Neon serverless database.
   - Fortified connection pooling in `database.py` with `pool_pre_ping=True` and `pool_recycle=60`.
4. **Automated Verification:**
   - Created `test_phase6_staff.py`: 100% pass across all 8 staff routes.
   - Created `test_cross_system_flow.py`: Proved project novelty end-to-end. Inserting an acute trauma emergency patient dynamically shifted regular patient queue position (8 -> 9), increased predicted wait time (172.9m -> 178.3m), and pushed back the patient's departure time (159m -> 163m remaining buffer).

5. **Queue Action & Status Transition Fortification:**
   - Fixed `422 Unprocessable Entity` error on `PUT /staff/appointments/{id}/status` by making `appointment_id` optional in `QueueAdvanceRequest` (since the ID is supplied in the URL path).
   - Handled full lifecycle state transitions:
     - `completed`: Removes patient from active waiting/serving queue (`queue_position = None`), advances subsequent pending patients forward.
     - `skipped`: Marks absent patient as skipped and shifts subsequent queue forward.
     - `serving`: Marks any existing serving patient for the doctor as completed, places current patient at Position 0, and advances remaining queue.
   - Normalized staff login to seamlessly accept email formats (e.g. `admin@hospital.com`) as well as usernames (`admin`).

### Phase 6 — COMPLETE
All staff control endpoints and cross-system dynamic queue shifting fully built, tested, and verified.

