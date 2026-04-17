"""
app/config.py
─────────────
Centralised settings — reads from environment variables (or .env file).
All configuration lives here; other modules import `settings`.
"""
from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    # ── App ───────────────────────────────────────────────────────────
    APP_NAME:    str = "Rolling Revenue API"
    APP_VERSION: str = "1.0.0"
    DEBUG:       bool = True

    # ── Database ──────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://wealthuser:wealthpass@localhost:5432/wealthtracker"

    # ── Auth ──────────────────────────────────────────────────────────
    SECRET_KEY:                  str = "dev-secret-key-change-in-production-please"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ── CORS ──────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = [
        "http://localhost:9000",
        "http://localhost:3000",
    ]

    # ── Ollama / AI ───────────────────────────────────────────────────
    OLLAMA_BASE_URL: str = "http://host.docker.internal:11434"
    OLLAMA_MODEL:    str = "qwen3:30b"

    # ── Twilio / SMS & WhatsApp ───────────────────────────────────────
    TWILIO_ACCOUNT_SID:       str = ""
    TWILIO_AUTH_TOKEN:        str = ""
    TWILIO_FROM_NUMBER:       str = ""   # E.164 SMS sender, e.g. +14155552671
    TWILIO_WHATSAPP_FROM:     str = "whatsapp:+14155238886"  # Sandbox default; replace with WA Business number in prod

    # ── Reminder defaults ─────────────────────────────────────────────
    DEFAULT_REMINDER_TIME: str = "20:00"  # 8 PM
    DEFAULT_TIMEZONE:      str = "UTC"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
