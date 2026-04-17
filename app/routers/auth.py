"""
app/routers/auth.py
────────────────────
Authentication endpoints.

POST  /api/auth/register          → create account, return JWT
POST  /api/auth/login             → verify credentials, return JWT
GET   /api/auth/me                → return current user profile
PATCH /api/auth/reminder-settings → update phone / reminder preferences
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.database import User
from app.schemas.schemas import (
    UserRegister, UserLogin, TokenResponse, UserResponse,
    ReminderSettingsUpdate,
)
from app.services.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """
    Create a new account.

    Returns a JWT token on success.
    Returns 400 if the email is already registered.
    """
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    user = User(
        email=payload.email,
        name=payload.name,
        password_hash=hash_password(payload.password),
        currency=payload.currency,
        phone_number=payload.phone_number,
        reminder_enabled=bool(payload.phone_number),  # auto-enable if phone provided
        reminder_time=payload.reminder_time,
        timezone=payload.timezone,
        reminder_channel=payload.reminder_channel,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """
    Log in with email + password.

    Returns a JWT token on success.
    Returns 401 if credentials are invalid (generic message to prevent enumeration).
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    return user


@router.patch("/reminder-settings", response_model=UserResponse)
def update_reminder_settings(
    payload: ReminderSettingsUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update phone number and/or reminder preferences for the logged-in user.

    All fields are optional — send only what you want to change.
    """
    if payload.phone_number is not None:
        user.phone_number = payload.phone_number
    if payload.reminder_enabled is not None:
        user.reminder_enabled = payload.reminder_enabled
    if payload.reminder_time is not None:
        user.reminder_time = payload.reminder_time
    if payload.timezone is not None:
        user.timezone = payload.timezone
    if payload.reminder_channel is not None:
        user.reminder_channel = payload.reminder_channel

    db.commit()
    db.refresh(user)
    return user
