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