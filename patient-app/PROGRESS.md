# Patient App Frontend Progress Log

## Ownership

- **Owner:** Laxuman
- **Team role:** Patient app frontend
- **Branch:** `patient-app`
- **Folder required by the team guide:** `patient-app/`
- **Current implementation location:** `patient-app/src/`
- **Last updated:** 2026-09-10

## Important Repository Note

The patient frontend is now self-contained in `patient-app/`. Its `package.json`, `package-lock.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/`, `dist/`, `FRONTEND_SUMMARY.md`, and this progress log are all inside the folder. The repository root remains reserved for shared project documentation and teammate-owned folders.

Run all patient frontend commands from `patient-app/`. Because Vite, Tailwind, the HTML entry point, and source imports use paths relative to this folder, teammates can merge `patient-app/` independently without importing files from the repository root.

## What Was Built

This branch contains a React single-page patient portal for the MediFlow AI smart hospital queue system. The patient can:

1. Browse the hospital landing page, departments, doctors, project information, FAQ, and contact details.
2. Log in using a real API when available or use the built-in demo patient when the API is unavailable.
3. Register as a patient and request an OPD appointment.
4. Receive a token number and see the appointment confirmation in a modal with QR/PDF/print actions where supported.
5. Open a dashboard with the current token, patients ahead, estimated wait, doctor, room, and emergency queue information.
6. Inspect detailed queue status and manually simulate queue advancement, auto-refresh, and a voice announcement.
7. Use the arrival prediction screen to see the recommended departure time, travel duration, queue wait, distance, weather, and countdown.
8. Read notifications and mark them as read.
9. View and edit the patient profile and export a digital appointment/profile pass.
10. Switch between English and the available Kannada translations, and switch the visual theme from the navigation bar.

The application is intentionally demo-friendly: service calls attempt the backend first and return local demo data when the backend is missing, unreachable, or returns an error. This allows the UI to be demonstrated independently while the backend, database, ML model, and maps work are being integrated.

## Architecture

### Bootstrap and layout

- `src/main.jsx` mounts `<App />` into the `#root` element and loads global CSS.
- `src/App.jsx` composes `AuthProvider`, `QueueProvider`, and `LanguageProvider` around the router.
- `Layout` always renders `Navbar` and `Footer`.
- Dashboard routes additionally render `Sidebar` beside the page content:
  - `/dashboard`
  - `/queue-status`
  - `/arrival-prediction`
  - `/notifications`
  - `/profile`
- Public/utility pages use the simpler full-width layout.

### State ownership

- **Authentication:** `src/context/AuthContext.jsx`
  - Stores the current patient as `user`.
  - Persists the user under `localStorage` key `mediflow_user`.
  - Exposes `login`, `logout`, `setUser`, `isDemoMode`, and `toggleDemoMode`.
  - The current default behavior starts with `DEMO_PATIENT`, so the dashboard is available for demonstrations without a login server.

- **Queue:** `src/context/QueueContext.jsx`
  - Owns token number, numeric token, currently serving token, patients ahead, estimated wait, doctor, department, room, emergency count, last update time, and auto-refresh state.
  - Auto-refresh simulates progress every 30 seconds while enabled.
  - Exposes `triggerEmergency`, `toggleAutoRefresh`, and `advanceQueue`.
  - This is currently a frontend simulation. The backend/ML integration should eventually replace or reconcile this state with server responses.

- **Language:** `src/context/LanguageContext.jsx`
  - Owns `EN`/`KN` language state.
  - Exposes `toggleLanguage` and `t(key, fallback)`.
  - Kannada strings are read from `KANNADA_TRANSLATIONS` in `src/utils/constants.js`; missing translations use the supplied fallback text.

### Data and service boundary

`src/services/api.js` creates the shared Axios client.

- Base URL: `import.meta.env.VITE_API_BASE_URL` when supplied.
- Default base URL: `https://api.mediflow.ai/v1`.
- Timeout: 10 seconds.
- Adds `Authorization: Bearer <token>` from `localStorage` key `mediflow_auth_token`.
- Successful responses are unwrapped to `response.data`.
- Failed responses are rejected after logging a demo-mode warning. Individual service methods own their fallback behavior.

The frontend currently expects these API endpoints:

| Frontend method | HTTP endpoint | Expected purpose |
|---|---|---|
| `patientService.login` | `POST /auth/login` | Authenticate a patient and return user/token data |
| `patientService.registerPatient` | `POST /patients/register` | Register patient and create/book an appointment |
| `patientService.getProfile` | `GET /patients/profile` | Return the authenticated patient profile |
| `patientService.updateProfile` | `PUT /patients/profile` | Update patient profile fields |
| `queueService.getQueueStatus` | `GET /queue/status/:tokenNumber` | Return live queue state for a token |
| `queueService.predictArrival` | `GET /ai/predict-arrival` | Return departure, traffic, queue, and arrival prediction |
| `notificationService.getNotifications` | `GET /notifications` | Return patient notifications |
| `notificationService.markAsRead` | `PUT /notifications/:id/read` | Mark one notification read |

