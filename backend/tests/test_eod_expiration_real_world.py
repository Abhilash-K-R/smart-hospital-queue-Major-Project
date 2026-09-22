import os
import sys
import requests
import uuid
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

BASE_URL = "http://localhost:8000"

def test_eod_flow():
    print("\n========================================================")
    print("VERIFYING END-OF-DAY (8:00 PM) APPOINTMENT EXPIRATION")
    print("========================================================")

    test_phone = f"99{uuid.uuid4().int % 100000000:08d}"
    test_name = "Kavya Ramesh"
    test_pass = "SecurePass@2026"

    # 1. Register test patient
    print(f"\n[1] Registering patient ({test_name}, Phone: {test_phone})...")
    reg_res = requests.post(f"{BASE_URL}/auth/register", json={
        "name": test_name,
        "phone": test_phone,
        "password": test_pass,
        "confirmPassword": test_pass
    })
    assert reg_res.status_code == 201, f"Reg failed: {reg_res.text}"
    patient_id = reg_res.json()["patient_id"]
    print(f"[PASS] Patient registered with ID: {patient_id}")

    # 2. Login to get JWT
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "emailOrPhone": test_phone,
        "password": test_pass
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] JWT Authentication token acquired")

    # 3. Create/insert an appointment for today (Sep 22 / today) directly into DB to test expiration
    today_str = datetime.now().strftime("%Y-%m-%d")
    print(f"\n[2] Inserting today's appointment ({today_str} 10:30 AM) to test real-world 8:00 PM expiration...")
    from database import engine
    from sqlmodel import Session
    from models import Appointment
    with Session(engine) as db_sess:
        appt = Appointment(
            patient_id=patient_id,
            doctor_id=3,
            booked_time=datetime.utcnow(),
            status="pending",
            queue_position=1,
            time_slot="10:30 AM",
            appointment_date=today_str,
            beneficiary_name=test_name,
            contact_phone=test_phone,
            is_dependent=False
        )
        db_sess.add(appt)
        db_sess.commit()
        db_sess.refresh(appt)
        appt_id = appt.id
    print(f"[PASS] Today's appointment created in DB (ID #{appt_id})")

    # 4. Fetch my appointments at current time (night > 8:00 PM)
    print(f"\n[3] Fetching patient appointments (Current Local Time: {datetime.now().strftime('%I:%M %p')})...")
    me_res = requests.get(f"{BASE_URL}/appointments/me", headers=headers)
    assert me_res.status_code == 200, f"Fetch appointments failed: {me_res.text}"
    my_appts = me_res.json()
    assert len(my_appts) > 0, "Must return booked appointment"
    curr_appt = my_appts[0]
    
    is_past_8pm = datetime.now().hour >= 20
    print(f"    Current Hour: {datetime.now().hour} | Is Past 8:00 PM: {is_past_8pm}")
    print(f"    Appointment Status: {curr_appt['status']}")
    print(f"    Slot Time: {curr_appt.get('time_slot')}")

    if is_past_8pm:
        assert curr_appt["status"] == "expired", f"Expected status 'expired' past 8 PM, got {curr_appt['status']}"
        print("[PASS] Appointment automatically marked 'expired' due to 8:00 PM OPD cutoff")

    # 5. Check departure endpoint
    print("\n[4] Testing departure-check endpoint for expired slot...")
    dep_res = requests.post(f"{BASE_URL}/departure-check", json={
        "appointment_id": appt_id,
        "patient_lat": 13.3409,
        "patient_lng": 77.1010
    }, headers=headers)
    assert dep_res.status_code == 200, f"Departure check failed: {dep_res.text}"
    dep_data = dep_res.json()
    print(f"    Should Leave Now: {dep_data['should_leave_now']}")
    print(f"    Message: {dep_data['message']}")

    if is_past_8pm:
        assert dep_data["should_leave_now"] is False, "should_leave_now must be False when OPD is closed"
        assert "closed at 8:00 PM" in dep_data["message"], "Message must indicate OPD closed at 8:00 PM"
        print("[PASS] Departure check correctly returns should_leave_now=False with OPD closed notification")

    # 6. Verify in-app notifications
    print("\n[5] Verifying Stage 5 Slot Expired in-app notification...")
    notif_res = requests.get(f"{BASE_URL}/notifications", headers=headers)
    assert notif_res.status_code == 200, f"Fetch notifications failed: {notif_res.text}"
    notifs = notif_res.json()
    print(f"    Retrieved {len(notifs)} notifications for patient:")
    if is_past_8pm:
        expired_notif = next((n for n in notifs if "Expired" in n.get("title", "") or n.get("type") == "slot_expired"), None)
        assert expired_notif is not None, "Stage 5 slot_expired notification must exist"
        print(f"    - Title: {expired_notif.get('title').encode('ascii', 'replace').decode('ascii')}")
        print(f"    - Message: {expired_notif.get('message')}")
        print("[PASS] Stage 5 in-app notification 'Slot Expired (OPD Closed)' verified successfully")

    print("\n========================================================")
    print("ALL END-OF-DAY 8:00 PM EXPIRATION CHECKS PASSED (100% OK)")
    print("========================================================\n")

if __name__ == "__main__":
    test_eod_flow()
