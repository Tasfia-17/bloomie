"""Garden items router - tracks what each log plants in the garden."""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from ..services.supabase_client import get_supabase_client, _resolve_user_id

router = APIRouter(prefix="/api/garden", tags=["garden"])

# What each log type creates in the garden
LOG_REWARDS = {
    "hydration": {"type": "flower", "name": "Water Lily", "emoji": "💧", "color": "#5BA8C5"},
    "steps": {"type": "butterfly", "name": "Monarch", "emoji": "🦋", "color": "#F5E6A3"},
    "sleep": {"type": "star", "name": "Night Star", "emoji": "⭐", "color": "#C4B1D4"},
    "heart_rate": {"type": "flower", "name": "Heart Bloom", "emoji": "❤️", "color": "#F4A7BB"},
    "mood": {"type": "flower", "name": "Mood Petal", "emoji": "🌸", "color": "#FFDAB9"},
    "exercise": {"type": "tree", "name": "Strength Sapling", "emoji": "🌲", "color": "#5B8C5A"},
    "mindfulness": {"type": "firefly", "name": "Calm Light", "emoji": "✨", "color": "#F5E6A3"},
    "caffeine": {"type": "mushroom", "name": "Coffee Cap", "emoji": "🍄", "color": "#8B6914"},
    "medication": {"type": "flower", "name": "Care Daisy", "emoji": "🌼", "color": "#FFE082"},
    "nutrition": {"type": "fruit", "name": "Nourish Apple", "emoji": "🍎", "color": "#FF8A80"},
    "energy": {"type": "flower", "name": "Sun Petal", "emoji": "🌻", "color": "#F5E6A3"},
    "stress": {"type": "stone", "name": "Peace Stone", "emoji": "🪨", "color": "#A8C5A0"},
    "journal": {"type": "flower", "name": "Memory Rose", "emoji": "🌹", "color": "#CE93D8"},
    "weight": {"type": "flower", "name": "Balance Bloom", "emoji": "⚖️", "color": "#B5E8D5"},
    "activity_minutes": {"type": "butterfly", "name": "Swift Wing", "emoji": "🦋", "color": "#80DEEA"},
}


class GardenItem(BaseModel):
    id: str
    user_id: str
    item_type: str
    item_name: str
    emoji: str
    color: str
    source_metric: str
    source_value: Optional[str] = None
    planted_at: str
    position_x: float
    position_z: float


@router.get("/items")
async def get_garden_items(user_id: str = "demo") -> dict:
    """Get all garden items (flowers, trees, etc.) planted by user's logs."""
    user_id = _resolve_user_id(user_id)
    sb = get_supabase_client()

    try:
        resp = (
            sb.table("garden_items")
            .select("*")
            .eq("user_id", user_id)
            .order("planted_at", desc=True)
            .limit(100)
            .execute()
        )
        items = resp.data or []
    except Exception:
        items = []

    # Group by type for summary
    summary = {}
    for item in items:
        t = item.get("item_type", "flower")
        summary[t] = summary.get(t, 0) + 1

    return {
        "items": items,
        "total": len(items),
        "summary": summary,
        "garden_density": min(len(items) / 50, 1.0),
    }


@router.post("/plant")
async def plant_item(metric: str, value: str = "", user_id: str = "demo") -> dict:
    """Plant a garden item as reward for a wellness log."""
    import random

    user_id = _resolve_user_id(user_id)
    reward = LOG_REWARDS.get(metric, {"type": "flower", "name": "Wild Bloom", "emoji": "🌸", "color": "#A8C5A0"})

    # Random position on the island (circular distribution)
    import math
    angle = random.uniform(0, 2 * math.pi)
    radius = random.uniform(1.0, 3.8)
    pos_x = math.cos(angle) * radius
    pos_z = math.sin(angle) * radius

    item_data = {
        "user_id": user_id,
        "item_type": reward["type"],
        "item_name": reward["name"],
        "emoji": reward["emoji"],
        "color": reward["color"],
        "source_metric": metric,
        "source_value": value,
        "position_x": round(pos_x, 2),
        "position_z": round(pos_z, 2),
        "planted_at": datetime.now(timezone.utc).isoformat(),
    }

    sb = get_supabase_client()
    try:
        resp = sb.table("garden_items").insert(item_data).execute()
        planted = resp.data[0] if resp.data else item_data
    except Exception:
        planted = item_data

    return {
        "planted": planted,
        "reward": reward,
        "message": f"{reward['emoji']} A {reward['name']} appeared in your garden!",
    }


@router.get("/items/{item_id}")
async def get_item_detail(item_id: str) -> dict:
    """Get details about a specific garden item (what log created it)."""
    sb = get_supabase_client()
    try:
        resp = sb.table("garden_items").select("*").eq("id", item_id).single().execute()
        return resp.data or {"error": "Item not found"}
    except Exception:
        return {"error": "Item not found"}
