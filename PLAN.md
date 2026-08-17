# PLAN.md — Smart Hospital Queue Prediction System
## Complete Build Plan (Phase 0 → Phase 8)
 
**Project:** AI-Based Smart Hospital Queue Prediction and Patient Arrival Time Optimization System
**Guide:** Dr. Rajeswari R, Dept. of CSE, SIET Tumakuru (VTU Belagavi)
**Team:** Abhilash K R, Anjanadri T N, Laxuman, Naveen L
**Status:** Paper written and submission-ready. Product build starting from scratch — nothing built yet.
 
---
 
## Current Tech Stack (final, replaces old Node/MongoDB plan)
 
| Layer | Tool |
|---|---|
| Backend | Python + FastAPI |
| Database | PostgreSQL (Supabase or Neon) via SQLAlchemy/SQLModel ORM |
| ML | scikit-learn Random Forest — runs **inside** FastAPI backend, no separate microservice |
| Frontend | React + Tailwind CSS (patient app + staff dashboard) |
| Maps | Google Maps Distance Matrix API + Geolocation API |
| Notifications | Web Push API + Firebase Cloud Messaging (FCM) |
| Deployment | Render or Railway (backend), Vercel (frontend) |
| Version control | GitHub — branches: `backend-dev`, `ml-model`, `patient-app`, `staff-dashboard` |
 
---
 
## Overview: 4 Moving Pieces
 
1. **Database** — stores patients, doctors, queues, appointments
2. **Backend** — FastAPI, all logic + ML prediction
3. **Patient app** — React, what patients use
4. **Staff dashboard** — React, what hospital staff use
Total: **8 phases**, done in strict order. Each phase depends on the previous one working — don't skip ahead.
 
---
 
## PHASE 0 — Setup
**Duration:** 1–2 days
 
- Confirm GitHub repo and branches exist: `backend-dev`, `ml-model`, `patient-app`, `staff-dashboard`
- Every teammate installs: Python 3.11+, Node.js, PostgreSQL client, VS Code
- Create free PostgreSQL database on **Neon** (recommended, simpler than Supabase for this use case)
- Build an empty FastAPI project that returns `{"status": "alive"}` on `localhost:8000`
**Goal:** Everyone can run something locally, even if it does nothing yet.
 
---
 
## PHASE 1 — Database Design
**Duration:** 2–3 days
**Owner:** Anjanadri (backend-dev)
 
Tables to create:
 
| Table | Purpose |
|---|---|
| `patients` | id, name, phone, email, password_hash |
| `doctors` | id, name, department_id, avg_consult_minutes |
| `departments` | id, name |
| `symptom_mapping` | symptom_name, department_id — admin-editable |
| `appointments` | id, patient_id, doctor_id, booked_time, status, queue_position |
| `queue_logs` | id, appointment_id, predicted_wait, actual_wait, timestamp — feeds retraining |
| `staff_users` | id, name, role, hospital_id |
 
Define these as Python classes via SQLAlchemy/SQLModel and let it auto-create tables — don't hand-write raw SQL.
 
**Goal:** All tables exist in Neon. Insert one fake row into each table manually to confirm it works.
 
---
 
## PHASE 2 — Backend Core APIs
**Duration:** 1–1.5 weeks
**Owner:** Abhilash (backend-dev)
 
Build in this exact order:
 
1. **Auth** — patient signup/login, staff login (JWT tokens)
2. **Doctors & Departments** — list departments, list doctors under a department
3. **Symptom mapping** — GET (patient app) and PUT (staff/admin edit)
4. **Appointments** — create booking, view patient's own appointments
5. **Queue status** — how many patients ahead of a given appointment right now
**Goal:** Every endpoint testable via Postman or FastAPI's `/docs` page, returning real JSON. No frontend needed yet.
 
---
 
## PHASE 3 — ML Model
**Duration:** 1 week (parallel with Phase 2)
**Owner:** Abhilash (ml-model branch)
 
