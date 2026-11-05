import os

path = 'patient-app/src/pages/Appointment.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace OPD_TIME_SLOTS
target_slots = """// Standard OPD time slots
export const OPD_TIME_SLOTS = [
  { time: "09:00 AM", label: "09:00 AM - Morning Shift", hour: 9, minute: 0 },
  { time: "09:30 AM", label: "09:30 AM - Morning Shift", hour: 9, minute: 30 },
  { time: "10:00 AM", label: "10:00 AM - Prime Peak Shift", hour: 10, minute: 0 },
  { time: "10:30 AM", label: "10:30 AM - Prime Peak Shift", hour: 10, minute: 30 },
  { time: "11:00 AM", label: "11:00 AM - Mid-Morning Shift", hour: 11, minute: 0 },
  { time: "11:30 AM", label: "11:30 AM - Mid-Morning Shift", hour: 11, minute: 30 },
  { time: "12:00 PM", label: "12:00 PM - Midday Consultation", hour: 12, minute: 0 },
  { time: "12:30 PM", label: "12:30 PM - Midday Consultation", hour: 12, minute: 30 },
  { time: "02:00 PM", label: "02:00 PM - Afternoon OPD", hour: 14, minute: 0 },
  { time: "02:30 PM", label: "02:30 PM - Afternoon OPD", hour: 14, minute: 30 },
  { time: "03:00 PM", label: "03:00 PM - Afternoon OPD", hour: 15, minute: 0 },
  { time: "03:30 PM", label: "03:30 PM - Afternoon OPD", hour: 15, minute: 30 },
  { time: "04:00 PM", label: "04:00 PM - Evening Clinic", hour: 16, minute: 0 },
  { time: "04:30 PM", label: "04:30 PM - Evening Clinic", hour: 16, minute: 30 }
];"""

replacement_slots = """// Standard OPD 3-Session 30-min time slots (Morning, Afternoon, Evening)
export const OPD_TIME_SLOTS = [
  // Morning Session: 09:30 AM - 01:00 PM
  { time: "09:30 AM", label: "09:30 AM - Morning Session", session: "Morning", hour: 9, minute: 30 },
  { time: "10:00 AM", label: "10:00 AM - Morning Session", session: "Morning", hour: 10, minute: 0 },
  { time: "10:30 AM", label: "10:30 AM - Morning Session", session: "Morning", hour: 10, minute: 30 },
  { time: "11:00 AM", label: "11:00 AM - Morning Session", session: "Morning", hour: 11, minute: 0 },
  { time: "11:30 AM", label: "11:30 AM - Morning Session", session: "Morning", hour: 11, minute: 30 },
  { time: "12:00 PM", label: "12:00 PM - Morning Session", session: "Morning", hour: 12, minute: 0 },
  { time: "12:30 PM", label: "12:30 PM - Morning Session", session: "Morning", hour: 12, minute: 30 },

  // Afternoon Session: 02:30 PM - 05:30 PM
  { time: "02:30 PM", label: "02:30 PM - Afternoon Session", session: "Afternoon", hour: 14, minute: 30 },
  { time: "03:00 PM", label: "03:00 PM - Afternoon Session", session: "Afternoon", hour: 15, minute: 0 },
  { time: "03:30 PM", label: "03:30 PM - Afternoon Session", session: "Afternoon", hour: 15, minute: 30 },
  { time: "04:00 PM", label: "04:00 PM - Afternoon Session", session: "Afternoon", hour: 16, minute: 0 },
  { time: "04:30 PM", label: "04:30 PM - Afternoon Session", session: "Afternoon", hour: 16, minute: 30 },
  { time: "05:00 PM", label: "05:00 PM - Afternoon Session", session: "Afternoon", hour: 17, minute: 0 },

  // Evening Session: 06:30 PM - 08:00 PM
  { time: "06:30 PM", label: "06:30 PM - Evening Session", session: "Evening", hour: 18, minute: 30 },
  { time: "07:00 PM", label: "07:00 PM - Evening Session", session: "Evening", hour: 19, minute: 0 },
  { time: "07:30 PM", label: "07:30 PM - Evening Session", session: "Evening", hour: 19, minute: 30 }
];"""

content_norm = content.replace('\r\n', '\n')
t_norm = target_slots.replace('\r\n', '\n')
r_norm = replacement_slots.replace('\r\n', '\n')

assert t_norm in content_norm, "Target slots not found"
content_norm = content_norm.replace(t_norm, r_norm)

