"""Today summary router - what matters right now."""

from datetime import datetime, timezone

from fastapi import APIRouter

from ..models.schemas import TodaySummary, GardenState, Quest
from ..services.supabase_client import (
    get_profile,
    get_latest_assessment,
    get_active_quests,
    get_wellness_data,
)

router = APIRouter(prefix="/api/today", tags=["today"])


@router.get("", response_model=TodaySummary)
async def get_today(user_id: str = "demo") -> TodaySummary:
    """Get today's wellness summary for the user."""
    profile = get_profile(user_id)
    user_name = profile["name"].split(" ")[0] if profile else "friend"

    # Time-based greeting
    hour = datetime.now(timezone.utc).hour
    if hour < 12:
        greeting = f"Good morning, {user_name} 🌷"
    elif hour < 17:
        greeting = f"Good afternoon, {user_name} ☀️"
    else:
        greeting = f"Good evening, {user_name} 🌙"

    # Get latest assessment
    assessment = get_latest_assessment(user_id)

    # Get body stats from recent data
    body_data = get_wellness_data(user_id, category="body", limit=10)
    habit_data = get_wellness_data(user_id, category="habits", limit=10)

    body_stats: dict = {}
    for d in body_data:
        metric = d.get("metric", "")
        if metric not in body_stats:
            body_stats[metric] = d.get("value", {})

    # Add habit metrics
    for d in habit_data:
        metric = d.get("metric", "")
        if metric not in body_stats:
            body_stats[metric] = d.get("value", {})

    # Get active quests
    quests_data = get_active_quests(user_id)
    active_quests = [Quest(**q) for q in quests_data]

    # Garden state
    garden_state_data = assessment.get("garden_state", {}) if assessment else {}
    garden_state = GardenState(
        sky=garden_state_data.get("sky", "clear"),
        pond_level=garden_state_data.get("pond_level", 0.7),
        tree_growth=garden_state_data.get("tree_growth", 0.5),
        butterfly_count=garden_state_data.get("butterfly_count", 5),
        bird_count=garden_state_data.get("bird_count", 3),
        firefly_count=garden_state_data.get("firefly_count", 0),
        flower_bloom=garden_state_data.get("flower_bloom", 0.7),
        rabbit_mood=garden_state_data.get("rabbit_mood", "happy"),
    )

    # Bloomie's thought
    bloomie_thought = assessment.get("narrative", "Your garden is waiting for you! Let's make today great. 🌸") if assessment else "Welcome back! Your garden missed you. 🌸"

    streak = profile.get("streak_days", 0) if profile else 0

    return TodaySummary(
        user_name=user_name,
        greeting=greeting,
        body_stats=body_stats,
        bloomie_thought=bloomie_thought,
        active_quests=active_quests,
        garden_state=garden_state,
        streak_days=streak,
    )
