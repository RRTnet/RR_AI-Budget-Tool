"""
app/schemas/schemas.py
───────────────────────
Pydantic models for request validation and response serialisation.

Naming convention:
  *Create   → POST body (all required fields)
  *Update   → PATCH body (all fields optional)
  *Response → JSON returned to the client
"""
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import date
import re


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email:            EmailStr
    name:             str
    password:         str
    currency:         str = "USD"
    phone_number:     Optional[str] = None   # E.164 format: +14155552671
    reminder_time:    str = "20:00"          # HH:MM in user's local time
    timezone:         str = "UTC"            # IANA timezone string
    reminder_channel: str = "whatsapp"       # "sms" | "whatsapp"

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v):
        if v is None:
            return v
        import phonenumbers
        try:
            parsed = phonenumbers.parse(v)
            if not phonenumbers.is_valid_number(parsed):
                raise ValueError("Invalid phone number.")
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        except phonenumbers.NumberParseException:
            raise ValueError(
                "Phone must be in E.164 format (e.g. +14155552671) "
                "or include a country code prefix."
            )

    @field_validator("reminder_time")
    @classmethod
    def validate_time(cls, v):
        if not re.match(r"^\d{2}:\d{2}$", v):
            raise ValueError("reminder_time must be HH:MM (e.g. '20:00').")
        h, m = int(v[:2]), int(v[3:])
        if not (0 <= h <= 23 and 0 <= m <= 59):
            raise ValueError("reminder_time out of range.")
        return v


class UserLogin(BaseModel):
    email:    EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"


class UserResponse(BaseModel):
    id:               int
    email:            str
    name:             str
    currency:         str
    phone_number:     Optional[str] = None
    reminder_enabled: bool = False
    reminder_time:    str = "20:00"
    timezone:         str = "UTC"
    reminder_channel: str = "whatsapp"

    model_config = {"from_attributes": True}


class ReminderSettingsUpdate(BaseModel):
    phone_number:     Optional[str] = None
    reminder_enabled: Optional[bool] = None
    reminder_time:    Optional[str] = None
    timezone:         Optional[str] = None
    reminder_channel: Optional[str] = None

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v):
        if v is None:
            return v
        import phonenumbers
        try:
            parsed = phonenumbers.parse(v)
            if not phonenumbers.is_valid_number(parsed):
                raise ValueError("Invalid phone number.")
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        except phonenumbers.NumberParseException:
            raise ValueError(
                "Phone must be in E.164 format (e.g. +14155552671)."
            )

    @field_validator("reminder_time")
    @classmethod
    def validate_time(cls, v):
        if v is None:
            return v
        if not re.match(r"^\d{2}:\d{2}$", v):
            raise ValueError("reminder_time must be HH:MM (e.g. '20:00').")
        h, m = int(v[:2]), int(v[3:])
        if not (0 <= h <= 23 and 0 <= m <= 59):
            raise ValueError("reminder_time out of range.")
        return v


# ── Income ────────────────────────────────────────────────────────────────────

class IncomeCreate(BaseModel):
    label:        str
    amount:       float
    currency:     Optional[str] = None      # overrides user default; e.g. "EUR", "INR"
    category:     str = "other"
    date:         date
    note:         Optional[str] = None
    is_recurring: bool = False


class IncomeUpdate(BaseModel):
    label:        Optional[str]   = None
    amount:       Optional[float] = None
    currency:     Optional[str]   = None
    category:     Optional[str]   = None
    date:         Optional[date]  = None
    note:         Optional[str]   = None
    is_recurring: Optional[bool]  = None


class IncomeResponse(BaseModel):
    id:           int
    label:        str
    amount:       float
    currency:     Optional[str] = None
    category:     str
    date:         date
    note:         Optional[str]
    is_recurring: bool

    model_config = {"from_attributes": True}


# ── Expenses ──────────────────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    label:             str
    amount:            float
    currency:          Optional[str] = None
    category:          str = "other"
    date:              date
    note:              Optional[str] = None
    is_recurring:      bool = False
    recurrence_period: Optional[str] = None   # "monthly" | "weekly" | "yearly"


class ExpenseUpdate(BaseModel):
    label:             Optional[str]   = None
    amount:            Optional[float] = None
    currency:          Optional[str]   = None
    category:          Optional[str]   = None
    date:              Optional[date]  = None
    note:              Optional[str]   = None
    is_recurring:      Optional[bool]  = None
    recurrence_period: Optional[str]   = None


class ExpenseResponse(BaseModel):
    id:                int
    label:             str
    amount:            float
    currency:          Optional[str] = None
    category:          str
    date:              date
    note:              Optional[str]
    is_recurring:      bool = False
    recurrence_period: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Goals ─────────────────────────────────────────────────────────────────────

class GoalCreate(BaseModel):
    name:     str
    target:   float
    saved:    float = 0.0
    color:    str = "#c9a84c"
    currency: Optional[str] = None          # overrides user default; e.g. "EUR", "INR"


class GoalUpdate(BaseModel):
    name:     Optional[str]   = None
    target:   Optional[float] = None
    saved:    Optional[float] = None
    color:    Optional[str]   = None
    currency: Optional[str]   = None


class GoalResponse(BaseModel):
    id:       int
    name:     str
    target:   float
    saved:    float
    color:    str
    currency: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Summary ───────────────────────────────────────────────────────────────────

class CategoryBreakdown(BaseModel):
    category: str
    total:    float
    pct:      float


class SummaryResponse(BaseModel):
    month:                int
    year:                 int
    total_income:         float
    total_expenses:       float
    net_savings:          float
    savings_rate:         float
    income_by_category:   List[CategoryBreakdown]
    expense_by_category:  List[CategoryBreakdown]
    top_expense:          Optional[str]


# ── Budgets ───────────────────────────────────────────────────────────────────

class BudgetCreate(BaseModel):
    category:      str
    monthly_limit: float
    currency:      str = "USD"


class BudgetUpdate(BaseModel):
    monthly_limit: Optional[float] = None
    currency:      Optional[str]   = None


class BudgetResponse(BaseModel):
    id:            int
    category:      str
    monthly_limit: float
    currency:      str

    model_config = {"from_attributes": True}


# ── AI Advisor ────────────────────────────────────────────────────────────────

class AIAdviceRequest(BaseModel):
    question: Optional[str] = None


class AIAdviceResponse(BaseModel):
    advice:     str
    model_used: str
    tokens:     Optional[int] = None
