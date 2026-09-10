import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Clock, Navigation, Bell, User, LogOut, Ticket, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Provides navigation and patient context for dashboard-oriented routes.
export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/queue-status', label: 'Live Queue Status', icon: Clock },
    { path: '/arrival-prediction', label: 'Leave Now AI', icon: Navigation },
    { path: '/appointment', label: 'Book Appointment', icon: Ticket },
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/profile', label: 'My Profile', icon: User },
    { path: '/faq', label: 'Help & FAQ', icon: HelpCircle }
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[calc(100vh-5rem)] sticky top-20 p-4 shrink-0 hidden md:flex">
      <div className="space-y-6">
        
        {/* User Mini Profile Header */}
        {user && (
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-200/50 dark:border-blue-900/50 flex items-center gap-3">
            <img
              src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"}
              alt={user.name}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-500/20"
            />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</h4>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold truncate">Token: {user.tokenNumber}</p>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Action */}
      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors w-full"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout Session</span>
      </button>
    </aside>
  );
};
