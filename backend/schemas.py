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

from pydantic import BaseModel, EmailStr


# ---------------------------------------------------------------------
# SIGNUP
# ---------------------------------------------------------------------

class PatientSignupRequest(BaseModel):
    """What the client must send us to create a new patient account."""
    name: str
    phone: str
    email: EmailStr  # Pydantic automatically validates this looks like a real email
    password: str    # plain password, ONLY exists in memory briefly before we hash it


class PatientResponse(BaseModel):
    """
    What we send BACK after signup/login. Notice: no password_hash field.
    This is the whole point of having a separate response schema.
    """
    id: int
    name: str
    phone: str
    email: str


# ---------------------------------------------------------------------
# LOGIN
# ---------------------------------------------------------------------

class LoginRequest(BaseModel):
    """What the client sends us to log in."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """What we send back after a successful login — the JWT access pass."""
    access_token: str
    token_type: str = "bearer"  # standard JWT convention, tells the client how to use the token
    
    
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
    doctor_id: int


class AppointmentResponse(BaseModel):
    """What we send back after booking, or when listing a patient's appointments."""
    id: int
    patient_id: int
    doctor_id: int
    booked_time: datetime
    status: str
    queue_position: int | None
    
# ---------------------------------------------------------------------
# QUEUE STATUS
# ---------------------------------------------------------------------

class QueueStatusResponse(BaseModel):
    """What we send back when a patient checks their live queue position."""
    appointment_id: int
    doctor_id: int
    queue_position: int
    patients_ahead: int
    
# ---------------------------------------------------------------------
# WAIT-TIME PREDICTION (ML)
# ---------------------------------------------------------------------

class PredictWaitRequest(BaseModel):
    """
    What's needed to predict a wait time. In Phase 3 we're testing this
    standalone; later (Phase 4+) most of these values will be looked up
    automatically from the doctor/appointment records instead of the
    client having to supply them manually.
    """
    doctor_id: str
    department: str
    doctor_avg_consult_minutes: int
    day_of_week: str
    hour_of_day: int
    queue_length_ahead: int
    patient_type: str


class PredictWaitResponse(BaseModel):
    predicted_minutes: float
    range_low: float
    range_high: float
    explanation: str
    
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
    appointmentDate: str | None = None
    appointmentTime: str | None = None
    symptoms: str | None = None


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


class CalculateDepartureRequest(BaseModel):
    appointment_id: int
    patient_lat: float | None = None
    patient_lng: float | None = None
    patient_latitude: float | None = None
    patient_longitude: float | None = None
    buffer_minutes: int | None = 0


class PredictArrivalResponse(BaseModel):
    recommendedLeaveInMinutes: float
    trafficDelayMinutes: int
    queueWaitMinutes: float
    distanceKm: float
    trafficCondition: str
    weather: str
    optimalDepartureTime: str
    estimatedArrivalTime: str
    should_leave_now: bool
    message: str


class NotificationItem(BaseModel):
    id: int
    title: str
    message: str
    timestamp: str
    read: bool
    type: str  # 'alert', 'info', 'warning', 'emergency'


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
    status: str  # 'Active', 'On Break', 'Delayed'
    avg_consult_minutes: int | None = None


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
