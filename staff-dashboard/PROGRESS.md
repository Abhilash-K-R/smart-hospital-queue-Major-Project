# Progress Log

## Initial Project Setup and Core Architecture

### What was built/fixed today
I have completely bootstrapped (started from scratch) the **Staff Dashboard** application. This dashboard will be the main interface for our clinic/hospital staff to log in, view patient metrics, manage the patient queue, respond to emergencies, and map patient symptoms. 

Today's work focused on setting up the underlying "plumbing" of the app so that we have a solid, understandable foundation to build features upon. 

### Step-by-Step Detailed Breakdown
Here is exactly what I did, in order, so anyone on the team can reproduce or understand the setup:

1. **Project Creation (The Foundation):** 
   - I used a tool called **Vite** to create a new React application. Vite is essentially a modern local server that bundles our code and serves it to the browser. I chose this because it is extremely fast and updates the screen instantly when we save a file.
   - Command run: `npm create vite@latest staff-dashboard -- --template react`

2. **Installing Required Libraries:** 
   I installed several third-party packages that we will rely on heavily. If you see these in the code, here is what they do:
   - `react-router-dom`: This controls the "pages" of our app. Since this is a Single Page Application (SPA), we don't actually reload the browser to change pages. This library listens to the URL and shows the correct component.
   - `tailwindcss`, `postcss`, and `autoprefixer`: These are used for styling. Instead of writing separate CSS files, Tailwind allows us to style our app directly inside our JavaScript files using predefined classes (like `bg-red-500` for a red background).
   - `lucide-react`: A library that gives us access to a huge set of beautiful, consistent icons for our buttons and menus.
   - `recharts`: A library we will use to draw graphs and charts on the main dashboard screen.
   - `axios`: A tool used to make HTTP network requests (like fetching patient data) to our backend server.

3. **Routing Configuration (How Navigation Works in `App.jsx`):**
   - I set up two main types of routes in the app:
     - **Public Route:** The `/login` page (`Login.jsx`). Anyone can see this page.
     - **Protected Routes:** Every other page. I created a special component called `<ProtectedRoute>`. Its job is to check if a user is successfully logged in. If they aren't, it immediately redirects them back to the login page.
   
4. **Layout and Navigation Structure (The Shell):**
   - I built the main visual shell of the application in `Layout.jsx`. 
   - The layout uses a "Flexbox" design. It has a **Sidebar** (`Sidebar.jsx`) fixed to the left side for navigation, and a **Header** (`Header.jsx`) at the top for user profiles or global settings.
   - The center of the screen uses an `<Outlet />`. Think of this as a blank canvas where `react-router-dom` paints the specific page (Dashboard, Queue, etc.) based on what link the user clicked.

5. **Scaffolding the Core Feature Pages:**
   I created empty placeholder files for the main features of our app so the team can start filling them in:
   - `Dashboard.jsx`: This will show the high-level metrics (e.g., total patients today) and charts.
   - `Queue.jsx`: This will be the list where staff can see who is waiting and assign tasks.
   - `Emergency.jsx`: A screen specifically designed to handle high-priority, critical alerts (like a Code Blue).
   - `SymptomMapping.jsx`: A tool staff will use to input patient symptoms and get potential condition mappings.

### Why these decisions were made (Context for Teammates)
- **Why Tailwind CSS?** It speeds up development massively. Teammates won't have to guess what CSS class names to use or worry about breaking styles on one page while editing another, because the styles are scoped directly to the HTML elements.
- **Why the `<ProtectedRoute>` component?** By wrapping all our internal pages in this one component, we ensure we never accidentally expose a sensitive page to the public. The security check happens in one single, easy-to-manage place.
- **Why a separate Layout component?** This ensures that the Sidebar and Header don't need to be imported onto every single page manually. They stay on screen permanently, and only the center content changes, which is faster and cleaner for development.

### Next Steps (What's coming next)
- **Authentication:** We need to write the actual logic inside `Login.jsx` to talk to our backend API, verify credentials, and store a "token" so the `<ProtectedRoute>` knows the user is logged in.
- **API Connection:** We need to use `axios` to start pulling real data from the backend into our `Dashboard` and `Queue` pages.
- **UI Polish:** We will begin styling the individual pages using Tailwind to match our design mockups.

---

