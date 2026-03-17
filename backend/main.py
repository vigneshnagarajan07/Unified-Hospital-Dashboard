# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# main.py — FastAPI application entry point
# UPDATED: Phase F simulation + Phase G SSE events
# ─────────────────────────────────────────────────────────────

import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import APP_TITLE, APP_VERSION, FRONTEND_ORIGIN
from api.routers import analytics, insights, patients, staff, auth
from api.routers import dashboard
from api.routers import kpi as kpi_router
from api.routers import patients_mgmt as patients_mgmt_router
from api.routers import workflow as workflow_router
from api.routers import events as events_router        # ← Phase G

# ── App instance ──────────────────────────────────────────────
app = FastAPI(
    title   = APP_TITLE,
    version = APP_VERSION,
    docs_url= "/docs",
)

@app.on_event("startup")
async def on_startup():
    from database.db import init_db
    init_db()
    print("[Startup] PrimeCare running — DB initialized.")

    # Phase F: Start live simulation
    from services.simulation_service import run_simulation
    asyncio.create_task(run_simulation())
    print("[Startup] Live simulation task started.")


# ── CORS — allow Vite frontend ────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = [
        FRONTEND_ORIGIN,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "https://unified-hospital-dashboard.vercel.app",
        "https://unified-hospital-dashboard-git-main-vigneshnagarajan07.vercel.app",
    ],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Mount routers ─────────────────────────────────────────────
app.include_router(auth.router,              prefix="/api/auth",          tags=["Authentication"])
app.include_router(analytics.router,         prefix="/api/analytics",     tags=["Analytics"])
app.include_router(insights.router,          prefix="/api/insights",      tags=["Insights"])
app.include_router(patients.router,          prefix="/api/patients",      tags=["Patients"])
app.include_router(staff.router,             prefix="/api/staff",         tags=["Staff"])
app.include_router(dashboard.router,         prefix="/api/dashboard",     tags=["Dashboard"])
app.include_router(kpi_router.router,        prefix="/api/kpi",           tags=["KPI"])
app.include_router(patients_mgmt_router.router, prefix="/api/patients-mgmt", tags=["PatientsMgmt"])
app.include_router(workflow_router.router,   prefix="/api/workflow",      tags=["Workflow"])
app.include_router(events_router.router,     prefix="/api/events",        tags=["Events"])   # ← Phase G

# ── Health check ──────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status"    : "PrimeCare Hospital GKM_8 API running",
        "version"   : APP_VERSION,
        "docs"      : "/docs",
        "workflow"  : "/api/workflow — End-to-end clinical pipeline active",
        "simulation": "Live simulation active (45s cycles)",
        "events"    : "/api/events/stream — SSE real-time updates",
    }
