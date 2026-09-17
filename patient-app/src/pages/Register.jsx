import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { registerSchema } from '../utils/validators';
import { patientService } from '../services/patientService';
import { useAuth } from '../context/AuthContext';
import { triggerConfetti } from '../utils/helpers';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { DEPARTMENTS, DOCTORS } from '../utils/constants';
import { User, Phone, Mail, Droplet, Stethoscope, Calendar, Clock, MapPin, ShieldAlert, CheckCircle2, Ticket, Download, Printer } from 'lucide-react';

// Validates patient registration, requests a token, and displays confirmation.
export const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [tokenResult, setTokenResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "Laxuman G",
      age: 23,
      gender: "Male",
      phone: "9876543210",
      email: "laxuman.patient@mediflow.ai",
      bloodGroup: "O+",
      department: "General Medicine",
      doctor: "Dr. Rajeswari R.",
      symptoms: "Persistent fever and seasonal chills",
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: "10:30",
      address: "MG Road, Tech Hub, Bengaluru",
      emergencyContact: "9812345678"
    }
  });

  const selectedDepartment = watch('department');
  const selectedDoctorName = watch('doctor');

  const filteredDoctors = DOCTORS.filter(d => 
    selectedDepartment ? d.department === selectedDepartment : true
  );

  React.useEffect(() => {
    if (filteredDoctors.length > 0) {
      const exists = filteredDoctors.some(d => d.name === selectedDoctorName);
      if (!exists) {
        setValue('doctor', filteredDoctors[0].name);
      }
    }
  }, [selectedDepartment, filteredDoctors, selectedDoctorName, setValue]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const docObj = DOCTORS.find(d => d.name === data.doctor) || filteredDoctors[0];
    const payload = {
      ...data,
      doctor_id: docObj?.doctorId || 3
    };
    const res = await patientService.registerPatient(payload);
    setIsSubmitting(false);

    if (res.success) {
      triggerConfetti();
      setTokenResult(res.patient);
      login(res.patient);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded-full border border-blue-200 dark:border-blue-800">
          OPD Patient Onboarding
        </span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Patient Registration & Smart Token Generation
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Fill patient details to receive your AI-predicted appointment token immediately.
        </p>
      </div>

      {/* Form Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 space-y-8 border border-slate-200 dark:border-slate-800 shadow-2xl">
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Section 1: Patient Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <User className="w-4 h-4" /> 1. Personal & Contact Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="e.g. Laxuman G"
                icon={User}
                error={errors.fullName?.message}
                {...register('fullName')}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Age"
                  type="number"
                  placeholder="23"
                  error={errors.age?.message}
                  {...register('age')}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Gender *
                  </label>
                  <select
                    {...register('gender')}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <Input
                label="Phone Number"
                placeholder="10 digit mobile"
                icon={Phone}
                error={errors.phone?.message}
                {...register('phone')}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="laxuman@mediflow.ai"
                icon={Mail}
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Blood Group *
                </label>
                <select
                  {...register('bloodGroup')}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Emergency Contact Phone"
                placeholder="10 digit emergency contact"
                icon={ShieldAlert}
                error={errors.emergencyContact?.message}
                {...register('emergencyContact')}
              />
            </div>
          </div>

          {/* Section 2: Department & Doctor Selection */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Stethoscope className="w-4 h-4" /> 2. Clinical Department & Doctor
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Select Department *
                </label>
                <select
                  {...register('department')}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d.id} value={d.name}>{d.name} (Avg Wait: {d.avgWait}m)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Select Doctor *
                </label>
                <select
                  {...register('doctor')}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {filteredDoctors.map(doc => (
                    <option key={doc.id} value={doc.name}>{doc.name} ({doc.roomNo})</option>
                  ))}
                </select>
              </div>

              <Input
                label="Appointment Date"
                type="date"
                icon={Calendar}
                error={errors.appointmentDate?.message}
                {...register('appointmentDate')}
              />

              <Input
                label="Preferred Time Slot"
                type="time"
                icon={Clock}
                error={errors.appointmentTime?.message}
                {...register('appointmentTime')}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Primary Symptoms & Medical Complaint *
              </label>
              <textarea
                rows={2}
                placeholder="Describe fever duration, pain level, or pre-existing conditions..."
                {...register('symptoms')}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.symptoms && <p className="text-xs text-red-500">{errors.symptoms.message}</p>}
            </div>

            <Input
              label="Full Residential Address (Used for Travel Delay Engine)"
              placeholder="House/Street, Landmark, City"
              icon={MapPin}
              error={errors.address?.message}
              {...register('address')}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" icon={Ticket} disabled={isSubmitting}>
            {isSubmitting ? "Generating AI Token..." : "Register & Generate Smart OPD Token"}
          </Button>

        </form>
      </div>

      {/* INSTANT TOKEN GENERATED MODAL CARD */}
      {tokenResult && (
        <Modal isOpen={!!tokenResult} onClose={() => setTokenResult(null)} title="🎉 Token Successfully Generated!">
          <div className="space-y-6 text-center" id="printable-token">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
              <CheckCircle2 className="w-5 h-5" /> Token Assigned & Synced to AI Queue Radar
            </div>

            <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl space-y-3 shadow-xl">
              <span className="text-xs uppercase font-bold text-blue-200">YOUR OPD TOKEN NUMBER</span>
              <p className="text-5xl font-black tracking-tight">{tokenResult.tokenNumber}</p>
              <p className="text-xs text-blue-100">{tokenResult.doctor} • {tokenResult.department}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-left">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="text-slate-400 block font-semibold">Patients Ahead</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">{tokenResult.patientsAhead} Patients</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="text-slate-400 block font-semibold">Est. Waiting Time</span>
                <span className="text-base font-bold text-blue-600 dark:text-blue-400">{tokenResult.estimatedWaitMinutes} Mins</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button className="w-full" icon={Ticket} onClick={() => navigate('/dashboard')}>
                Go to Patient Dashboard
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
