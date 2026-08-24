"""
backend/models.py
-------------
Defines every table in our database as a Python class (this is called an
"ORM model" — Object-Relational Mapping). Instead of writing raw SQL like
`CREATE TABLE doctors (...)`, we write a Python class and SQLModel
converts it into the real table for us.

Each class below = one table in Neon PostgreSQL.
`table=True` tells SQLModel "this is a real table, not just a data shape."

Owner: Anjanadri (Phase 1) — Reviewed by Abhilash before Phase 2 begins.
"""

from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class Department(SQLModel, table=True):
    """
    A hospital department, e.g. 'Cardiology', 'General Medicine'.
    Every doctor belongs to exactly one department.
    """
    id: Optional[int] = Field(default=None, primary_key=True)  # auto-incrementing ID
    name: str


class Doctor(SQLModel, table=True):
    """
    A doctor who works in a specific department.
    avg_consult_minutes is used later by the ML model as a prediction feature.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    department_id: int = Field(foreign_key="department.id")  # links to Department table
    avg_consult_minutes: int


class Patient(SQLModel, table=True):
    """
    A registered patient. password_hash stores an ENCRYPTED password,
    never the real password in plain text.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: str
    email: str
    password_hash: str


class SymptomMapping(SQLModel, table=True):
    """
    Maps a symptom (e.g. 'chest pain') to the department that handles it
    (e.g. Cardiology). This table is editable by hospital staff through
    the staff dashboard — NOT hardcoded in the app's logic.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    symptom_name: str
    department_id: int = Field(foreign_key="department.id")


class StaffUser(SQLModel, table=True):
    """
    A hospital staff account (receptionist, admin, etc).
    Staff accounts are pre-created by an admin — there is NO public
    signup form for staff, unlike patients.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    role: str
    hospital_id: int


class Appointment(SQLModel, table=True):
    """
    A booking made by a patient with a specific doctor.
    status examples: 'pending', 'checked_in', 'completed', 'skipped'
    queue_position is recalculated whenever the queue changes
    (e.g. emergency insertion, doctor delay).
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="patient.id")
    doctor_id: int = Field(foreign_key="doctor.id")
    booked_time: datetime
    status: str = "pending"
    queue_position: Optional[int] = None


class QueueLog(SQLModel, table=True):
    """
    Records the ML model's PREDICTED wait time vs the ACTUAL wait time
    once the consultation is done. This is the data we'll use later to
    retrain and improve the Random Forest model over time.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    appointment_id: int = Field(foreign_key="appointment.id")
    predicted_wait: float
    actual_wait: Optional[float] = None  # filled in AFTER the consultation happens
    timestamp: datetime = Field(default_factory=datetime.utcnow)