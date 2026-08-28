import React from 'react';
import { Users, UserPlus, Clock, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { time: '08:00', patients: 12 },
  { time: '10:00', patients: 25 },
  { time: '12:00', patients: 45 },
  { time: '14:00', patients: 30 },
  { time: '16:00', patients: 50 },
  { time: '18:00', patients: 35 },
  { time: '20:00', patients: 20 },
];

const activities = [
  { id: 1, text: 'Patient John Doe assigned to Dr. Smith (Cardiology)', time: '10 min ago', type: 'info', icon: UserPlus },
  { id: 2, text: 'New Emergency: 45y male, severe chest pain', time: '15 min ago', type: 'alert', icon: AlertCircle },
  { id: 3, text: 'Dr. Adams cleared the waiting room', time: '1 hour ago', type: 'success', icon: CheckCircle2 },
  { id: 4, text: 'Patient Mary Johnson discharged', time: '2 hours ago', type: 'success', icon: CheckCircle2 },
];

const StatCard = ({ title, value, icon: Icon, trend }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-slate-500 font-medium">{title}</h3>
      <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-bold text-slate-900">{value}</span>
      <span className={`text-sm font-medium ${trend.startsWith('+') ? 'text-red-500' : 'text-emerald-500'}`}>
        {trend}
      </span>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <div className="text-sm text-slate-500">Last updated: Just now</div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Patients Today" value="142" icon={Users} trend="+12%" />
        <StatCard title="Currently Waiting" value="28" icon={Clock} trend="-4%" />
        <StatCard title="Average Wait Time" value="18m" icon={Activity} trend="-2m" />
        <StatCard title="Active Doctors" value="12" icon={UserPlus} trend="0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Patient Influx Today</h2>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500">
              <option>Today</option>
              <option>Yesterday</option>
              <option>This Week</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          <h2 className="text-lg font-bold text-slate-800 mb-6">Recent Activity</h2>
          <div className="flex-1 space-y-6">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex gap-4 relative">
                {/* Timeline connector */}
                {index !== activities.length - 1 && (
                  <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-slate-100"></div>
                )}
                
                <div className={`relative z-10 flex items-center justify-center h-10 w-10 rounded-full flex-shrink-0 ${
                  activity.type === 'alert' ? 'bg-red-50 text-red-600' :
                  activity.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  <activity.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 leading-snug">{activity.text}</p>
                  <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
