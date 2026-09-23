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
  HelpCircle,
  AlertCircle,
  Lock
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

// Standard OPD time slots
export const OPD_TIME_SLOTS = [
  { time: "09:00 AM", label: "09:00 AM - Morning Shift", hour: 9, minute: 0 },
  { time: "09:30 AM", label: "09:30 AM - Morning Shift", hour: 9, minute: 30 },
  { time: "10:00 AM", label: "10:00 AM - Prime Peak Shift", hour: 10, minute: 0 },
  { time: "10:30 AM", label: "10:30 AM - Prime Peak Shift", hour: 10, minute: 30 },
  { time: "11:00 AM", label: "11:00 AM - Mid-Morning Shift", hour: 11, minute: 0 },
  { time: "11:30 AM", label: "11:30 AM - Mid-Morning Shift", hour: 11, minute: 30 },
  { time: "12:00 PM", label: "12:00 PM - Midday Consultation", hour: 12, minute: 0 },
  { time: "12:30 PM", label: "12:30 PM - Midday Consultation", hour: 12, minute: 30 },
  { time: "02:00 PM", label: "02:00 PM - Afternoon OPD", hour: 14, minute: 0 },
  { time: "02:30 PM", label: "02:30 PM - Afternoon OPD", hour: 14, minute: 30 },
  { time: "03:00 PM", label: "03:00 PM - Afternoon OPD", hour: 15, minute: 0 },
  { time: "03:30 PM", label: "03:30 PM - Afternoon OPD", hour: 15, minute: 30 },
  { time: "04:00 PM", label: "04:00 PM - Evening Clinic", hour: 16, minute: 0 },
  { time: "04:30 PM", label: "04:30 PM - Evening Clinic", hour: 16, minute: 30 }
];

