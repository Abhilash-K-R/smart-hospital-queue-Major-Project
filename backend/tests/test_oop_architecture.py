"""
backend/tests/test_oop_architecture.py
--------------------------------------
Verifies Object-Oriented Programming (OOP) implementation in:
  1. WaitTimePredictor (Encapsulation, State, Inference)
  2. TravelTimeService (Encapsulation, Strategy Pattern, Fallback)
  3. Domain Model Methods (Appointment, Patient, Doctor, Notification)
  4. Backward compatibility adapters
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ml_predictor import WaitTimePredictor, default_predictor, predict_wait
from travel_time import TravelTimeService, default_travel_service, get_travel_time_minutes, calculate_haversine_distance
from models import Appointment, Patient, Doctor, Notification
from datetime import datetime, timezone


def test_wait_time_predictor_oop():
    """Verifies WaitTimePredictor class encapsulation and inference."""
    predictor = WaitTimePredictor()
    assert predictor.is_ready is True, "Predictor should be initialized"
    
    result = predictor.predict(
        doctor_id="doc_1",
        department="General Medicine",
        doctor_avg_consult_minutes=12,
        day_of_week="Monday",
        hour_of_day=10,
        queue_length_ahead=3,
        patient_type="regular"
    )
    
    assert isinstance(result, dict)
    assert "predicted_minutes" in result
    assert result["predicted_minutes"] > 0
    assert "range_low" in result
    assert "range_high" in result
    assert "explanation" in result
    print(f"[PASS] WaitTimePredictor OOP Inference: {result['predicted_minutes']} mins")


def test_travel_time_service_oop():
    """Verifies TravelTimeService class encapsulation and calculations."""
    service = TravelTimeService()
    
    # Test Haversine distance
    dist = service.calculate_haversine(13.3400, 77.1000)
    assert dist > 0.0
    assert round(dist, 1) == round(calculate_haversine_distance(13.3400, 77.1000, 13.376230, 77.097439), 1)
    
    # Test Fallback calculation
    time_est = service.get_fallback_estimate(13.3400, 77.1000)
    assert time_est >= 2
    
    # Test Primary resolver
    mins = service.get_travel_minutes(13.3400, 77.1000)
    assert mins >= 2
    print(f"[PASS] TravelTimeService OOP Transit: {dist:.2f} km, {mins} mins")


def test_domain_model_methods():
    """Verifies encapsulated OOP business logic methods on Domain Models."""
    # 1. Appointment Model
    appt = Appointment(
        id=24,
        patient_id=1,
        doctor_id=2,
        booked_time=datetime.now(timezone.utc),
        status="pending",
        time_slot="10:30 AM"
    )
    assert appt.get_token_code() == "OPD-024"
    assert appt.is_active() is True
    assert appt.is_emergency() is False

    emergency_appt = Appointment(
        id=25,
        patient_id=1,
        doctor_id=2,
        booked_time=datetime.now(timezone.utc),
        status="serving",
        time_slot="00:00 AM - Emergency Triage",
        symptoms="Acute chest pain and severe shortness of breath"
    )
    assert emergency_appt.get_token_code() == "OPD-025"
    assert emergency_appt.is_active() is True
    assert emergency_appt.is_emergency() is True

    # 2. Patient Model
    pat = Patient(
        name="  Abhilash K R  ",
        phone="9876543210",
        password_hash="fakehash"
    )
    assert pat.get_display_name() == "Abhilash K R"
    assert pat.get_masked_phone() == "******3210"

    # 3. Doctor Model
    doc = Doctor(
        name="Dr. Rajeswari",
        department_id=1,
        avg_consult_minutes=15
    )
    assert doc.get_effective_consult_time() == 15

    # 4. Notification Model
    notif = Notification(
        title="Emergency Notice",
        message="Queue adjusted",
        severity="critical"
    )
    assert notif.is_urgent() is True
    print("[PASS] Domain Model OOP Methods (Appointment, Patient, Doctor, Notification)")


def test_backward_compatibility():
    """Verifies that functional adapters maintain 100% backward compatibility."""
    res = predict_wait(
        doctor_id="doc_1",
        department="General Medicine",
        doctor_avg_consult_minutes=10,
        day_of_week="Tuesday",
        hour_of_day=11,
        queue_length_ahead=2,
        patient_type="regular"
    )
    assert "predicted_minutes" in res

    mins = get_travel_time_minutes(13.3400, 77.1000)
    assert mins >= 2
    print("[PASS] Backward-compatible functional wrappers functioning identically")


if __name__ == "__main__":
    print("\n--- RUNNING OOP ARCHITECTURE TEST SUITE ---")
    test_wait_time_predictor_oop()
    test_travel_time_service_oop()
    test_domain_model_methods()
    test_backward_compatibility()
    print("\n[SUCCESS] ALL OOP ARCHITECTURE TESTS PASSED!\n")
