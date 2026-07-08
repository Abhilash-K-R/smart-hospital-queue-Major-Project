# Backend — Smart Hospital Queue System

Express + MongoDB backend for the hospital queue prediction system.

## Tech stack
- Node.js + Express
- MongoDB Atlas (Mongoose)
- JWT for authentication
- bcrypt for password hashing

## Setup instructions

### 1. Install dependencies
```powershell
cd backend
npm install
```

### 2. Create `.env` file
Create a `.env` file inside `backend/` (this file is git-ignored, never commit it):

MONGO_URI=<ask Abhilash for the connection string>
PORT=5000
JWT_SECRET=<any secret string, ask Abhilash for the shared one>

### 3. Run the server
```powershell
npm run dev
```
You should see:

Server running on port 5000
MongoDB connected successfully

If you get a `querySrv ECONNREFUSED` error (common on mobile hotspot), see the fix already applied in `server.js` — Google DNS is set manually to work around it. If it still fails, check `PROGRESS.md` for the full debugging steps.

### 4. Test it's working
- Browser: `http://localhost:5000/` → should show `Smart Hospital Queue API is running`
- Postman: `POST http://localhost:5000/api/auth/register` with a sample user JSON body

## Folder structure

backend/
├── config/        # database connection setup
├── controllers/    # route logic (auth, doctors, etc.)
├── models/          # Mongoose schemas (User, Doctor, Appointment)
├── routes/          # API endpoint definitions
├── server.js         # entry point
├── .env             # secrets (not committed)
└── PROGRESS.md       # detailed build log — read this for full context

## API endpoints (so far)

| Method | Endpoint              | Description                  |
|--------|------------------------|-------------------------------|
| POST   | `/api/auth/register`  | Register a new user           |
| POST   | `/api/auth/login`     | Login, returns JWT token      |

More endpoints added as Doctor and Appointment APIs are built — see `PROGRESS.md` for latest status.