// Dynamic local date calculation helper (in local client timezone)
export const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Handles appointment validation, AI department prediction, token confirmation, and location origin.
export const Appointment = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Dynamic local date calculation (local timezone)
  const todayDate = useMemo(() => getTodayDateString(), []);

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

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      attendeeType: "myself",
      patientName: user?.name || "Patient",
      patientAge: user?.age || 35,
      patientGender: user?.gender || "Male",
      contactPhone: user?.phone || "9876543210",
      department: "General Medicine",
      doctor: "Dr. Rajeswari R.",
      date: getTodayDateString(),
      timeSlot: "10:30 AM",
      symptoms: "Seasonal viral fever & mild headache"
    }
  });

  const attendeeType = watch('attendeeType') || 'myself';
  const selectedDepartment = watch('department');
  const selectedDoctorName = watch('doctor');
  const watchedSymptoms = watch('symptoms');
  const selectedDate = watch('date') || todayDate;
  const selectedSlot = watch('timeSlot');
  const availableDoctors = DOCTORS.filter(d => d.department === selectedDepartment);

  // Sync self details when switching between myself and dependent
  useEffect(() => {
    if (attendeeType === 'myself') {
      setValue('patientName', user?.name || "Patient");
      setValue('patientAge', user?.age || 35);
      setValue('patientGender', user?.gender || "Male");
      setValue('contactPhone', user?.phone || "9876543210");
    }
  }, [attendeeType, user, setValue]);

  // Dynamic Time Slot Availability Calculation based on selected date and current time
  const computedSlots = useMemo(() => {
    const isToday = selectedDate === todayDate;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return OPD_TIME_SLOTS.map(slot => {
      const slotMinutes = slot.hour * 60 + slot.minute;
      const isPast = isToday && (slotMinutes <= currentMinutes);
      return {
        ...slot,
        isPast
      };
    });
  }, [selectedDate, todayDate]);

  const activeAvailableSlots = useMemo(() => {
    return computedSlots.filter(s => !s.isPast);
  }, [computedSlots]);

  // Ensure selected timeSlot is valid for chosen date
  useEffect(() => {
    if (activeAvailableSlots.length > 0) {
      const isCurrentValid = activeAvailableSlots.some(s => s.time === selectedSlot);
      if (!isCurrentValid) {
        setValue('timeSlot', activeAvailableSlots[0].time);
      }
    }
  }, [activeAvailableSlots, selectedSlot, setValue]);

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
    if (isSubmitting) return; // Hard block duplicate executions
    setBookingError(null);

    const isToday = data.date === todayDate;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const slotObj = OPD_TIME_SLOTS.find(s => s.time === data.timeSlot);
    if (slotObj && isToday && (slotObj.hour * 60 + slotObj.minute <= currentMinutes)) {
      setBookingError({
        type: "warning",
        message: "Selected time slot has already passed for today. Please select an upcoming slot or a future date."
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const docObj = DOCTORS.find(d => d.name === data.doctor) || currentDoctorObj;
      const isDep = data.attendeeType === 'dependent';
      const attendeeName = isDep ? (data.patientName || "Family Member") : (user?.name || "Patient");
      const parsedAge = parseInt(isDep ? data.patientAge : (user?.age || 35), 10);
      const attendeeAge = isNaN(parsedAge) ? 30 : parsedAge;
      const attendeeGender = isDep ? (data.patientGender || "Male") : (user?.gender || "Male");
      const attendeePhone = String(isDep ? (data.contactPhone || user?.phone || "9876543210") : (user?.phone || "9876543210")).trim();

      // Safe clean numeric patient_id
      let cleanPatientId = 1;
      if (user?.id) {
        const rawId = user.id;
        if (typeof rawId === 'number') cleanPatientId = rawId;
        else if (typeof rawId === 'string') {
          const digits = rawId.replace(/\D/g, '');
          cleanPatientId = digits ? parseInt(digits, 10) : 1;
        }
      }

      const payload = {
        doctor_id: docObj?.doctorId || 3,
        doctor: data.doctor,
        department: data.department,
        date: data.date || todayDate,
        time_slot: data.timeSlot || "10:30 AM",
        timeSlot: data.timeSlot || "10:30 AM",
        symptoms: data.symptoms || "Consultation",
        patient_name: attendeeName,
        patient_age: attendeeAge,
        patient_gender: attendeeGender,
        contact_phone: attendeePhone,
        is_dependent: isDep,
        beneficiary_name: attendeeName,
        beneficiary_age: attendeeAge,
        beneficiary_gender: attendeeGender,
        patient_id: cleanPatientId,
        email: user?.email || "patient@shridevimediflow.ai",
        phone: String(user?.phone || "9876543210").trim(),
        patient_lat: Number(coords?.lat) || 13.376230,
        patient_lng: Number(coords?.lng) || 77.097439,
        origin_name: locationState?.name || "Tumakuru South",
        origin_mode: locationState?.mode || "gps",
        is_family_booking: isDep || isFamilyBooking
      };

      const res = await patientService.bookAppointment(payload);
      triggerConfetti();

      const allocatedToken = res?.tokenNumber || (res?.numericToken ? `OPD-${String(res.numericToken).padStart(3, '0')}` : (res?.appointment_id ? `OPD-${String(res.appointment_id).padStart(3, '0')}` : "OPD-001"));
      const patientsAheadCount = res?.patientsAhead ?? 0;

      if (res && (res.patient || res.appointment_id)) {
        const updatedUser = {
          ...(res.patient || user || {}),
          id: user?.id || res.patient?.id || 1,
          name: user?.name || res.patient?.name || "Patient",
          phone: user?.phone || res.patient?.phone || "9876543210",
          appointment_id: res.appointment_id || res.patient?.appointment_id,
          tokenNumber: allocatedToken,
          numericToken: res?.numericToken || res?.appointment_id || 1,
          doctor: res?.doctor || data.doctor,
          doctorId: docObj?.doctorId || 3,
          department: res?.department || data.department,
          roomNo: res?.roomNo || docObj?.roomNo || "Room 204",
          patient_lat: coords.lat,
          patient_lng: coords.lng,
          origin_location: locationState
        };
        setUser(updatedUser);
      }

      setConfirmedAppointment({
        ...data,
        tokenNumber: allocatedToken,
        numericToken: res?.numericToken || res?.appointment_id || 1,
        patientName: attendeeName,
        patientAge: attendeeAge,
        patientGender: attendeeGender,
        contactPhone: attendeePhone,
        isDependent: isDep,
        primaryName: user?.name || "Primary Account Holder",
        patientId: user?.id || 1,
        doctor: res?.doctor || data.doctor,
        department: res?.department || data.department,
        roomNo: res?.roomNo || docObj?.roomNo || "Room 204",
        patientsAhead: patientsAheadCount,
        estimatedWait: `${Math.round(res?.estimatedWaitMinutes || 10)} Mins`,
        originLocation: locationState?.name || locationLabel
      });
    } catch (err) {
      console.error("Booking error:", err);
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      let errMsg = "Failed to book appointment. Please check details and try again.";

      if (Array.isArray(detail)) {
        errMsg = detail.map(d => `${d.loc?.slice(-1)[0] || 'Field'}: ${d.msg}`).join(", ");
      } else if (typeof detail === 'string') {
        errMsg = detail;
      } else if (err.message) {
        if (err.message.toLowerCase().includes("network error")) {
          errMsg = "Unable to connect to hospital server. Please verify network connection or try again.";
        } else {
          errMsg = err.message;
        }
      }

      if (status === 401 || errMsg.toLowerCase().includes("not authenticated") || errMsg.toLowerCase().includes("invalid or expired token")) {
        setBookingError({
          type: "auth",
          message: "Your session has expired or requires authentication. Please sign in to confirm your OPD appointment."
        });
      } else if (status === 409 || errMsg.toLowerCase().includes("already exists") || errMsg.toLowerCase().includes("already have an active")) {
        setBookingError({
          type: "warning",
          message: errMsg
        });
      } else {
        setBookingError({
          type: "error",
          message: errMsg
        });
      }
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
              
              {/* Dedicated Patient & Attendee Information Card */}
              <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Who is this appointment for? *
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-md">
                    {attendeeType === 'myself' ? 'Self Booking' : 'Dependent / Family'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      attendeeType === 'myself'
                        ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-500 text-blue-950 dark:text-blue-100 shadow-sm ring-1 ring-blue-500/30'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value="myself"
                      {...register('attendeeType')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-xs font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                        <User className="w-3.5 h-3.5 text-blue-500" /> Myself (Account Holder)
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Pre-fill my saved profile details
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      attendeeType === 'dependent'
                        ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-500 text-blue-950 dark:text-blue-100 shadow-sm ring-1 ring-blue-500/30'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value="dependent"
                      {...register('attendeeType')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-xs font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                        <Users className="w-3.5 h-3.5 text-indigo-500" /> Family Member / Dependent
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Child, parent, spouse or relative
                      </p>
                    </div>
                  </label>
                </div>

                {attendeeType === 'myself' ? (
                  <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Patient Name</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{user?.name || "Laxuman G"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Age</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{user?.age || 35} yrs</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Gender</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{user?.gender || "Male"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">SMS Alerts Phone</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">📞 {user?.phone || "9876543210"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1 sm:col-span-1">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          Patient Full Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Aarav Kumar"
                          {...register('patientName')}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.patientName && (
                          <p className="text-[11px] text-rose-500">{errors.patientName.message}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          Age (1–120) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          placeholder="e.g. 8"
                          {...register('patientAge')}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.patientAge && (
                          <p className="text-[11px] text-rose-500">{errors.patientAge.message}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          Gender *
                        </label>
                        <select
                          {...register('patientGender')}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.patientGender && (
                          <p className="text-[11px] text-rose-500">{errors.patientGender.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        Contact Phone for SMS Alerts *
                      </label>
                      <input
                        type="tel"
                        maxLength="10"
                        placeholder="10-digit mobile number for queue & departure SMS"
                        {...register('contactPhone')}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        ℹ️ Live OPD queue updates, departure alerts, and token notifications will be sent to this number.
                      </p>
                      {errors.contactPhone && (
                        <p className="text-[11px] text-rose-500">{errors.contactPhone.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

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
                    min={todayDate}
                    {...register('date', {
                      onChange: (e) => {
                        const val = e.target.value;
                        if (val && val < todayDate) {
                          setValue('date', todayDate);
                          setBookingError({
                            type: "warning",
                            message: "Cannot book appointments for past dates. Date has been reset to today."
                          });
                        }
                      }
                    })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Preferred Time Slot *
                  </label>
                  <select
                    {...register('timeSlot')}
                    disabled={activeAvailableSlots.length === 0}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {computedSlots.map(slot => (
                      <option key={slot.time} value={slot.time} disabled={slot.isPast}>
                        {slot.label} {slot.isPast ? "❌ (Slot Passed)" : "✅"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {activeAvailableSlots.length === 0 && selectedDate === todayDate && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <span>⚠️ <strong>All OPD slots for today have concluded.</strong> Please choose tomorrow or an upcoming date above.</span>
                </div>
              )}

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

              {/* Booking Error Banner */}
              {bookingError && (
                <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs transition-all ${
                  bookingError.type === 'auth'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                    : bookingError.type === 'warning'
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-900 dark:text-yellow-200'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
                }`}>
                  <div className="shrink-0 mt-0.5">
                    {bookingError.type === 'auth' ? (
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="font-semibold leading-relaxed">{bookingError.message}</p>
                    {bookingError.type === 'auth' && (
                      <button
                        type="button"
                        onClick={() => navigate('/login?redirect=/appointment')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 shadow-sm transition"
                      >
                        Sign In to Continue <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setBookingError(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
                  >
                    ×
                  </button>
                </div>
              )}

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
              <div className="col-span-2 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Patient / Attendee</span>
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {confirmedAppointment.patientName}
                    {confirmedAppointment.isDependent && (
                      <span className="text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold px-2 py-0.5 rounded-full">
                        Dependent
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">SMS Updates Mobile</span>
                  <p className="font-bold text-blue-600 dark:text-blue-400">📞 {confirmedAppointment.contactPhone}</p>
                </div>
              </div>
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

