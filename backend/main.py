"""
backend/main.py
-------------
Entry point for our FastAPI backend. Defines all API routes.

Currently implemented:
  - GET  /                 → health check
  - POST /signup/patient   → create a new patient account
  - POST /login/patient    → log in, get back a JWT access token

Owner: Abhilash (Phase 2)
"""

from fastapi import FastAPI, HTTPException
from sqlmodel import Session, select
from dotenv import load_dotenv
import os

from models import Patient, Department, Doctor, SymptomMapping
from schemas import (
    PatientSignupRequest, PatientResponse, LoginRequest, TokenResponse,
    DepartmentResponse, DoctorResponse,
    SymptomMappingResponse, SymptomMappingUpdateRequest,
)

from typing import List

from database import engine
# from models import Patient
# from schemas import PatientSignupRequest, PatientResponse, LoginRequest, TokenResponse
from auth import hash_password, verify_password, create_access_token

load_dotenv()

app = FastAPI()


@app.get("/")
def read_root():
    return {"status": "alive", "db_configured": os.getenv("DATABASE_URL") is not None}


@app.post("/signup/patient", response_model=PatientResponse)
def signup_patient(request: PatientSignupRequest):
    """
    Creates a new patient account.
    Steps:
      1. Check email isn't already registered.
      2. Hash the password (never store it plain).
      3. Save the new patient row.
      4. Return the patient's public info (no password_hash).
    """
    with Session(engine) as session:
        # Check for an existing account with this email
        existing = session.exec(
            select(Patient).where(Patient.email == request.email)
        ).first()

        if existing:
            # 400 = client error, "you sent something invalid"
            raise HTTPException(status_code=400, detail="Email already registered")

        new_patient = Patient(
            name=request.name,
            phone=request.phone,
            email=request.email,
            password_hash=hash_password(request.password),
        )
        session.add(new_patient)
        session.commit()
        session.refresh(new_patient)  # loads the auto-generated id back into new_patient

        return new_patient


@app.post("/login/patient", response_model=TokenResponse)
def login_patient(request: LoginRequest):
    """
    Logs a patient in.
    Steps:
      1. Look up the patient by email.
      2. Verify their password against the stored hash.
      3. If valid, issue a JWT token they'll use for future requests.
    """
    with Session(engine) as session:
        patient = session.exec(
            select(Patient).where(Patient.email == request.email)
        ).first()

        # Deliberately vague error message — we don't tell the client WHICH
        # part was wrong (email not found vs wrong password). This is a
        # security best practice: it stops attackers from figuring out
        # which emails are registered by testing login attempts.
        if not patient or not verify_password(request.password, patient.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token = create_access_token(data={"sub": str(patient.id), "role": "patient"})
        return TokenResponse(access_token=token)
# ---------------------------------------------------------------------
# DEPARTMENTS & DOCTORS
# ---------------------------------------------------------------------

@app.get("/departments", response_model=List[DepartmentResponse])
def list_departments():
    """
    Returns every department. Used by the patient app's symptom-selection
    flow to know which departments exist, and by the staff dashboard
    when editing the symptom-to-department mapping.
    """
    with Session(engine) as session:
        departments = session.exec(select(Department)).all()
        return departments


@app.get("/doctors", response_model=List[DoctorResponse])
def list_doctors(department_id: int = None):
    """
    Returns doctors, optionally filtered by department.
    Example: GET /doctors?department_id=1 → only doctors in department 1.
    Called without a query param, GET /doctors → returns ALL doctors.

    This filtering is how the patient app shows "all doctors under the
    matched department" after a patient picks a symptom.
    """
    with Session(engine) as session:
        query = select(Doctor)
        if department_id is not None:
            query = query.where(Doctor.department_id == department_id)
        doctors = session.exec(query).all()
        return doctors
# ---------------------------------------------------------------------
# SYMPTOM MAPPING
# ---------------------------------------------------------------------

@app.get("/symptom-mapping", response_model=List[SymptomMappingResponse])
def list_symptom_mapping():
    """
    Returns every symptom-to-department mapping.
    The patient app uses this to know which department to route to
    when a patient selects a symptom like 'chest pain'.
    """
    with Session(engine) as session:
        mappings = session.exec(select(SymptomMapping)).all()
        return mappings


@app.put("/symptom-mapping/{mapping_id}", response_model=SymptomMappingResponse)
def update_symptom_mapping(mapping_id: int, request: SymptomMappingUpdateRequest):
    """
    Updates an existing symptom-to-department mapping.
    Used by staff dashboard when a hospital's department structure changes.

    NOTE: This currently has NO auth check — anyone can call it.
    We will lock this down to staff-only once we add role-based
    protection in a later cleanup pass. Flagging this now so it's
    not forgotten before final deployment.
    """
    with Session(engine) as session:
        mapping = session.get(SymptomMapping, mapping_id)

        if not mapping:
            raise HTTPException(status_code=404, detail="Symptom mapping not found")

        mapping.symptom_name = request.symptom_name
        mapping.department_id = request.department_id

        session.add(mapping)
        session.commit()
        session.refresh(mapping)

        return mapping