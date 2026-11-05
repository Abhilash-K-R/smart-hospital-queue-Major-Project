with open('backend/schemas.py', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update PatientProfileUpdateRequest
old_profile_req = """class PatientProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    fullName: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None"""

new_profile_req = """class PatientProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    fullName: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    bloodGroup: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergencyContact: Optional[str] = None
    allergies: Optional[str] = None"""

# 2. Add patient_uid to AppointmentResponse
old_appt_resp = """    is_dependent: Optional[bool] = False
    primary_patient_name: Optional[str] = None
    patientsAhead: Optional[int] = 0"""

new_appt_resp = """    is_dependent: Optional[bool] = False
    primary_patient_name: Optional[str] = None
    patientsAhead: Optional[int] = 0
    patient_uid: Optional[str] = None"""

# 3. Add patient_uid to StaffQueueItem
old_staff_queue = """    patient_id: int
    name: str"""

new_staff_queue = """    patient_id: int
    patient_uid: Optional[str] = None
    name: str"""

# 4. Add created_at_iso to NotificationItem
old_notif_item = """class NotificationItem(BaseModel):
    id: int
    title: str
    message: str
    timestamp: str"""

new_notif_item = """class NotificationItem(BaseModel):
    id: int
    title: str
    message: str
    timestamp: str
    created_at_iso: Optional[str] = None"""

def replace_crlf(target, replacement, text):
    if target in text:
        return text.replace(target, replacement, 1)
    elif target.replace('\n', '\r\n') in text:
        return text.replace(target.replace('\n', '\r\n'), replacement.replace('\n', '\r\n'), 1)
    return text

code = replace_crlf(old_profile_req, new_profile_req, code)
code = replace_crlf(old_appt_resp, new_appt_resp, code)
code = replace_crlf(old_staff_queue, new_staff_queue, code)
code = replace_crlf(old_notif_item, new_notif_item, code)

with open('backend/schemas.py', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(code)

print("SUCCESS: backend/schemas.py updated with profile, patient_uid and notification schemas!")

