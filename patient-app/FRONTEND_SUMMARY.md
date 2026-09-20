# Frontend Summary for MediFlow AI (Frontend)

This document describes the frontend of the project in simple English, using only the information found in the repository files under `src/`.

**Generated from files:**
- `src/` files scanned and referenced verbatim.

---

## 1. Frontend Overview

- **Frontend framework used:** React with `react-router-dom` for routing.
- **Styling used:** Tailwind CSS with custom CSS in `src/index.css` (Tailwind directives + custom utility classes). Also uses component-level classes and utility-first Tailwind classes. Some custom CSS classes include `.glass-panel`, `.glass-card`, `.ai-glow-*`.
- **Folder structure:** See section 2 below for full folder breakdown.
- **Overall architecture:** Single-page React application. Top-level `App.jsx` wraps the app with three Context providers (`AuthProvider`, `QueueProvider`, `LanguageProvider`) and `react-router-dom` `Routes` for page navigation. The `Layout` component conditionally shows the `Sidebar` for dashboard routes and always renders `Navbar` and `Footer`.

## 2. Project Structure (important folders & files)

- `src/`
  - Contains entry points, styles, contexts, hooks, services, utils, components, and pages.

- `src/main.jsx`
  - Bootstraps React and renders `<App />` into `#root`.

- `src/App.jsx`
  - Defines routing (`react-router-dom`) and layout logic. Wraps the app with `AuthProvider`, `QueueProvider`, and `LanguageProvider`.
  - Uses `Navbar`, `Footer`, and `Sidebar` (sidebar shown on dashboard routes).
  - Routes declared (see Routing section).

- `src/index.css`
  - Tailwind base/components/utilities and custom CSS rules. Defines dark mode body styles, custom scrollbars, glassmorphism styles (`.glass-panel`, `.glass-card`), glow utilities, and print styles.

- `src/context/`
  - `AuthContext.jsx` — authentication state (user, login, logout, demo mode). Persists `mediflow_user` in `localStorage`.
  - `QueueContext.jsx` — queue-related state (token numbers, patients ahead, estimates, auto-refresh, emergency count) with auto-refresh simulation and helper actions (`triggerEmergency`, `toggleAutoRefresh`, `advanceQueue`).
  - `LanguageContext.jsx` — language toggle state (`EN` or `KN`) and simple `t(key, fallback)` translator referencing `KANNADA_TRANSLATIONS`.

- `src/hooks/`
  - `useNotification.js` — fetches notifications from `notificationService`, manages loading and marking read.
  - `useQueue.js` — thin wrapper returning `useQueue` context.

- `src/services/`
  - `api.js` — Axios instance with `baseURL` from env `VITE_API_BASE_URL` fallback to `https://api.mediflow.ai/v1`. Adds Authorization header from `localStorage`, and response/request interceptors. Returns `response.data` on success.
  - `notificationService.js` — `getNotifications()` and `markAsRead(id)`, fallback to `RECENT_NOTIFICATIONS` constant on failure.
  - `patientService.js` — `login`, `registerPatient`, `getProfile`, `updateProfile`. On API failure uses `DEMO_PATIENT` fallback and returns generated demo responses.
  - `queueService.js` — `getQueueStatus(tokenNumber)` and `predictArrival()` with demo fallbacks.

- `src/utils/`
  - `constants.js` — project metadata, `DEMO_PATIENT`, `DEPARTMENTS`, `DOCTORS`, `RECENT_NOTIFICATIONS`, `HOSPITAL_STATS`, `KANNADA_TRANSLATIONS`.
  - `helpers.js` — utility functions: `formatMinutesToWords`, `getDepartureTimestamp`, `triggerConfetti`, `downloadAppointmentPDF` (uses `html2canvas` & `jsPDF`), `printElement`.
  - `validators.js` — Zod schemas for `loginSchema`, `registerSchema`, and `appointmentSchema`.

- `src/components/` (UI building blocks)
  - `Navbar.jsx`, `Footer.jsx`, `Sidebar.jsx`, `Hero.jsx`, `FeatureCard.jsx`, `DoctorCard.jsx`, `EmergencyAlert.jsx`, `Button.jsx`, `Input.jsx`, `Modal.jsx`, `LoadingSpinner.jsx`, `Card.jsx`, `QueueCard.jsx`, `ProgressCard.jsx`, `PatientCard.jsx`, `NotificationCard.jsx`, `StatusBadge.jsx`, `TopBar.jsx`, `SkeletonLoader.jsx`.

