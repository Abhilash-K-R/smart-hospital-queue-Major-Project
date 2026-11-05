with open('backend/models.py', 'r', encoding='utf-8') as f:
    code = f.read()

target = """class Patient(SQLModel, table=True):
    \"\"\"
    A registered patient. password_hash stores an ENCRYPTED password,
    never the real password in plain text.
    \"\"\"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    phone: str
    email: Optional[str] = Field(default="")
    password_hash: str"""

replacement = """class Patient(SQLModel, table=True):
    \"\"\"
    A registered patient. password_hash stores an ENCRYPTED password,
    never the real password in plain text.
    patient_uid stores the permanent, unique 6-digit public identifier (e.g. 100023).
    \"\"\"
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_uid: Optional[str] = Field(default=None, unique=True, index=True)
    name: str
    phone: str
    email: Optional[str] = Field(default="")
    password_hash: str
    avatar: Optional[str] = Field(default=None)
    age: Optional[int] = Field(default=None)
    gender: Optional[str] = Field(default="Male")
    blood_group: Optional[str] = Field(default=None)
    address: Optional[str] = Field(default=None)
    emergency_contact_name: Optional[str] = Field(default=None)
    emergency_contact_phone: Optional[str] = Field(default=None)
    allergies: Optional[str] = Field(default=None)
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))"""

# Normalize CRLF
if target in code:
    code = code.replace(target, replacement, 1)
elif target.replace('\n', '\r\n') in code:
    code = code.replace(target.replace('\n', '\r\n'), replacement.replace('\n', '\r\n'), 1)

with open('backend/models.py', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(code)

print("SUCCESS: backend/models.py updated with new Patient model fields!")

