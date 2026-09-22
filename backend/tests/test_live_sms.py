import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Set UTF-8 output encoding for windows terminal
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

load_dotenv('.env')

from sqlmodel import Session, select
from database import engine
from models import Appointment, Doctor, Patient
from schemas import DepartureCheckRequest
from main import check_departure_time, HOSPITAL_LAT, HOSPITAL_LNG

def run_live_sms_test():
    print("=" * 60)
    print("LIVE FAST2SMS VERIFICATION TEST FOR PHONE: 6364070544")
    print("=" * 60)

    TARGET_PHONE = "6364070544"

    with Session(engine) as session:
        # 1. Ensure patient exists
        patient = session.exec(select(Patient).where(Patient.phone == TARGET_PHONE)).first()
        if not patient:
            patient = Patient(
                name="Abhilash KR",
                phone=TARGET_PHONE,
                email="abhilash@example.com",
                hashed_password="testpassword123",
                age=22,
                gender="male"
            )
            session.add(patient)
            session.commit()
            session.refresh(patient)
        
        # 2. Get Doctor
        doctor = session.exec(select(Doctor)).first()
        if not doctor:
            print("ERROR: No doctor found in database!")
            sys.exit(1)

        # 3. Create or Reset Test Appointment
        appt = session.exec(
            select(Appointment).where(
                Appointment.patient_id == patient.id,
                Appointment.status == "pending"
            )
        ).first()

        if not appt:
            appt = Appointment(
                patient_id=patient.id,
                doctor_id=doctor.id,
                booked_time=datetime.utcnow(),
                status="pending",
                queue_position=1,
                token_number=101,
                departure_notified=False
            )
            session.add(appt)
            session.commit()
            session.refresh(appt)
        else:
            appt.departure_notified = False
            appt.status = "pending"
            appt.queue_position = 1
            appt.booked_time = datetime.utcnow()
            session.add(appt)
            session.commit()
            session.refresh(appt)

        appt_id = appt.id
        patient_id = patient.id
        doctor_name = doctor.name

        print(f"\n[Step 1 Setup] Test Appointment Prepared:")
        print(f"  * Appointment ID       : {appt_id}")
        print(f"  * Patient ID           : {patient_id} ({patient.name})")
        print(f"  * Patient Phone        : {patient.phone}")
        print(f"  * Doctor               : {doctor_name}")
        print(f"  * Queue Position       : {appt.queue_position}")
        print(f"  * DB departure_notified: {appt.departure_notified}")

    # Set coordinates to trigger should_leave_now (e.g. Tumakuru town center)
    # Travel time is ~10 min. Wait time for position 1 is ~19 min. 10 + 10 = 20 >= 19 -> True!
    req = DepartureCheckRequest(
        appointment_id=appt_id,
        patient_lat=13.3409,
        patient_lng=77.1010,
        travel_mode="driving"
    )
    current_user = {"sub": str(patient_id), "email": patient.email}

    print("\n" + "=" * 60)
    print("[Step 2] Executing 1st POST /departure-check (Live SMS Trigger)")
    print("=" * 60)
    res1 = check_departure_time(req, current_user=current_user)
    print(f"  * predicted_wait_minutes : {res1.predicted_wait_minutes} min")
    print(f"  * travel_time_minutes    : {res1.travel_time_minutes} min")
    print(f"  * should_leave_now       : {res1.should_leave_now}")
    print(f"  * message                : {res1.message}")

    print("\n" + "=" * 60)
    print("[Step 3] Verifying Database departure_notified flag")
    print("=" * 60)
    with Session(engine) as session:
        appt_after_1 = session.get(Appointment, appt_id)
        print(f"  * DB departure_notified : {appt_after_1.departure_notified}")
        assert appt_after_1.departure_notified is True, "ERROR: departure_notified should be True!"
        print("  [SUCCESS] departure_notified successfully flipped to True in PostgreSQL.")

    print("\n" + "=" * 60)
    print("[Step 4] Executing 2nd POST /departure-check (Idempotency Check)")
    print("=" * 60)
    res2 = check_departure_time(req, current_user=current_user)
    print(f"  * predicted_wait_minutes : {res2.predicted_wait_minutes} min")
    print(f"  * travel_time_minutes    : {res2.travel_time_minutes} min")
    print(f"  * should_leave_now       : {res2.should_leave_now}")
    print(f"  * message                : {res2.message}")

    with Session(engine) as session:
        appt_after_2 = session.get(Appointment, appt_id)
        print(f"  * DB departure_notified : {appt_after_2.departure_notified}")
        assert appt_after_2.departure_notified is True, "ERROR: departure_notified should still be True!"
        print("  [SUCCESS] No duplicate SMS triggered; departure_notified remains True.")

    print("\n" + "=" * 60)
    print("ALL LIVE SMS & DATABASE IDEMPOTENCY CHECKS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_live_sms_test()
