# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# config.py — App configuration and environment variables
# ─────────────────────────────────────────────────────────────

import os
from dotenv import load_dotenv

load_dotenv()

# ── App settings ──────────────────────────────────────────────
APP_TITLE       = "PrimeCare Hospital — GKM_8 Intelligence Platform"
APP_VERSION     = "2.0.0"
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

# ── Groq AI settings ─────────────────────────────────────────
GROQ_API_KEY    = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL      = "llama3-70b-8192"
GROQ_MAX_TOKENS = 512

# ── JWT settings (simulated) ──────────────────────────────────
JWT_SECRET      = os.getenv("JWT_SECRET", "apollo-gkm8-secret-key")
JWT_ALGORITHM   = "HS256"
JWT_EXPIRE_MINS = 480  # 8 hours

# ── Anomaly thresholds ────────────────────────────────────────
THRESHOLD_BED_OCCUPANCY_WARNING  = 80
THRESHOLD_BED_OCCUPANCY_CRITICAL = 90
THRESHOLD_OPD_WAIT_WARNING       = 25
THRESHOLD_OPD_WAIT_CRITICAL      = 35
THRESHOLD_SATISFACTION_WARNING   = 4.0
THRESHOLD_SATISFACTION_CRITICAL  = 3.5