- `src/pages/`
  - `Home.jsx`, `Login.jsx`, `Register.jsx`, `Dashboard.jsx`, `QueueStatus.jsx`, `ArrivalPrediction.jsx`, `Notifications.jsx`, `Profile.jsx`, `Appointment.jsx`, `About.jsx`, `FAQ.jsx`, `Contact.jsx`, `NotFound.jsx`.

## 3. Every Page Explanation (file-by-file)

Note: Routes are defined in `src/App.jsx`. Each page component maps to a route.

- `src/pages/Home.jsx`
  - Route: `/`
  - Purpose: Landing page showcasing hero, metrics, features, doctors, departments, and a live-like simulation.
  - Components used: `Hero`, `FeatureCard`, `DoctorCard`, `EmergencyAlert`, `Button`.
  - Buttons: Filter department buttons, `Book OPD Appointment`, `Test "Leave Now" AI` (via `Hero`), Track token button in `Hero`.
  - Forms/Inputs: Department filter (buttons), token search input in `Hero`.
  - Outputs/Navigation: Navigates to `/appointment`, `/arrival-prediction`, `/queue-status`.

- `src/pages/Login.jsx`
  - Route: `/login`
  - Purpose: Login form for patient portal. Also provides a demo login button.
  - Components used: `Input`, `Button`.
  - Forms/Inputs: `emailOrPhone`, `password`. Uses `react-hook-form` + `zodResolver(loginSchema)` for validation.
  - On submit: Calls `login` from `AuthContext` (demo data used) and navigates to `/dashboard`.

- `src/pages/Register.jsx`
  - Route: `/register`
  - Purpose: Patient registration form which also generates an AI token (demo fallback).
  - Components used: `Input`, `Button`, `Modal`.
  - Forms/Inputs: Name, Age, Gender, Phone, Email, Blood Group, Emergency Contact, Department, Doctor, Appointment Date/Time, Symptoms, Address. Validation via `registerSchema` (Zod).
  - Submit: Calls `patientService.registerPatient` (falls back to demo response). On success: triggers `triggerConfetti()`, shows token modal, and calls `login` from `AuthContext`.

- `src/pages/Dashboard.jsx`
  - Route: `/dashboard`
  - Purpose: Patient dashboard showing live queue, progress, AI recommendations, and quick actions.
  - Components used: `TopBar`, `QueueCard`, `ProgressCard`, `EmergencyAlert`, `Button`, `StatusBadge`.
  - Navigation: Buttons link to arrival prediction, queue status, appointment, profile.
  - Inputs/Outputs: Reads `user` from `AuthContext` and `queueState` from `QueueContext`.

- `src/pages/QueueStatus.jsx`
  - Route: `/queue-status`
  - Purpose: Detailed queue status page with controls for auto-refresh, voice announcement simulation, and timeline.
  - Components used: `TopBar`, `ProgressCard`, `StatusBadge`, `Button`.
  - Logic: 30-second countdown when `isAutoRefresh` true, `handleAnnounce()` uses Web Speech API to speak announcement.
  - Controls: Pause/Resume Sync, Simulate Voice Announcement, Advance Queue.

- `src/pages/ArrivalPrediction.jsx`
  - Route: `/arrival-prediction`
  - Purpose: "Leave Now" AI departure countdown and route simulation. Shows recommended departure and travel estimates.
  - Components used: `TopBar`, `Button`.
  - Logic: Countdown timer state (`secondsLeft`) and `isDeparted` flag. Shows travel duration, OPD wait, distance, weather (demo).

- `src/pages/Notifications.jsx`
  - Route: `/notifications`
  - Purpose: Notification feed for leave now alerts, queue updates, and emergencies.
  - Components used: `TopBar`, `NotificationCard`, `Button`.
  - Logic: Uses `useNotification()` hook to fetch notifications and `markAsRead`.

- `src/pages/Profile.jsx`
  - Route: `/profile`
  - Purpose: Patient profile, editable contact details, QR code digital pass, and medical history placeholder.
  - Components used: `TopBar`, `PatientCard`, `Button`.
  - Inputs/Forms: Inline editing fields for name, phone, email, address. `handleSave()` updates `user` via `setUser` from `AuthContext`.
  - Utilities: `downloadAppointmentPDF` used to export profile as PDF.

