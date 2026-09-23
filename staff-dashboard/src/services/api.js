import axios from 'axios';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return 'https://smart-hospital-queue-major-project.onrender.com';
    }
    return envUrl;
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
};

// Create an Axios instance
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('staffToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('staffToken');
      // We don't want to force redirect here directly using window.location to avoid bad UX, 
      // but we will handle it in the auth context or protected route.
    }
    return Promise.reject(error);
  }
);

export default api;
