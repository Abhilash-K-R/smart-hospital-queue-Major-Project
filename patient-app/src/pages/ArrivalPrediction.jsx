import React, { useState, useEffect, useCallback } from 'react';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { queueService } from '../services/queueService';
import { notificationService } from '../services/notificationService';
import { useLocationResolver } from '../hooks/useLocationResolver';
import { TopBar } from '../components/TopBar';
import { Button } from '../components/Button';
import MobileDispatchModal from '../components/MobileDispatchModal';
import LocationOriginSelector from '../components/LocationOriginSelector';
import { DEMO_PATIENT } from '../utils/constants';
import {
  Navigation,
  Clock,
  MapPin,
  Car,
  Sun,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Radio,
  RefreshCw,
  AlertTriangle,
  Smartphone,
  MessageSquare,
  Bell,
  Send,
  Compass,
  Users,
  Edit3
} from 'lucide-react';
import { motion } from 'framer-motion';

// Displays the live AI leave-now recommendation with Dual-Mode Location Handling (Live GPS + Family/Pincode Mode)
export const ArrivalPrediction = () => {
  const { queueState } = useQueue();
  const { user } = useAuth();
  
  // Dual-Mode Location Resolver Hook
  const {
    locationState,
    coords,
    mode,
    isGPS,
    isFamilyBooking,
    label: locationLabel,
    isLocating,
    setLiveGPSMode,
    setManualLocationByPincode
  } = useLocationResolver();

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [departureData, setDepartureData] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [isDeparted, setIsDeparted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mobile dispatch simulator state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchData, setDispatchData] = useState(null);
  const [isDispatchLoading, setIsDispatchLoading] = useState(false);

  // Fetch real departure prediction from FastAPI backend based on active resolved coordinates
  const fetchPrediction = useCallback(async () => {
    setIsLoading(true);
    try {
      const apptId = user?.appointment_id || user?.appointmentId || 0;
      const res = await queueService.checkDeparture(apptId, coords.lat, coords.lng);
      setDepartureData(res);
      if (res && typeof res.recommendedLeaveInMinutes === 'number') {
        setSecondsLeft(Math.max(0, Math.round(res.recommendedLeaveInMinutes * 60)));
      }
    } catch (err) {
      console.warn("Real /departure-check call failed, using fallback:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, coords.lat, coords.lng]);

  // Initial load and periodic re-check every 30s or when coordinates change
  useEffect(() => {
    fetchPrediction();
    const interval = setInterval(fetchPrediction, 30000);
    return () => clearInterval(interval);
  }, [fetchPrediction]);

  // Departure Countdown
  useEffect(() => {
    if (secondsLeft <= 0 || isDeparted) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
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

  const shouldLeaveNow = departureData?.should_leave_now || (secondsLeft <= 0 && !isDeparted);

  // Prepare and open Dual WhatsApp & SMS Dispatch Modal
  const handleOpenDispatchSimulator = async () => {
    setIsDispatchLoading(true);
    try {
      const travelMins = departureData?.travel_time_minutes ?? queueState.trafficDurationMinutes ?? 15;
      const waitMins = departureData?.predicted_wait_minutes ?? queueState.estimatedWaitMinutes ?? 35;
      
      const payload = {
        patient_name: user?.name || DEMO_PATIENT.name,
        phone: user?.phone || DEMO_PATIENT.phone || "9876543210",
        token_number: user?.tokenNumber || queueState.tokenNumber || "OPD-011",
        doctor_name: user?.doctor || queueState.doctorName || "Dr. Rajeswari R.",
        room_number: user?.roomNo || "Room 204",
        travel_time_minutes: travelMins,
        buffer_minutes: 10,
        total_travel_needed_minutes: travelMins + 10,
        estimated_wait_minutes: waitMins,
        should_leave_now: Boolean(shouldLeaveNow),
        origin_address: locationState?.name || "Tumakuru City",
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
      <TopBar title="AI Leave Now Departure Optimization" subtitle="Google Maps Traffic & OPD Queue Synchronization" />

      {/* Dual-Mode Location Origin Indicator Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-teal-500/10 border border-blue-500/20 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl shrink-0 ${
            isGPS 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
              : 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
          }`}>
            {isGPS ? <Navigation className="w-5 h-5 animate-pulse" /> : <Users className="w-5 h-5" />}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                {isGPS ? 'Mode A: Live GPS' : 'Mode B: Family / Remote'}
              </span>
              {isFamilyBooking && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
                  Beneficiary: {locationState.beneficiaryName || 'Family Member'}
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span>Origin: {locationState?.name || locationLabel}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Coordinates: {coords.lat}, {coords.lng} • Route to Shridevi Hospital (Sira Road)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsLocationModalOpen(true)}
          className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Change Origin Location
        </button>
      </div>

      {/* Main AI Departure Feature Hero Card */}
      <div className={`glass-card rounded-3xl p-6 sm:p-10 space-y-8 border-2 relative overflow-hidden transition-all duration-500 ${
        shouldLeaveNow && !isDeparted
          ? 'border-rose-500/60 shadow-2xl shadow-rose-500/10'
          : isDeparted
          ? 'border-emerald-500/60 shadow-2xl shadow-emerald-500/10'
          : 'border-cyan-500/40 ai-glow-cyan'
      }`}>
        
        {/* Header Pill */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 text-white rounded-2xl shadow-lg ${
              shouldLeaveNow && !isDeparted
                ? 'bg-gradient-to-tr from-rose-500 to-amber-600'
                : isDeparted
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                : 'bg-gradient-to-tr from-cyan-500 to-blue-600'
            }`}>
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 tracking-widest">
                Smart Departure Engine • Shridevi Hospital Tumakuru
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {isDeparted
                  ? 'Patient En Route (Live Navigation Active)'
                  : shouldLeaveNow
                  ? '🚨 Critical: Leave Home Now!'
                  : 'Optimal Leave Time Recommendation'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchPrediction}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Sync Live
            </button>
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-bold text-xs ${
              shouldLeaveNow && !isDeparted
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500/40 text-rose-600 dark:text-rose-400'
                : 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-500/30 text-cyan-600 dark:text-cyan-400'
            }`}>
              <Radio className="w-4 h-4 animate-ping" /> {departureData?.trafficCondition || 'Live Route Active'}
            </div>
          </div>
        </div>

        {/* Big Countdown & Main Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Left 6 cols: Large Timer / Alert */}
          <div className="md:col-span-6 space-y-4 text-center md:text-left">
            <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              {isDeparted ? 'PATIENT IN TRANSIT' : shouldLeaveNow ? 'IMMEDIATE DEPARTURE REQUIRED' : 'DEPARTURE COUNTDOWN TIMER'}
            </p>

            <div className={`p-6 rounded-3xl space-y-2 border shadow-2xl ${
              shouldLeaveNow && !isDeparted
                ? 'bg-gradient-to-br from-rose-950/90 to-slate-900 border-rose-500/50 text-white'
                : isDeparted
                ? 'bg-gradient-to-br from-emerald-950/90 to-slate-900 border-emerald-500/50 text-white'
                : 'bg-slate-900 text-white border-slate-800'
            }`}>
              <span className={`text-xs font-bold uppercase tracking-widest ${
                shouldLeaveNow && !isDeparted ? 'text-rose-400' : isDeparted ? 'text-emerald-400' : 'text-cyan-400'
              }`}>
                {isDeparted ? 'En Route to Hospital' : shouldLeaveNow ? 'Depart Immediately' : 'Leave Home In'}
              </span>

              <p className={`text-6xl font-black font-mono tracking-tight ${
                shouldLeaveNow && !isDeparted ? 'text-rose-400 animate-pulse' : 'text-white'
              }`}>
                {isDeparted ? 'EN ROUTE' : shouldLeaveNow ? 'LEAVE NOW' : formatCountdown(secondsLeft)}
              </p>

              <p className="text-xs text-slate-300">
                {isDeparted
                  ? `Estimated Arrival at OPD Lounge: ${departureData?.estimatedArrivalTime || '10:42 AM'}`
                  : departureData?.message
                  ? departureData.message
                  : shouldLeaveNow
                  ? 'Your travel time matches or exceeds your predicted wait time. Depart now to avoid missing your slot!'
                  : 'Leaving at this exact moment ensures you arrive 5 mins before Token Call.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                variant={isDeparted ? 'accent' : shouldLeaveNow ? 'primary' : 'primary'}
                className="flex-1"
                icon={CheckCircle2}
                onClick={handleLeaveNow}
                disabled={isDeparted}
              >
                {isDeparted ? 'Departure Confirmed' : 'I Am Leaving Now'}
              </Button>

              <button
                onClick={handleOpenDispatchSimulator}
                disabled={isDispatchLoading}
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all text-sm"
                title="Open live WhatsApp alert on your phone"
              >
                <MessageSquare className="w-4 h-4 text-emerald-200" />
                <span>{isDispatchLoading ? 'Generating Alert...' : 'Open WhatsApp Alert'}</span>
              </button>
            </div>
          </div>

          {/* Right 6 cols: Departure Calculation Breakdown */}
          <div className="md:col-span-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-blue-500" /> Travel Duration</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {departureData?.travel_time_minutes ?? queueState.trafficDurationMinutes} Mins
                </p>
                <p className="text-[10px] text-emerald-500 font-semibold">Live Google Maps / Haversine</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" /> OPD Queue Wait</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {departureData?.predicted_wait_minutes ?? queueState.estimatedWaitMinutes} Mins
                </p>
                <p className="text-[10px] text-blue-500 font-semibold">{queueState.patientsAhead} Patients Ahead</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-500" /> Hospital Distance</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {departureData?.distanceKm ?? DEMO_PATIENT.distanceKm} Km
                </p>
                <p className="text-[10px] text-slate-400">SIET Tumakuru Route</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-400" /> Weather</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {departureData?.weather || '28°C Clear'}
                </p>
                <p className="text-[10px] text-slate-400">Ideal Driving Condition</p>
              </div>
            </div>

            {/* Real-time automated alert notification card */}
            <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Automated Mobile Dispatch Active</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live alerts sent to +91 {user?.phone || DEMO_PATIENT.phone || "9876543210"} when departure is required.
                  </p>
                </div>
              </div>
              <a
                href={`https://maps.google.com/?q=13.376230,77.097439`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 rounded-xl transition-colors shrink-0 shadow-sm flex items-center gap-1"
              >
                <Navigation className="w-3 h-3" /> Maps ➔
              </a>
            </div>
          </div>

        </div>

      </div>

      {/* Live Route Preview Map Widget */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Route & Traffic Simulation Map</h3>
            <p className="text-xs text-slate-500">
              From: {locationState?.name || 'Patient Residence'} → Shridevi Hospital & Research Hospital, SIET Campus
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold border border-emerald-500/30">
            Route Clear • {departureData?.travel_time_minutes ?? 12} mins
          </span>
        </div>

        {/* Dynamic Map Graphic */}
        <div className="w-full h-64 bg-slate-900 rounded-2xl relative overflow-hidden flex items-center justify-center p-6 border border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

          {/* Route path graphic */}
          <svg className="absolute inset-0 w-full h-full stroke-cyan-500/40" strokeWidth="4" fill="none">
            <path d="M 50 200 Q 250 50 450 180 T 850 100" strokeDasharray="6,6" className="animate-pulse" />
          </svg>

          {/* Patient start node */}
          <div className="absolute left-6 sm:left-12 bottom-12 p-3 bg-blue-600 text-white rounded-2xl shadow-lg flex items-center gap-2 text-xs font-bold max-w-xs truncate">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">{locationState?.name || 'Patient Origin'}</span>
          </div>

          {/* Hospital destination node */}
          <div className="absolute right-6 sm:right-12 top-12 p-3 bg-red-600 text-white rounded-2xl shadow-lg flex items-center gap-2 text-xs font-bold">
            <Navigation className="w-4 h-4 animate-bounce shrink-0" /> Shridevi Hospital OPD
          </div>
        </div>
      </div>

      {/* Dual WhatsApp & SMS Dispatch Modal */}
      <MobileDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        dispatchData={dispatchData}
        patientName={user?.name || DEMO_PATIENT.name}
        phone={user?.phone || DEMO_PATIENT.phone || "9876543210"}
      />

      {/* Dual Mode Location Origin Picker Modal */}
      <LocationOriginSelector
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={locationState}
        onSelectGPS={setLiveGPSMode}
        onSelectManual={setManualLocationByPincode}
        isLocating={isLocating}
      />

    </div>
  );
};

export default ArrivalPrediction;
