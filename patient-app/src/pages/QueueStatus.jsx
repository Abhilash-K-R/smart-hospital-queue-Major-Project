import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { TopBar } from '../components/TopBar';
import { ProgressCard } from '../components/ProgressCard';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Clock, RefreshCw, Volume2, Users, AlertCircle, CheckCircle2, Ticket, Play } from 'lucide-react';
import { motion } from 'framer-motion';

// Shows detailed queue progress and exposes refresh, announcement, and advance controls.
export const QueueStatus = () => {
  const { queueState, toggleAutoRefresh, advanceQueue } = useQueue();
  const [countdown, setCountdown] = useState(30);
  const [announcement, setAnnouncement] = useState(null);

  // 30s Countdown timer
  useEffect(() => {
    if (!queueState.isAutoRefresh) return;
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 1 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, [queueState.isAutoRefresh]);

  // Voice Announcement Simulator
  const handleAnnounce = () => {
    const text = `Now calling Token Number GEN-0${queueState.currentToken} for ${queueState.doctor} in ${queueState.roomNo}`;
    setAnnouncement(text);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Timeline mock tokens
  const timelineTokens = Array.from({ length: 6 }, (_, i) => {
    const num = Math.max(1, queueState.currentToken - 3 + i);
    let status = 'Waiting';
    if (num < queueState.currentToken) status = 'Completed';
    else if (num === queueState.currentToken) status = 'Serving';
    return {
      token: `GEN-0${num}`,
      time: `${9 + Math.floor(i * 10 / 60)}:${(10 + i * 8) % 60 < 10 ? '0' : ''}${(10 + i * 8) % 60} AM`,
      status
    };
  });

  return (
    <div className="space-y-8">
      <TopBar title="Real-time OPD Queue Status" subtitle="Live tracking with auto-refresh every 30 seconds" />

      {/* Control Bar: Auto Refresh & Manual Controls */}
      <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
            <RefreshCw className={`w-5 h-5 ${queueState.isAutoRefresh ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {queueState.isAutoRefresh ? `Auto Sync Active (${countdown}s)` : 'Auto Sync Paused'}
            </p>
            <p className="text-[10px] text-slate-500">Last updated: {queueState.lastUpdated}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" icon={Volume2} onClick={handleAnnounce}>
            Simulate Voice Announcement
          </Button>

          <Button size="sm" variant={queueState.isAutoRefresh ? 'secondary' : 'primary'} onClick={toggleAutoRefresh}>
            {queueState.isAutoRefresh ? 'Pause Sync' : 'Resume 30s Sync'}
          </Button>

          <Button size="sm" icon={Play} onClick={advanceQueue} title="Simulate next patient called">
            Advance Queue
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

      {/* Main Queue Indicators */}
      <ProgressCard
        tokenNumber={queueState.tokenNumber}
        currentToken={queueState.currentToken}
        numericToken={queueState.numericToken}
        patientsAhead={queueState.patientsAhead}
        estimatedWaitMinutes={queueState.estimatedWaitMinutes}
        emergencyCount={queueState.emergencyCount}
      />

      {/* Queue Movement Timeline */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent OPD Token Stream</h3>
          <span className="text-xs text-slate-500 font-semibold">{queueState.department} • {queueState.doctor}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {timelineTokens.map((t, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all text-center space-y-1.5 ${
                t.status === 'Serving'
                  ? 'bg-blue-500 text-white border-blue-600 shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20 scale-105'
                  : t.status === 'Completed'
                  ? 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
              }`}
            >
              <span className="text-[10px] font-mono opacity-80">{t.time}</span>
              <p className="text-xl font-black tracking-tight">{t.token}</p>
              <StatusBadge status={t.status} size="sm" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
