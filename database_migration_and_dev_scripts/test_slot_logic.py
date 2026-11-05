import re

OPD_SCHEDULE_SESSIONS = {
    "Morning Session (09:30 AM - 01:00 PM)": [
        "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM"
    ],
    "Afternoon Session (02:30 PM - 05:30 PM)": [
        "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM"
    ],
    "Evening Session (06:30 PM - 08:00 PM)": [
        "06:30 PM", "07:00 PM", "07:30 PM"
    ]
}

ALL_STANDARD_SLOTS = [
    slot for session_slots in OPD_SCHEDULE_SESSIONS.values() for slot in session_slots
]

def parse_slot_to_minutes(slot_str: str) -> int:
    match = re.search(r'(\d{1,2}):(\d{2})\s*(AM|PM)', str(slot_str), re.IGNORECASE)
    if not match:
        return 9999
    hours, mins, period = int(match.group(1)), int(match.group(2)), match.group(3).upper()
    if period == "PM" and hours != 12:
        hours += 12
    elif period == "AM" and hours == 12:
        hours = 0
    return hours * 60 + mins

def minutes_to_slot_str(mins: int) -> str:
    hours = mins // 60
    m = mins % 60
    period = "AM" if hours < 12 else "PM"
    display_hour = hours if hours <= 12 else hours - 12
    if display_hour == 0:
        display_hour = 12
    return f"{display_hour:02d}:{m:02d} {period}"

# Test Case: Patient A booked 10:30 AM with duration 50 mins
booked_slots = [
    {"slot": "10:30 AM", "duration": 50, "patient": "Patient A"}
]

busy_windows = []
for b in booked_slots:
    s_min = parse_slot_to_minutes(b["slot"])
    e_min = s_min + max(30, b["duration"])
    busy_windows.append((s_min, e_min, b["slot"], b["duration"]))

print("Busy windows:", [(minutes_to_slot_str(w[0]), minutes_to_slot_str(w[1])) for w in busy_windows])

for slot in ALL_STANDARD_SLOTS:
    c_start = parse_slot_to_minutes(slot)
    c_end = c_start + 30
    is_available = True
    reason = None
    for (w_start, w_end, orig_slot, dur) in busy_windows:
        # Overlap check
        if c_start < w_end and c_end > w_start:
            is_available = False
            if c_start == w_start:
                reason = f"Booked ({orig_slot})"
            else:
                reason = f"Doctor in extended consultation ({orig_slot} - {minutes_to_slot_str(w_end)})"
            break
    print(f"Slot {slot:8s} -> {'AVAILABLE' if is_available else 'BLOCKED' :10s} ({reason})")
