import React from 'react';
import { motion } from 'framer-motion';
import { Ticket, Users, Clock, Stethoscope, MapPin } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

// Summarizes the patient's token against the currently served queue token.
export const QueueCard = ({ queueData }) => {
  const {
    tokenNumber = null,
    currentToken = null,
    patientsAhead = 0,
    estimatedWaitMinutes = 0,
    doctor = "Assigned Doctor",
    department = "General Medicine",
    roomNo = "OPD Consultation Room",
    status = "pending",
    isExpired = false
  } = queueData || {};

  if (!tokenNumber) return null;

  const now = new Date();
  const isPastOpdHours = now.getHours() >= 20 || now.getHours() < 8;
  const isSlotExpired = isExpired || status === 'expired' || currentToken === 'OPD-CLOSED';

  const badgeStatus = isSlotExpired
    ? 'Expired'
    : (isPastOpdHours
      ? 'Closed'
      : (status === 'completed' ? 'Completed' : (patientsAhead === 0 ? 'Serving' : 'Waiting')));

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass-card rounded-3xl p-6 relative overflow-hidden border border-blue-500/20 shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {isSlotExpired ? "Concluded OPD Pass" : "Live Active Pass"}
          </span>
        </div>
        <StatusBadge status={badgeStatus} />
      </div>

      <div className="grid grid-cols-2 gap-4 my-2">
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200/50 dark:border-blue-900/50 text-center">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">YOUR TOKEN</span>
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight mt-1">{tokenNumber}</p>
        </div>

        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/50 dark:border-emerald-900/50 text-center">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">NOW SERVING</span>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-1">
            {typeof currentToken === 'string' && currentToken.includes('-')
              ? currentToken
              : `OPD-${String(currentToken).padStart(3, '0')}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 pt-2">
        <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          <Users className="w-4 h-4 text-blue-500 shrink-0" />
          <span><strong className="text-slate-900 dark:text-white font-bold">{patientsAhead}</strong> ahead of you</span>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Est. Wait <strong className="text-slate-900 dark:text-white font-bold">{estimatedWaitMinutes} mins</strong></span>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 col-span-2">
          <Stethoscope className="w-4 h-4 text-cyan-500 shrink-0" />
          <span className="truncate">{doctor} ({department})</span>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 col-span-2">
          <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="truncate">{roomNo}</span>
        </div>
      </div>
    </motion.div>
  );
};
