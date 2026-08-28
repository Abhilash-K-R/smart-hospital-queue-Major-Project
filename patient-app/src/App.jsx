import React, { useState } from 'react';
import {
  HeartPulse,
  CalendarCheck,
  Hospital,
  User,
  ShieldCheck,
  Sparkles,
  MapPin,
  Clock,
  ChevronRight
} from 'lucide-react';
import QueueTracker from './components/QueueTracker';

export default function App() {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(1);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'appointments'

  // Simulated Appointments for preview and testing
  const sampleAppointments = [
    {
      id: 1,
      doctor: "Dr. Priya Sharma",
      department: "Cardiology",
      time: "Today, 11:30 AM",
      status: "Active Queue",
    },
    {
      id: 2,
      doctor: "Dr. Arjun Rao",
      department: "General Medicine",
      time: "Today, 02:00 PM",
      status: "Upcoming",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-teal-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <HeartPulse className="w-5 h-5 text-teal-400" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
                SmartHospital <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono">Patient AI</span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Real-Time Queue & Traffic-Aware Departure Optimizer
              </p>
            </div>
          </div>

          {/* User profile badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-200">Ravi Kumar</span>
              <span className="text-[10px] text-teal-400 font-mono">ID: PAT-9082</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Banner Alert */}
        <div className="bg-gradient-to-r from-teal-950/60 via-slate-900 to-emerald-950/50 border border-teal-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-teal-500/20 rounded-xl text-teal-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-100">
                AI Queue Prediction & Live Google Maps Navigation Active
              </h3>
              <p className="text-xs text-slate-400">
                You do not need to wait in the crowded hospital lobby. We track live doctor consultations and road traffic so you leave home just in time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-teal-400 font-medium whitespace-nowrap bg-teal-500/10 px-3 py-1.5 rounded-xl border border-teal-500/20">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero-Wait Guarantee</span>
          </div>
        </div>

        {/* Appointment Selector / Tab Switcher */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Select Active Appointment
            </span>
          </div>

          <div className="flex gap-2">
            {sampleAppointments.map((apt) => (
              <button
                key={apt.id}
                onClick={() => setSelectedAppointmentId(apt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  selectedAppointmentId === apt.id
                    ? 'bg-teal-500 text-slate-950 border-teal-400 font-semibold shadow-md shadow-teal-900/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                #{apt.id} - {apt.doctor}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Queue Tracker Component */}
        <QueueTracker appointmentId={selectedAppointmentId} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <p>Smart Hospital Queue Prediction & Departure System &bull; Phase 4 Google Maps + Geolocation Build</p>
      </footer>
    </div>
  );
}
