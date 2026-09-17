import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { QueueProvider } from './context/QueueContext';
import { LanguageProvider } from './context/LanguageContext';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Sidebar } from './components/Sidebar';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { QueueStatus } from './pages/QueueStatus';
import { ArrivalPrediction } from './pages/ArrivalPrediction';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { Appointment } from './pages/Appointment';
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
    '/notifications',
    '/profile'
  ].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        {isDashboardRoute ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
            <Sidebar />
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        ) : (
          <div className="py-6">{children}</div>
        )}
      </main>

      <Footer />
    </div>
  );
};

// Composes providers and the client-side route table for the patient portal.
export function App() {
  return (
    <AuthProvider>
      <QueueProvider>
        <LanguageProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/queue-status" element={<QueueStatus />} />
                <Route path="/arrival-prediction" element={<ArrivalPrediction />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/appointment" element={<Appointment />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/contact" element={<Contact />} />
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
