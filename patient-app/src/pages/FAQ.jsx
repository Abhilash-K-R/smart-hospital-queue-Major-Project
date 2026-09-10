import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { ChevronDown, HelpCircle, Search, BrainCircuit, Navigation, Siren, Ticket, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Provides searchable frequently asked questions for patients.
export const FAQ = () => {
  const [openIdx, setOpenIdx] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      q: "How does AI predict hospital waiting time?",
      a: "Our Random Forest Regressor analyzes doctor consultation speeds, historical patient load for that day of the week, symptom complexity, and historical patient turnaround time to estimate exact consultation duration per token.",
      icon: BrainCircuit
    },
    {
      q: "How is the digital token generated?",
      a: "When you book an appointment or register, your token is assigned sequentially (e.g. GEN-018) and synced directly with the hospital's central server and live OPD door display screens.",
      icon: Ticket
    },
    {
      q: "How does the 'Leave Now' feature work?",
      a: "The Leave Now departure engine calculates: (OPD Wait Time - Travel Time - Buffer Time). When your travel time plus 5 mins buffer equals the remaining waiting time in queue, the system triggers a push notification to depart.",
      icon: Navigation
    },
    {
      q: "What happens if an emergency trauma patient comes?",
      a: "When emergency cases are admitted, hospital staff trigger an emergency override. The AI automatically adjusts downstream patient arrival times (+4-5 mins per case) and notifies patients via SMS/App so they don't leave prematurely.",
      icon: Siren
    },
    {
      q: "How is the queue updated in real-time?",
      a: "The queue updates every 30 seconds automatically via web sockets/polling. As doctors mark consultations complete, tokens advance in real-time on your dashboard.",
      icon: RefreshCw
    }
  ];

  const filteredFaqs = faqs.filter(f => f.q.toLowerCase().includes(searchTerm.toLowerCase()) || f.a.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <TopBar title="Frequently Asked Questions" subtitle="Understanding the AI Smart Queue & Arrival Optimization Engine" />

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search question (e.g. AI prediction, Emergency, Leave Now)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {/* Accordion */}
      <div className="space-y-4">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          const Icon = faq.icon;

          return (
            <div key={idx} className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all">
              <button
                onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                className="w-full p-5 flex items-center justify-between text-left gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{faq.q}</h3>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-5 pb-5 pt-0 border-t border-slate-100 dark:border-slate-800/60"
                  >
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-11">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
