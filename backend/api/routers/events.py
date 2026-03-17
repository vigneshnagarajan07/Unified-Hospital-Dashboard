# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# api/routers/events.py — Server-Sent Events (SSE) for real-time updates
#
# GET /api/events/stream?role={role}
# Streams live updates: vitals, admissions, discharges, notifications.
# ─────────────────────────────────────────────────────────────

import asyncio
import json
from datetime import datetime
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import desc

router = APIRouter()


async def _event_generator(role: str = "admin"):
    """
    Generates SSE events by polling the DB for recent changes.
    Sends a heartbeat every 15 seconds to keep the connection alive.
    """
    from database.db import SessionLocal
    from models.workflow_models import (
        WorkflowPatient, VitalsLog, WorkflowNotification
    )

    last_check = datetime.utcnow()
    yield f"data: {json.dumps({'type': 'connected', 'role': role, 'timestamp': datetime.now().isoformat()})}\n\n"

    while True:
        try:
            db = SessionLocal()
            try:
                # Check for new vitals since last check
                new_vitals = (
                    db.query(VitalsLog)
                    .filter(VitalsLog.recorded_at > last_check)
                    .order_by(desc(VitalsLog.recorded_at))
                    .limit(5)
                    .all()
                )
                for v in new_vitals:
                    yield f"data: {json.dumps({'type': 'vitals_update', 'patient_id': v.patient_id, 'blood_pressure': v.blood_pressure, 'pulse_bpm': v.pulse_bpm, 'spo2_pct': v.spo2_pct, 'has_alert': v.has_alerts, 'timestamp': v.recorded_at.isoformat() if v.recorded_at else ''})}\n\n"

                # Check for new patients
                new_patients = (
                    db.query(WorkflowPatient)
                    .filter(WorkflowPatient.created_at > last_check, WorkflowPatient.status == "admitted")
                    .all()
                )
                for p in new_patients:
                    yield f"data: {json.dumps({'type': 'patient_admitted', 'patient_id': p.patient_id, 'name': p.name, 'department': p.department_name, 'timestamp': p.created_at.isoformat() if p.created_at else ''})}\n\n"

                # Check for new notifications for this role
                new_notifs = (
                    db.query(WorkflowNotification)
                    .filter(
                        WorkflowNotification.created_at > last_check,
                        WorkflowNotification.role == role,
                    )
                    .order_by(desc(WorkflowNotification.created_at))
                    .limit(10)
                    .all()
                )
                for n in new_notifs:
                    yield f"data: {json.dumps({'type': 'notification', 'id': n.id, 'message': n.message, 'urgency': n.urgency, 'timestamp': n.created_at.isoformat() if n.created_at else ''})}\n\n"

                # Send summary refresh signal if anything changed
                if new_vitals or new_patients or new_notifs:
                    yield f"data: {json.dumps({'type': 'refresh', 'vitals': len(new_vitals), 'patients': len(new_patients), 'notifications': len(new_notifs), 'timestamp': datetime.now().isoformat()})}\n\n"

                last_check = datetime.utcnow()

            finally:
                db.close()

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

        # Heartbeat every 10 seconds
        await asyncio.sleep(10)
        yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': datetime.now().isoformat()})}\n\n"


@router.get("/stream")
async def stream_events(role: str = Query(default="admin")):
    """
    SSE endpoint. Connect from frontend with:
      const es = new EventSource('/api/events/stream?role=admin')
      es.onmessage = (e) => { const data = JSON.parse(e.data); ... }
    """
    return StreamingResponse(
        _event_generator(role),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection":    "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
