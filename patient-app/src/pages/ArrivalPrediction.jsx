import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { queueService } from '../services/queueService';
import { patientService } from '../services/patientService';
import { notificationService } from '../services/notificationService';
import { useLocationResolver } from '../hooks/useLocationResolver';
import { LOCATION_PRESETS, resolvePincode } from '../utils/locationResolver';
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
  PlusCircle
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
    mode,
    isGPS,
    isFamilyBooking,
    label: locationLabel,
    isLocating,
    setLiveGPSMode,
    setManualLocationByPincode,
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

  // In-card Pincode & Beneficiary State for Family Mode
  const [customPincode, setCustomPincode] = useState(locationState?.pincode || '');
  const [beneficiaryInput, setBeneficiaryInput] = useState(locationState?.beneficiaryName || '');

  // Mobile dispatch simulator state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchData, setDispatchData] = useState(null);
  const [isDispatchLoading, setIsDispatchLoading] = useState(false);

  // Fetch real departure prediction from FastAPI backend based on active resolved coordinates
  const fetchPrediction = useCallback(async () => {
    if (isCancelled || user?.status === 'cancelled') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const apptId = user?.appointment_id || user?.appointmentId || 0;
      const res = await queueService.checkDeparture(apptId, coords.lat, coords.lng);
      setDepartureData(res);
      
      const predictedWait = typeof res?.predicted_wait_minutes === 'number' ? res.predicted_wait_minutes : (queueState.estimatedWaitMinutes || 35);
      const travelMins = typeof res?.travel_time_minutes === 'number' ? res.travel_time_minutes : (queueState.trafficDurationMinutes || 15);
      const bufferMins = 10;
      const minutesUntilDeparture = predictedWait - (travelMins + bufferMins);

      if (res?.should_leave_now || minutesUntilDeparture <= 0) {
        setSecondsLeft(0);
      } else {
        setSecondsLeft(Math.max(0, Math.round(minutesUntilDeparture * 60)));
      }
    } catch (err) {
      console.warn("Real /departure-check call failed, using fallback:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, coords.lat, coords.lng, isCancelled, queueState.estimatedWaitMinutes, queueState.trafficDurationMinutes]);

  // Initial load and periodic re-check every 30s or when coordinates change
  useEffect(() => {
    if (isCancelled || user?.status === 'cancelled') return;
    fetchPrediction();
    const interval = setInterval(fetchPrediction, 30000);
    return () => clearInterval(interval);
  }, [fetchPrediction, isCancelled, user?.status]);

  // Departure Countdown
  useEffect(() => {
    if (secondsLeft <= 0 || isDeparted || isCancelled || user?.status === 'cancelled') return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, isDeparted, isCancelled, user?.status]);

  const formatCountdown = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleLeaveNow = () => {
    setIsDeparted(true);
  };

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

  // Handle Preset Click in Family Mode
  const handlePresetSelect = (preset) => {
    setCustomPincode(preset.pin);
    setManualLocationByPincode(preset.pin, {
      isFamilyBooking: true,
      beneficiaryName: beneficiaryInput.trim() || 'Family Relative'
    });
  };

  // Handle manual 6-digit Pincode input
  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCustomPincode(val);
    if (val.length === 6) {
      setManualLocationByPincode(val, {
        isFamilyBooking: true,
        beneficiaryName: beneficiaryInput.trim() || 'Family Relative'
      });
    }
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
                  setManualLocationByPincode(customPincode || '572101', {
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
                  Auto-resolving real-time device coordinates to Shridevi Hospital (Sira Road).
                </p>
              </div>
            </div>

            <button
              onClick={refreshGPS}
              disabled={isLocating}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              {isLocating ? 'Acquiring GPS...' : 'Refresh GPS'}
            </button>
          </div>
        ) : (
          /* Mode B: Family / Remote Patient Locality & Presets Content */
          <div className="space-y-4 pt-1">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* 6-Digit Pincode Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={customPincode}
                  onChange={handlePincodeChange}
                  placeholder="Enter 6-digit Karnataka PIN (e.g., 572137, 572216)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              {/* Beneficiary Name Input */}
              <div className="relative sm:w-64">
                <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={beneficiaryInput}
                  onChange={(e) => {
                    setBeneficiaryInput(e.target.value);
                    if (locationState.pincode) {
                      setManualLocationByPincode(locationState.pincode, {
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
                  const isSelected = !isGPS && locationState?.pincode === preset.pin;
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
                const originName = locationState?.name || locationLabel || "Tumakuru";
                const pin = locationState?.pincode;
                const hasPin = pin && originName.includes(pin);
                const displayOrigin = hasPin ? originName : `${originName}${pin ? ` (${pin})` : ''}`;
                return `📍 Origin: ${displayOrigin} — Patient Journey`;
              })()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-mono bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
              {coords.lat}, {coords.lng}
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
                  {isDeparted ? 'En Route' : shouldLeaveNow ? '🚨 LEAVE NOW FOR HOSPITAL' : 'Optimal Sync'}
                </span>
              </div>

              <div className={`text-5xl sm:text-6xl font-black font-mono tracking-tight py-2 ${
                shouldLeaveNow && !isDeparted ? 'text-rose-400 animate-pulse' : 'text-white'
              }`}>
                {isDeparted ? 'EN ROUTE' : shouldLeaveNow ? '00:00' : formatCountdown(secondsLeft)}
              </div>

              <p className="text-xs text-slate-300">
                {isDeparted
                  ? `Estimated Arrival at OPD Lounge: ${departureData?.estimatedArrivalTime || '10:42 AM'}`
                  : shouldLeaveNow
                  ? 'Your travel time matches or exceeds your predicted wait time (with 10-min safety buffer). Depart immediately!'
                  : departureData?.message
                  ? departureData.message
                  : 'Leaving at this exact moment ensures you arrive 10 mins before Token Call.'}
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
                  {departureData?.travel_time_minutes ?? queueState.trafficDurationMinutes} Mins
                </p>
                <p className="text-[10px] text-emerald-500 font-semibold">Live ORS Driving Route</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" /> OPD Queue Wait</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {departureData?.predicted_wait_minutes ?? queueState.estimatedWaitMinutes} Mins
                </p>
                <p className="text-[10px] text-blue-500 font-semibold">{queueState.patientsAhead} Patients Ahead</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-500" /> Hospital Distance</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {departureData?.distanceKm ?? DEMO_PATIENT.distanceKm} Km
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
                    {isGPS ? 'Mode A: Live GPS' : (locationState?.isFamilyBooking ? 'Mode B: Family Booking' : 'Mode B: Preset PIN')}
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                    <span className="text-slate-400 font-normal shrink-0">From:</span>
                    <span className="truncate">{locationState?.name || locationLabel || 'My Current Location'}</span>
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                    <span className="text-slate-400 font-normal shrink-0">To:</span>
                    <span className="truncate">Shridevi Hospital & Research Hospital, Tumakuru</span>
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {isGPS 
                    ? "Mode A: GPS Device Origin • Auto Geolocation Active" 
                    : (locationState?.beneficiaryName 
                        ? `Mode B: Family Booking — ${locationState.beneficiaryName} (${locationState?.pincode || 'Karnataka'})` 
                        : `Mode B: Regional Origin (${locationState?.pincode || '572101'})`)}
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
                <Navigation className="w-3 h-3" /> Maps ➔
              </a>
            </div>
          </div>

        </div>

      </div>

      {/* Live Route Navigation & Interactive Map Section */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Hospital Route & Navigation Guide</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              From: <strong className="text-slate-800 dark:text-slate-200">{locationState?.name || locationLabel}</strong> → <strong>Shridevi Hospital & Research Hospital, SIET Campus, Sira Road</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold border border-emerald-500/30">
              Optimal Route • {departureData?.travel_time_minutes ?? queueState.trafficDurationMinutes ?? 12} mins
            </span>
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lng}&destination=13.376230,77.097439`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" /> Open Google Maps
            </a>
          </div>
        </div>

        {/* Dynamic Route Map Simulation Canvas */}
        <div className="w-full h-72 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-2xl relative overflow-hidden flex items-center justify-center p-6 border border-slate-800 shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />

          {/* Route path graphic */}
          <svg className="absolute inset-0 w-full h-full stroke-cyan-400" strokeWidth="4" fill="none">
            <path d="M 80 220 C 220 220, 260 90, 480 140 C 650 180, 720 80, 880 70" strokeDasharray="8,6" className="animate-pulse opacity-80" />
          </svg>

          {/* Patient start node */}
          <div className="absolute left-6 sm:left-12 bottom-8 p-3.5 bg-blue-600/90 backdrop-blur-md text-white rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold max-w-xs border border-blue-400/30">
            <div className="w-3 h-3 rounded-full bg-cyan-300 animate-ping shrink-0" />
            <div className="truncate">
              <span className="text-[10px] uppercase font-mono block opacity-80">Origin (Your Location)</span>
              <span className="truncate">{locationState?.name || 'Patient Origin'}</span>
            </div>
          </div>

          {/* Waypoint info pill in middle */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-slate-800/90 border border-slate-700/80 rounded-2xl backdrop-blur-md text-slate-200 text-xs font-semibold items-center gap-2 shadow-2xl">
            <Car className="w-4 h-4 text-cyan-400" />
            <span>NH-48 Sira Bypass Corridor • Clear Traffic</span>
          </div>

          {/* Hospital destination node */}
          <div className="absolute right-6 sm:right-12 top-8 p-3.5 bg-red-600/90 backdrop-blur-md text-white rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border border-red-400/30">
            <Navigation className="w-4 h-4 animate-bounce shrink-0 text-white" />
            <div>
              <span className="text-[10px] uppercase font-mono block opacity-80">Destination</span>
              <span>Shridevi Hospital OPD Lounge</span>
            </div>
          </div>
        </div>

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
        onSelectManual={setManualLocationByPincode}
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
