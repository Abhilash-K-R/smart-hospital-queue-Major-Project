import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, ShieldAlert } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

// Visualizes queue progress, patients ahead, wait time, and emergency impact.
export const ProgressCard = ({
  tokenNumber = null,
  currentToken = null,
  numericToken = null,
  patientsAhead = 0,
  estimatedWaitMinutes = 0,
  emergencyCount = 0
}) => {
  if (!tokenNumber) return null;

  // Calculate progress percentage safely
  const currNum = typeof currentToken === 'number' 
    ? currentToken 
    : (parseInt(String(currentToken || '1').replace(/\D/g, '')) || 1);
  const total = numericToken || currNum || 1;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currNum / total) * 100)));

  // Circular progress calculations
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
      {/* Background Gradient Spot */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5">
        <div>
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Live Radar</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Queue Progression</h3>
        </div>
        <StatusBadge status={patientsAhead === 0 ? "Serving" : "Waiting"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Circular Progress Gauge */}
        <div className="flex flex-col items-center justify-center p-4">
          <div className="relative flex items-center justify-center">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-blue-600 dark:stroke-blue-500"
                strokeWidth="10"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{progressPercent}%</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Queue Cleared</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium text-center">
            Token <span className="font-bold text-blue-600 dark:text-blue-400">#{currentToken}</span> currently in OPD room
          </p>
        </div>

        {/* Linear Wait Metrics */}
        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-sm font-semibold mb-2">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-500" /> Patients Ahead
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-bold text-base">{patientsAhead} Patients</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Est. Waiting
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {estimatedWaitMinutes} <span className="text-xs font-normal text-slate-400">mins</span>
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Trauma Inserts
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {emergencyCount} <span className="text-xs font-normal text-slate-400">cases</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
