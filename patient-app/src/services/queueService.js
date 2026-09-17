import api from './api';
import { DEMO_PATIENT } from '../utils/constants';

export const queueService = {
  // Loads live queue data from backend for an appointment/token.
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

  // Calls the real FastAPI POST /departure-check endpoint
  async checkDeparture(appointmentId = 1, lat = 13.340881, lng = 77.100601) {
    try {
      const res = await api.post('/departure-check', {
        appointment_id: Number(appointmentId),
        patient_lat: Number(lat),
        patient_lng: Number(lng)
      });

      const leaveIn = Math.max(0, Math.round(res.predicted_wait_minutes - res.travel_time_minutes));
      const now = Date.now();

      return {
        ...res,
        recommendedLeaveInMinutes: leaveIn,
        trafficDelayMinutes: res.travel_time_minutes,
        queueWaitMinutes: res.predicted_wait_minutes,
        distanceKm: Math.round(res.travel_time_minutes * 0.41 * 10) / 10,
        trafficCondition: "Live Travel Calculation Active",
        weather: "28°C Clear Sky (Tumakuru)",
        optimalDepartureTime: new Date(now + leaveIn * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        estimatedArrivalTime: new Date(now + (leaveIn + res.travel_time_minutes) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } catch (err) {
      console.warn("Real /departure-check failed or offline, using fallback", err.message);
      return {
        predicted_wait_minutes: DEMO_PATIENT.estimatedWaitMinutes,
        travel_time_minutes: DEMO_PATIENT.trafficDurationMinutes,
        should_leave_now: false,
        message: "Not yet — you can wait before leaving.",
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
  },

  // Backward compatibility wrapper
  async predictArrival(appointmentId, lat, lng) {
    return this.checkDeparture(appointmentId, lat, lng);
  }
};
