"""Unlockable ecosystem router - garden progression and achievements."""

from fastapi import APIRouter

from ..services.supabase_client import (
    get_garden_unlocks,
    create_garden_unlock,
    get_profile,
    update_profile,
)

router = APIRouter(prefix="/api/ecosystem", tags=["ecosystem"])

# Level system
LEVELS = [
    {"level": 1, "name": "Seedling", "emoji": "🌱", "quests_needed": 0, "unlocks": ["tiny garden"]},
    {"level": 2, "name": "Sprout", "emoji": "🌷", "quests_needed": 3, "unlocks": ["flowers", "first bloom"]},
    {"level": 3, "name": "Sapling", "emoji": "🐰", "quests_needed": 7, "unlocks": ["rabbit", "garden path"]},
    {"level": 4, "name": "Meadow", "emoji": "🦋", "quests_needed": 14, "unlocks": ["butterfly meadow", "more flowers"]},
    {"level": 5, "name": "Grove", "emoji": "🌲", "quests_needed": 21, "unlocks": ["second tree", "forest edge"]},
    {"level": 6, "name": "Cottage", "emoji": "🏡", "quests_needed": 30, "unlocks": ["cottage upgrade", "chimney smoke"]},
    {"level": 7, "name": "Lakeside", "emoji": "🏞️", "quests_needed": 45, "unlocks": ["expanded lake", "fish", "ducks"]},
    {"level": 8, "name": "Enchanted", "emoji": "🌌", "quests_needed": 60, "unlocks": ["night garden", "aurora", "campfire stories"]},
]

# All unlockable items
UNLOCKABLE_ITEMS = {
    "flower": [
        {"name": "Daisy", "emoji": "🌼", "quests_needed": 1},
        {"name": "Rose", "emoji": "🌹", "quests_needed": 5},
        {"name": "Tulip", "emoji": "🌷", "quests_needed": 8},
        {"name": "Sunflower", "emoji": "🌻", "quests_needed": 12},
        {"name": "Cherry Blossom", "emoji": "🌸", "quests_needed": 20},
        {"name": "Lotus", "emoji": "🪷", "quests_needed": 30},
    ],
    "animal": [
        {"name": "Rabbit", "emoji": "🐰", "quests_needed": 3},
        {"name": "Butterfly", "emoji": "🦋", "quests_needed": 7},
        {"name": "Bird", "emoji": "🐦", "quests_needed": 10},
        {"name": "Deer", "emoji": "🦌", "quests_needed": 15},
        {"name": "Fox", "emoji": "🦊", "quests_needed": 25},
        {"name": "Owl", "emoji": "🦉", "quests_needed": 35},
    ],
    "structure": [
        {"name": "Garden Bench", "emoji": "🪑", "quests_needed": 5},
        {"name": "Bird Bath", "emoji": "🛁", "quests_needed": 10},
        {"name": "Lantern", "emoji": "🏮", "quests_needed": 15},
        {"name": "Bridge", "emoji": "🌉", "quests_needed": 20},
        {"name": "Gazebo", "emoji": "⛺", "quests_needed": 30},
        {"name": "Lighthouse", "emoji": "🗼", "quests_needed": 45},
    ],
    "feature": [
        {"name": "Fireflies", "emoji": "✨", "quests_needed": 7},
        {"name": "Rainbow", "emoji": "🌈", "quests_needed": 14},
        {"name": "Campfire", "emoji": "🔥", "quests_needed": 21},
        {"name": "Northern Lights", "emoji": "🌌", "quests_needed": 40},
        {"name": "Shooting Stars", "emoji": "💫", "quests_needed": 50},
    ],
}


