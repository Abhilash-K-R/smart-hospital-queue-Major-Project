import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../services/auth';

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // If not authenticated, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the requested component
  return children;
};

export default ProtectedRoute;
