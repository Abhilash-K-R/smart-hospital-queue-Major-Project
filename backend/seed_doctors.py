"""
backend/seed_doctors.py
-----------------------
Upsert script that provisions the canonical 7 hospital departments,
8 unified doctors (2 General Purpose for General Medicine + 6 Specialists),
and symptom mappings in Neon PostgreSQL.

Ensures zero duplicate rows on repeated executions.
"""

from sqlmodel import Session, select
from datetime import datetime
from database import engine
from models import Department, Doctor, SymptomMapping

DEPARTMENTS_DATA = [
    {"name": "Cardiology"},
    {"name": "General Medicine"},
    {"name": "Orthopedics"},
    {"name": "Pediatrics"},
    {"name": "Neurology"},
    {"name": "Dermatology"},
    {"name": "Pulmonology"},
]

DOCTORS_DATA = [
    # 2 General Purpose Doctors in General Medicine
    {
        "name": "Dr. Rajeswari R.",
        "department": "General Medicine",
        "avg_consult_minutes": 10,
    },
    {
        "name": "Dr. Arjun Rao",
        "department": "General Medicine",
        "avg_consult_minutes": 10,
    },
    # 6 Specialist Doctors across 6 Distinct Departments
    {
        "name": "Dr. Priya Sharma",
        "department": "Cardiology",
        "avg_consult_minutes": 15,
    },
    {
        "name": "Dr. Vikram K. Rao",
        "department": "Orthopedics",
        "avg_consult_minutes": 12,
    },
    {
        "name": "Dr. Ananya Hegde",
        "department": "Pediatrics",
        "avg_consult_minutes": 10,
    },
    {
        "name": "Dr. Rajeshwar B.",
        "department": "Neurology",
        "avg_consult_minutes": 15,
    },
    {
        "name": "Dr. Sneha Patil",
        "department": "Dermatology",
        "avg_consult_minutes": 10,
    },
    {
        "name": "Dr. Manoj Kumar",
        "department": "Pulmonology",
        "avg_consult_minutes": 12,
    },
]

SYMPTOM_MAPPINGS_DATA = [
    {"symptom": "Chest Pain", "department": "Cardiology"},
    {"symptom": "Heart Palpitations", "department": "Cardiology"},
    {"symptom": "Fever & Chills", "department": "General Medicine"},
    {"symptom": "General Fatigue", "department": "General Medicine"},
    {"symptom": "Viral Flu", "department": "General Medicine"},
    {"symptom": "Joint Pain & Stiffness", "department": "Orthopedics"},
    {"symptom": "Bone Fracture / Sprain", "department": "Orthopedics"},
    {"symptom": "Child Fever & Cough", "department": "Pediatrics"},
    {"symptom": "Pediatric Health Checkup", "department": "Pediatrics"},
    {"symptom": "Severe Headache & Migraine", "department": "Neurology"},
    {"symptom": "Dizziness & Tremors", "department": "Neurology"},
    {"symptom": "Skin Rash & Itching", "department": "Dermatology"},
    {"symptom": "Acne & Skin Infection", "department": "Dermatology"},
    {"symptom": "Shortness of Breath", "department": "Pulmonology"},
    {"symptom": "Chronic Cough & Wheezing", "department": "Pulmonology"},
]


def seed_departments_and_doctors():
    with Session(engine) as session:
        print("--- Step 1: Upserting Departments ---")
        dept_map = {}
        for d in DEPARTMENTS_DATA:
            existing = session.exec(select(Department).where(Department.name == d["name"])).first()
            if not existing:
                new_dept = Department(name=d["name"])
                session.add(new_dept)
                session.commit()
                session.refresh(new_dept)
                dept_map[d["name"]] = new_dept
                print(f"Created Department: {new_dept.name} (id={new_dept.id})")
            else:
                dept_map[d["name"]] = existing
                print(f"Existing Department: {existing.name} (id={existing.id})")

        print("\n--- Step 2: Upserting 8 Unified Doctors ---")
        for doc_info in DOCTORS_DATA:
            dept = dept_map.get(doc_info["department"])
            if not dept:
                print(f"ERROR: Department {doc_info['department']} not found!")
                continue

            existing_doc = session.exec(select(Doctor).where(Doctor.name == doc_info["name"])).first()
            if not existing_doc:
                new_doc = Doctor(
                    name=doc_info["name"],
                    department_id=dept.id,
                    avg_consult_minutes=doc_info["avg_consult_minutes"],
                )
                session.add(new_doc)
                session.commit()
                session.refresh(new_doc)
                print(f"Created Doctor: {new_doc.name} (id={new_doc.id}, dept={dept.name})")
            else:
                existing_doc.department_id = dept.id
                existing_doc.avg_consult_minutes = doc_info["avg_consult_minutes"]
                session.add(existing_doc)
                session.commit()
                print(f"Updated Doctor: {existing_doc.name} (id={existing_doc.id}, dept={dept.name})")

        print("\n--- Step 3: Upserting Symptom Mappings ---")
        for sym_info in SYMPTOM_MAPPINGS_DATA:
            dept = dept_map.get(sym_info["department"])
            if not dept:
                continue
            existing_sym = session.exec(
                select(SymptomMapping).where(SymptomMapping.symptom_name == sym_info["symptom"])
            ).first()
            if not existing_sym:
                new_sym = SymptomMapping(
                    symptom_name=sym_info["symptom"],
                    department_id=dept.id,
                )
                session.add(new_sym)
                session.commit()
                print(f"Added Symptom: {sym_info['symptom']} -> {dept.name}")

        print("\n--- Verification Summary ---")
        all_docs = session.exec(select(Doctor)).all()
        all_depts = session.exec(select(Department)).all()
        print(f"Total Departments in DB: {len(all_depts)}")
        print(f"Total Doctors in DB: {len(all_docs)}")
        for doc in all_docs:
            d_name = next((d.name for d in all_depts if d.id == doc.department_id), "Unknown")
            print(f"  [ID: {doc.id}] {doc.name:<22} | Dept: {d_name:<18} | Consult: {doc.avg_consult_minutes}m")


if __name__ == "__main__":
    seed_departments_and_doctors()
