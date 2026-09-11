import React from 'react';
import { Siren } from 'lucide-react';
import { motion } from 'framer-motion';

// Displays emergency queue impact notice to patients.
export const EmergencyAlert = ({ count = 1 }) => {
  if (!count || count <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-gradient-to-r from-red-600/15 via-rose-500/10 to-amber-500/15 border border-red-500/30 backdrop-blur-md shadow-glow-danger flex items-center justify-between gap-3 my-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/30 animate-pulse shrink-0">
          <Siren className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-red-600 text-white rounded-md">
              Hospital Emergency Active
            </span>
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
              {count} Critical Emergency Case Admitted
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 mt-0.5">
            Hospital triage has prioritized urgent emergency care. Your estimated wait time has been automatically adjusted by AI.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
