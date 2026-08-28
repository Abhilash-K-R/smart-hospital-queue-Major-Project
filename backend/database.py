"""
backend/database.py
-------------
Sets up the connection between our FastAPI backend and our database.
Every other file that needs to talk to the database imports
`engine` from here — we only define the connection ONCE in the whole project.

Owner: Anjanadri (Phase 1)
"""

from sqlmodel import create_engine
from config import DATABASE_URL

# The "engine" is SQLAlchemy/SQLModel's term for "the object that knows
# how to actually talk to the database." Every query eventually goes
# through this engine.
engine = create_engine(DATABASE_URL, echo=False)