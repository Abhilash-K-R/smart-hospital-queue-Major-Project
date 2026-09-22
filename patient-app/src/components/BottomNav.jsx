import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Clock, 
  Navigation, 
  CalendarPlus, 
  User, 
  Ticket
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';

export const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { queueState } = useQueue();

  const activeToken = queueState?.tokenNumber || user?.tokenNumber || (user?.appointment_id ? `OPD-${String(user.appointment_id).padStart(3, '0')}` : null);
  const hasActiveToken = Boolean(queueState?.hasActiveToken || activeToken);

  const navItems = [
    {
      label: 'Home',
      path: user ? '/dashboard' : '/',
      icon: LayoutDashboard,
      activeCheck: ['/', '/dashboard'].includes(location.pathname)
    },
    {
      label: 'Live Queue',
      path: '/queue-status',
      icon: Clock,
      activeCheck: location.pathname === '/queue-status'
    },
    {
      label: 'My Ticket',
      path: '/arrival-prediction',
      icon: Navigation,
      badge: hasActiveToken ? activeToken : null,
      activeCheck: location.pathname === '/arrival-prediction'
    },
    {
      label: 'Book Slot',
      path: '/appointment',
      icon: CalendarPlus,
      activeCheck: ['/appointment', '/book-appointment'].includes(location.pathname)
    },
    {
      label: user ? 'Profile' : 'Login',
      path: user ? '/profile' : '/login',
      icon: User,
      activeCheck: ['/profile', '/login', '/notifications'].includes(location.pathname)
    }
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/90 px-2 py-1 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.activeCheck;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl transition-all relative group select-none min-w-[56px] ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <div className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-blue-50 dark:bg-blue-950/60 scale-110' : 'group-active:scale-95'
                }`}>
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                </div>
                {item.badge && (
                  <span className="absolute -top-1 -right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 leading-tight ${
                isActive ? 'font-bold' : 'font-medium'
              }`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
