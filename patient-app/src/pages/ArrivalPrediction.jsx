import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { queueService } from '../services/queueService';
import { patientService } from '../services/patientService';
import { notificationService } from '../services/notificationService';
import { useLocationResolver } from '../hooks/useLocationResolver';
import { LOCATION_PRESETS, resolvePincode, PINCODE_DATABASE } from '../utils/locationResolver';
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
  Edit3,
  Search,
  Check,
  Sparkles,
  Ticket,
  XCircle,
  Trash2,
  Calendar,
  CalendarX,
  PlusCircle,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

// Displays the live AI leave-now recommendation with Dual-Mode Location Handling (Live GPS + Family/Pincode Mode)
export const ArrivalPrediction = () => {
  const navigate = useNavigate();
  const { queueState, setQueueState } = useQueue();
  const { user, setUser } = useAuth();
  
  // Dual-Mode Location Resolver Hook
  const {
    locationState,
    coords,
    hasCoords,
    mode,
    isGPS,
    isFamilyBooking,
    label: locationLabel,
    isLocating,
    gpsError,
    gpsErrorCode,
    isPermissionBlocked,
    setLiveGPSMode,
    setManualLocationByPincode,
    setManualLocationCustom,
    detectLiveLocation,
    refreshGPS
  } = useLocationResolver();

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [departureData, setDepartureData] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isDeparted, setIsDeparted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cancellation State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelToast, setCancelToast] = useState(null);
  const [isCancelled, setIsCancelled] = useState(user?.status === 'cancelled');

  // In-card Pincode & Beneficiary State for Mode B
  const [customSearchQuery, setCustomSearchQuery] = useState(locationState?.pincode || locationState?.name || '');
  const [beneficiaryInput, setBeneficiaryInput] = useState(locationState?.beneficiaryName || '');
  const [cardSearchResults, setCardSearchResults] = useState([]);
  const [isCardSearching, setIsCardSearching] = useState(false);
  const [showCardDropdown, setShowCardDropdown] = useState(false);
  const cardDropdownRef = useRef(null);

  // Mobile dispatch simulator state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchData, setDispatchData] = useState(null);
  const [isDispatchLoading, setIsDispatchLoading] = useState(false);

  // Calculate time remaining until departure taking into account scheduled slot or live queue
  const calculateSecondsToDeparture = useCallback((resData) => {
    const travelMins = typeof resData?.travel_time_minutes === 'number'
      ? resData.travel_time_minutes
      : (queueState.trafficDurationMinutes || 15);
    const bufferMins = 15; // 15-minute buffer requirement

    // Check if appointment has a specific future date and time slot
    const rawDate = user?.appointmentDate || user?.date;
    const rawTime = user?.timeSlot || user?.appointmentTime;

    if (rawTime) {
      let hours = 0;
      let minutes = 0;
      const timeMatch = String(rawTime).match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
        const meridiem = timeMatch[3] ? timeMatch[3].toUpperCase() : null;
        if (meridiem === 'PM' && hours < 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;

        const targetSlot = new Date();
        if (rawDate && rawDate !== "Today") {
          const parsed = new Date(rawDate);
          if (!isNaN(parsed.getTime())) {
            targetSlot.setFullYear(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
          }
        }
        targetSlot.setHours(hours, minutes, 0, 0);

        const now = new Date();
        // If scheduled for a future slot (e.g., later today or tomorrow)
        if (targetSlot.getTime() > now.getTime()) {
          const targetArrivalMs = targetSlot.getTime() - (bufferMins * 60 * 1000);
          const optimalLeaveMs = targetArrivalMs - (travelMins * 60 * 1000);
          const diffSecs = Math.floor((optimalLeaveMs - now.getTime()) / 1000);
          return Math.max(0, diffSecs);
        }
      }
    }

    // Default to live queue prediction if walk-in or slot is right now
    const predictedWait = typeof resData?.predicted_wait_minutes === 'number'
      ? resData.predicted_wait_minutes
      : (queueState.estimatedWaitMinutes || 35);
    const minutesUntilDeparture = predictedWait - (travelMins + bufferMins);

    if (resData?.should_leave_now || minutesUntilDeparture <= 0) {
      return 0;
    }
    return Math.max(0, Math.round(minutesUntilDeparture * 60));
  }, [user, queueState.estimatedWaitMinutes, queueState.trafficDurationMinutes]);

  const prevCoordsRef = useRef({ lat: null, lng: null });
  const isFetchingRef = useRef(false);

  // Fetch real departure prediction from FastAPI backend based on active resolved coordinates
  const fetchPrediction = useCallback(async (forced = false) => {
    if (isCancelled || user?.status === 'cancelled') {
      setIsLoading(false);
      return;
    }

    const currentLat = coords?.lat;
    const currentLng = coords?.lng;

    // Do NOT call departure-check if coordinates have not been acquired yet
    if (!currentLat || !currentLng) {
      setDepartureData(null);
      setSecondsLeft(0);
      setIsLoading(false);
      return;
    }

    // Check if coordinates actually changed unless forced
    if (
      !forced &&
      prevCoordsRef.current.lat === currentLat &&
      prevCoordsRef.current.lng === currentLng
    ) {
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    prevCoordsRef.current = { lat: currentLat, lng: currentLng };

    setIsLoading(true);
    try {
      const apptId = user?.appointment_id || user?.appointmentId || 0;
      const res = await queueService.checkDeparture(apptId, currentLat, currentLng);
      setDepartureData(res);
      const remainingSecs = calculateSecondsToDeparture(res);
      setSecondsLeft(remainingSecs);
    } catch (err) {
      console.warn("Departure check fallback active:", err.message);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.appointment_id, user?.appointmentId, user?.status, coords?.lat, coords?.lng, isCancelled, calculateSecondsToDeparture]);

  // Synchronize metric cards and departure calculation immediately whenever location coordinates change
  useEffect(() => {
    if (isCancelled || user?.status === 'cancelled') return;
    if (coords?.lat && coords?.lng) {
      fetchPrediction(true);
    }
  }, [coords?.lat, coords?.lng, isCancelled, user?.status]);

  // Periodic background re-check every 60 seconds (non-hammering)
  useEffect(() => {
    if (isCancelled || user?.status === 'cancelled') return;
    const interval = setInterval(() => {
      fetchPrediction(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchPrediction, isCancelled, user?.status]);

  // Departure Countdown Timer Tick
  useEffect(() => {
    if (secondsLeft <= 0 || isDeparted || isCancelled || user?.status === 'cancelled') return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, isDeparted, isCancelled, user?.status]);

  // Debounced search for In-Card Mode B search input
  useEffect(() => {
    const clean = customSearchQuery.trim();
    if (!clean || clean.length < 2) {
      setCardSearchResults([]);
      setIsCardSearching(false);
      return;
    }

    if (PINCODE_DATABASE[clean]) {
      const pinObj = {
        name: PINCODE_DATABASE[clean].name,
        locality: PINCODE_DATABASE[clean].tag || PINCODE_DATABASE[clean].name,
        district: PINCODE_DATABASE[clean].district,
        lat: PINCODE_DATABASE[clean].lat,
        lng: PINCODE_DATABASE[clean].lng,
        pincode: clean,
        isEstimated: false
      };
      setCardSearchResults([pinObj]);
    }

    const timer = setTimeout(async () => {
      setIsCardSearching(true);
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const resp = await fetch(`${backendUrl}/geocode?query=${encodeURIComponent(clean)}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.results && data.results.length > 0) {
            setCardSearchResults(data.results);
            setShowCardDropdown(true);
          } else if (data && data.success) {
            setCardSearchResults([{
              name: data.name,
              locality: data.district,
              district: data.district,
              lat: data.lat,
              lng: data.lng,
              isEstimated: data.isEstimated
            }]);
            setShowCardDropdown(true);
          }
        }
      } catch (err) {
        console.warn("Card autocomplete search failed:", err);
      } finally {
        setIsCardSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customSearchQuery]);

  // Format countdown string supporting days, hours, MM:SS and immediate departure
  const formatCountdownInfo = (totalSecs) => {
    if (!coords) {
      return {
        timeFormatted: "--:--",
        badgeText: "📍 Set Starting Point",
        isImmediate: false,
        description: "Detect live device GPS or select your town in Mode B to calculate travel time."
      };
    }

    if (totalSecs <= 0 || (departureData?.should_leave_now && !isDeparted)) {
      return {
        timeFormatted: "00:00",
        badgeText: "🚨 LEAVE NOW FOR HOSPITAL",
        isImmediate: true,
        description: "Your commute time matches or exceeds your reporting buffer. Depart immediately!"
      };
    }

    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (days >= 1) {
      return {
        timeFormatted: `${days}d ${hours}h`,
        badgeText: `${days} ${days === 1 ? 'Day' : 'Days'}, ${hours} ${hours === 1 ? 'Hour' : 'Hours'} left`,
        isImmediate: false,
        description: `Appointment scheduled in advance. Commute time: ~${departureData?.travel_time_minutes || 15} mins.`
      };
    }
    if (hours >= 1) {
      return {
        timeFormatted: `${hours}h ${mins}m`,
        badgeText: `${hours} ${hours === 1 ? 'Hour' : 'Hours'}, ${mins} Mins left`,
        isImmediate: false,
        description: `Optimal departure sync based on scheduled time and live traffic.`
      };
    }

    const mmss = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    return {
      timeFormatted: mmss,
      badgeText: `${mmss} left`,
      isImmediate: false,
      description: "Leaving at this exact moment ensures you arrive 15 mins before consultation."
    };
  };

  const countdownInfo = formatCountdownInfo(secondsLeft);
  const shouldLeaveNow = departureData?.should_leave_now || (secondsLeft <= 0 && departureData !== null && !isDeparted);

  // Format date helper for the TIME SLOT card
  const getFormattedDate = () => {
    const rawDate = user?.appointmentDate || user?.date;
    if (rawDate && rawDate !== "Today") {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      }
      return rawDate;
    }
    return new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const activeTokenNumber = user?.tokenNumber || queueState.tokenNumber || DEMO_PATIENT.tokenNumber;
  const activeApptId = user?.appointment_id || user?.appointmentId || user?.id || 1;

  // Handle appointment cancellation
  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      await patientService.cancelAppointment(activeTokenNumber || activeApptId);
      setIsCancelled(true);
      setIsCancelModalOpen(false);
      
      if (setUser) {
        setUser(prev => prev ? { ...prev, status: 'cancelled' } : null);
      }
      if (setQueueState) {
        setQueueState(prev => ({ ...prev, status: 'cancelled', patientsAhead: 0 }));
      }
      
      setCancelToast("Appointment cancelled successfully.");
      setTimeout(() => setCancelToast(null), 5000);
    } catch (err) {
      console.error("Cancellation error:", err);
      setCancelToast("Failed to cancel appointment. Please try again.");
      setTimeout(() => setCancelToast(null), 5000);
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle in-card selection from search dropdown
  const handleSelectCardResult = (item) => {
    setCustomSearchQuery(item.name);
    setShowCardDropdown(false);
    setManualLocationCustom(item, {
      isFamilyBooking: true,
      beneficiaryName: beneficiaryInput.trim() || 'Family Member'
    });
  };

  // Handle Preset Click in Mode B
  const handlePresetSelect = (preset) => {
    setCustomSearchQuery(preset.name);
    setShowCardDropdown(false);
    const item = {
      name: preset.name,
      locality: preset.tag || preset.name,
      district: preset.district,
      lat: preset.lat,
      lng: preset.lng,
      pincode: preset.pin,
      isEstimated: false
    };
    setManualLocationCustom(item, {
      isFamilyBooking: true,
      beneficiaryName: beneficiaryInput.trim() || 'Family Relative'
    });
  };

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
        buffer_minutes: 15,
        total_travel_needed_minutes: travelMins + 15,
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
      <TopBar
        title="My Appointment & Live Travel Guide"
        subtitle="Real-time appointment details, OPD queue wait, distance & intelligent route navigation"
      />

      {/* Booked Appointment Overview Card */}
      <div className={`glass-card rounded-3xl p-6 sm:p-8 space-y-6 border transition-all ${
        isCancelled
          ? 'border-rose-300 dark:border-rose-900/60 bg-gradient-to-br from-white via-rose-50/20 to-rose-100/30 dark:from-slate-900 dark:via-rose-950/20 dark:to-slate-900'
          : 'border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center font-black text-lg shadow-lg ${
              isCancelled
                ? 'bg-rose-600 shadow-rose-500/25'
                : 'bg-blue-600 shadow-blue-500/25'
            }`}>
              {isCancelled ? <CalendarX className="w-6 h-6" /> : <Ticket className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                  isCancelled
                    ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                    : 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                }`}>
                  {isCancelled ? 'Cancelled Slot' : 'Active Consultation Slot'}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  • {isCancelled ? 'Token Released' : 'Token Assigned'}
                </span>
              </div>
              <h2 className={`text-xl font-black mt-0.5 ${
                isCancelled ? 'text-slate-500 line-through dark:text-slate-400' : 'text-slate-900 dark:text-white'
              }`}>
                Token {activeTokenNumber}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCancelled ? (
              <>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Slot Confirmed
                </span>
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:border-rose-300 active:scale-95"
                >
                  <XCircle className="w-3.5 h-3.5" /> Cancel Appointment
                </button>
              </>
            ) : (
              <>
                <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Cancelled
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/appointment')}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Book New Slot
                </button>
              </>
            )}
          </div>
        </div>

        {/* 4 Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Attending Specialist</span>
            <p className="font-bold text-slate-900 dark:text-white truncate">
              {user?.doctor || queueState.doctor || DEMO_PATIENT.doctor}
            </p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
              {user?.department || queueState.department || DEMO_PATIENT.department}
            </p>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Consultation Room</span>
            <p className="font-bold text-slate-900 dark:text-white truncate">
              {user?.roomNo || queueState.roomNo || DEMO_PATIENT.roomNo}
            </p>
            <p className="text-[10px] text-slate-500">Shridevi Hospital Sira Rd</p>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-500" /> Date & Time Slot
            </span>
            <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              {getFormattedDate()}
            </p>
            <p className="font-black text-slate-900 dark:text-white text-sm">
              {user?.timeSlot || user?.appointmentTime || DEMO_PATIENT.appointmentTime}
            </p>
            <p className={`text-[10px] font-medium ${isCancelled ? 'text-rose-500' : 'text-emerald-500'}`}>
              {isCancelled ? 'Slot Cancelled' : 'Reporting Window Open'}
            </p>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Patient Name</span>
            <p className="font-bold text-slate-900 dark:text-white truncate">
              {user?.name || DEMO_PATIENT.name}
            </p>
            <p className="text-[10px] text-slate-500">
              {user?.phone || DEMO_PATIENT.phone}
            </p>
          </div>
        </div>
      </div>

      {/* Cancelled Notice Banner if appointment status is cancelled */}
      {isCancelled && (
        <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
              <CalendarX className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                Appointment Token {activeTokenNumber} Cancelled
              </p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                Your consultation slot has been cancelled. Departure alarms and live queue calculations are deactivated.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/appointment')}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" /> Book New Appointment
          </button>
        </div>
      )}

      {/* Dual-Mode Location Engine Card (Mode A: Live GPS vs Mode B: Family / Remote Patient Mode) */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-5 border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg">
        
        {/* Segmented Mode Toggle Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Dual-Mode Patient Location Engine
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select your departure starting point for accurate travel & zero-wait departure calculation
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
            <button
              onClick={() => setLiveGPSMode()}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                isGPS
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${isGPS && isLocating ? 'animate-spin' : ''}`} />
              Mode A: My Live GPS
            </button>
            
            <button
              onClick={() => {
                if (isGPS) {
                  setManualLocationByPincode('572101', {
                    isFamilyBooking: true,
                    beneficiaryName: beneficiaryInput.trim() || 'Family Member'
                  });
                }
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                !isGPS
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Mode B: Family / Remote Mode
            </button>
          </div>
        </div>

        {/* Mode-Specific Controls */}
        {isGPS ? (
          /* Mode A: Live GPS Content */
          <div className="space-y-3">
            {/* Case 1: Permission Denied or Error */}
            {isPermissionBlocked || gpsError ? (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-amber-900 dark:text-amber-200">
                      📍 Location Permission Blocked
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                      {gpsError || "⚠️ Location permission is blocked in your browser. Switch to Mode B to search your village/city manually."}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setManualLocationByPincode('572101', {
                      isFamilyBooking: false,
                      beneficiaryName: ''
                    });
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                >
                  <Users className="w-3.5 h-3.5" /> Switch to Mode B (Manual Search)
                </button>
              </div>
            ) : !coords ? (
              /* Case 2: Prompt Needed (No Coords Yet - Action Button) */
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25">
                    <Navigation className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      Live Device Location Not Detected
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Click below to acquire real-time GPS coordinates for accurate travel and departure calculations.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={detectLiveLocation}
                  disabled={isLocating}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 shrink-0 active:scale-95"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Acquiring Real GPS...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" />
                      📍 Enable Device GPS Location
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Case 3: Live GPS Coordinates Acquired */
              <div className="space-y-2">
                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                      <Navigation className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Live Satellite Geolocation Active</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Resolved: <strong className="text-slate-800 dark:text-slate-200">{locationState?.name || 'Device Location'}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={detectLiveLocation}
                    disabled={isLocating}
                    className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    {isLocating ? 'Acquiring GPS...' : 'Re-detect Location'}
                  </button>
                </div>

                {/* Fast Preset Override for Dev / Remote Patient */}
                <div className="flex flex-wrap items-center gap-2 pt-1 px-1">
                  <span className="text-[10px] text-slate-400 font-medium">Quick Override / Remote:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setManualLocationByPincode('577002', { isFamilyBooking: false });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors flex items-center gap-1"
                  >
                    📍 Davanagere City (193 km / ~140m)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManualLocationByPincode('560023', { isFamilyBooking: false });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Bengaluru Majestic
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManualLocationByPincode('572106', { isFamilyBooking: false });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    SIET Campus (~2m)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Mode B: Family / Remote Patient Locality & Presets Content */
          <div className="space-y-4 pt-1">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              
              {/* Dynamic Autocomplete Search Input */}
              <div className="relative flex-1" ref={cardDropdownRef}>
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customSearchQuery}
                  onChange={(e) => {
                    setCustomSearchQuery(e.target.value);
                    setShowCardDropdown(true);
                  }}
                  onFocus={() => {
                    if (cardSearchResults.length > 0) setShowCardDropdown(true);
                  }}
                  placeholder="Enter 6-digit PIN (e.g. 572137) or place name (Davanagere, Sira)..."
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
                {isCardSearching && (
                  <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 animate-spin" />
                )}

                {/* Suggestions Dropdown */}
                {showCardDropdown && cardSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-40 max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                    {cardSearchResults.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectCardResult(item)}
                        className="w-full text-left px-3.5 py-2 hover:bg-purple-50 dark:hover:bg-slate-700/70 transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {item.district} District • {Number(item.lat).toFixed(4)}, {Number(item.lng).toFixed(4)}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md shrink-0">
                          Select
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Beneficiary Name Input */}
              <div className="relative sm:w-64">
                <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={beneficiaryInput}
                  onChange={(e) => {
                    setBeneficiaryInput(e.target.value);
                    if (locationState.name) {
                      setManualLocationCustom(locationState, {
                        isFamilyBooking: true,
                        beneficiaryName: e.target.value
                      });
                    }
                  }}
                  placeholder="Beneficiary (e.g. Father, Relative)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
            </div>

            {/* Quick 1-Click Karnataka Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Quick Regional Locality Presets
              </span>
              <div className="flex flex-wrap gap-2">
                {LOCATION_PRESETS.map((preset) => {
                  const isSelected = !isGPS && (locationState?.pincode === preset.pin || locationState?.name === preset.name);
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-purple-500/20 scale-[1.02]'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                        isSelected ? 'bg-purple-700 text-purple-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}>
                        {preset.pin}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Journey Origin Status Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-teal-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white">
              {(() => {
                if (!coords || !locationState?.lat) return "📍 Origin: No Location Selected (Enable GPS or Search in Mode B)";
                const originName = locationState?.name || locationLabel || "Selected Origin";
                const pin = locationState?.pincode;
                const hasPin = pin && originName.includes(pin);
                const displayOrigin = hasPin ? originName : `${originName}${pin ? ` (${pin})` : ''}`;
                return `📍 Origin: ${displayOrigin} — Patient Journey`;
              })()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-mono bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
              {coords ? `${Number(coords.lat).toFixed(4)}, ${Number(coords.lng).toFixed(4)}` : 'Coords: None'}
            </span>
            <span>➔ Shridevi Hospital</span>
          </div>
        </div>

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
                Smart Departure Sync • Shridevi Hospital Tumakuru
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
              disabled={isLoading || !coords}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Sync Live
            </button>
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-bold text-xs ${
              shouldLeaveNow && !isDeparted
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500/40 text-rose-600 dark:text-rose-400'
                : 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-500/30 text-cyan-600 dark:text-cyan-400'
            }`}>
              <Radio className="w-4 h-4 animate-ping" /> {departureData?.trafficCondition || (coords ? 'Live Route Active' : 'Awaiting Location')}
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
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-widest text-slate-400">
                  {isDeparted ? 'Transit Status' : shouldLeaveNow ? 'Emergency Departure' : 'Target Departure Window'}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  isDeparted
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : shouldLeaveNow
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}>
                  {isDeparted ? 'En Route' : countdownInfo.badgeText}
                </span>
              </div>

              <div className={`text-5xl sm:text-6xl font-black font-mono tracking-tight py-2 ${
                shouldLeaveNow && !isDeparted ? 'text-rose-400 animate-pulse' : 'text-white'
              }`}>
                {isDeparted ? 'EN ROUTE' : countdownInfo.timeFormatted}
              </div>

              <p className="text-xs text-slate-300">
                {isDeparted
                  ? `Estimated Arrival at OPD Lounge: ${departureData?.estimatedArrivalTime || '10:42 AM'}`
                  : countdownInfo.description}
              </p>
            </div>

            <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold text-slate-700 dark:text-slate-300">Fast2SMS Automated Dispatch Active</span>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">SMS triggered automatically</span>
            </div>
          </div>

          {/* Right 6 cols: Departure Calculation Breakdown */}
          <div className="md:col-span-6 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-blue-500" /> Travel Duration</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {coords ? (departureData?.travel_time_minutes ? `${departureData.travel_time_minutes} Mins` : 'Calculating...') : '-- Mins'}
                </p>
                <p className="text-[10px] text-emerald-500 font-semibold">Live ORS Driving Route</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" /> OPD Queue Wait</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {coords ? `${departureData?.predicted_wait_minutes ?? queueState.estimatedWaitMinutes ?? 35} Mins` : `${queueState.estimatedWaitMinutes || 35} Mins`}
                </p>
                <p className="text-[10px] text-blue-500 font-semibold">{queueState.patientsAhead} Patients Ahead</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-500" /> Hospital Distance</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {coords ? (departureData?.distanceKm ? `${departureData.distanceKm} Km` : 'Calculating...') : '-- Km'}
                </p>
                <p className="text-[10px] text-slate-400">SIET Sira Rd Corridor</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-400" /> Weather</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {departureData?.weather || '28°C Clear'}
                </p>
                <p className="text-[10px] text-slate-400">Ideal Driving Condition</p>
              </div>

              {/* Transit Journey Route Path Card */}
              <div className="col-span-2 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-indigo-500" /> 🗺️ Transit Journey
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    {isGPS ? 'Mode A: Live GPS' : (locationState?.isFamilyBooking ? 'Mode B: Family Booking' : 'Mode B: Manual Origin')}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                    <span className="text-slate-400 font-normal shrink-0">From:</span>
                    <span className="truncate">{coords ? (locationState?.name || locationLabel) : 'Waiting for location (Click "Detect My Live Location")'}</span>
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                    <span className="text-slate-400 font-normal shrink-0">To:</span>
                    <span className="truncate">Shridevi Hospital & Research Hospital, Tumakuru</span>
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {isGPS 
                    ? (coords ? "Mode A: GPS Device Origin • Auto Geolocation Active" : "Mode A: GPS Device Origin • Click 'Detect My Live Location'")
                    : (locationState?.beneficiaryName 
                        ? `Mode B: Family Booking — ${locationState.beneficiaryName} (${locationState?.pincode || locationState?.district || 'Karnataka'})` 
                        : `Mode B: Regional Origin (${locationState?.name || locationState?.pincode || 'Karnataka'})`)}
                </p>
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
                <Navigation className="w-3.5 h-3.5" /> Maps ➔
              </a>
            </div>
          </div>

        </div>

      </div>

      {/* Live Route Navigation & Real Interactive Map Section */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Hospital Route & Navigation Guide</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              From: <strong className="text-slate-800 dark:text-slate-200">{coords ? (locationState?.name || locationLabel) : 'Selected Origin Location'}</strong> → <strong>Shridevi Hospital & Research Hospital, SIET Campus, Sira Road</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold border border-emerald-500/30">
              Optimal Route • {departureData?.travel_time_minutes ?? queueState.trafficDurationMinutes ?? 12} mins
            </span>
            <a
              href={coords ? `https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lng}&destination=13.376230,77.097439` : `https://maps.google.com/?q=13.376230,77.097439`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" /> Open Google Maps
            </a>
          </div>
        </div>

        {/* Real Interactive Google Maps Directions Embed or Prompt */}
        {coords ? (
          <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner relative bg-slate-100 dark:bg-slate-900">
            <iframe
              title="Live Route Navigation to Shridevi Hospital"
              src={`https://maps.google.com/maps?saddr=${coords.lat},${coords.lng}&daddr=13.376230,77.097439&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="w-full h-80 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-6 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Interactive Navigation Map Ready</p>
              <p className="text-xs text-slate-500 mt-0.5 max-w-sm">Detect your live location or select a town in Mode B to calculate driving distance and render your route to Shridevi Hospital.</p>
            </div>
            <button
              type="button"
              onClick={detectLiveLocation}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5" /> 📍 Enable Device GPS Location
            </button>
          </div>
        )}

        {/* Turn-by-Turn Quick Instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 font-black flex items-center justify-center shrink-0">1</span>
            <span className="text-slate-700 dark:text-slate-300">Depart origin along NH-48 / Tumakuru Ring Road</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 font-black flex items-center justify-center shrink-0">2</span>
            <span className="text-slate-700 dark:text-slate-300">Turn towards SIET Medical College & Hospital Gate 2</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 font-black flex items-center justify-center shrink-0">3</span>
            <span className="text-slate-700 dark:text-slate-300">Proceed directly to OPD Lounge (Block B, 2nd Floor)</span>
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
        onSelectManual={(pinOrName, opts, customObj) => {
          if (customObj) {
            setManualLocationCustom(customObj, opts);
          } else {
            setManualLocationByPincode(pinOrName, opts);
          }
        }}
        isLocating={isLocating}
      />

      {/* Cancellation Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-md shadow-rose-500/10">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Cancel Appointment?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to cancel appointment token <span className="font-bold text-slate-900 dark:text-white">{activeTokenNumber}</span>? This will release your consultation slot and remove your position from the live queue.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                No, Keep Slot
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                {isCancelling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Cancelling...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Yes, Cancel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Toast Notification */}
      {cancelToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-200 text-xs font-bold animate-bounce-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{cancelToast}</span>
        </div>
      )}

    </div>
  );
};

export default ArrivalPrediction;

