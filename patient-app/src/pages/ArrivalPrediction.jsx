import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { TopBar } from '../components/TopBar';
import { Button } from '../components/Button';
import { DEMO_PATIENT } from '../utils/constants';
import { Navigation, Clock, MapPin, Car, Sun, ShieldAlert, ArrowRight, CheckCircle2, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

// Displays the leave-now recommendation and manages its departure countdown.
export const ArrivalPrediction = () => {
  const { queueState } = useQueue();
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes default
  const [isDeparted, setIsDeparted] = useState(false);

  // Departure Countdown
  useEffect(() => {
    if (secondsLeft <= 0 || isDeparted) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, isDeparted]);

  const formatCountdown = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleLeaveNow = () => {
    setIsDeparted(true);
  };

  return (
    <div className="space-y-8">
      <TopBar title="AI Leave Now Departure Optimization" subtitle="Google Maps Traffic & OPD Queue Synchronization" />

      {/* Main AI Departure Feature Hero Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 space-y-8 border-2 border-cyan-500/40 relative overflow-hidden ai-glow-cyan">
        
        {/* Header Pill */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 text-white rounded-2xl shadow-lg">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 tracking-widest">Smart Departure Engine</span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">Optimal Leave Time Recommendation</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-bold text-xs">
            <Radio className="w-4 h-4 text-cyan-500 animate-ping" /> Live Traffic Active
          </div>
        </div>

        {/* Big Countdown & Main Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Left 6 cols: Large Timer */}
          <div className="md:col-span-6 space-y-4 text-center md:text-left">
            <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              {isDeparted ? 'PATIENT IN TRANSIT' : 'DEPARTURE COUNTDOWN TIMER'}
            </p>

            <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-2 border border-slate-800 shadow-2xl">
              <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest">
                {isDeparted ? 'En Route to Hospital' : 'Leave Home In'}
              </span>
              <p className="text-6xl font-black font-mono tracking-tight text-white">
                {isDeparted ? 'EN ROUTE' : formatCountdown(secondsLeft)}
              </p>
              <p className="text-xs text-slate-400">
                {isDeparted
                  ? 'Estimated Arrival at OPD Lounge: 10:42 AM'
                  : 'Leaving at this exact moment ensures you arrive 5 mins before Token Call.'}
              </p>
            </div>

            <Button
              size="lg"
              variant={isDeparted ? 'accent' : 'primary'}
              className="w-full"
              icon={CheckCircle2}
              onClick={handleLeaveNow}
              disabled={isDeparted}
            >
              {isDeparted ? 'Departure Confirmed (GPS Tracking)' : 'I Am Leaving Now'}
            </Button>
          </div>

          {/* Right 6 cols: Departure Calculation Breakdown */}
          <div className="md:col-span-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-blue-500" /> Travel Duration</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{queueState.trafficDurationMinutes} Mins</p>
                <p className="text-[10px] text-emerald-500 font-semibold">Moderate Traffic (Green)</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" /> OPD Queue Wait</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{queueState.estimatedWaitMinutes} Mins</p>
                <p className="text-[10px] text-blue-500 font-semibold">{queueState.patientsAhead} Patients Ahead</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-500" /> Hospital Distance</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{DEMO_PATIENT.distanceKm} Km</p>
                <p className="text-[10px] text-slate-400">Via MG Road Expressway</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-400" /> Weather</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">28°C Clear</p>
                <p className="text-[10px] text-slate-400">Ideal Driving Condition</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Simulated Live Route Preview Map Widget */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Route & Traffic Simulation Map</h3>
            <p className="text-xs text-slate-500">From Patient Residence → Apollo MediFlow Super Speciality OPD</p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold border border-emerald-500/30">
            Route Clear • 12 mins
          </span>
        </div>

        {/* Dynamic Map Graphic Placeholder */}
        <div className="w-full h-64 bg-slate-900 rounded-2xl relative overflow-hidden flex items-center justify-center p-6 border border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

          {/* Route path graphic */}
          <svg className="absolute inset-0 w-full h-full stroke-cyan-500/40" strokeWidth="4" fill="none">
            <path d="M 50 200 Q 250 50 450 180 T 850 100" strokeDasharray="6,6" className="animate-pulse" />
          </svg>

          {/* Patient start node */}
          <div className="absolute left-12 bottom-12 p-3 bg-blue-600 text-white rounded-2xl shadow-lg flex items-center gap-2 text-xs font-bold">
            <MapPin className="w-4 h-4" /> Patient Home (MG Road)
          </div>

          {/* Hospital destination node */}
          <div className="absolute right-12 top-12 p-3 bg-red-600 text-white rounded-2xl shadow-lg flex items-center gap-2 text-xs font-bold">
            <Navigation className="w-4 h-4 animate-bounce" /> Hospital OPD OPD-204
          </div>
        </div>
      </div>

    </div>
  );
};