# 2. Add live slot availability state and hook
target_doc_obj = """  const availableDoctors = DOCTORS.filter(d => d.department === selectedDepartment);"""

replacement_doc_obj = """  const availableDoctors = DOCTORS.filter(d => d.department === selectedDepartment);
  const currentDoctorObj = useMemo(() => {
    return DOCTORS.find(d => d.name === selectedDoctorName) || availableDoctors[0] || DOCTORS[0];
  }, [selectedDoctorName, availableDoctors]);

  const [liveSlotsData, setLiveSlotsData] = useState(null);
  const [selectedSessionFilter, setSelectedSessionFilter] = useState('All');
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  // Fetch live slot availability from backend (with ML extended consultation buffers)
  useEffect(() => {
    let isMounted = true;
    const fetchSlots = async () => {
      const docId = currentDoctorObj?.doctorId || currentDoctorObj?.id || 1;
      setIsFetchingSlots(true);
      try {
        const res = await patientService.getAvailableSlots(docId, selectedDate);
        if (isMounted && res) {
          setLiveSlotsData(res);
        }
      } catch (err) {
        console.warn("Could not fetch live slots:", err);
      } finally {
        if (isMounted) setIsFetchingSlots(false);
      }
    };
    fetchSlots();
    return () => { isMounted = false; };
  }, [currentDoctorObj, selectedDate]);"""

t_doc_norm = target_doc_obj.replace('\r\n', '\n')
r_doc_norm = replacement_doc_obj.replace('\r\n', '\n')
assert t_doc_norm in content_norm, "Target doc obj not found"
content_norm = content_norm.replace(t_doc_norm, r_doc_norm)

# 3. Update computedSlots to combine backend buffer collisions
target_computed = """  // Dynamic Time Slot Availability Calculation based on selected date and current time + travel time
  const computedSlots = useMemo(() => {
    const isToday = selectedDate === todayDate;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const requiredBufferMinutes = travelTimeMinutes + 15;

    return OPD_TIME_SLOTS.map(slot => {
      const slotMinutes = slot.hour * 60 + slot.minute;
      const isPast = isToday && (slotMinutes <= currentMinutes + requiredBufferMinutes);
      let label = slot.label;
      if (isPast && isToday && slotMinutes > currentMinutes) {
        label = `${slot.time} - Too soon to travel (${travelTimeMinutes}m away)`;
      }
      return {
        ...slot,
        label,
        isPast
      };
    });
  }, [selectedDate, todayDate, travelTimeMinutes]);

  const activeAvailableSlots = useMemo(() => {
    return computedSlots.filter(s => !s.isPast);
  }, [computedSlots]);"""

replacement_computed = """  // Dynamic Time Slot Availability Calculation (combining client travel buffer + backend ML collision buffers)
  const computedSlots = useMemo(() => {
    const isToday = selectedDate === todayDate;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const requiredBufferMinutes = travelTimeMinutes + 15;

    return OPD_TIME_SLOTS.map(slot => {
      const slotMinutes = slot.hour * 60 + slot.minute;
      const isPast = isToday && (slotMinutes <= currentMinutes + requiredBufferMinutes);

      // Check backend live availability
      const backendSlot = liveSlotsData?.all_slots?.find(s => s.slot === slot.time);
      const isBlocked = backendSlot ? !backendSlot.available : false;
      const blockReason = backendSlot?.reason || (isPast ? "Slot Passed / Too close to travel" : null);

      let label = `${slot.time} (${slot.session})`;
      if (isPast && isToday && slotMinutes > currentMinutes) {
        label = `${slot.time} - Too soon to travel (${travelTimeMinutes}m away)`;
      } else if (isBlocked && blockReason) {
        label = `${slot.time} - ${blockReason}`;
      }

      return {
        ...slot,
        label,
        isPast,
        isBlocked,
        blockReason,
        isAvailable: !isPast && !isBlocked,
        busyUntil: backendSlot?.busy_until
      };
    });
  }, [selectedDate, todayDate, travelTimeMinutes, liveSlotsData]);

  const filteredSlots = useMemo(() => {
    if (selectedSessionFilter === 'All') return computedSlots;
    return computedSlots.filter(s => s.session === selectedSessionFilter);
  }, [computedSlots, selectedSessionFilter]);

  const activeAvailableSlots = useMemo(() => {
    return computedSlots.filter(s => s.isAvailable);
  }, [computedSlots]);"""

