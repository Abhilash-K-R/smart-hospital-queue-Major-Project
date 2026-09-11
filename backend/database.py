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
# Neon PostgreSQL is serverless and drops idle connections.
# pool_pre_ping=True automatically tests connections before use and reconnects if stale.
# pool_recycle=300 refreshes connections every 5 minutes.
engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=60,
    pool_size=5,
    max_overflow=10,
    connect_args={"connect_timeout": 15}
)