The backend team should preserve these paths or update the service modules and this document together. The frontend expects JSON objects with the fields consumed by the pages; the demo fallback objects in `patientService.js` and `queueService.js` are the clearest current examples of the minimum shape.

## Route and Screen Handoff

| Route | File | Responsibility | Main dependencies |
|---|---|---|---|
| `/` | `src/pages/Home.jsx` | Landing page, department filtering, doctor list, quick actions, emergency simulation | `DEPARTMENTS`, `DOCTORS`, `HOSPITAL_STATS`, reusable cards |
| `/login` | `src/pages/Login.jsx` | Patient login and demo login | `loginSchema`, `AuthContext`, `patientService` |
| `/register` | `src/pages/Register.jsx` | Patient registration and appointment request | `registerSchema`, `patientService`, `Modal`, `triggerConfetti` |
| `/dashboard` | `src/pages/Dashboard.jsx` | Patient overview of queue and appointment | `AuthContext`, `QueueContext`, queue cards |
| `/queue-status` | `src/pages/QueueStatus.jsx` | Detailed queue state, auto-refresh, voice announcement, manual advance | `QueueContext`, Web Speech API |
| `/arrival-prediction` | `src/pages/ArrivalPrediction.jsx` | Leave-now recommendation and countdown | `queueService`, `QueueContext`, timer state |
| `/notifications` | `src/pages/Notifications.jsx` | Notification list and unread state | `useNotification`, `NotificationCard` |
| `/profile` | `src/pages/Profile.jsx` | Profile display/editing and digital pass export | `AuthContext`, `PatientCard`, PDF helper |
| `/appointment` | `src/pages/Appointment.jsx` | OPD appointment form and confirmation | `appointmentSchema`, `DOCTORS`, QR code, PDF/print helpers |
| `/about` | `src/pages/About.jsx` | Project/team/system information | `PROJECT_INFO` |
| `/faq` | `src/pages/FAQ.jsx` | Searchable FAQ accordion | local FAQ data and component state |
| `/contact` | `src/pages/Contact.jsx` | Contact details and feedback form | `Input`, `Button`, confetti helper |
| `*` | `src/pages/NotFound.jsx` | Unknown-route fallback | React Router navigation |

`About.jsx` exists but is not currently registered as a route in `src/App.jsx`. Add a route before expecting `/about` to render it.

## Reusable UI Components

- `Navbar.jsx`: global navigation, theme toggle, language toggle, demo mode toggle, notification count, mobile menu, profile access.
- `Footer.jsx`: global footer and emergency/contact information.
- `Sidebar.jsx`: dashboard navigation and patient identity summary.
- `TopBar.jsx`: page heading and current token indicator.
- `Button.jsx`: shared button variants, sizes, icons, disabled state, and click/type forwarding.
- `Input.jsx`: labeled form input with icon, required state, and validation error display.
- `Modal.jsx`: animated dialog with Escape and backdrop-close behavior.
- `Hero.jsx`: landing CTA area and token lookup entry point.
- `FeatureCard.jsx`: feature/value item used on the home page.
- `DoctorCard.jsx`: doctor identity, department, availability, rating, queue, and booking action.
- `EmergencyAlert.jsx`: emergency queue simulation banner/action.
- `QueueCard.jsx`: compact current-token and queue summary.
- `ProgressCard.jsx`: visual queue progression and wait metrics.
- `PatientCard.jsx`: patient identity and profile summary.
- `NotificationCard.jsx`: notification row with read action.
- `StatusBadge.jsx`: common queue/status label presentation.
- `LoadingSpinner.jsx`, `SkeletonLoader.jsx`, and `Card.jsx`: loading and layout primitives.

Components are styled with Tailwind utility classes, `src/index.css`, `framer-motion`, and `lucide-react` icons. No component-specific CSS module is currently used.

## Constants, Validation, and Helpers

- `src/utils/constants.js` contains project metadata, the demo patient, departments, doctors, recent notifications, hospital statistics, and Kannada translations.
- `src/utils/validators.js` defines Zod schemas for login, registration, and appointments. Form pages use these schemas through `react-hook-form` and `zodResolver`.
- `src/utils/helpers.js` contains minute formatting, departure-time calculation, confetti, appointment/profile PDF generation with `html2canvas` and `jspdf`, and print support.

The demo patient and demo content are not production patient records. Before deployment, replace public demo identity/data, move user-specific data to authenticated API responses, and audit all remote image URLs and generated documents.

