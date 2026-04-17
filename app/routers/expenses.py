"""
app/routers/expenses.py
────────────────────────
All expense-related endpoints. Every route requires authentication.

GET    /api/expenses           → List all expenses (with optional filters)
POST   /api/expenses           → Add new expense entry
GET    /api/expenses/{id}      → Get single entry
PATCH  /api/expenses/{id}      → Update entry (partial)
DELETE /api/expenses/{id}      → Delete entry
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import extract
from typing import List, Optional

from app.database import get_db
from app.models.database import Expense, User
from app.schemas.schemas import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])


def _get_or_404(db: Session, expense_id: int, user_id: int) -> Expense:
    """Fetch an expense row or raise 404. Also ensures it belongs to this user."""
    row = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == user_id,
    ).first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense entry #{expense_id} not found.",
        )
    return row


@router.get("", response_model=List[ExpenseResponse])
def list_expenses(
    month:    Optional[int] = Query(None, ge=1, le=12, description="Filter by month (1-12)"),
    year:     Optional[int] = Query(None, ge=2000,      description="Filter by year"),
    category: Optional[str] = Query(None,               description="Filter by category"),
    db:       Session        = Depends(get_db),
    user:     User           = Depends(get_current_user),
):
    """
    Return all expense entries for the current user.
    Optionally filter by month, year, or category.

    Example: GET /api/expenses?month=3&year=2025
    """
    query = db.query(Expense).filter(Expense.user_id == user.id)

    if month:
        query = query.filter(extract("month", Expense.date) == month)
    if year:
        query = query.filter(extract("year", Expense.date) == year)
    if category:
        query = query.filter(Expense.category == category)

    return query.order_by(Expense.date.desc()).all()


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    db:      Session = Depends(get_db),
    user:    User    = Depends(get_current_user),
):
    """
    Add a new expense entry.

    Request body example:
    {
        "label": "Rent",
        "amount": 1800,
        "category": "housing",
        "date": "2025-03-01"
    }
    """
    expense = Expense(user_id=user.id, **payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    db:         Session = Depends(get_db),
    user:       User    = Depends(get_current_user),
):
    """Get a single expense entry by ID."""
    return _get_or_404(db, expense_id, user.id)


@router.patch("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    payload:    ExpenseUpdate,
    db:         Session = Depends(get_db),
    user:       User    = Depends(get_current_user),
):
    """Partially update an expense entry. Only send the fields you want to change."""
    row = _get_or_404(db, expense_id, user.id)

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(row, field, value)

    db.commit()
    db.refresh(row)
    return row


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db:         Session = Depends(get_db),
    user:       User    = Depends(get_current_user),
):
    """Delete an expense entry. Returns 204 No Content on success."""
    row = _get_or_404(db, expense_id, user.id)
    db.delete(row)
    db.commit()
