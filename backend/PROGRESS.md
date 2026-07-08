# Backend progress log — Abhilash (backend-dev branch)

Detailed log of every step taken to build the backend. Written so any teammate (or future me) can understand exactly what was done, why, and how to reproduce it.

---

## Day 1 — Project initialization

### Step 1: Initialize Node project
```powershell
cd backend
npm init -y
```
Creates `package.json` with default values.

### Step 2: Install dependencies
```powershell
npm install express mongoose dotenv cors bcryptjs jsonwebtoken
npm install -D nodemon
```
What each package is for:
- `express` — web server framework, handles routes and requests
- `mongoose` — connects Node to MongoDB, defines schemas/models
- `dotenv` — loads secret values (DB password, JWT secret) from a `.env` file instead of hardcoding them
- `cors` — allows frontend (running on a different port/domain) to call this backend without being blocked by the browser
- `bcryptjs` — hashes passwords before storing them, so raw passwords are never saved in the database
- `jsonwebtoken` — creates login tokens (JWT) so the backend can verify a user is logged in on future requests
- `nodemon` (dev only) — auto-restarts the server when files change, so I don't have to manually stop/start every time

### Step 3: Create folder structure
```powershell
mkdir models, routes, controllers, config
New-Item -Path ".env" -ItemType File
New-Item -Path ".gitignore" -ItemType File
New-Item -Path "server.js" -ItemType File
```
Folder purpose:
- `models/` — database schemas (what a User, Doctor, Appointment looks like)
- `routes/` — defines URL endpoints (e.g. `/api/auth/register`) and which controller function handles them
- `controllers/` — the actual logic that runs when a route is hit (e.g. checking password, saving to DB)
- `config/` — setup/connection code, currently just the database connection file

### Step 4: `.gitignore` — prevent committing secrets/junk

mongodb+srv://akr-admin:<db_password>@akr-studio-db.mzdvzln.mongodb.net/?appName=akr-studio-db

Added the database name into the path and filled in the real password:

mongodb+srv://akr-admin:REAL_PASSWORD@akr-studio-db.mzdvzln.mongodb.net/hospitalQueueDB?appName=akr-studio-db

### Step 4: Set up `.env`

MONGO_URI=mongodb+srv://akr-admin:REAL_PASSWORD@akr-studio-db.mzdvzln.mongodb.net/hospitalQueueDB?appName=akr-studio-db
PORT=5000
JWT_SECRET=hospital_queue_secret_2026

### Step 5: Hit a connection error — debugged and fixed
Ran `npm run dev`, got:

MongoDB connection failed: querySrv ECONNREFUSED _mongodb._tcp.akr-studio-db.mzdvzln.mongodb.net

**Debugging process:**
1. Confirmed Network Access was correctly set to `0.0.0.0/0` — ruled that out
2. Suspected mobile hotspot was blocking SRV-type DNS lookups (common with some carriers)
3. Tested manually with Windows' own DNS tool:
```powershell
   nslookup -type=SRV _mongodb._tcp.akr-studio-db.mzdvzln.mongodb.net
```
   This **succeeded** and returned all 3 shard hostnames correctly — proved the network itself wasn't blocking anything, and Windows could resolve it fine.
4. Concluded the issue was specific to **Node.js's own internal DNS resolver**, not the OS or network — a known quirk on some Windows + certain network combos.

**Fix applied:** forced Node to use Google's public DNS servers directly in code, bypassing whatever was failing internally:
```javascript
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
```
Added as the very first lines in `server.js`, before any other imports (must run before Mongoose tries to connect).

Re-ran `npm run dev` → connected successfully:

Server running on port 5000
MongoDB connected successfully

---

## Day 3 — Database models and Auth APIs

### Step 1: Created database models

**`models/User.js`** — represents both patients and staff (differentiated by `role` field)
Fields: `name`, `email` (unique), `password` (hashed, never stored raw), `phone`, `role` (`patient` or `staff`), `createdAt`

**`models/Doctor.js`** — hospital doctors
Fields: `name`, `specialization`, `avgConsultationTime` (minutes, used later by ML model), `roomNumber`, `isActive`

**`models/Appointment.js`** — links a patient to a doctor
Fields: `patient` (reference to User), `doctor` (reference to Doctor), `appointmentDate`, `status` (`waiting`/`in-progress`/`done`/`cancelled`), `isEmergency`, `predictedWaitTime` (filled by ML model later), `queuePosition`, `createdAt`

**Design decision:** No separate "Queue" collection. The queue is just "all appointments for a doctor today with status = waiting," sorted by position — simpler than keeping a second collection in sync with appointments.

### Step 2: Built database connection file
**`config/db.js`** — connects to MongoDB using the URI from `.env`, logs success or exits the process on failure (so the app doesn't run silently broken if the DB is unreachable).

### Step 3: Built Auth controller
**`controllers/authController.js`**
- `register`: checks if email already exists → hashes password with bcrypt (`bcrypt.hash(password, 10)`) → saves user → returns success + user ID
- `login`: finds user by email → compares hashed password with `bcrypt.compare` → if valid, signs a JWT token (`jwt.sign`) containing user ID and role, expires in 7 days → returns token + basic user info

### Step 4: Built Auth routes
**`routes/authRoutes.js`**

POST /api/auth/register  → authController.register
POST /api/auth/login     → authController.login

### Step 5: Wired everything into `server.js`
- Loads DNS fix (see above)
- Loads `.env` via `dotenv`
- Connects to MongoDB via `connectDB()`
- Sets up `cors` and JSON body parsing
- Mounts auth routes at `/api/auth`
- Starts server on port from `.env` (5000)

### Step 6: Tested end-to-end via Postman

**Register test:**
- `POST http://localhost:5000/api/auth/register`
- Body: sample patient (name, email, password, phone, role)
- Result: `201 Created`, returned `{ message: "User registered successfully", userId: "..." }`
- Verified in Atlas Data Explorer: user appears in `hospitalQueueDB.users`, password stored as bcrypt hash (`$2b$10$...`), not plain text

**Login test:**
- `POST http://localhost:5000/api/auth/login`
- Body: same email + password
- Result: returned valid JWT token + user object
- Confirmed auth flow works fully: register → hash password → store → login → verify password → issue token

**Status: Auth system fully working and verified.**

---

## Next planned steps
- [ ] Doctor APIs — add doctor, list doctors, get doctor by ID
- [ ] Appointment booking API
- [ ] Connect appointment creation to doctor + patient references
- [ ] Later: queue position calculation, emergency insert logic, ML `/predict` integration

---

## How to run this backend locally
```powershell
cd backend
npm install
npm run dev
```
Requires `.env` (not committed — ask Abhilash for values):

MONGO_URI=<mongodb atlas connection string>
PORT=5000
JWT_SECRET=<any secret string>

