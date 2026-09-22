import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { QueueProvider } from './context/QueueContext';
import { LanguageProvider } from './context/LanguageContext';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { QueueStatus } from './pages/QueueStatus';
import { ArrivalPrediction } from './pages/ArrivalPrediction';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { Appointment } from './pages/Appointment';
import { ForgotPassword } from './pages/ForgotPassword';
import { FAQ } from './pages/FAQ';
import { Contact } from './pages/Contact';
import { NotFound } from './pages/NotFound';

// Renders the shared shell and chooses the sidebar layout for dashboard routes.
const Layout = ({ children }) => {
  const location = useLocation();

  // Pages that display sidebar layout for authenticated dashboard views
  const isDashboardRoute = [
    '/dashboard',
    '/queue-status',
    '/arrival-prediction',
    '/appointment',
    '/book-appointment',
    '/notifications',
    '/profile'
  ].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 overflow-x-hidden">
      <Navbar />

      <main className="flex-1 pb-20 md:pb-8">
        {isDashboardRoute ? (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex gap-6 lg:gap-8">
            <Sidebar />
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        ) : (
          <div className="py-4 sm:py-6 px-3 sm:px-6">{children}</div>
        )}
      </main>

      <Footer />
      
      {/* Native-style Mobile Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
};

import { ProtectedRoute } from './components/ProtectedRoute';

// Composes providers and the client-side route table for the patient portal.
export function App() {
  return (
    <AuthProvider>
      <QueueProvider>
        <LanguageProvider>
          <Router>
            <Layout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/contact" element={<Contact />} />

                {/* Protected Patient Routes (Require Login) */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/queue-status"
                  element={
                    <ProtectedRoute>
                      <QueueStatus />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/arrival-prediction"
                  element={
                    <ProtectedRoute>
                      <ArrivalPrediction />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/appointment"
                  element={
                    <ProtectedRoute>
                      <Appointment />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/book-appointment"
                  element={
                    <ProtectedRoute>
                      <Appointment />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </Router>
        </LanguageProvider>
      </QueueProvider>
    </AuthProvider>
  );
}

export default App;
