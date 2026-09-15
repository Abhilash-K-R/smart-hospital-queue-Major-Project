import React from 'react';

// Shows a consistent loading indicator while content or service data is pending.
export const LoadingSpinner = ({ size = 'md', label = "AI Calculating..." }) => {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-3">
      <div className={`${sizes[size]} border-blue-600 border-t-transparent rounded-full animate-spin`} />
      {label && <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide animate-pulse">{label}</p>}
    </div>
  );
};
