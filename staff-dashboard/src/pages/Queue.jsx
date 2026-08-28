import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Check, UserMinus } from 'lucide-react';

const initialQueue = [
  { id: '1042', name: 'Robert Chen', age: 45, triage: 'Critical', waitTime: '5m', doctor: 'Dr. Smith', status: 'Waiting' },
  { id: '1043', name: 'Sarah Jenkins', age: 28, triage: 'Urgent', waitTime: '15m', doctor: 'Unassigned', status: 'Waiting' },
  { id: '1044', name: 'Michael Brown', age: 62, triage: 'Standard', waitTime: '45m', doctor: 'Dr. Adams', status: 'In Progress' },
  { id: '1045', name: 'Emma Davis', age: 8, triage: 'Urgent', waitTime: '10m', doctor: 'Dr. Smith', status: 'Waiting' },
  { id: '1046', name: 'James Wilson', age: 35, triage: 'Standard', waitTime: '55m', doctor: 'Unassigned', status: 'Waiting' },
];

const getTriageColor = (level) => {
  switch (level) {
    case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
    case 'Urgent': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'Standard': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const Queue = () => {
  const [queue, setQueue] = useState(initialQueue);

  const markAsSeen = (id) => {
    setQueue(queue.filter(patient => patient.id !== id));
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Queue Management</h1>
          <p className="text-slate-500 mt-1">Manage patient flow and assignments</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search patient..." 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient ID</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Info</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Triage Level</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Wait Time</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Doctor</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-slate-900">#{patient.id}</td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-medium text-slate-900">{patient.name}</div>
                    <div className="text-xs text-slate-500">{patient.age} yrs</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getTriageColor(patient.triage)}`}>
                      {patient.triage}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-slate-900">{patient.waitTime}</div>
                  </td>
                  <td className="py-4 px-6">
                    {patient.doctor !== 'Unassigned' ? (
                      <span className="text-sm font-medium text-slate-700">{patient.doctor}</span>
                    ) : (
                      <span className="text-sm text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => markAsSeen(patient.id)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        title="Mark as Seen"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => markAsSeen(patient.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove from Queue"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {queue.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-slate-500 py-12">
            No patients currently in the queue.
          </div>
        )}
      </div>
    </div>
  );
};

export default Queue;
