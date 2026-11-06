"""
backend/tests/test_security_defenses.py
---------------------------------------
Automated defensive security regression test suite for Mediflow API.
Verifies that:
  1. Appointment cancellation & arrival enforce authentication and IDOR ownership guards.
  2. Unauthenticated access to /appointments/me and /appointments/my is rejected (401).
  3. /notifications does NOT leak cross-patient data when unauthenticated.
  4. Staff RBAC fails closed (401) on missing credentials by default.
  5. Password reset rejects backdoor / unrequested OTP attempts.
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from main import app
from auth import create_access_token
from database import engine
from sqlmodel import Session, select
from models import Patient, Appointment, Notification

client = TestClient(app)

def test_unauthenticated_appointment_cancel_rejected():
    """Verifies that an unauthenticated caller cannot cancel any appointment."""
    res = client.post("/appointments/1/cancel")
    assert res.status_code == 401, f"Expected 401 Unauthorized, got {res.status_code}: {res.text}"
    print("[PASS] test_unauthenticated_appointment_cancel_rejected")

def test_unauthenticated_appointment_arrive_rejected():
    """Verifies that an unauthenticated caller cannot mark an appointment arrived."""
    res = client.post("/appointments/1/arrive")
    assert res.status_code == 401, f"Expected 401 Unauthorized, got {res.status_code}: {res.text}"
    print("[PASS] test_unauthenticated_appointment_arrive_rejected")

def test_unauthenticated_appointments_me_rejected():
    """Verifies that unauthenticated harvesting via /appointments/me?phone=... is rejected with 401."""
    res = client.get("/appointments/me?phone=9876543210")
    assert res.status_code == 401, f"Expected 401 Unauthorized, got {res.status_code}: {res.text}"
    print("[PASS] test_unauthenticated_appointments_me_rejected")

def test_unauthenticated_notifications_feed_isolated():
    """Verifies that unauthenticated calls to /notifications return empty feed (no cross-patient leaks)."""
    res = client.get("/notifications")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert isinstance(data, list), "Expected list response"
    assert len(data) == 0, f"Expected empty list for unauthenticated user, got {len(data)} items"
    print("[PASS] test_unauthenticated_notifications_feed_isolated")

def test_staff_rbac_fails_closed():
    """Verifies that staff administrative endpoints reject unauthenticated access with 401."""
    res = client.get("/staff/queue")
    assert res.status_code == 401, f"Expected 401 Unauthorized, got {res.status_code}: {res.text}"
    print("[PASS] test_staff_rbac_fails_closed")

def test_forgot_password_rejects_unrequested_backdoor_otp():
    """Verifies that hardcoded demo OTP bypasses cannot reset passwords without an active session."""
    payload = {
        "phone": "9876543210",
        "otp": "123456",
        "newPassword": "new_secure_password_123"
    }
    res = client.post("/auth/forgot-password/reset", json=payload)
    assert res.status_code == 400, f"Expected 400 Bad Request, got {res.status_code}: {res.text}"
    assert "No active password reset request found" in res.text
    print("[PASS] test_forgot_password_rejects_unrequested_backdoor_otp")

def test_patient_idor_prevention():
    """Verifies that Patient A cannot cancel an appointment owned by Patient B."""
    with Session(engine) as session:
        appt = session.exec(select(Appointment).where(Appointment.status == "pending")).first()
        if not appt:
            appt = session.exec(select(Appointment)).first()
        
        if appt and appt.patient_id:
            target_id = appt.id
            owner_id = appt.patient_id
            
            # An attacker with different ID
            attacker_id = owner_id + 9999
            attacker_token = create_access_token({"sub": str(attacker_id), "role": "patient", "username": "Attacker"})
            attacker_headers = {"Authorization": f"Bearer {attacker_token}"}
            
            res = client.post(f"/appointments/{target_id}/cancel", headers=attacker_headers)
            assert res.status_code == 403, f"Expected 403 Forbidden for cross-patient cancellation, got {res.status_code}: {res.text}"
            print("[PASS] test_patient_idor_prevention (Blocked with 403 Forbidden)")


def test_authorized_patient_access():
    """Verifies that an authenticated patient can successfully retrieve their own appointment list."""
    token = create_access_token({"sub": "1", "role": "patient", "username": "PatientOne"})
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/appointments/me", headers=headers)
    assert res.status_code == 200, f"Expected 200 OK for authenticated patient, got {res.status_code}: {res.text}"
    assert isinstance(res.json(), list)
    print("[PASS] test_authorized_patient_access (Authorized 200 OK)")


def test_authenticated_staff_access():
    """Verifies that an authenticated staff member can access staff queue endpoints."""
    token = create_access_token({"sub": "1", "role": "admin", "username": "AdminUser"})
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/staff/queue", headers=headers)
    assert res.status_code == 200, f"Expected 200 OK for authenticated staff, got {res.status_code}: {res.text}"
    assert isinstance(res.json(), list)
    print("[PASS] test_authenticated_staff_access (Authorized 200 OK)")


if __name__ == "__main__":
    print("\n--- RUNNING SECURITY REGRESSION TESTS ---")
    test_unauthenticated_appointment_cancel_rejected()
    test_unauthenticated_appointment_arrive_rejected()
    test_unauthenticated_appointments_me_rejected()
    test_unauthenticated_notifications_feed_isolated()
    test_staff_rbac_fails_closed()
    test_forgot_password_rejects_unrequested_backdoor_otp()
    test_patient_idor_prevention()
    test_authorized_patient_access()
    test_authenticated_staff_access()
    print("\n[SUCCESS] ALL 9 DEFENSIVE SECURITY TESTS PASSED!\n")
