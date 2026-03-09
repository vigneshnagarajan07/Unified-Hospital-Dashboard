# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# models/models.py — SQLAlchemy ORM model definitions
# Single source of truth for all database tables
# ─────────────────────────────────────────────────────────────

from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    DateTime, Date, ForeignKey, Text,
)
from sqlalchemy.orm import DeclarativeBase, relationship


# ── Base ──────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


# ── User ──────────────────────────────────────────────────────

class User(Base):
    """
    System user — covers admin/CEO, department_head, doctor, patient.
    Admin and CEO map to the same 'admin' role.
    """
    __tablename__ = "users"

    id            = Column(String(50),  primary_key=True)
    name          = Column(String(120), nullable=False)
    email         = Column(String(120), nullable=False, unique=True)
    role          = Column(String(30),  nullable=False)   # admin | department_head | doctor | patient
    department_id = Column(String(50),  ForeignKey("departments.id"), nullable=True)
    created_at    = Column(DateTime,    default=datetime.utcnow)

    # Relationships
    department    = relationship("Department", back_populates="users")
    doctor_profile= relationship("Doctor",     back_populates="user",   uselist=False)
    patient_profile=relationship("Patient",    back_populates="user",   uselist=False)

    def __repr__(self):
        return f"<User id={self.id} name={self.name} role={self.role}>"


# ── Department ────────────────────────────────────────────────

class Department(Base):
    """
    Hospital department master table.
    """
    __tablename__ = "departments"

    id   = Column(String(50),  primary_key=True)
    name = Column(String(120), nullable=False)

    # Relationships
    users       = relationship("User",        back_populates="department")
    doctors     = relationship("Doctor",      back_populates="department")
    kpi_history = relationship("KPIHistory",  back_populates="department")
    anomaly_logs= relationship("AnomalyLog",  back_populates="department")
    predictions = relationship("Prediction",  back_populates="department")
    appointments= relationship("Appointment", back_populates="department")

    def __repr__(self):
        return f"<Department id={self.id} name={self.name}>"


# ── Doctor ────────────────────────────────────────────────────

class Doctor(Base):
    """
    Doctor profile — linked to a User record.
    """
    __tablename__ = "doctors"

    id                  = Column(String(50),  primary_key=True)
    user_id             = Column(String(50),  ForeignKey("users.id"), nullable=False)
    department_id       = Column(String(50),  ForeignKey("departments.id"), nullable=False)
    availability_status = Column(String(30),  default="available")  # available | busy | on_leave

    # Relationships
    user        = relationship("User",        back_populates="doctor_profile")
    department  = relationship("Department",  back_populates="doctors")
    appointments= relationship("Appointment", back_populates="doctor")

    def __repr__(self):
        return f"<Doctor id={self.id} dept={self.department_id} status={self.availability_status}>"


# ── Patient ───────────────────────────────────────────────────

class Patient(Base):
    """
    Patient profile — linked to a User record.
    """
    __tablename__ = "patients"

    id                = Column(String(50),  primary_key=True)
    user_id           = Column(String(50),  ForeignKey("users.id"), nullable=False)
    medical_record_id = Column(String(50),  nullable=True, unique=True)

    # Relationships
    user          = relationship("User",          back_populates="patient_profile")
    appointments  = relationship("Appointment",   back_populates="patient")
    lab_reports   = relationship("LabReport",     back_populates="patient")
    billing_records = relationship("BillingRecord", back_populates="patient")
    feedbacks     = relationship("PatientFeedback", back_populates="patient")

    def __repr__(self):
        return f"<Patient id={self.id} mr={self.medical_record_id}>"


# ── Bed ───────────────────────────────────────────────────────

class Bed(Base):
    """
    Hospital bed with ward assignment and current patient link.
    """
    __tablename__ = "beds"

    id         = Column(Integer,    primary_key=True, autoincrement=True)
    ward       = Column(String(50), nullable=False)
    occupied   = Column(Boolean,    default=False)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=True)

    def __repr__(self):
        return f"<Bed id={self.id} ward={self.ward} occupied={self.occupied}>"


# ── Appointment ───────────────────────────────────────────────

class Appointment(Base):
    """
    OPD and inpatient appointments.
    """
    __tablename__ = "appointments"

    id               = Column(Integer,  primary_key=True, autoincrement=True)
    patient_id       = Column(String(50), ForeignKey("patients.id"),     nullable=False)
    doctor_id        = Column(String(50), ForeignKey("doctors.id"),      nullable=False)
    department_id    = Column(String(50), ForeignKey("departments.id"),  nullable=False)
    appointment_time = Column(DateTime,   nullable=False, default=datetime.utcnow)
    status           = Column(String(30), default="scheduled")  # scheduled | completed | cancelled

    # Relationships
    patient    = relationship("Patient",    back_populates="appointments")
    doctor     = relationship("Doctor",     back_populates="appointments")
    department = relationship("Department", back_populates="appointments")

    def __repr__(self):
        return f"<Appointment id={self.id} patient={self.patient_id} status={self.status}>"


