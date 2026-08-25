"""
Reservation: a future time window during which a vehicle is reserved for
one user. Hard block -- while a reservation is active (start_at <= now <
end_at), only its owner can check the vehicle out, even if it's sitting
AVAILABLE. Enforced in routers/reservations.py and checked again at
checkout time in routers/vehicles.py.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)

    household_id = Column(Integer, ForeignKey("households.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User")

    start_at = Column(DateTime, nullable=False)
    end_at = Column(DateTime, nullable=False)
    note = Column(String, nullable=True)