- `src/pages/Appointment.jsx`
  - Route: `/appointment`
  - Purpose: Book OPD appointment form; generates a token (demo token) and shows confirmation modal with QR code.
  - Components used: `TopBar`, `Button`, `Modal`.
  - Forms/Inputs: Department, Doctor, Date, Time Slot, Symptoms. Validation via `appointmentSchema`.
  - On submit: triggers confetti, creates a `confirmedAppointment` object stored in component state and shows modal; provides PDF download and print.

- `src/pages/About.jsx`
  - Route: `/about`
  - Purpose: Project specs and team information; renders `PROJECT_INFO` constant details.
  - Components used: `TopBar`.

- `src/pages/FAQ.jsx`
  - Route: `/faq`
  - Purpose: Frequently asked questions with an accordion and search box.
  - Components used: `TopBar`.

- `src/pages/Contact.jsx`
  - Route: `/contact`
  - Purpose: Contact information and feedback form. On submit shows confirmation and triggers confetti.
  - Components used: `TopBar`, `Input`, `Button`.

- `src/pages/NotFound.jsx`
  - Route: `*` (fallback)
  - Purpose: 404 page. Contains a button to return to `/`.

## 4. Components (detailed)

Below is a concise list of components, file locations, purpose, props, state (if any), and where they are used.

- `Navbar` — `src/components/Navbar.jsx`
  - Purpose: Top navigation bar with brand, links, demo toggle, language toggle, theme toggle, notifications, profile link, mobile menu.
  - Props: none
  - State: `isDarkMode`, `isMobileMenuOpen`
  - Uses: `AuthContext`, `LanguageContext`, `useNotification` hook.
  - Where used: Rendered in `App.jsx` Layout for all routes.

- `Footer` — `src/components/Footer.jsx`
  - Purpose: Site footer with quick links, project credits, and emergency helpline.
  - Props: none
  - Where used: Rendered in `App.jsx` Layout for all routes.

- `Sidebar` — `src/components/Sidebar.jsx`
  - Purpose: Dashboard sidebar navigation for authenticated routes.
  - Props: none
  - Uses: `useAuth()`
  - Where used: Conditionally rendered in `App.jsx` Layout for dashboard routes.

- `Button` — `src/components/Button.jsx`
  - Purpose: Reusable button with variants and sizes.
  - Props: `variant`, `size`, `className`, `icon`, `disabled`, `onClick`, `type`
  - Where used: Nearly everywhere (Login, Register, Dashboard, forms).

- `Input` — `src/components/Input.jsx`
  - Purpose: Labeled input with optional icon and error message.
  - Props: `label`, `error`, `icon`, `type`, `placeholder`, `id`, `required` and forwarded props to input.
  - Where used: `Login`, `Register`, `Contact`, `Appointment`, `Profile`.

- `Modal` — `src/components/Modal.jsx`
  - Purpose: Animated modal wrapper. Closes on Escape and backdrop click.
  - Props: `isOpen`, `onClose`, `title`, `children`, `maxWidth`
  - Where used: `Register` (token modal), `Appointment` (confirmed token), and other modals.

- `Hero` — `src/components/Hero.jsx`
  - Purpose: Landing hero section with CTA, token display, and quick search.
  - Props: none
  - State: `searchToken`
  - Where used: `Home.jsx`.

- `FeatureCard` — `src/components/FeatureCard.jsx`
  - Purpose: Small card to show feature info.
  - Props: `icon`, `title`, `description`, `badge`, `color`
  - Where used: `Home.jsx`.

- `DoctorCard` — `src/components/DoctorCard.jsx`
  - Purpose: Doctor profile card with book button.
  - Props: `doctor`, `onBook`
  - Where used: `Home.jsx`, `Appointment.jsx` (list of doctors displayed there).

- `EmergencyAlert` — `src/components/EmergencyAlert.jsx`
  - Purpose: Banner for emergency override simulation.
  - Props: `count`, `onTriggerSimulation`
  - Where used: `Home.jsx`, `Dashboard.jsx`.

