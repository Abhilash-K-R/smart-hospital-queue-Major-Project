import os
import re

path = 'backend/main.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update frontend_register
target_reg = """        appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doc_id,
            booked_time=datetime.now(timezone.utc),
            status="pending",
            queue_position=existing_count + 1,
            time_slot=chosen_slot,
            appointment_date=chosen_date,
        )"""

replacement_reg = """        pred_dur = estimate_appointment_duration(doctor, getattr(request, 'symptoms', None), 30)
        appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doc_id,
            booked_time=datetime.now(timezone.utc),
            status="pending",
            queue_position=existing_count + 1,
            time_slot=chosen_slot,
            appointment_date=chosen_date,
            predicted_duration=pred_dur,
            symptoms=getattr(request, 'symptoms', None) or "Routine consultation",
        )"""

if target_reg in content:
    content = content.replace(target_reg, replacement_reg)
    print("Patched frontend_register")
else:
    print("Warning: target_reg not found")

# 2. Update book_patient_appointment
target_book_check = """            # Idempotency / Duplicate Booking Guard"""
collision_code_book = """            # Dynamic ML-Driven Slot Buffer Collision Guard
            cand_start = parse_slot_to_minutes(chosen_slot)
            cand_end = cand_start + 30
            busy_windows = get_doctor_busy_windows(session, doctor.id, chosen_date)
            for bw in busy_windows:
                if cand_start < bw["end_mins"] and cand_end > bw["start_mins"]:
                    suggested = None
                    for s_cand in ALL_STANDARD_SLOTS:
                        s_start = parse_slot_to_minutes(s_cand)
                        s_end = s_start + 30
                        if chosen_date == today_ist:
                            curr_mins = now_ist.hour * 60 + now_ist.minute
                            if s_start <= curr_mins + 15:
                                continue
                        if not any(s_start < bwi["end_mins"] and s_end > bwi["start_mins"] for bwi in busy_windows):
                            suggested = s_cand
                            break
                    if cand_start == bw["start_mins"]:
                        msg = f"Slot {chosen_slot} is already reserved for {doctor.name}."
                    else:
                        msg = f"{doctor.name} is in an extended consultation ({bw['slot']} - {bw['busy_until']})."
                    rec = f" Next available slot: {suggested}." if suggested else " No further open slots today."
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"{msg}{rec}"
                    )

            # Idempotency / Duplicate Booking Guard"""

if target_book_check in content and "Dynamic ML-Driven Slot Buffer Collision Guard" not in content:
    content = content.replace(target_book_check, collision_code_book)
    print("Patched book_patient_appointment collision guard")
else:
    print("Warning: target_book_check not found or already patched")

target_book_appt = """            appointment = Appointment(
                patient_id=patient.id,
                doctor_id=doctor.id,
                booked_time=datetime.now(timezone.utc),
                status="pending",
                queue_position=existing_count + 1,
                time_slot=chosen_slot,
                appointment_date=chosen_date,
                beneficiary_name=beneficiary_name,
                beneficiary_age=beneficiary_age,
                beneficiary_gender=beneficiary_gender,
                contact_phone=contact_phone,
                is_dependent=is_dep,
            )"""

replacement_book_appt = """            pred_dur = estimate_appointment_duration(doctor, req.symptoms, beneficiary_age)
            appointment = Appointment(
                patient_id=patient.id,
                doctor_id=doctor.id,
                booked_time=datetime.now(timezone.utc),
                status="pending",
                queue_position=existing_count + 1,
                time_slot=chosen_slot,
                appointment_date=chosen_date,
                beneficiary_name=beneficiary_name,
                beneficiary_age=beneficiary_age,
                beneficiary_gender=beneficiary_gender,
                contact_phone=contact_phone,
                is_dependent=is_dep,
                predicted_duration=pred_dur,
                symptoms=req.symptoms or "Routine consultation",
            )"""

if target_book_appt in content:
    content = content.replace(target_book_appt, replacement_book_appt)
    print("Patched book_patient_appointment creation")
else:
    print("Warning: target_book_appt not found")

