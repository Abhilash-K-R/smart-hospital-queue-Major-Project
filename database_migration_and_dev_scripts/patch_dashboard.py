import os

path = 'patient-app/src/pages/Dashboard.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target1 = """          {/* AI Accuracy & Project Metrics */}
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
          </div>"""

replacement1 = """          {/* Smart Arrival Guarantee & Patient Experience */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Smart Arrival Guarantee</h4>
                <p className="text-[10px] text-slate-500 font-medium">Zero-Crowding Hospital Protocol</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs pt-1">
              <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="text-slate-500 font-medium">On-Time Accuracy</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">98.2% Punctuality</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="text-slate-500 font-medium">Waiting Room Goal</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">&lt; 5 Mins Lounge Wait</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <span className="text-slate-500 font-medium">Live Dispatch</span>
                <span className="font-bold text-slate-900 dark:text-white">SMS & WhatsApp Alerts</span>
              </div>
            </div>
          </div>"""

target2 = """          {/* Hospital Hours */}
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
          </div>"""

replacement2 = """          {/* Hospital Hours */}
          <div className="glass-card rounded-3xl p-6 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">Hospital OPD Working Hours</h4>
            <div className="space-y-2 text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Morning Session:</span>
                <strong className="text-slate-900 dark:text-white">09:30 AM - 01:00 PM</strong>
              </div>
              <div className="flex justify-between">
                <span>Afternoon Session:</span>
                <strong className="text-slate-900 dark:text-white">02:30 PM - 05:30 PM</strong>
              </div>
              <div className="flex justify-between">
                <span>Evening Session:</span>
                <strong className="text-slate-900 dark:text-white">06:30 PM - 08:00 PM</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Emergency Trauma:</span>
                <strong className="text-red-500 font-bold">24 Hours / 7 Days</strong>
              </div>
            </div>
          </div>"""

c_norm = content.replace('\r\n', '\n')
t1_norm = target1.replace('\r\n', '\n')
t2_norm = target2.replace('\r\n', '\n')

if t1_norm in c_norm and t2_norm in c_norm:
    c_norm = c_norm.replace(t1_norm, replacement1.replace('\r\n', '\n'))
    c_norm = c_norm.replace(t2_norm, replacement2.replace('\r\n', '\n'))
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c_norm)
    print("SUCCESS: Updated Dashboard.jsx")
else:
    print("Failed to match targets:", t1_norm in c_norm, t2_norm in c_norm)
