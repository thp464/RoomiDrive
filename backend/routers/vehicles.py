"""
Vehicle endpoints.

CHANGED in increment 2: every endpoint now requires a valid JWT
(`current_user`). The checked-out-by field is the real authenticated
user (`held_by_user_id`), not a free-text name. Every vehicle lookup is
filtered by `household_id == current_user.household_id`, so a user from
Household A gets a clean 404 (not a 403 -- we don't want to even confirm
the vehicle exists) if they try to touch Household B's car.
"""
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Vehicle, VehicleStatus, User
from core.deps import get_current_user
from locking import vehicle_lock, LockNotAcquired

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


class CheckoutRequest(BaseModel):
    estimated_return_at: Optional[datetime] = None
    destination_note: Optional[str] = None


class CheckinRequest(BaseModel):
    parking_note: str
    mileage: float
    fuel_pct: float
    lat: Optional[float] = None
    lng: Optional[float] = None


class HolderOut(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class VehicleOut(BaseModel):
    id: int
    name: str
    status: VehicleStatus
    held_by: Optional[HolderOut] = None
    checked_out_at: Optional[datetime] = None
    estimated_return_at: Optional[datetime] = None
    destination_note: Optional[str] = None
    current_mileage: Optional[float] = None
    fuel_pct: Optional[float] = None
    last_parking_note: Optional[str] = None
    last_checkin_at: Optional[datetime] = None

    class Config:
        from_attributes = True


def _to_out(vehicle: Vehicle) -> VehicleOut:
    return VehicleOut(
        id=vehicle.id,
        name=vehicle.name,
        status=vehicle.status,
        held_by=HolderOut.model_validate(vehicle.held_by_user) if vehicle.held_by_user else None,
        checked_out_at=vehicle.checked_out_at,
        estimated_return_at=vehicle.estimated_return_at,
        destination_note=vehicle.destination_note,
        current_mileage=vehicle.current_mileage,
        fuel_pct=vehicle.fuel_pct,
        last_parking_note=vehicle.last_parking_note,
        last_checkin_at=vehicle.last_checkin_at,
    )


def _get_household_vehicle(db: Session, vehicle_id: int, household_id: int) -> Vehicle:
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id, Vehicle.household_id == household_id)
        .first()
    )
    if not vehicle:
        raise HTTPException(404, "Vehicle not found in your household")
    return vehicle


@router.get("", response_model=List[VehicleOut])
def list_vehicles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vehicles = db.query(Vehicle).filter(Vehicle.household_id == current_user.household_id).all()
    return [_to_out(v) for v in vehicles]


@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vehicle = _get_household_vehicle(db, vehicle_id, current_user.household_id)
    return _to_out(vehicle)


@router.post("/{vehicle_id}/checkout", response_model=VehicleOut)
def checkout_vehicle(
    vehicle_id: int,
    req: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        with vehicle_lock(vehicle_id):
            vehicle = (
                db.query(Vehicle)
                .filter(Vehicle.id == vehicle_id, Vehicle.household_id == current_user.household_id)
                .with_for_update()
                .first()
            )
            if not vehicle:
                raise HTTPException(404, "Vehicle not found in your household")

            if vehicle.status != VehicleStatus.AVAILABLE:
                raise HTTPException(409, f"Vehicle is not available (status={vehicle.status})")

            vehicle.status = VehicleStatus.IN_USE
            vehicle.held_by_user_id = current_user.id
            vehicle.checked_out_at = datetime.utcnow()
            vehicle.estimated_return_at = req.estimated_return_at
            vehicle.destination_note = req.destination_note

            db.commit()
            db.refresh(vehicle)
            return _to_out(vehicle)

    except LockNotAcquired:
        raise HTTPException(409, "Vehicle is currently being checked out by someone else -- try again")


@router.post("/{vehicle_id}/checkin", response_model=VehicleOut)
def checkin_vehicle(
    vehicle_id: int,
    req: CheckinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        with vehicle_lock(vehicle_id):
            vehicle = (
                db.query(Vehicle)
                .filter(Vehicle.id == vehicle_id, Vehicle.household_id == current_user.household_id)
                .with_for_update()
                .first()
            )
            if not vehicle:
                raise HTTPException(404, "Vehicle not found in your household")

            if vehicle.status != VehicleStatus.IN_USE:
                raise HTTPException(409, f"Vehicle is not currently checked out (status={vehicle.status})")

            vehicle.status = VehicleStatus.AVAILABLE
            vehicle.current_mileage = req.mileage
            vehicle.fuel_pct = req.fuel_pct
            vehicle.last_parking_note = req.parking_note
            vehicle.last_checkin_at = datetime.utcnow()
            vehicle.held_by_user_id = None
            vehicle.checked_out_at = None
            vehicle.estimated_return_at = None
            vehicle.destination_note = None

            db.commit()
            db.refresh(vehicle)
            return _to_out(vehicle)

    except LockNotAcquired:
        raise HTTPException(409, "Vehicle is currently being updated by someone else -- try again")
