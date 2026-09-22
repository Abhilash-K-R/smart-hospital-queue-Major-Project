import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_PATIENT } from '../utils/constants';

// Shares patient identity, persistence, and demo-mode controls across the app.
const AuthContext = createContext();

// Provides authentication state and the actions consumed by patient screens.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mediflow_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('mediflow_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mediflow_user');
    }
  }, [user]);

  const login = (userData) => {
    setUser(userData || null);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mediflow_user');
    localStorage.removeItem('mediflow_auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_token');
  };

  const toggleDemoMode = () => {
    setIsDemoMode(prev => {
      const next = !prev;
      if (next && !user) {
        setUser({
          id: "P-10928",
          name: "Laxuman Ghotale",
          phone: "9876543210",
          email: "laxuman.patient@shridevimediflow.ai",
          tokenNumber: null,
          numericToken: null,
          doctor: null,
          department: null,
          roomNo: null
        });
      }
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isDemoMode, toggleDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
};

// Reads the nearest authentication provider from a React component.
export const useAuth = () => useContext(AuthContext);
