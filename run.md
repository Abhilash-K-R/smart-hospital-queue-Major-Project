# 🏥 Shridevi MediFlow AI — Smart Hospital Queue Prediction System
## Shridevi Hospital & Research Hospital, Sira Road, Tumakuru
## Complete Presentation & Execution Run Guide (`run.md`)

This guide provides step-by-step instructions to run and showcase the entire project during demonstrations and final presentations.

---

## ⚡ Quick Start: 3-Terminal Launch

To run the complete system, open **3 separate terminal windows** in VS Code / PowerShell and run the following:

```
┌───────────────────────────┐    ┌───────────────────────────┐    ┌───────────────────────────┐
│        TERMINAL 1         │    │        TERMINAL 2         │    │        TERMINAL 3         │
│     FastAPI Backend       │    │     Patient React App     │    │      Staff Dashboard      │
│   http://localhost:8000   │    │   http://localhost:3000   │    │   http://localhost:5173   │
└───────────────────────────┘    └───────────────────────────┘    └───────────────────────────┘
```

---

### 🔹 Terminal 1: Backend Server (FastAPI + ML Engine + Neon PostgreSQL)

1. Open **Terminal 1**:
```powershell
cd "backend"
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000
```
> *(Optional DB Seed Check: If running on a new database, run `python seed_doctors.py` once to seed the 8 doctors and 7 departments).*

