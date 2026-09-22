import axios from 'axios';

// Creates the shared HTTP client used by all patient services.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Adds the persisted bearer token to authenticated requests.
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('mediflow_auth_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('auth_token') ||
      localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Unwraps successful payloads and logs failures before services apply fallbacks.
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.warn("Backend API unavailable or error. Operating in Demo Mode with mock data.", error.message);
    return Promise.reject(error);
  }
);

export default api;
