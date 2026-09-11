"""
backend/test_departure_check.py
------------------------------
End-to-end verification script for Phase 4's /departure-check endpoint.

Tests:
  1. Patient creation and password hashing (auth layer).
  2. JWT token generation and verification.
  3. Real database appointment lookup and queue position calculation.
  4. /departure-check with nearby coordinates (should_leave_now == False).
  5. /departure-check with distant coordinates (should_leave_now == True).
  6. Security check: cross-patient appointment ownership check (403).

Owner: Abhilash (Phase 4 Verification)
"""

import uuid
from datetime import datetime
from sqlmodel import Session, select
from database import engine
from models import Patient, Doctor, Appointment, Department
from auth import hash_password, create_access_token, verify_access_token
from schemas import DepartureCheckRequest
from main import check_departure_time, HOSPITAL_LAT, HOSPITAL_LNG
from fastapi import HTTPException


def run_tests():
    print("=" * 60)
    print("STARTING /departure-check END-TO-END VERIFICATION")
    print("=" * 60)

    unique_suffix = uuid.uuid4().hex[:6]
    test_email = f"patient_{unique_suffix}@test.com"
    test_password = "password123"

    with Session(engine) as session:
        # 1. Setup Patient
        print(f"\n[1/6] Creating test patient: {test_email}...")
        patient = Patient(
            name=f"Test Patient {unique_suffix}",
            phone="9876500000",
            email=test_email,
            password_hash=hash_password(test_password),
        )
        session.add(patient)
        session.commit()
        session.refresh(patient)
        print(f"  -> Patient saved in Neon DB with ID: {patient.id}")

        # 2. Verify Doctor and Department
        print("\n[2/6] Verifying Doctor 1 and Department...")
        doctor = session.get(Doctor, 1)
        assert doctor is not None, "Doctor with ID 1 should exist in DB (seeded in Phase 1)"
        dept = session.get(Department, doctor.department_id)
        print(f"  -> Doctor: {doctor.name}, Department: {dept.name if dept else 'Unknown'}, Avg Consult: {doctor.avg_consult_minutes}m")

        # 3. Create Appointment
        print("\n[3/6] Booking appointment for patient with Doctor 1...")
        appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doctor.id,
            booked_time=datetime.utcnow(),
            status="pending",
            queue_position=2,
        )
        session.add(appointment)
        session.commit()
        session.refresh(appointment)
        print(f"  -> Appointment created with ID: {appointment.id} (queue position: 2)")

        # 4. Generate & Verify JWT Token
        token = create_access_token(data={"sub": str(patient.id)})
        token_payload = verify_access_token(token)
        current_user = token_payload
        print(f"  -> JWT Token successfully created & verified for sub={token_payload['sub']}")

        # 5. Test Case A: Nearby patient (~500m from SIET Tumakuru)
        # Coordinates very close to SIET Tumakuru (13.376230, 77.097439)
        nearby_lat = HOSPITAL_LAT + 0.003
        nearby_lng = HOSPITAL_LNG + 0.003

        print(f"\n[4/6] Testing Case A: Nearby patient (~500m from SIET Tumakuru)...")
        req_nearby = DepartureCheckRequest(
            appointment_id=appointment.id,
            patient_lat=nearby_lat,
            patient_lng=nearby_lng,
        )
        res_nearby = check_departure_time(req_nearby, current_user=current_user)
        print(f"  -> Predicted Wait: {res_nearby.predicted_wait_minutes} min")
        print(f"  -> Travel Time:    {res_nearby.travel_time_minutes} min")
        print(f"  -> Should Leave:   {res_nearby.should_leave_now}")
        print(f"  -> Message:        {res_nearby.message}")

        assert res_nearby.should_leave_now is False, "Nearby patient should NOT have to leave yet!"
        assert "Not yet" in res_nearby.message
        print("  -> PASSED: Correctly advised to wait before departing.")

        # 6. Test Case B: Far patient (~70km away, e.g. Bangalore center)
        far_lat = 12.9716
        far_lng = 77.5946

        print(f"\n[5/6] Testing Case B: Far patient (~70km away in Bangalore)...")
        req_far = DepartureCheckRequest(
            appointment_id=appointment.id,
            patient_lat=far_lat,
            patient_lng=far_lng,
        )
        res_far = check_departure_time(req_far, current_user=current_user)
        print(f"  -> Predicted Wait: {res_far.predicted_wait_minutes} min")
        print(f"  -> Travel Time:    {res_far.travel_time_minutes} min")
        print(f"  -> Should Leave:   {res_far.should_leave_now}")
        print(f"  -> Message:        {res_far.message}")

        assert res_far.should_leave_now is True, "Far patient SHOULD be told to leave now!"
        assert "Leave now!" in res_far.message
        print("  -> PASSED: Correctly triggered 'Leave now!' notification.")

        # 7. Security / Ownership Check (Cross-patient access)
        print(f"\n[6/6] Testing Security: Cross-patient ownership check...")
        unauthorized_user = {"sub": str(patient.id + 9999)}
        try:
            check_departure_time(req_nearby, current_user=unauthorized_user)
            assert False, "Should have raised HTTPException(403)"
        except HTTPException as e:
            assert e.status_code == 403, f"Expected 403, got {e.status_code}"
            print(f"  -> PASSED: Access blocked with status 403 ('{e.detail}').")

    # =====================================================================
    # =====================================================================
    # FRONTEND CANONICAL ROUTE VERIFICATION
    # =====================================================================
    from main import (
        frontend_login, frontend_register, get_patient_profile,
        get_frontend_queue_status, get_notifications
    )
    from schemas import (
        FrontendLoginRequest, FrontendRegisterRequest
    )

    print("\n" + "=" * 60)
    print("STARTING FRONTEND CANONICAL ROUTE TESTS")
    print("=" * 60)

    # 1. Test POST /auth/login
    print("\n[Canonical 1/5] Testing POST /auth/login (patientService.login)...")
    login_bridge = frontend_login(FrontendLoginRequest(emailOrPhone=test_email, password=test_password))
    assert login_bridge.success is True
    assert login_bridge.token is not None
    assert login_bridge.user["email"] == test_email
    print(f"  -> PASSED: Successfully logged in via canonical /auth/login: {login_bridge.user['name']}")

    # 2. Test POST /patients/register
    reg_email = f"quick_reg_{uuid.uuid4().hex[:5]}@test.com"
    print(f"\n[Canonical 2/5] Testing POST /patients/register (instant registration)...")
    reg_bridge = frontend_register(FrontendRegisterRequest(
        fullName="Quick Patient",
        phone="9876599999",
        email=reg_email,
        password="QuickPassword123",
        symptoms="Chest Discomfort"
    ))
    assert reg_bridge["success"] is True
    assert "tokenNumber" in reg_bridge
    print(f"  -> PASSED: Auto-registered and issued token: {reg_bridge['tokenNumber']}")

    # 3. Test GET /patients/profile
    print("\n[Canonical 3/5] Testing GET /patients/profile...")
    profile = get_patient_profile(current_user=current_user)
    assert profile["email"] == test_email
    print(f"  -> PASSED: Profile retrieved: {profile['name']} ({profile['phone']})")

    # 4. Test GET /queue/status/OPD-004
    print("\n[Canonical 4/5] Testing GET /queue/status/OPD-004 (QueueCard & ProgressCard)...")
    q_status = get_frontend_queue_status(f"OPD-{appointment.id:03d}")
    assert q_status.numericToken == appointment.queue_position
    assert q_status.doctor is not None
    assert q_status.department is not None
    print(f"  -> PASSED: Live card status: Token {q_status.tokenNumber}, Serving {q_status.currentToken}, Wait {q_status.estimatedWaitMinutes}m")

    # 5. Test Notifications Feed
    print("\n[Canonical 5/5] Testing GET /notifications feed...")
    notifs = get_notifications(current_user=current_user)
    assert len(notifs) >= 2
    print(f"  -> PASSED: {len(notifs)} notifications available in feed.")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED! Both Core and Canonical Routes are 100% verified.")
    print("=" * 60)


if __name__ == "__main__":
    run_tests()
