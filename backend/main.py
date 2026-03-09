# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# main.py — FastAPI application entry point
# ─────────────────────────────────────────────────────────────

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import APP_TITLE, APP_VERSION, FRONTEND_ORIGIN
from api.routers import analytics, insights, patients, staff
from api.routers import dashboard

# ── App instance ──────────────────────────────────────────────
app = FastAPI(
    title   = APP_TITLE,
    version = APP_VERSION,
    docs_url= "/docs",
)

@app.on_event("startup")
def on_startup():
    """
    Optional: initialise SQLite DB and seed mock data.
    Failure is non-fatal — all role endpoints work from in-memory data.
    """
    try:
        from database.db import init_db
        init_db()
        print("[Startup] Database initialised successfully.")
    except Exception as e:
        print(f"[Startup] DB skipped (running in memory-only mode): {e}")

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
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])

# ── Health check ──────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status"  : "PrimeCare Hospital GKM_8 API running",
        "version" : APP_VERSION,
        "docs"    : "/docs",
    }