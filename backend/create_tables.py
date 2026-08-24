"""
create_tables.py
-------------
One-time script that reads every model defined in models.py and creates
the actual tables inside our Neon PostgreSQL database.

Run this ONCE after adding new tables or changing existing ones.
This does NOT delete existing data — it only creates tables that
don't already exist yet.

Owner: Anjanadri (Phase 1)

HOW TO RUN:
    (venv) PS ...\backend> python create_tables.py
"""

from sqlmodel import SQLModel
from database import engine

# Importing models.py here is REQUIRED even though we don't use its
# contents directly in this file. Just importing it is what tells
# SQLModel "these table definitions exist" — without this line,
# SQLModel wouldn't know Department, Doctor, Patient, etc. exist at all.
import models  # noqa: F401


def create_all_tables():
    print("Creating tables in Neon database...")
    SQLModel.metadata.create_all(engine)
    print("Done. Check DBeaver to confirm all 7 tables now exist.")


if __name__ == "__main__":
    create_all_tables()