✅ **Backend Status Check:** Open [http://localhost:8000](http://localhost:8000) (Should return `{"status": "alive", "db_configured": true}`)  
📖 **Interactive Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 🔹 Terminal 2: Patient Web App (Shridevi MediFlow AI • React + Vite)

2. Open **Terminal 2**:
```powershell
cd "patient-app"
npm run dev
```

✅ **Patient App URL:** [http://localhost:3000](http://localhost:3000)

---

### 🔹 Terminal 3: Staff & Hospital Admin Dashboard (Shridevi Hospital Portal • React + Vite)

3. Open **Terminal 3**:
```powershell
cd "staff-dashboard"
npm run dev
```

✅ **Staff Dashboard URL:** [http://localhost:5173](http://localhost:5173) *(or check terminal if port 3001 is assigned)*

---

## 🔑 Login & Demo Credentials

| Role | Portal URL | Username / Email | Password |
|---|---|---|---|
| **Patient** | [http://localhost:3000/login](http://localhost:3000/login) | `laxuman.patient@shridevimediflow.ai` *(or any registered email/phone)* | `Patient@123` |
| **Hospital Staff / Admin** | [http://localhost:5173/login](http://localhost:5173/login) | `reception1` or `admin` | `Staff@123` |

---

## 🌐 Complete Navigation Links Directory

### 👤 Patient Application (`http://localhost:3000` — Shridevi MediFlow AI)
- **Dashboard Overview:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard) — Live token tracker, estimated wait time, queue position.
- **Book OPD Appointment:** [http://localhost:3000/appointment](http://localhost:3000/appointment) — Select from 7 departments and 8 doctors with real-time pass generation & PDF export.
- **New Patient Registration:** [http://localhost:3000/register](http://localhost:3000/register) — Instant token issuing with doctor allocation.
- **Live Queue Radar:** [http://localhost:3000/queue](http://localhost:3000/queue) — Live queue progression with auto-polling.
- **AI Smart Departure Alarm:** [http://localhost:3000/arrival](http://localhost:3000/arrival) — Haversine travel time + Random Forest wait calculation to advise exact departure time.
- **Dual WhatsApp & SMS Dispatch:** [http://localhost:3000/notifications](http://localhost:3000/notifications) — Live mobile simulator and 1-click real WhatsApp alert dispatch.
- **AI Symptom Checker:** [http://localhost:3000/symptoms](http://localhost:3000/symptoms) — Intelligent department routing based on medical complaints.

### 🏥 Staff & Doctor Dashboard (`http://localhost:5173` — Shridevi Hospital Admin)
- **Hospital Overview (KPIs):** [http://localhost:5173/dashboard](http://localhost:5173/dashboard) — Total patients today, average waiting minutes saved, active doctors.
- **Live Queue Table:** [http://localhost:5173/queue](http://localhost:5173/queue) — Live triage management, doctor/department filters, "Call Next", "Serve", and "Complete" controls.
- **Emergency Priority Intake:** [http://localhost:5173/emergency](http://localhost:5173/emergency) — Critical case insertion with automated queue bumping to Position #1.
- **Symptom Mapping Config:** [http://localhost:5173/symptoms](http://localhost:5173/symptoms) — Dynamic department-to-symptom mapping.

---

## 🎯 5-Minute Live Presentation Flow (Showcase Storyline)

Follow this sequence to deliver an impressive demonstration to evaluators:

```
[1. Patient Books Slot] ──> [2. AI Calculates Wait & Departure] ──> [3. Dual WhatsApp/SMS Alert]
                                                                              │
[5. Queue Logged to DB] <── [4. Staff Manages Live Queue / EMG] <─────────────┘
```

### Scene 1: Real-Time Appointment Booking
1. Open **Patient App** at [http://localhost:3000/appointment](http://localhost:3000/appointment).
2. Select **Department: Dermatology** $\rightarrow$ **Doctor: Dr. Sneha Patil (Room 210)**.
3. Click **"Confirm Appointment & Issue Token"**.
4. Show the **Digital Pass Modal** generated with real token (e.g. `OPD-031`), Shridevi Hospital header, and QR code.
5. Demonstrate the **"Download PDF Slip"** feature.

### Scene 2: AI Wait Prediction & Smart Departure Engine
1. Navigate to **AI Arrival Prediction** at [http://localhost:3000/arrival](http://localhost:3000/arrival).
2. Explain how the system combines:
   - **Machine Learning (Random Forest Regressor)**: Predicts remaining consultation wait based on queue length, doctor avg consult time, day of week, and peak hour.
   - **Travel Engine (Distance & Traffic)**: Calculates travel time from patient's location to Shridevi Hospital, Sira Road campus.
3. Show the **"Leave Home in X Minutes"** recommendation countdown.

### Scene 3: Dual Mobile Alert Simulator (WhatsApp + SMS)
1. Click **"WhatsApp & SMS Dispatch"** button on the Arrival Prediction page or open [http://localhost:3000/notifications](http://localhost:3000/notifications).
2. Show the **Dual Channel Phone Simulator**:
   - **WhatsApp Tab**: Displays rich verified OPD Bot message with token, doctor, room, wait time, and Google Maps hospital navigation link.
   - **SMS Tab**: Displays concise GSM text message formatted for standard carrier networks (ensuring 100% notification reach).
   - Click **"Send to Real WhatsApp"** (`wa.me/?text=...`) to demonstrate real external WhatsApp integration.


### Scene 4: Emergency Triage Priority Insertion
1. Go to **Emergency Intake** at [http://localhost:5173/emergency](http://localhost:5173/emergency).
2. Fill a critical case (e.g., *Name: Ramesh K, Complaint: Acute Myocardial Infarction, BP: 160/100*).
3. Click **"Declare Emergency & Bump Queue"**.
4. Show that the emergency case is immediately assigned **Queue Position #1** (`EMG-xx`), and all regular patients are bumped back by +1.

### Scene 5: Queue Progression & PostgreSQL Audit
1. In [http://localhost:5173/queue](http://localhost:5173/queue), click **"Serve"** and then **"Complete"** for the active patient.
2. Show that the patient status transitions, the queue shifts forward, and the consultation duration is logged directly into the `queue_log` table in Neon PostgreSQL.

---

## 🛠️ Unified Hospital Doctor & Department Roster

| ID | Doctor Name | Department | Qualification | Room | Avg Consult | Role |
|---|---|---|---|---|---|---|
| **1** | Dr. Priya Sharma | Cardiology | MBBS, MD, DM - Cardiology | Room 302 | 15 min | Specialist |
| **2** | Dr. Arjun Rao | General Medicine | MBBS, DNB - Family Medicine | Room 205 | 10 min | General Purpose |
| **3** | Dr. Rajeswari R. | General Medicine | MBBS, MD - General Medicine | Room 204 | 10 min | General Purpose |
| **4** | Dr. Vikram K. Rao | Orthopedics | MBBS, MS - Orthopedics | Room 108 | 12 min | Specialist |
| **5** | Dr. Ananya Hegde | Pediatrics | MBBS, MD - Pediatrics | Room 105 | 10 min | Specialist |
| **6** | Dr. Rajeshwar B. | Neurology | MBBS, MD, DM - Neurology | Room 401 | 15 min | Specialist |
| **7** | Dr. Sneha Patil | Dermatology | MBBS, MD - Dermatology | Room 210 | 10 min | Specialist |
| **8** | Dr. Manoj Kumar | Pulmonology | MBBS, DTCD, DNB - Pulmonology | Room 305 | 12 min | Specialist |

---

## ❓ Troubleshooting & FAQs

- **Port already in use:**
  If port 8000, 3000, or 5173 is occupied, terminate any existing processes or specify an alternate port:
  ```powershell
  # Check and kill process on port 8000 if stuck:
  netstat -ano | findstr :8000
  taskkill /PID <PID> /F
  ```
- **Virtual Environment Missing:**
  ```powershell
  cd backend
  python -m venv venv
  .\venv\Scripts\activate
  pip install -r requirements.txt
  ```
- **Node Modules Missing:**
  ```powershell
  cd patient-app && npm install
  cd ../staff-dashboard && npm install
  ```
- **Database Connection Check:**
  The backend connects to **Neon Serverless PostgreSQL**. Ensure your internet connection is active when launching the backend.
