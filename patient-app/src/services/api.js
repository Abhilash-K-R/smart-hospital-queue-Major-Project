/**
 * patient-app/src/services/api.js
 * -------------------------------
 * Axios API client and backend service wrappers for the patient application.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor to attach JWT token if present in localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('patient_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Calculates live departure time using patient GPS and Google Maps / Traffic.
 * @param {{ appointment_id: number, patient_latitude: number, patient_longitude: number, buffer_minutes?: number }} payload
 */
export async function calculateDeparture(payload) {
  const response = await apiClient.post('/calculate-departure', payload);
  return response.data;
}

/**
 * Fetches current live queue status for an appointment.
 * @param {number} appointmentId
 */
export async function getQueueStatus(appointmentId) {
  const response = await apiClient.get(`/appointments/${appointmentId}/queue-status`);
  return response.data;
}

/**
 * Gets list of hospital departments.
 */
export async function getDepartments() {
  const response = await apiClient.get('/departments');
  return response.data;
}

/**
 * Gets list of doctors, optionally filtered by department.
 * @param {number} [departmentId]
 */
export async function getDoctors(departmentId) {
  const params = departmentId ? { department_id: departmentId } : {};
  const response = await apiClient.get('/doctors', { params });
  return response.data;
}

export default apiClient;
