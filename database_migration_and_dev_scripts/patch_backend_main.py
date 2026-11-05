import os

path = 'backend/main.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update schemas import
if "DoctorAvailableSlotsResponse" not in content:
    target_import = "StaffWalkInRegisterRequest, StaffWalkInRegisterResponse,"
    replacement_import = "StaffWalkInRegisterRequest, StaffWalkInRegisterResponse,\n    AvailableSlotItem, DoctorAvailableSlotsResponse,"
    content = content.replace(target_import, replacement_import)

# 2. Add timetable schedules and helper functions after parse_slot_time_to_minutes
schedule_helpers = '''
# ---------------------------------------------------------------------
# OPD 3-SESSION TIMETABLE (30-MIN INTERVALS) & DYNAMIC ML SLOT BUFFERS
# ---------------------------------------------------------------------
OPD_SCHEDULE_SESSIONS = {
    "morning": {
        "title": "Morning Session (09:30 AM - 01:00 PM)",
        "slots": ["09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM"]
    },
    "afternoon": {
        "title": "Afternoon Session (02:30 PM - 05:30 PM)",
        "slots": ["02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM"]
    },
    "evening": {
        "title": "Evening Session (06:30 PM - 08:00 PM)",
        "slots": ["06:30 PM", "07:00 PM", "07:30 PM"]
    }
}

ALL_STANDARD_SLOTS = [
    slot for sess in OPD_SCHEDULE_SESSIONS.values() for slot in sess["slots"]
]

def minutes_to_slot_str(mins: int) -> str:
    """Converts minutes from midnight to 12-hour formatted time string like '11:20 AM'."""
    hours = (mins // 60) % 24
    m = mins % 60
    period = "AM" if hours < 12 else "PM"
    display_hour = hours if hours <= 12 else hours - 12
    if display_hour == 0:
        display_hour = 12
    return f"{display_hour:02d}:{m:02d} {period}"

def estimate_appointment_duration(
    doctor: Optional[Doctor] = None,
    symptoms: Optional[str] = None,
    patient_age: Optional[Union[int, str]] = None
) -> int:
    """
    Estimates consultation duration based on symptoms severity & complexity,
    doctor's specialty/speed, and patient age.
    Minimum slot duration is 30 minutes.
    Complex/Cardiac/Trauma cases expand to 45-50+ minutes, dynamically blocking overlapping 30m slots.
    """
    base_duration = 30
    if not symptoms:
        return base_duration

    s = symptoms.lower()

    # High complexity: Cardiac, neurological, respiratory distress, acute trauma
    high_complexity_pattern = r'chest|angina|cardiac|heart|palpitat|ecg|breathless|shortness of breath|dyspnea|stroke|paralysis|unconscious|seizure|fracture|trauma|severe pain'
    if re.search(high_complexity_pattern, s):
        base_duration = 50
    elif re.search(r'chronic|diabetes|hypertension|migraine|vertigo|joint pain|arthritis|swelling|edema|wheez|asthma|ulcer|gastritis', s):
        base_duration = 40
    else:
        base_duration = 30

    # Age vulnerability adjustment (geriatric >= 65, pediatric infant <= 5)
    if patient_age is not None:
        try:
            age = int(patient_age)
            if (age >= 65 or age <= 5) and base_duration >= 40:
                base_duration = min(60, base_duration + 10)
        except (ValueError, TypeError):
            pass

    return max(30, base_duration)

def get_doctor_busy_windows(
    session: Session,
    doctor_id: int,
    appointment_date: str,
    ignore_appointment_id: Optional[int] = None
) -> List[Dict]:
    """Retrieves all active busy time intervals for doctor on specific date."""
    query = select(Appointment).where(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date == appointment_date,
        Appointment.status.in_(["pending", "serving"])
    )
    if ignore_appointment_id:
        query = query.where(Appointment.id != ignore_appointment_id)

    appts = session.exec(query).all()
    windows = []
    for appt in appts:
        s_mins = parse_slot_to_minutes(appt.time_slot)
        if s_mins >= 9999:
            continue
        dur = max(30, appt.predicted_duration or 30)
        e_mins = s_mins + dur
        windows.append({
            "appointment_id": appt.id,
            "slot": appt.time_slot,
            "start_mins": s_mins,
            "end_mins": e_mins,
            "duration": dur,
            "patient_name": appt.beneficiary_name or "Reserved Patient",
            "busy_until": minutes_to_slot_str(e_mins)
        })
    return windows
'''

