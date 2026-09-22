import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  AlertTriangle, 
  Stethoscope, 
  FileCode2, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Building2,
  Activity
} from 'lucide-react';
import { logout } from '../services/auth';

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen, toggleSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Live Queue', path: '/queue', icon: Users },
    { name: 'Doctor Room', path: '/doctor-room', icon: Stethoscope },
    { name: 'Emergency', path: '/emergency', icon: AlertTriangle },
    { name: 'Symptom Mapping', path: '/mapping', icon: FileCode2 },
  ];

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 bg-slate-900 text-white border-r border-slate-800/80 
        flex flex-col justify-between shadow-2xl transition-all duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full'}
        md:static md:translate-x-0 
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}
    >
      {/* Top Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 sm:px-5 border-b border-slate-800">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-black text-white tracking-wide truncate">SHRIDEVI OPD</h1>
                <p className="text-[10px] text-blue-400 font-semibold truncate">Hospital Portal</p>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          )}

          {/* Close button for mobile drawer */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="py-5 px-3 flex flex-col gap-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all group relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white font-medium'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
            >
              <item.icon className="h-5 w-5 shrink-0 group-hover:scale-110 transition-transform" />
              {!isCollapsed && (
                <span className="text-xs tracking-wide truncate">{item.name}</span>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Bottom Actions: Collapse Toggle + Sign Out */}
      <div className="p-3 border-t border-slate-800 space-y-1.5">
        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className={`hidden md:flex items-center gap-3 px-3.5 py-2.5 w-full text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-colors text-xs font-semibold ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5 text-blue-400" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 text-blue-400" />
              <span className="truncate">Collapse Menu</span>
            </>
          )}
        </button>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          title={isCollapsed ? "Sign Out" : undefined}
          className={`flex items-center gap-3 px-3.5 py-2.5 w-full text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 rounded-xl transition-colors text-xs font-semibold ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span className="truncate">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
