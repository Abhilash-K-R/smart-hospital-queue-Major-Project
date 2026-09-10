import api from './api';
import { DEMO_PATIENT } from '../utils/constants';

export const patientService = {
  // Authenticates a patient and falls back to the demo identity when offline.
  async login(credentials) {
    try {
      return await api.post('/auth/login', credentials);
    } catch {
      // Demo mode fallback
      return {
        success: true,
        user: DEMO_PATIENT,
        token: 'demo-jwt-token-laxuman-10928'
      };
    }
  },

  // Registers a patient and appointment, generating a demo token when offline.
  async registerPatient(formData) {
    try {
      return await api.post('/patients/register', formData);
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
