import api from './api';

export const login = async (username, password) => {
  try {
    // Try JSON login first
    try {
      const response = await api.post('/auth/staff/login', {
        username: username,
        password: password,
      });
      if (response.data && response.data.token) {
        localStorage.setItem('staffToken', response.data.token);
        if (response.data.user) {
          localStorage.setItem('staffUser', JSON.stringify(response.data.user));
        }
        return response.data;
      }
    } catch (e) {
      // Fallback to OAuth2 /token endpoint
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const token = response.data.access_token || response.data.token;
      if (token) {
        localStorage.setItem('staffToken', token);
      }
      if (response.data.user) {
        localStorage.setItem('staffUser', JSON.stringify(response.data.user));
      }
      return response.data;
    }
  } catch (error) {
    throw error;
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

