import React, { useState } from 'react';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import { TopBar } from '../components/TopBar';
import { NotificationCard } from '../components/NotificationCard';
import { Button } from '../components/Button';
import MobileDispatchModal from '../components/MobileDispatchModal';
import { DEMO_PATIENT } from '../utils/constants';
import { Bell, CheckCheck, Filter, Smartphone, MessageSquare, ShieldCheck } from 'lucide-react';

// Loads the notification feed and exposes read-state actions to the patient.
export const Notifications = () => {
  const { notifications, unreadCount, markAsRead } = useNotification();
  const { user } = useAuth();
  const [filter, setFilter] = useState('All');
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchData, setDispatchData] = useState(null);
  const [isDispatchLoading, setIsDispatchLoading] = useState(false);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'Unread') return !n.read;
    if (filter === 'Emergency') return n.type === 'emergency' || n.priority === 'warning';
    return true;
  });

  const handleMarkAllRead = () => {
    notifications.forEach(n => markAsRead(n.id));
  };

  const handleOpenDispatchSimulator = async () => {
    setIsDispatchLoading(true);
    try {
      const payload = {
        patient_name: user?.name || DEMO_PATIENT.name,
        phone: user?.phone || DEMO_PATIENT.phone || "9876543210",
        token_number: user?.tokenNumber || "OPD-011",
        doctor_name: user?.doctor || "Dr. Rajeswari R.",
        room_number: user?.roomNo || "Room 204",
        travel_time_minutes: 15,
        buffer_minutes: 10,
        total_travel_needed_minutes: 25,
        estimated_wait_minutes: 35,
        should_leave_now: false,
        origin_address: "Tumakuru City",
        live_tracking_url: `${window.location.origin}/queue-status`
      };

      const res = await notificationService.getDispatchPreview(payload);
      setDispatchData(res);
      setIsDispatchModalOpen(true);
    } catch (err) {
      console.error("Failed to load dispatch preview:", err);
    } finally {
      setIsDispatchLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <TopBar title="Alerts & System Notifications" subtitle="Real-time Leave Now reminders, queue updates, and emergency alerts" />

      {/* Dual Channel Highlight Banner */}
      <div className="bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-indigo-600/10 p-5 rounded-3xl border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Dual WhatsApp & SMS Dispatch System
              <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                100% Delivery Reach
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Shridevi Hospital dispatches both WhatsApp alerts and backup GSM SMS to guarantee patients never miss slot calls.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenDispatchSimulator}
          disabled={isDispatchLoading}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md active:scale-95 shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{isDispatchLoading ? 'Loading Simulator...' : 'Open Mobile Alert Simulator'}</span>
        </button>
      </div>

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

      {/* Mobile Dispatch Modal */}
      <MobileDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        dispatchData={dispatchData}
      />
    </div>
  );
};

