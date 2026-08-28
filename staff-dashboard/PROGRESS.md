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
