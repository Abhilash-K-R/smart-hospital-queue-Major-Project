import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from database import engine
from sqlmodel import Session, text

with Session(engine) as session:
    total_patients = session.execute(text("SELECT count(*) FROM patient;")).scalar()
    min_id = session.execute(text("SELECT min(id) FROM patient;")).scalar()
    max_id = session.execute(text("SELECT max(id) FROM patient;")).scalar()
    min_uid = session.execute(text("SELECT min(patient_uid) FROM patient;")).scalar()
    max_uid = session.execute(text("SELECT max(patient_uid) FROM patient;")).scalar()
    
    last_patients = session.execute(text("SELECT id, patient_uid, name, phone, email FROM patient ORDER BY id DESC LIMIT 5;")).fetchall()
    
    print(f"TOTAL_PATIENTS: {total_patients}")
    print(f"ID_RANGE: {min_id} to {max_id}")
    print(f"UID_RANGE: {min_uid} to {max_uid}")
    print("\nLATEST 5 PATIENTS:")
    for p in last_patients:
        print(f"  ID: {p[0]} | UID: {p[1]} | Name: {p[2]} | Phone: {p[3]} | Email: {p[4]}")

