import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, Users, ShieldAlert, CheckCircle2, AlertTriangle, 
  Stethoscope, MapPin, Sparkles, PhoneCall, Calendar, ArrowRight,
  Activity, BellRing
} from 'lucide-react';
import { Button } from './Button';

// Renders clinical hospital queue status with trust-building indicators and milestone progression.
export const ProgressCard = ({
  tokenNumber = null,
  currentToken = null,
  numericToken = null,
  patientsAhead = 0,
  estimatedWaitMinutes = 0,
  emergencyCount = 0,
  status = "pending",
  isExpired = false,
  doctor = "Dr. Sneha Patil",
  department = "Dermatology",
  roomNo = "Room 210"
}) => {
  const navigate = useNavigate();
  if (!tokenNumber) return null;

  const now = new Date();
  const isPastOpdHours = now.getHours() >= 20 || now.getHours() < 8;
  const isSlotExpired = isExpired || status === 'expired' || currentToken === 'OPD-CLOSED';
  const isServingNow = patientsAhead === 0 && !isSlotExpired;
  const isNextInLine = patientsAhead === 1 && !isSlotExpired;

  // Safe numeric calculation
  const currNum = typeof currentToken === 'number' 
    ? currentToken 
    : (parseInt(String(currentToken || '1').replace(/\D/g, '')) || 1);
  const total = numericToken || currNum || 1;
  const progressPercent = isSlotExpired ? 100 : Math.min(100, Math.max(10, Math.round((currNum / Math.max(total, 1)) * 100)));

  // -----------------------------------------------------------------
  // STATE 1: OPD CLOSED OR SLOT EXPIRED (REASSURING CLINICAL CARD)
  // -----------------------------------------------------------------
  if (isSlotExpired || isPastOpdHours) {
    return (
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-amber-200 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 dark:from-slate-900 dark:to-amber-950/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-200/60 dark:border-amber-900/40 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-2xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  OPD Closed (Evening Hours)
                </span>
                <span className="text-xs text-slate-500">• Token #{tokenNumber}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                Hospital OPD Hours Concluded for Today
              </h3>
            </div>
          </div>

          <div className="text-right self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-500 block">General OPD Timings</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">8:00 AM – 8:00 PM IST</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Consultation Department</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{department} • {roomNo}</p>
            <p className="text-xs text-slate-500">{doctor}</p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Queue Reopening</span>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Tomorrow at 8:00 AM</p>
            <p className="text-xs text-slate-500">Fresh morning token allocation</p>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900/70 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Emergency Support</span>
            <p className="text-sm font-bold text-rose-600">24/7 Trauma Helpline</p>
            <p className="text-xs text-slate-500">Call: 0816 2212345</p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/60 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Need consultation tomorrow? Reserve your slot in advance to skip registration queues.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              size="sm"
              icon={Calendar}
              onClick={() => navigate('/appointment')}
              className="w-full sm:w-auto"
            >
              Book for Tomorrow Morning
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // STATE 2: ACTIVE LIVE QUEUE (MODERN CLINICAL HOSPITAL DISPLAY)
  // -----------------------------------------------------------------
  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner: Hospital Verified Clinical Radar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              Live OPD Progression
            </span>
            <span className="text-xs text-slate-500">Shridevi Hospital • Tumakuru</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {department} Consultation Queue
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
            {roomNo}
          </span>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-500" />
            {doctor}
          </span>
        </div>
      </div>

      {/* Main Double Token Display: Serving Inside vs. Your Token */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card 1: Currently In Consultation Room */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-lg space-y-3 relative overflow-hidden border border-blue-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Currently Inside Room
            </span>
            <span className="text-xs text-blue-200 font-mono">{roomNo}</span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <p className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                {currentToken || "GEN-001"}
              </p>
              <p className="text-xs text-blue-200 mt-1">Consultation in progress with {doctor}</p>
            </div>
            <div className="p-3 bg-blue-600/40 rounded-2xl border border-blue-400/30">
              <Stethoscope className="w-6 h-6 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Card 2: Your Personal Assigned Token */}
        <div className={`p-5 rounded-2xl border transition-all space-y-3 relative overflow-hidden ${
          isServingNow
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
            : isNextInLine
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
            : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Your Personal Token
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isServingNow
                ? 'bg-emerald-500 text-white animate-bounce'
                : isNextInLine
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
            }`}>
              {isServingNow ? "YOU'RE CALLED NOW!" : isNextInLine ? "YOU'RE NEXT IN LINE!" : `Pos #${patientsAhead + 1}`}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <p className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400">
                {tokenNumber}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {isServingNow 
                  ? "Please enter Room 210 immediately." 
                  : `${patientsAhead} patient${patientsAhead === 1 ? '' : 's'} ahead of you in waiting lounge`}
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

      </div>

      {/* Live Queue Milestone Progress Bar */}
      <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-500" /> Consultation Stage Tracker
          </span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {isServingNow ? "Stage 4 of 4: Inside Room" : isNextInLine ? "Stage 3 of 4: Next in Line" : "Stage 2 of 4: Waiting Lounge"}
          </span>
        </div>

        {/* Milestone Steps */}
        <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-semibold">
          <div className="space-y-1.5">
            <div className="h-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 block truncate">1. Registered</span>
          </div>
          <div className="space-y-1.5">
            <div className="h-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 block truncate">2. Arrived in Lounge</span>
          </div>
          <div className="space-y-1.5">
            <div className={`h-2 rounded-full ${isNextInLine || isServingNow ? 'bg-emerald-500' : 'bg-blue-300 dark:bg-blue-900'}`} />
            <span className={isNextInLine || isServingNow ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
              3. Next in Line
            </span>
          </div>
          <div className="space-y-1.5">
            <div className={`h-2 rounded-full ${isServingNow ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
            <span className={isServingNow ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
              4. Consultation
            </span>
          </div>
        </div>
      </div>

      {/* Clinical Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Wait Duration</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {estimatedWaitMinutes > 0 ? `~${estimatedWaitMinutes} Mins` : "Under 5 Mins"}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Patients Ahead</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {patientsAhead} {patientsAhead === 1 ? 'Patient' : 'Patients'}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Emergency Status</span>
            <span className="text-base font-bold text-emerald-600">
              {emergencyCount > 0 ? `${emergencyCount} Priority Cases` : "Normal Flow"}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