## Phase 4 — Patient App & Google Maps / GPS Live Departure Tracking
**Date:** 28 August 2026  
**Branch:** `staff-dashboard-naveen`  
**Owner:** Naveen

### What was built/fixed today
I developed and integrated the **Patient App (`patient-app`)** with live queue tracking, browser GPS geolocation, and intelligent departure time calculation powered by Google Maps and travel-time services.

Patients can now track their position in the hospital queue in real-time, view dynamic wait predictions (from the Phase 3 ML model), and receive intelligent departure recommendations based on their live distance and traffic conditions.

### Step-by-Step Detailed Breakdown

1. **Patient App Bootstrapping & Styling Setup:**
   - Initialized a modern React Single Page Application in `patient-app/` using Vite, Tailwind CSS, PostCSS, and Lucide React icons.
   - Configured custom theme tokens with smooth slate and teal healthcare palettes, clean typography (Plus Jakarta Sans), and responsive mobile-first layouts.
   - Fixed standard HTML5 void element syntax in `patient-app/index.html` (standardizing `<meta>` and `<link>` tags for strict validator/linter compatibility).

2. **Browser Geolocation & Tracking Service (`src/services/location.js`):**
   - Built a robust Geolocation service interfacing with the HTML5 `navigator.geolocation` API.
   - Added `checkLocationPermission()` to inspect browser permissions (`granted`, `prompt`, `denied`).
   - Created `getCurrentCoordinates()` with `enableHighAccuracy: true` and comprehensive error handling (denied permissions, timeout, device unavailable).
   - Added `watchPatientPosition()` for continuous real-time coordinate streaming.
   - Provided fallback reference coordinates for SIET Hospital Tumakuru (`13.340881, 77.100601`) and demo coordinates for local testing without physical travel.

3. **API Client & Backend Communication (`src/services/api.js`):**
   - Set up Axios client with request interceptors for automatic JWT authentication token attachment.
   - Created endpoint service helpers:
     - `calculateDeparture()`: Sends appointment ID and live GPS coordinates to calculate optimal leave time.
     - `getQueueStatus()`: Fetches real-time queue length, current token being served, and estimated consultation time.
     - `getDepartments()` and `getDoctors()`: Fetches hospital directory data.

4. **Live Queue & Departure Tracker Component (`src/components/QueueTracker.jsx`):**
   - Built an interactive UI displaying:
     - **Queue status cards:** Live Token Number, Current Serving Token, Patients Ahead, Estimated Wait Time.
     - **Smart Departure Advisor:** Compares current time with estimated consultation time minus travel time and buffer, giving clear indicators (e.g., *"Leave Now"*, *"Leave in 15 mins"*, or *"You have arrived"*).
     - **Travel & Traffic Details:** Distance in km, driving duration with traffic, and navigation route link to Google Maps.
     - **Live Location Status Banner:** Visual badge showing GPS lock status and accuracy.

### Decisions & Design Rationale
- **Why high-accuracy GPS with fallback?** Real-time GPS gives accurate ETAs, but mobile browsers or testing environments can block geolocation. Providing clear permission status and mock coordinates ensures the app works smoothly in both testing and production.
- **Why dynamic departure calculation?** Hospital queues are unpredictable. If the queue moves faster or an emergency causes a delay, calculating the departure time dynamically based on `(Consultation ETA - Travel Duration - Buffer)` prevents patients from waiting idly in crowded waiting rooms.

### What's Next
- Wire the frontend departure calculation directly to backend's live FastAPI Google Distance Matrix route.
- Implement Push Notifications / SMS alerts when the calculated departure threshold is reached.
- Connect staff queue management actions (calling next token, emergency insertion) so the patient view updates instantly via WebSockets or polling.

---

## Phase 6 — Staff Dashboard & Emergency Queue Control
**Date:** 11 September 2026  
**Branch:** `dev-abhi`  
**Owner:** Naveen & Abhilash

### What was built/fixed today
We completed the full frontend implementation and live backend integration of the **Staff Dashboard** (`staff-dashboard`), connecting it directly to FastAPI on port 8000 and the live Neon PostgreSQL database.

### Step-by-Step Detailed Breakdown

1. **Authentication & Session Persistence (`src/services/auth.js` & `src/pages/Login.jsx`):**
   - Connected `auth.js` to real backend endpoints (`POST /auth/staff/login` and `/token`).
   - Added automatic token storage in `localStorage` (`token` and `staff_user`) so sessions survive page refreshes.
   - Updated `Header.jsx` to dynamically show the logged-in staff member's name and role badge (e.g., Reception Desk / Admin).

