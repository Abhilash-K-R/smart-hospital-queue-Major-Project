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

  // Generates dual WhatsApp and SMS dispatch messages for smart arrival alerts
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

      const urgencyHeader = leaveNow
        ? `🚨 *URGENT SMART DEPARTURE ALERT* 🚨`
        : `🔔 *SMART DEPARTURE ADVISORY* 🔔`;

      const whatsappText = `${urgencyHeader}
*SHRIDEVI HOSPITAL — OPD SMART QUEUE*
_Sira Road, Tumakuru - 572106_

Hello *${patientName}*,

${leaveNow ? "⚠️ *Action Required: Please leave your location NOW to reach on time without waiting in OPD crowd.*" : "ℹ️ *Your queue is moving smoothly. Plan to leave shortly.*"}

📋 *Appointment Details:*
• *Token Number:* ${token}
• *Doctor:* ${doctor}
• *Consultation Room:* ${room}
• *Estimated Travel Time:* ~${travelMins} mins
• *Est. Remaining Wait:* ~${waitMins} mins
• *Status:* ${leaveNow ? "🚀 Departure Recommended Immediately" : "⏳ Standby - In Optimal Window"}

📍 *Hospital Navigation (Google Maps):*
https://maps.google.com/?q=13.376230,77.097439

📲 *Live Token Tracking & Zero-Wait Pass:*
http://localhost:3000/queue-status

_Thank you for choosing Shridevi Hospital. We value your health and time._`;

      const smsText = leaveNow
        ? `[SHRIDEVI HOSPITAL] URGENT: Token ${token} for ${doctor} (${room}). Est wait ${waitMins}m, travel ${travelMins}m. Please LEAVE NOW. Live: http://localhost:3000/queue-status`
        : `[SHRIDEVI HOSPITAL] Alert: Token ${token} for ${doctor} (${room}). Est wait ${waitMins}m, travel ${travelMins}m. Live status: http://localhost:3000/queue-status`;

      const shareUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(whatsappText)}`;

      return {
        status: "success",
        channels: ["whatsapp", "sms"],
        whatsapp: {
          recipient: phone,
          text: whatsappText,
          share_url: shareUrl,
          delivery_status: "QUEUED_AND_READY"
        },
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