@router.get("")
async def get_ecosystem_state(user_id: str = "demo") -> dict:
    """Get full ecosystem progression state."""
    try:
        profile = get_profile(user_id)
        unlocks = get_garden_unlocks(user_id)
    except Exception:
        profile = None
        unlocks = []

    total_quests = profile.get("total_quests_completed", 0) if profile else 0
    garden_level = profile.get("garden_level", 1) if profile else 1

    # Determine current level
    current_level = LEVELS[0]
    next_level = LEVELS[1] if len(LEVELS) > 1 else None

    for i, lvl in enumerate(LEVELS):
        if total_quests >= lvl["quests_needed"]:
            current_level = lvl
            next_level = LEVELS[i + 1] if i + 1 < len(LEVELS) else None
        else:
            break

    # Progress to next level
    progress_to_next = 0.0
    quests_remaining = 0
    if next_level:
        range_size = next_level["quests_needed"] - current_level["quests_needed"]
        progress = total_quests - current_level["quests_needed"]
        progress_to_next = min(progress / max(range_size, 1), 1.0)
        quests_remaining = next_level["quests_needed"] - total_quests

    # Build unlocked items list
    unlocked_names = {u.get("item_name") for u in unlocks}

    # All items with unlock status
    all_items = []
    for category, items in UNLOCKABLE_ITEMS.items():
        for item in items:
            all_items.append({
                "category": category,
                "name": item["name"],
                "emoji": item["emoji"],
                "quests_needed": item["quests_needed"],
                "unlocked": item["name"] in unlocked_names or total_quests >= item["quests_needed"],
            })

    # Check for newly unlockable items
    newly_unlockable = [
        item for item in all_items
        if item["unlocked"] and item["name"] not in unlocked_names
    ]

    # Auto-unlock new items
    for item in newly_unlockable:
        try:
            create_garden_unlock(user_id, item["category"], item["name"])
        except Exception:
            pass

    return {
        "level": current_level,
        "next_level": next_level,
        "total_quests_completed": total_quests,
        "progress_to_next": round(progress_to_next, 2),
        "quests_remaining": quests_remaining,
        "unlocked_items": [i for i in all_items if i["unlocked"]],
        "locked_items": [i for i in all_items if not i["unlocked"]],
        "all_levels": LEVELS,
        "newly_unlocked": newly_unlockable,
        "garden_richness": _compute_richness(all_items),
    }


@router.get("/achievements")
async def get_achievements(user_id: str = "demo") -> dict:
    """Get achievement milestones."""
    try:
        profile = get_profile(user_id)
    except Exception:
        profile = None

    total_quests = profile.get("total_quests_completed", 0) if profile else 0
    streak = profile.get("streak_days", 0) if profile else 0

    achievements = [
        {"name": "First Bloom", "emoji": "🌸", "description": "Complete your first quest", "unlocked": total_quests >= 1},
        {"name": "Garden Keeper", "emoji": "🌿", "description": "Complete 10 quests", "unlocked": total_quests >= 10},
        {"name": "Forest Friend", "emoji": "🌲", "description": "Complete 25 quests", "unlocked": total_quests >= 25},
        {"name": "Master Gardener", "emoji": "🏆", "description": "Complete 50 quests", "unlocked": total_quests >= 50},
        {"name": "Week Warrior", "emoji": "🔥", "description": "7-day streak", "unlocked": streak >= 7},
        {"name": "Month Strong", "emoji": "💪", "description": "30-day streak", "unlocked": streak >= 30},
        {"name": "Pond Full", "emoji": "💧", "description": "Log hydration for 7 days", "unlocked": total_quests >= 7},
        {"name": "Early Bird", "emoji": "🐦", "description": "Log 5 morning check-ins", "unlocked": total_quests >= 5},
    ]

    return {
        "achievements": achievements,
        "total_unlocked": sum(1 for a in achievements if a["unlocked"]),
        "total": len(achievements),
    }


def _compute_richness(all_items: list[dict]) -> float:
    """Compute garden richness score (0-1)."""
    unlocked = sum(1 for i in all_items if i["unlocked"])
    total = len(all_items)
    return round(unlocked / max(total, 1), 2)
