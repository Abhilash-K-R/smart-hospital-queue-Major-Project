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
  }
};
