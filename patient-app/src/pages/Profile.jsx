import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';
import { TopBar } from '../components/TopBar';
import { PatientCard } from '../components/PatientCard';
import { Button } from '../components/Button';
import { QRCodeSVG } from 'qrcode.react';
import { User, FileText, Download, Edit3, Save, ShieldCheck, HeartPulse, History, MapPin, Phone, Mail } from 'lucide-react';
import { downloadAppointmentPDF } from '../utils/helpers';

// Displays editable patient details and digital pass export controls.
export const Profile = () => {
  const { user, setUser } = useAuth();
  const { queueState } = useQueue();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "Laxuman G",
    phone: user?.phone || "+91 98765 43210",
    email: user?.email || "laxuman.patient@mediflow.ai",
    address: user?.address || "MG Road, Tech Hub, Bengaluru"
  });

  const handleSave = () => {
    setUser({ ...user, ...formData });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8" id="profile-pdf-container">
      <TopBar title="Patient Medical Profile" subtitle="Personal record, active tokens, and historical OPD consultations" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols): Main Profile Card & Medical History */}
        <div className="lg:col-span-8 space-y-8">
          
          <PatientCard patient={user} />

          {/* Edit Profile Form / Details Card */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" /> Patient Contact & Demographics
              </h3>
              <Button
                size="sm"
                variant={isEditing ? 'primary' : 'outline'}
                icon={isEditing ? Save : Edit3}
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              >
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase">Full Name</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase">Phone Number</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.phone}</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase">Email Address</span>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.email}</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase">Residential Address</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Medical History Placeholder */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-500" /> Historical OPD Consultations
            </h3>

            <div className="space-y-3">
              {[
                { date: "Jul 14, 2026", doctor: "Dr. Vikram K. Rao", dept: "Cardiology", status: "Completed", prescription: "Rx-9021 (ECG Normal)" },
                { date: "Jun 02, 2026", doctor: "Dr. Rajeswari N.", dept: "General Medicine", status: "Completed", prescription: "Rx-8812 (Viral Fever)" }
              ].map((h, i) => (
                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-between gap-4 border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm block">{h.doctor} ({h.dept})</span>
                    <span className="text-slate-500">{h.date} • {h.prescription}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-md font-bold">
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (4 cols): QR Code Pass Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-3xl p-6 text-center space-y-6 border border-blue-500/30">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Patient Digital Hospital Pass
            </h4>

            <div className="flex justify-center p-4 bg-white rounded-2xl w-fit mx-auto shadow-md">
              <QRCodeSVG
                value={`PATIENT_ID:${user?.id || 'P-10928'}|NAME:${user?.name || 'Laxuman G'}|TOKEN:${queueState.tokenNumber}`}
                size={140}
              />
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">Scan at OPD Entrance Kiosk</p>
              <p>Syncs automatically with hospital queue server.</p>
            </div>

            <Button
              className="w-full"
              icon={Download}
              onClick={() => downloadAppointmentPDF('profile-pdf-container', `MediFlow_Patient_Record_${user?.name}.pdf`)}
            >
              Export Medical Summary (PDF)
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
