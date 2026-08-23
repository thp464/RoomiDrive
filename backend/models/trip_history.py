"""
TripHistory: one row per checkout->checkin cycle, so the dashboard can show
an activity feed instead of only the vehicle's current/last state.

Created at checkout (checked_in_at is null while the trip is open), filled
in at checkin.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class TripHistory(Base):
    __tablename__ = "trip_history"

    id = Column(Integer, primary_key=True, index=True)

    household_id = Column(Integer, ForeignKey("households.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User")

    checked_out_at = Column(DateTime, nullable=False)
    estimated_return_at = Column(DateTime, nullable=True)
    destination_note = Column(String, nullable=True)

    checked_in_at = Column(DateTime, nullable=True)
    parking_location = Column(String, nullable=True)
    parking_note = Column(String, nullable=True)
    miles_left = Column(Float, nullable=True)
