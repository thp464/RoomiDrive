"""
GasExpense: a log entry for "who paid for gas and how much" -- one row per
fill-up, independent of checkout/checkin. No locking needed here (unlike
vehicle/reservation state) since each entry is an independent insert with
no shared invariant to protect.
"""
from datetime import datetime

from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class GasExpense(Base):
    __tablename__ = "gas_expenses"

    id = Column(Integer, primary_key=True, index=True)

    household_id = Column(Integer, ForeignKey("households.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User")

    amount = Column(Float, nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