2. **Live Queue Management (`src/pages/Queue.jsx`):**
   - Wired live queue table to `GET /staff/queue` with automatic polling every 10 seconds.
   - Implemented "Call Next Patient" action calling `POST /staff/queue/call-next`, seamlessly moving the next waiting patient into the consultation room (Position 0).
   - Added status transition triggers (`PUT /staff/appointments/{id}/status`) allowing staff to mark consultations as Completed or Skipped with immediate database queue advancement.
   - Real-time display of triage severity (`Critical` in bold red, `Urgent` in amber, `Standard` in green) and dynamic Random Forest ML predicted wait times.

3. **Emergency Walk-in Triage (`src/pages/Emergency.jsx`):**
   - Connected emergency admission form to `POST /staff/emergency-insert`.
   - Populated doctor select dropdown dynamically via `GET /staff/doctors`.
   - Supports entering vital signs (Blood Pressure, Heart Rate, SpO2, Temperature) and chief clinical complaints.
   - Submitting an emergency places the critical patient immediately at **Queue Position #1**, pushing back regular outpatient appointments and recalculating wait times across both staff and patient interfaces.

4. **Hospital Operations KPIs (`src/pages/Dashboard.jsx`):**
   - Wired KPI cards (Total Patients Today, Currently Waiting, Average Wait Time, Emergency Cases Count) directly to `GET /staff/stats`.
   - Integrated live activity audit stream showing real-time emergency triage admissions and completed consultations.

5. **AI Symptom Classifier & Triage (`src/pages/SymptomMapping.jsx`):**
   - Connected symptom input textarea to `POST /staff/symptom-analyze`.
   - Returns ranked specialty recommendations (Cardiology, Pulmonology, General Medicine) with percentage match confidence, severity indicators, and clinical explanations.

6. **Build & Quality Assurance:**
   - Ran `npm run build` — 213 dependencies resolved, clean bundle built in 15.69s with 0 errors.
   - Verified running concurrently with `patient-app` on port 3000 and FastAPI on port 8000.

7. **Live Queue Table Action Controls & Status Updates:**
   - Fortified `updateStatus()` in `Queue.jsx` to pass `{ appointment_id: id, action }` payload, resolving backend 422 validation.
   - Added immediate visual loading feedback on action buttons (`Saving...`, `Skipping...`, `Serving...`) with disabled state during in-flight network requests to prevent duplicate submissions.
   - Added per-row **"Serve"** button for waiting patients alongside **"Complete"** and **"Skip"**, providing granular triage flow directly from the queue table.
   - Verified that marking a patient as completed or skipped immediately clears them from the active queue table and promotes subsequent patients forward.

---

## Phase 7 — Doctor Disruption Management & Post-Consultation Model Telemetry
**Date:** 11 September 2026  
**Branch:** `dev-abhi`  
**Owner:** Naveen & Abhilash  

### What was built/fixed today
Enhanced the Staff Operations Dashboard (`staff-dashboard`) with live doctor disruption controls and post-consultation evaluation logging:

1. **Doctor Disruption & Delay Management UI (`src/pages/Dashboard.jsx`):**
   - Added an operational controls card displaying all registered OPD doctors, their current queue load, and consultation speeds.
   - Status indicators dynamically distinguish between `Active` (green badge), `Delayed (+Xm)` (amber pulsing badge), and `On Break` (slate badge).
# Progress Log

## Initial Project Setup and Core Architecture

### What was built/fixed today
I have completely bootstrapped (started from scratch) the **Staff Dashboard** application. This dashboard will be the main interface for our clinic/hospital staff to log in, view patient metrics, manage the patient queue, respond to emergencies, and map patient symptoms. 

Today's work focused on setting up the underlying "plumbing" of the app so that we have a solid, understandable foundation to build features upon. 

### Step-by-Step Detailed Breakdown
Here is exactly what I did, in order, so anyone on the team can reproduce or understand the setup:

1. **Project Creation (The Foundation):** 
   - I used a tool called **Vite** to create a new React application. Vite is essentially a modern local server that bundles our code and serves it to the browser. I chose this because it is extremely fast and updates the screen instantly when we save a file.
   - Command run: `npm create vite@latest staff-dashboard -- --template react`

