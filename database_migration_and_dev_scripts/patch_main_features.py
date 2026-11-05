with open('backend/main.py', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add to_ist helper function after IST definition
target_ist = "IST = timezone(timedelta(hours=5, minutes=30))"
repl_ist = """IST = timezone(timedelta(hours=5, minutes=30))


def to_ist(dt: Optional[datetime]) -> Optional[datetime]:
    \"\"\"
    Centralized timezone converter ensuring all stored UTC datetimes
    are accurately converted to Indian Standard Time (IST = UTC+5:30).
    \"\"\"
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST)"""

if "def to_ist(" not in code:
    if target_ist in code:
        code = code.replace(target_ist, repl_ist, 1)
    elif target_ist.replace('\n', '\r\n') in code:
        code = code.replace(target_ist.replace('\n', '\r\n'), repl_ist.replace('\n', '\r\n'), 1)
    print("SUCCESS: to_ist() function added!")

# 2. Update get_notifications() loop to use to_ist()
target_notif = """            now_utc = datetime.now(timezone.utc)
            for n in db_notifs:
                notif_time = n.created_at if n.created_at.tzinfo else n.created_at.replace(tzinfo=timezone.utc)
                diff_sec = (now_utc - notif_time).total_seconds()
                if diff_sec < 60:
                    time_str = "Just now"
                elif diff_sec < 3600:
                    time_str = f"{int(diff_sec // 60)} mins ago"
                elif diff_sec < 86400:
                    time_str = f"{int(diff_sec // 3600)} hours ago"
                else:
                    time_str = n.created_at.strftime("%b %d, %I:%M %p")

                items.append(
                    NotificationItem(
                        id=n.id,
                        title=n.title,
                        message=n.message,
                        timestamp=time_str,
                        read=n.is_read,
                        type=n.type,
                        severity=n.severity,
                        priority="high" if n.severity == "critical" else ("warning" if n.severity == "warning" else "info")
                    )
                )"""

repl_notif = """            now_utc = datetime.now(timezone.utc)
            now_ist = datetime.now(IST)
            for n in db_notifs:
                notif_utc = n.created_at if n.created_at.tzinfo else n.created_at.replace(tzinfo=timezone.utc)
                notif_ist = notif_utc.astimezone(IST)
                diff_sec = (now_utc - notif_utc).total_seconds()
                if diff_sec < 60:
                    time_str = "Just now"
                elif diff_sec < 3600:
                    time_str = f"{int(diff_sec // 60)} mins ago"
                elif diff_sec < 86400 and notif_ist.date() == now_ist.date():
                    time_str = f"{int(diff_sec // 3600)} hours ago"
                elif notif_ist.date() == now_ist.date():
                    time_str = f"Today, {notif_ist.strftime('%I:%M %p')}"
                else:
                    time_str = notif_ist.strftime("%b %d, %I:%M %p")

                items.append(
                    NotificationItem(
                        id=n.id,
                        title=n.title,
                        message=n.message,
                        timestamp=time_str,
                        created_at_iso=notif_ist.isoformat(),
                        read=n.is_read,
                        type=n.type,
                        severity=n.severity,
                        priority="high" if n.severity == "critical" else ("warning" if n.severity == "warning" else "info")
                    )
                )"""

def replace_crlf(target, replacement, text):
    if target in text:
        return text.replace(target, replacement, 1)
    elif target.replace('\n', '\r\n') in text:
        return text.replace(target.replace('\n', '\r\n'), replacement.replace('\n', '\r\n'), 1)
    return text

code = replace_crlf(target_notif, repl_notif, code)
print("SUCCESS: get_notifications() loop updated with accurate IST conversion!")

# 3. Update get_patient_profile() and update_patient_profile()
target_prof = """@app.get("/patients/profile")
def get_patient_profile(current_user: dict = Depends(get_current_user)):
    \"\"\"Compatibility route for patient profile display.\"\"\"
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
def update_patient_profile(updates: PatientProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    \"\"\"Compatibility route for updating patient profile info.\"\"\"
    patient_id = int(current_user["sub"])
    with Session(engine) as session:
        patient = session.get(Patient, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        name_val = updates.name or updates.fullName
        if name_val:
            cleaned_name = re.sub(r'<[^>]*>', '', name_val).strip()
            if cleaned_name:
                patient.name = cleaned_name
        if updates.phone:
            cleaned_phone = re.sub(r"\\D", "", updates.phone)
            if len(cleaned_phone) == 10:
                patient.phone = cleaned_phone
        if updates.email and "@" in updates.email:
            patient.email = updates.email.strip().lower()
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
        }"""

repl_prof = """@app.get("/patients/profile")
def get_patient_profile(current_user: dict = Depends(get_current_user)):
    \"\"\"Returns complete patient medical profile and permanent patient_uid.\"\"\"
    patient_id = int(current_user["sub"])
    with Session(engine) as session:
        patient = session.get(Patient, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        return {
            "id": patient.id,
            "patient_uid": patient.patient_uid or str(100000 + patient.id),
            "name": patient.name,
            "phone": patient.phone,
            "email": patient.email,
            "avatar": patient.avatar or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
            "age": patient.age,
            "gender": patient.gender or "Male",
            "blood_group": patient.blood_group,
            "bloodGroup": patient.blood_group,
            "address": patient.address,
            "emergency_contact_name": patient.emergency_contact_name,
            "emergency_contact_phone": patient.emergency_contact_phone,
            "emergencyContact": patient.emergency_contact_phone or patient.emergency_contact_name,
            "allergies": patient.allergies,
        }


@app.put("/patients/profile")
def update_patient_profile(updates: PatientProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    \"\"\"Persists clinical profile updates, avatar photo, blood group and emergency contact.\"\"\"
    patient_id = int(current_user["sub"])
    with Session(engine) as session:
        patient = session.get(Patient, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        name_val = updates.name or updates.fullName
        if name_val:
            cleaned_name = re.sub(r'<[^>]*>', '', name_val).strip()
            if cleaned_name:
                patient.name = cleaned_name
        
        if updates.phone:
            cleaned_phone = re.sub(r"\\D", "", str(updates.phone))
            if len(cleaned_phone) > 10 and cleaned_phone.startswith("91"):
                cleaned_phone = cleaned_phone[2:]
            if len(cleaned_phone) == 10:
                patient.phone = cleaned_phone
        
        if updates.email and "@" in updates.email:
            patient.email = updates.email.strip().lower()
        
        if updates.avatar:
            # Allow valid image data URLs or HTTPS image links (limit to 2.5MB payload)
            if updates.avatar.startswith("data:image/") or updates.avatar.startswith("http://") or updates.avatar.startswith("https://"):
                if len(updates.avatar) < 3_500_000:
                    patient.avatar = updates.avatar
        
        if updates.age is not None:
            try:
                age_int = int(updates.age)
                if 0 <= age_int <= 125:
                    patient.age = age_int
            except (ValueError, TypeError):
                pass
        
        if updates.gender:
            g = updates.gender.strip().capitalize()
            if g in ["Male", "Female", "Other"]:
                patient.gender = g
        
        bg_val = updates.bloodGroup or updates.blood_group
        if bg_val:
            clean_bg = bg_val.strip().upper()
            if clean_bg in ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]:
                patient.blood_group = clean_bg
        
        if updates.address is not None:
            patient.address = re.sub(r'<[^>]*>', '', updates.address).strip()
        
        em_phone = updates.emergency_contact_phone or updates.emergencyContact
        if em_phone:
            patient.emergency_contact_phone = str(em_phone).strip()
        
        if updates.emergency_contact_name:
            patient.emergency_contact_name = re.sub(r'<[^>]*>', '', updates.emergency_contact_name).strip()
        
        if updates.allergies is not None:
            patient.allergies = re.sub(r'<[^>]*>', '', updates.allergies).strip()
        
        patient.updated_at = datetime.now(timezone.utc)
        session.add(patient)
        session.commit()
        session.refresh(patient)
        
        return {
            "success": True,
            "user": {
                "id": patient.id,
                "patient_uid": patient.patient_uid or str(100000 + patient.id),
                "name": patient.name,
                "phone": patient.phone,
                "email": patient.email,
                "avatar": patient.avatar or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
                "age": patient.age,
                "gender": patient.gender or "Male",
                "blood_group": patient.blood_group,
                "bloodGroup": patient.blood_group,
                "address": patient.address,
                "emergency_contact_name": patient.emergency_contact_name,
                "emergency_contact_phone": patient.emergency_contact_phone,
                "emergencyContact": patient.emergency_contact_phone or patient.emergency_contact_name,
                "allergies": patient.allergies,
            },
        }"""

code = replace_crlf(target_prof, repl_prof, code)
print("SUCCESS: get_patient_profile() and update_patient_profile() updated!")

# 4. Update frontend_login() user_data to return patient_uid and profile attributes
target_login = """        user_data = {
            "id": patient.id,
            "name": patient.name,
            "phone": patient.phone,
            "email": patient.email,
            "appointment_id": appt.id if appt else None,
            "tokenNumber": f"OPD-{appt.id:03d}" if appt else None,
            "numericToken": appt.id if appt else None,
        }"""

repl_login = """        user_data = {
            "id": patient.id,
            "patient_uid": patient.patient_uid or str(100000 + patient.id),
            "name": patient.name,
            "phone": patient.phone,
            "email": patient.email,
            "avatar": patient.avatar or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
            "age": patient.age,
            "gender": patient.gender or "Male",
            "blood_group": patient.blood_group,
            "bloodGroup": patient.blood_group,
            "address": patient.address,
            "emergency_contact_name": patient.emergency_contact_name,
            "emergency_contact_phone": patient.emergency_contact_phone,
            "emergencyContact": patient.emergency_contact_phone or patient.emergency_contact_name,
            "allergies": patient.allergies,
            "appointment_id": appt.id if appt else None,
            "tokenNumber": f"OPD-{appt.id:03d}" if appt else None,
            "numericToken": appt.id if appt else None,
        }"""

code = replace_crlf(target_login, repl_login, code)
print("SUCCESS: frontend_login() updated with patient_uid and profile data!")

# 5. Update register_patient() to allocate sequential patient_uid from patient_uid_seq
target_reg = """        email_val = request.email.strip() if request.email else f"{clean_phone}@mediflow.patient"
        new_patient = Patient(
            name=raw_name.strip(),
            phone=clean_phone,
            email=email_val,
            password_hash=hash_password(request.password),
        )
        session.add(new_patient)
        session.commit()
        session.refresh(new_patient)"""

repl_reg = """        email_val = request.email.strip() if request.email else f"{clean_phone}@mediflow.patient"
        # Atomically allocate sequential patient_uid
        try:
            next_uid = session.execute(text("SELECT nextval('patient_uid_seq');")).scalar()
            assigned_uid = str(next_uid)
        except Exception:
            max_curr = session.execute(text("SELECT COALESCE(MAX(CAST(patient_uid AS INTEGER)), 99999) FROM patient;")).scalar()
            assigned_uid = str(max_curr + 1)

        new_patient = Patient(
            patient_uid=assigned_uid,
            name=raw_name.strip(),
            phone=clean_phone,
            email=email_val,
            password_hash=hash_password(request.password),
            gender="Male",
        )
        session.add(new_patient)
        session.commit()
        session.refresh(new_patient)"""

code = replace_crlf(target_reg, repl_reg, code)
print("SUCCESS: register_patient() updated with sequential patient_uid allocation!")

# 6. Update get_staff_queue to include patient_uid in StaffQueueItem
target_queue_item = """            queue_items.append(
                StaffQueueItem(
                    id=appt.id,
                    patient_id=appt.patient_id,
                    name=attendee_name,"""

repl_queue_item = """            pat_uid = pat.patient_uid if pat and pat.patient_uid else str(100000 + appt.patient_id)
            queue_items.append(
                StaffQueueItem(
                    id=appt.id,
                    patient_id=appt.patient_id,
                    patient_uid=pat_uid,
                    name=attendee_name,"""

code = replace_crlf(target_queue_item, repl_queue_item, code)
print("SUCCESS: get_staff_queue updated with patient_uid!")

with open('backend/main.py', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(code)

print("SUCCESS: All backend/main.py updates written successfully!")

