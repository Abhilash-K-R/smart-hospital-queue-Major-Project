import React from 'react';
import { Phone, Mail, Droplet, HeartPulse, ShieldCheck } from 'lucide-react';

// Displays the patient's identity, clinical verification badge, and permanent patient UID.
export const PatientCard = ({ patient }) => {
  const { name, age, gender, phone, email, bloodGroup, blood_group, avatar, patient_uid, id } = patient || {};
  const effectiveUid = patient_uid || (id ? String(100000 + Number(id)) : '100000');
  const bg = bloodGroup || blood_group;

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-5 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"}
            alt={name || "Patient"}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-blue-500/20 shadow-md shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{name || "Patient"}</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Patient
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                Patient UID: {effectiveUid}
              </span>
              {age ? <span>• {age} Yrs</span> : null}
              {gender ? <span>• {gender}</span> : null}
            </div>
          </div>
        </div>

        {bg && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 self-start sm:self-auto">
            <Droplet className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300">Blood Group: {bg}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="truncate">{phone || "Not provided"}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Mail className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          <span className="truncate">{email || "Not provided"}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Droplet className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span>Blood Group: <strong className="text-red-500">{bg || "Not specified"}</strong></span>
        </div>

        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <HeartPulse className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Status: <strong className="text-emerald-600">Active</strong></span>
        </div>
      </div>
    </div>
  );
};
