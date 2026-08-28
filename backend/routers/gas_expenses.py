"""
Gas expense endpoints: log who paid for gas and how much, per vehicle.
Independent additive entries -- no locking needed (unlike checkout/checkin
or reservations, there's no shared state being read-then-written).
"""
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import GasExpense, User
from core.deps import require_password_set

router = APIRouter(prefix="/api/vehicles/{vehicle_id}/gas-expenses", tags=["gas-expenses"])


class GasExpenseRequest(BaseModel):
    amount: float
    note: Optional[str] = None


class HolderOut(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class GasExpenseOut(BaseModel):
    id: int
    vehicle_id: int
    user: HolderOut
    amount: float
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=List[GasExpenseOut])
def list_gas_expenses(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_password_set),
):
    return (
        db.query(GasExpense)
        .filter(GasExpense.vehicle_id == vehicle_id, GasExpense.household_id == current_user.household_id)
        .order_by(GasExpense.created_at.desc())
        .all()
    )


@router.post("", response_model=GasExpenseOut)
def create_gas_expense(
    vehicle_id: int,
    req: GasExpenseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_password_set),
):
    if req.amount <= 0:
        raise HTTPException(400, "amount must be positive")

    expense = GasExpense(
        household_id=current_user.household_id,
        vehicle_id=vehicle_id,
        user_id=current_user.id,
        amount=req.amount,
        note=req.note,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=204)
def delete_gas_expense(
    vehicle_id: int,
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_password_set),
):
    expense = (
        db.query(GasExpense)
        .filter(
            GasExpense.id == expense_id,
            GasExpense.vehicle_id == vehicle_id,
            GasExpense.household_id == current_user.household_id,
        )
        .first()
    )
    if not expense:
        raise HTTPException(404, "Expense not found")
    if expense.user_id != current_user.id and not current_user.is_household_admin:
        raise HTTPException(403, "Only whoever logged it or an admin can delete it")

    db.delete(expense)
    db.commit()
