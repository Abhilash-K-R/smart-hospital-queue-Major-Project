import React from 'react';
import {
  Bell,
  Siren,
  CheckCircle2,
  Navigation,
  Clock,
  AlertTriangle,
  Stethoscope,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

// Presents one notification and delegates read-state changes to the parent hook.
export const NotificationCard = ({ notification, onMarkRead }) => {
  const { id, type, title, message, time, timestamp, read, priority, severity } = notification;
  const timeDisplay = time || timestamp || "Just now";
  const effectiveSeverity = severity || (priority === 'high' ? 'info' : priority === 'warning' ? 'warning' : 'info');

  const getIcon = () => {
    switch (type) {
      case 'no_show_warning':
        return <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />;
      case 'slot_expired':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'booking_confirmed':
      case 'confirmation':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'consultation_completed':
        return <Stethoscope className="w-5 h-5 text-emerald-500" />;
      case 'next_in_line':
        return <Sparkles className="w-5 h-5 text-blue-500" />;
      case 'leave_now':
        return <Navigation className="w-5 h-5 text-cyan-500" />;
      case 'emergency':
        return <Siren className="w-5 h-5 text-rose-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBorderAndBg = () => {
    if (type === 'no_show_warning' || effectiveSeverity === 'critical') {
      return {
        border: 'border-l-4 border-l-rose-600 dark:border-l-rose-500 border-rose-200 dark:border-rose-900/40',
        bg: !read ? 'bg-rose-50/60 dark:bg-rose-950/30' : 'bg-white dark:bg-slate-900'
      };
    }
    if (type === 'slot_expired' || effectiveSeverity === 'warning') {
      return {
        border: 'border-l-4 border-l-amber-500 border-amber-200 dark:border-amber-900/40',
        bg: !read ? 'bg-amber-50/60 dark:bg-amber-950/20' : 'bg-white dark:bg-slate-900'
      };
    }
    if (type === 'booking_confirmed' || type === 'consultation_completed' || effectiveSeverity === 'success') {
      return {
        border: 'border-l-4 border-l-emerald-500 border-emerald-200 dark:border-emerald-900/40',
        bg: !read ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'bg-white dark:bg-slate-900'
      };
    }
    if (type === 'leave_now') {
      return {
        border: 'border-l-4 border-l-cyan-500 border-cyan-200 dark:border-cyan-900/40',
        bg: !read ? 'bg-cyan-50/50 dark:bg-cyan-950/20' : 'bg-white dark:bg-slate-900'
      };
    }
    return {
      border: 'border-l-4 border-l-blue-500 border-slate-200 dark:border-slate-800',
      bg: !read ? 'bg-blue-50/40 dark:bg-blue-950/20' : 'bg-white dark:bg-slate-900'
    };
  };

  const styleConfig = getBorderAndBg();

  return (
    <div
      onClick={() => onMarkRead && onMarkRead(id)}
      className={`p-4 rounded-2xl glass-card transition-all cursor-pointer border ${styleConfig.border} ${styleConfig.bg} ${
        read ? 'opacity-85' : 'shadow-md'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
              {type === 'no_show_warning' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold tracking-wide animate-pulse">
                  URGENT ACTION
                </span>
              )}
              {type === 'next_in_line' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold">
                  YOU'RE NEXT
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-medium shrink-0">{timeDisplay}</span>
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

