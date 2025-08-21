# 🧩 backend/models.py

from sqlalchemy import Column, Integer, String, Float, Boolean
from .database import Base

class Panel(Base):
    __tablename__ = "panels"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    rated_watts = Column(Float, default=400.0)
    active = Column(Boolean, default=True)

class Inverter(Base):
    __tablename__ = "inverters"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    rated_watts = Column(Float, default=5000.0)
    active = Column(Boolean, default=True)
