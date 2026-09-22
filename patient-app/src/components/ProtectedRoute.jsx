import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Check state or persisted token
  const token = localStorage.getItem('mediflow_auth_token') || localStorage.getItem('token');
  const savedUser = localStorage.getItem('mediflow_user');

  if (!user && !token && !savedUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
