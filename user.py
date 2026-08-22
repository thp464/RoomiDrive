from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    is_household_admin = Column(Boolean, default=False, nullable=False)

    household_id = Column(Integer, ForeignKey("households.id"), nullable=False)
    household = relationship("Household", back_populates="members")
