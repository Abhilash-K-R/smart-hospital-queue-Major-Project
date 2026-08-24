"""
backend/seed.py
-------------
Inserts sample/dummy data into every table, so we can confirm the whole
schema actually works end-to-end (not just that empty tables exist).

IMPORTANT — INSERT ORDER MATTERS:
Tables with foreign keys MUST be inserted AFTER the tables they point to.
Example: Doctor references Department, so Department must be inserted first,
otherwise Postgres will reject the insert with a foreign key error.

Order used here:
    1. Department      (no dependencies)
    2. Doctor           (depends on Department)
    3. Patient          (no dependencies)
    4. SymptomMapping   (depends on Department)
    5. StaffUser        (no dependencies)
    6. Appointment      (depends on Patient, Doctor)
    7. QueueLog         (depends on Appointment)

Owner: Anjanadri (Phase 1)

HOW TO RUN:
    (venv) PS ...\backend> python seed.py

NOTE: Running this multiple times will insert duplicate rows, since we
aren't checking for existing data yet. That's fine for now during testing —
just something to be aware of.
"""

from sqlmodel import Session
from datetime import datetime

from database import engine
from models import (
    Department,
    Doctor,
    Patient,
    SymptomMapping,
    StaffUser,
    Appointment,
    QueueLog,
)


def seed_data():
    # A "Session" is how we talk to the database for actual data
    # (as opposed to `engine`, which just holds the connection itself).
    with Session(engine) as session:

        # ---- 1. Department (no foreign keys, insert first) ----
        cardiology = Department(name="Cardiology")
        general_medicine = Department(name="General Medicine")
        session.add(cardiology)
        session.add(general_medicine)
        session.commit()  # commit now so cardiology.id and general_medicine.id are generated

        # Refresh objects so we can read their auto-generated IDs
        session.refresh(cardiology)
        session.refresh(general_medicine)

        # ---- 2. Doctor (depends on Department) ----
        doctor1 = Doctor(
            name="Dr. Priya Sharma",
            department_id=cardiology.id,
            avg_consult_minutes=15,
        )
        doctor2 = Doctor(
            name="Dr. Arjun Rao",
            department_id=general_medicine.id,
            avg_consult_minutes=10,
        )
        session.add(doctor1)
        session.add(doctor2)
        session.commit()
        session.refresh(doctor1)
        session.refresh(doctor2)

        # ---- 3. Patient (no foreign keys) ----
        patient1 = Patient(
            name="Ravi Kumar",
            phone="9876543210",
            email="ravi@example.com",
            password_hash="dummy_hashed_password",  # NEVER store real plain passwords
        )
        session.add(patient1)
        session.commit()
        session.refresh(patient1)

        # ---- 4. SymptomMapping (depends on Department) ----
        symptom1 = SymptomMapping(symptom_name="Chest Pain", department_id=cardiology.id)
        symptom2 = SymptomMapping(symptom_name="Fever", department_id=general_medicine.id)
        session.add(symptom1)
        session.add(symptom2)
        session.commit()

        # ---- 5. StaffUser (no foreign keys) ----
        staff1 = StaffUser(name="Reception Desk 1", role="receptionist", hospital_id=1)
        session.add(staff1)
        session.commit()

        # ---- 6. Appointment (depends on Patient, Doctor) ----
        appointment1 = Appointment(
            patient_id=patient1.id,
            doctor_id=doctor1.id,
            booked_time=datetime.utcnow(),
            status="pending",
            queue_position=1,
        )
        session.add(appointment1)
        session.commit()
        session.refresh(appointment1)

        # ---- 7. QueueLog (depends on Appointment) ----
        queuelog1 = QueueLog(
            appointment_id=appointment1.id,
            predicted_wait=12.5,
            actual_wait=None,  # not filled yet — consultation hasn't happened
        )
        session.add(queuelog1)
        session.commit()

        print("Seed data inserted successfully across all 7 tables.")


if __name__ == "__main__":
    seed_data()