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
from datetime import datetime, timezone


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
    is_present: bool = Field(default=True)

    def get_effective_consult_time(self) -> int:
        """Encapsulated business logic returning doctor's average consult duration in minutes."""
        return self.avg_consult_minutes if self.avg_consult_minutes and self.avg_consult_minutes > 0 else 10


class Patient(SQLModel, table=True):
    """
    A registered patient. password_hash stores an ENCRYPTED password,
    never the real password in plain text.
    patient_uid stores the permanent, unique 6-digit public identifier (e.g. 100023).
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_uid: Optional[str] = Field(default=None, unique=True, index=True)
    name: str
    phone: str
    email: Optional[str] = Field(default="")
    password_hash: str
    avatar: Optional[str] = Field(default=None)
    age: Optional[int] = Field(default=None)
    gender: Optional[str] = Field(default="Male")
    blood_group: Optional[str] = Field(default=None)
    address: Optional[str] = Field(default=None)
    emergency_contact_name: Optional[str] = Field(default=None)
    emergency_contact_phone: Optional[str] = Field(default=None)
    allergies: Optional[str] = Field(default=None)
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

    def get_masked_phone(self) -> str:
        """Encapsulated privacy method: returns phone with first digits masked, e.g. '******3210'."""
        if not self.phone or len(self.phone) < 4:
            return "******"
        return "*" * (len(self.phone) - 4) + self.phone[-4:]

    def get_display_name(self) -> str:
        """Returns clean display name for patient profile display."""
        return self.name.strip() if self.name else "Patient"


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
    departure_notified: bool = Field(default=False)
    time_slot: Optional[str] = Field(default=None)
    appointment_date: Optional[str] = Field(default=None)
    beneficiary_name: Optional[str] = Field(default=None)
    beneficiary_age: Optional[int] = Field(default=None)
    beneficiary_gender: Optional[str] = Field(default=None)
    contact_phone: Optional[str] = Field(default=None)
    is_dependent: bool = Field(default=False)
    is_arrived: bool = Field(default=False)
    predicted_duration: Optional[int] = Field(default=30)
    symptoms: Optional[str] = Field(default=None)

    def get_token_code(self) -> str:
        """Encapsulated method returning formatted hospital token, e.g. 'OPD-012'."""
        return f"OPD-{self.id:03d}" if self.id else "OPD-000"

    def is_active(self) -> bool:
        """Returns True if appointment is currently active in the queue lifecycle."""
        return self.status in ["pending", "serving"]

    def is_emergency(self) -> bool:
        """Checks whether this appointment is an emergency triage case."""
        slot = (self.time_slot or "").lower()
        sym = (self.symptoms or "").lower()
        return "emergency" in slot or "trauma" in slot or "critical" in sym or "chest pain" in sym


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
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Notification(SQLModel, table=True):
    """
    In-app notifications for patient lifecycle events:
    - Stage 1: Booking Confirmed (success/green)
    - Stage 2: Next in Line Alert (info/blue)
    - Stage 3: Consultation Completed (success/green)
    - Stage 4: No-Show Warning (critical/red)
    - Stage 5: End-of-Day Expiration (warning/red)
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: Optional[int] = Field(default=None, foreign_key="patient.id")
    type: str = "info"
    title: str
    message: str
    severity: str = "info"  # 'success', 'info', 'warning', 'critical'
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def is_urgent(self) -> bool:
        """Returns True if notification requires immediate patient attention."""
        return self.severity in ["warning", "critical"] or self.type in ["emergency", "departure"]