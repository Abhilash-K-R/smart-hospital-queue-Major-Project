import React from 'react';
import { Bell, Siren, CheckCircle2, Navigation } from 'lucide-react';

// Presents one notification and delegates read-state changes to the parent hook.
export const NotificationCard = ({ notification, onMarkRead }) => {
  const { id, type, title, message, time, read, priority } = notification;

  const getIcon = () => {
    switch (type) {
      case 'leave_now': return <Navigation className="w-5 h-5 text-cyan-500" />;
      case 'emergency': return <Siren className="w-5 h-5 text-red-500" />;
      case 'confirmation': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBorder = () => {
    if (priority === 'high') return 'border-l-4 border-l-cyan-500';
    if (priority === 'warning') return 'border-l-4 border-l-red-500';
    if (priority === 'success') return 'border-l-4 border-l-emerald-500';
    return 'border-l-4 border-l-blue-500';
  };

  return (
    <div
      onClick={() => onMarkRead && onMarkRead(id)}
      className={`p-4 rounded-2xl glass-card transition-all cursor-pointer ${getBorder()} ${
        !read ? 'bg-blue-50/50 dark:bg-blue-950/20' : 'opacity-85'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{title}</h4>
            <span className="text-[10px] text-slate-400 font-medium shrink-0">{time}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{message}</p>
        </div>
        {!read && (
          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
        )}
      </div>
    </div>
  );
};
