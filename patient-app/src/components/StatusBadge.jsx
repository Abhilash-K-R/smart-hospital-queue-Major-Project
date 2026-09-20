import React from 'react';

// Maps a queue status to a compact, consistently colored badge.
export const StatusBadge = ({ status = 'Waiting', size = 'md' }) => {
  const statusConfig = {
    Serving: { bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500 animate-ping' },
    Waiting: { bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30', dot: 'bg-blue-500' },
    Delayed: { bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
    Emergency: { bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30', dot: 'bg-red-500 animate-pulse' },
    Completed: { bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30', dot: 'bg-slate-400' }
  };

  const config = statusConfig[status] || statusConfig.Waiting;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs gap-1.5' : 'px-3 py-1 text-xs gap-2';

  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${config.bg} ${sizeClasses}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
};
