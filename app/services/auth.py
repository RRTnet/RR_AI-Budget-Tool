"""
app/services/auth.py
─────────────────────
Authentication helpers: password hashing, JWT creation & verification.

The `get_current_user` FastAPI dependency is used to protect routes:

    user: User = Depends(get_current_user)
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.database import User

_ALGORITHM = "HS256"
_bearer    = HTTPBearer()


# ── Password helpers ───────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Return a bcrypt hash of the plain-text password."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    """Return True if password matches the stored hash."""
    return bcrypt.checkpw(password.encode(), hashed.encode())


# ── JWT helpers ────────────────────────────────────────────────────────────────

def create_access_token(user_id: int) -> str:
    """Create a signed JWT token that expires after the configured duration."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=_ALGORITHM)


# ── FastAPI dependency ─────────────────────────────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    """
    Extract and verify the Bearer token, then return the matching User.
    Raises 401 if the token is missing, invalid, or expired.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[_ALGORITHM])
        user_id = int(payload["sub"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
        )
    return user