- `QueueCard` — `src/components/QueueCard.jsx`
  - Purpose: Live token summary showing your token and now-serving token.
  - Props: `queueData`
  - Where used: `Dashboard.jsx`.

- `ProgressCard` — `src/components/ProgressCard.jsx`
  - Purpose: Circular and linear progress UI showing queue progression and metrics.
  - Props: `tokenNumber`, `currentToken`, `numericToken`, `patientsAhead`, `estimatedWaitMinutes`, `emergencyCount`
  - Where used: `Dashboard.jsx`, `QueueStatus.jsx`.

- `PatientCard` — `src/components/PatientCard.jsx`
  - Purpose: Displays patient avatar and details.
  - Props: `patient`
  - Where used: `Profile.jsx`.

- `NotificationCard` — `src/components/NotificationCard.jsx`
  - Purpose: Displays a single notification entry and mark-as-read behavior.
  - Props: `notification`, `onMarkRead`
  - Where used: `Notifications.jsx`.

- `StatusBadge` — `src/components/StatusBadge.jsx`
  - Purpose: Small badge for token/queue status (Serving, Waiting, Delayed, Emergency, Completed).
  - Props: `status`, `size`
  - Where used: Many pages (`QueueCard`, `ProgressCard`, `QueueStatus`).

- `TopBar` — `src/components/TopBar.jsx`
  - Purpose: Page header with title and token indicator.
  - Props: `title`, `subtitle`
  - Uses: `useQueue()`
  - Where used: Most pages (Dashboard, QueueStatus, ArrivalPrediction, Notifications, Profile, etc.).

- `LoadingSpinner`, `Card`, `SkeletonLoader` — Utility UI components used across pages when needed.

## 5. Styling

- **Main CSS file:** `src/index.css` (includes Tailwind directives and custom classes)
- **Tailwind classes:** Widespread usage across all components (utility classes for layout, spacing, colors, responsive breakpoints, dark mode). Examples: `max-w-7xl`, `grid-cols-1 md:grid-cols-2`, `bg-slate-50`, `text-slate-900`, `dark:bg-slate-900`, `rounded-3xl`, etc.
- **Global styles:** Body background, dark mode base, scrollbar styling, glassmorphism classes (`.glass-panel`, `.glass-card`), glow classes (`.ai-glow-*`), print styles.
- **Component-specific styles:** Mostly implemented inline via Tailwind classes in JSX. No separate CSS modules per component.
- **Responsive design:** Uses Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) across layout and grids.
- **Animations:** `framer-motion` used for animated entrances and hover effects. Also CSS utility animations like `animate-pulse`, `animate-spin`.
- **Icons:** Uses `lucide-react` icons throughout components.
- **Colors & Fonts:** Tailwind color utilities and the default `font-sans` applied in `index.css`. Custom colors are applied via Tailwind classes and gradients.

## 6. Routing

- Routing uses `react-router-dom` `BrowserRouter` and `Routes` in `src/App.jsx`.
- Available routes and components:
  - `/` → `Home` (`src/pages/Home.jsx`)
  - `/login` → `Login` (`src/pages/Login.jsx`)
  - `/register` → `Register` (`src/pages/Register.jsx`)
  - `/dashboard` → `Dashboard` (`src/pages/Dashboard.jsx`)
  - `/queue-status` → `QueueStatus` (`src/pages/QueueStatus.jsx`)
  - `/arrival-prediction` → `ArrivalPrediction` (`src/pages/ArrivalPrediction.jsx`)
  - `/notifications` → `Notifications` (`src/pages/Notifications.jsx`)
  - `/profile` → `Profile` (`src/pages/Profile.jsx`)
  - `/appointment` → `Appointment` (`src/pages/Appointment.jsx`)
  - `/about` → `About` (`src/pages/About.jsx`)
  - `/faq` → `FAQ` (`src/pages/FAQ.jsx`)
  - `/contact` → `Contact` (`src/pages/Contact.jsx`)
  - `*` → `NotFound` (`src/pages/NotFound.jsx`)

- `Layout` in `App.jsx` checks current path and shows `Sidebar` for certain dashboard routes (`/dashboard`, `/queue-status`, `/arrival-prediction`, `/notifications`, `/profile`). `Navbar` and `Footer` are always present.

## 7. State Management

