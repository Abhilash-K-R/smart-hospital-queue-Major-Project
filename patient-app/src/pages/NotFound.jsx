import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Home, AlertTriangle } from 'lucide-react';

// Handles unknown URLs and provides a route back to the landing page.
export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center text-center px-4 py-16">
      <div className="max-w-md space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/30">
          <AlertTriangle className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Page Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The requested OPD page or route does not exist.
          </p>
        </div>

        <Button size="lg" icon={Home} onClick={() => navigate('/')} className="w-full">
          Return to Hospital Home
        </Button>
      </div>
    </div>
  );
};
