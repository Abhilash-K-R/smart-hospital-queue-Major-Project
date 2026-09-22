import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MoreVertical, Check, UserMinus, PhoneForwarded, RefreshCw, 
  AlertCircle, MessageSquare, Send, Smartphone, Trash2, UserPlus, X, Printer, 
  Ticket, Clock, Stethoscope, CheckCircle2, QrCode
} from 'lucide-react';
import api from '../services/api';
import { announcePatientCall } from '../utils/audioAnnouncer';

const DOCTORS_PRESET = [
  { id: 1, name: "Dr. Priya Sharma", department: "Cardiology", roomNo: "Room 302" },
  { id: 2, name: "Dr. Arjun Rao", department: "General Medicine", roomNo: "Room 205" },
  { id: 3, name: "Dr. Rajeswari R.", department: "General Medicine", roomNo: "Room 204" },
  { id: 4, name: "Dr. Vikram K. Rao", department: "Orthopedics", roomNo: "Room 108" },
  { id: 5, name: "Dr. Ananya Hegde", department: "Pediatrics", roomNo: "Room 105" },
  { id: 6, name: "Dr. Rajeshwar B.", department: "Neurology", roomNo: "Room 401" },
  { id: 7, name: "Dr. Sneha Patil", department: "Dermatology", roomNo: "Room 210" },
  { id: 8, name: "Dr. Manoj Kumar", department: "Pulmonology", roomNo: "Room 305" }
];

const TIME_SLOTS = [
  "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM"
];

