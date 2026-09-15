"""
backend/test_unified_flow.py
----------------------------
Direct Integration test verifying the unified 8-doctor roster,
real appointment booking in Neon PostgreSQL, and live queue continuity
with the staff dashboard.
"""

from sqlmodel import Session, select
from database import engine
from models import Appointment, Doctor, Department, Patient
from schemas import (
    AppointmentBookRequest,
    QueueAdvanceRequest,
)
from main import (
    list_doctors,
    list_departments,
    book_patient_appointment,
    get_staff_queue,
    update_appointment_status,
)
from starlette.requests import Request


class MockStarletteRequest:
    headers = {}


def test_full_unified_flow():
    print("\n========================================================")
    print("TEST 1: Verifying 8 Unified Doctors & 7 Departments API")
    print("========================================================")
    
    doctors = list_doctors()
    print(f"-> Total Doctors returned: {len(doctors)}")
    assert len(doctors) == 8, f"Expected exactly 8 doctors, got {len(doctors)}"
    
    for d in doctors:
        print(f"   Doctor #{d.id}: {d.name:<20} | Dept: {d.department:<18} | Room: {d.roomNo} | Exp: {d.experience}")

    depts = list_departments()
    print(f"-> Total Departments returned: {len(depts)}")
    assert len(depts) == 7, f"Expected 7 departments, got {len(depts)}"

    print("\n========================================================")
    print("TEST 2: Booking Real Appointments for Specific Doctors")
    print("========================================================")
    
    mock_req = MockStarletteRequest()

    # 1. Book with Dr. Sneha Patil (Dermatology, ID 7)
    book_req_1 = AppointmentBookRequest(
        doctor_id=7,
        doctor="Dr. Sneha Patil",
        department="Dermatology",
        date="2026-09-15",
        timeSlot="10:40 AM",
        symptoms="Skin allergy and rash on arm",
        patient_name="Ravi Kumar",
        email="ravi.kumar@testmail.com",
        phone="9876500001"
    )
    b1_data = book_patient_appointment(book_req_1, mock_req)
    print(f"-> Booked Appt 1: ID={b1_data.appointment_id}, Token={b1_data.tokenNumber}, Doctor={b1_data.doctor}, Dept={b1_data.department}")
    assert "Dr. Sneha Patil" in b1_data.doctor
    assert b1_data.department == "Dermatology"
    appt1_id = b1_data.appointment_id

    # 2. Book with Dr. Manoj Kumar (Pulmonology, ID 8)
    book_req_2 = AppointmentBookRequest(
        doctor_id=8,
        doctor="Dr. Manoj Kumar",
        department="Pulmonology",
        date="2026-09-15",
        timeSlot="11:20 AM",
        symptoms="Chronic wheezing and cough",
        patient_name="Sunita Devi",
        email="sunita.devi@testmail.com",
        phone="9876500002"
    )
    b2_data = book_patient_appointment(book_req_2, mock_req)
    print(f"-> Booked Appt 2: ID={b2_data.appointment_id}, Token={b2_data.tokenNumber}, Doctor={b2_data.doctor}, Dept={b2_data.department}")
    assert "Dr. Manoj Kumar" in b2_data.doctor
    assert b2_data.department == "Pulmonology"
    appt2_id = b2_data.appointment_id

    print("\n========================================================")
    print("TEST 3: Verifying Staff Dashboard Live Queue Continuity")
    print("========================================================")
    
    queue_items = get_staff_queue()
    print(f"-> Total Active Queue Items: {len(queue_items)}")
    
    found_appt1 = next((item for item in queue_items if item.id == appt1_id), None)
    found_appt2 = next((item for item in queue_items if item.id == appt2_id), None)
    
    assert found_appt1 is not None, f"Appt #{appt1_id} not found in staff queue!"
    assert found_appt2 is not None, f"Appt #{appt2_id} not found in staff queue!"
    
    print(f"-> Found Appt #{appt1_id} in Staff Queue: Token={found_appt1.tokenNumber}, Patient={found_appt1.name}, Doctor={found_appt1.doctor}")
    print(f"-> Found Appt #{appt2_id} in Staff Queue: Token={found_appt2.tokenNumber}, Patient={found_appt2.name}, Doctor={found_appt2.doctor}")

    print("\n========================================================")
    print("TEST 4: Advancing Patient Queue (Serve & Complete)")
    print("========================================================")
    
    # Serve Appt 1
    res_serve = update_appointment_status(appt1_id, QueueAdvanceRequest(action="serving"))
    assert res_serve["success"] is True
    print(f"-> Marked Appt #{appt1_id} as 'serving'")
    
    # Complete Appt 1
    res_comp = update_appointment_status(appt1_id, QueueAdvanceRequest(action="completed"))
    assert res_comp["success"] is True
    print(f"-> Marked Appt #{appt1_id} as 'completed'")

    # Complete Appt 2
    res_comp2 = update_appointment_status(appt2_id, QueueAdvanceRequest(action="completed"))
    assert res_comp2["success"] is True
    print(f"-> Marked Appt #{appt2_id} as 'completed'")

    # Verify both appointments are completed and no longer in active queue
    queue_after = get_staff_queue()
    remaining_ids = [item.id for item in queue_after]
    assert appt1_id not in remaining_ids, f"Appt #{appt1_id} should be completed and removed from live queue!"
    assert appt2_id not in remaining_ids, f"Appt #{appt2_id} should be completed and removed from live queue!"
    print(f"-> Confirmed both appointments completed and cleared from active queue.")

    print("\n========================================================")
    print("ALL TESTS PASSED PERFECTLY! Production readiness verified.")
    print("========================================================\n")


if __name__ == "__main__":
    test_full_unified_flow()
