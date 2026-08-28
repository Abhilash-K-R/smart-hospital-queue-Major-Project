"""
backend/config.py
-----------------
Application configuration and environment variables loader.
Manages database connection strings, JWT secret keys, hospital coordinates,
and Google Maps API credentials.
"""

import os
from dotenv import load_dotenv

# Load variables from .env file into environment
load_dotenv()

# Database & Authentication
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./hospital.db")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "smart_hospital_queue_default_dev_secret_key_12345")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Google Maps API Configuration
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

# Default Hospital Geographic Coordinates (Siddaganga Institute / SIET Tumakuru coordinates or configured hospital location)
HOSPITAL_LATITUDE = float(os.getenv("HOSPITAL_LATITUDE", "13.340881"))
HOSPITAL_LONGITUDE = float(os.getenv("HOSPITAL_LONGITUDE", "77.100601"))
