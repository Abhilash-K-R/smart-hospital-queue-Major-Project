import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, Clock, ShieldCheck, ArrowRight, BrainCircuit, Users, Ticket, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { DEMO_PATIENT } from '../utils/constants';

// Provides the landing introduction, primary actions, and token lookup.
export const Hero = () => {
  const navigate = useNavigate();
  const [searchToken, setSearchToken] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    navigate('/queue-status');
  };

  return (
    <section className="relative pt-12 pb-24 overflow-hidden">
      {/* Background Glowing Blobs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-10 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Heading & Call To Action */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Project Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-600 dark:text-blue-400"
            >
              <BrainCircuit className="w-4 h-4 text-cyan-500 animate-pulse" />
              <span>Smart Hospital Queue AI</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]"
            >
              AI Smart Hospital <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400">
                Queue & Arrival Optimizer
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mx-auto lg:mx-0"
            >
              Never wait endlessly in hospital waiting rooms again. Our Machine Learning algorithms predict OPD consultation delays and send optimal <strong className="text-blue-600 dark:text-blue-400">Leave Now</strong> departure notifications straight to your phone.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <Button size="lg" icon={Ticket} onClick={() => navigate('/appointment')}>
                Book OPD Appointment
              </Button>

              <Button size="lg" variant="outline" icon={Clock} onClick={() => navigate('/arrival-prediction')}>
                Test "Leave Now" AI
              </Button>
            </motion.div>

            {/* Quick Live Token Search Bar */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onSubmit={handleSearch}
              className="p-2 glass-panel rounded-2xl max-w-md mx-auto lg:mx-0 flex items-center gap-2 border border-slate-200 dark:border-slate-800 shadow-xl"
            >
              <input
                type="text"
                placeholder="Enter Token (e.g. GEN-018)..."
                value={searchToken}
                onChange={(e) => setSearchToken(e.target.value)}
                className="w-full px-3 py-2 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
              <Button type="submit" size="sm" icon={ArrowRight}>
                Track
              </Button>
            </motion.form>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-semibold pt-4">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 96.4% Random Forest Accuracy</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-cyan-500" /> Real-time Traffic Integration</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Zero Waiting Room Crowding</span>
            </div>
          </div>

          {/* Right Column: Interactive AI Live Radar Widget */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-5"
          >
            <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 relative border border-blue-500/30 shadow-2xl ai-glow-blue">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md">
                    <Activity className="w-5 h-5 animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">AI Live Queue Simulation</h3>
                    <p className="text-[10px] text-emerald-500 font-semibold">● System Online & Optimizing</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
                  General Medicine
                </span>
              </div>

              {/* Token Display */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl text-center border border-blue-200/50 dark:border-blue-900/50">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Your Assigned Token</span>
                  <p className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight mt-0.5">{DEMO_PATIENT.tokenNumber}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Laxuman G</p>
                </div>

                <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl text-center border border-emerald-200/50 dark:border-emerald-900/50">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Doctor Currently Serving</span>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-0.5">GEN-0{DEMO_PATIENT.currentToken}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Dr. Rajeswari N.</p>
                </div>
              </div>

              {/* AI Prediction Summary */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5"><BrainCircuit className="w-4 h-4 text-cyan-400" /> Recommended Departure</span>
                  <span className="text-cyan-400 font-bold">Leave in 10 mins</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full w-[65%]" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Travel: 12 mins</span>
                  <span>Est. Wait: 24 mins</span>
                  <span>Queue Position: #6</span>
                </div>
              </div>

              {/* Quick Action Button */}
              <Button className="w-full" icon={ArrowRight} onClick={() => navigate('/dashboard')}>
                View Full Patient Dashboard
              </Button>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