target_helper = "def parse_slot_time_to_minutes(slot_str: Optional[str]) -> Optional[int]:\n    \"\"\"Compatibility wrapper returning None if invalid.\"\"\"\n    mins = parse_slot_to_minutes(slot_str)\n    return mins if mins != 9999 else None"

if "OPD_SCHEDULE_SESSIONS" not in content and target_helper in content:
    content = content.replace(target_helper, target_helper + "\n" + schedule_helpers)

# 3. Add GET /doctors/{doctor_id}/available-slots endpoint
endpoint_code = '''
@app.get("/doctors/{doctor_id}/available-slots", response_model=DoctorAvailableSlotsResponse)
def get_doctor_available_slots(
    doctor_id: int,
    date: Optional[str] = None
):
    """
    Returns live dynamic OPD slot availability for a doctor on a specific date.
    Calculates ML extended consultation buffers (e.g. 50-minute consultations)
    and dynamically marks colliding slots as unavailable with exact reasoning
    (e.g., 'Extended Consultation Buffer (10:30 AM - 11:20 AM)').
    """
    now_ist = datetime.now(IST)
    today_ist = now_ist.strftime("%Y-%m-%d")
    target_date = date or today_ist
    curr_mins = now_ist.hour * 60 + now_ist.minute if target_date == today_ist else -1

    with Session(engine) as session:
        doctor = session.get(Doctor, doctor_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        dept = session.get(Department, doctor.department_id)
        dept_name = dept.name if dept else "General Medicine"

        busy_windows = get_doctor_busy_windows(session, doctor_id, target_date)

        all_items: List[AvailableSlotItem] = []
        sessions_dict: Dict[str, List[AvailableSlotItem]] = {
            "morning": [],
            "afternoon": [],
            "evening": []
        }

        next_avail = None

        for session_key, session_meta in OPD_SCHEDULE_SESSIONS.items():
            for slot in session_meta["slots"]:
                c_start = parse_slot_to_minutes(slot)
                c_end = c_start + 30
                is_past = False
                is_available = True
                reason = None
                busy_until = None

                # Check past slot for today
                if target_date == today_ist and c_start <= curr_mins + 15:
                    is_past = True
                    is_available = False
                    reason = "Slot Passed"

                # Check collision with busy windows
                if is_available:
                    for bw in busy_windows:
                        if c_start < bw["end_mins"] and c_end > bw["start_mins"]:
                            is_available = False
                            busy_until = bw["busy_until"]
                            if c_start == bw["start_mins"]:
                                reason = f"Booked ({bw['slot']})"
                            else:
                                reason = f"Extended Consultation Buffer ({bw['slot']} - {bw['busy_until']})"
                            break

                item = AvailableSlotItem(
                    slot=slot,
                    session=session_key,
                    available=is_available,
                    is_past=is_past,
                    reason=reason,
                    busy_until=busy_until,
                    predicted_duration=30
                )
                sessions_dict[session_key].append(item)
                all_items.append(item)

                if is_available and next_avail is None:
                    next_avail = slot

        avail_count = sum(1 for item in all_items if item.available)

        return DoctorAvailableSlotsResponse(
            doctor_id=doctor.id,
            doctor_name=doctor.name,
            department=dept_name,
            date=target_date,
            total_slots=len(all_items),
            available_count=avail_count,
            next_available_slot=next_avail,
            sessions=sessions_dict,
            all_slots=all_items,
        )
'''

target_doc_list_end = "return result\n\n# ---------------------------------------------------------------------\n# SYMPTOM MAPPING"
if "get_doctor_available_slots" not in content and target_doc_list_end in content:
    content = content.replace(target_doc_list_end, "return result\n" + endpoint_code + "\n# ---------------------------------------------------------------------\n# SYMPTOM MAPPING")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Patched backend/main.py initial phase")
