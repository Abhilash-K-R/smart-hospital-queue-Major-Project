"""
backend/auth.py
-------------
Handles two separate jobs:
  1. Password hashing — turning a real password into a scrambled string
     before storing it, and checking a login attempt against that scramble.
  2. JWT tokens — creating a signed "access pass" after login, and verifying
     that pass on later requests, so patients/staff don't need to log in
     on every single API call.

Owner: Abhilash (Phase 2)
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext
from dotenv import load_dotenv
import os

load_dotenv()

# ---- Config ----
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"  # standard signing algorithm for JWT, widely used and secure enough for this project
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # tokens auto-expire after 1 hour, forcing re-login for security

# passlib's CryptContext handles the actual hashing math for us — we never
# write our own hashing algorithm, that's a well-known way to introduce
# security bugs. bcrypt is a well-established, slow-by-design algorithm
# (slow is GOOD here — it makes brute-force password guessing expensive).
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------------------------------------------------------------------
# PASSWORD HASHING
# ---------------------------------------------------------------------

def hash_password(plain_password: str) -> str:
    """
    Converts a real password into a scrambled hash before we store it.
    We NEVER store plain-text passwords in the database.
    """
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Checks a login attempt's password against the stored hash.
    Returns True if they match, False otherwise.
    We never "unscramble" the hash — hashing is one-way by design.
    """
    return pwd_context.verify(plain_password, hashed_password)


# ---------------------------------------------------------------------
# JWT TOKEN CREATION AND VERIFICATION
# ---------------------------------------------------------------------

def create_access_token(data: dict) -> str:
    """
    Creates a signed JWT token containing whatever data we pass in
    (usually just the user's id and role, e.g. {"sub": "5", "role": "patient"}).

    "sub" is a standard JWT field name meaning "subject" — who this token
    is about. We're using it to store the user's database ID.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})  # "exp" is a standard JWT field for expiry time
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_access_token(token: str) -> Optional[dict]:
    """
    Checks if a token is valid (correctly signed, not expired) and
    returns its data if so. Returns None if the token is invalid/expired —
    the calling code decides what to do with that (usually: reject the request).
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
    
# ---------------------------------------------------------------------
# ROUTE PROTECTION — use this to guard endpoints that require login
# ---------------------------------------------------------------------

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# This tells FastAPI: "expect a token in the Authorization header,
# formatted as 'Bearer <token>'". tokenUrl is just for the /docs page's
# 'Authorize' button — it doesn't affect logic.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login/patient")


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Reusable dependency. Add `current_user: dict = Depends(get_current_user)`
    as a parameter to ANY route, and FastAPI will automatically:
      1. Extract the token from the request's Authorization header
      2. Verify it using verify_access_token()
      3. Reject the request with 401 if invalid/expired
      4. Otherwise, hand back the token's data (patient id + role) to your route

    This means we write the "check if logged in" logic ONCE here,
    instead of repeating it in every single protected endpoint.
    """
    payload = verify_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload