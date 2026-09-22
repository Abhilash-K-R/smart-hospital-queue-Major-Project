import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(prev => !prev);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Responsive Collapsible / Drawer Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        toggleSidebar={toggleSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300">
        <Header
          isCollapsed={isCollapsed}
          toggleSidebar={toggleSidebar}
          toggleMobileSidebar={toggleMobileSidebar}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {/* Outlet renders the matched child route component */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
