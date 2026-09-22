import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, Users, Clock, CheckCircle2, UserX, AlertTriangle, 
  Volume2, Pause, Play, RefreshCw, ShieldAlert, ArrowRight, Activity, Calendar
} from 'lucide-react';
import api from '../services/api';
import { announcePatientCall } from '../utils/audioAnnouncer';

const DOCTORS_LIST = [
  { id: 1, name: "Dr. Priya Sharma", department: "Cardiology", roomNo: "Room 302" },
  { id: 2, name: "Dr. Arjun Rao", department: "General Medicine", roomNo: "Room 205" },
  { id: 3, name: "Dr. Rajeswari R.", department: "General Medicine", roomNo: "Room 204" },
  { id: 4, name: "Dr. Vikram K. Rao", department: "Orthopedics", roomNo: "Room 108" },
  { id: 5, name: "Dr. Ananya Hegde", department: "Pediatrics", roomNo: "Room 105" },
  { id: 6, name: "Dr. Rajeshwar B.", department: "Neurology", roomNo: "Room 401" },
  { id: 7, name: "Dr. Sneha Patil", department: "Dermatology", roomNo: "Room 210" },
  { id: 8, name: "Dr. Manoj Kumar", department: "Pulmonology", roomNo: "Room 305" }
];

export const DoctorRoom = () => {
  const [selectedDoctorId, setSelectedDoctorId] = useState(3);
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentDoctor = DOCTORS_LIST.find(d => d.id === selectedDoctorId) || DOCTORS_LIST[2];

  const fetchRoomData = async () => {
    try {
      const res = await api.get(`/staff/doctor/${selectedDoctorId}/consultation`);
      if (res.data) {
        setRoomData(res.data);
      }
    } catch (err) {
      console.warn("Failed to fetch doctor consultation room data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomData();
    const interval = setInterval(fetchRoomData, 5000);
    return () => clearInterval(interval);
  }, [selectedDoctorId]);

  // 1. Call Next Patient
  const handleCallNext = async () => {
    setIsProcessing(true);
    try {
      const res = await api.post('/staff/queue/call-next');
      const calledToken = res.data?.current_token || "Next Patient";
      setActionMessage(res.data?.message || `Called ${calledToken}`);
      
      // Trigger voice + chime announcement
      announcePatientCall(calledToken, currentDoctor.roomNo, "");
      await fetchRoomData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionMessage("Failed to call next patient.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Mark Consultation Complete
  const handleComplete = async (appointmentId) => {
    if (!appointmentId) return;
    setIsProcessing(true);
    try {
      await api.put(`/staff/appointments/${appointmentId}/status`, {
        appointment_id: appointmentId,
        action: 'completed'
      });
      setActionMessage(`✅ Consultation completed for Patient #${appointmentId}`);
      await fetchRoomData();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage("Failed to mark consultation complete.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Mark Absent / No-Show
  const handleAbsent = async (appointmentId) => {
    if (!appointmentId) return;
    setIsProcessing(true);
    try {
      await api.put(`/staff/appointments/${appointmentId}/status`, {
        appointment_id: appointmentId,
        action: 'skipped'
      });
      setActionMessage(`⚠️ Patient #${appointmentId} marked as Absent / No-Show`);
      await fetchRoomData();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage("Failed to mark patient absent.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Update Delay Buffer
  const handleDelayChange = async (status, delayMins) => {
    try {
      await api.put(`/staff/doctors/${selectedDoctorId}/status`, {
        status,
        delay_minutes: delayMins
      });
      setActionMessage(`Doctor status updated: ${status} (+${delayMins}m buffer)`);
      await fetchRoomData();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage("Failed to update status.");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Doctor Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">Doctor Consultation Room Portal</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 rounded-md">
                Active Room View
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live consultation controls, vitals review, and instant audio token calling for attending specialists
            </p>
          </div>
        </div>

        {/* Doctor / Room Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Select Room:</label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
          >
            {DOCTORS_LIST.map(doc => (
              <option key={doc.id} value={doc.id}>
                {doc.roomNo} — {doc.name} ({doc.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 shadow-sm">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-blue-500 hover:text-blue-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Main Grid: Left Current Consultation, Right Upcoming Queue & Disruption */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Currently In Room */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Currently Inside Consultation Room</span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {currentDoctor.roomNo}
              </span>
            </div>

            {roomData?.current_patient ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gradient-to-tr from-blue-50/80 via-indigo-50/40 to-slate-50 rounded-2xl border border-blue-200/60">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Patient OPD Token</span>
                    <p className="text-3xl font-black font-mono text-blue-700">{roomData.current_patient.tokenNumber}</p>
                    <h3 className="text-lg font-bold text-slate-900">{roomData.current_patient.name}</h3>
                    <p className="text-xs text-slate-600">
                      {roomData.current_patient.age} yrs • {roomData.current_patient.gender} • Slot: <strong>{roomData.current_patient.time_slot}</strong>
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Contact Number</span>
                    <p className="text-sm font-bold text-slate-800">📞 {roomData.current_patient.phone}</p>
                    <button
                      type="button"
                      onClick={() => announcePatientCall(roomData.current_patient.tokenNumber, currentDoctor.roomNo, roomData.current_patient.name)}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-bold rounded-lg transition"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Repeat Chime Call
                    </button>
                  </div>
                </div>

                {/* Consultation Lifecycle Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleComplete(roomData.current_patient.appointment_id)}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Consultation Complete & Discharge
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleAbsent(roomData.current_patient.appointment_id)}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
                  >
                    <UserX className="w-4 h-4 text-rose-500" /> Mark Absent / No-Show
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-800">Room is Ready for Next Patient</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No patient is currently inside {currentDoctor.roomNo}. Click below to call the next queued patient.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isProcessing || (roomData?.total_waiting === 0)}
                  onClick={handleCallNext}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Volume2 className="w-4 h-4" /> Call Next Patient with Voice Chime
                </button>
              </div>
            )}
          </div>

          {/* Quick Doctor Delay / Emergency Round Overlay */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Doctor Round / Emergency Buffer
                </span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                roomData?.delay_minutes > 0 ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-slate-100 text-slate-600'
              }`}>
                {roomData?.delay_minutes > 0 ? `+${roomData.delay_minutes}m Buffer Active` : 'On Schedule'}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Need to attend a surgical round or emergency? Applying a buffer automatically notifies all incoming patients at home.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleDelayChange('Active', 0)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
              >
                On Time (0 min)
              </button>
              <button
                type="button"
                onClick={() => handleDelayChange('Delayed', 15)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
              >
                +15 Min Delay
              </button>
              <button
                type="button"
                onClick={() => handleDelayChange('Delayed', 30)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
              >
                +30 Min Delay
              </button>
              <button
                type="button"
                onClick={() => handleDelayChange('On Break', 0)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
              >
                Tea / Lunch Break
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Next in Line Queue */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Next In Line ({roomData?.total_waiting || 0} Waiting)</h3>
              </div>
              <button
                type="button"
                onClick={fetchRoomData}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {roomData?.upcoming_patients && roomData.upcoming_patients.length > 0 ? (
              <div className="space-y-2.5">
                {roomData.upcoming_patients.map((p, idx) => (
                  <div
                    key={p.appointment_id}
                    className="p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[11px]">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{p.tokenNumber} • Slot: {p.time_slot}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCallNext()}
                      className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white text-blue-600 border border-blue-200 rounded-lg font-bold text-[11px] shadow-sm transition"
                    >
                      Call Now
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 space-y-1">
                <Users className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold">No pending patients in queue.</p>
                <p className="text-[11px]">All assigned patients for today have been consulted.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DoctorRoom;
