"""
Data models for the FleetSync POC.

POC NOTE: this is deliberately just ONE vehicle, no User/Household tables yet.
The `held_by` field is a free-text name instead of a foreign key to a User
row, purely so we can prove the locking mechanism without building auth
first. Full version replaces `held_by` with `current_holder_id -> User.id`
and adds a TripHistory audit table.
"""
import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, Float
from database import Base


class VehicleStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    IN_USE = "IN_USE"
    MAINTENANCE = "MAINTENANCE"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, default="Household Car")

    status = Column(SAEnum(VehicleStatus), nullable=False, default=VehicleStatus.AVAILABLE)

    # Who currently has it (free text for POC; becomes a User FK later)
    held_by = Column(String, nullable=True)
    checked_out_at = Column(DateTime, nullable=True)
    estimated_return_at = Column(DateTime, nullable=True)
    destination_note = Column(String, nullable=True)

    # Filled in at check-in
    current_mileage = Column(Float, nullable=True)
    fuel_pct = Column(Float, nullable=True)
    last_parking_note = Column(String, nullable=True)
    last_checkin_at = Column(DateTime, nullable=True)
