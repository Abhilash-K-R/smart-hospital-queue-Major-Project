import React, { useState } from 'react';
import { AlertTriangle, Activity, Thermometer, Droplets, Heart } from 'lucide-react';

const Emergency = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Emergency patient prioritized in queue!');
    }, 1000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto h-full overflow-y-auto">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-6 flex items-start gap-3">
        <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
        <div>
          <h2 className="text-red-800 font-bold text-lg">Critical Patient Intake</h2>
          <p className="text-red-700 text-sm mt-1">
            Submit this form to immediately bypass the standard queue and alert the standby emergency response team.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">Patient Details</h3>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input type="text" required placeholder="John Doe" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                <input type="number" required placeholder="45" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Chief Complaint / Condition</label>
            <textarea required rows={3} placeholder="E.g., Severe chest pain, shortness of breath..." className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"></textarea>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Vitals (if available)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Blood Pressure
                </label>
                <input type="text" placeholder="120/80" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <Heart className="h-3 w-3" /> Heart Rate (BPM)
                </label>
                <input type="number" placeholder="85" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <Droplets className="h-3 w-3" /> SpO2 (%)
                </label>
                <input type="number" placeholder="98" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                  <Thermometer className="h-3 w-3" /> Temp (°C)
                </label>
                <input type="number" step="0.1" placeholder="37.2" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button type="button" className="px-6 py-2.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-200 transition-colors flex items-center gap-2"
          >
            {isSubmitting ? 'Submitting...' : 'Declare Emergency'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Emergency;
