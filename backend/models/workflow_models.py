# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# models/workflow_models.py — Workflow DB Tables
# Tables: workflow_patients, vitals_log, diagnoses,
#         pharmacy_orders, billing_transactions,
#         nurse_assignments, workflow_notifications, nurses
# ─────────────────────────────────────────────────────────────

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class WorkflowPatient(Base):
    """Patient admitted through the workflow system."""
    __tablename__ = "workflow_patients"

    id                 = Column(Integer, primary_key=True, autoincrement=True)
    patient_id         = Column(String(50), unique=True, nullable=False, index=True)
    name               = Column(String(120), nullable=False)
    age                = Column(Integer)
    gender             = Column(String(16))
    blood_group        = Column(String(10))
    phone              = Column(String(20))
    address            = Column(Text)
    department_id      = Column(String(50))
    department_name    = Column(String(100))
    assigned_doctor    = Column(String(120))
    assigned_doctor_id = Column(String(50))
    assigned_nurse_id  = Column(Integer, ForeignKey("nurses.id"), nullable=True)
    ward               = Column(String(50))
    chief_complaint    = Column(Text)
    insurance_provider = Column(String(100))
    diagnosis          = Column(Text, nullable=True)
    is_critical        = Column(Boolean, default=False)
    status             = Column(String(30), default="admitted")  # admitted|discharged
    admission_date     = Column(String(20))
    expected_discharge = Column(String(20))
    discharge_date     = Column(String(20), nullable=True)
    created_at         = Column(DateTime, default=datetime.utcnow)

    # Relationships
    vitals        = relationship("VitalsLog",           back_populates="patient", cascade="all, delete-orphan")
    diagnoses     = relationship("DiagnosisRecord",     back_populates="patient", cascade="all, delete-orphan")
    pharmacy_orders = relationship("PharmacyOrder",     back_populates="patient", cascade="all, delete-orphan")
    billing       = relationship("BillingTransaction",  back_populates="patient", cascade="all, delete-orphan")
    assigned_nurse = relationship("Nurse",              back_populates="patients", foreign_keys=[assigned_nurse_id])


class Nurse(Base):
    """Nurse profile — managed by floor supervisor."""
    __tablename__ = "nurses"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    name            = Column(String(120), nullable=False)
    employee_id     = Column(String(50), unique=True, nullable=False)
    department_id   = Column(String(50))
    department_name = Column(String(100))
    shift           = Column(String(20), default="Morning")   # Morning|Evening|Night
    shift_time      = Column(String(30), default="07:00 - 15:00")
    on_duty         = Column(Boolean, default=True)
    specialization  = Column(String(100))
    contact         = Column(String(20))
    username        = Column(String(64), unique=True)
    password_hash   = Column(String(200))
    created_at      = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patients       = relationship("WorkflowPatient", back_populates="assigned_nurse", foreign_keys="WorkflowPatient.assigned_nurse_id")
    vitals_recorded = relationship("VitalsLog", back_populates="nurse")
    assignments    = relationship("NurseAssignment", back_populates="nurse")


class NurseAssignment(Base):
    """Floor supervisor assigns nurse to patient."""
    __tablename__ = "nurse_assignments"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    nurse_id   = Column(Integer, ForeignKey("nurses.id"), nullable=False)
    patient_id = Column(String(50), nullable=False)
    assigned_by= Column(String(100), default="Floor Supervisor")
    notes      = Column(Text, nullable=True)
    active     = Column(Boolean, default=True)
    assigned_at= Column(DateTime, default=datetime.utcnow)

    # Relationships
    nurse = relationship("Nurse", back_populates="assignments")


class VitalsLog(Base):
    """Vitals recorded by nurse for a patient."""
    __tablename__ = "vitals_log"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    patient_id       = Column(String(50), ForeignKey("workflow_patients.patient_id"), nullable=False)
    nurse_id         = Column(Integer, ForeignKey("nurses.id"), nullable=True)
    blood_pressure   = Column(String(20))
    pulse_bpm        = Column(Integer)
    temperature_f    = Column(Float)
    spo2_pct         = Column(Integer)
    weight_kg        = Column(Float, nullable=True)
    respiration_rate = Column(Integer, nullable=True)
    notes            = Column(Text, nullable=True)
    has_alerts       = Column(Boolean, default=False)
    alert_details    = Column(Text, nullable=True)   # JSON string
    recorded_by      = Column(String(100))
    recorded_at      = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("WorkflowPatient", back_populates="vitals")
    nurse   = relationship("Nurse", back_populates="vitals_recorded")


class DiagnosisRecord(Base):
    """Doctor diagnosis and prescription record."""
    __tablename__ = "diagnoses"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    patient_id   = Column(String(50), ForeignKey("workflow_patients.patient_id"), nullable=False)
    diagnosis    = Column(Text, nullable=False)
    severity     = Column(String(20), default="moderate")
    notes        = Column(Text, nullable=True)
    medications  = Column(Text, nullable=True)   # JSON string
    lab_tests    = Column(Text, nullable=True)   # JSON string
    diagnosed_by = Column(String(120))
    diagnosed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("WorkflowPatient", back_populates="diagnoses")


class PharmacyOrder(Base):
    """Pharmacy prescription order."""
    __tablename__ = "pharmacy_orders"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    order_id       = Column(String(50), unique=True, nullable=False, index=True)
    patient_id     = Column(String(50), ForeignKey("workflow_patients.patient_id"), nullable=False)
    patient_name   = Column(String(120))
    department     = Column(String(100))
    medication     = Column(String(200), nullable=False)
    dose           = Column(String(50))
    frequency      = Column(String(100))
    duration       = Column(String(50))
    instructions   = Column(Text)
    ordered_by     = Column(String(120))
    status         = Column(String(20), default="pending")  # pending|dispensed|cancelled
    amount         = Column(Float, default=450.0)
    dispensed_by   = Column(String(120), nullable=True)
    dispensed_at   = Column(DateTime, nullable=True)
    notes          = Column(Text, nullable=True)
    ordered_at     = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("WorkflowPatient", back_populates="pharmacy_orders")


class BillingTransaction(Base):
    """Individual billing line item per patient."""
    __tablename__ = "billing_transactions"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    patient_id   = Column(String(50), ForeignKey("workflow_patients.patient_id"), nullable=False)
    patient_name = Column(String(120))
    description  = Column(String(200), nullable=False)
    amount       = Column(Float, nullable=False)
    category     = Column(String(50))   # room|doctor|pharmacy|lab|procedure
    recorded_at  = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("WorkflowPatient", back_populates="billing")


class WorkflowNotification(Base):
    """Cross-role workflow notifications."""
    __tablename__ = "workflow_notifications"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    role       = Column(String(50), nullable=False, index=True)
    message    = Column(Text, nullable=False)
    urgency    = Column(String(20), default="info")   # info|warning|critical
    read       = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
