import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Clock, Activity, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const defaultChartData = [
  { time: '08:00', patients: 12 },
  { time: '10:00', patients: 25 },
  { time: '12:00', patients: 45 },
  { time: '14:00', patients: 30 },
  { time: '16:00', patients: 50 },
  { time: '18:00', patients: 35 },
  { time: '20:00', patients: 20 },
];

const StatCard = ({ title, value, icon: Icon, trend, subtitle }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-slate-500 font-medium">{title}</h3>
      <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-bold text-slate-900">{value}</span>
      {trend && (
        <span className={`text-sm font-medium ${trend.startsWith('+') ? 'text-blue-600' : 'text-emerald-500'}`}>
          {trend}
        </span>
      )}
    </div>
    {subtitle && <span className="text-xs text-slate-400 mt-1">{subtitle}</span>}
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_today: 35,
    currently_waiting: 5,
    avg_wait_minutes: 22.5,
    active_doctors: 2,
    emergency_count: 1,
    recent_activity: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('Just now');

  const fetchStats = async () => {
    try {
      const res = await api.get('/staff/stats');
      if (res.data) {
        setStats(res.data);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error('Error fetching staff stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 8000);
    return () => clearInterval(interval);
  }, []);

  const activities = stats.recent_activity.length > 0 ? stats.recent_activity : [
    { id: 1, text: 'Cardiology OPD Active (Dr. Priya Sharma)', time: '5m ago', type: 'info' },
    { id: 2, text: 'Smart Hospital Queue Optimization Service Running', time: '15m ago', type: 'success' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Staff Operations Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time OPD triage, patient flow, and ML wait time telemetry</p>
        </div>
        <div className="text-sm text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
          Last updated: <span className="font-semibold text-slate-700">{lastUpdated}</span>
        </div>
      </div>

      {/* Emergency Alert Banner if Emergency Count > 0 */}
      {stats.emergency_count > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-900 text-sm">
                Emergency Priority Mode Active ({stats.emergency_count} Critical Patient)
              </p>
              <p className="text-xs text-red-700">
                Queue positions dynamically bumped. Regular patient departure timings automatically delayed.
              </p>
            </div>
          </div>
          <a
            href="/queue"
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs transition-colors"
          >
            Review Queue
          </a>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Appointments Today" value={stats.total_today} icon={Users} trend="+Today" />
        <StatCard title="Currently Waiting" value={stats.currently_waiting} icon={Clock} trend="Live" subtitle="Active in OPD Queue" />
        <StatCard title="Average Wait Time" value={`${stats.avg_wait_minutes}m`} icon={Activity} trend="AI Predicted" subtitle="Random Forest ML" />
        <StatCard title="Active OPD Doctors" value={stats.active_doctors} icon={UserPlus} trend="Online" subtitle="Available Consultation" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">OPD Patient Influx Today</h2>
              <p className="text-xs text-slate-400">Hourly patient distribution across departments</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500">
              <option>Today</option>
              <option>Yesterday</option>
              <option>This Week</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={defaultChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="patients" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Recent OPD Activity</h2>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Live Feed</span>
          </div>
          <div className="flex-1 space-y-6">
            {activities.map((activity, index) => {
              const IconComp = activity.type === 'alert' ? AlertCircle : activity.type === 'success' ? CheckCircle2 : UserPlus;
              return (
                <div key={activity.id || index} className="flex gap-4 relative">
                  {index !== activities.length - 1 && (
                    <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-slate-100"></div>
                  )}
                  
                  <div className={`relative z-10 flex items-center justify-center h-10 w-10 rounded-full flex-shrink-0 ${
                    activity.type === 'alert' ? 'bg-red-50 text-red-600' :
                    activity.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 leading-snug">{activity.text}</p>
                    <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <a
            href="/queue"
            className="w-full text-center mt-6 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
          >
            Manage Live Queue
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
