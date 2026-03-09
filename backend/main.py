# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# main.py — FastAPI application entry point
# ─────────────────────────────────────────────────────────────

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import APP_TITLE, APP_VERSION, FRONTEND_ORIGIN
from api.routers import analytics, insights, patients, staff

# ── App instance ──────────────────────────────────────────────
app = FastAPI(
    title   = APP_TITLE,
    version = APP_VERSION,
    docs_url= "/docs",
)

# ── CORS — allow Vite frontend ────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = [FRONTEND_ORIGIN, "http://127.0.0.1:5173"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Mount routers ─────────────────────────────────────────────
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(insights.router,  prefix="/api/insights",  tags=["Insights"])
app.include_router(patients.router,  prefix="/api/patients",  tags=["Patients"])
app.include_router(staff.router,     prefix="/api/staff",     tags=["Staff"])

# ── Health check ──────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status"  : "PrimeCare Hospital GKM_8 API running",
        "version" : APP_VERSION,
        "docs"    : "/docs",
    }