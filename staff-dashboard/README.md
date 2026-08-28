# Staff Dashboard

The Staff Dashboard is a React-based single-page application designed for hospital and clinic staff to manage daily operations, track patient queues, handle emergencies, and map patient symptoms.

## 🚀 Features

- **Authentication:** Secure login and protected routes for staff members.
- **Dashboard Overview:** Real-time metrics and data visualization using Recharts.
- **Queue Management:** Tools for managing patient wait times and staff tasks.
- **Emergency Alerts:** Dedicated module for high-priority incidents.
- **Symptom Mapping:** Triage tool for mapping reported symptoms to potential conditions.

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
