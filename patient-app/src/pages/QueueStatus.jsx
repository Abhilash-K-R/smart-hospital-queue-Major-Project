import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { queueService } from '../services/queueService';
import { TopBar } from '../components/TopBar';
import { ProgressCard } from '../components/ProgressCard';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { 
  Clock, RefreshCw, Volume2, Users, AlertCircle, CheckCircle2, 
  Ticket, Calendar, Stethoscope, MapPin, ShieldCheck, Sparkles, Navigation 
} from 'lucide-react';
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
    
    if (!serving || serving === 'OPD-CLOSED') {
      setAnnouncement("OPD hours concluded. No active token is currently being called.");
      return;
    }
    
    const text = `Attention please. Calling Token Number ${serving} for ${docName} in ${room}.`;
    setAnnouncement(text);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const activeDoctorName = streamData?.doctor || queueState.doctor || "Dr. Sneha Patil";
  const activeDepartmentName = streamData?.department || queueState.department || "Dermatology";
  const activeRoomNo = streamData?.roomNo || queueState.roomNo || "Room 210";
  const queueList = streamData?.queue || [];

  return (
    <div className="space-y-8">
      <TopBar 
        title="Live OPD Queue Status" 
        subtitle={`Live consultation stream for ${activeDepartmentName} • ${activeDoctorName}`} 
      />

      {/* Control Bar: Auto Refresh & Manual Controls */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-2xl border border-blue-200/50 dark:border-blue-900/50">
            <RefreshCw className={`w-5 h-5 ${queueState.isAutoRefresh ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {queueState.isAutoRefresh ? `Live Sync Active (Refreshes in ${countdown}s)` : 'Live Sync Paused'}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Connected to Consultation Room: <strong className="text-slate-700 dark:text-slate-300">{activeRoomNo}</strong> ({activeDepartmentName})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
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
          className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between shadow-xl"
        >
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 animate-pulse shrink-0 text-cyan-300" />
            <p className="text-xs font-bold">{announcement}</p>
          </div>
          <button onClick={() => setAnnouncement(null)} className="text-xs font-semibold underline text-blue-200 hover:text-white">
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
          doctor={activeDoctorName}
          department={activeDepartmentName}
          roomNo={activeRoomNo}
          status={queueState.status}
          isExpired={queueState.isExpired}
        />
      )}

      {/* Real Queue Movement Stream Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Consultation Queue Sequence</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                Official OPD Order
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Real-time token advancement as called inside {activeRoomNo}</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <Stethoscope className="w-4 h-4 text-emerald-500" />
            <span>{activeDepartmentName} • {activeDoctorName}</span>
          </div>
        </div>

        {queueList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {queueList.map((t, idx) => {
              const isServing = t.status === 'serving';
              const isCompleted = t.status === 'completed';

              return (
                <div
                  key={t.id || idx}
                  className={`p-4 rounded-2xl border transition-all text-center space-y-2 relative ${
                    isServing
                      ? 'bg-gradient-to-b from-blue-600 to-indigo-700 text-white border-blue-600 shadow-xl shadow-blue-500/25 ring-4 ring-blue-500/20 scale-105 z-10'
                      : isCompleted
                      ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className={isServing ? 'text-blue-200' : 'text-slate-400'}>
                      {t.booked_time || "Now"}
                    </span>
                    {isServing && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </div>

                  <p className={`text-2xl font-black font-mono tracking-tight ${isServing ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {t.tokenNumber}
                  </p>

                  <div className="pt-0.5">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isServing
                        ? 'bg-white/20 text-white'
                        : isCompleted
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                    }`}>
                      {isServing ? 'IN ROOM' : isCompleted ? 'DONE' : `WAITING #${idx + 1}`}
                    </span>
                  </div>

                  <p className={`text-[10px] font-medium truncate pt-1 border-t ${
                    isServing ? 'border-blue-400/30 text-blue-100' : 'border-slate-100 dark:border-slate-800 text-slate-500'
                  }`}>
                    {t.patient_name || 'Patient'}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          /* Clean Reassuring Empty Queue State */
          <div className="p-8 text-center space-y-4 bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Ticket className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">All Patients Attended in Queue</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                The consultation queue for {activeDoctorName} ({activeRoomNo}) is clear. You can reserve a new consultation token anytime.
              </p>
            </div>
            <Button size="sm" icon={Calendar} onClick={() => navigate('/appointment')}>
              Book Consultation Token
            </Button>
          </div>
        )}
      </div>

    </div>
  );
};