1. Generate synthetic dataset (4,000 records): 6 doctors, 5 departments, Poisson-distributed queue lengths, day/time multiplicative effects, ~7% emergency cases, Gaussian noise
2. Train Random Forest Regressor (200 estimators, max depth 10) — matches paper's methodology
3. Save trained model as `.pkl` via `joblib`
4. Write `predict_wait(doctor_id, day, hour, queue_length, patient_type)` → returns wait-time range + explanation
5. Load `.pkl` directly inside FastAPI, expose as `POST /predict-wait`
**Goal:** Hit `/predict-wait` with sample input, get back a wait-time range + one-line explanation.
 
---
 
## PHASE 4 — Google Maps + Notification Logic
**Duration:** 3–4 days
**Owner:** Naveen (staff-dashboard branch)
 
1. Get Google Maps API key (Distance Matrix + Geolocation) — **set up in Week 1, don't delay**
2. Backend endpoint: patient lat/long + hospital address → travel time in minutes
3. Write departure-time trigger logic: compare predicted wait vs travel time
4. Set up Firebase Cloud Messaging project, get server key
5. Backend function: send push notification to a specific device
**Goal:** Manually trigger a test notification to your own phone/browser and see it arrive.
 
---
 
## PHASE 5 — Patient App
**Duration:** 1–1.5 weeks
**Owner:** Laxuman (patient-app branch)
 
Build screens in order:
 
1. Login / Signup
2. Symptom selection → shows matched department
3. Doctor list with live wait-time range
4. Booking confirmation + location permission request
5. "Your predicted wait" screen with explanation text
6. Push notification permission + receiving "leave now" alert
**Goal:** A real patient can walk the full flow end-to-end on phone/browser.
 
---
 
## PHASE 6 — Staff Dashboard
**Duration:** 1 week
**Owner:** Naveen (staff-dashboard branch)
 
Build in order:
 
1. Staff login
2. Live queue view per doctor
3. Emergency patient insertion (bumps queue, triggers recalculation)
4. Mark doctor unavailable / delayed
5. Mark patient as "skipped" (no-show)
6. Symptom-to-department mapping editor
**Goal:** Staff can manage a live queue and see it affect patient predictions in real time.
 
---
 
## PHASE 7 — Integration Testing
**Duration:** 3–5 days
**Owner:** All (cross-branch)
 
Test end-to-end, try to break it:
 
- Book a fake appointment → prediction shows correctly?
- Insert emergency patient → other patients get updated notifications?
- Mark doctor delayed → queue recalculates?
- Log predicted vs actual wait post-consultation → saves to `queue_logs`?
**Goal:** One full walkthrough — book → notify → arrive → staff disruption handled → data logged. No crashes.
 
---
 
## PHASE 8 — Deployment
**Duration:** 2–3 days
**Owner:** All
 
- Backend → Render or Railway
- Frontend (both apps) → Vercel
- Database → already on Neon, point production backend to it
- Set environment variables properly (never hardcode API keys)
- Repeat Phase 7 test on live deployed links, not localhost
**Goal:** A working link you can send to Dr. Rajeswari R for her to click through herself.
 
---
 
## Suggested Timeline (6–7 weeks total)
 
| Week | Focus |
|---|---|
| 1 | Phase 0 + Phase 1 |
| 2–3 | Phase 2 + Phase 3 (parallel) |
| 3–4 | Phase 4 + start Phase 5 |
| 4–5 | Finish Phase 5, start Phase 6 |
| 6 | Finish Phase 6, Phase 7 |
| 7 | Phase 8 + buffer for bugs |
 
---
 
## Work Split (4 people)
 
| Person | Responsibility |
|---|---|
| **Abhilash** | Backend core (Phase 2) + ML integration (Phase 3) — lead |
| **Anjanadri** | Database (Phase 1), then supports backend |
| **Laxuman** | Patient app (Phase 5) |
| **Naveen** | Maps + notifications (Phase 4), staff dashboard (Phase 6), integration testing (Phase 7) |
 
Each person continues writing `PROGRESS.md` after every work session, same process as before.
 
---
 
## Outstanding Item Carried Over From Phase 1
 
Figure 4.1 in Chapter 4 of the Phase-1 report incorrectly shows Holland's RIASEC career-guidance hexagon instead of the system architecture diagram. This must be corrected in the Phase 2 report using the real architecture diagram (Patient App / Staff Dashboard → FastAPI Backend → Random Forest / PostgreSQL / Google Maps / FCM).
 
