import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { appointmentSchema } from '../utils/validators';
import { TopBar } from '../components/TopBar';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { LocationOriginSelector } from '../components/LocationOriginSelector';
import { useLocationResolver } from '../hooks/useLocationResolver';
import { DEPARTMENTS, DOCTORS, DEMO_PATIENT } from '../utils/constants';
import { downloadAppointmentPDF, triggerConfetti } from '../utils/helpers';
import { patientService } from '../services/patientService';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar,
  Clock,
  Stethoscope,
  Ticket,
  Download,
  Printer,
  CheckCircle2,
  User,
  FileText,
  MapPin,
  Navigation,
  Users,
  Edit3,
  Sparkles,
  BrainCircuit,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

// Common real-world symptom presets for quick triage
const SYMPTOM_PRESETS = [
  { label: "Viral Fever & Chills", department: "General Medicine", symptoms: "High grade viral fever, body chills & generalized fatigue" },
  { label: "Chest Tightness & Palpitations", department: "Cardiology", symptoms: "Chest heaviness during walking, mild palpitations & breathlessness" },
  { label: "Knee Joint Pain & Swelling", department: "Orthopedics", symptoms: "Severe knee joint pain, morning stiffness & difficulty climbing stairs" },
  { label: "Chronic Dry Cough & Wheezing", department: "Pulmonology", symptoms: "Persistent dry cough for 2 weeks with evening wheezing" },
  { label: "Child Vaccination & Cold", department: "Pediatrics", symptoms: "Infant seasonal immunization checkup with mild nasal congestion" },
  { label: "Migraine & Throbbing Headache", department: "Neurology", symptoms: "Unilateral throbbing headache with light sensitivity & dizziness" },
  { label: "Skin Rash & Itching", department: "Dermatology", symptoms: "Red itchy skin rash with allergic flareup on arms and neck" }
];

// AI Triage Department Matcher
const predictDepartment = (text = "") => {
  const t = text.toLowerCase();
  if (!t.trim()) {
    return {
      department: "General Medicine",
      confidence: 88,
      reason: "General health consultations and common symptoms are triaged to General Medicine."
    };
  }

  // 1. Cardiology
  if (/chest|heart|palpitat|cardiac|angina|hypertens|bp\b|blood pressure|left arm|ecg|cholesterol/.test(t)) {
    return {
      department: "Cardiology",
      confidence: 94,
      reason: "Cardiac, chest tightness, or cardiovascular markers match Cardiology."
    };
  }

  // 2. Pulmonology
  if (/asthma|wheez|phlegm|bronch|lung|breath|cough|pneumon|respirat/.test(t)) {
    return {
      department: "Pulmonology",
      confidence: 92,
      reason: "Respiratory, cough, lung airway, or wheezing symptoms match Pulmonology."
    };
  }

  // 3. Orthopedics
  if (/bone|fracture|knee|joint|spine|back pain|arthritis|neck pain|shoulder|sprain|ligament|swelling|posture|slip disc/.test(t)) {
    return {
      department: "Orthopedics",
      confidence: 91,
      reason: "Musculoskeletal, bone, joint, or spinal symptoms match Orthopedics."
    };
  }

  // 4. Dermatology
  if (/skin|rash|itch|eczema|acne|psoriasis|fungal|allergy|pigment|hair fall|scalp|boil|pimple/.test(t)) {
    return {
      department: "Dermatology",
      confidence: 93,
      reason: "Cutaneous, skin rash, allergic reaction, or dermatological symptoms match Dermatology."
    };
  }

  // 5. Pediatrics
  if (/baby|child|infant|kid|toddler|vaccin|immuniz|newborn|crying|pediatr/.test(t)) {
    return {
      department: "Pediatrics",
      confidence: 95,
      reason: "Infant health, child immunization, or pediatric growth checkups match Pediatrics."
    };
  }

  // 6. Neurology
  if (/seizure|stroke|migraine|numbness|tingling|tremor|paralysis|brain|epilepsy|vertigo/.test(t)) {
    return {
      department: "Neurology",
      confidence: 89,
      reason: "Neurological, severe migraine, nerve numbness, or dizziness match Neurology."
    };
  }

  // 7. General Medicine (fever, cold, viral, stomach, vomiting, fatigue, routine, or unclassified)
  return {
    department: "General Medicine",
    confidence: 90,
    reason: "Common real-world symptoms (fever, cold, fatigue, stomach, routine health checks) triage to General Medicine."
  };
};

