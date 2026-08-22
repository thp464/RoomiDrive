"""
FleetSync POC - proves out the atomic checkout/checkin flow.

Run with: uvicorn main:app --reload
Docs at:  http://localhost:8000/docs

POC NOTE: no auth yet -- `held_by` is just a name string passed in the
request body. Swap this for `current_user.id` once auth lands.
"""
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Vehicle, VehicleStatus
from locking import vehicle_lock, LockNotAcquired

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FleetSync POC")


@app.on_event("startup")
def seed_vehicle():
    """Make sure vehicle #1 exists so the POC works out of the box."""
    db = next(get_db())
    if not db.query(Vehicle).filter(Vehicle.id == 1).first():
        db.add(Vehicle(id=1, name="Household Car", status=VehicleStatus.AVAILABLE))
        db.commit()
    db.close()


# ---------- Request/response schemas ----------

class CheckoutRequest(BaseModel):
    held_by: str
    estimated_return_at: Optional[datetime] = None
    destination_note: Optional[str] = None


class CheckinRequest(BaseModel):
    parking_note: str
    mileage: float
    fuel_pct: float
    lat: Optional[float] = None
    lng: Optional[float] = None


class VehicleOut(BaseModel):
    id: int
    name: str
    status: VehicleStatus
    held_by: Optional[str] = None
    checked_out_at: Optional[datetime] = None
    estimated_return_at: Optional[datetime] = None
    destination_note: Optional[str] = None
    current_mileage: Optional[float] = None
    fuel_pct: Optional[float] = None
    last_parking_note: Optional[str] = None
    last_checkin_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---------- Endpoints ----------

@app.get("/api/vehicles/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(404, "Vehicle not found")
    return vehicle


@app.post("/api/vehicles/{vehicle_id}/checkout", response_model=VehicleOut)
def checkout_vehicle(vehicle_id: int, req: CheckoutRequest, db: Session = Depends(get_db)):
    # --- Layer 1: Redis lock -- fast, cheap rejection of the losing request ---
    try:
        with vehicle_lock(vehicle_id):
            # --- Layer 2: DB transaction -- the actual source of truth ---
            # `with_for_update()` issues SELECT ... FOR UPDATE on Postgres,
            # which row-locks this record until commit/rollback. SQLite
            # (used here in the POC) doesn't support real row locking, so
            # this line is a no-op on SQLite -- the Redis lock is doing all
            # the work in this POC. Both layers become fully active once
            # we switch to Postgres.
            vehicle = (
                db.query(Vehicle)
                .filter(Vehicle.id == vehicle_id)
                .with_for_update()
                .first()
            )
            if not vehicle:
                raise HTTPException(404, "Vehicle not found")

            if vehicle.status != VehicleStatus.AVAILABLE:
                # Re-checked *inside* the lock -- this is what actually
                # prevents the double-checkout, not just the lock existing.
                raise HTTPException(409, f"Vehicle is not available (status={vehicle.status})")

            vehicle.status = VehicleStatus.IN_USE
            vehicle.held_by = req.held_by
            vehicle.checked_out_at = datetime.utcnow()
            vehicle.estimated_return_at = req.estimated_return_at
            vehicle.destination_note = req.destination_note

            db.commit()
            db.refresh(vehicle)
            return vehicle

    except LockNotAcquired:
        # Someone else's checkout request is in-flight right now.
        raise HTTPException(409, "Vehicle is currently being checked out by someone else -- try again")


@app.post("/api/vehicles/{vehicle_id}/checkin", response_model=VehicleOut)
def checkin_vehicle(vehicle_id: int, req: CheckinRequest, db: Session = Depends(get_db)):
    try:
        with vehicle_lock(vehicle_id):
            vehicle = (
                db.query(Vehicle)
                .filter(Vehicle.id == vehicle_id)
                .with_for_update()
                .first()
            )
            if not vehicle:
                raise HTTPException(404, "Vehicle not found")

            if vehicle.status != VehicleStatus.IN_USE:
                raise HTTPException(409, f"Vehicle is not currently checked out (status={vehicle.status})")

            vehicle.status = VehicleStatus.AVAILABLE
            vehicle.current_mileage = req.mileage
            vehicle.fuel_pct = req.fuel_pct
            vehicle.last_parking_note = req.parking_note
            vehicle.last_checkin_at = datetime.utcnow()
            vehicle.held_by = None
            vehicle.checked_out_at = None
            vehicle.estimated_return_at = None
            vehicle.destination_note = None

            db.commit()
            db.refresh(vehicle)
            return vehicle

    except LockNotAcquired:
        raise HTTPException(409, "Vehicle is currently being updated by someone else -- try again")
