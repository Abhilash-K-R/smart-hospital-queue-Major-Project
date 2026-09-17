import React from 'react';
import { Star, MapPin, Clock, Calendar } from 'lucide-react';
import { Button } from './Button';

// Presents doctor details and delegates booking with the selected doctor.
export const DoctorCard = ({ doctor, onBook }) => {
  const { name, qualification, department, experience, rating, reviews, roomNo, availability, avatar, patientsInQueue, nextAvailableSlot } = doctor;

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all">
      <div className="flex items-start gap-4">
        <img
          src={avatar}
          alt={name}
          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-md shrink-0"
        />
        <div className="flex-1 min-w-0">
          <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded-md">
            {department}
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate">{name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{qualification}</p>

          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="flex items-center gap-1 font-bold text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-500" /> {rating}
            </span>
            <span className="text-slate-400">({reviews} reviews)</span>
            <span className="text-slate-400">• {experience}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-rose-500" /> {roomNo}
        </div>
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
          <Clock className="w-3.5 h-3.5" /> Next: {nextAvailableSlot}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-500">
          <strong className="text-slate-900 dark:text-white font-bold">{patientsInQueue}</strong> in queue
        </span>
        <Button size="sm" icon={Calendar} onClick={() => onBook && onBook(doctor)}>
          Book Token
        </Button>
      </div>
    </div>
  );
};
