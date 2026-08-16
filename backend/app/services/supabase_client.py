"""Supabase client service for Bloomie."""

import json
import os
from functools import lru_cache
from datetime import datetime
from typing import Optional

from supabase import create_client, Client

_JSONB_FIELDS = {"value", "medications", "contacts", "clinical_alert", "garden_state",
                 "insights", "deviations", "recommendations", "permissions", "context"}


def _fix_row(row: dict) -> dict:
    """Parse any JSONB fields that were stored as double-encoded strings."""
    for key in _JSONB_FIELDS:
        val = row.get(key)
        if isinstance(val, str):
            try:
                row[key] = json.loads(val)
            except (json.JSONDecodeError, TypeError):
                pass
    return row


def _fix_rows(rows: list[dict]) -> list[dict]:
    return [_fix_row(r) for r in rows]


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Get or create the Supabase client singleton."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    return create_client(url, key)


# ---------------------------------------------------------------------------
# Profiles
# ---------------------------------------------------------------------------

def get_profile(user_id: str) -> Optional[dict]:
    sb = get_supabase_client()
    resp = sb.table("profiles").select("*").eq("id", user_id).single().execute()
    return resp.data if resp.data else None


def get_profile_by_email(email: str) -> Optional[dict]:
    sb = get_supabase_client()
    resp = sb.table("profiles").select("*").eq("email", email).single().execute()
    return resp.data if resp.data else None


def create_profile(data: dict) -> dict:
    sb = get_supabase_client()
    resp = sb.table("profiles").insert(data).execute()
    return resp.data[0]


def update_profile(user_id: str, data: dict) -> dict:
    sb = get_supabase_client()
    data["updated_at"] = datetime.utcnow().isoformat()
    resp = sb.table("profiles").update(data).eq("id", user_id).execute()
    return resp.data[0]


# ---------------------------------------------------------------------------
# Wellness Data
# ---------------------------------------------------------------------------

def create_wellness_data(user_id: str, category: str, metric: str, value: dict, source: str = "manual", recorded_at: Optional[datetime] = None) -> dict:
    sb = get_supabase_client()
    row: dict = {
        "user_id": user_id,
        "category": category,
        "metric": metric,
        "value": value,
        "source": source,
    }
    if recorded_at:
        row["recorded_at"] = recorded_at.isoformat()
    resp = sb.table("wellness_data").insert(row).execute()
    return resp.data[0]


def get_wellness_data(user_id: str, category: Optional[str] = None, metric: Optional[str] = None, limit: int = 50) -> list[dict]:
    sb = get_supabase_client()
    query = sb.table("wellness_data").select("*").eq("user_id", user_id)
    if category:
        query = query.eq("category", category)
    if metric:
        query = query.eq("metric", metric)
    resp = query.order("recorded_at", desc=True).limit(limit).execute()
    return _fix_rows(resp.data)


def get_wellness_data_range(user_id: str, start: str, end: str, category: Optional[str] = None) -> list[dict]:
    sb = get_supabase_client()
    query = sb.table("wellness_data").select("*").eq("user_id", user_id).gte("recorded_at", start).lte("recorded_at", end)
    if category:
        query = query.eq("category", category)
    resp = query.order("recorded_at", desc=True).execute()
    return _fix_rows(resp.data)


# ---------------------------------------------------------------------------
# Baselines
# ---------------------------------------------------------------------------

def get_baselines(user_id: str) -> list[dict]:
    sb = get_supabase_client()
    resp = sb.table("baselines").select("*").eq("user_id", user_id).execute()
    return resp.data


def upsert_baseline(user_id: str, metric: str, data: dict) -> dict:
    sb = get_supabase_client()
    row = {
        "user_id": user_id,
        "metric": metric,
        **data,
        "last_updated": datetime.utcnow().isoformat(),
    }
    resp = sb.table("baselines").upsert(row, on_conflict="user_id,metric").execute()
    return resp.data[0]


# ---------------------------------------------------------------------------
# Assessments
# ---------------------------------------------------------------------------

