import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from database import engine
from sqlmodel import Session, text

with Session(engine) as session:
    cols = session.execute(text("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'patient';
    """)).fetchall()
    print("Columns in patient table:")
    for c in cols:
        print(f" - {c[0]} ({c[1]})")
    
    sample = session.execute(text("""
        SELECT id, name, phone, password_hash 
        FROM patient 
        LIMIT 5;
    """)).fetchall()
    print("\nSample passwords:")
    for s in sample:
        print(f" - ID: {s[0]}, Name: {s[1]}, Phone: {s[2]}, Hash: {s[3]}")
