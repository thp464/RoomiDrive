"""
Reservation endpoints.

Reservations are a hard block: while one is active (start_at <= now <
end_at) or upcoming, nobody but its owner can create an overlapping one,
and nobody but its owner can check the vehicle out during that window
(enforced in routers/vehicles.py's checkout_vehicle).
"""
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Reservation, User
from core.deps import require_password_set
from locking import vehicle_lock, LockNotAcquired

router = APIRouter(prefix="/api/vehicles/{vehicle_id}/reservations", tags=["reservations"])


class ReservationRequest(BaseModel):
    start_at: datetime
    end_at: datetime
    note: Optional[str] = None


class HolderOut(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class ReservationOut(BaseModel):
    id: int
    vehicle_id: int
    user: HolderOut
    start_at: datetime
    end_at: datetime
    note: Optional[str] = None

    class Config:
        from_attributes = True


def _overlaps(db: Session, vehicle_id: int, start_at: datetime, end_at: datetime, exclude_id: Optional[int] = None):
    query = db.query(Reservation).filter(
        Reservation.vehicle_id == vehicle_id,
        Reservation.start_at < end_at,
        Reservation.end_at > start_at,
    )
    if exclude_id is not None:
        query = query.filter(Reservation.id != exclude_id)
    return query.first()


@router.get("", response_model=List[ReservationOut])
def list_reservations(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_password_set),
):
    return (
        db.query(Reservation)
        .filter(
            Reservation.vehicle_id == vehicle_id,
            Reservation.household_id == current_user.household_id,
            Reservation.end_at > datetime.utcnow(),
        )
        .order_by(Reservation.start_at.asc())
        .all()
    )


@router.post("", response_model=ReservationOut)
def create_reservation(
    vehicle_id: int,
    req: ReservationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_password_set),
):
    if req.end_at <= req.start_at:
        raise HTTPException(400, "end_at must be after start_at")
    if req.end_at <= datetime.utcnow():
        raise HTTPException(400, "Reservation must end in the future")

    try:
        with vehicle_lock(vehicle_id):
            conflict = _overlaps(db, vehicle_id, req.start_at, req.end_at)
            if conflict:
                raise HTTPException(
                    409,
                    f"Conflicts with {conflict.user.name}'s reservation "
                    f"({conflict.start_at.isoformat()} - {conflict.end_at.isoformat()})",
                )

            reservation = Reservation(
                household_id=current_user.household_id,
                vehicle_id=vehicle_id,
                user_id=current_user.id,
                start_at=req.start_at,
                end_at=req.end_at,
                note=req.note,
            )
            db.add(reservation)
            db.commit()
            db.refresh(reservation)
            return reservation
    except LockNotAcquired:
        raise HTTPException(409, "Vehicle is busy -- try again")


@router.delete("/{reservation_id}", status_code=204)
def cancel_reservation(
    vehicle_id: int,
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_password_set),
):
    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.id == reservation_id,
            Reservation.vehicle_id == vehicle_id,
            Reservation.household_id == current_user.household_id,
        )
        .first()
    )
    if not reservation:
        raise HTTPException(404, "Reservation not found")
    if reservation.user_id != current_user.id and not current_user.is_household_admin:
        raise HTTPException(403, "Only the reservation owner or an admin can cancel it")

    db.delete(reservation)
    db.commit()
