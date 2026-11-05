import sys
import os
sys.path.insert(0, os.path.abspath('backend'))
from sqlmodel import Session, text
from database import engine

with Session(engine) as session:
    tables = session.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;")).fetchall()
    seqs = session.execute(text("SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema='public';")).fetchall()
    print("Database Tables:", [t[0] for t in tables])
    print(f"Total Tables Count: {len(tables)}")
    print("Database Sequences:", [s[0] for s in seqs])
    print(f"Total Sequences Count: {len(seqs)}")