# ── LabReport ─────────────────────────────────────────────────

class LabReport(Base):
    """
    Lab test report with result and turnaround time.
    """
    __tablename__ = "lab_reports"

    id              = Column(Integer,    primary_key=True, autoincrement=True)
    patient_id      = Column(String(50), ForeignKey("patients.id"), nullable=False)
    test_type       = Column(String(100),nullable=False)
    result          = Column(Text,       nullable=True)       # JSON string or free text
    turnaround_time = Column(Float,      nullable=True)       # hours
    created_at      = Column(DateTime,   default=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="lab_reports")

    def __repr__(self):
        return f"<LabReport id={self.id} patient={self.patient_id} test={self.test_type}>"


# ── BillingRecord ─────────────────────────────────────────────

class BillingRecord(Base):
    """
    Financial billing record per patient episode.
    """
    __tablename__ = "billing_records"

    id               = Column(Integer,    primary_key=True, autoincrement=True)
    patient_id       = Column(String(50), ForeignKey("patients.id"), nullable=False)
    billed_amount    = Column(Float,      nullable=False, default=0.0)   # in INR
    collected_amount = Column(Float,      nullable=False, default=0.0)   # in INR
    created_at       = Column(DateTime,   default=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="billing_records")

    def __repr__(self):
        return f"<BillingRecord id={self.id} patient={self.patient_id} billed={self.billed_amount}>"


# ── PatientFeedback ───────────────────────────────────────────

class PatientFeedback(Base):
    """
    Patient satisfaction rating and comment.
    """
    __tablename__ = "patient_feedbacks"

    id         = Column(Integer,    primary_key=True, autoincrement=True)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False)
    rating     = Column(Integer,    nullable=False)    # 1–5
    comment    = Column(Text,       nullable=True)
    created_at = Column(DateTime,   default=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="feedbacks")

    def __repr__(self):
        return f"<PatientFeedback id={self.id} patient={self.patient_id} rating={self.rating}>"


# ── KPIHistory ────────────────────────────────────────────────

class KPIHistory(Base):
    """
    Daily KPI snapshot per department — drives trend analysis.
    """
    __tablename__ = "kpi_history"

    id                     = Column(Integer,    primary_key=True, autoincrement=True)
    department_id          = Column(String(50), ForeignKey("departments.id"), nullable=False)
    date                   = Column(Date,       nullable=False, default=date.today)
    bed_occupancy          = Column(Float,      nullable=True)   # percentage
    opd_wait_time          = Column(Float,      nullable=True)   # minutes
    billing_collection_rate= Column(Float,      nullable=True)   # percentage
    lab_tat                = Column(Float,      nullable=True)   # hours
    nps                    = Column(Float,      nullable=True)   # 0–100

    # Relationships
    department = relationship("Department", back_populates="kpi_history")

    def __repr__(self):
        return f"<KPIHistory id={self.id} dept={self.department_id} date={self.date}>"


# ── AnomalyLog ────────────────────────────────────────────────

class AnomalyLog(Base):
    """
    Logged anomaly event with root cause insight and recommendation.
    """
    __tablename__ = "anomaly_logs"

    id             = Column(Integer,    primary_key=True, autoincrement=True)
    kpi_name       = Column(String(80), nullable=False)
    department_id  = Column(String(50), ForeignKey("departments.id"), nullable=True)
    deviation      = Column(Float,      nullable=True)     # fractional deviation, e.g. 0.38
    detected_at    = Column(DateTime,   default=datetime.utcnow)
    insight        = Column(Text,       nullable=True)
    recommendation = Column(Text,       nullable=True)

    # Relationships
    department = relationship("Department", back_populates="anomaly_logs")

    def __repr__(self):
        return f"<AnomalyLog id={self.id} kpi={self.kpi_name} dept={self.department_id}>"


# ── Prediction ────────────────────────────────────────────────

class Prediction(Base):
    """
    Proactive KPI breach prediction generated by the prediction engine.
    """
    __tablename__ = "predictions"

    id                   = Column(Integer,    primary_key=True, autoincrement=True)
    kpi_name             = Column(String(80), nullable=False)
    department_id        = Column(String(50), ForeignKey("departments.id"), nullable=True)
    predicted_value      = Column(Float,      nullable=True)
    predicted_breach_time= Column(DateTime,   nullable=True)   # when threshold will be crossed

    # Relationships
    department = relationship("Department", back_populates="predictions")

    def __repr__(self):
        return (
            f"<Prediction id={self.id} kpi={self.kpi_name} "
            f"dept={self.department_id} breach@{self.predicted_breach_time}>"
        )
