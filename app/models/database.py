"""
app/models/database.py
───────────────────────
SQLAlchemy ORM models (maps Python classes → database tables).

Tables:
  users     — registered accounts
  income    — income entries (salary, freelance, investments, …)
  expenses  — expense entries (rent, food, utilities, …)
  goals     — wealth savings goals (emergency fund, vacation, …)
"""
from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    Date, DateTime, ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String, unique=True, index=True, nullable=False)
    name          = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    currency      = Column(String, default="USD")
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    # ── Reminder fields ────────────────────────────────────────────
    phone_number      = Column(String, nullable=True)          # E.164 format, e.g. +14155552671
    reminder_enabled  = Column(Boolean, default=False)         # opt-in
    reminder_time     = Column(String, default="20:00")        # HH:MM in user's timezone
    timezone          = Column(String, default="UTC")          # IANA timezone, e.g. "America/New_York"
    reminder_channel  = Column(String, default="whatsapp")     # "sms" | "whatsapp"

    # Relationships
    income   = relationship("Income",  back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    goals    = relationship("Goal",    back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User id={self.id} email={self.email}>"


class Income(Base):
    __tablename__ = "income"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    label        = Column(String, nullable=False)
    amount       = Column(Float, nullable=False)
    currency     = Column(String, nullable=True)          # e.g. "USD", "EUR" — falls back to user.currency
    category     = Column(String, nullable=False, default="other")
    date         = Column(Date, nullable=False)
    note         = Column(String, nullable=True)
    is_recurring = Column(Boolean, default=False)

    user = relationship("User", back_populates="income")

    def __repr__(self):
        return f"<Income id={self.id} label={self.label} amount={self.amount}>"


class Expense(Base):
    __tablename__ = "expenses"

    id                 = Column(Integer, primary_key=True, index=True)
    user_id            = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    label              = Column(String, nullable=False)
    amount             = Column(Float, nullable=False)
    currency           = Column(String, nullable=True)
    category           = Column(String, nullable=False, default="other")
    date               = Column(Date, nullable=False)
    note               = Column(String, nullable=True)
    is_recurring       = Column(Boolean, default=False)
    recurrence_period  = Column(String, nullable=True)   # "monthly" | "weekly" | "yearly"

    user = relationship("User", back_populates="expenses")

    def __repr__(self):
        return f"<Expense id={self.id} label={self.label} amount={self.amount}>"


class Goal(Base):
    __tablename__ = "goals"

    id       = Column(Integer, primary_key=True, index=True)
    user_id  = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name     = Column(String, nullable=False)
    target   = Column(Float, nullable=False)
    saved    = Column(Float, default=0.0)
    color    = Column(String, default="#c9a84c")
    currency = Column(String, nullable=True)              # e.g. "USD", "EUR" — falls back to user.currency

    user = relationship("User", back_populates="goals")

    def __repr__(self):
        return f"<Goal id={self.id} name={self.name} saved={self.saved}/{self.target}>"


class Budget(Base):
    __tablename__ = "budgets"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category      = Column(String, nullable=False)
    monthly_limit = Column(Float, nullable=False)
    currency      = Column(String, nullable=False, default="USD")

    user = relationship("User")
