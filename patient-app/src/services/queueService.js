import api from './api';
import { DEMO_PATIENT } from '../utils/constants';

export const queueService = {
  // Loads live queue data from backend for an appointment/token.
  async getQueueStatus(tokenNumber) {
    if (!tokenNumber) return null;
    try {
      return await api.get(`/queue/status/${tokenNumber}`);
    } catch (err) {
      console.warn("Queue status lookup failed:", err.message);
      return null;
    }
  },

  // Fetches the live patient stream specifically for a doctor
  async getDoctorQueueStream(doctorId = 3) {
    try {
      return await api.get(`/queue/doctor/${doctorId}`);
    } catch (err) {
      console.warn("Doctor queue stream fetch failed:", err.message);
      return {
        doctor_id: doctorId,
        doctor: "General Medicine",
        department: "General Medicine",
        roomNo: "Room 204",
        avg_consult_minutes: 10,
        servingToken: null,
        patientsInQueue: 0,
        queue: []
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

      const dist = typeof res.distance_km === 'number' ? res.distance_km : Math.round(res.travel_time_minutes * 0.41 * 10) / 10;
      return {
        ...res,
        recommendedLeaveInMinutes: leaveIn,
        trafficDelayMinutes: res.travel_time_minutes,
        queueWaitMinutes: res.predicted_wait_minutes,
        distanceKm: dist,
        trafficCondition: "Live Travel Calculation Active",
        weather: "28°C Clear Sky (Tumakuru)",
        optimalDepartureTime: new Date(now + leaveIn * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        estimatedArrivalTime: new Date(now + (leaveIn + res.travel_time_minutes) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } catch (err) {
      console.warn("Real /departure-check failed or offline, using fallback", err.message);
      const approxDist = (lat && lng)
        ? Math.round(Math.sqrt(Math.pow((Number(lat) - 13.376230) * 111, 2) + Math.pow((Number(lng) - 77.097439) * 111 * Math.cos(13.376230 * Math.PI / 180), 2)) * 10) / 10
        : DEMO_PATIENT.distanceKm;
      const approxTravel = Math.max(2, Math.round((approxDist / 45) * 60));
      const leaveIn = Math.max(0, DEMO_PATIENT.estimatedWaitMinutes - approxTravel - 15);
      return {
        predicted_wait_minutes: DEMO_PATIENT.estimatedWaitMinutes,
        travel_time_minutes: approxTravel,
        should_leave_now: false,
        message: "Not yet — you can wait before leaving.",
        recommendedLeaveInMinutes: leaveIn,
        trafficDelayMinutes: approxTravel,
        queueWaitMinutes: DEMO_PATIENT.estimatedWaitMinutes,
        distanceKm: approxDist,
        trafficCondition: "Estimated Route (Offline Resilience)",
        weather: "28°C Clear Sky",
        optimalDepartureTime: new Date(Date.now() + leaveIn * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        estimatedArrivalTime: new Date(Date.now() + (leaveIn + approxTravel) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }
  },

  // Backward compatibility wrapper
  async predictArrival(appointmentId, lat, lng) {
    return this.checkDeparture(appointmentId, lat, lng);
  }
};
