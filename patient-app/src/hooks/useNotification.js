import { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';

// Loads notifications, exposes unread count, and performs optimistic read updates.
export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    notificationService.getNotifications().then(data => {
      if (isMounted) {
        setNotifications(data);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    notificationService.markAsRead(id);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    notificationService.markAllRead();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markAsRead, markAllRead, loading };
};
