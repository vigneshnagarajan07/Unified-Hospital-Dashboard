# ─────────────────────────────────────────────────────────────
# PrimeCare Hospital | GKM_8 Intelligence Platform
# security.py — Simulated JWT auth and role verification
# No real passwords — role picker on frontend sets the role
# ─────────────────────────────────────────────────────────────

from fastapi import Header, HTTPException
from core.config import JWT_SECRET, JWT_ALGORITHM
from jose import jwt

# ── Valid roles ───────────────────────────────────────────────
# "admin" is accepted for backward-compat but normalised → "receptionist"
VALID_ROLES = [
    "doctor", "department_head", "admin", "receptionist",
    "floor_supervisor", "nurse", "pharmacy", "patient",
]

# ── Demo user tokens (pre-generated for each role) ───────────
DEMO_TOKENS = {
    "doctor"           : "demo-token-doctor",
    "department_head"  : "demo-token-dept-head",
    "admin"            : "demo-token-admin",
    "receptionist"     : "demo-token-admin",
    "floor_supervisor" : "demo-token-floor-supervisor",
    "nurse"            : "demo-token-nurse",
    "pharmacy"         : "demo-token-pharmacy",
    "patient"          : "demo-token-patient",
}

# ── Demo user info per role ───────────────────────────────────
DEMO_USERS = {
    "doctor"           : { "staff_id": "DOC001", "name": "Dr. Ramesh Iyer",       "department_id": "cardiology"    },
    "department_head"  : { "staff_id": "DOC002", "name": "Dr. Priya Subramaniam", "department_id": "general_medicine" },
    "admin"            : { "staff_id": "ADM001", "name": "Mr. Arvind Kumar",       "department_id": "administration" },
    "receptionist"     : { "staff_id": "ADM001", "name": "Mr. Arvind Kumar",       "department_id": "administration" },
    "floor_supervisor" : { "staff_id": "SUP001", "name": "Ms. Kavitha Rajan",      "department_id": "administration" },
    "nurse"            : { "staff_id": "NUR001", "name": "Ms. Geetha Lakshmi",     "department_id": "cardiology"    },
    "pharmacy"         : { "staff_id": "PHR001", "name": "PrimeCare Pharmacy",     "department_id": "administration" },
    "patient"          : { "patient_id": "APL-2024-0847", "name": "Senthil Kumar" },
}


def _normalise_role(role: str) -> str:
    """Normalise admin → receptionist for backward compatibility."""
    return "receptionist" if role == "admin" else role


def get_current_role(x_role: str = Header(default="receptionist")) -> str:
    """
    Read role from X-Role request header.
    Frontend sends this header after role selection on login page.
    """
    if x_role not in VALID_ROLES:
        raise HTTPException(status_code=403, detail=f"Invalid role: {x_role}")
    return _normalise_role(x_role)


def get_current_user(x_role: str = Header(default="receptionist")) -> dict:
    """
    Return demo user info based on role header.
    """
    role = get_current_role(x_role)
    return { "role": role, **DEMO_USERS.get(role, {}) }


def require_role(allowed_roles: list):
    """
    Dependency factory — restrict endpoint to specific roles.
    Usage: Depends(require_role(["admin", "department_head"]))
    """
    def role_checker(x_role: str = Header(default="receptionist")):
        normalised = _normalise_role(x_role)
        # Also accept "admin" when "receptionist" is in allowed list, and vice versa
        expanded = set(allowed_roles)
        if "receptionist" in expanded:
            expanded.add("admin")
        if "admin" in expanded:
            expanded.add("receptionist")
        if normalised not in expanded and x_role not in expanded:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{x_role}' is not authorised for this endpoint"
            )
        return normalised
    return role_checker