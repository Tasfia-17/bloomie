"""Caffeine intelligence router - correlate caffeine with sleep patterns."""

from datetime import datetime, timezone, timedelta

from fastapi import APIRouter

from ..services.supabase_client import get_wellness_data

router = APIRouter(prefix="/api/caffeine", tags=["caffeine"])


@router.get("")
async def get_caffeine_summary(user_id: str = "demo") -> dict:
    """Get caffeine intake summary with sleep correlations."""
    try:
        caffeine_data = get_wellness_data(user_id, category="habits", metric="caffeine", limit=30)
        sleep_data = get_wellness_data(user_id, category="body", metric="sleep", limit=14)
    except Exception:
        caffeine_data = []
        sleep_data = []

    # Analyze caffeine patterns
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_caffeine = [d for d in caffeine_data if d.get("recorded_at", "").startswith(today)]
    total_today = sum(d.get("value", {}).get("mg", 0) for d in today_caffeine)
    last_intake_time = None

    if today_caffeine:
        last_intake_time = today_caffeine[0].get("value", {}).get("time", None)

    # Build correlation analysis
    correlation = _analyze_caffeine_sleep_correlation(caffeine_data, sleep_data)

    # Recommendations
    recs = _generate_caffeine_recommendations(total_today, last_intake_time, correlation)

    return {
        "today": {
            "total_mg": total_today,
            "drinks": len(today_caffeine),
            "last_intake_time": last_intake_time,
            "safe_limit": 400,
            "percentage_of_limit": round(total_today / 400 * 100, 0),
        },
        "correlation": correlation,
        "recommendations": recs,
        "garden_effect": _caffeine_garden_effect(total_today, last_intake_time),
        "bloomie_thought": _caffeine_thought(total_today, last_intake_time, correlation),
    }


@router.post("/log")
async def log_caffeine(mg: int = 95, drink_type: str = "coffee", user_id: str = "demo") -> dict:
    """Quick log a caffeine intake."""
    from ..services.supabase_client import create_wellness_data

    now = datetime.now(timezone.utc)
    value = {
        "mg": mg,
        "drink_type": drink_type,
        "time": now.strftime("%H:%M"),
    }

    try:
        create_wellness_data(
            user_id=user_id,
            category="habits",
            metric="caffeine",
            value=value,
            source="manual",
        )
    except Exception:
        pass

    hour = now.hour
    is_late = hour >= 14
    thought = f"Logged your {drink_type} ({mg}mg). ☕"
    if is_late:
        thought += " It's getting late — this might affect tonight's sleep! 🌙"
    else:
        thought += " Enjoy! Your garden is buzzing with energy. ⚡"

    return {
        "status": "logged",
        "mg": mg,
        "drink_type": drink_type,
        "time": now.strftime("%H:%M"),
        "is_late_intake": is_late,
        "bloomie_says": thought,
    }


def _analyze_caffeine_sleep_correlation(caffeine_data: list[dict], sleep_data: list[dict]) -> dict:
    """Analyze how late caffeine correlates with sleep quality."""
    if not caffeine_data or not sleep_data:
        return {
            "has_pattern": False,
            "pattern_description": "Not enough data yet. Keep tracking for insights!",
            "late_caffeine_days": 0,
            "average_sleep_with_late_caffeine": None,
            "average_sleep_without": None,
            "confidence": 0.0,
        }

    # Group by day
    caffeine_by_day: dict[str, list] = {}
    for d in caffeine_data:
        day = d.get("recorded_at", "")[:10]
        if day:
            caffeine_by_day.setdefault(day, []).append(d.get("value", {}))

    sleep_by_day: dict[str, float] = {}
    for d in sleep_data:
        day = d.get("recorded_at", "")[:10]
        hours = d.get("value", {}).get("hours")
        if day and hours:
            sleep_by_day[day] = hours

    # Find days with late caffeine (after 2 PM)
    late_caffeine_days: list[str] = []
    no_late_caffeine_days: list[str] = []

    for day, intakes in caffeine_by_day.items():
        has_late = any(
            int(i.get("time", "12:00").split(":")[0]) >= 14
            for i in intakes
            if i.get("time")
        )
        if has_late:
            late_caffeine_days.append(day)
        else:
            no_late_caffeine_days.append(day)

    # Compare sleep on those days
    sleep_with_late = [sleep_by_day.get(d, 0) for d in late_caffeine_days if d in sleep_by_day]
    sleep_without_late = [sleep_by_day.get(d, 0) for d in no_late_caffeine_days if d in sleep_by_day]

    avg_with = sum(sleep_with_late) / len(sleep_with_late) if sleep_with_late else None
    avg_without = sum(sleep_without_late) / len(sleep_without_late) if sleep_without_late else None

    has_pattern = False
    pattern_desc = "Still learning your patterns."

    if avg_with is not None and avg_without is not None:
        diff = avg_without - avg_with
        if diff > 0.5:
            has_pattern = True
            pattern_desc = f"You sleep {diff:.0f}h less on days with late caffeine. Consider stopping earlier!"
        elif diff > 0.2:
            has_pattern = True
            pattern_desc = f"Late caffeine might reduce your sleep by ~{diff*60:.0f} minutes."
        else:
            pattern_desc = "Your sleep doesn't seem strongly affected by late caffeine timing."

    confidence = min(len(sleep_with_late) + len(sleep_without_late), 14) / 14

    return {
        "has_pattern": has_pattern,
        "pattern_description": pattern_desc,
        "late_caffeine_days": len(late_caffeine_days),
        "average_sleep_with_late_caffeine": round(avg_with, 1) if avg_with else None,
        "average_sleep_without": round(avg_without, 1) if avg_without else None,
        "confidence": round(confidence, 2),
    }


def _generate_caffeine_recommendations(total_mg: int, last_time: str | None, correlation: dict) -> list[str]:
    """Generate personalized caffeine recommendations."""
    recs = []

    if total_mg > 400:
        recs.append("You've exceeded 400mg today. Consider switching to water or herbal tea.")
    elif total_mg > 300:
        recs.append("Getting close to the daily limit. Maybe make your next drink caffeine-free?")

    if last_time:
        hour = int(last_time.split(":")[0])
        if hour >= 16:
            recs.append("Your last coffee was after 4 PM. This might push back your sleep tonight.")
        elif hour >= 14:
            recs.append("Afternoon caffeine noted. Try to make it your last for today!")

    if correlation.get("has_pattern"):
        recs.append(correlation["pattern_description"])

    if not recs:
        recs.append("Your caffeine intake looks healthy today! ☕")

    return recs


def _caffeine_garden_effect(total_mg: int, last_time: str | None) -> dict:
    """How caffeine affects the garden."""
    if total_mg > 400:
        return {"butterfly_speed": "fast", "energy_level": "high", "warning": True}
    elif total_mg > 200:
        return {"butterfly_speed": "normal", "energy_level": "good", "warning": False}
    else:
        return {"butterfly_speed": "calm", "energy_level": "moderate", "warning": False}


def _caffeine_thought(total_mg: int, last_time: str | None, correlation: dict) -> str:
    """Bloomie's caffeine thought."""
    if total_mg == 0:
        return "No caffeine today! Your garden is running on natural energy. 🌿"
    elif total_mg > 300:
        return f"☕ {total_mg}mg of caffeine today. Your butterflies are buzzing extra fast!"

    if last_time and int(last_time.split(":")[0]) >= 16:
        return "Late caffeine alert! 🌙 Your sky might be a little unsettled tonight."

    return f"☕ {total_mg}mg today. A nice balanced amount for your garden's energy!"
