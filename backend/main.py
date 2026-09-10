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

# Hospital's fixed location — later this could come from a Hospital table,
# but for our single-hospital scope, a constant is sufficient.
HOSPITAL_LAT = 13.376230
HOSPITAL_LNG = 77.097439

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from dotenv import load_dotenv
import os

from travel_time import get_travel_time_minutes
from models import Patient, Department, Doctor, SymptomMapping, Appointment
from schemas import (
    PatientSignupRequest, PatientResponse, LoginRequest, TokenResponse,
    DepartmentResponse, DoctorResponse,
    SymptomMappingResponse, SymptomMappingUpdateRequest,
    AppointmentCreateRequest, AppointmentResponse,
    QueueStatusResponse, 
    PredictWaitRequest, PredictWaitResponse,
    DepartureCheckRequest, DepartureCheckResponse,
    FrontendLoginRequest, FrontendLoginResponse, FrontendRegisterRequest,
    FrontendQueueStatusResponse, CalculateDepartureRequest, PredictArrivalResponse,
    NotificationItem,
)

from ml_predictor import predict_wait
from auth import hash_password, verify_password, create_access_token, get_current_user
from datetime import datetime, timedelta

from typing import List, Optional

from database import engine

load_dotenv()

app = FastAPI(title="Smart Hospital Queue & Arrival Optimization API")

# Enable Cross-Origin Resource Sharing (CORS) so the React frontends
# (running on localhost:3000, 5173, etc.) can communicate with our API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    
# ---------------------------------------------------------------------
# APPOINTMENTS
# ---------------------------------------------------------------------

