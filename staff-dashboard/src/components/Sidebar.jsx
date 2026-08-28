import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, AlertTriangle, Stethoscope, LogOut } from 'lucide-react';
import { logout } from '../services/auth';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Live Queue', path: '/queue', icon: Users },
    { name: 'Emergency', path: '/emergency', icon: AlertTriangle },
    { name: 'Symptom Mapping', path: '/mapping', icon: Stethoscope },
  ];

  return (
    <div className="flex flex-col w-64 bg-slate-900 text-white min-h-screen border-r border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <span className="text-lg font-bold text-blue-400 tracking-wider">SMART HOSPITAL</span>
      </div>
      
      <div className="flex-1 py-6 flex flex-col gap-2 px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5 text-red-400" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
