import api from './api';

export const login = async (email, password) => {
  try {
    // NOTE: This endpoint name must match what the backend team builds.
    // Assuming a standard OAuth2 password flow for FastAPI
    const formData = new FormData();
    formData.append('username', email); // FastAPI OAuth2 expects 'username'
    formData.append('password', password);

    const response = await api.post('/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (response.data.access_token) {
      localStorage.setItem('staffToken', response.data.access_token);
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('staffToken');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('staffToken');
};
