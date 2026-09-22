import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';
import { TopBar } from '../components/TopBar';
import { ProgressCard } from '../components/ProgressCard';
import { QueueCard } from '../components/QueueCard';
import { EmergencyAlert } from '../components/EmergencyAlert';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { PROJECT_INFO } from '../utils/constants';
import { Clock, Navigation, Calendar, FileText, Siren, ShieldCheck, BrainCircuit, Users, CheckCircle2, ArrowRight, Ticket, Sparkles } from 'lucide-react';

// Combines patient identity, queue progress, AI actions, and quick navigation.
export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { queueState } = useQueue();

  const hasActiveToken = Boolean(queueState.hasActiveToken || queueState.tokenNumber || user?.tokenNumber);

  return (
    <div className="space-y-8">
      
      {/* Top Header */}
      <TopBar 
        title={`Welcome back, ${user?.name || 'Patient'}!`} 
        subtitle={hasActiveToken ? "Your active OPD consultation queue status and AI departure tracker" : "Track live hospital OPD queues and schedule specialist appointments"} 
      />

      {/* Emergency Alert Banner (Shown dynamically when staff declares an emergency) */}
      {queueState.emergencyCount > 0 && (
        <EmergencyAlert count={queueState.emergencyCount} />
      )}

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols): Queue Card + Live Progress Radar OR Clean Empty State */}
        <div className="lg:col-span-8 space-y-8">
          
          {hasActiveToken ? (
            <>
              {/* Active Token Card */}
              <QueueCard queueData={queueState} />

              {/* Circular & Linear Queue Progression Radar */}
              <ProgressCard
                tokenNumber={queueState.tokenNumber}
                currentToken={queueState.currentToken}
                numericToken={queueState.numericToken}
                patientsAhead={queueState.patientsAhead}
                estimatedWaitMinutes={queueState.estimatedWaitMinutes}
                emergencyCount={queueState.emergencyCount}
              />
            </>
          ) : (
            /* Clean Empty State Card When Patient Has No Active Token */
            <div className="glass-card rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-5 relative overflow-hidden">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10">
                <Ticket className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">No Active OPD Token</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  You do not have any appointments scheduled for today. Book an appointment with our specialist doctors to receive your live queue pass and real-time AI departure alerts.
                </p>
              </div>
              <div className="pt-2 flex justify-center">
                <Button onClick={() => navigate('/appointment')} icon={Calendar} size="md">
                  Book OPD Appointment
                </Button>
              </div>
            </div>
          )}

          {/* Quick Actions Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/arrival-prediction')}
              className="p-4 glass-card rounded-2xl text-center space-y-2 hover:border-cyan-500/50 transition-all group"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Navigation className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">My Appointment</span>
            </button>

            <button
              onClick={() => navigate('/queue-status')}
              className="p-4 glass-card rounded-2xl text-center space-y-2 hover:border-blue-500/50 transition-all group"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Live Radar</span>
            </button>

            <button
              onClick={() => navigate('/appointment')}
              className="p-4 glass-card rounded-2xl text-center space-y-2 hover:border-emerald-500/50 transition-all group"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Book Slot</span>
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="p-4 glass-card rounded-2xl text-center space-y-2 hover:border-purple-500/50 transition-all group"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Token Slip</span>
            </button>
          </div>

        </div>

        {/* Right Column (4 cols): AI Stats & Hospital Details */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Appointment & Travel Status Widget */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white space-y-4 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold bg-white/20 rounded-md">Smart Arrival Engine</span>
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>

            {hasActiveToken ? (
              <>
                <div>
                  <p className="text-xs font-semibold text-cyan-100">RECOMMENDED DEPARTURE</p>
                  <h3 className="text-3xl font-black mt-1">Leave in {queueState.leaveAfterMinutes} Mins</h3>
                </div>

                <div className="pt-2 border-t border-white/20 text-xs space-y-1.5 text-cyan-50">
                  <div className="flex justify-between">
                    <span>Traffic Travel Time:</span>
                    <span className="font-bold">{queueState.trafficDurationMinutes} Mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span>OPD Wait Time:</span>
                    <span className="font-bold">{queueState.estimatedWaitMinutes} Mins</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-white text-blue-700 hover:bg-slate-100"
                  size="sm"
                  icon={ArrowRight}
                  onClick={() => navigate('/arrival-prediction')}
                >
                  View Route & GPS Map
                </Button>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold text-cyan-100">COMMUTE OPTIMIZER</p>
                  <h3 className="text-xl font-bold mt-1">Ready to Plan Commute?</h3>
                  <p className="text-xs text-cyan-100/90 mt-1">
                    Book a slot to calculate real-time departure time and skip the waiting lounge.
                  </p>
                </div>

                <Button
                  className="w-full bg-white text-blue-700 hover:bg-slate-100"
                  size="sm"
                  icon={Calendar}
                  onClick={() => navigate('/appointment')}
                >
                  Book Appointment Slot
                </Button>
              </>
            )}
          </div>

          {/* AI Accuracy & Project Metrics */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">ML Queue Predictor</h4>
                <p className="text-[10px] text-slate-500">{PROJECT_INFO.algorithm}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs pt-2">
              <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="text-slate-500 font-medium">Model Precision</span>
                <span className="font-bold text-emerald-500">{PROJECT_INFO.accuracy}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="text-slate-500 font-medium">Historical Dataset</span>
                <span className="font-bold text-slate-900 dark:text-white">{PROJECT_INFO.datasetSize}</span>
              </div>
            </div>
          </div>

          {/* Hospital Hours */}
          <div className="glass-card rounded-3xl p-6 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">Hospital OPD Working Hours</h4>
            <div className="space-y-2 text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Morning Session:</span>
                <strong className="text-slate-900 dark:text-white">08:00 AM - 01:30 PM</strong>
              </div>
              <div className="flex justify-between">
                <span>Evening Session:</span>
                <strong className="text-slate-900 dark:text-white">04:00 PM - 08:00 PM</strong>
              </div>
              <div className="flex justify-between">
                <span>Emergency Trauma:</span>
                <strong className="text-red-500 font-bold">24 Hours / 7 Days</strong>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
