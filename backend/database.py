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
import dns.resolver

# Robust DNS fallback for serverless DB host resolution when local ISP DNS fails
_orig_getaddrinfo = socket.getaddrinfo

def _fallback_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    try:
        return _orig_getaddrinfo(host, port, family, type, proto, flags)
    except socket.gaierror:
        if isinstance(host, str) and "neon.tech" in host:
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
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# The "engine" is SQLAlchemy/SQLModel's term for "the object that knows
# how to actually talk to the database." Every query eventually goes
# through this engine.
#
# Neon PostgreSQL is serverless and drops idle connections.
# pool_pre_ping=True automatically tests connections before use and reconnects if stale.
# pool_recycle=300 refreshes connections every 5 minutes.
connect_args = {
    "connect_timeout": 15,
    "keepalives": 1,
    "keepalives_idle": 30,
    "keepalives_interval": 10,
    "keepalives_count": 5,
}

# Ensure hostaddr is available if local DNS is unresponsive
try:
    if DATABASE_URL and "@" in DATABASE_URL:
        host_part = DATABASE_URL.split("@")[1].split("/")[0].split("?")[0]
        if ":" in host_part:
            host_part = host_part.split(":")[0]
        try:
            socket.gethostbyname(host_part)
        except Exception:
            resolver = dns.resolver.Resolver()
            resolver.nameservers = ['8.8.8.8', '1.1.1.1']
            answers = resolver.resolve(host_part, 'A')
            if answers:
                connect_args["hostaddr"] = str(answers[0])
except Exception:
    pass

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=60,
    pool_size=10,
    max_overflow=20,
    connect_args=connect_args
)
