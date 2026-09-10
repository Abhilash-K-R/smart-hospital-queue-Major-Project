import React from 'react';
import { TopBar } from '../components/TopBar';
import { PROJECT_INFO } from '../utils/constants';
import { BrainCircuit, Cpu, Database, Cloud, ShieldCheck, Users, Code, Award, CheckCircle2 } from 'lucide-react';

// Presents project metadata and team information from the shared constants.
export const About = () => {
  return (
    <div className="space-y-10">
      <TopBar title="Project Specifications" subtitle="System Architecture, Machine Learning Models, and Engineering Documentation" />

      {/* Project Banner Header */}
      <div className="glass-card rounded-3xl p-8 sm:p-12 border-2 border-blue-500/30 space-y-6 relative overflow-hidden ai-glow-blue">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{PROJECT_INFO.shortTitle}</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{PROJECT_INFO.title}</h1>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
          Designed to solve hospital waiting room congestion through predictive AI modeling. By analyzing historical consultation times, doctor efficiency rates, patient symptom severity, and real-time Google Maps traffic telemetry, the system calculates exact departure times for patients to arrive just 5 minutes before their turn.
        </p>
      </div>

      {/* Technical Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-3xl p-6 space-y-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-2xl w-fit">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Random Forest Regressor</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Predicts OPD wait times using multi-variable decision trees trained on over 45,000 historical OPD consultation records with a 96.4% accuracy rate.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 space-y-3">
          <div className="p-3 bg-cyan-50 dark:bg-cyan-950 text-cyan-500 rounded-2xl w-fit">
            <Cloud className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Smart Departure Engine</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Integrates real-time traffic delay telemetry with queue movement velocity to issue automated "Leave Now" push notifications to patient smartphones.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 space-y-3">
          <div className="p-3 bg-rose-50 dark:bg-rose-950 text-rose-500 rounded-2xl w-fit">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Emergency Priority Handling</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Dynamic priority queue insertion logic that recalculates downstream waiting times instantly when critical trauma patients are admitted into OPD.
          </p>
        </div>
      </div>

      {/* Team Members & Guide Section */}
      <div className="glass-card rounded-3xl p-8 space-y-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" /> Project Engineering Team & Guide
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROJECT_INFO.team.map((member) => (
            <div key={member.usn} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">{member.usn}</span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">{member.name}</h4>
              <p className="text-xs text-slate-500">{member.role}</p>
            </div>
          ))}
        </div>

        <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/50 rounded-2xl flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 block">Project Guide & Supervisor</span>
            <strong className="text-slate-900 dark:text-white text-sm">{PROJECT_INFO.guide}</strong>
          </div>
          <span className="px-3 py-1 bg-blue-600 text-white rounded-xl font-bold">{PROJECT_INFO.department}</span>
        </div>
      </div>

    </div>
  );
};
