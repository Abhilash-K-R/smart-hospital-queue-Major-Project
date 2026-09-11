"""
backend/schemas.py
-------------
Defines the "shape" of data going IN and OUT of our API — separate from
models.py, which defines the database tables themselves.

Why separate from models.py?
  - We never want to accept or return a raw Patient database row directly,
    because that would include password_hash in API responses — a security risk.
  - Schemas let us control exactly what a request must contain and exactly
    what a response reveals.

These are called "DTOs" (Data Transfer Objects) in software engineering —
objects whose only job is carrying data between the API and the outside world.

Owner: Abhilash (Phase 2)
"""

from typing import Optional, List, Union, Dict, Any
from pydantic import BaseModel, EmailStr



    
    
# ---------------------------------------------------------------------
# DEPARTMENTS & DOCTORS
# ---------------------------------------------------------------------

class DepartmentResponse(BaseModel):
    """What we send back when listing departments."""
    id: int
    name: str


class DoctorResponse(BaseModel):
    """
    What we send back when listing doctors.
    Includes department_id so the frontend knows which department
    this doctor belongs to, without needing a second lookup.
    """
    id: int
    name: str
    department_id: int
    avg_consult_minutes: int
    department: Optional[str] = None
    roomNo: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[str] = None
    status: Optional[str] = "Active"
    delay_minutes: Optional[int] = 0

    
# ---------------------------------------------------------------------
# SYMPTOM MAPPING
# ---------------------------------------------------------------------

class SymptomMappingResponse(BaseModel):
    """What we send back when listing symptom-to-department mappings."""
    id: int
    symptom_name: str
    department_id: int


class SymptomMappingUpdateRequest(BaseModel):
    """
    What staff sends to update a mapping — e.g. moving 'stomach pain'
    from General Medicine to Gastroenterology if the hospital adds
    that department later.
    """
    symptom_name: str
    department_id: int
    
# ---------------------------------------------------------------------
# APPOINTMENTS
# ---------------------------------------------------------------------

from datetime import datetime


class AppointmentCreateRequest(BaseModel):
    """
    What the patient app sends to book an appointment.
    Notice: NO patient_id here — we get that from the logged-in user's
    token instead, so a patient can only ever book for themselves.
    """
    doctor_id: Optional[int] = None
    doctor: Optional[str] = None
    department: Optional[str] = None
    date: Optional[str] = None
    time_slot: Optional[str] = None
    symptoms: Optional[str] = None


class AppointmentResponse(BaseModel):
    """What we send back after booking, or when listing a patient's appointments."""
    id: int
    patient_id: int
    doctor_id: int
    booked_time: datetime
    status: str
    queue_position: int | None
    tokenNumber: Optional[str] = None
    doctor: Optional[str] = None
    department: Optional[str] = None
    roomNo: Optional[str] = None
    patientsAhead: Optional[int] = 0
    estimatedWaitMinutes: Optional[float] = 0.0

    

    
# ---------------------------------------------------------------------
# DEPARTURE-TIME NOTIFICATION
# ---------------------------------------------------------------------

class DepartureCheckRequest(BaseModel):
    """
    What the patient app sends to check if it's time to leave.
    Combines their live location with their appointment's predicted wait.
    """
    appointment_id: int
    patient_lat: float
    patient_lng: float


class DepartureCheckResponse(BaseModel):
    predicted_wait_minutes: float
    travel_time_minutes: int
    should_leave_now: bool
    message: str


# ---------------------------------------------------------------------
# FRONTEND BRIDGE SCHEMAS (Laxuman & Naveen UI compatibility)
# ---------------------------------------------------------------------

class FrontendLoginRequest(BaseModel):
    emailOrPhone: str | None = None
    email: str | None = None
    password: str


class FrontendLoginResponse(BaseModel):
    success: bool = True
    token: str
    user: dict


class FrontendRegisterRequest(BaseModel):
    name: str | None = None
    fullName: str | None = None
    phone: str
    email: str
    password: str = "Patient@123"
    age: int | None = None
    gender: str | None = None
    bloodGroup: str | None = None
    address: str | None = None
    emergencyContact: str | None = None
    department: str | None = None
    doctor: str | None = None
    doctor_id: int | None = None
    appointmentDate: str | None = None
    appointmentTime: str | None = None
    symptoms: str | None = None


