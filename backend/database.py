"""
backend/database.py
-------------
Sets up the connection between our FastAPI backend and our Neon PostgreSQL
database. Every other file that needs to talk to the database imports
`engine` from here — we only define the connection ONCE in the whole project.

Owner: Anjanadri (Phase 1)
"""

from sqlmodel import create_engine
from dotenv import load_dotenv
import os

# Reads the .env file in this folder and loads DATABASE_URL into memory.
# This keeps our real password OUT of the code itself (and out of GitHub).
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# The "engine" is SQLAlchemy/SQLModel's term for "the object that knows
# how to actually talk to the database." Every query eventually goes
# through this engine.
#
# echo=True prints every SQL command to the terminal as it runs.
# This is ONLY useful while learning/debugging — we will set this to
# False before deployment, since it clutters real logs.
engine = create_engine(DATABASE_URL, echo=True)