def create_assessment(data: dict) -> dict:
    sb = get_supabase_client()
    resp = sb.table("assessments").insert(data).execute()
    return resp.data[0]


def get_latest_assessment(user_id: str) -> Optional[dict]:
    sb = get_supabase_client()
    resp = (
        sb.table("assessments")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return _fix_row(resp.data[0]) if resp.data else None


def get_assessments(user_id: str, limit: int = 30) -> list[dict]:
    sb = get_supabase_client()
    resp = (
        sb.table("assessments")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return _fix_rows(resp.data)


# ---------------------------------------------------------------------------
# Quests
# ---------------------------------------------------------------------------

def create_quest(data: dict) -> dict:
    sb = get_supabase_client()
    resp = sb.table("quests").insert(data).execute()
    return resp.data[0]


def get_active_quests(user_id: str) -> list[dict]:
    sb = get_supabase_client()
    resp = (
        sb.table("quests")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "active")
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data


def update_quest(quest_id: str, data: dict) -> dict:
    sb = get_supabase_client()
    resp = sb.table("quests").update(data).eq("id", quest_id).execute()
    return resp.data[0]


def complete_quest(quest_id: str) -> dict:
    sb = get_supabase_client()
    resp = (
        sb.table("quests")
        .update({"status": "completed", "completed_at": datetime.utcnow().isoformat()})
        .eq("id", quest_id)
        .execute()
    )
    return resp.data[0]


# ---------------------------------------------------------------------------
# Nest Contacts
# ---------------------------------------------------------------------------

def get_nest_contacts(user_id: str) -> list[dict]:
    sb = get_supabase_client()
    resp = sb.table("nest_contacts").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return resp.data


def create_nest_contact(data: dict) -> dict:
    sb = get_supabase_client()
    resp = sb.table("nest_contacts").insert(data).execute()
    return resp.data[0]


def update_nest_contact(contact_id: str, data: dict) -> dict:
    sb = get_supabase_client()
    resp = sb.table("nest_contacts").update(data).eq("id", contact_id).execute()
    return resp.data[0]


def delete_nest_contact(contact_id: str) -> None:
    sb = get_supabase_client()
    sb.table("nest_contacts").delete().eq("id", contact_id).execute()


# ---------------------------------------------------------------------------
# Insights
# ---------------------------------------------------------------------------

def get_insights(user_id: str, limit: int = 20) -> list[dict]:
    sb = get_supabase_client()
    resp = (
        sb.table("insights")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return resp.data


def create_insight(data: dict) -> dict:
    sb = get_supabase_client()
    resp = sb.table("insights").insert(data).execute()
    return resp.data[0]


def acknowledge_insight(insight_id: str) -> dict:
    sb = get_supabase_client()
    resp = sb.table("insights").update({"acknowledged": True}).eq("id", insight_id).execute()
    return resp.data[0]


# ---------------------------------------------------------------------------
# Garden Unlocks
# ---------------------------------------------------------------------------

def get_garden_unlocks(user_id: str) -> list[dict]:
    sb = get_supabase_client()
    resp = sb.table("garden_unlocks").select("*").eq("user_id", user_id).execute()
    return resp.data


def create_garden_unlock(user_id: str, item_type: str, item_name: str) -> dict:
    sb = get_supabase_client()
    resp = sb.table("garden_unlocks").upsert(
        {"user_id": user_id, "item_type": item_type, "item_name": item_name},
        on_conflict="user_id,item_name"
    ).execute()
    return resp.data[0]


# ---------------------------------------------------------------------------
# Chat History
# ---------------------------------------------------------------------------

def save_chat_message(user_id: str, role: str, content: str, context: Optional[dict] = None) -> dict:
    sb = get_supabase_client()
    row = {"user_id": user_id, "role": role, "content": content}
    if context:
        row["context"] = context
    resp = sb.table("chat_history").insert(row).execute()
    return resp.data[0]


def get_chat_history(user_id: str, limit: int = 20) -> list[dict]:
    sb = get_supabase_client()
    resp = (
        sb.table("chat_history")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return list(reversed(resp.data))