- React local component state (`useState`) is used for UI interactions across pages (e.g., `searchToken`, modals, form fields, countdowns, isEditing).
- `useEffect` used for side effects: fetching notifications, starting countdown timers, auto-refresh interval.

- Context API (global state):
  - `AuthContext` (`src/context/AuthContext.jsx`)
    - State: `user`, `isDemoMode`.
    - Why: Track logged-in user and demo mode across app.
    - Declared: `AuthProvider`.
    - Updated: `login()`, `logout()`, `toggleDemoMode()`.
  - `QueueContext` (`src/context/QueueContext.jsx`)
    - State: `queueState` object (tokenNumber, numericToken, currentToken, patientsAhead, estimatedWaitMinutes, doctor, department, roomNo, emergencyCount, lastUpdated, isAutoRefresh, leaveAfterMinutes, trafficDurationMinutes).
    - Why: Provide queue-related data to dashboard, queue pages, and arrival prediction; simulate auto-refresh and emergency insertions.
    - Declared: `QueueProvider`.
    - Updated: `setQueueState` inside interval auto-refresh, `triggerEmergency`, `toggleAutoRefresh`, `advanceQueue`.
  - `LanguageContext` (`src/context/LanguageContext.jsx`)
    - State: `language` ("EN" or "KN").
    - Why: Switch UI text to Kannada or use fallback English text via `t(key, fallback)`.
    - Declared: `LanguageProvider`.
    - Updated: `toggleLanguage()`.

- Custom Hooks:
  - `useNotification()` (`src/hooks/useNotification.js`): Manages `notifications` state and `loading`, provides `markAsRead` and `unreadCount`.
  - `useQueue()` (`src/hooks/useQueue.js`): Simple wrapper returning `useQueue` context.

## 8. API Calls (services)

All API calls are made via `src/services/api.js` Axios instance. Each service has demo fallbacks when API errors occur.

- `src/services/api.js`
  - Axios instance base URL: `import.meta.env.VITE_API_BASE_URL || 'https://api.mediflow.ai/v1'`.
  - Interceptor: adds `Authorization` header from `localStorage` key `mediflow_auth_token` if present.

- `src/services/notificationService.js`
  - `getNotifications()` → `GET /notifications` via `api.get('/notifications')`. Returns `RECENT_NOTIFICATIONS` constant if API fails.
  - `markAsRead(id)` → `PUT /notifications/${id}/read`.

- `src/services/patientService.js`
  - `login(credentials)` → `POST /auth/login`. Demo fallback returns `{ success: true, user: DEMO_PATIENT, token: 'demo-jwt-token-...' }`.
  - `registerPatient(formData)` → `POST /patients/register`. Demo fallback returns a generated patient object including `tokenNumber` and other queue info.
  - `getProfile()` → `GET /patients/profile`. Fallback returns `DEMO_PATIENT`.
  - `updateProfile(updates)` → `PUT /patients/profile`. Fallback returns success with merged `DEMO_PATIENT`.

- `src/services/queueService.js`
  - `getQueueStatus(tokenNumber)` → `GET /queue/status/${tokenNumber}`. Fallback returns snippet of `DEMO_PATIENT` queue data.
  - `predictArrival()` → `GET /ai/predict-arrival`. Fallback returns a demo object with `recommendedLeaveInMinutes`, `trafficDelayMinutes`, `queueWaitMinutes`, `distanceKm`, `trafficCondition`, `weather`, `optimalDepartureTime`, `estimatedArrivalTime`.

Why Demo Fallbacks: The app prints a console warning and operates in demo mode when back-end calls fail; many pages rely on demo data defined in `src/utils/constants.js`.

## 9. Forms

- Login form (`src/pages/Login.jsx`)
  - Fields: `emailOrPhone`, `password`.
  - Validation: `loginSchema` (Zod) via `zodResolver`.
  - Submit: calls `login` in `AuthContext` and navigates to `/dashboard`.
  - Errors: displayed inline by `Input` component.

- Register form (`src/pages/Register.jsx`)
  - Fields: `fullName`, `age`, `gender`, `phone`, `email`, `bloodGroup`, `department`, `doctor`, `appointmentDate`, `appointmentTime`, `symptoms`, `address`, `emergencyContact`.
  - Validation: `registerSchema` (Zod).
  - Submit: `patientService.registerPatient(formData)`; on success shows modal with generated token and calls `login`.
  - Error handling: validations surface inline; API errors are handled by fallback demo response.

