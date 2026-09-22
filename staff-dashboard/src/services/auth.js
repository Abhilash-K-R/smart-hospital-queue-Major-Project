import api from './api';

export const login = async (username, password) => {
  try {
    const response = await api.post('/auth/staff/login', {
      username: (username || '').trim(),
      password: (password || '').trim(),
    });
    if (response.data && response.data.token) {
      localStorage.setItem('staffToken', response.data.token);
      if (response.data.user) {
        localStorage.setItem('staffUser', JSON.stringify(response.data.user));
      }
      return response.data;
    }
    return response.data;
  } catch (error) {
    // Return the actual authorization error from backend
    const errorMsg = error.response?.data?.detail || error.message || 'Invalid credentials. You are not authorized.';
    throw new Error(errorMsg);
  }
};

export const logout = () => {
  localStorage.removeItem('staffToken');
  localStorage.removeItem('staffUser');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('staffToken');
};

export const getStaffUser = () => {
  try {
    const raw = localStorage.getItem('staffUser');
    return raw ? JSON.parse(raw) : { name: 'Staff User', role: 'Staff' };
  } catch {
    return { name: 'Staff User', role: 'Staff' };
  }
};

