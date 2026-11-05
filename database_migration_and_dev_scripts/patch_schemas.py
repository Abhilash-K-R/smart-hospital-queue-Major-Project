import os

path = 'backend/schemas.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Slot schemas before DEPARTURE-TIME NOTIFICATION
slot_schemas = """
class AvailableSlotItem(BaseModel):
    slot: str
    session: str  # morning, afternoon, evening
    available: bool
    is_past: bool = False
    reason: Optional[str] = None
    busy_until: Optional[str] = None
    predicted_duration: Optional[int] = 30

class DoctorAvailableSlotsResponse(BaseModel):
    doctor_id: int
    doctor_name: str
    department: str
    date: str
    total_slots: int
    available_count: int
    next_available_slot: Optional[str] = None
    sessions: Dict[str, List[AvailableSlotItem]]
    all_slots: List[AvailableSlotItem]
"""

# Check where to add
if "class DoctorAvailableSlotsResponse" not in content:
    content = content.replace("class DepartureCheckRequest(BaseModel):", slot_schemas + "\nclass DepartureCheckRequest(BaseModel):")

# Add predicted_duration and symptoms to AppointmentResponse if not present
if "predicted_duration: Optional[int] = 30" not in content:
    content = content.replace(
        "    is_arrived: Optional[bool] = False\n",
        "    is_arrived: Optional[bool] = False\n    predicted_duration: Optional[int] = 30\n    symptoms: Optional[str] = None\n"
    )

# Add to AppointmentBookResponse
if "predicted_duration: Optional[int] = 30" not in content or "AppointmentBookResponse" in content:
    target_book = "    is_dependent: Optional[bool] = False\n    patient: dict"
    replacement_book = "    is_dependent: Optional[bool] = False\n    predicted_duration: Optional[int] = 30\n    symptoms: Optional[str] = None\n    patient: dict"
    if target_book in content and "predicted_duration: Optional[int] = 30\n    symptoms: Optional[str] = None\n    patient: dict" not in content:
        content = content.replace(target_book, replacement_book)

# Add to StaffWalkInRegisterResponse
target_walkin = "    booked_time: str"
replacement_walkin = "    booked_time: str\n    predicted_duration: Optional[int] = 30\n    symptoms: Optional[str] = None"
if target_walkin in content and replacement_walkin not in content:
    content = content.replace(target_walkin, replacement_walkin)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Updated backend/schemas.py")