- Appointment form (`src/pages/Appointment.jsx`)
  - Fields: `department`, `doctor`, `date`, `timeSlot`, `symptoms`.
  - Validation: `appointmentSchema`.
  - Submit: generates a demo token and shows confirmation modal; allows PDF download.

- Contact form (`src/pages/Contact.jsx`)
  - Fields: Name, Phone, Email, Message.
  - Behavior: On submit triggers confetti and shows a success message (no external API call in code).

Forms use `react-hook-form` + `@hookform/resolvers/zod` for validation.

## 10. Libraries Used (where and why)

| Library | Where Used | Why Used |
|---|---|---|
| react | App core (`src/main.jsx`, `src/App.jsx`, components) | UI library for building SPA |
| react-dom | Entry point (`src/main.jsx`) | DOM renderer |
| react-router-dom | `src/App.jsx` and throughout pages (`Link`, `Routes`) | Client-side routing |
| axios | `src/services/api.js` | HTTP client for API calls |
| tailwindcss | `src/index.css` and JSX classNames | Utility-first CSS framework for styling |
| framer-motion | Many components (`Button`, cards, modals) | Animations and transitions |
| lucide-react | Icons across UI (e.g., `Navbar`, pages) | Lightweight icon set |
| react-hook-form | Forms (`Login`, `Register`, `Appointment`) | Form state management |
| zod | `src/utils/validators.js` | Schema validation for forms |
| @hookform/resolvers | Connects `zod` to `react-hook-form` | Validation integration |
| qrcode.react | `Profile.jsx`, `Appointment.jsx` | Generate QR codes for passes/tokens |
| canvas-confetti | `src/utils/helpers.js` | Trigger confetti on successful token generation |
| html2canvas, jspdf | `helpers.js` | Export parts of the page as PDF |
| qrcode.react | `Profile.jsx`, `Appointment.jsx` | QR code rendering |

(These libraries are referenced in code; check `package.json` for exact versions.)

## 11. Code Flow (high level)

App starts
↓
`main.jsx` renders `<App />`
↓
`App.jsx` wraps children with `AuthProvider`, `QueueProvider`, `LanguageProvider` and configures `Router` and `Routes`
↓
`Navbar` (top) and `Footer` (bottom) always render; `Sidebar` renders for dashboard routes
↓
User navigates to a route (e.g., `/dashboard`) via `react-router-dom`
↓
Components read global state from `AuthContext` and `QueueContext` (e.g., `user`, `queueState`)
↓
Pages call services (`patientService`, `queueService`, `notificationService`) which use `api` (Axios) to contact back end; on failure, demo fallback objects are returned
↓
UI updates based on state, context, and API responses. Actions like `triggerEmergency`, `advanceQueue`, `toggleAutoRefresh` update `QueueContext` state and auto-refresh timers in `QueueContext` simulate queue advancement

## 12. Important Functions

Below are critical functions and where they live.

- `login(userData)` — `src/context/AuthContext.jsx`
  - Purpose: set `user` state; persist to `localStorage`.
  - Parameters: `userData`
  - Returns: none
  - Called from: `Login.jsx` (form submit), `Register.jsx` (after successful registration), `Navbar` (demo toggle sets demo user)

- `logout()` — `src/context/AuthContext.jsx`
  - Purpose: clear `user` state and `localStorage`
  - Called from: `Sidebar` logout button

- `toggleDemoMode()` — `src/context/AuthContext.jsx`
  - Purpose: toggle demo mode and ensure demo user is present
  - Called from: `Navbar` demo toggle button

- `triggerEmergency()` — `src/context/QueueContext.jsx`
  - Purpose: increment emergency count and increase estimated wait minutes
  - Called from: `EmergencyAlert` button on pages (e.g., `Home`, `Dashboard`)

- `toggleAutoRefresh()` — `src/context/QueueContext.jsx`
  - Purpose: toggle `queueState.isAutoRefresh` to start/stop the 30s auto-refresh
  - Called from: `QueueStatus.jsx` button

- `advanceQueue()` — `src/context/QueueContext.jsx`
  - Purpose: manually advance `currentToken` and recalculate `patientsAhead`
  - Called from: `QueueStatus.jsx` (`Advance Queue`)

