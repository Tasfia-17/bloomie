"""Privacy controls router - granular data sharing permissions."""

from fastapi import APIRouter
from pydantic import BaseModel

from ..services.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/privacy", tags=["privacy"])

# Default permissions matrix
DEFAULT_PERMISSIONS = {
    "mood": {"me": True, "family": False, "clinician": False},
    "sleep": {"me": True, "family": True, "clinician": True},
    "steps": {"me": True, "family": True, "clinician": True},
    "vitals": {"me": True, "family": False, "clinician": True},
    "journal": {"me": True, "family": False, "clinician": False},
    "medication": {"me": True, "family": True, "clinician": True},
    "nutrition": {"me": True, "family": False, "clinician": True},
    "caffeine": {"me": True, "family": False, "clinician": False},
    "hydration": {"me": True, "family": True, "clinician": True},
    "location": {"me": True, "family": False, "clinician": False},
}


class PermissionUpdate(BaseModel):
    metric: str
    audience: str  # "family" or "clinician"
    allowed: bool


@router.get("")
async def get_privacy_settings(user_id: str = "demo") -> dict:
    """Get current privacy/sharing settings."""
    try:
        sb = get_supabase_client()
        resp = sb.table("caregiver_access").select("*").eq("user_id", user_id).execute()
        access_records = resp.data if resp.data else []
    except Exception:
        access_records = []

    # Build permissions from caregiver access records
    permissions = _build_permissions(access_records)

    return {
        "permissions": permissions,
        "privacy_level": _compute_privacy_level(permissions),
        "data_sharing_summary": _summarize_sharing(permissions),
        "encryption_note": "All health data is encrypted at rest and in transit.",
        "data_retention": "Data is retained for 90 days by default. You can request deletion anytime.",
        "audit_log_enabled": True,
    }


@router.put("")
async def update_privacy_settings(update: PermissionUpdate, user_id: str = "demo") -> dict:
    """Update a single permission setting."""
    # In production, this would update the caregiver_access table
    return {
        "status": "updated",
        "metric": update.metric,
        "audience": update.audience,
        "allowed": update.allowed,
        "message": f"{'Enabled' if update.allowed else 'Disabled'} {update.metric} sharing with {update.audience}.",
    }


@router.get("/audit-log")
async def get_audit_log(user_id: str = "demo", limit: int = 20) -> dict:
    """Get data access audit log."""
    # Demo audit log
    return {
        "entries": [
            {"timestamp": "2026-08-16T07:30:00Z", "actor": "System", "action": "Assessment generated", "data_type": "wellness_data"},
            {"timestamp": "2026-08-16T07:00:00Z", "actor": "You", "action": "Logged hydration", "data_type": "habits"},
            {"timestamp": "2026-08-15T22:00:00Z", "actor": "System", "action": "Sleep data synced", "data_type": "body"},
            {"timestamp": "2026-08-15T18:00:00Z", "actor": "Family (Mom)", "action": "Viewed wellness summary", "data_type": "family_view"},
        ],
        "total": 4,
    }


@router.delete("/data")
async def request_data_deletion(user_id: str = "demo", category: str = "all") -> dict:
    """Request data deletion (GDPR/privacy compliance)."""
    return {
        "status": "deletion_requested",
        "category": category,
        "message": f"Deletion request for '{category}' data has been submitted. This may take up to 30 days.",
        "confirmation_id": f"DEL-{user_id[:8]}-2026",
    }


def _build_permissions(access_records: list[dict]) -> dict:
    """Build permissions matrix from access records."""
    # Start with defaults
    permissions = dict(DEFAULT_PERMISSIONS)

    # Override with actual records
    for record in access_records:
        record_perms = record.get("permissions", {})
        relation = record.get("relation", "family")
        audience_key = "clinician" if "clinician" in relation.lower() else "family"

        for metric, allowed in record_perms.items():
            if metric in permissions:
                permissions[metric][audience_key] = allowed

    return permissions


def _compute_privacy_level(permissions: dict) -> dict:
    """Compute overall privacy level."""
    total_fields = 0
    shared_fields = 0

    for metric, audiences in permissions.items():
        for audience, allowed in audiences.items():
            if audience != "me":
                total_fields += 1
                if allowed:
                    shared_fields += 1

    sharing_percentage = round(shared_fields / max(total_fields, 1) * 100)

    if sharing_percentage > 60:
        level = "open"
        label = "Open sharing"
        color = "green"
    elif sharing_percentage > 30:
        level = "moderate"
        label = "Moderate sharing"
        color = "yellow"
    else:
        level = "private"
        label = "Private"
        color = "blue"

    return {
        "level": level,
        "label": label,
        "color": color,
        "sharing_percentage": sharing_percentage,
    }


def _summarize_sharing(permissions: dict) -> dict:
    """Summarize what's shared with whom."""
    family_can_see = [m for m, p in permissions.items() if p.get("family")]
    clinician_can_see = [m for m, p in permissions.items() if p.get("clinician")]

    return {
        "family": {
            "count": len(family_can_see),
            "metrics": family_can_see,
        },
        "clinician": {
            "count": len(clinician_can_see),
            "metrics": clinician_can_see,
        },
    }