// Handles appointment validation, AI department prediction, token confirmation, and location origin.
export const Appointment = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Dual Mode Location Hook
  const {
    locationState,
    coords,
    isGPS,
    isFamilyBooking,
    label: locationLabel,
    isLocating,
    setLiveGPSMode,
    setManualLocationByPincode
  } = useLocationResolver();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      department: "General Medicine",
      doctor: "Dr. Rajeswari R.",
      date: new Date().toISOString().split('T')[0],
      timeSlot: "10:30 AM",
      symptoms: "Seasonal viral fever & mild headache"
    }
  });

  const selectedDepartment = watch('department');
  const selectedDoctorName = watch('doctor');
  const watchedSymptoms = watch('symptoms');
  const availableDoctors = DOCTORS.filter(d => d.department === selectedDepartment);

  // Dynamic AI Department Prediction based on entered symptoms
  const aiPrediction = useMemo(() => {
    return predictDepartment(watchedSymptoms || "");
  }, [watchedSymptoms]);

  // Auto select first doctor of newly selected department if current selection is invalid
  useEffect(() => {
    if (availableDoctors.length > 0) {
      const exists = availableDoctors.some(d => d.name === selectedDoctorName);
      if (!exists) {
        setValue('doctor', availableDoctors[0].name);
      }
    }
  }, [selectedDepartment, availableDoctors, selectedDoctorName, setValue]);

  const currentDoctorObj = DOCTORS.find(d => d.name === selectedDoctorName) || availableDoctors[0] || DOCTORS[0];

  const handleApplyRecommendedDepartment = (deptName) => {
    setValue('department', deptName);
    const docs = DOCTORS.filter(d => d.department === deptName);
    if (docs.length > 0) {
      setValue('doctor', docs[0].name);
    }
  };

  const handlePresetSelect = (preset) => {
    setValue('symptoms', preset.symptoms);
    setValue('department', preset.department);
    const docs = DOCTORS.filter(d => d.department === preset.department);
    if (docs.length > 0) {
      setValue('doctor', docs[0].name);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const docObj = DOCTORS.find(d => d.name === data.doctor) || currentDoctorObj;
      const payload = {
        doctor_id: docObj?.doctorId || 3,
        doctor: data.doctor,
        department: data.department,
        date: data.date,
        time_slot: data.timeSlot,
        timeSlot: data.timeSlot,
        symptoms: data.symptoms,
        patient_name: user?.name || DEMO_PATIENT.name,
        patient_id: user?.id || DEMO_PATIENT.id,
        email: user?.email || DEMO_PATIENT.email,
        phone: user?.phone || DEMO_PATIENT.phone,
        patient_lat: coords.lat,
        patient_lng: coords.lng,
        origin_name: locationState?.name || "Tumakuru South",
        origin_mode: locationState?.mode || "gps",
        is_family_booking: isFamilyBooking
      };

      const res = await patientService.bookAppointment(payload);
      triggerConfetti();

      const allocatedToken = res?.tokenNumber || (res?.numericToken ? `OPD-${String(res.numericToken).padStart(3, '0')}` : "OPD-002");

      if (res && res.patient) {
        setUser({
          ...res.patient,
          tokenNumber: allocatedToken,
          patient_lat: coords.lat,
          patient_lng: coords.lng,
          origin_location: locationState
        });
      }

      setConfirmedAppointment({
        ...data,
        tokenNumber: allocatedToken,
        numericToken: res?.numericToken || 2,
        patientName: user?.name || DEMO_PATIENT.name,
        patientId: user?.id || DEMO_PATIENT.id,
        doctor: res?.doctor || data.doctor,
        department: res?.department || data.department,
        roomNo: res?.roomNo || docObj.roomNo || "Room 204",
        patientsAhead: res?.patientsAhead ?? 1,
        estimatedWait: `${Math.round(res?.estimatedWaitMinutes || 15)} Mins`,
        originLocation: locationState?.name || locationLabel
      });
    } catch (err) {
      console.error("Booking error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <TopBar title="Book Appointment" subtitle="Instant digital token allocation with AI department triage & wait optimization" />

      {/* Quick Symptom Chips Header */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Sparkles className="w-4 h-4 text-cyan-500" />
          <span>Quick Symptom Selection (1-Click AI Auto-Triage):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SYMPTOM_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-all text-slate-700 dark:text-slate-300"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Booking Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* AI Department Prediction Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-indigo-600/10 border border-cyan-500/30 backdrop-blur-md space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500 text-white shadow-md shadow-cyan-500/30">
                  <BrainCircuit className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-700 dark:text-cyan-300">
                    AI Clinical Department Predictor
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Suggested Department: <span className="text-blue-600 dark:text-blue-400">{aiPrediction.department}</span> ({aiPrediction.confidence}% Match)
                  </h4>
                </div>
              </div>

              {selectedDepartment !== aiPrediction.department && (
                <button
                  type="button"
                  onClick={() => handleApplyRecommendedDepartment(aiPrediction.department)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Select {aiPrediction.department}
                </button>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              💡 <strong>AI Analysis:</strong> {aiPrediction.reason}
            </p>
          </div>

          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" /> Patient & Consultation Details
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Symptoms / Chief Complaint */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>Describe Symptoms / Reason for Visit *</span>
                  <span className="text-[11px] text-cyan-600 dark:text-cyan-400 normal-case font-bold">
                    AI automatically matches department as you type
                  </span>
                </label>
                <textarea
                  {...register('symptoms')}
                  rows={3}
                  placeholder="e.g. High fever with body chills, mild throat pain, feeling dizzy..."
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.symptoms && (
                  <p className="text-xs text-rose-500">{errors.symptoms.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Department *
                  </label>
                  <select
                    {...register('department')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.name}>
                        {d.name} {d.name === aiPrediction.department ? `⭐ (${aiPrediction.confidence}% AI Match)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Attending Specialist *
                  </label>
                  <select
                    {...register('doctor')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableDoctors.map(doc => (
                      <option key={doc.id} value={doc.name}>{doc.name} ({doc.roomNo})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Date *
                  </label>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Preferred Time Slot *
                  </label>
                  <select
                    {...register('timeSlot')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="09:00 AM">09:00 AM - Morning Shift</option>
                    <option value="10:30 AM">10:30 AM - Prime Peak Shift</option>
                    <option value="12:00 PM">12:00 PM - Midday Consultation</option>
                    <option value="02:30 PM">02:30 PM - Afternoon OPD</option>
                    <option value="04:00 PM">04:00 PM - Evening Clinic</option>
                  </select>
                </div>
              </div>

              {/* Departure Location Origin Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Departure Location Origin
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Change
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    {isGPS ? (
                      <Navigation className="w-4 h-4 text-blue-500 animate-pulse shrink-0" />
                    ) : (
                      <Users className="w-4 h-4 text-purple-500 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {locationState?.name || locationLabel}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isGPS ? 'Auto-detected device GPS' : `PIN ${locationState.pincode} (Family/Remote Origin)`}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-md">
                    {isGPS ? 'Live GPS' : 'Manual PIN'}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={isSubmitting}
                icon={Ticket}
              >
                {isSubmitting ? 'Allocating OPD Queue Token...' : 'Confirm Appointment & Generate Token'}
              </Button>
            </form>
          </div>
        </div>

        {/* Right Info Cards (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-500" /> Specialist Roster Info
            </h4>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">{currentDoctorObj.name}</p>
                <p className="text-[11px] text-blue-600 dark:text-blue-400">{currentDoctorObj.qualification}</p>
                <p className="text-[11px] text-slate-500">{currentDoctorObj.experience} • {currentDoctorObj.roomNo}</p>
              </div>
              <div className="flex items-center justify-between text-[11px] p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-800 dark:text-blue-300 font-semibold">
                <span>Avg Consultation Speed:</span>
                <span>{currentDoctorObj.avgConsultTimeMinutes} mins/patient</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 space-y-3 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border-blue-500/20">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4" /> Zero-Lobby Waiting Protocol
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Once booked, Shridevi MediFlow monitors live queue movement against your commute distance and issues a WhatsApp / SMS Leave-Now advisory so you arrive right on time.
            </p>
          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      {confirmedAppointment && (
        <Modal
          isOpen={Boolean(confirmedAppointment)}
          onClose={() => setConfirmedAppointment(null)}
          title="Digital OPD Token Allocated"
        >
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Official Queue Token</span>
              <p className="text-4xl font-black font-mono text-blue-600 dark:text-blue-400">
                {confirmedAppointment.tokenNumber}
              </p>
              <p className="text-xs text-slate-500">{confirmedAppointment.department} • {confirmedAppointment.roomNo}</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 text-left text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Doctor</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{confirmedAppointment.doctor}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Time Slot</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{confirmedAppointment.timeSlot}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Patients Ahead</span>
                <p className="font-bold text-blue-600">{confirmedAppointment.patientsAhead} Patients</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Est Wait</span>
                <p className="font-bold text-emerald-600">{confirmedAppointment.estimatedWait}</p>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center p-3 bg-white rounded-xl shadow-inner w-fit mx-auto border border-slate-200">
              <QRCodeSVG value={`SHRIDEVI-TOKEN:${confirmedAppointment.tokenNumber}`} size={110} />
            </div>

            <div className="space-y-2">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                icon={ArrowRight}
                onClick={() => {
                  setConfirmedAppointment(null);
                  navigate('/arrival-prediction');
                }}
              >
                Go to My Appointment & Route Guide
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  icon={Download}
                  onClick={() => downloadAppointmentPDF(confirmedAppointment)}
                >
                  Download PDF
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setConfirmedAppointment(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

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

export default Appointment;

