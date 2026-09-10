import React from 'react';
import { Siren, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

// Displays emergency queue impact and exposes the simulation action.
export const EmergencyAlert = ({ count = 1, onTriggerSimulation }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-gradient-to-r from-red-600/15 via-rose-500/10 to-amber-500/15 border border-red-500/30 backdrop-blur-md shadow-glow-danger flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 my-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/30 animate-pulse shrink-0">
          <Siren className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-red-600 text-white rounded-md">
              AI Priority Override
            </span>
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
              {count} Emergency Patient Admitted
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
            Random Forest algorithm automatically adjusted downstream wait times (+4 mins). Non-emergency queues will resume shortly.
          </p>
        </div>
      </div>

      {onTriggerSimulation && (
        <button
          onClick={onTriggerSimulation}
          className="self-end sm:self-center text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900 transition-all shrink-0"
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Simulate Emergency +1 <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
};
