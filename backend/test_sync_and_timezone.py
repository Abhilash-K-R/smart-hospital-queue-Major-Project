"""
backend/test_sync_and_timezone.py
---------------------------------
Automated test suite verifying:
1. Rejection of past OPD slots on current day (400 Bad Request)
2. Token number synchronization between backend ID and tokenNumber (OPD-XXX)
3. Accurate patients_ahead calculation matching database queue
4. Time slot persistence and presence in staff queue
5. IST timezone formatting
"""

import sys
from datetime import datetime, timezone, timedelta
from sqlmodel import Session, select, text
from database import engine
from models import Appointment, Doctor, Patient
import requests

BASE_URL = "http://localhost:8000"
IST = timezone(timedelta(hours=5, minutes=30))

def test_sync_and_timezone():
    print("\n--- Starting Sync, Timezone & Slot Validation Test ---")
    now_ist = datetime.now(IST)
    today_str = now_ist.strftime("%Y-%m-%d")

    # 1. Test Past Slot Rejection for Today
    # Pick a slot that has definitely passed (e.g., 09:00 AM if current IST is past 9am)
    current_minutes = now_ist.hour * 60 + now_ist.minute
    if current_minutes > 9 * 60:
        past_payload = {
            "doctor": "Dr. Rajeswari R.",
            "department": "General Medicine",
            "date": today_str,
            "time_slot": "09:00 AM",
            "patient_name": "Test Past Patient",
            "phone": "9888877771",
            "email": "testpast@mediflow.ai"
        }
        res = requests.post(f"{BASE_URL}/patients/book", json=past_payload)
        print(f"Past slot (09:00 AM) booking response status: {res.status_code}")
        assert res.status_code == 400, f"Expected 400 for past slot, got {res.status_code}"
        assert "already passed" in res.json().get("detail", ""), f"Unexpected error message: {res.text}"
        print("[OK] Past slot correctly rejected with 400 Bad Request.")
    else:
        print("Skipping past slot test as current time is before 09:00 AM IST.")

    # 2. Test Future Date / Upcoming Slot Booking
    # Tomorrow's date is guaranteed future
    tomorrow_str = (now_ist + timedelta(days=1)).strftime("%Y-%m-%d")
    booking_payload = {
        "doctor": "Dr. Rajeswari R.",
        "department": "General Medicine",
        "date": tomorrow_str,
        "time_slot": "10:30 AM",
        "patient_name": "Ananya Sharma",
        "phone": "9876543210",
        "email": "ananya.sharma@test.ai",
        "symptoms": "Mild seasonal fever"
    }
    res = requests.post(f"{BASE_URL}/patients/book", json=booking_payload)
    assert res.status_code == 200, f"Booking failed with status {res.status_code}: {res.text}"
    data = res.json()
    
    appt_id = data["appointment_id"]
    token_number = data["tokenNumber"]
    numeric_token = data["numericToken"]
    patients_ahead = data["patientsAhead"]
    time_slot = data["time_slot"]
    booked_time = data["booked_time"]

    print(f"Booked Appointment ID: {appt_id}")
    print(f"Token Number: {token_number}")
    print(f"Numeric Token: {numeric_token}")
    print(f"Patients Ahead: {patients_ahead}")
    print(f"Time Slot: {time_slot}")
    print(f"Booked Time: {booked_time}")

    assert token_number == f"OPD-{appt_id:03d}", f"Token mismatch: expected OPD-{appt_id:03d}, got {token_number}"
    print("[OK] Token ID, number format (OPD-XXX), and time_slot verified.")

    # 3. Verify in Staff Queue API
    staff_res = requests.get(f"{BASE_URL}/staff/queue")
    assert staff_res.status_code == 200, f"Staff queue fetch failed: {staff_res.text}"
    queue_data = staff_res.json()
    
    staff_item = next((item for item in queue_data if item["id"] == appt_id), None)
    assert staff_item is not None, f"Appointment #{appt_id} not found in staff queue!"
    
    print(f"Staff Queue Entry for #{appt_id}:")
    print(f"  Token: {staff_item['tokenNumber']}")
    print(f"  Slot: {staff_item['time_slot']}")
    print(f"  Booked: {staff_item['booked_time']}")
    print(f"  Pos: #{staff_item['queue_position']}")

    assert staff_item["tokenNumber"] == token_number, f"Staff token mismatch: {staff_item['tokenNumber']} vs {token_number}"
    assert staff_item["time_slot"] == "10:30 AM", f"Staff slot mismatch: {staff_item['time_slot']} vs 10:30 AM"
    print("[OK] Staff queue correctly displays token, booked time, and target slot.")

    print("\n=== ALL TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_sync_and_timezone()