## Run Locally

From the repository root, enter the patient frontend folder first:

```powershell
cd patient-app
npm install
npm run dev
```

The Vite development server currently runs at `http://localhost:3000/` in this workspace. Use another port if that port is occupied:

```powershell
npm run dev -- --port 3001
```

Useful checks:

```powershell
npm run build
npm run lint
```

The root project no longer owns the patient frontend package. The runnable frontend package is `patient-app/package.json`.

## Demo Walkthrough For Teammates

1. Open `/` and inspect the department filter, doctor cards, emergency simulation, and quick actions.
2. Use the navigation or `/login` and select the demo login path.
3. Open `/dashboard` to see the queue and estimated wait.
4. Open `/queue-status` and try pause/resume auto-refresh, manual queue advancement, and voice announcement. Voice requires browser speech synthesis support.
5. Open `/arrival-prediction` to inspect the leave-now countdown and demo travel values.
6. Open `/notifications` and mark an item read. The notification hook provides local fallback data if the API is unavailable.
7. Open `/profile`, edit contact fields, save, and test the digital pass export.
8. Open `/appointment`, submit valid form data, then test QR, PDF, and print actions from the confirmation modal.
9. Stop or misconfigure the backend and repeat the flow. The UI should continue using demo fallbacks, with a warning in the browser console.

## Integration Instructions For Teammates

### Backend/API owner

- Implement the endpoint paths listed above or coordinate corresponding frontend changes.
- Return stable JSON field names matching the demo response shapes.
- Return an authentication token and patient object from login/register.
- Ensure queue responses include token, current token, patients ahead, estimated wait, doctor, department, room, emergency count, and update time.
- Ensure prediction responses include departure delay, traffic duration, queue wait, distance, traffic condition, weather, and estimated times.
- Configure the frontend with `VITE_API_BASE_URL` in a local `.env` file; do not commit secrets.
- Decide whether the frontend should retain demo fallback in production or fail visibly when the API is unavailable.

### ML owner

- The patient screen consumes the prediction through `GET /ai/predict-arrival`.
- Keep the ML output translated into the frontend field names at the backend boundary. The React screens should not need to know the model implementation or feature names.
- Document units explicitly: minutes for wait/delay/duration, kilometers for distance, and display-ready or ISO-compatible timestamps for times.

### Staff dashboard/maps owner

- Emergency insertion should update the queue source used by `GET /queue/status/:tokenNumber`.
- Maps/travel calculations should feed the prediction endpoint; the patient app should receive a summarized response rather than Google Maps credentials or raw provider details.
- Keep token progression and emergency count consistent between staff and patient views.

## Current Limitations and Follow-Up Work

1. **Folder alignment:** The active frontend is now correctly contained in `patient-app/`. Future patient frontend changes should remain inside this folder so teammate merges stay isolated.
2. **Authentication protection:** Routes are registered but there is no route guard that redirects unauthenticated users. The default demo patient makes this easy to miss.
3. **Demo-first state:** Queue progression is simulated in `QueueContext`; it is not yet synchronized with the backend on a timer.
4. **Demo fallback masking:** API errors fall back to mock data. Add a visible production error state and telemetry before deployment.
5. **Token persistence:** `AuthContext` persists the user, while the Axios token is read from `mediflow_auth_token`; login flow should persist the real API token when backend authentication is connected.
6. **Route registration:** `About.jsx` is implemented but missing from `App.jsx` routes.
7. **Form submission:** Contact feedback is currently a UI confirmation flow; it needs a backend endpoint if feedback must be stored.
8. **Accessibility:** Add automated keyboard, screen-reader, focus, and color-contrast checks for modals, forms, navigation, and dynamic queue updates.
9. **Testing:** Add unit tests for validators, queue calculations, service fallbacks, contexts, and the main appointment/login flows; add a browser smoke test for the critical patient journey.
10. **External assets:** Several avatars use remote Unsplash URLs. Replace or formally approve these assets for an offline/demo package.
11. **Production privacy:** Remove hard-coded demo personal details, review PDF contents, and ensure no sensitive patient information is logged.

## Change Record For This Update

- Added this patient frontend handoff log under `patient-app/PROGRESS.md`.
- Moved the complete runnable frontend from the repository root into `patient-app/`.
- Updated this log to document the self-contained package location and teammate merge boundary.
- Documented the complete route map, component responsibilities, context ownership, service/API contract, demo fallback behavior, run commands, teammate integration instructions, limitations, and next steps.
- The existing application was started with `npm run dev -- --host 0.0.0.0`; Vite reported the local URL `http://localhost:3000/`.
- Before committing, run `npm run build` and `npm run lint`, review the diff, then commit this log and any source documentation changes as one focused frontend progress update.
