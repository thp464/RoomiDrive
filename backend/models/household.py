from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class Household(Base):
    __tablename__ = "households"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    members = relationship("User", back_populates="household")
    vehicles = relationship("Vehicle", back_populates="household")
