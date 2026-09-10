import React from 'react';

// Reserves the final layout shape while page content is loading.
export const SkeletonLoader = ({ type = 'card' }) => {
  if (type === 'list') {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 glass-card rounded-2xl animate-pulse space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-16" />
      </div>
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
      <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
    </div>
  );
};
