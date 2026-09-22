import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { queueService } from '../services/queueService';
import { TopBar } from '../components/TopBar';
import { ProgressCard } from '../components/ProgressCard';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Clock, RefreshCw, Volume2, Users, AlertCircle, CheckCircle2, Ticket, Calendar, Stethoscope, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

// Shows detailed queue progress and exposes refresh and announcement controls.
export const QueueStatus = () => {
  const navigate = useNavigate();
  const { queueState, toggleAutoRefresh } = useQueue();
  const [countdown, setCountdown] = useState(10);
  const [announcement, setAnnouncement] = useState(null);
  const [streamData, setStreamData] = useState(null);
  const [loadingStream, setLoadingStream] = useState(true);

  const doctorId = queueState.doctorId || 3;

  // Fetch live stream for the assigned/active doctor
  const fetchStream = useCallback(async () => {
    try {
      const data = await queueService.getDoctorQueueStream(doctorId);
      if (data) {
        setStreamData(data);
      }
    } catch (err) {
      console.warn("Failed to fetch doctor stream:", err);
    } finally {
      setLoadingStream(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchStream();
  }, [fetchStream]);

  // 10s Countdown timer and sync
  useEffect(() => {
    if (!queueState.isAutoRefresh) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchStream();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [queueState.isAutoRefresh, fetchStream]);

  // Voice Announcement Simulator
  const handleAnnounce = () => {
    const serving = streamData?.servingToken || queueState.currentToken;
    const docName = streamData?.doctor || queueState.doctor;
    const room = streamData?.roomNo || queueState.roomNo;
    
    if (!serving) {
      setAnnouncement("No token currently being served in OPD room.");
      return;
    }
    
    const text = `Now calling Token Number ${serving} for ${docName} in ${room}`;
    setAnnouncement(text);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const activeDoctorName = streamData?.doctor || queueState.doctor || "General Medicine";
  const activeDepartmentName = streamData?.department || queueState.department || "General Medicine";
  const activeRoomNo = streamData?.roomNo || queueState.roomNo || "Room 204";
  const queueList = streamData?.queue || [];

  return (
    <div className="space-y-8">
      <TopBar 
        title="Real-time OPD Queue Status" 
        subtitle={`Live queue stream for ${activeDepartmentName} • ${activeDoctorName}`} 
      />

      {/* Control Bar: Auto Refresh & Manual Controls */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
            <RefreshCw className={`w-5 h-5 ${queueState.isAutoRefresh ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {queueState.isAutoRefresh ? `Live Sync Active (${countdown}s)` : 'Auto Sync Paused'}
            </p>
            <p className="text-[10px] text-slate-500">
              Department: {activeDepartmentName} | Room: {activeRoomNo}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" icon={Volume2} onClick={handleAnnounce}>
            Voice Announcement
          </Button>

          <Button size="sm" variant={queueState.isAutoRefresh ? 'secondary' : 'primary'} onClick={toggleAutoRefresh}>
            {queueState.isAutoRefresh ? 'Pause Sync' : 'Resume Live Sync'}
          </Button>
        </div>
      </div>

      {/* Voice Announcement Banner */}
      {announcement && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-xl"
        >
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 animate-pulse shrink-0" />
            <p className="text-xs font-bold">{announcement}</p>
          </div>
          <button onClick={() => setAnnouncement(null)} className="text-xs underline text-blue-200 hover:text-white">
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Patient's Personalized Progress Radar (Only when active token is booked) */}
      {queueState.hasActiveToken && queueState.tokenNumber && (
        <ProgressCard
          tokenNumber={queueState.tokenNumber}
          currentToken={queueState.currentToken || streamData?.servingToken}
          numericToken={queueState.numericToken}
          patientsAhead={queueState.patientsAhead}
          estimatedWaitMinutes={queueState.estimatedWaitMinutes}
          emergencyCount={queueState.emergencyCount}
        />
      )}

      {/* Real Queue Movement Stream */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live OPD Token Stream</h3>
            <p className="text-xs text-slate-500">Real-time patient queue progression on doctor's desk</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl border border-blue-200/50 dark:border-blue-900/50">
            <Stethoscope className="w-4 h-4" />
            <span>{activeDepartmentName} • {activeDoctorName}</span>
          </div>
        </div>

        {queueList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {queueList.map((t, idx) => (
              <div
                key={t.id || idx}
                className={`p-4 rounded-2xl border transition-all text-center space-y-1.5 ${
                  t.status === 'serving'
                    ? 'bg-blue-500 text-white border-blue-600 shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20 scale-105'
                    : t.status === 'completed'
                    ? 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <span className="text-[10px] font-mono opacity-80">{t.booked_time}</span>
                <p className="text-xl font-black tracking-tight">{t.tokenNumber}</p>
                <StatusBadge status={t.status === 'serving' ? 'Serving' : t.status === 'completed' ? 'Completed' : 'Waiting'} size="sm" />
                <p className="text-[10px] font-medium opacity-70 truncate">{t.patient_name}</p>
              </div>
            ))}
          </div>
        ) : (
          /* Clean Empty Queue State */
          <div className="p-8 text-center space-y-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Ticket className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">No patients currently in queue</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The consultation queue for {activeDoctorName} is currently clear. Book an appointment to reserve your live token.
              </p>
            </div>
            <Button size="sm" icon={Calendar} onClick={() => navigate('/appointment')}>
              Book Appointment
            </Button>
          </div>
        )}
      </div>

    </div>
  );
};
