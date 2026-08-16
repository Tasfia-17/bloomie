"""Nest router - social wellness and family dashboard."""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ..models.schemas import NestContact, NestContactCreate
from ..services.supabase_client import (
    get_nest_contacts,
    create_nest_contact,
    update_nest_contact,
    delete_nest_contact,
    get_latest_assessment,
    get_wellness_data,
)

router = APIRouter(prefix="/api/nest", tags=["nest"])


@router.get("/contacts", response_model=list[NestContact])
async def list_contacts(user_id: str = "demo") -> list[NestContact]:
    """Get all nest contacts for a user."""
    contacts = get_nest_contacts(user_id)
    return [NestContact(**c) for c in contacts]


@router.post("/contacts", response_model=NestContact)
async def add_contact(data: NestContactCreate, user_id: str = "demo") -> NestContact:
    """Add a new person to the nest."""
    contact_data = {
        "user_id": user_id,
        "name": data.name,
        "relation": data.relation,
        "emoji": data.emoji,
        "phone": data.phone,
        "email": data.email,
        "contact_frequency_days": data.contact_frequency_days,
    }
    result = create_nest_contact(contact_data)
    return NestContact(**result)


@router.put("/contacts/{contact_id}/checkin")
async def check_in(contact_id: str) -> dict:
    """Record a check-in with a contact."""
    result = update_nest_contact(contact_id, {
        "last_contact_at": datetime.now(timezone.utc).isoformat()
    })
    return {"status": "checked_in", "contact": result}


@router.delete("/contacts/{contact_id}")
async def remove_contact(contact_id: str) -> dict:
    """Remove a contact from the nest."""
    delete_nest_contact(contact_id)
    return {"status": "removed"}


@router.get("/family-view")
async def get_family_view(user_id: str = "demo") -> dict:
    """Family dashboard view - green/yellow/red status."""
    assessment = get_latest_assessment(user_id)

    if not assessment:
        return {
            "status": "green",
            "summary": "Everything looks normal.",
            "categories": {
                "sleep": "normal",
                "activity": "normal",
                "hydration": "good",
                "medication": "completed",
            },
            "needs_attention": False,
        }

    overall_score = assessment.get("overall_score", 0.8)
    deviation_level = assessment.get("deviation_level", "none")

    # Determine status color
    if overall_score >= 0.7:
        status = "green"
    elif overall_score >= 0.4:
        status = "yellow"
    else:
        status = "red"

    # Build category summaries
    body_data = get_wellness_data(user_id, category="body", limit=5)
    habit_data = get_wellness_data(user_id, category="habits", limit=5)

    categories = {
        "sleep": "normal",
        "activity": "normal",
        "hydration": "good",
        "medication": "completed",
    }

    # Check each category
    for d in body_data:
        if d.get("metric") == "sleep":
            hours = d.get("value", {}).get("hours", 7)
            categories["sleep"] = "normal" if hours >= 6 else "low"
        elif d.get("metric") == "steps":
            steps = d.get("value", {}).get("count", 5000)
            categories["activity"] = "normal" if steps >= 3000 else "low"

    for d in habit_data:
        if d.get("metric") == "hydration":
            glasses = d.get("value", {}).get("glasses", 5)
            categories["hydration"] = "good" if glasses >= 5 else "low"
        elif d.get("metric") == "medication":
            taken = d.get("value", {}).get("taken", True)
            categories["medication"] = "completed" if taken else "missed"

    needs_attention = status == "red" or deviation_level == "significant"

    return {
        "status": status,
        "summary": assessment.get("narrative", "Doing well today."),
        "categories": categories,
        "needs_attention": needs_attention,
        "overall_score": overall_score,
    }
