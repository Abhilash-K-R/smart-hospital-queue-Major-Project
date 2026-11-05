import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from database import engine
from sqlmodel import Session, text

print("="*60)
print("ADDING predicted_duration & symptoms TO appointment TABLE")
print("="*60)

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE appointment ADD COLUMN IF NOT EXISTS predicted_duration INTEGER DEFAULT 30;
        ALTER TABLE appointment ADD COLUMN IF NOT EXISTS symptoms TEXT;
    """))
    conn.commit()
    print("Migration successful: added predicted_duration and symptoms columns!")

with Session(engine) as session:
    res = session.execute(text("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'appointment' AND column_name IN ('predicted_duration', 'symptoms');
    """)).fetchall()
    for r in res:
        print(f"Verified column: {r[0]} ({r[1]})")

print("="*60)