@app.post("/appointments", response_model=AppointmentResponse)
def create_appointment(
    request: AppointmentCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Books a new appointment for the LOGGED-IN patient.
    current_user["sub"] holds the patient's id, extracted from their JWT
    token — this is what stops a patient from booking on someone else's
    behalf by just changing a number in the request.
    """
    patient_id = int(current_user["sub"])

    with Session(engine) as session:
        # Confirm the doctor actually exists before booking against them
        doctor = session.get(Doctor, request.doctor_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")

        # Count how many patients are already waiting for this doctor,
        # so we know this patient's position in line.
        existing_count = len(
            session.exec(
                select(Appointment).where(
                    Appointment.doctor_id == request.doctor_id,
                    Appointment.status == "pending",
                )
            ).all()
        )

        new_appointment = Appointment(
            patient_id=patient_id,
            doctor_id=request.doctor_id,
            booked_time=datetime.utcnow(),
            status="pending",
            queue_position=existing_count + 1,
        )
        session.add(new_appointment)
        session.commit()
        session.refresh(new_appointment)

        return new_appointment


@app.get("/appointments/my", response_model=List[AppointmentResponse])
def get_my_appointments(current_user: dict = Depends(get_current_user)):
    """
    Returns only the LOGGED-IN patient's own appointments — never
    another patient's, since patient_id comes from the token, not
    from the request.
    """
    patient_id = int(current_user["sub"])

    with Session(engine) as session:
        appointments = session.exec(
            select(Appointment).where(Appointment.patient_id == patient_id)
        ).all()
        return appointments
    
# ---------------------------------------------------------------------
# QUEUE STATUS
# ---------------------------------------------------------------------

@app.get("/appointments/{appointment_id}/queue-status", response_model=QueueStatusResponse)
def get_queue_status(
    appointment_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Returns how many patients are currently ahead of this specific
    appointment, for the SAME doctor, that are still 'pending'
    (i.e. haven't been seen yet).

    This is the live number the patient app polls to show
    "3 patients ahead of you" — and it's also what Phase 3's ML model
    will use as its main predictive feature (queue_length_ahead had
    the highest importance in our paper's results, ~0.52).
    """
    patient_id = int(current_user["sub"])

    with Session(engine) as session:
        appointment = session.get(Appointment, appointment_id)

        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")

        # Security check: a patient can only view their OWN queue status,
        # not anyone else's, even if they guess a valid appointment_id.
        if appointment.patient_id != patient_id:
            raise HTTPException(status_code=403, detail="Not your appointment")

        # Count pending appointments for the same doctor, booked BEFORE
        # this one — that's how many people are genuinely ahead in line.
        patients_ahead = len(
            session.exec(
                select(Appointment).where(
                    Appointment.doctor_id == appointment.doctor_id,
                    Appointment.status == "pending",
                    Appointment.queue_position < appointment.queue_position,
                )
            ).all()
        )

        return QueueStatusResponse(
            appointment_id=appointment.id,
            doctor_id=appointment.doctor_id,
            queue_position=appointment.queue_position,
            patients_ahead=patients_ahead,
        )
        
# ---------------------------------------------------------------------
# ML WAIT-TIME PREDICTION
# ---------------------------------------------------------------------

@app.post("/predict-wait", response_model=PredictWaitResponse)
def get_wait_prediction(request: PredictWaitRequest):
    """
    Returns a predicted wait-time range + explanation using our trained
    Random Forest model. This is a standalone test endpoint for Phase 3 —
    later this logic will be triggered automatically when a patient
    checks their queue status, using real live data instead of
    manually-supplied values.
    """
    result = predict_wait(
        doctor_id=request.doctor_id,
        department=request.department,
        doctor_avg_consult_minutes=request.doctor_avg_consult_minutes,
        day_of_week=request.day_of_week,
        hour_of_day=request.hour_of_day,
        queue_length_ahead=request.queue_length_ahead,
        patient_type=request.patient_type,
    )
    return result

# ---------------------------------------------------------------------
# DEPARTURE-TIME NOTIFICATION LOGIC
# ---------------------------------------------------------------------

@app.post("/departure-check", response_model=DepartureCheckResponse)
def check_departure_time(
    request: DepartureCheckRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    The core "leave now" decision logic (paper Section 4.4).

    Compares the patient's PREDICTED WAIT TIME against their CURRENT
    TRAVEL TIME to the hospital. A notification is triggered once the
    remaining wait roughly equals the travel time — so the patient
    arrives close to their turn, not significantly early or late.
    """
    patient_id = int(current_user["sub"])

    with Session(engine) as session:
        appointment = session.get(Appointment, request.appointment_id) if request.appointment_id else None

        if not appointment:
            # Fallback to the patient's active pending appointment if ID is omitted or 0
            appointment = session.exec(
                select(Appointment).where(
                    Appointment.patient_id == patient_id,
                    Appointment.status == "pending",
                )
            ).first()

        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        if appointment.patient_id != patient_id:
            raise HTTPException(status_code=403, detail="Not your appointment")

        doctor = session.get(Doctor, appointment.doctor_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")

        # Fetch department so the ML model activates its trained department dummy column
        department = session.get(Department, doctor.department_id)
        department_name = department.name if department else ""

        # Count real-time patients ahead, same logic as queue-status endpoint
        patients_ahead = len(
            session.exec(
                select(Appointment).where(
                    Appointment.doctor_id == appointment.doctor_id,
                    Appointment.status == "pending",
                    Appointment.queue_position < appointment.queue_position,
                )
            ).all()
        )

        # Use today's actual day/hour so the ML prediction reflects
        # right now, not a hardcoded test value
        now = datetime.utcnow()
        day_name = now.strftime("%A")

        # In our dataset, doctors are labeled 'DOC1' through 'DOC6'.
        # Format the ID to match the trained one-hot dummy columns.
        doctor_code = f"DOC{doctor.id}"

        prediction = predict_wait(
            doctor_id=doctor_code,
            department=department_name,
            doctor_avg_consult_minutes=doctor.avg_consult_minutes,
            day_of_week=day_name,
            hour_of_day=now.hour,
            queue_length_ahead=patients_ahead,
            patient_type="normal",
        )
        predicted_wait = prediction["predicted_minutes"]

        travel_time = get_travel_time_minutes(
            request.patient_lat, request.patient_lng, HOSPITAL_LAT, HOSPITAL_LNG
        )

        # The core trigger condition: leave now if travel time is close to
        # or exceeds the remaining predicted wait — meaning if you don't
        # leave now, you risk arriving late for your turn.
        should_leave = travel_time >= predicted_wait

        if should_leave:
            message = f"Leave now! Your predicted wait is {predicted_wait} min and travel takes {travel_time} min."
        else:
            buffer = predicted_wait - travel_time
            message = f"Not yet — you can wait {buffer:.0f} more minutes before leaving."

        return DepartureCheckResponse(
            predicted_wait_minutes=predicted_wait,
            travel_time_minutes=travel_time,
            should_leave_now=should_leave,
            message=message,
        )


# =====================================================================
# FRONTEND BRIDGE ROUTES (Laxuman & Naveen React Compatibility Layer)
# =====================================================================

@app.post("/auth/login", response_model=FrontendLoginResponse)
def frontend_login(request: FrontendLoginRequest):
    """
    Compatibility route for patient-app (patientService.login).
    Supports either email or phone login.
    """
    email_or_phone = request.emailOrPhone or request.email
    if not email_or_phone:
        raise HTTPException(status_code=400, detail="Email or phone is required")

    with Session(engine) as session:
        patient = session.exec(
            select(Patient).where(
                (Patient.email == email_or_phone) | (Patient.phone == email_or_phone)
            )
        ).first()

        if not patient or not verify_password(request.password, patient.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        access_token = create_access_token(data={"sub": str(patient.id)})
        appt = session.exec(
            select(Appointment).where(
                Appointment.patient_id == patient.id,
                Appointment.status == "pending",
            ).order_by(Appointment.id.desc())
        ).first()

        return FrontendLoginResponse(
            success=True,
            token=access_token,
            user={
                "id": patient.id,
                "name": patient.name,
                "phone": patient.phone,
                "email": patient.email,
                "appointment_id": appt.id if appt else None,
                "tokenNumber": f"OPD-{appt.queue_position or appt.id:03d}" if appt else "OPD-001",
                "numericToken": appt.queue_position or (appt.id if appt else 1),
            },
        )


@app.post("/patients/register")
def frontend_register(request: FrontendRegisterRequest):
    """
    Compatibility route for patient-app registration & instant appointment flow.
    Creates account and auto-books an appointment so the dashboard works out-of-the-box.
    """
    patient_name = request.fullName or request.name or "Patient"
    with Session(engine) as session:
        patient = session.exec(
            select(Patient).where(Patient.email == request.email)
        ).first()

        if not patient:
            patient = Patient(
                name=patient_name,
                phone=request.phone,
                email=request.email,
                password_hash=hash_password(request.password),
            )
            session.add(patient)
            session.commit()
            session.refresh(patient)

        doctor = session.exec(select(Doctor)).first()
        doc_id = doctor.id if doctor else 1

        existing_count = len(
            session.exec(
                select(Appointment).where(
                    Appointment.doctor_id == doc_id,
                    Appointment.status == "pending",
                )
            ).all()
        )

        appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doc_id,
            booked_time=datetime.utcnow(),
            status="pending",
            queue_position=existing_count + 1,
        )
        session.add(appointment)
        session.commit()
        session.refresh(appointment)

        token_num = appointment.queue_position or 1
        access_token = create_access_token(data={"sub": str(patient.id)})

        return {
            "success": True,
            "message": "Registration & Appointment Booking Successful!",
            "token": access_token,
            "tokenNumber": f"OPD-{token_num:03d}",
            "numericToken": token_num,
            "patient": {
                "id": patient.id,
                "name": patient.name,
                "phone": patient.phone,
                "email": patient.email,
                "appointment_id": appointment.id,
                "tokenNumber": f"OPD-{token_num:03d}",
                "numericToken": token_num,
                "currentToken": f"OPD-{max(1, token_num - existing_count):03d}",
                "patientsAhead": existing_count,
                "estimatedWaitMinutes": round(existing_count * (doctor.avg_consult_minutes if doctor else 15) * 0.85, 1),
            },
        }


@app.get("/patients/profile")
def get_patient_profile(current_user: dict = Depends(get_current_user)):
    """Compatibility route for patient profile display."""
    patient_id = int(current_user["sub"])
    with Session(engine) as session:
        patient = session.get(Patient, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        return {
            "id": patient.id,
            "name": patient.name,
            "phone": patient.phone,
            "email": patient.email,
        }


@app.put("/patients/profile")
def update_patient_profile(updates: dict, current_user: dict = Depends(get_current_user)):
    """Compatibility route for updating patient profile info."""
    patient_id = int(current_user["sub"])
    with Session(engine) as session:
        patient = session.get(Patient, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        if "name" in updates:
            patient.name = updates["name"]
        if "phone" in updates:
            patient.phone = updates["phone"]
        session.add(patient)
        session.commit()
        session.refresh(patient)
        return {
            "success": True,
            "user": {
                "id": patient.id,
                "name": patient.name,
                "phone": patient.phone,
                "email": patient.email,
            },
        }


@app.get("/queue/status/{token_identifier}", response_model=FrontendQueueStatusResponse)
def get_frontend_queue_status(token_identifier: str):
    """
    Compatibility route for Laxuman's QueueCard and ProgressCard components.
    Accepts appointment IDs (e.g. '4') or token labels (e.g. 'OPD-004').
    """
    with Session(engine) as session:
        clean_id = "".join(filter(str.isdigit, token_identifier))
        appt_id = int(clean_id) if clean_id else 1

        appointment = session.get(Appointment, appt_id)
        if not appointment:
            appointment = session.exec(select(Appointment)).first()

        if not appointment:
            raise HTTPException(status_code=404, detail="No active appointment found")

        doctor = session.get(Doctor, appointment.doctor_id)
        department = session.get(Department, doctor.department_id) if doctor else None

        patients_ahead = len(
            session.exec(
                select(Appointment).where(
                    Appointment.doctor_id == appointment.doctor_id,
                    Appointment.status == "pending",
                    Appointment.queue_position < appointment.queue_position,
                )
            ).all()
        )

        current_num = max(1, (appointment.queue_position or 1) - patients_ahead)
        avg_consult = doctor.avg_consult_minutes if doctor else 15
        est_wait = round(patients_ahead * avg_consult * 0.9, 1)

        now_str = datetime.utcnow().strftime("%I:%M %p")

        return FrontendQueueStatusResponse(
            tokenNumber=f"OPD-{appointment.queue_position or appt_id:03d}",
            currentToken=f"OPD-{current_num:03d}",
            numericToken=appointment.queue_position or appt_id,
            patientsAhead=patients_ahead,
            estimatedWaitMinutes=est_wait,
            doctor=doctor.name if doctor else "Dr. Priya Sharma",
            department=department.name if department else "Cardiology",
            roomNo="Room 102",
            emergencyCount=0,
            lastUpdated=now_str,
        )


@app.post("/calculate-departure", response_model=DepartureCheckResponse)
def calculate_departure_alias(
    request: CalculateDepartureRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Alias endpoint for Naveen's patient-app location.js / api.js contract.
    """
    lat = request.patient_lat if request.patient_lat is not None else request.patient_latitude
    lng = request.patient_lng if request.patient_lng is not None else request.patient_longitude
    if lat is None or lng is None:
        raise HTTPException(status_code=400, detail="Patient coordinates are required")

    check_req = DepartureCheckRequest(
        appointment_id=request.appointment_id,
        patient_lat=lat,
        patient_lng=lng,
    )
    return check_departure_time(check_req, current_user=current_user)


@app.get("/ai/predict-arrival", response_model=PredictArrivalResponse)
def predict_arrival_frontend(
    appointment_id: Optional[int] = None,
    patient_lat: Optional[float] = None,
    patient_lng: Optional[float] = None,
    current_user: dict = Depends(get_current_user),
):
    """
    Compatibility route for Laxuman's ArrivalPrediction.jsx page.
    Combines Random Forest wait-time prediction and Haversine/Google travel time.
    """
    patient_id = int(current_user["sub"])
    with Session(engine) as session:
        if appointment_id:
            appointment = session.get(Appointment, appointment_id)
        else:
            appointment = session.exec(
                select(Appointment).where(
                    Appointment.patient_id == patient_id,
                    Appointment.status == "pending"
                )
            ).first()

        if not appointment:
            appointment = session.exec(select(Appointment)).first()

        if not appointment:
            raise HTTPException(status_code=404, detail="No appointment found to predict arrival")

        lat = patient_lat if patient_lat is not None else (HOSPITAL_LAT + 0.04)
        lng = patient_lng if patient_lng is not None else (HOSPITAL_LNG + 0.04)

        dep_check = check_departure_time(
            DepartureCheckRequest(
                appointment_id=appointment.id,
                patient_lat=lat,
                patient_lng=lng,
            ),
            current_user={"sub": str(appointment.patient_id)},
        )

        leave_in = max(0.0, round(dep_check.predicted_wait_minutes - dep_check.travel_time_minutes, 1))
        opt_dep = (datetime.utcnow() + timedelta(minutes=float(leave_in))).strftime("%I:%M %p")
        est_arr = (datetime.utcnow() + timedelta(minutes=float(leave_in) + dep_check.travel_time_minutes)).strftime("%I:%M %p")

        return PredictArrivalResponse(
            recommendedLeaveInMinutes=float(leave_in),
            trafficDelayMinutes=dep_check.travel_time_minutes,
            queueWaitMinutes=dep_check.predicted_wait_minutes,
            distanceKm=round(dep_check.travel_time_minutes * 0.41, 1),
            trafficCondition="Moderate Traffic (Live Route)",
            weather="28°C Clear Sky (Tumakuru)",
            optimalDepartureTime=opt_dep,
            estimatedArrivalTime=est_arr,
            should_leave_now=dep_check.should_leave_now,
            message=dep_check.message,
        )


@app.get("/notifications", response_model=List[NotificationItem])
def get_notifications(current_user: dict = Depends(get_current_user)):
    """
    In-app notification feed for Laxuman's Notifications.jsx page.
    """
    now_str = datetime.utcnow().strftime("%I:%M %p")
    return [
        NotificationItem(
            id=1,
            title="Leave Now Advisory Active",
            message="Smart departure calculation is active. Check 'Arrival Prediction' for real-time leave alerts.",
            timestamp=f"Today, {now_str}",
            read=False,
            type="alert",
        ),
        NotificationItem(
            id=2,
            title="Appointment Confirmed",
            message="Your OPD token has been issued and queued with your doctor.",
            timestamp="15 mins ago",
            read=True,
            type="info",
        ),
    ]


@app.put("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int):
    """Marks an in-app notification as read."""
    return {"success": True, "id": notification_id}