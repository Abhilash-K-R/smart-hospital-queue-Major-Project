import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Queue from './pages/Queue';
import Emergency from './pages/Emergency';
import SymptomMapping from './pages/SymptomMapping';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes wrapped in Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="queue" element={<Queue />} />
        <Route path="emergency" element={<Emergency />} />
        <Route path="mapping" element={<SymptomMapping />} />
      </Route>
    </Routes>
  );
}

export default App;
