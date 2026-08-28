import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  BellRing,
  RefreshCw,
  Sliders,
  Car,
  Compass,
  Building2,
  ShieldAlert,
  Sparkles,
  Volume2
} from 'lucide-react';
import { calculateDeparture } from '../services/api';
import {
  getCurrentCoordinates,
  checkLocationPermission,
  HOSPITAL_COORDINATES,
  DEFAULT_DEMO_COORDINATES,
} from '../services/location';

export default function QueueTracker({ appointmentId = 1, onStatusChange }) {
  // Coordinates State
  const [coords, setCoords] = useState({
    latitude: DEFAULT_DEMO_COORDINATES.latitude,
    longitude: DEFAULT_DEMO_COORDINATES.longitude,
  });
  const [locationSource, setLocationSource] = useState('demo'); // 'gps' | 'demo' | 'manual'
  const [locAccuracy, setLocAccuracy] = useState(null);
  const [permissionState, setPermissionState] = useState('prompt');

  // Buffer Configuration (minutes)
  const [bufferMinutes, setBufferMinutes] = useState(15);
  const [showSettings, setShowSettings] = useState(false);

  // Data & API State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Sound alert enabled
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioAlertPlayedRef = useRef(false);

  // Check initial permission
  useEffect(() => {
    checkLocationPermission().then((status) => {
      setPermissionState(status);
      if (status === 'granted') {
        fetchRealGps();
      }
    });
  }, []);

  // Fetch real GPS position
  const fetchRealGps = async () => {
    setLoading(true);
    setError(null);
    try {
      const position = await getCurrentCoordinates();
      setCoords({
        latitude: position.latitude,
        longitude: position.longitude,
      });
      setLocAccuracy(Math.round(position.accuracy));
      setLocationSource('gps');
      setPermissionState('granted');
    } catch (err) {
      console.error("GPS Error:", err);
      setError(err.message || "Failed to acquire GPS location. Using fallback location.");
    } finally {
      setLoading(false);
    }
  };

  // Switch to demo preset coordinates
  const useDemoLocation = (distancePreset) => {
    let newCoords;
    if (distancePreset === 'near') {
      // ~1.5 km
      newCoords = { latitude: 13.345000, longitude: 77.112000 };
    } else if (distancePreset === 'far') {
      // ~12 km
      newCoords = { latitude: 13.410000, longitude: 77.190000 };
    } else {
      // ~4.5 km standard demo
      newCoords = { latitude: DEFAULT_DEMO_COORDINATES.latitude, longitude: DEFAULT_DEMO_COORDINATES.longitude };
    }
    setCoords(newCoords);
    setLocationSource('demo');
    setLocAccuracy(null);
    setError(null);
  };

  // Play audio chime for urgent alerts
  const playAlertChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn("Audio playback not supported or permitted:", e);
    }
  };

  // Main calculation caller
  const fetchDepartureData = useCallback(async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    setError(null);

    try {
      const result = await calculateDeparture({
        appointment_id: Number(appointmentId),
        patient_latitude: coords.latitude,
        patient_longitude: coords.longitude,
        buffer_minutes: bufferMinutes,
      });

      setData(result);
      setLastUpdated(new Date());

      if (onStatusChange) {
        onStatusChange(result);
      }

      // Check if should trigger alert sound
      if (result.should_leave_now && soundEnabled && !audioAlertPlayedRef.current) {
        playAlertChime();
        audioAlertPlayedRef.current = true;
      } else if (!result.should_leave_now) {
        audioAlertPlayedRef.current = false;
      }
    } catch (err) {
      console.error("API Error in calculateDeparture:", err);
      const msg = err.response?.data?.detail || err.message || "Failed to calculate departure time";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [appointmentId, coords, bufferMinutes, soundEnabled, onStatusChange]);

  // Trigger calculation when coordinates or buffer changes
  useEffect(() => {
    fetchDepartureData();
  }, [fetchDepartureData]);

  // Auto-polling interval (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDepartureData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDepartureData]);

  // Render Status Badge & Style Configuration
  const getStatusTheme = () => {
    if (!data) return { bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-slate-200' };

    switch (data.departure_status) {
      case 'leave_now':
        return {
          cardBg: 'bg-gradient-to-br from-rose-950/80 via-slate-900 to-rose-950/40 border-rose-500/50 shadow-rose-950/50',
          badgeBg: 'bg-rose-500 text-white animate-pulse',
          badgeText: 'LEAVE NOW',
          icon: <ShieldAlert className="w-6 h-6 text-rose-400" />,
          accentColor: 'text-rose-400',
          borderColor: 'border-rose-500/40',
          pulseClass: 'animate-urgent-pulse',
        };
      case 'get_ready':
        return {
          cardBg: 'bg-gradient-to-br from-amber-950/60 via-slate-900 to-amber-950/30 border-amber-500/40 shadow-amber-950/50',
          badgeBg: 'bg-amber-500 text-slate-950 font-bold',
          badgeText: 'GET READY',
          icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
          accentColor: 'text-amber-400',
          borderColor: 'border-amber-500/40',
          pulseClass: '',
        };
      case 'relax_at_home':
      default:
        return {
          cardBg: 'bg-gradient-to-br from-emerald-950/50 via-slate-900 to-teal-950/30 border-teal-500/30 shadow-teal-950/50',
          badgeBg: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
          badgeText: 'RELAX AT HOME',
          icon: <CheckCircle2 className="w-6 h-6 text-teal-400" />,
          accentColor: 'text-teal-400',
          borderColor: 'border-teal-500/30',
          pulseClass: '',
        };
    }
  };

  const theme = getStatusTheme();

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Top Header Card */}
      <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/10 rounded-xl border border-teal-500/20 text-teal-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              {data?.doctor_name ? `Dr. ${data.doctor_name}` : 'Consultation Appointment'}
            </h2>
            <p className="text-xs text-slate-400">
              {data?.department_name || 'General Department'} &bull; {HOSPITAL_COORDINATES.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Sound Alert Enabled" : "Sound Alert Disabled"}
            className={`p-2 rounded-xl border text-xs transition-all ${
              soundEnabled
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/30 shadow-sm'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl border text-xs transition-all ${
              showSettings
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={() => fetchDepartureData(false)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-900/40 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Settings Panel (Expandable) */}
      {showSettings && (
        <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Departure & Geolocation Settings
            </span>
            <span className="text-xs text-slate-400">Appointment #{appointmentId}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Arrival Buffer Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300 font-medium">Hospital Arrival Buffer</label>
                <span className="text-teal-400 font-bold">{bufferMinutes} mins</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <p className="text-[11px] text-slate-400">
                Extra minutes to park, check-in, and take a seat before being called.
              </p>
            </div>

            {/* Location Selection Presets */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium block">Simulated Distance Preset</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => useDemoLocation('near')}
                  className="flex-1 py-1.5 px-2 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
                >
                  Near (1.5 km)
                </button>
                <button
                  type="button"
                  onClick={() => useDemoLocation('medium')}
                  className="flex-1 py-1.5 px-2 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
                >
                  Medium (4.5 km)
                </button>
                <button
                  type="button"
                  onClick={() => useDemoLocation('far')}
                  className="flex-1 py-1.5 px-2 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
                >
                  Far (12 km)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Geolocation Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="text-slate-300">
            Location Source:{' '}
            <strong className="text-slate-100 uppercase">
              {locationSource === 'gps' ? `Live GPS (±${locAccuracy || 10}m)` : 'Demo Preset'}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono">
            {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
          </span>
          {locationSource !== 'gps' && (
            <button
              onClick={fetchRealGps}
              className="flex items-center gap-1 px-2.5 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-lg text-[11px] font-medium transition-all"
            >
              <Navigation className="w-3 h-3" />
              Use My Live GPS
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-500/40 rounded-2xl text-xs text-rose-200 flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{error}</p>
            <p className="text-rose-300/80 mt-1 text-[11px]">
              Showing estimations based on configured coordinates and fallback travel heuristics.
            </p>
          </div>
        </div>
      )}

      {/* Main Dynamic Departure Card */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all duration-300 ${theme.cardBg} ${theme.pulseClass}`}
      >
        {/* Top Status & Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {theme.icon}
            <div>
              <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${theme.badgeBg}`}>
                {theme.badgeText}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : 'Loading...'}
            </span>
          </div>
        </div>

        {/* Countdown & Big Numbers */}
        <div className="text-center py-4 space-y-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            {data?.should_leave_now ? 'Action Required' : 'Estimated Time Before Departure'}
          </span>

          <div className="flex items-baseline justify-center gap-2">
            <span className={`text-6xl sm:text-7xl font-extrabold tracking-tight ${theme.accentColor}`}>
              {loading ? '--' : Math.ceil(data?.minutes_until_departure ?? 0)}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-400">
              {data?.should_leave_now ? 'mins (Leave Now!)' : 'minutes'}
            </span>
          </div>

          <p className="text-sm font-medium text-slate-200 max-w-lg mx-auto leading-relaxed pt-2">
            {data?.message || 'Calculating real-time hospital queue and road traffic conditions...'}
          </p>
        </div>

        {/* Dynamic Formula Breakdown Card */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Queue Ahead */}
          <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Queue Status</span>
            </div>
            <div className="text-lg font-bold text-slate-100">
              {data ? `${data.patients_ahead} ahead` : '--'}
            </div>
            <span className="text-[10px] text-slate-500">Position #{data?.queue_position || 1}</span>
          </div>

          {/* ML Wait Prediction */}
          <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Predicted Wait</span>
            </div>
            <div className="text-lg font-bold text-purple-300">
              {data ? `~${Math.round(data.estimated_wait_minutes)}m` : '--'}
            </div>
            <span className="text-[10px] text-slate-500">Random Forest AI</span>
          </div>

          {/* Google Maps Travel Duration */}
          <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Car className="w-3.5 h-3.5 text-teal-400" />
              <span>Travel Duration</span>
            </div>
            <div className="text-lg font-bold text-teal-300">
              {data ? `${data.travel_duration_minutes}m` : '--'}
            </div>
            <span className="text-[10px] text-slate-500">
              {data?.travel_distance_km ? `${data.travel_distance_km} km (Live Traffic)` : 'Road Distance'}
            </span>
          </div>

          {/* Hospital Buffer */}
          <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Arrival Buffer</span>
            </div>
            <div className="text-lg font-bold text-amber-300">
              {data ? `+${data.buffer_minutes}m` : '+15m'}
            </div>
            <span className="text-[10px] text-slate-500">Hospital Check-in</span>
          </div>
        </div>

        {/* Traffic Source & Explanation Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Route Engine:{' '}
              <strong className="text-slate-300">
                {data?.traffic_duration_source === 'google_maps'
                  ? 'Google Maps Distance Matrix (Live Traffic)'
                  : 'Haversine Urban Traffic Engine'}
              </strong>
            </span>
          </div>

          <span className="text-slate-500 font-mono">
            Formula: Wait ({Math.round(data?.estimated_wait_minutes || 0)}m) - [Travel (
            {data?.travel_duration_minutes || 0}m) + Buffer ({data?.buffer_minutes || 15}m)]
          </span>
        </div>
      </div>
    </div>
  );
}
