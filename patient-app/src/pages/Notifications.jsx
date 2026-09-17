import React, { useState } from 'react';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import { TopBar } from '../components/TopBar';
import { NotificationCard } from '../components/NotificationCard';
import { Button } from '../components/Button';
import { DEMO_PATIENT } from '../utils/constants';
import { Bell, CheckCheck, Filter, Smartphone, MessageSquare, ShieldCheck, CheckCircle2, Edit3, Send, Check } from 'lucide-react';

// Loads the notification feed and allows patient to configure their mobile alert number.
export const Notifications = () => {
  const { notifications, unreadCount, markAsRead } = useNotification();
  const { user, setUser } = useAuth();
  const [filter, setFilter] = useState('All');
  const [phone, setPhone] = useState(user?.phone || DEMO_PATIENT.phone || "9876543210");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'Unread') return !n.read;
    if (filter === 'Emergency') return n.type === 'emergency' || n.priority === 'warning';
    return true;
  });

  const handleMarkAllRead = () => {
    notifications.forEach(n => markAsRead(n.id));
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

  const handleSendTestWhatsApp = async () => {
    setIsSendingTest(true);
    try {
      const payload = {
        patient_name: user?.name || DEMO_PATIENT.name,
        phone: phone,
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
      if (res && res.whatsapp_share_url) {
        window.open(res.whatsapp_share_url, '_blank');
      } else if (res && res.whatsapp?.share_url) {
        window.open(res.whatsapp.share_url, '_blank');
      }
    } catch (err) {
      console.error("Failed to generate WhatsApp alert:", err);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-8">
      <TopBar title="Alerts & Mobile Notification Hub" subtitle="Automated Leave-Now alerts, OPD queue updates, and emergency priority notices" />

      {/* Patient Automated Mobile Dispatch Card */}
      <div className="bg-gradient-to-r from-emerald-600/15 via-teal-600/10 to-indigo-600/15 p-6 rounded-3xl border border-emerald-500/25 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Automated WhatsApp & SMS Mobile Alerts
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Active • 100% Reach
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Shridevi Hospital automatically sends WhatsApp & SMS alerts when it's time to leave home and when your token is called.
              </p>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            onClick={handleSendTestWhatsApp}
            disabled={isSendingTest}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95 shrink-0"
            title="Sends the live OPD departure alert directly to your WhatsApp"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingTest ? 'Opening WhatsApp...' : 'Test WhatsApp Alert on My Phone'}</span>
          </button>
        </div>

        {/* Phone Input & Preferences Bar */}
        <div className="bg-white/70 dark:bg-slate-900/70 p-3.5 rounded-2xl border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
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
                  className="w-32 px-2.5 py-1 bg-white dark:bg-slate-950 border border-emerald-400 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="10 digit number"
                  autoFocus
                />
                <button
                  onClick={handleSavePhone}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Save</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  +91 {phone}
                </span>
                <button
                  onClick={() => setIsEditingPhone(true)}
                  className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  title="Edit phone number"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                {phoneSaved && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold animate-fade-in">
                    ✓ Saved!
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-emerald-500" /> WhatsApp: Instant
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-blue-500" /> GSM SMS: Backup
            </span>
          </div>
        </div>

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
    </div>
  );
};


