import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
  Edit3
} from 'lucide-react';

// Handles appointment validation, token confirmation, location origin setting, and export actions.
export const Appointment = () => {
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
      symptoms: "Routine seasonal health evaluation & mild fever"
    }
  });

  const selectedDepartment = watch('department');
  const selectedDoctorName = watch('doctor');
  const availableDoctors = DOCTORS.filter(d => d.department === selectedDepartment);

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

      if (res && res.patient) {
        setUser({
          ...res.patient,
          patient_lat: coords.lat,
          patient_lng: coords.lng,
          origin_location: locationState
        });
      }

      setConfirmedAppointment({
        ...data,
        tokenNumber: res.tokenNumber || `OPD-0${res.numericToken || 18}`,
        numericToken: res.numericToken || 18,
        patientName: user?.name || DEMO_PATIENT.name,
        patientId: user?.id || DEMO_PATIENT.id,
        doctor: res.doctor || data.doctor,
        department: res.department || data.department,
        roomNo: res.roomNo || docObj.roomNo || "Room 204",
        patientsAhead: res.patientsAhead ?? 4,
        estimatedWait: `${Math.round(res.estimatedWaitMinutes || 20)} Mins`,
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
      <TopBar title="Book OPD Appointment" subtitle="Instant digital token allocation with AI wait optimization" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Booking Form (8 cols) */}
        <div className="lg:col-span-8">
          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" /> Select OPD Consultation Slot
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
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
                      <option key={d.id} value={d.name}>{d.name}</option>
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

              {/* Symptoms / Chief Complaint */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Primary Symptoms / Medical Concern *
                </label>
                <textarea
                  {...register('symptoms')}
                  rows={3}
                  placeholder="Describe your primary symptoms (e.g., severe chest tightness, high grade fever, chronic cough...)"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.symptoms && (
                  <p className="text-xs text-rose-500">{errors.symptoms.message}</p>
                )}
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

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                icon={Download}
                onClick={() => downloadAppointmentPDF(confirmedAppointment)}
              >
                Download PDF
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => setConfirmedAppointment(null)}
              >
                Done
              </Button>
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
