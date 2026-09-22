import React, { useState, useEffect } from 'react';
import { AlertTriangle, Activity, Thermometer, Droplets, Heart, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Emergency = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState('');
  const [doctors, setDoctors] = useState([]);

  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState(45);
  const [gender, setGender] = useState('Male');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [bloodPressure, setBloodPressure] = useState('140/90');
  const [heartRate, setHeartRate] = useState(105);
  const [spo2, setSpo2] = useState(94);
  const [temperature, setTemperature] = useState(37.6);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/staff/doctors');
        if (res.data) setDoctors(res.data);
      } catch (err) {
        console.error('Error fetching doctors:', err);
      }
    };
    fetchDoctors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessData(null);

    try {
      const payload = {
        name,
        age: parseInt(age) || 45,
        gender,
        chief_complaint: chiefComplaint,
        doctor_id: doctorId ? parseInt(doctorId) : null,
        blood_pressure: bloodPressure,
        heart_rate: parseInt(heartRate) || 85,
        spo2: parseInt(spo2) || 98,
        temperature: parseFloat(temperature) || 37.0,
      };

      const res = await api.post('/staff/emergency-insert', payload);
      setSuccessData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to declare emergency intake.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setChiefComplaint('');
    setSuccessData(null);
    setError('');
  };

  // Auto-triage helper for previewing recommended specialty
  const getAutoTriagePreview = () => {
    if (doctorId) return null;
    const complaintLower = (chiefComplaint || '').toLowerCase();
    const patientAge = parseInt(age);

    if ((patientAge && patientAge <= 14) || /baby|child|infant|kid|pediatric|toddler/.test(complaintLower)) {
      return doctors.find(d => d.department?.toLowerCase().includes('pediatric')) || { name: 'Pediatrics Specialist', department: 'Pediatrics' };
    }
    if (/chest|heart|cardiac|palpitation|angina|attack|coronary|ecg|bp|hypertension/.test(complaintLower)) {
      return doctors.find(d => d.department?.toLowerCase().includes('cardio')) || { name: 'Dr. Priya Sharma', department: 'Cardiology' };
    }
    if (/breath|lung|respiratory|asthma|spo2|oxygen|choking|wheez|cough/.test(complaintLower)) {
      return doctors.find(d => d.department?.toLowerCase().includes('pulmon')) || { name: 'Dr. Manoj Kumar', department: 'Pulmonology' };
    }
    if (/stroke|seizure|head injury|unconscious|coma|faint|syncope|paralysis|brain/.test(complaintLower)) {
      return doctors.find(d => d.department?.toLowerCase().includes('neuro')) || { name: 'Dr. Rajeshwar B.', department: 'Neurology' };
    }
    if (/fracture|bone|accident|trauma|joint|sprain|dislocation|fall|injury/.test(complaintLower)) {
      return doctors.find(d => d.department?.toLowerCase().includes('ortho')) || { name: 'Dr. Vikram K. Rao', department: 'Orthopedics' };
    }
    if (/burn|skin|rash|allergy|anaphylaxis|bite|sting/.test(complaintLower)) {
      return doctors.find(d => d.department?.toLowerCase().includes('derma')) || { name: 'Dr. Sneha Patil', department: 'Dermatology' };
    }
    return doctors.find(d => d.department?.toLowerCase().includes('general')) || { name: 'General Medicine Triage', department: 'General Medicine' };
  };

  const recommendedDoctor = getAutoTriagePreview();

  return (
    <div className="p-6 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-6 flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
        <div>
          <h2 className="text-red-800 font-bold text-lg">Emergency Triage Intake & Immediate Queue Bumping</h2>
          <p className="text-red-700 text-sm mt-1">
            Submitting this form immediately inserts the patient at <strong>Position 1</strong> of the OPD queue and automatically shifts all regular appointments back by +1 position. Downstream patient arrival and departure recommendations recalculate dynamically.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-300 text-red-800 p-4 rounded-xl text-sm flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to Declare Emergency:</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {successData && (
        <div className="mb-6 bg-emerald-50 border border-emerald-300 p-6 rounded-xl shadow-sm animate-fadeIn">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-7 w-7 text-emerald-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-emerald-900">
                Emergency Patient Prioritized at Position #1
              </h3>
              <p className="text-emerald-700 text-sm mt-1">
                {successData.message}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
                <span className="bg-white px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-800">
                  Token: {successData.tokenNumber}
                </span>
                <span className="bg-white px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-800">
                  Queue Position: #{successData.queue_position}
                </span>
                <span className="bg-white px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-800">
                  Shifted Regular Patients: {successData.impacted_patients}
                </span>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => navigate('/queue')}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                >
                  View in Live Queue <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Intake Another Patient
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Critical Patient Intake Form</h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-red-100 text-red-700 rounded-full">
            Triage Level: Critical
          </span>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Patient Full Name</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Kumar" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                <input 
                  type="number" 
                  required 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="45" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assign Doctor (Optional)</label>
              <select 
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              >
                <option value="">Auto-Assign to Available Doctor (Clinical Triage)</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.department}) - Queue: {d.queue_length}
                  </option>
                ))}
              </select>
              {!doctorId && recommendedDoctor && (
                <p className="text-xs text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-md mt-1.5 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                  <span>
                    Auto-Triage Target: <strong>{recommendedDoctor.name}</strong> ({recommendedDoctor.department})
                  </span>
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Chief Complaint / Condition</label>
            <textarea 
              required 
              rows={3} 
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="E.g., heart pain, chest tightness, shortness of breath, fracture, seizure..." 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            ></textarea>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Vitals (Triage Metrics)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Blood Pressure
                </label>
                <input 
                  type="text" 
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  placeholder="140/90" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <Heart className="h-3 w-3" /> Heart Rate (BPM)
                </label>
                <input 
                  type="number" 
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  placeholder="105" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <Droplets className="h-3 w-3" /> SpO2 (%)
                </label>
                <input 
                  type="number" 
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  placeholder="94" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <Thermometer className="h-3 w-3" /> Temp (°C)
                </label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="37.6" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={handleReset}
            className="px-6 py-2.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Clear Form
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting || !name || !chiefComplaint}
            className="px-6 py-2.5 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-200 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Prioritizing...' : 'Declare Emergency & Bump Queue'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Emergency;
