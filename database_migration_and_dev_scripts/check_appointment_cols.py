import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from database import engine
from sqlmodel import Session, text

with Session(engine) as session:
    cols = session.execute(text("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'appointment';
    """)).fetchall()
    print("Columns in appointment table:")
    for c in cols:
        print(f" - {c[0]} ({c[1]})")
