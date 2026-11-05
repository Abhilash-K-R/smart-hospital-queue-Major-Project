import sys
import os
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
import main
from main import app, to_ist, IST
from database import engine
from sqlmodel import Session, select, text
from models import Patient, Notification

print("="*65)
print("RUNNING VERIFICATION SUITE FOR TASKS 1, 2, AND 3")
print("="*65)

# -------------------------------------------------------------
# TEST 1: TIMEZONE HANDLING & NOTIFICATION TIMESTAMP CONVERSION
# -------------------------------------------------------------
print("\n[TEST 1] Verifying Timezone Conversion (to_ist):")
utc_sample = datetime(2026, 10, 30, 4, 26, 0, tzinfo=timezone.utc)
ist_result = to_ist(utc_sample)

print(f"  Input UTC: {utc_sample.strftime('%Y-%m-%d %I:%M %p %Z')}")
print(f"  Converted IST: {ist_result.strftime('%Y-%m-%d %I:%M %p')}")
expected_time_str = "Oct 30, 09:56 AM"
actual_time_str = ist_result.strftime("%b %d, %I:%M %p")
assert actual_time_str == expected_time_str, f"Expected {expected_time_str}, got {actual_time_str}"
print(f"  [PASS] Successfully converted 04:26 AM UTC to {actual_time_str} IST!")

# -------------------------------------------------------------
# TEST 2: SEQUENTIAL 6-DIGIT PATIENT UID SYSTEM
# -------------------------------------------------------------
print("\n[TEST 2] Verifying Patient UID System:")
with Session(engine) as session:
    # Check existing patient 68
    pat_68 = session.get(Patient, 68)
    if pat_68:
        print(f"  Patient ID 68 has permanent patient_uid: {pat_68.patient_uid}")
        assert pat_68.patient_uid is not None, "Patient 68 missing UID"
        assert len(pat_68.patient_uid) >= 6, "UID should be at least 6 digits"
    
    # Check sequence
    next_seq = session.execute(text("SELECT nextval('patient_uid_seq');")).scalar()
    print(f"  Next sequential UID from sequence: {next_seq}")
    assert next_seq >= 100237, f"Sequence unexpected: {next_seq}"
    print(f"  [PASS] Patient UID sequence operating normally at {next_seq}!")

# -------------------------------------------------------------
# TEST 3: PROFILE UPDATE & PERSISTENCE
# -------------------------------------------------------------
print("\n[TEST 3] Verifying Clinical Profile Updates & DB Persistence:")
with Session(engine) as session:
    test_patient = session.exec(select(Patient).where(Patient.id == 68)).first()
    if not test_patient:
        test_patient = session.exec(select(Patient)).first()

    pid = test_patient.id
    orig_bg = test_patient.blood_group
    orig_age = test_patient.age
    print(f"  Testing with Patient ID: {pid} (UID: {test_patient.patient_uid})")

    # Simulate profile update request
    from schemas import PatientProfileUpdateRequest
    update_req = PatientProfileUpdateRequest(
        name=test_patient.name,
        phone=test_patient.phone,
        email=test_patient.email,
        age=24,
        gender="Male",
        blood_group="O+",
        address="Tumakuru, Karnataka, India",
        emergency_contact_name="Dr. Patil",
        emergency_contact_phone="9876543210",
        allergies="None reported"
    )

    fake_user_claims = {"sub": str(pid)}
    resp = main.update_patient_profile(update_req, current_user=fake_user_claims)
    
    print(f"  Profile update response success: {resp.get('success')}")
    user_resp = resp.get("user", {})
    print(f"  Returned UID: {user_resp.get('patient_uid')}")
    print(f"  Returned Blood Group: {user_resp.get('blood_group')}")
    print(f"  Returned Age: {user_resp.get('age')}")
    print(f"  Returned Emergency Contact: {user_resp.get('emergency_contact_phone')}")

    # Verify directly from DB
    session.expire_all()
    verified_patient = session.get(Patient, pid)
    assert verified_patient.blood_group == "O+", f"Expected O+, got {verified_patient.blood_group}"
    assert verified_patient.age == 24, f"Expected 24, got {verified_patient.age}"
    assert verified_patient.emergency_contact_name == "Dr. Patil"
    print(f"  [PASS] Verified persistent database write in Neon PostgreSQL for Patient {pid}!")

print("\n" + "="*65)
print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY WITH ZERO ERRORS!")
print("="*65)

