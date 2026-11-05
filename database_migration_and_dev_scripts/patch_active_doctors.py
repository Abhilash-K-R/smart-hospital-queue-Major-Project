import os

# 1. Update backend/main.py
with open('backend/main.py', 'r', encoding='utf-8') as f:
    main_code = f.read()

target_backend_stats = """        return StaffStatsResponse(
            total_today=max(total_today, 25),
            currently_waiting=currently_waiting,
            avg_wait_minutes=avg_wait,
            active_doctors=len(doctors),"""

repl_backend_stats = """        active_doctors_count = len([
            d for d in doctors
            if doctor_delays.get(d.id, {}).get("status", "Active") not in ["Break", "On Break"]
            and getattr(d, "is_present", True) is not False
        ])

        return StaffStatsResponse(
            total_today=max(total_today, 25),
            currently_waiting=currently_waiting,
            avg_wait_minutes=avg_wait,
            active_doctors=active_doctors_count,"""

target_backend_update = """        if req.is_present is not None:
            doc.is_present = req.is_present

        session.add(doc)"""

repl_backend_update = """        if req.is_present is not None:
            doc.is_present = req.is_present
        elif req.status in ["Break", "On Break"]:
            doc.is_present = False
        elif req.status == "Active":
            doc.is_present = True

        session.add(doc)"""

def replace_code(target, replacement, code):
    if target in code:
        return code.replace(target, replacement, 1)
    elif target.replace('\n', '\r\n') in code:
        return code.replace(target.replace('\n', '\r\n'), replacement.replace('\n', '\r\n'), 1)
    return code

main_code = replace_code(target_backend_stats, repl_backend_stats, main_code)
main_code = replace_code(target_backend_update, repl_backend_update, main_code)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(main_code)

print("SUCCESS: backend/main.py updated!")

# 2. Update staff-dashboard/src/pages/Dashboard.jsx
with open('staff-dashboard/src/pages/Dashboard.jsx', 'r', encoding='utf-8') as f:
    dash_code = f.read()

target_dash = """      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Appointments Today" value={stats.total_today} icon={Users} trend="+Today" />
        <StatCard title="Currently Waiting" value={stats.currently_waiting} icon={Clock} subtitle="Active in OPD Queue" />
        <StatCard title="Average Wait Time" value={`${Math.round(stats.avg_wait_minutes || 18)}m`} icon={Activity} trend="AI Predicted" subtitle="Random Forest ML" />
        <StatCard title="Active OPD Doctors" value={stats.active_doctors || doctors.length || 8} icon={UserPlus} trend="Online" subtitle="Available Consultation" />
      </div>"""

repl_dash = """      {/* Calculate dynamic active doctor count excluding those On Break */}
      {(() => {
        const totalDocs = doctors.length > 0 ? doctors.length : 8;
        const breakDocs = doctors.filter(d => d.status === 'On Break' || d.status === 'Break' || d.is_present === false).length;
        const activeDocs = doctors.length > 0 ? (totalDocs - breakDocs) : (stats.active_doctors !== undefined ? stats.active_doctors : 8);

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Appointments Today" value={stats.total_today} icon={Users} trend="+Today" />
            <StatCard title="Currently Waiting" value={stats.currently_waiting} icon={Clock} subtitle="Active in OPD Queue" />
            <StatCard title="Average Wait Time" value={`${Math.round(stats.avg_wait_minutes || 18)}m`} icon={Activity} trend="AI Predicted" subtitle="Random Forest ML" />
            <StatCard 
              title="Active OPD Doctors" 
              value={activeDocs} 
              icon={UserPlus} 
              trend={breakDocs > 0 ? `${activeDocs}/${totalDocs} Active` : "Online"} 
              subtitle={breakDocs > 0 ? `${breakDocs} Doctor${breakDocs > 1 ? 's' : ''} on Break` : "Available Consultation"} 
            />
          </div>
        );
      })()}"""

dash_code = replace_code(target_dash, repl_dash, dash_code)

with open('staff-dashboard/src/pages/Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(dash_code)

print("SUCCESS: staff-dashboard/src/pages/Dashboard.jsx updated!")

