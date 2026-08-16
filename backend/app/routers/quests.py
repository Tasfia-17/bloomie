"""Quests router - gamification and wellness challenges."""

from fastapi import APIRouter

from ..models.schemas import Quest, QuestCreate, QuestProgress
from ..services.supabase_client import (
    get_active_quests,
    create_quest,
    update_quest,
    complete_quest,
    get_profile,
    update_profile,
    create_garden_unlock,
)

router = APIRouter(prefix="/api/quests", tags=["quests"])

# Reward thresholds
QUEST_REWARDS = {
    1: {"type": "flower", "name": "First Bloom"},
    3: {"type": "butterfly", "name": "Butterfly Friend"},
    7: {"type": "animal", "name": "Garden Rabbit"},
    14: {"type": "tree", "name": "New Tree Branch"},
    21: {"type": "structure", "name": "Garden Bench"},
    30: {"type": "feature", "name": "Campfire"},
}


@router.get("", response_model=list[Quest])
async def list_quests(user_id: str = "demo") -> list[Quest]:
    """Get active quests for a user."""
    quests = get_active_quests(user_id)
    return [Quest(**q) for q in quests]


@router.post("", response_model=Quest)
async def create_new_quest(data: QuestCreate, user_id: str = "demo") -> Quest:
    """Create a new quest."""
    quest_data = {
        "user_id": user_id,
        "type": data.type,
        "title": data.title,
        "description": data.description,
        "target_value": data.target_value,
        "current_value": 0,
        "reward": data.reward,
        "status": "active",
    }
    result = create_quest(quest_data)
    return Quest(**result)


@router.post("/{quest_id}/progress", response_model=Quest)
async def update_progress(quest_id: str, data: QuestProgress, user_id: str = "demo") -> Quest:
    """Update quest progress."""
    result = update_quest(quest_id, {"current_value": data.progress})
    quest = Quest(**result)

    # Check if quest is now complete
    if quest.current_value >= quest.target_value and quest.status == "active":
        completed = complete_quest(quest_id)
        quest = Quest(**completed)

        # Update profile
        profile = get_profile(user_id)
        if profile:
            total = profile.get("total_quests_completed", 0) + 1
            update_data: dict = {"total_quests_completed": total}

            # Check for garden unlocks
            for threshold, reward in QUEST_REWARDS.items():
                if total == threshold:
                    create_garden_unlock(user_id, reward["type"], reward["name"])
                    break

            update_profile(user_id, update_data)

    return quest


@router.post("/generate")
async def generate_daily_quests(user_id: str = "demo") -> list[Quest]:
    """Generate daily quests based on user patterns."""
    # Generate 3-5 quests based on what the user needs
    daily_quests = [
        {
            "user_id": user_id,
            "type": "hydration",
            "title": "Pond Quest 💧",
            "description": "Drink 8 glasses of water today.",
            "target_value": 8,
            "current_value": 0,
            "reward": "flower",
            "status": "active",
        },
        {
            "user_id": user_id,
            "type": "movement",
            "title": "5-Minute Quest 🚶",
            "description": "Take a 5-minute walk.",
            "target_value": 1,
            "current_value": 0,
            "reward": "butterfly",
            "status": "active",
        },
        {
            "user_id": user_id,
            "type": "connection",
            "title": "Connection Quest 💌",
            "description": "Message someone you care about.",
            "target_value": 1,
            "current_value": 0,
            "reward": "bird",
            "status": "active",
        },
        {
            "user_id": user_id,
            "type": "mindfulness",
            "title": "3-Minute Reset 🧘",
            "description": "Take 3 minutes to breathe deeply.",
            "target_value": 1,
            "current_value": 0,
            "reward": "firefly",
            "status": "active",
        },
        {
            "user_id": user_id,
            "type": "kindness",
            "title": "Kindness Quest 🌼",
            "description": "Do something nice for someone.",
            "target_value": 1,
            "current_value": 0,
            "reward": "flower",
            "status": "active",
        },
    ]

    created_quests = []
    for q in daily_quests:
        result = create_quest(q)
        created_quests.append(Quest(**result))

    return created_quests
