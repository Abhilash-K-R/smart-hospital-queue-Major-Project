import sys
import os
sys.path.insert(0, os.path.abspath('backend'))

from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Tuple
from sqlmodel import Session, select
from database import engine
from models import Doctor, Appointment, Department

IST = timezone(timedelta(hours=5, minutes=30))

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
    s for sess in OPD_SCHEDULE_SESSIONS.values() for s in sess["slots"]
]

def parse_slot_to_minutes(slot_str: Optional[str]) -> int:
    import re
    if not slot_str:
        return 9999
    try:
        match = re.search(r'(\d{1,2}):(\d{2})\s*(AM|PM)', str(slot_str), re.IGNORECASE)
        if not match:
            return 9999
        hours, mins, period = int(match.group(1)), int(match.group(2)), match.group(3).upper()
        if period == "PM" and hours != 12:
            hours += 12
        elif period == "AM" and hours == 12:
            hours = 0
        return hours * 60 + mins
    except Exception:
        return 9999

def minutes_to_slot_str(mins: int) -> str:
    hours = mins // 60
    m = mins % 60
    period = "AM" if hours < 12 else "PM"
    display_hour = hours if hours <= 12 else hours - 12
    if display_hour == 0:
        display_hour = 12
    return f"{display_hour:02d}:{m:02d} {period}"

def estimate_appointment_duration(
    doctor: Optional[Doctor] = None,
    symptoms: Optional[str] = None,
    patient_age: Optional[int] = None
) -> int:
    """
    Estimates consultation duration based on symptoms severity & complexity,
    doctor's specialty/speed, and patient age.
    Minimum slot duration is 30 minutes.
    Complex/Cardiac/Trauma cases expand to 45-50+ minutes, blocking overlapping 30m slots.
    """
    base_duration = 30
    if not symptoms:
        return base_duration

    s = symptoms.lower()

    # High complexity: Cardiac, neurological, respiratory distress, acute trauma
    high_complexity_pattern = r'chest|angina|cardiac|heart|palpitat|ecg|breathless|shortness of breath|dyspnea|stroke|paralysis|unconscious|seizure|fracture|trauma|severe pain'
    import re
    if re.search(high_complexity_pattern, s):
        base_duration = 50
    elif re.search(r'chronic|diabetes|hypertension|migraine|vertigo|joint pain|arthritis|swelling|edema|wheez|asthma|ulcer|gastritis', s):
        base_duration = 40
    else:
        base_duration = 30

    # Age vulnerability adjustment
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
    """Retrieves all busy time intervals for doctor on specific date."""
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

print("Testing with Neon DB...")
with Session(engine) as session:
    doc = session.exec(select(Doctor)).first()
    print("Found Doctor:", doc.id, doc.name)
    dur_severe = estimate_appointment_duration(doc, "Chest tightness and palpitations", 55)
    dur_routine = estimate_appointment_duration(doc, "Routine viral fever checkup", 30)
    print("Duration severe:", dur_severe, "mins (Expect 50)")
    print("Duration routine:", dur_routine, "mins (Expect 30)")
    assert dur_severe == 50
    assert dur_routine == 30
    print("ALL TESTS PASSED!")
