"""
app/services/scheduler.py
──────────────────────────
APScheduler-based daily reminder system (SMS + WhatsApp).

How it works:
  • A BackgroundScheduler runs a job every minute.
  • The job queries all users with reminder_enabled=True and a phone number.
  • For each user it checks if the current time in their timezone matches
    their chosen reminder_time (HH:MM).
  • If it matches, a message is sent via the user's preferred channel
    (SMS or WhatsApp) through app.services.sms.

The scheduler is started on app startup and stopped on shutdown (main.py).
"""
import logging
from datetime import datetime

import pytz
from apscheduler.schedulers.background import BackgroundScheduler

from app.services.sms import send_expense_reminder

logger = logging.getLogger(__name__)

_scheduler = BackgroundScheduler(timezone="UTC")


def _check_and_send_reminders() -> None:
    """
    Called every minute.  Finds users whose local clock matches their
    reminder_time and sends them an SMS.
    """
    # Import here to avoid circular imports at module load time
    from app.database import SessionLocal
    from app.models.database import User

    db = SessionLocal()
    try:
        users = (
            db.query(User)
            .filter(
                User.reminder_enabled == True,       # noqa: E712
                User.phone_number.isnot(None),
                User.phone_number != "",
            )
            .all()
        )

        for user in users:
            try:
                tz = pytz.timezone(user.timezone or "UTC")
            except pytz.UnknownTimeZoneError:
                tz = pytz.UTC

            local_now = datetime.now(tz)
            current_hhmm = local_now.strftime("%H:%M")

            if current_hhmm == (user.reminder_time or "20:00"):
                channel = user.reminder_channel or "whatsapp"
                logger.info(
                    "Sending %s reminder to user %s (%s) at %s %s",
                    channel.upper(), user.id, user.email,
                    current_hhmm, user.timezone,
                )
                send_expense_reminder(user.phone_number, user.name, channel=channel)

    except Exception as exc:
        logger.error("Reminder job error: %s", exc)
    finally:
        db.close()


def start_scheduler() -> None:
    """Start the background scheduler (called once on app startup)."""
    _scheduler.add_job(
        _check_and_send_reminders,
        trigger="interval",
        minutes=1,
        id="daily_expense_reminder",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Reminder scheduler started — checking every minute.")


def stop_scheduler() -> None:
    """Gracefully stop the scheduler (called on app shutdown)."""
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Reminder scheduler stopped.")
