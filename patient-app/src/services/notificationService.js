import api from './api';
import { RECENT_NOTIFICATIONS } from '../utils/constants';

export const notificationService = {
  // Fetches server notifications or the local demo feed when the API is unavailable.
  async getNotifications() {
    try {
      return await api.get('/notifications');
    } catch {
      return RECENT_NOTIFICATIONS;
    }
  },

  // Marks one notification as read and returns a demo success when offline.
  async markAsRead(id) {
    try {
      return await api.put(`/notifications/${id}/read`);
    } catch {
      return { success: true, id };
    }
  },

  // Marks all notifications as read
  async markAllRead() {
    try {
      return await api.post('/notifications/mark-all-read');
    } catch {
      return { success: true };
    }
  },

  // Generates carrier SMS dispatch message for smart arrival alerts
  async getDispatchPreview(payload) {
    try {
      return await api.post('/notifications/dispatch-preview', payload);
    } catch (err) {
      console.warn("API dispatch preview fallback:", err);
      const phone = payload.phone || "9876543210";
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const patientName = payload.patient_name || "Laxuman S";
      const token = payload.token_number || "OPD-011";
      const doctor = payload.doctor_name || "Dr. Rajeswari R.";
      const room = payload.room_number || "Room 204";
      const travelMins = payload.travel_time_minutes || 15;
      const waitMins = payload.estimated_wait_minutes || 35;
      const leaveNow = payload.should_leave_now;

      const smsText = leaveNow
        ? `[SHRIDEVI HOSPITAL] URGENT: Token ${token} for ${doctor} (${room}). Est wait ${waitMins}m, travel ${travelMins}m. Please LEAVE NOW. Live: http://localhost:3000/queue-status`
        : `[SHRIDEVI HOSPITAL] Alert: Token ${token} for ${doctor} (${room}). Est wait ${waitMins}m, travel ${travelMins}m. Live status: http://localhost:3000/queue-status`;

      return {
        status: "success",
        channels: ["sms"],
        sms: {
          recipient: phone,
          text: smsText,
          character_count: smsText.length,
          delivery_status: "QUEUED_AND_READY"
        },
        meta: {
          hospital_name: "Shridevi Hospital & Research Hospital",
          hospital_location: "Sira Road, Tumakuru - 572106",
          coordinates: { lat: 13.376230, lng: 77.097439 },
          google_maps_url: "https://maps.google.com/?q=13.376230,77.097439",
          should_leave_now: leaveNow
        }
      };
    }
  }
};
