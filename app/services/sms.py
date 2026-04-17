"""
app/services/sms.py
────────────────────
Twilio messaging service — supports both SMS and WhatsApp reminders.

WhatsApp notes:
  • Twilio prefixes "whatsapp:" to both from_ and to numbers.
  • Testing: use the Twilio Sandbox (users must opt in once by sending
    a join code to whatsapp:+14155238886).
  • Production: set TWILIO_WHATSAPP_FROM to your approved WA Business number.

Environment variables (.env):
    TWILIO_ACCOUNT_SID       — starts with "AC"
    TWILIO_AUTH_TOKEN        — Twilio auth token
    TWILIO_FROM_NUMBER       — E.164 SMS sender, e.g. +14155552671
    TWILIO_WHATSAPP_FROM     — WhatsApp sender, e.g. whatsapp:+14155238886
"""
import logging
from app.config import settings

logger = logging.getLogger(__name__)

REMINDER_BODY = (
    "Hi {name}! 💰 *Rolling Revenue* daily reminder:\n"
    "Don't forget to log today's expenses. "
    "Small habits build big wealth — every entry counts! 📊"
)


def is_configured() -> bool:
    """Return True only if the core Twilio credentials are set."""
    return bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN)


def send_expense_reminder(
    phone_number: str,
    user_name: str,
    channel: str = "whatsapp",   # "sms" | "whatsapp"
) -> bool:
    """
    Send a daily expense reminder via SMS or WhatsApp.

    Returns True on success, False on failure (logs the error).
    """
    if not is_configured():
        logger.warning(
            "Twilio not configured — skipping reminder for %s. "
            "Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env.",
            user_name,
        )
        return False

    # Build from / to based on channel
    if channel == "whatsapp":
        from_number = settings.TWILIO_WHATSAPP_FROM  # already has "whatsapp:" prefix
        to_number   = f"whatsapp:{phone_number}"
        if not from_number:
            logger.warning("TWILIO_WHATSAPP_FROM not set — cannot send WhatsApp reminder.")
            return False
    else:
        from_number = settings.TWILIO_FROM_NUMBER
        to_number   = phone_number
        if not from_number:
            logger.warning("TWILIO_FROM_NUMBER not set — cannot send SMS reminder.")
            return False

    try:
        from twilio.rest import Client

        client  = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=REMINDER_BODY.format(name=user_name),
            from_=from_number,
            to=to_number,
        )
        logger.info(
            "Reminder sent via %s to %s (SID: %s)",
            channel.upper(), phone_number, message.sid,
        )
        return True

    except Exception as exc:
        logger.error("Failed to send %s reminder to %s: %s", channel, phone_number, exc)
        return False
