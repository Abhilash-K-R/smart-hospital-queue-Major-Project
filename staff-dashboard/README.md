# 🏥 Shridevi Hospital — Staff Queue Management Portal
### Shridevi Hospital & Research Hospital, Sira Road, Tumakuru - 572106

The staff and administration operations portal for **Shridevi Hospital**, providing real-time OPD triage, emergency priority insertion, doctor disruption buffering, and post-consultation ML wait-time telemetry.

## 🚀 Features

- **Authentication:** Secure JWT login for receptionists, nurses, and hospital administrators.
- **Live Queue Table:** Granular patient status actions ("Call Next", "Serve", "Complete", "Skip") with immediate database synchronization.
- **Emergency Priority Intake:** Instant admission of acute emergency patients with automated Queue Position #1 assignment and downstream regular queue bumping.
- **Doctor Disruption Buffering:** Real-time delay adjustments (+15m, +30m, On Break) dynamically propagating to patient departure algorithms and WhatsApp/SMS alerts.
- **Post-Consultation Evaluation Logs:** ML model audit logs comparing predicted vs actual wait times (`queue_logs` table).
- **AI Clinical Symptom Classifier:** Dynamic department-to-symptom mapping with percentage match confidence.


## 🛠️ Technology Stack

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Routing:** [React Router](https://reactrouter.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Charts:** [Recharts](https://recharts.org/)
- **HTTP Client:** [Axios](https://axios-http.com/)

## 📂 Project Structure

```text
src/
├── components/          # Reusable UI components
│   ├── Header.jsx       # Top navigation bar
│   ├── Layout.jsx       # Main application shell with Sidebar and Header
│   ├── ProtectedRoute.jsx # Wrapper component to secure authenticated routes
│   └── Sidebar.jsx      # Left-hand navigation menu
├── pages/               # Main application views/routes
│   ├── Dashboard.jsx    # Main overview and charts
│   ├── Emergency.jsx    # High-priority alerts management
│   ├── Login.jsx        # Authentication screen
│   ├── Queue.jsx        # Patient/Task queue management
│   └── SymptomMapping.jsx # Symptom triage and mapping tool
├── App.jsx              # Main router and route definitions
├── index.css            # Global styles and Tailwind directives
└── main.jsx             # Application entry point
```

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation
1. Clone the repository and navigate to the `staff-dashboard` directory.
2. Install the dependencies:
   ```bash
   npm install
   ```

### Running the Development Server
Start the Vite development server with hot-module replacement (HMR):
```bash
npm run dev
```
The application will typically be available at `http://localhost:5173`.

### Building for Production
To build the application for deployment:
```bash
npm run build
```
The optimized production files will be generated in the `dist` directory.

## 📝 Process & Contribution

- **Progress Tracking:** All significant changes, architectural decisions, and bug fixes are documented in `PROGRESS.md`. Please update this file whenever you complete a chunk of work.
- **Linting:** We use `oxlint` for fast code linting. Run `npm run lint` before committing.
