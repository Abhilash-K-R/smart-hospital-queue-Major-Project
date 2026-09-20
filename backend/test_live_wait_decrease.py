import main, database, models, schemas
from sqlmodel import Session, select
from datetime import datetime

def run_test():
    prior_appt_ids = []
    target_appt_id = None
    target_patient_id = None
    doc_id = None

    with Session(database.engine) as session:
        main.clear_today_queue()
        
        doctor = session.exec(select(models.Doctor).where(models.Doctor.id == 1)).first()
        if not doctor:
            doctor = session.exec(select(models.Doctor)).first()
        doc_id = doctor.id
        doc_name = doctor.name
        
        # 1. Create 6 prior pending appointments
        for i in range(1, 7):
            p = session.exec(select(models.Patient).where(models.Patient.email == f"prior_pat_{i}@test.com")).first()
            if not p:
                p = models.Patient(name=f"Prior Patient {i}", phone=f"987654321{i}", email=f"prior_pat_{i}@test.com", password_hash="hash")
                session.add(p)
                session.commit()
                session.refresh(p)
            
            appt = models.Appointment(
                patient_id=p.id,
                doctor_id=doc_id,
                booked_time=datetime.utcnow(),
                status="pending",
                queue_position=i
            )
            session.add(appt)
            session.commit()
            session.refresh(appt)
            prior_appt_ids.append(appt.id)
        
        # 2. Create Target Patient (Position 7, exactly 6 patients ahead)
        target_p = session.exec(select(models.Patient).where(models.Patient.email == "target_patient@test.com")).first()
        if not target_p:
            target_p = models.Patient(name="Target Patient Suresh", phone="9876500000", email="target_patient@test.com", password_hash="hash")
            session.add(target_p)
            session.commit()
            session.refresh(target_p)
        
        target_appt = models.Appointment(
            patient_id=target_p.id,
            doctor_id=doc_id,
            booked_time=datetime.utcnow(),
            status="pending",
            queue_position=7
        )
        session.add(target_appt)
        session.commit()
        session.refresh(target_appt)
        target_appt_id = target_appt.id
        target_patient_id = target_p.id

    print(f"Doctor: {doc_name} (ID: {doc_id})")
    print(f"Target Patient Appt ID: {target_appt_id} | Patient ID: {target_patient_id}")

    # STEP 1: Initial call with 6 patients ahead
    req_data = schemas.DepartureCheckRequest(appointment_id=target_appt_id, patient_lat=13.340881, patient_lng=77.100601)
    user_dict = {"sub": str(target_patient_id)}

    res1 = main.check_departure_time(req_data, user_dict)
    print("\n==============================")
    print("STEP 1: INITIAL STATE (6 Patients Ahead)")
    print("==============================")
    print("RAW JSON Response 1:")
    print(res1.model_dump_json(indent=2))

    # STEP 2: Mark 3 earlier appointments completed & shift queue
    with Session(database.engine) as session:
        for aid in prior_appt_ids[:3]:
            appt_to_comp = session.get(models.Appointment, aid)
            if appt_to_comp:
                appt_to_comp.status = "completed"
                appt_to_comp.queue_position = None
                session.add(appt_to_comp)
        
        # Shift remaining pending appointments forward by 3
        remaining_pending = session.exec(
            select(models.Appointment).where(
                models.Appointment.doctor_id == doc_id,
                models.Appointment.status == "pending"
            )
        ).all()
        for r_appt in remaining_pending:
            if r_appt.queue_position is not None:
                r_appt.queue_position = max(1, r_appt.queue_position - 3)
                session.add(r_appt)
        session.commit()

    # STEP 3: Re-check departure after 3 patients completed (now 3 ahead)
    res2 = main.check_departure_time(req_data, user_dict)
    print("\n==============================")
    print("STEP 2: AFTER 3 APPOINTMENTS COMPLETED (3 Patients Ahead)")
    print("==============================")
    print("RAW JSON Response 2:")
    print(res2.model_dump_json(indent=2))

    # STEP 4: Mark remaining 3 patients completed (0 patients ahead -> Target is next in line)
    with Session(database.engine) as session:
        for aid in prior_appt_ids[3:]:
            appt_to_comp = session.get(models.Appointment, aid)
            if appt_to_comp:
                appt_to_comp.status = "completed"
                appt_to_comp.queue_position = None
                session.add(appt_to_comp)
        
        target_appt_obj = session.get(models.Appointment, target_appt_id)
        if target_appt_obj:
            target_appt_obj.queue_position = 1
            session.add(target_appt_obj)
        session.commit()

    res3 = main.check_departure_time(req_data, user_dict)
    print("\n==============================")
    print("STEP 3: WHEN PATIENT IS NEXT IN LINE (0 Patients Ahead)")
    print("==============================")
    print("RAW JSON Response 3:")
    print(res3.model_dump_json(indent=2))

    print("\n==============================")
    print("=== REAL-TIME DECREASE SUMMARY ===")
    print("==============================")
    print(f"Stage 1 (6 ahead): Predicted Wait = {res1.predicted_wait_minutes:.1f} mins | Travel Time = {res1.travel_time_minutes} mins | Should Leave Now = {res1.should_leave_now}")
    print(f"Stage 2 (3 ahead): Predicted Wait = {res2.predicted_wait_minutes:.1f} mins | Travel Time = {res2.travel_time_minutes} mins | Should Leave Now = {res2.should_leave_now}")
    print(f"Stage 3 (0 ahead): Predicted Wait = {res3.predicted_wait_minutes:.1f} mins | Travel Time = {res3.travel_time_minutes} mins | Should Leave Now = {res3.should_leave_now}")
    print(f"Total Wait Time Reduced: {res1.predicted_wait_minutes - res3.predicted_wait_minutes:.1f} mins as queue progressed.")

if __name__ == "__main__":
    run_test()