t_comp_norm = target_computed.replace('\r\n', '\n')
r_comp_norm = replacement_computed.replace('\r\n', '\n')
assert t_comp_norm in content_norm, "Target computed slots not found"
content_norm = content_norm.replace(t_comp_norm, r_comp_norm)

# 4. Update slot selection rendering with Session Tabs and Visual Interactive Chips
target_slot_ui = """                <div className=\"space-y-1.5\">
                  <label className=\"block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300\">
                    Preferred Time Slot *
                  </label>
                  <select
                    {...register('timeSlot')}
                    disabled={activeAvailableSlots.length === 0}
                    className=\"w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50\"
                  >
                    {computedSlots.map(slot => (
                      <option key={slot.time} value={slot.time} disabled={slot.isPast}>
                        {slot.label} {slot.isPast ? \"❌ (Slot Passed)\" : \"✅\"}
                      </option>
                    ))}
                  </select>
                </div>"""

replacement_slot_ui = """                <div className=\"space-y-3\">
                  <div className=\"flex items-center justify-between\">
                    <label className=\"block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300\">
                      Preferred Consultation Slot *
                    </label>
                    {isFetchingSlots && (
                      <span className=\"text-[11px] text-blue-500 animate-pulse font-medium\">Checking live doctor schedule...</span>
                    )}
                  </div>

                  {/* 3-Session Tabs */}
                  <div className=\"flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-bold\">
                    {[
                      { id: 'All', label: 'All Sessions (16)' },
                      { id: 'Morning', label: 'Morning (09:30 AM - 01:00 PM)' },
                      { id: 'Afternoon', label: 'Afternoon (02:30 PM - 05:30 PM)' },
                      { id: 'Evening', label: 'Evening (06:30 PM - 08:00 PM)' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type=\"button\"
                        onClick={() => setSelectedSessionFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          selectedSessionFilter === tab.id
                            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Visual Slot Grid */}
                  <div className=\"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1 max-h-56 overflow-y-auto pr-1\">
                    {filteredSlots.map(slot => {
                      const isSelected = selectedSlot === slot.time;
                      const isDisabled = !slot.isAvailable;
                      const isExtendedBuffer = slot.isBlocked && (slot.blockReason?.includes('Extended Consultation') || slot.blockReason?.includes('Buffer'));
                      
                      return (
                        <button
                          key={slot.time}
                          type=\"button\"
                          disabled={isDisabled}
                          onClick={() => setValue('timeSlot', slot.time)}
                          className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 ring-2 ring-blue-500/30'
                              : isDisabled
                              ? 'border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 opacity-60 cursor-not-allowed'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-blue-300 dark:hover:border-blue-700'
                          }`}
                        >
                          <div className=\"flex items-center justify-between\">
                            <span className={`text-xs font-bold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                              {slot.time}
                            </span>
                            {isSelected && <CheckCircle2 className=\"w-3.5 h-3.5 text-blue-600\" />}
                          </div>

                          <div className=\"mt-1\">
                            {isExtendedBuffer ? (
                              <span className=\"text-[9px] font-bold text-amber-600 dark:text-amber-400 block truncate\" title={slot.blockReason}>
                                ⏳ In Extended Consult
                              </span>
                            ) : slot.isBlocked ? (
                              <span className=\"text-[9px] font-semibold text-slate-500 block truncate\">
                                🔒 Booked
                              </span>
                            ) : slot.isPast ? (
                              <span className=\"text-[9px] font-semibold text-slate-400 block truncate\">
                                ❌ Passed
                              </span>
                            ) : (
                              <span className=\"text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block truncate\">
                                ✅ Available (30m)
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Fallback Synchronized Native Select */}
                  <select
                    {...register('timeSlot')}
                    disabled={activeAvailableSlots.length === 0}
                    className=\"w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 mt-1\"
                  >
                    {computedSlots.map(slot => (
                      <option key={slot.time} value={slot.time} disabled={!slot.isAvailable}>
                        {slot.label} {!slot.isAvailable ? \"❌ (Unavailable)\" : \"✅\"}
                      </option>
                    ))}
                  </select>
                </div>"""

t_ui_norm = target_slot_ui.replace('\r\n', '\n')
r_ui_norm = replacement_slot_ui.replace('\r\n', '\n')
assert t_ui_norm in content_norm, "Target slot UI not found"
content_norm = content_norm.replace(t_ui_norm, r_ui_norm)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content_norm)

print("SUCCESS: Updated Appointment.jsx")
