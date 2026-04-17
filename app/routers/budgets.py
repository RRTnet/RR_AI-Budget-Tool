"""
app/routers/budgets.py
──────────────────────
Monthly budget limits per category.

Endpoints:
  GET    /api/budgets        → list all budgets for the current user
  POST   /api/budgets        → create a budget limit
  PUT    /api/budgets/{id}   → update a budget limit
  DELETE /api/budgets/{id}   → remove a budget limit
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.database import Budget
from app.schemas.schemas import BudgetCreate, BudgetUpdate, BudgetResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/budgets", tags=["Budgets"])


@router.get("", response_model=list[BudgetResponse])
def list_budgets(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return db.query(Budget).filter(Budget.user_id == user.id).all()


@router.post("", response_model=BudgetResponse, status_code=201)
def create_budget(
    body: BudgetCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    # One budget per category per user — upsert behaviour
    existing = db.query(Budget).filter(
        Budget.user_id == user.id,
        Budget.category == body.category,
    ).first()
    if existing:
        existing.monthly_limit = body.monthly_limit
        existing.currency = body.currency
        db.commit()
        db.refresh(existing)
        return existing

    budget = Budget(
        user_id=user.id,
        category=body.category,
        monthly_limit=body.monthly_limit,
        currency=body.currency,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    body: BudgetUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    budget = db.query(Budget).filter(
        Budget.id == budget_id, Budget.user_id == user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(budget, field, value)
    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/{budget_id}", status_code=204)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    budget = db.query(Budget).filter(
        Budget.id == budget_id, Budget.user_id == user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()
