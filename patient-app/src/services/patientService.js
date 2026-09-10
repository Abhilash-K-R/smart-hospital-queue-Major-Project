import api from './api';
import { DEMO_PATIENT } from '../utils/constants';

export const patientService = {
  // Authenticates a patient and stores bearer token for subsequent API calls.
  async login(credentials) {
    try {
      const res = await api.post('/auth/login', credentials);
      if (res && res.token) {
        localStorage.setItem('mediflow_auth_token', res.token);
      }
      return res;
    } catch {
      // Demo mode fallback
      return {
        success: true,
        user: DEMO_PATIENT,
        token: 'demo-jwt-token-laxuman-10928'
      };
    }
  },

  // Registers a patient and appointment, saving the JWT token for live session.
  async registerPatient(formData) {
    try {
      const res = await api.post('/patients/register', formData);
      if (res && res.token) {
        localStorage.setItem('mediflow_auth_token', res.token);
      }
      return res;
    } catch {
      // Generate demo token
      const newTokenNum = Math.floor(Math.random() * 20) + 15;
      return {
        success: true,
        message: "Registration & Appointment Booking Successful!",
        patient: {
          ...DEMO_PATIENT,
          ...formData,
          tokenNumber: `GEN-0${newTokenNum}`,
          numericToken: newTokenNum,
          currentToken: Math.max(1, newTokenNum - 6),
          patientsAhead: 6,
          estimatedWaitMinutes: 24
        }
      };
    }
  },

  // Loads the authenticated profile or returns the demo patient.
  async getProfile() {
    try {
      return await api.get('/patients/profile');
    } catch {
      return DEMO_PATIENT;
    }
  },

  // Persists profile changes and merges them into the demo profile offline.
  async updateProfile(updates) {
    try {
      return await api.put('/patients/profile', updates);
    } catch {
      return { success: true, user: { ...DEMO_PATIENT, ...updates } };
    }
  }
};
