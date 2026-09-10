import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_PATIENT } from '../utils/constants';

// Shares patient identity, persistence, and demo-mode controls across the app.
const AuthContext = createContext();

// Provides authentication state and the actions consumed by patient screens.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mediflow_user');
    return saved ? JSON.parse(saved) : DEMO_PATIENT; // Default to demo patient Laxuman
  });

  const [isDemoMode, setIsDemoMode] = useState(true);

  useEffect(() => {
    if (user) {
      localStorage.setItem('mediflow_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mediflow_user');
    }
  }, [user]);

  const login = (userData) => {
    setUser(userData || DEMO_PATIENT);
  };

  const logout = () => {
    setUser(null);
  };

  const toggleDemoMode = () => {
    setIsDemoMode(prev => !prev);
    if (!user) setUser(DEMO_PATIENT);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isDemoMode, toggleDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
};

// Reads the nearest authentication provider from a React component.
export const useAuth = () => useContext(AuthContext);
