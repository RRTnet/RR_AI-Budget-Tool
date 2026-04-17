"""
app/routers/goals.py
─────────────────────
Wealth goals and monthly summary endpoints.

Goals CRUD:
  GET    /api/goals          → List all goals
  POST   /api/goals          → Create a goal
  PATCH  /api/goals/{id}     → Update a goal (e.g. add savings)
  DELETE /api/goals/{id}     → Delete a goal

Summary:
  GET /api/summary           → Monthly financial summary
"""
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.database import Goal, User
from app.schemas.schemas import GoalCreate, GoalUpdate, GoalResponse, SummaryResponse
from app.services.auth import get_current_user
from app.services.summary import get_monthly_summary

# Two separate routers so they can use different prefixes
goals_router   = APIRouter(prefix="/api/goals",   tags=["Goals"])
summary_router = APIRouter(prefix="/api/summary", tags=["Summary"])


# ── Goals CRUD ────────────────────────────────────────────────────────────────

def _get_goal_or_404(db: Session, goal_id: int, user_id: int) -> Goal:
    row = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal #{goal_id} not found.",
        )
    return row


@goals_router.get("", response_model=List[GoalResponse])
def list_goals(
    db:   Session = Depends(get_db),
    user: User    = Depends(get_current_user),
):
    """Return all wealth goals for the current user."""
    return db.query(Goal).filter(Goal.user_id == user.id).all()


@goals_router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: GoalCreate,
    db:      Session = Depends(get_db),
    user:    User    = Depends(get_current_user),
):
    """
    Create a new wealth goal.

    Request body example:
    {
        "name": "Emergency Fund",
        "target": 20000,
        "saved": 5000,
        "color": "#c9a84c"
    }
    """
    goal = Goal(user_id=user.id, **payload.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@goals_router.patch("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    payload: GoalUpdate,
    db:      Session = Depends(get_db),
    user:    User    = Depends(get_current_user),
):
    """
    Update a wealth goal.
    Use this to rename, adjust the target, or record new savings.
    """
    row = _get_goal_or_404(db, goal_id, user.id)

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(row, field, value)

    db.commit()
    db.refresh(row)
    return row


@goals_router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    db:      Session = Depends(get_db),
    user:    User    = Depends(get_current_user),
):
    """Delete a wealth goal. Returns 204 No Content on success."""
    row = _get_goal_or_404(db, goal_id, user.id)
    db.delete(row)
    db.commit()


# ── Monthly Summary ───────────────────────────────────────────────────────────

@summary_router.get("", response_model=SummaryResponse)
def monthly_summary(
    month: int     = Query(default=date.today().month, ge=1, le=12),
    year:  int     = Query(default=date.today().year,  ge=2000),
    db:    Session = Depends(get_db),
    user:  User    = Depends(get_current_user),
):
    """
    Get a full monthly financial summary including:
    - Total income, expenses, net savings, savings rate
    - Income and expense breakdown by category
    - Top expense item

    Defaults to the current calendar month.
    Example: GET /api/summary?month=3&year=2025
    """
    return get_monthly_summary(db, user.id, month, year)