- `getNotifications()` & `markAsRead(id)` — `src/services/notificationService.js`
  - Purpose: fetch notifications and mark notifications read on backend; fallback to demo data
  - Called from: `useNotification` hook

- `registerPatient(formData)` — `src/services/patientService.js`
  - Purpose: attempt to register a patient and issue a token; fallback to demo token
  - Called from: `Register.jsx` submit handler

- `downloadAppointmentPDF(elementId, filename)` — `src/utils/helpers.js`
  - Purpose: capture a DOM element as canvas and generate a PDF using `html2canvas` and `jsPDF`
  - Parameters: `elementId`, `filename`
  - Called from: `Register.jsx` modal (printable token), `Appointment.jsx` (download slip), `Profile.jsx` (export medical summary)

## 13. Reusable Components

Most components in `src/components/` are reusable. Notable ones reused frequently:
- `Button` — used across pages for actions
- `Input` — used in forms
- `Modal` — used for token & appointment confirmation
- `TopBar` — used as page header for many pages
- `StatusBadge` — used for status indicators
- `QueueCard`/`ProgressCard`/`PatientCard` — used in dashboards and profile

## 14. Assets

- **Images:** Doctor and patient avatars are external URLs embedded in `src/utils/constants.js` and used across doctor and patient cards.
- **Icons:** All icons come from `lucide-react` (imported by name where used).
- **Fonts:** The project uses Tailwind default `font-sans` (no custom font files in `src/`).
- **PDF/QR Generation:** `html2canvas`, `jsPDF` (`helpers.js`) and `qrcode.react` for QR codes.

## 15. Best Practices Observed

- Component separation: UI split into small components per file in `src/components/`.
- Folder organization: clear separation of `pages/`, `components/`, `context/`, `services/`, `utils/`, and `hooks/`.
- Reusable UI primitives: `Button`, `Input`, `Modal` used across pages.
- Form validation: `zod` schemas and `react-hook-form` with `zodResolver` for declarative validation.
- Demo fallbacks: Services return demo data when backend fails — allows the UI to function offline.
- Accessibility: Buttons and inputs have reasonable labels; modals respond to `Escape` key.
- Responsive design: Tailwind responsive utilities used across pages.

## 16. Complete Frontend Workflow (user journey)

1. User opens app at `/` (Home). Hero and live simulation present assigned token using `DEMO_PATIENT`.
2. User signs in via `/login` or uses Demo Login which sets `user` in `AuthContext`.
3. On login, user is redirected to `/dashboard` where `QueueContext` provides live queue data and `QueueCard`/`ProgressCard` visualizes status.
4. User can view detailed queue at `/queue-status`, simulate announcements, pause auto-refresh, or advance queue.
5. User may go to `/arrival-prediction` to see recommended departure time with countdown and confirm "Leave Now".
6. User can book appointment at `/appointment` or register as a new patient at `/register`. Submission creates a token (demo fallback) and shows a modal or downloadable PDF.
7. Notifications at `/notifications` are loaded via `useNotification` which fetches from `notificationService`.
8. User profile at `/profile` displays personal info, editable fields, QR pass, and PDF export.

## 17. Summary (Beginner-friendly)

This frontend is a React single-page application built with Tailwind CSS for styling and `react-router-dom` for navigation. The app uses small, reusable components (buttons, inputs, cards) and context providers to share user and queue state across the UI.

Services use Axios to call backend APIs. If the backend is unavailable, pre-defined demo data in `src/utils/constants.js` keeps the UI functional for demos. Forms use `react-hook-form` and `zod` for validation. Animations are handled by `framer-motion` and icons by `lucide-react`.

Files of interest to start exploring:
- [src/App.jsx](src/App.jsx#L1)
- [src/index.css](src/index.css#L1)
- [src/context/AuthContext.jsx](src/context/AuthContext.jsx#L1)
- [src/context/QueueContext.jsx](src/context/QueueContext.jsx#L1)
- [src/pages/Dashboard.jsx](src/pages/Dashboard.jsx#L1)
- [src/pages/Register.jsx](src/pages/Register.jsx#L1)

---

If you'd like, I can:
- Open the app in your default browser now (http://localhost:3000/). 
- Run `npm audit fix` to address vulnerabilities. 
- Create an additional developer markdown linking each component to its file lines.

