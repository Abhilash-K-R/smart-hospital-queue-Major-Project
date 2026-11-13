"""
backend/database.py
-------------
Sets up the connection between our FastAPI backend and our Neon PostgreSQL
database. Every other file that needs to talk to the database imports
`engine` from here — we only define the connection ONCE in the whole project.

Owner: Anjanadri (Phase 1)
"""

from sqlmodel import create_engine
import os
import socket
try:
    import dns.resolver
    HAS_DNS_RESOLVER = True
except ImportError:
    HAS_DNS_RESOLVER = False

# Robust DNS fallback for serverless DB host resolution when local ISP DNS fails
_orig_getaddrinfo = socket.getaddrinfo

def _fallback_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    try:
        return _orig_getaddrinfo(host, port, family, type, proto, flags)
    except socket.gaierror:
        if HAS_DNS_RESOLVER and isinstance(host, str) and "neon.tech" in host:
            try:
                resolver = dns.resolver.Resolver()
                resolver.nameservers = ['8.8.8.8', '1.1.1.1']
                answers = resolver.resolve(host, 'A')
                ip = str(answers[0])
                return _orig_getaddrinfo(ip, port, family, type, proto, flags)
            except Exception:
                pass
        raise

socket.getaddrinfo = _fallback_getaddrinfo

from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
    elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

# The "engine" is SQLAlchemy/SQLModel's term for "the object that knows
# how to actually talk to the database." Every query eventually goes
# through this engine.
#
# Neon PostgreSQL is serverless and drops idle connections.
# pool_pre_ping=True automatically tests connections before use and reconnects if stale.
# pool_recycle=300 refreshes connections every 5 minutes.
connect_args = {
    "connect_timeout": 30,
    "keepalives": 1,
    "keepalives_idle": 30,
    "keepalives_interval": 10,
    "keepalives_count": 5,
}

# Note: Neon PostgreSQL requires SNI with the endpoint hostname.
# Do NOT pass hostaddr for neon.tech as raw IPs cause TLS SNI handshake failure.

is_render = os.getenv("RENDER") is not None or os.getenv("ENVIRONMENT") == "production"
use_sqlite = not is_render and (os.getenv("USE_LOCAL_SQLITE", "true").lower() == "true" or not DATABASE_URL or DATABASE_URL.startswith("sqlite"))

if use_sqlite:
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "hospital.db"))
    engine = create_engine(
        f"sqlite:///{db_path}",
        echo=False,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        pool_recycle=60,
        pool_size=10,
        max_overflow=20,
        connect_args=connect_args
    )

