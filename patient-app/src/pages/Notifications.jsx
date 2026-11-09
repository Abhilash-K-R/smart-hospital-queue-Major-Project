import React, { useState } from 'react';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import { TopBar } from '../components/TopBar';
import { NotificationCard } from '../components/NotificationCard';
import { Button } from '../components/Button';
import MobileDispatchModal from '../components/MobileDispatchModal';
import { DEMO_PATIENT } from '../utils/constants';
import { Bell, CheckCheck, Filter, Smartphone, ShieldCheck, CheckCircle2, Edit3, Send, Check } from 'lucide-react';

// Loads the notification feed and allows patient to configure their mobile alert number.
export const Notifications = () => {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotification();
  const { user, setUser } = useAuth();
  const [filter, setFilter] = useState('All');
  const [phone, setPhone] = useState(user?.phone || "");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dispatchData, setDispatchData] = useState(null);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'Unread') return !n.read;
    if (filter === 'Emergency') return n.type === 'emergency' || n.type === 'no_show_warning' || n.priority === 'warning' || n.severity === 'critical';
    return true;
  });

  const handleMarkAllRead = () => {
    markAllRead();
  };

  const handleSavePhone = () => {
    if (user) {
      const updated = { ...user, phone };
      setUser(updated);
      localStorage.setItem('mediflow_user', JSON.stringify(updated));
    }
    setIsEditingPhone(false);
    setPhoneSaved(true);
    setTimeout(() => setPhoneSaved(false), 3000);
  };

  const handlePreviewSMS = async () => {
    setIsSendingTest(true);
    try {
      const payload = {
        patient_name: user?.name || "Patient",
        phone: phone || user?.phone || "9876543210",
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
      setIsModalOpen(true);
    } catch (err) {
      console.error("Failed to generate SMS dispatch preview:", err);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-8">
      <TopBar title="Alerts & Mobile Notification Hub" subtitle="Automated Leave-Now alerts, OPD queue updates, and emergency priority notices" />

      {/* Patient Automated Mobile Dispatch Card */}
      <div className="bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-teal-600/15 p-6 rounded-3xl border border-blue-500/25 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Automated Fast2SMS Carrier Alerts
                </h3>
                <span className="text-[10px] bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Active • GSM 7-bit ASCII
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Shridevi Hospital automatically dispatches carrier SMS alerts when it's time to leave home and when your token is called.
              </p>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            onClick={handlePreviewSMS}
            disabled={isSendingTest}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95 shrink-0"
            title="Preview the live OPD departure SMS alert"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingTest ? 'Loading Preview...' : 'Preview Carrier SMS Alert'}</span>
          </button>
        </div>

        {/* Phone Input & Preferences Bar */}
        <div className="bg-white/70 dark:bg-slate-900/70 p-3.5 rounded-2xl border border-blue-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Alert Mobile Number:</span>
            {isEditingPhone ? (
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-slate-600 dark:text-slate-300">+91</span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                  className="w-32 px-2.5 py-1 bg-white dark:bg-slate-950 border border-blue-400 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="10 digit number"
                  autoFocus
                />
                <button
                  onClick={handleSavePhone}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center space-x-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Save</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800">
                  +91 {phone}
                </span>
                <button
                  onClick={() => setIsEditingPhone(true)}
                  className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Edit phone number"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                {phoneSaved && (
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold animate-fade-in">
                    ✓ Saved!
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-blue-500" /> Fast2SMS Carrier: Instant
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Bell className="w-3 h-3 text-indigo-500" /> In-App Push: Real-Time
            </span>
          </div>
        </div>

      </div>

      <MobileDispatchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dispatchData={dispatchData}
      />


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