class AppointmentBookRequest(BaseModel):
    doctor_id: Optional[int] = None
    doctor: Optional[str] = None
    department: Optional[str] = None
    date: Optional[str] = None
    time_slot: Optional[str] = None
    timeSlot: Optional[str] = None
    symptoms: Optional[str] = None
    patient_name: Optional[str] = None
    patient_id: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class AppointmentBookResponse(BaseModel):
    success: bool = True
    message: str
    appointment_id: int
    tokenNumber: str
    numericToken: int
    currentToken: str
    patientsAhead: int
    estimatedWaitMinutes: float
    doctor: str
    department: str
    roomNo: str
    booked_time: str
    patient: dict



class FrontendQueueStatusResponse(BaseModel):
    tokenNumber: str
    currentToken: str
    numericToken: int
    patientsAhead: int
    estimatedWaitMinutes: float
    doctor: str
    department: str
    roomNo: str
    emergencyCount: int
    lastUpdated: str





class NotificationItem(BaseModel):
    id: int
    title: str
    message: str
    timestamp: str
    read: bool
    type: str  # 'alert', 'info', 'warning', 'emergency'


class DispatchNotificationRequest(BaseModel):
    """
    Request model for generating dual-channel (WhatsApp + SMS) mobile departure notifications.
    Supports previewing messages by appointment_id or explicit patient parameters.
    """
    appointment_id: Optional[int] = None
    patient_name: Optional[str] = None
    phone: Optional[str] = None
    patient_lat: Optional[float] = None
    patient_lng: Optional[float] = None


class DispatchNotificationResponse(BaseModel):
    """
    Response model containing synchronized WhatsApp and SMS notification templates,
    one-click WhatsApp web/app share URL, and navigation metadata.
    """
    success: bool = True
    appointment_id: int
    tokenNumber: str
    patient_name: str
    doctor: str
    department: str
    roomNo: str
    phone: str
    travel_time_minutes: int
    predicted_wait_minutes: float
    should_leave_now: bool
    status_headline: str
    whatsapp_text: str
    sms_text: str
    whatsapp_share_url: str
    google_maps_url: str
    timestamp: str



# ---------------------------------------------------------------------
# PHASE 6: STAFF DASHBOARD & EMERGENCY QUEUE SCHEMAS
# ---------------------------------------------------------------------

class StaffLoginRequest(BaseModel):
    username: str
    password: str = "Staff@123"


class StaffLoginResponse(BaseModel):
    success: bool = True
    token: str
    user: dict


class StaffQueueItem(BaseModel):
    id: int
    patient_id: int
    name: str
    age: int | None = None
    gender: str | None = None
    triage: str  # 'Critical', 'Urgent', 'Standard'
    tokenNumber: str
    queue_position: int
    doctor_id: int
    doctor: str
    department: str
    waitTime: str
    status: str  # 'pending', 'serving', 'completed', 'skipped'
    booked_time: str


class EmergencyInsertRequest(BaseModel):
    name: str
    age: int | None = 45
    gender: str | None = "Male"
    chief_complaint: str
    doctor_id: int | None = None
    blood_pressure: str | None = "120/80"
    heart_rate: int | None = 85
    spo2: int | None = 98
    temperature: float | None = 37.0


class EmergencyInsertResponse(BaseModel):
    success: bool = True
    message: str
    appointment_id: int
    tokenNumber: str
    queue_position: int
    impacted_patients: int


class QueueAdvanceRequest(BaseModel):
    appointment_id: int | None = None
    action: str = "completed"  # 'completed', 'skipped', 'serving'


class DoctorStatusUpdateRequest(BaseModel):
    status: str = "Active"  # 'Active', 'On Break', 'Delayed'
    avg_consult_minutes: int | None = None
    delay_minutes: int | None = 0


# ---------------------------------------------------------------------
# PHASE 7: QUEUE LOGGING & MODEL EVALUATION SCHEMAS
# ---------------------------------------------------------------------

class QueueLogItem(BaseModel):
    id: int | None = None
    appointment_id: int
    predicted_wait: float
    actual_wait: float | None = None
    timestamp: str | None = None


class QueueLogResponse(BaseModel):
    total: int
    avg_actual_wait: float | None = None
    avg_predicted_wait: float | None = None
    logs: list[QueueLogItem]


class StaffStatsResponse(BaseModel):
    total_today: int
    currently_waiting: int
    avg_wait_minutes: float
    active_doctors: int
    emergency_count: int
    recent_activity: list[dict]


class SymptomAnalyzeRequest(BaseModel):
    symptoms: str


class SymptomAnalyzeResult(BaseModel):
    dept: str
    match: int
    severity: str
    description: str


class SymptomAnalyzeResponse(BaseModel):
    results: list[SymptomAnalyzeResult]
