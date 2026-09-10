import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { FeatureCard } from '../components/FeatureCard';
import { DoctorCard } from '../components/DoctorCard';
import { EmergencyAlert } from '../components/EmergencyAlert';
import { Button } from '../components/Button';
import { HOSPITAL_STATS, DEPARTMENTS, DOCTORS, PROJECT_INFO } from '../utils/constants';
import { BrainCircuit, Clock, Navigation, ShieldAlert, Sparkles, Users, Stethoscope, CheckCircle2, ArrowRight, HeartPulse, Cpu, Database, MapPin } from 'lucide-react';
import { useQueue } from '../context/QueueContext';

// Renders the public landing page and routes patients to core workflows.
export const Home = () => {
  const navigate = useNavigate();
  const { triggerEmergency } = useQueue();
  const [selectedDept, setSelectedDept] = useState('All');

  const filteredDoctors = selectedDept === 'All'
    ? DOCTORS
    : DOCTORS.filter(d => d.department === selectedDept);

  return (
    <div className="space-y-20 pb-16">
      
      {/* 1. HERO SECTION */}
      <Hero />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">

        {/* 2. EMERGENCY ALERT BANNER */}
        <EmergencyAlert count={1} onTriggerSimulation={triggerEmergency} />

        {/* 3. HOSPITAL LIVE METRICS & STATISTICS */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Real-time Performance</span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Hospital Operational Metrics</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOSPITAL_STATS.map((stat, i) => {
              const icons = { Users, Clock, BrainCircuit, ShieldAlert };
              const Icon = icons[stat.icon] || Users;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="glass-card rounded-3xl p-6 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.label}</span>
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white mt-3 tracking-tight">{stat.value}</p>
                  <p className="text-[11px] font-semibold text-emerald-500 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {stat.change}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* 4. WHY CHOOSE OUR AI HOSPITAL */}
        <section className="space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-cyan-500 uppercase tracking-widest">Next-Gen Patient Experience</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              Why Apollo MediFlow AI Revolutionizes Healthcare Queues
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Combining Machine Learning queue modeling with real-time GPS traffic analysis to eliminate crowded waiting rooms completely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={BrainCircuit}
              title="Random Forest Delay Predictor"
              description="Predicts OPD consultation time per patient with 96.4% accuracy based on doctor consultation speed and patient severity."
              badge="ML Engine"
              color="from-blue-500 to-indigo-600"
            />
            <FeatureCard
              icon={Navigation}
              title="Smart Departure Engine"
              description="Notifies patients exactly when to leave home, factoring in real-time Google Maps traffic data to arrive 5 mins before consultation."
              badge="Leave Now"
              color="from-cyan-500 to-blue-500"
            />
            <FeatureCard
              icon={ShieldAlert}
              title="Dynamic Emergency Handling"
              description="When trauma emergency cases are admitted, non-critical queue departure times automatically recalculate to prevent congestion."
              badge="Emergency AI"
              color="from-rose-500 to-red-600"
            />
          </div>
        </section>

        {/* 5. HOW AI WORKS FLOWCHART */}
        <section className="glass-panel rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">System Architecture</span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">How The Patient Arrival Optimization Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              { step: "01", title: "Book Appointment", desc: "Select doctor & get instant digital token", icon: Stethoscope },
              { step: "02", title: "ML Wait Calculation", desc: "Algorithm computes precise OPD consultation rate", icon: Cpu },
              { step: "03", title: "Smart Notification", desc: "Get 'Leave Now' alert on phone when traffic matches wait", icon: Navigation },
              { step: "04", title: "Zero Wait Arrival", desc: "Arrive at hospital lounge 5 mins before your call", icon: CheckCircle2 }
            ].map((st, idx) => {
              const Icon = st.icon;
              return (
                <div key={st.step} className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 relative space-y-3 text-center md:text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{st.step}</span>
                    <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{st.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. DOCTORS & DEPARTMENTS GRID */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Our Specialists</span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">Available OPD Doctors Today</h2>
            </div>

            {/* Department Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {['All', 'General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics'].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedDept === dept
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                onBook={() => navigate('/appointment')}
              />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};
