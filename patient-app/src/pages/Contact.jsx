import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Phone, Mail, MapPin, Send, Siren, Clock, CheckCircle2 } from 'lucide-react';
import { triggerConfetti } from '../utils/helpers';

// Renders contact details and confirms feedback submission in the UI.
export const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    triggerConfetti();
    setSubmitted(true);
  };

  return (
    <div className="space-y-8">
      <TopBar title="Contact Hospital & Emergency Desk" subtitle="24/7 Helpline, OPD location map, and patient feedback form" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Contact Information Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-3xl space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-200">
              <Siren className="w-5 h-5 animate-pulse" /> 24/7 Trauma Emergency Line
            </div>
            <p className="text-3xl font-black">+91 1800 900 9999</p>
            <p className="text-xs text-red-100">Direct admission hotline for critical ambulance arrivals.</p>
          </div>

          <div className="glass-card rounded-3xl p-6 space-y-4 text-xs">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Hospital Address</h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span className="text-slate-600 dark:text-slate-300">
                  Shridevi Hospital & Research Hospital, Sira Road, Tumakuru - 572106
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">+91 0816 2212345 (OPD Desk)</span>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-cyan-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">opd.helpdesk@shridevimediflow.ai</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback & Inquiry Form (7 cols) */}
        <div className="lg:col-span-7">
          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
              Send Patient Inquiry or Feedback
            </h3>

            {submitted ? (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-center space-y-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8 mx-auto" />
                <h4 className="font-bold text-base">Thank you for your feedback!</h4>
                <p className="text-xs">Your inquiry has been submitted to the Hospital Administration.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Your Name" placeholder="Laxuman G" required />
                  <Input label="Phone Number" placeholder="+91 98765 43210" required />
                </div>

                <Input label="Email Address" type="email" placeholder="laxuman@mediflow.ai" required />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Message / Feedback *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter your query regarding OPD slots, doctor availability, or AI departure time..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full" icon={Send}>
                  Submit Inquiry
                </Button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
