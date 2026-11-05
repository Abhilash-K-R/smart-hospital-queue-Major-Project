import requests
import json
import sys
import os

BASE_URL = "http://127.0.0.1:8000"
TEST_DATE = "2026-11-15"  # distinct future date for test

print("--- Step 1: Query initial available slots for Dr. Priya Sharma (ID: 1) ---")
res = requests.get(f"{BASE_URL}/doctors/1/available-slots?date={TEST_DATE}")
assert res.status_code == 200, f"Initial query failed: {res.text}"
initial_slots = res.json()["all_slots"]
slot_1030 = next(s for s in initial_slots if s["slot"] == "10:30 AM")
slot_1100 = next(s for s in initial_slots if s["slot"] == "11:00 AM")
assert slot_1030["available"] == True
assert slot_1100["available"] == True
print("Both 10:30 AM and 11:00 AM are initially AVAILABLE.")

print("\n--- Step 2: Book Patient A at 10:30 AM with severe cardiac symptoms (expected duration: 50m) ---")
book_payload_a = {
    "doctor_id": 1,
    "date": TEST_DATE,
    "time_slot": "10:30 AM",
    "patient_name": "Test Patient A (Cardiac)",
    "phone": "9876543210",
    "email": "test.cardiac.a@example.com",
    "symptoms": "Severe acute chest pain, cardiac palpitations, and shortness of breath",
    "patient_age": 58,
    "is_dependent": True,
    "beneficiary_name": "Test Beneficiary A"
}
res_a = requests.post(f"{BASE_URL}/patients/book", json=book_payload_a)
assert res_a.status_code == 200, f"Booking A failed: {res_a.text}"
data_a = res_a.json()
appt_id_a = data_a["appointment_id"]
dur_a = data_a.get("predicted_duration")
print(f"Patient A booked successfully! Token: {data_a['tokenNumber']}, Appt ID: {appt_id_a}, Predicted Duration: {dur_a}m")
assert dur_a == 50, f"Expected predicted_duration to be 50, got {dur_a}"

print("\n--- Step 3: Query available slots after Patient A booking ---")
res_slots_after = requests.get(f"{BASE_URL}/doctors/1/available-slots?date={TEST_DATE}")
assert res_slots_after.status_code == 200
slots_after = res_slots_after.json()["all_slots"]
s1030_after = next(s for s in slots_after if s["slot"] == "10:30 AM")
s1100_after = next(s for s in slots_after if s["slot"] == "11:00 AM")
s1130_after = next(s for s in slots_after if s["slot"] == "11:30 AM")

print(f"Slot 10:30 AM: available={s1030_after['available']}, reason={s1030_after['reason']}")
print(f"Slot 11:00 AM: available={s1100_after['available']}, reason={s1100_after['reason']}")
print(f"Slot 11:30 AM: available={s1130_after['available']}, reason={s1130_after['reason']}")

assert s1030_after["available"] == False, "10:30 AM should be occupied"
assert s1100_after["available"] == False, "11:00 AM should be BLOCKED due to 50m consultation buffer"
assert "Extended Consultation Buffer" in s1100_after["reason"], f"Unexpected reason: {s1100_after['reason']}"
assert s1130_after["available"] == True, "11:30 AM should be open and AVAILABLE"
print("Dynamic slot suppression verified!")

print("\n--- Step 4: Patient B attempts to book colliding slot 11:00 AM ---")
book_payload_b = {
    "doctor_id": 1,
    "date": TEST_DATE,
    "time_slot": "11:00 AM",
    "patient_name": "Test Patient B",
    "phone": "9876543211",
    "email": "test.patient.b@example.com",
    "symptoms": "Routine follow up checkup",
    "patient_age": 30,
    "is_dependent": True,
    "beneficiary_name": "Test Beneficiary B"
}
res_b = requests.post(f"{BASE_URL}/patients/book", json=book_payload_b)
print(f"Response status: {res_b.status_code}")
print(f"Response detail: {res_b.text}")
assert res_b.status_code == 409, f"Expected 409 Conflict, got {res_b.status_code}"
assert "extended consultation" in res_b.text.lower()
assert "11:30 AM" in res_b.text, f"Expected suggestion 11:30 AM in: {res_b.text}"
print("Collision guard properly blocked 11:00 AM and suggested 11:30 AM!")

print("\n--- Step 5: Patient B accepts suggestion and books 11:30 AM ---")
book_payload_b["time_slot"] = "11:30 AM"
res_b_ok = requests.post(f"{BASE_URL}/patients/book", json=book_payload_b)
assert res_b_ok.status_code == 200, f"Booking 11:30 AM failed: {res_b_ok.text}"
appt_id_b = res_b_ok.json()["appointment_id"]
print(f"Patient B booked 11:30 AM successfully! Appt ID: {appt_id_b}")

print("\n--- Step 6: Clean up test appointments from DB ---")
sys.path.insert(0, os.path.abspath('backend'))
from sqlmodel import Session, select
from database import engine
from models import Appointment

with Session(engine) as session:
    for aid in [appt_id_a, appt_id_b]:
        appt = session.get(Appointment, aid)
        if appt:
            session.delete(appt)
    session.commit()
print("Cleaned up test appointments from database.")
print("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<")
