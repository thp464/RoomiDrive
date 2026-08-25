"""
Vehicle model.

CHANGED in increment 2: `held_by` (free-text string) is now
`held_by_user_id`, a real FK to `User`. `household_id` scopes each vehicle
to exactly one household -- required for the auth/household-scoping checks
in routers/vehicles.py.
"""
import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, Float, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class VehicleStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    IN_USE = "IN_USE"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)

    household_id = Column(Integer, ForeignKey("households.id"), nullable=False)
    household = relationship("Household", back_populates="vehicles")

    name = Column(String, nullable=False, default="Household Car")
    status = Column(SAEnum(VehicleStatus), nullable=False, default=VehicleStatus.AVAILABLE)

    held_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    held_by_user = relationship("User")

    checked_out_at = Column(DateTime, nullable=True)
    estimated_return_at = Column(DateTime, nullable=True)
    destination_note = Column(String, nullable=True)

    # Filled in at check-in
    miles_left = Column(Float, nullable=True)
    last_parking_location = Column(String, nullable=True)
    last_parking_note = Column(String, nullable=True)
    last_checkin_at = Column(DateTime, nullable=True)
