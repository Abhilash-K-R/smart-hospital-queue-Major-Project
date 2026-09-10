import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appointmentSchema } from '../utils/validators';
import { TopBar } from '../components/TopBar';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { DEPARTMENTS, DOCTORS, DEMO_PATIENT } from '../utils/constants';
import { downloadAppointmentPDF, triggerConfetti } from '../utils/helpers';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, Clock, Stethoscope, Ticket, Download, Printer, CheckCircle2, User, FileText } from 'lucide-react';

// Handles appointment validation, token confirmation, and export actions.
export const Appointment = () => {
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      department: "General Medicine",
      doctor: "Dr. Rajeswari N.",
      date: new Date().toISOString().split('T')[0],
      timeSlot: "10:30 AM",
      symptoms: "Routine seasonal health evaluation & mild fever"
    }
  });

  const selectedDepartment = watch('department');
  const availableDoctors = DOCTORS.filter(d => d.department === selectedDepartment);

  const onSubmit = (data) => {
    triggerConfetti();
    const token = `GEN-0${Math.floor(Math.random() * 20) + 15}`;
    setConfirmedAppointment({
      ...data,
      tokenNumber: token,
      patientName: DEMO_PATIENT.name,
      patientId: DEMO_PATIENT.id,
      roomNo: "O.P.D Block B - Room 204",
      patientsAhead: 6,
      estimatedWait: "24 Mins"
    });
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
                    {['09:00 AM', '10:00 AM', '10:30 AM', '11:15 AM', '12:00 PM', '04:30 PM', '06:00 PM'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Brief Medical Reason / Symptoms
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your health complaint..."
                  {...register('symptoms')}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button type="submit" size="lg" className="w-full" icon={Ticket}>
                Confirm Appointment & Issue Token
              </Button>

            </form>
          </div>
        </div>

        {/* Doctor Summary & Info (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Selected Specialist Profile</h4>
            <div className="flex items-center gap-3">
              <img
                src={availableDoctors[0]?.avatar || DOCTORS[0].avatar}
                alt="Doctor"
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-500/20"
              />
              <div>
                <h5 className="font-bold text-slate-900 dark:text-white text-sm">{availableDoctors[0]?.name || DOCTORS[0].name}</h5>
                <p className="text-xs text-slate-500">{availableDoctors[0]?.qualification || DOCTORS[0].qualification}</p>
                <span className="text-[10px] text-emerald-500 font-semibold">{availableDoctors[0]?.availability || DOCTORS[0].availability}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CONFIRMED APPOINTMENT SLIP MODAL */}
      {confirmedAppointment && (
        <Modal isOpen={!!confirmedAppointment} onClose={() => setConfirmedAppointment(null)} title="OPD Appointment Pass Generated">
          <div className="space-y-6 text-center" id="appointment-slip-card">
            
            <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center text-xs text-blue-400 border-b border-slate-800 pb-3">
                <span className="font-bold">APOLLO MEDIFLOW HOSPITALS</span>
                <span>MediFlow Digital Pass</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase font-bold text-slate-400">ASSIGNED TOKEN</span>
                <p className="text-5xl font-black text-blue-400 tracking-tight">{confirmedAppointment.tokenNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-left bg-slate-800/60 p-3 rounded-2xl">
                <div>
                  <span className="text-slate-400 block">Patient</span>
                  <span className="font-bold">{confirmedAppointment.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Doctor</span>
                  <span className="font-bold">{confirmedAppointment.doctor}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Slot</span>
                  <span className="font-bold">{confirmedAppointment.timeSlot} ({confirmedAppointment.date})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Room</span>
                  <span className="font-bold">{confirmedAppointment.roomNo}</span>
                </div>
              </div>

              {/* QR Code Pass */}
              <div className="flex justify-center p-3 bg-white rounded-2xl w-fit mx-auto shadow-md">
                <QRCodeSVG
                  value={`MEDIFLOW-TOKEN:${confirmedAppointment.tokenNumber}|PATIENT:${confirmedAppointment.patientId}`}
                  size={100}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                className="w-full"
                variant="outline"
                icon={Download}
                onClick={() => downloadAppointmentPDF('appointment-slip-card', `MediFlow_Token_${confirmedAppointment.tokenNumber}.pdf`)}
              >
                Download PDF Slip
              </Button>

              <Button
                className="w-full"
                icon={Printer}
                onClick={() => window.print()}
              >
                Print Token
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
