# 🏥 Shridevi MediFlow AI — Patient Web Application
### Shridevi Hospital & Research Hospital, Sira Road, Tumakuru - 572106

The patient-facing web portal for **Shridevi MediFlow AI**, providing live OPD queue tracking, AI Random Forest wait-time predictions, Google Maps departure advice, and Dual-Channel (WhatsApp + SMS) mobile alerts.

---

## 🚀 Features

- **OPD Appointment Booking:** Real-time doctor & specialty selection with live Neon PostgreSQL queue token generation (`OPD-xxx`).
- **Digital Pass & PDF Export:** Printable digital appointment pass with QR code and hospital header.
- **AI Smart Departure Engine:** Synchronizes live road travel duration with OPD queue wait to calculate the optimal leave-home time.
- **Dual WhatsApp & SMS Alert Simulator:** Interactive smartphone mockup with real `wa.me` WhatsApp execution and 160-character GSM SMS previews.
- **Live Queue Progression:** 30-second polling sync against FastAPI backend with voice announcements (Web Speech API).
- **Multilingual Support:** English and Kannada language toggle.

---

## 🛠️ Tech Stack

- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS + Framer Motion
- **Icons:** Lucide React
- **HTTP Client:** Axios (with automatic Bearer JWT injection and resilient demo fallback)
- **PDF & Pass Generation:** `html2canvas` + `jspdf`

---

## 💻 Development & Execution

```powershell
# 1. Install dependencies
npm install

# 2. Start development server (Port 3000)
npm run dev

# 3. Production build
npm run build

# 4. Code quality check
npm run lint
```

---

## 📂 Project Architecture

```
patient-app/
├── src/
│   ├── components/       # Reusable UI (Navbar, Footer, MobileDispatchModal, Button, TopBar)
│   ├── context/          # Global State (AuthContext, QueueContext, LanguageContext)
│   ├── hooks/            # Custom React hooks (useNotification, etc.)
│   ├── pages/            # Application views (Home, Appointment, ArrivalPrediction, Notifications, etc.)
│   ├── services/         # API Layer (api.js, patientService.js, queueService.js, notificationService.js)
│   ├── utils/            # Constants, validators (Zod schemas), and PDF helpers
│   ├── App.jsx           # Root router and layout provider
│   └── main.jsx          # DOM Entrypoint
├── index.html            # HTML shell with Shridevi Hospital branding
└── package.json          # Dependency specifications
```
