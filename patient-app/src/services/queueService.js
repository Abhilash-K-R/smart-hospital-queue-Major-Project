import api from './api';
import { DEMO_PATIENT } from '../utils/constants';

export const queueService = {
  // Loads live queue data for a token or creates a demo queue snapshot.
  async getQueueStatus(tokenNumber = DEMO_PATIENT.tokenNumber) {
    try {
      return await api.get(`/queue/status/${tokenNumber}`);
    } catch {
      return {
        tokenNumber: DEMO_PATIENT.tokenNumber,
        currentToken: DEMO_PATIENT.currentToken,
        numericToken: DEMO_PATIENT.numericToken,
        patientsAhead: DEMO_PATIENT.patientsAhead,
        estimatedWaitMinutes: DEMO_PATIENT.estimatedWaitMinutes,
        doctor: DEMO_PATIENT.doctor,
        department: DEMO_PATIENT.department,
        roomNo: DEMO_PATIENT.roomNo,
        emergencyCount: DEMO_PATIENT.emergencyInsertedCount,
        lastUpdated: new Date().toLocaleTimeString()
      };
    }
  },

  // Loads the leave-now prediction or calculates a demo recommendation.
  async predictArrival() {
    try {
      return await api.get('/ai/predict-arrival');
    } catch {
      return {
        recommendedLeaveInMinutes: DEMO_PATIENT.leaveAfterMinutes,
        trafficDelayMinutes: DEMO_PATIENT.trafficDurationMinutes,
        queueWaitMinutes: DEMO_PATIENT.estimatedWaitMinutes,
        distanceKm: DEMO_PATIENT.distanceKm,
        trafficCondition: "Moderate Traffic (Green-Yellow Route)",
        weather: "28°C Clear Sky",
        optimalDepartureTime: new Date(Date.now() + DEMO_PATIENT.leaveAfterMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        estimatedArrivalTime: new Date(Date.now() + (DEMO_PATIENT.leaveAfterMinutes + DEMO_PATIENT.trafficDurationMinutes) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }
  }
};
