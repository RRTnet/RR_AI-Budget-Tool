"""
app/services/summary.py
────────────────────────
Monthly financial summary calculations.

Used by:
  - GET /api/summary  (returns SummaryResponse to the client)
  - POST /api/advisor (provides context for the AI prompt)
"""
from sqlalchemy.orm import Session
from sqlalchemy import extract

from app.models.database import Income, Expense
from app.schemas.schemas import SummaryResponse, CategoryBreakdown


def get_monthly_summary(
    db:      Session,
    user_id: int,
    month:   int,
    year:    int,
) -> SummaryResponse:
    """
    Calculate totals, breakdowns, and savings rate for a given month/year.
    Returns a SummaryResponse (Pydantic model, safe to serialise directly).
    """
    # ── Fetch rows ─────────────────────────────────────────────────
    income_rows = (
        db.query(Income)
        .filter(
            Income.user_id == user_id,
            extract("month", Income.date) == month,
            extract("year",  Income.date) == year,
        )
        .all()
    )

    expense_rows = (
        db.query(Expense)
        .filter(
            Expense.user_id == user_id,
            extract("month", Expense.date) == month,
            extract("year",  Expense.date) == year,
        )
        .all()
    )

    # ── Aggregate totals ───────────────────────────────────────────
    total_income   = sum(r.amount for r in income_rows)
    total_expenses = sum(r.amount for r in expense_rows)
    net_savings    = total_income - total_expenses
    savings_rate   = (net_savings / total_income * 100) if total_income > 0 else 0.0

    # ── Income by category ─────────────────────────────────────────
    income_by_cat: dict[str, float] = {}
    for r in income_rows:
        income_by_cat[r.category] = income_by_cat.get(r.category, 0.0) + r.amount

    income_breakdown = [
        CategoryBreakdown(
            category=cat,
            total=total,
            pct=(total / total_income * 100) if total_income > 0 else 0.0,
        )
        for cat, total in sorted(income_by_cat.items(), key=lambda x: -x[1])
    ]

    # ── Expense by category ────────────────────────────────────────
    expense_by_cat: dict[str, float] = {}
    for r in expense_rows:
        expense_by_cat[r.category] = expense_by_cat.get(r.category, 0.0) + r.amount

    expense_breakdown = [
        CategoryBreakdown(
            category=cat,
            total=total,
            pct=(total / total_expenses * 100) if total_expenses > 0 else 0.0,
        )
        for cat, total in sorted(expense_by_cat.items(), key=lambda x: -x[1])
    ]

    # ── Top single expense ─────────────────────────────────────────
    top = max(expense_rows, key=lambda e: e.amount, default=None)
    top_expense = f"{top.label} ({top.category})" if top else None

    return SummaryResponse(
        month=month,
        year=year,
        total_income=total_income,
        total_expenses=total_expenses,
        net_savings=net_savings,
        savings_rate=savings_rate,
        income_by_category=income_breakdown,
        expense_by_category=expense_breakdown,
        top_expense=top_expense,
    )
