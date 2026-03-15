# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# database/models.py — New plugin models (DB extension layer)
# Tables: users_auth, patients_mgmt, patient_vitals, kpi_metrics
# ─────────────────────────────────────────────────────────────

from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class UserAuth(Base):
    """Simple auth table — separate from existing User ORM."""
    __tablename__ = "users_auth"

    id         = Column(Integer, primary_key=True, index=True)
    username   = Column(String(64), unique=True, nullable=False, index=True)
    password   = Column(String(128), nullable=False)          # plain-text for demo
    role       = Column(String(32), default="viewer")
    created_at = Column(DateTime, default=datetime.utcnow)


class PatientMgmt(Base):
    """Admin-managed patient records."""
    __tablename__ = "patients_mgmt"

    id               = Column(Integer, primary_key=True, index=True)
    name             = Column(String(128), nullable=False)
    age              = Column(Integer)
    gender           = Column(String(16))
    department       = Column(String(64))
    assigned_doctor  = Column(String(128))
    diagnosis        = Column(String(256))
    contact          = Column(String(20))
    admission_status = Column(String(32), default="admitted")  # admitted | discharged | icu
    created_at       = Column(DateTime, default=datetime.utcnow)

    vitals = relationship("PatientVitals", back_populates="patient", cascade="all, delete-orphan")


class PatientVitals(Base):
    """Latest vitals per patient."""
    __tablename__ = "patient_vitals"

    id               = Column(Integer, primary_key=True, index=True)
    patient_id       = Column(Integer, ForeignKey("patients_mgmt.id"), nullable=False)
    heart_rate       = Column(Integer)
    blood_pressure   = Column(String(16))    # e.g. "120/80"
    temperature      = Column(Float)
    oxygen_saturation= Column(Integer)
    respiration_rate = Column(Integer)
    notes            = Column(Text)
    updated_at       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("PatientMgmt", back_populates="vitals")


class KpiMetric(Base):
    """7-day KPI history per department — powers anomaly detection."""
    __tablename__ = "kpi_metrics"

    id                     = Column(Integer, primary_key=True, index=True)
    department             = Column(String(64), nullable=False, index=True)
    date                   = Column(Date, nullable=False)
    bed_occupancy          = Column(Float)    # %
    opd_wait_time          = Column(Float)    # minutes
    billing_collection_rate= Column(Float)    # %
    lab_tat                = Column(Float)    # minutes
    readmission_rate       = Column(Float)    # %
    nps_score              = Column(Float)    # 0–100
