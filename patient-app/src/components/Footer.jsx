import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Phone, Mail, MapPin } from 'lucide-react';

// Renders shared contact, emergency, and project-credit information.
export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Hospital identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-xl font-black text-white">MediFlow AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hospital queue operations for doctors and compounders.
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/dashboard" className="hover:text-blue-400 transition-colors">Operations Dashboard</Link></li>
              <li><Link to="/queue-status" className="hover:text-blue-400 transition-colors">Live Queue Tracker</Link></li>
              <li><Link to="/arrival-prediction" className="hover:text-blue-400 transition-colors">Queue Timing</Link></li>
              <li><Link to="/appointment" className="hover:text-blue-400 transition-colors">Register Patient</Link></li>
              <li><Link to="/faq" className="hover:text-blue-400 transition-colors">Help & FAQ</Link></li>
            </ul>
          </div>

          {/* Staff workflow */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Staff Operations</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Manage patient registration, doctor availability, tokens, and priority cases from one queue.</p>
          </div>

          {/* Hospital Emergency Helpline */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Hospital Emergency</h4>
            <div className="p-4 bg-red-950/40 border border-red-900/60 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                <Phone className="w-4 h-4" /> 24/7 Trauma Helpline
              </div>
              <p className="text-lg font-black text-white">+91 1800 900 9999</p>
              <p className="text-[10px] text-slate-400">Direct admission for critical emergency cases.</p>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Apollo MediFlow Campus, Tech Hub, BLR</p>
              <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> emergency@mediflow.ai</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 MediFlow AI. Hospital Queue Operations.</p>
          <p>For authorised clinical staff</p>
        </div>
      </div>
    </footer>
  );
};
