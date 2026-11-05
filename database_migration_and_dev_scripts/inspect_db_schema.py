import os, sys
sys.path.insert(0, 'backend')
import database
from sqlmodel import text

with database.engine.connect() as conn:
    cols = conn.execute(text("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'patient'
        ORDER BY ordinal_position;
    """)).fetchall()
    print("Columns in patient table in Neon DB:")
    for c in cols:
        print(" ", c)

    patients_count = conn.execute(text("SELECT count(*) FROM patient;")).scalar()
    print(f"Total registered patients: {patients_count}")

    sample = conn.execute(text("SELECT * FROM patient LIMIT 3;")).fetchall()
    print("Sample patient rows:")
    for s in sample:
        print(" ", s)

