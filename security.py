"""
Password hashing + JWT helpers.

POC NOTE: password hashing uses stdlib hashlib.pbkdf2_hmac rather than
bcrypt/argon2, purely to avoid native-dependency install friction in this
POC. 100k iterations + per-password random salt is a reasonable baseline,
but swap this for passlib[bcrypt] or argon2-cffi before real user
passwords ever touch this.
"""
import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta
from typing import Optional

import jwt

from config import settings

PBKDF2_ITERATIONS = 100_000


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return f"{base64.b64encode(salt).decode()}${base64.b64encode(dk).decode()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_b64, hash_b64 = stored_hash.split("$")
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(hash_b64)
    except (ValueError, AttributeError):
        return False
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return hmac.compare_digest(dk, expected)


def create_access_token(user_id: int, household_id: int, is_admin: bool) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(user_id),
        "household_id": household_id,
        "is_admin": is_admin,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        return None