2. **Installing Required Libraries:** 
   I installed several third-party packages that we will rely on heavily. If you see these in the code, here is what they do:
   - `react-router-dom`: This controls the "pages" of our app. Since this is a Single Page Application (SPA), we don't actually reload the browser to change pages. This library listens to the URL and shows the correct component.
   - `tailwindcss`, `postcss`, and `autoprefixer`: These are used for styling. Instead of writing separate CSS files, Tailwind allows us to style our app directly inside our JavaScript files using predefined classes (like `bg-red-500` for a red background).
   - `lucide-react`: A library that gives us access to a huge set of beautiful, consistent icons for our buttons and menus.
   - `recharts`: A library we will use to draw graphs and charts on the main dashboard screen.
   - `axios`: A tool used to make HTTP network requests (like fetching patient data) to our backend server.

3. **Routing Configuration (How Navigation Works in `App.jsx`):**
   - I set up two main types of routes in the app:
     - **Public Route:** The `/login` page (`Login.jsx`). Anyone can see this page.
     - **Protected Routes:** Every other page. I created a special component called `<ProtectedRoute>`. Its job is to check if a user is successfully logged in. If they aren't, it immediately redirects them back to the login page.
   
4. **Layout and Navigation Structure (The Shell):**
   - I built the main visual shell of the application in `Layout.jsx`. 
   - The layout uses a "Flexbox" design. It has a **Sidebar** (`Sidebar.jsx`) fixed to the left side for navigation, and a **Header** (`Header.jsx`) at the top for user profiles or global settings.
   - The center of the screen uses an `<Outlet />`. Think of this as a blank canvas where `react-router-dom` paints the specific page (Dashboard, Queue, etc.) based on what link the user clicked.

5. **Scaffolding the Core Feature Pages:**
   I created empty placeholder files for the main features of our app so the team can start filling them in:
   - `Dashboard.jsx`: This will show the high-level metrics (e.g., total patients today) and charts.
   - `Queue.jsx`: This will be the list where staff can see who is waiting and assign tasks.
   - `Emergency.jsx`: A screen specifically designed to handle high-priority, critical alerts (like a Code Blue).
   - `SymptomMapping.jsx`: A tool staff will use to input patient symptoms and get potential condition mappings.

### Why these decisions were made (Context for Teammates)
- **Why Tailwind CSS?** It speeds up development massively. Teammates won't have to guess what CSS class names to use or worry about breaking styles on one page while editing another, because the styles are scoped directly to the HTML elements.
- **Why the `<ProtectedRoute>` component?** By wrapping all our internal pages in this one component, we ensure we never accidentally expose a sensitive page to the public. The security check happens in one single, easy-to-manage place.
- **Why a separate Layout component?** This ensures that the Sidebar and Header don't need to be imported onto every single page manually. They stay on screen permanently, and only the center content changes, which is faster and cleaner for development.

### Next Steps (What's coming next)
- **Authentication:** We need to write the actual logic inside `Login.jsx` to talk to our backend API, verify credentials, and store a "token" so the `<ProtectedRoute>` knows the user is logged in.
- **API Connection:** We need to use `axios` to start pulling real data from the backend into our `Dashboard` and `Queue` pages.
- **UI Polish:** We will begin styling the individual pages using Tailwind to match our design mockups.

---

## Phase 4 — Patient App & Google Maps / GPS Live Departure Tracking
**Date:** 28 August 2026  
**Branch:** `staff-dashboard-naveen`  
**Owner:** Naveen

### What was built/fixed today
I developed and integrated the **Patient App (`patient-app`)** with live queue tracking, browser GPS geolocation, and intelligent departure time calculation powered by Google Maps and travel-time services.

Patients can now track their position in the hospital queue in real-time, view dynamic wait predictions (from the Phase 3 ML model), and receive intelligent departure recommendations based on their live distance and traffic conditions.

### Step-by-Step Detailed Breakdown

1. **Patient App Bootstrapping & Styling Setup:**
   - Initialized a modern React Single Page Application in `patient-app/` using Vite, Tailwind CSS, PostCSS, and Lucide React icons.
   - Configured custom theme tokens with smooth slate and teal healthcare palettes, clean typography (Plus Jakarta Sans), and responsive mobile-first layouts.
   - Fixed standard HTML5 void element syntax in `patient-app/index.html` (standardizing `<meta>` and `<link>` tags for strict validator/linter compatibility).

2. **Browser Geolocation & Tracking Service (`src/services/location.js`):**
   - Built a robust Geolocation service interfacing with the HTML5 `navigator.geolocation` API.
   - Added `checkLocationPermission()` to inspect browser permissions (`granted`, `prompt`, `denied`).
   - Created `getCurrentCoordinates()` with `enableHighAccuracy: true` and comprehensive error handling (denied permissions, timeout, device unavailable).
   - Added `watchPatientPosition()` for continuous real-time coordinate streaming.
   - Provided fallback reference coordinates for SIET Hospital Tumakuru (`13.340881, 77.100601`) and demo coordinates for local testing without physical travel.

3. **API Client & Backend Communication (`src/services/api.js`):**
   - Set up Axios client with request interceptors for automatic JWT authentication token attachment.
   - Created endpoint service helpers:
     - `calculateDeparture()`: Sends appointment ID and live GPS coordinates to calculate optimal leave time.
     - `getQueueStatus()`: Fetches real-time queue length, current token being served, and estimated consultation time.
     - `getDepartments()` and `getDoctors()`: Fetches hospital directory data.

4. **Live Queue & Departure Tracker Component (`src/components/QueueTracker.jsx`):**
   - Built an interactive UI displaying:
     - **Queue status cards:** Live Token Number, Current Serving Token, Patients Ahead, Estimated Wait Time.
     - **Smart Departure Advisor:** Compares current time with estimated consultation time minus travel time and buffer, giving clear indicators (e.g., *"Leave Now"*, *"Leave in 15 mins"*, or *"You have arrived"*).
     - **Travel & Traffic Details:** Distance in km, driving duration with traffic, and navigation route link to Google Maps.
     - **Live Location Status Banner:** Visual badge showing GPS lock status and accuracy.

### Decisions & Design Rationale
- **Why high-accuracy GPS with fallback?** Real-time GPS gives accurate ETAs, but mobile browsers or testing environments can block geolocation. Providing clear permission status and mock coordinates ensures the app works smoothly in both testing and production.
- **Why dynamic departure calculation?** Hospital queues are unpredictable. If the queue moves faster or an emergency causes a delay, calculating the departure time dynamically based on `(Consultation ETA - Travel Duration - Buffer)` prevents patients from waiting idly in crowded waiting rooms.

### What's Next
- Wire the frontend departure calculation directly to backend's live FastAPI Google Distance Matrix route.
- Implement Push Notifications / SMS alerts when the calculated departure threshold is reached.
- Connect staff queue management actions (calling next token, emergency insertion) so the patient view updates instantly via WebSockets or polling.

---

## Phase 6 — Staff Dashboard & Emergency Queue Control
**Date:** 11 September 2026  
**Branch:** `dev-abhi`  
**Owner:** Naveen & Abhilash

### What was built/fixed today
We completed the full frontend implementation and live backend integration of the **Staff Dashboard** (`staff-dashboard`), connecting it directly to FastAPI on port 8000 and the live Neon PostgreSQL database.

### Step-by-Step Detailed Breakdown

1. **Authentication & Session Persistence (`src/services/auth.js` & `src/pages/Login.jsx`):**
   - Connected `auth.js` to real backend endpoints (`POST /auth/staff/login` and `/token`).
   - Added automatic token storage in `localStorage` (`token` and `staff_user`) so sessions survive page refreshes.
   - Updated `Header.jsx` to dynamically show the logged-in staff member's name and role badge (e.g., Reception Desk / Admin).

2. **Live Queue Management (`src/pages/Queue.jsx`):**
   - Wired live queue table to `GET /staff/queue` with automatic polling every 10 seconds.
   - Implemented "Call Next Patient" action calling `POST /staff/queue/call-next`, seamlessly moving the next waiting patient into the consultation room (Position 0).
   - Added status transition triggers (`PUT /staff/appointments/{id}/status`) allowing staff to mark consultations as Completed or Skipped with immediate database queue advancement.
   - Real-time display of triage severity (`Critical` in bold red, `Urgent` in amber, `Standard` in green) and dynamic Random Forest ML predicted wait times.

