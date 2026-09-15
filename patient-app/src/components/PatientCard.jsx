import React from 'react';
import { User, Phone, Mail, Droplet, HeartPulse } from 'lucide-react';

// Displays the patient's identity and core profile information.
export const PatientCard = ({ patient }) => {
  const { name, age, gender, phone, email, bloodGroup, avatar, id } = patient || {};

  return (
    <div className="glass-card rounded-3xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <img
          src={avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"}
          alt={name}
          className="w-16 h-16 rounded-2xl object-cover ring-4 ring-blue-500/20 shadow-lg"
        />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{name}</h3>
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-600 rounded-md border border-emerald-500/30">
              Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ID: {id} • {age} Yrs ({gender})</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Phone className="w-3.5 h-3.5 text-blue-500" />
          <span className="truncate">{phone}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Mail className="w-3.5 h-3.5 text-cyan-500" />
          <span className="truncate">{email}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Droplet className="w-3.5 h-3.5 text-red-500" />
          <span>Blood Group: <strong className="text-red-500">{bloodGroup}</strong></span>
        </div>

        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <HeartPulse className="w-3.5 h-3.5 text-emerald-500" />
          <span>Health Status: <strong>Normal</strong></span>
        </div>
      </div>
    </div>
  );
};