# Update AppointmentBookResponse return
target_book_resp = """                patient_name=display_attendee,
                patient_age=beneficiary_age,
                patient_gender=beneficiary_gender,
                contact_phone=contact_phone,
                is_dependent=is_dep,
                is_arrived=appointment.is_arrived,
                patient=patient_payload,"""

replacement_book_resp = """                patient_name=display_attendee,
                patient_age=beneficiary_age,
                patient_gender=beneficiary_gender,
                contact_phone=contact_phone,
                is_dependent=is_dep,
                is_arrived=appointment.is_arrived,
                predicted_duration=appointment.predicted_duration,
                symptoms=appointment.symptoms,
                patient=patient_payload,"""

if target_book_resp in content:
    content = content.replace(target_book_resp, replacement_book_resp)
    print("Patched book_patient_appointment response")
else:
    print("Warning: target_book_resp not found")

# 3. Update register_walkin_patient
target_walkin_appt = """        # 3. Create Appointment
        appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doc_id,
            booked_time=datetime.now(timezone.utc),
            status="pending",
            queue_position=1,
            time_slot=chosen_slot,
            appointment_date=today_ist,
            beneficiary_name=req.patient_name.strip() or patient.name,
            beneficiary_age=req.age or 35,
            beneficiary_gender=req.gender or "Male",
            contact_phone=clean_phone,
            is_dependent=False,
        )"""

replacement_walkin_appt = """        # 3. Collision check & Create Appointment
        cand_start = parse_slot_to_minutes(chosen_slot)
        cand_end = cand_start + 30
        busy_windows = get_doctor_busy_windows(session, doc_id, today_ist)
        for bw in busy_windows:
            if cand_start < bw["end_mins"] and cand_end > bw["start_mins"]:
                suggested = None
                for s_cand in ALL_STANDARD_SLOTS:
                    s_start = parse_slot_to_minutes(s_cand)
                    s_end = s_start + 30
                    curr_mins = now_ist.hour * 60 + now_ist.minute
                    if s_start <= curr_mins + 10:
                        continue
                    if not any(s_start < bwi["end_mins"] and s_end > bwi["start_mins"] for bwi in busy_windows):
                        suggested = s_cand
                        break
                if cand_start == bw["start_mins"]:
                    msg = f"Slot {chosen_slot} is already reserved for {doctor.name}."
                else:
                    msg = f"{doctor.name} is in an extended consultation ({bw['slot']} - {bw['busy_until']})."
                rec = f" Suggested next slot: {suggested}." if suggested else ""
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"{msg}{rec}"
                )

        pred_dur = estimate_appointment_duration(doctor, req.symptoms, req.age)
        appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doc_id,
            booked_time=datetime.now(timezone.utc),
            status="pending",
            queue_position=1,
            time_slot=chosen_slot,
            appointment_date=today_ist,
            beneficiary_name=req.patient_name.strip() or patient.name,
            beneficiary_age=req.age or 35,
            beneficiary_gender=req.gender or "Male",
            contact_phone=clean_phone,
            is_dependent=False,
            predicted_duration=pred_dur,
            symptoms=req.symptoms or "Walk-in OPD Consultation",
        )"""

if target_walkin_appt in content:
    content = content.replace(target_walkin_appt, replacement_walkin_appt)
    print("Patched register_walkin_patient creation")
else:
    print("Warning: target_walkin_appt not found")

# Update StaffWalkInRegisterResponse
target_walkin_resp = """            patientsAhead=patients_ahead,
            estimatedWaitMinutes=est_wait,
            booked_time=now_ist.strftime("%I:%M %p"),"""

replacement_walkin_resp = """            patientsAhead=patients_ahead,
            estimatedWaitMinutes=est_wait,
            booked_time=now_ist.strftime("%I:%M %p"),
            predicted_duration=appointment.predicted_duration,
            symptoms=appointment.symptoms,"""

if target_walkin_resp in content:
    content = content.replace(target_walkin_resp, replacement_walkin_resp)
    print("Patched register_walkin_patient response")
else:
    print("Warning: target_walkin_resp not found")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Finished patching booking collision logic in backend/main.py")
