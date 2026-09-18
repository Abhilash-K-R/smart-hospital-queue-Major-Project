import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Check, UserMinus, PhoneForwarded, RefreshCw, AlertCircle, MessageSquare, Send, Smartphone } from 'lucide-react';
import api from '../services/api';

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
      setActionMessage(res.data.message || 'Next patient called');
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
        patient_name: patient.name,
        phone: patient.phone || "9876543210",
        token_number: patient.tokenNumber
      });
      
      const shareUrl = res.data?.whatsapp_share_url;
      if (shareUrl) {
        window.open(shareUrl, '_blank');
      }
      setActionMessage(`✅ WhatsApp & SMS departure alert dispatched to ${patient.name} (${patient.tokenNumber})`);
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      console.error("Error dispatching alert:", err);
      setActionMessage(`Failed to dispatch alert for ${patient.name}`);
    } finally {
      setDispatchingId(null);
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
      (item.name && item.name.toLowerCase().includes(q)) ||
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
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors shadow-sm"
            title="Clear all active queues to start a fresh day"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Today (Fresh Day)
          </button>

          <button
            onClick={fetchQueue}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

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
                    <div className="text-sm font-semibold text-slate-900">{patient.name}</div>
                    <div className="text-xs text-slate-500">Age: {patient.age || 35} yrs • {patient.gender || 'Patient'}</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getTriageColor(patient.triage)}`}>
                      {patient.triage}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-semibold text-slate-900">{patient.waitTime}</div>
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
    </div>
  );
};

export default Queue;
