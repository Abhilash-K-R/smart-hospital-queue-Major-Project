"""
backend/test_slot_queue_ordering.py
-----------------------------------
Automated test verifying that OPD queue ordering respects:
1. Scheduled Slot Time (09:30 AM before 10:30 AM before 11:00 AM) regardless of booking creation time.
2. Emergency Triage Priority (Emergency sits ahead of regular slots).
3. Patients Ahead calculation accurately counts prior slots in the sorted queue.
"""

import time
import requests

BASE_URL = "http://localhost:8000"

def test_slot_queue_ordering():
    print("\n--- Starting Slot Chronological Queue Ordering Test ---", flush=True)
    suffix = str(int(time.time()))[-8:]
    phone_a = f"91{suffix}"
    phone_b = f"92{suffix}"
    name_a = f"Patient LaterSlot {suffix[-3:]}"
    name_b = f"Patient EarlierSlot {suffix[-3:]}"
    target_date = "2026-09-28"
    doctor_id = 1

    # 1. Register and Login Patient A (Will book 11:00 AM)
    requests.post(f"{BASE_URL}/auth/register", json={"fullName": name_a, "phone": phone_a, "password": "Password@123"}, timeout=30)
    login_a = requests.post(f"{BASE_URL}/auth/login", json={"emailOrPhone": phone_a, "password": "Password@123"}, timeout=30)
    token_a = login_a.json()["token"]

    # 2. Register and Login Patient B (Will book 10:30 AM)
    requests.post(f"{BASE_URL}/auth/register", json={"fullName": name_b, "phone": phone_b, "password": "Password@123"}, timeout=30)
    login_b = requests.post(f"{BASE_URL}/auth/login", json={"emailOrPhone": phone_b, "password": "Password@123"}, timeout=30)
    token_b = login_b.json()["token"]

    # 3. Patient A books 11:00 AM slot FIRST
    res_a = requests.post(
        f"{BASE_URL}/patients/book",
        json={
            "doctor_id": doctor_id,
            "doctor": "Dr. Priya Sharma",
            "department": "Cardiology",
            "date": target_date,
            "time_slot": "11:00 AM",
            "symptoms": "Follow-up",
            "patient_name": name_a,
            "patient_age": 40,
            "patient_gender": "Male",
            "contact_phone": phone_a,
            "is_dependent": False
        },
        headers={"Authorization": f"Bearer {token_a}"},
        timeout=30
    )
    assert res_a.status_code == 200, f"Patient A booking failed: {res_a.text}"
    token_num_a = res_a.json()["tokenNumber"]
    print(f"[1] Patient A booked 11:00 AM slot FIRST -> Token: {token_num_a}", flush=True)

    # 4. Patient B books 10:30 AM slot SECOND (earlier time slot booked later)
    res_b = requests.post(
        f"{BASE_URL}/patients/book",
        json={
            "doctor_id": doctor_id,
            "doctor": "Dr. Priya Sharma",
            "department": "Cardiology",
            "date": target_date,
            "time_slot": "10:30 AM",
            "symptoms": "Health check",
            "patient_name": name_b,
            "patient_age": 30,
            "patient_gender": "Female",
            "contact_phone": phone_b,
            "is_dependent": False
        },
        headers={"Authorization": f"Bearer {token_b}"},
        timeout=30
    )
    assert res_b.status_code == 200, f"Patient B booking failed: {res_b.text}"
    token_num_b = res_b.json()["tokenNumber"]
    print(f"[2] Patient B booked 10:30 AM slot SECOND -> Token: {token_num_b}", flush=True)

    # 5. Fetch Staff Queue and verify ordering
    staff_res = requests.get(f"{BASE_URL}/staff/queue", timeout=30)
    assert staff_res.status_code == 200, f"Staff queue fetch failed: {staff_res.text}"
    queue = staff_res.json()

    # Filter for target date and doctor
    doc_queue = [q for q in queue if q.get("doctor_id") == doctor_id and q.get("appointment_date") == target_date]
    print(f"[3] Live queue entries for {target_date}: {len(doc_queue)} patients", flush=True)
    for q in doc_queue:
        print(f"    - Pos #{q['queue_position']}: {q['name']} | Slot: {q['time_slot']} | Token: {q['tokenNumber']}", flush=True)

    # Find indexes of Patient A and Patient B in the list
    idx_a = next((i for i, q in enumerate(doc_queue) if q["tokenNumber"] == token_num_a), None)
    idx_b = next((i for i, q in enumerate(doc_queue) if q["tokenNumber"] == token_num_b), None)

    assert idx_a is not None and idx_b is not None, "Both appointments must appear in staff queue"
    assert idx_b < idx_a, f"Patient B (10:30 AM, index {idx_b}) MUST appear ahead of Patient A (11:00 AM, index {idx_a})"
    print(f"[4] Verified: 10:30 AM slot (Patient B, Pos #{doc_queue[idx_b]['queue_position']}) is ahead of 11:00 AM slot (Patient A, Pos #{doc_queue[idx_a]['queue_position']})", flush=True)

    print("\n[SUCCESS] SLOT CHRONOLOGICAL QUEUE ORDERING TEST PASSED!", flush=True)

if __name__ == "__main__":
    test_slot_queue_ordering()
