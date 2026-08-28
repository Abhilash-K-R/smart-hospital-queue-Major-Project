import React from 'react';
import { Bell, UserCircle } from 'lucide-react';

const Header = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {/* We can add page title dynamically here later if needed */}
        <h2 className="text-xl font-semibold text-slate-800">Staff Portal</h2>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-700">Admin User</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
          <UserCircle className="h-8 w-8 text-slate-400" />
        </div>
      </div>
    </header>
  );
};

export default Header;
