import axios from 'axios';

const getApiBaseUrl = () => {
  // If deployed in production on Vercel or any remote domain (not local dev machine)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return 'https://smart-hospital-queue-major-project.onrender.com';
    }
    return envUrl;
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
};

// Creates the shared HTTP client used by all patient services.
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
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
