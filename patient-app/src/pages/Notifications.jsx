import React, { useState } from 'react';
import { useNotification } from '../hooks/useNotification';
import { TopBar } from '../components/TopBar';
import { NotificationCard } from '../components/NotificationCard';
import { Button } from '../components/Button';
import { Bell, CheckCheck, Filter } from 'lucide-react';

// Loads the notification feed and exposes read-state actions to the patient.
export const Notifications = () => {
  const { notifications, unreadCount, markAsRead } = useNotification();
  const [filter, setFilter] = useState('All');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'Unread') return !n.read;
    if (filter === 'Emergency') return n.type === 'emergency' || n.priority === 'warning';
    return true;
  });

  const handleMarkAllRead = () => {
    notifications.forEach(n => markAsRead(n.id));
  };

  return (
    <div className="space-y-8">
      <TopBar title="Alerts & System Notifications" subtitle="Real-time Leave Now reminders, queue updates, and emergency alerts" />

      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notification Feed</h3>
              <p className="text-xs text-slate-500">{unreadCount} unread messages requiring attention</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              {['All', 'Unread', 'Emergency'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    filter === tab
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <Button size="sm" variant="ghost" icon={CheckCheck} onClick={handleMarkAllRead}>
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={markAsRead}
              />
            ))
          ) : (
            <div className="text-center py-12 space-y-2">
              <Bell className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-500">No notifications found in this category.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
