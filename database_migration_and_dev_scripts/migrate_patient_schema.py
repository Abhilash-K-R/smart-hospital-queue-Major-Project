import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
import database
from sqlmodel import text

print("="*60)
print("EXECUTING NEON POSTGRESQL PATIENT SCHEMA MIGRATION")
print("="*60)

with database.engine.connect() as conn:
    # 1. Add columns if not exists
    print("[1] Adding missing columns to patient table...")
    conn.execute(text("""
        ALTER TABLE patient ADD COLUMN IF NOT EXISTS patient_uid VARCHAR(16);
        ALTER TABLE patient ADD COLUMN IF NOT EXISTS avatar TEXT;
        ALTER TABLE patient ADD COLUMN IF NOT EXISTS age INTEGER;
        ALTER TABLE patient ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'Male';
        ALTER TABLE patient ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);
        ALTER TABLE patient ADD COLUMN IF NOT EXISTS address TEXT;
        ALTER TABLE patient ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100);
        ALTER TABLE patient ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);
        ALTER TABLE patient ADD COLUMN IF NOT EXISTS allergies TEXT;
        ALTER TABLE patient ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    """))
    conn.commit()
    print("  -> Columns added successfully!")

    # 2. Assign gapless sequential patient_uid starting at 100000
    print("[2] Assigning gapless sequential patient_uid to existing patients...")
    conn.execute(text("""
        WITH ranked AS (
            SELECT id, (100000 + ROW_NUMBER() OVER (ORDER BY id ASC) - 1) AS new_uid
            FROM patient
            WHERE patient_uid IS NULL
        )
        UPDATE patient
        SET patient_uid = CAST(ranked.new_uid AS VARCHAR)
        FROM ranked
        WHERE patient.id = ranked.id;
    """))
    conn.commit()
    print("  -> Existing patients assigned sequential IDs!")

    # 3. Add NOT NULL and UNIQUE index
    print("[3] Adding NOT NULL and UNIQUE index...")
    conn.execute(text("""
        ALTER TABLE patient ALTER COLUMN patient_uid SET NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_patient_uid ON patient(patient_uid);
    """))
    conn.commit()
    print("  -> UNIQUE index and NOT NULL constraint applied!")

    # 4. Create sequence for next registrations
    max_val = conn.execute(text("SELECT MAX(CAST(patient_uid AS INTEGER)) FROM patient;")).scalar() or 99999
    next_val = max_val + 1
    print(f"[4] Setting up patient_uid_seq starting at next available ID: {next_val}...")
    conn.execute(text(f"""
        CREATE SEQUENCE IF NOT EXISTS patient_uid_seq START WITH {next_val};
        SELECT setval('patient_uid_seq', {next_val}, false);
    """))
    conn.commit()
    print(f"  -> Sequence configured! Next new patient will receive UID: {next_val}")

    # 5. Verification Check
    print("\n[5] VERIFYING ASSIGNED PATIENT UIDs:")
    total = conn.execute(text("SELECT count(*) FROM patient;")).scalar()
    min_uid = conn.execute(text("SELECT MIN(CAST(patient_uid AS INTEGER)) FROM patient;")).scalar()
    max_uid = conn.execute(text("SELECT MAX(CAST(patient_uid AS INTEGER)) FROM patient;")).scalar()
    null_count = conn.execute(text("SELECT count(*) FROM patient WHERE patient_uid IS NULL;")).scalar()
    
    print(f"  Total Patients: {total}")
    print(f"  First Patient UID: {min_uid}")
    print(f"  Last Patient UID:  {max_uid}")
    print(f"  Gapless Check: (max - min + 1 == total) -> {max_uid - min_uid + 1 == total}")
    print(f"  Null UID Count: {null_count}")

    # Preview 5 rows
    sample = conn.execute(text("SELECT id, patient_uid, name, phone FROM patient ORDER BY id ASC LIMIT 5;")).fetchall()
    print("\nFirst 5 Patients:")
    for s in sample:
        print(f"  DB ID: {s[0]:<4} | Patient UID: {s[1]:<8} | Name: {s[2]:<20} | Phone: {s[3]}")

    sample_last = conn.execute(text("SELECT id, patient_uid, name, phone FROM patient ORDER BY id DESC LIMIT 5;")).fetchall()
    print("\nLast 5 Patients:")
    for s in sample_last:
        print(f"  DB ID: {s[0]:<4} | Patient UID: {s[1]:<8} | Name: {s[2]:<20} | Phone: {s[3]}")

print("\n" + "="*60)
print("MIGRATION FINISHED SUCCESSFULLY!")
print("="*60)

