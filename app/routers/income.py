"""
app/routers/income.py
──────────────────────
All income-related endpoints. Every route requires authentication.

GET    /api/income           → List all income (with optional filters)
POST   /api/income           → Add new income entry
GET    /api/income/{id}      → Get single entry
PATCH  /api/income/{id}      → Update entry (partial)
DELETE /api/income/{id}      → Delete entry
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import extract
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models.database import Income, User
from app.schemas.schemas import IncomeCreate, IncomeUpdate, IncomeResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/income", tags=["Income"])


def _get_or_404(db: Session, income_id: int, user_id: int) -> Income:
    """Fetch an income row or raise 404. Also ensures it belongs to this user."""
    row = db.query(Income).filter(
        Income.id == income_id,
        Income.user_id == user_id,
    ).first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Income entry #{income_id} not found.",
        )
    return row


@router.get("", response_model=List[IncomeResponse])
def list_income(
    month:    Optional[int] = Query(None, ge=1, le=12, description="Filter by month (1-12)"),
    year:     Optional[int] = Query(None, ge=2000,      description="Filter by year"),
    category: Optional[str] = Query(None,               description="Filter by category"),
    db:       Session        = Depends(get_db),
    user:     User           = Depends(get_current_user),
):
    """
    Return all income entries for the current user.
    Optionally filter by month, year, or category.

    Example: GET /api/income?month=3&year=2025
    """
    query = db.query(Income).filter(Income.user_id == user.id)

    if month:
        query = query.filter(extract("month", Income.date) == month)
    if year:
        query = query.filter(extract("year", Income.date) == year)
    if category:
        query = query.filter(Income.category == category)

    return query.order_by(Income.date.desc()).all()


@router.post("", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
def create_income(
    payload: IncomeCreate,
    db:      Session = Depends(get_db),
    user:    User    = Depends(get_current_user),
):
    """
    Add a new income entry.

    Request body example:
    {
        "label": "March Salary",
        "amount": 8500,
        "category": "salary",
        "date": "2025-03-01",
        "note": "Includes overtime",
        "is_recurring": true
    }
    """
    income = Income(user_id=user.id, **payload.model_dump())
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


@router.get("/{income_id}", response_model=IncomeResponse)
def get_income(
    income_id: int,
    db:        Session = Depends(get_db),
    user:      User    = Depends(get_current_user),
):
    """Get a single income entry by ID."""
    return _get_or_404(db, income_id, user.id)


@router.patch("/{income_id}", response_model=IncomeResponse)
def update_income(
    income_id: int,
    payload:   IncomeUpdate,
    db:        Session = Depends(get_db),
    user:      User    = Depends(get_current_user),
):
    """Partially update an income entry. Only send the fields you want to change."""
    row = _get_or_404(db, income_id, user.id)

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(row, field, value)

    db.commit()
    db.refresh(row)
    return row


@router.delete("/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income(
    income_id: int,
    db:        Session = Depends(get_db),
    user:      User    = Depends(get_current_user),
):
    """Delete an income entry. Returns 204 No Content on success."""
    row = _get_or_404(db, income_id, user.id)
    db.delete(row)
    db.commit()
