import React from 'react';
import { Activity, Clock, ShieldCheck, Siren } from 'lucide-react';
import { useQueue } from '../context/QueueContext';

// Renders a page heading alongside the patient's current token indicator.
export const TopBar = ({ title = "Dashboard Overview", subtitle = "Real-time queue and arrival status" }) => {
  const { queueState } = useQueue();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Hospital Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>OPD Active</span>
        </div>

        {/* Live Token Indicator */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/25 text-xs font-extrabold">
          <Clock className="w-3.5 h-3.5" />
          <span>Your Token: {queueState.tokenNumber}</span>
        </div>
      </div>
    </div>
  );
};