const getTriageColor = (level) => {
  switch (level) {
    case 'Critical': return 'bg-red-100 text-red-700 border-red-200 font-bold animate-pulse';
    case 'Urgent': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Standard': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const Queue = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isCallingNext, setIsCallingNext] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [dispatchingId, setDispatchingId] = useState(null);

  // Walk-in Registration Modal & Slip State
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);
  const [issuedWalkInPass, setIssuedWalkInPass] = useState(null);
  const [walkinForm, setWalkinForm] = useState({
    patient_name: '',
    phone: '',
    age: 35,
    gender: 'Male',
    doctor_id: 3,
    department: 'General Medicine',
    time_slot: '10:30 AM',
    symptoms: 'Walk-in General Consultation'
  });

  const fetchQueue = async () => {
    try {
      const res = await api.get('/staff/queue');
      if (res.data) {
        setQueue(res.data);
      }
    } catch (err) {
      console.error('Error fetching staff queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCallNext = async () => {
    setIsCallingNext(true);
    try {
      const res = await api.post('/staff/queue/call-next');
      const calledToken = res.data?.current_token || 'Next patient';
      setActionMessage(res.data.message || `Called ${calledToken}`);
      
      // Voice & audio chime announcement
      const currentPatient = queue.find(q => q.tokenNumber === calledToken);
      const room = currentPatient?.roomNo || "Room 204";
      announcePatientCall(calledToken, room, currentPatient?.patient_name || "");

      await fetchQueue();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionMessage('Failed to call next patient');
    } finally {
      setIsCallingNext(false);
    }
  };

  const handleClearToday = async () => {
    if (!window.confirm("Are you sure you want to clear all active queues and start a fresh day? This will complete all pending appointments.")) {
      return;
    }
    setLoading(true);
    
    try {
      const res = await api.post('/staff/queue/clear-day');
      setActionMessage(res.data.message || 'Fresh day initialized. Queue is now clean.');
      await fetchQueue();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      console.error('Error clearing queue:', err);
      setActionMessage('Failed to reset queue for the day');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, action) => {
    setUpdatingId(`${id}-${action}`);
    try {
      await api.put(`/staff/appointments/${id}/status`, { appointment_id: id, action });
      setActionMessage(`Patient #${id} marked as ${action}`);
      await fetchQueue();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.error(`Error marking patient #${id} as ${action}:`, err);
      setActionMessage(`Failed to update patient #${id}: ${err.response?.data?.detail || err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDispatchAlert = async (patient) => {
    setDispatchingId(patient.id);
    try {
      const res = await api.post('/notifications/dispatch-preview', {
        appointment_id: patient.id,
        patient_name: patient.patient_name || patient.name,
        phone: patient.contact_phone || patient.phone || "9876543210",
        token_number: patient.tokenNumber
      });
      
      const shareUrl = res.data?.whatsapp_share_url;
      if (shareUrl) {
        window.open(shareUrl, '_blank');
      }
      setActionMessage(`✅ WhatsApp & SMS departure alert dispatched to ${patient.patient_name || patient.name} (${patient.tokenNumber})`);
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      console.error("Error dispatching alert:", err);
      setActionMessage(`Failed to dispatch alert for ${patient.name}`);
    } finally {
      setDispatchingId(null);
    }
  };

  // Submit Walk-in Form
  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    if (!walkinForm.patient_name.trim()) return;
    setIsSubmittingWalkIn(true);

    try {
      const selectedDocObj = DOCTORS_PRESET.find(d => d.id === Number(walkinForm.doctor_id)) || DOCTORS_PRESET[2];
      const payload = {
        ...walkinForm,
        doctor_id: selectedDocObj.id,
        doctor_name: selectedDocObj.name,
        department: selectedDocObj.department,
        age: Number(walkinForm.age) || 35
      };

      const res = await api.post('/staff/walkin-register', payload);
      if (res.data && res.data.success) {
        setIssuedWalkInPass(res.data);
        setIsWalkInModalOpen(false);
        await fetchQueue();
        setWalkinForm({
          patient_name: '',
          phone: '',
          age: 35,
          gender: 'Male',
          doctor_id: 3,
          department: 'General Medicine',
          time_slot: '10:30 AM',
          symptoms: 'Walk-in General Consultation'
        });
      }
    } catch (err) {
      console.error("Walk-in registration error:", err);
      alert(`Registration failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsSubmittingWalkIn(false);
    }
  };

  const [doctorFilter, setDoctorFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const filteredQueue = queue.filter(item => {
    if (doctorFilter !== 'ALL' && item.doctor !== doctorFilter) return false;
    if (departmentFilter !== 'ALL' && item.department !== departmentFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.patient_name && item.patient_name.toLowerCase().includes(q)) ||
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.contact_phone && item.contact_phone.includes(q)) ||
      (item.tokenNumber && item.tokenNumber.toLowerCase().includes(q)) ||
      (item.doctor && item.doctor.toLowerCase().includes(q)) ||
      (item.department && item.department.toLowerCase().includes(q))
    );
  });

  const availableDoctors = Array.from(new Set(queue.map(item => item.doctor).filter(Boolean)));
  const availableDepartments = Array.from(new Set(queue.map(item => item.department).filter(Boolean)));

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            Live Queue Management
            <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
              {queue.length} in Queue
            </span>
          </h1>
          <p className="text-slate-500 mt-1">Real-time OPD triage, patient flow, and doctor queue advancement</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Register Walk-in Button */}
          <button
            type="button"
            onClick={() => setIsWalkInModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm shadow-emerald-500/20 transition cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            + Register Walk-In
          </button>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Departments</option>
            {availableDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Doctor Filter */}
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Doctors</option>
            {availableDoctors.map(doc => (
              <option key={doc} value={doc}>{doc}</option>
            ))}
          </select>

          <button
            onClick={handleCallNext}
            disabled={isCallingNext || queue.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm shadow-blue-200 transition-colors disabled:opacity-50"
          >
            <PhoneForwarded className="h-4 w-4" />
            {isCallingNext ? 'Calling...' : 'Call Next'}
          </button>

          <button
            onClick={handleClearToday}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
            title="Reset queue and start fresh day"
          >
            <Trash2 className="h-3.5 w-3.5 text-slate-500 hover:text-red-600" />
            Clear Day
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, token, doctor..." 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64"
            />
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-lg text-sm flex items-center justify-between animate-fadeIn">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-emerald-600 font-bold ml-4">✕</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Token / Pos</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Details</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Triage Level</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Wait Time (ML)</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Doctor & Dept</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQueue.map((patient) => (
                <tr key={patient.id} className={`hover:bg-slate-50/50 transition-colors ${patient.triage === 'Critical' ? 'bg-red-50/30' : ''}`}>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        patient.triage === 'Critical' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {patient.tokenNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {patient.status === 'serving' ? '(Serving)' : `Pos #${patient.queue_position}`}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{patient.patient_name || patient.name}</span>
                      {patient.is_dependent && (
                        <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                          Dependent {patient.primary_patient_name ? `(Booked by ${patient.primary_patient_name})` : ''}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Age: {patient.patient_age || patient.age || 35} yrs • {patient.patient_gender || patient.gender || 'Patient'} • 📞 {patient.contact_phone || "9876543210"}
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getTriageColor(patient.triage)}`}>
                      {patient.triage}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-semibold text-slate-900">{patient.waitTime}</div>
                    <div className="text-xs font-semibold text-blue-600">Slot: {patient.time_slot || "09:30 AM"}</div>
                    <div className="text-xs text-slate-400">Booked: {patient.booked_time}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-medium text-slate-800">{patient.doctor}</div>
                    <div className="text-xs text-blue-600 font-medium">{patient.department}</div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleDispatchAlert(patient)}
                        disabled={dispatchingId === patient.id}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-emerald-300 disabled:opacity-50"
                        title="Dispatch Leave Now WhatsApp & SMS Alert to Patient Phone"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                        {dispatchingId === patient.id ? 'Sending...' : 'Alert Patient'}
                      </button>

                      {patient.status !== 'serving' && (
                        <button 
                          onClick={() => updateStatus(patient.id, 'serving')}
                          disabled={!!updatingId}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors border border-blue-200 disabled:opacity-50"
                          title="Call into Consultation Room"
                        >
                          <PhoneForwarded className="h-3.5 w-3.5" />
                          {updatingId === `${patient.id}-serving` ? 'Serving...' : 'Serve'}
                        </button>
                      )}
                      <button 
                        onClick={() => updateStatus(patient.id, 'completed')}
                        disabled={!!updatingId}
                        className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors border border-slate-300 disabled:opacity-50"
                        title="Mark Consultation Completed"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        {updatingId === `${patient.id}-completed` ? 'Saving...' : 'Complete'}
                      </button>
                      <button 
                        onClick={() => updateStatus(patient.id, 'skipped')}
                        disabled={!!updatingId}
                        className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors border border-red-200 disabled:opacity-50"
                        title="Patient Absent / Skip"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                        {updatingId === `${patient.id}-skipped` ? 'Skipping...' : 'Skip'}
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredQueue.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-16">
            <AlertCircle className="h-10 w-10 text-slate-300 mb-2" />
            <p className="font-medium">No patients currently in queue.</p>
            <p className="text-sm text-slate-400 mt-1">Declare an emergency walk-in or register regular patients.</p>
          </div>
        )}
      </div>

      {/* ----------------- WALK-IN REGISTRATION MODAL ----------------- */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Reception Counter Walk-in Registration</h3>
                  <p className="text-xs text-slate-500">First-Register First-Serve Digital Token Allocation</p>
                </div>
              </div>
              <button
                onClick={() => setIsWalkInModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Gowda"
                    value={walkinForm.patient_name}
                    onChange={(e) => setWalkinForm({ ...walkinForm, patient_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mobile Phone (for SMS) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={walkinForm.phone}
                    onChange={(e) => setWalkinForm({ ...walkinForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Age</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={walkinForm.age}
                    onChange={(e) => setWalkinForm({ ...walkinForm, age: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Gender</label>
                  <select
                    value={walkinForm.gender}
                    onChange={(e) => setWalkinForm({ ...walkinForm, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Select Doctor & Department *</label>
                <select
                  value={walkinForm.doctor_id}
                  onChange={(e) => {
                    const docId = Number(e.target.value);
                    const docObj = DOCTORS_PRESET.find(d => d.id === docId);
                    setWalkinForm({
                      ...walkinForm,
                      doctor_id: docId,
                      department: docObj?.department || 'General Medicine'
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  {DOCTORS_PRESET.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.department} • {doc.roomNo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Assigned Consultation Slot (Today)</label>
                <select
                  value={walkinForm.time_slot}
                  onChange={(e) => setWalkinForm({ ...walkinForm, time_slot: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  {TIME_SLOTS.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Chief Symptoms / Complaint</label>
                <input
                  type="text"
                  placeholder="e.g. Fever, headache, routine review"
                  value={walkinForm.symptoms}
                  onChange={(e) => setWalkinForm({ ...walkinForm, symptoms: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsWalkInModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWalkIn}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmittingWalkIn ? 'Allocating...' : 'Issue Walk-in Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- THERMAL TOKEN RECEIPT MODAL ----------------- */}
      {issuedWalkInPass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150 text-center">
            
            {/* Header */}
            <div className="space-y-1 border-b border-dashed border-slate-300 pb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Shridevi Hospital • OPD Pass</span>
              <h2 className="text-3xl font-black font-mono text-blue-600">{issuedWalkInPass.tokenNumber}</h2>
              <p className="text-xs font-semibold text-slate-700">{issuedWalkInPass.department} • {issuedWalkInPass.roomNo}</p>
            </div>

            {/* Receipt Details */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient Name:</span>
                <strong className="text-slate-900">{issuedWalkInPass.patient_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Age / Gender:</span>
                <span className="text-slate-700">{issuedWalkInPass.age} yrs • {issuedWalkInPass.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attending Doctor:</span>
                <strong className="text-slate-900">{issuedWalkInPass.doctor}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time Slot:</span>
                <span className="text-blue-600 font-bold">{issuedWalkInPass.time_slot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Patients Ahead:</span>
                <strong className="text-emerald-700">{issuedWalkInPass.patientsAhead} Patients</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Est. Wait:</span>
                <strong className="text-slate-800">{issuedWalkInPass.estimatedWaitMinutes} mins</strong>
              </div>
            </div>

            {/* Visual Token Barcode */}
            <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 flex flex-col items-center justify-center space-y-1">
              <div className="font-mono text-[10px] tracking-widest text-slate-500">||| | |||| | ||| |||| | |||</div>
              <span className="text-[10px] font-mono text-slate-600">AUTH-PASS-{issuedWalkInPass.numericToken}</span>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Thermal Slip
              </button>
              <button
                type="button"
                onClick={() => setIssuedWalkInPass(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Done & Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Queue;