3. **Emergency Walk-in Triage (`src/pages/Emergency.jsx`):**
   - Connected emergency admission form to `POST /staff/emergency-insert`.
   - Populated doctor select dropdown dynamically via `GET /staff/doctors`.
   - Supports entering vital signs (Blood Pressure, Heart Rate, SpO2, Temperature) and chief clinical complaints.
   - Submitting an emergency places the critical patient immediately at **Queue Position #1**, pushing back regular outpatient appointments and recalculating wait times across both staff and patient interfaces.

4. **Hospital Operations KPIs (`src/pages/Dashboard.jsx`):**
   - Wired KPI cards (Total Patients Today, Currently Waiting, Average Wait Time, Emergency Cases Count) directly to `GET /staff/stats`.
   - Integrated live activity audit stream showing real-time emergency triage admissions and completed consultations.

5. **AI Symptom Classifier & Triage (`src/pages/SymptomMapping.jsx`):**
   - Connected symptom input textarea to `POST /staff/symptom-analyze`.
   - Returns ranked specialty recommendations (Cardiology, Pulmonology, General Medicine) with percentage match confidence, severity indicators, and clinical explanations.

6. **Build & Quality Assurance:**
   - Ran `npm run build` — 213 dependencies resolved, clean bundle built in 15.69s with 0 errors.
   - Verified running concurrently with `patient-app` on port 3000 and FastAPI on port 8000.

7. **Live Queue Table Action Controls & Status Updates:**
   - Fortified `updateStatus()` in `Queue.jsx` to pass `{ appointment_id: id, action }` payload, resolving backend 422 validation.
   - Added immediate visual loading feedback on action buttons (`Saving...`, `Skipping...`, `Serving...`) with disabled state during in-flight network requests to prevent duplicate submissions.
   - Added per-row **"Serve"** button for waiting patients alongside **"Complete"** and **"Skip"**, providing granular triage flow directly from the queue table.
   - Verified that marking a patient as completed or skipped immediately clears them from the active queue table and promotes subsequent patients forward.

---

## Phase 7 — Doctor Disruption Management & Post-Consultation Model Telemetry
**Date:** 11 September 2026  
**Branch:** `dev-abhi`  
**Owner:** Naveen & Abhilash  

### What was built/fixed today
Enhanced the Staff Operations Dashboard (`staff-dashboard`) with live doctor disruption controls and post-consultation evaluation logging:

1. **Doctor Disruption & Delay Management UI (`src/pages/Dashboard.jsx`):**
   - Added an operational controls card displaying all registered OPD doctors, their current queue load, and consultation speeds.
   - Status indicators dynamically distinguish between `Active` (green badge), `Delayed (+Xm)` (amber pulsing badge), and `On Break` (slate badge).
   - One-click delay adjustment buttons (`Active`, `+15m`, `+30m`, `Break`) that call `PUT /staff/doctors/{id}/status`, allowing hospital triage staff to immediately buffer doctor delays (e.g. emergency surgeries or complex OPD cases).
   - Buffer dynamically propagates to the patient app's departure alert system in real-time.

2. **Post-Consultation Evaluation & Model Audit Telemetry (`src/pages/Dashboard.jsx`):**
   - Added a dedicated evaluation table connected to `GET /staff/queue-logs`.
   - Real-time display of completed consultations comparing ML Random Forest predicted wait vs actual patient wait times.
   - Computes live accuracy metrics: Model Delta variance, accuracy tier (`✓ High` within ±5 min, `• Acceptable`), and KPI summary cards for Average Predicted Wait vs Average Actual Wait.
   - Fulfills Section 4.5 of project evaluation metrics.

## Phase 8 — Shridevi Hospital Staff Portal Rebranding & Cross-Channel Dispatch Alignment (11 September 2026)
**Branch:** dev-abhi  
**Release Tag:** `v0.8.0`  
**Owner:** Naveen, Abhilash KR  

### What was built/fixed today
1. **Shridevi Hospital Rebranding:**
   - Updated Staff Sidebar, Header, and Login pages to **Shridevi Hospital — Staff Queue Management Portal**.
   - Updated page `<title>` in `index.html` to **Shridevi Hospital - Staff Queue Management**.
2. **Notification & Queue Triage Alignment:**
   - Synchronized triage status and doctor consultation delays with the dual WhatsApp & SMS notification dispatch system.
   - Doctor delays triggered by staff immediately update patient travel and departure times sent over WhatsApp and SMS.
