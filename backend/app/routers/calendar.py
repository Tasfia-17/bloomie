"""Calendar integration router - finding wellness breaks in busy days."""

from datetime import datetime, timezone, timedelta

from fastapi import APIRouter

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("")
async def get_calendar_summary(user_id: str = "demo") -> dict:
    """Get today's calendar with identified wellness breaks."""
    # For demo, return a realistic busy day schedule
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")

    events = _get_demo_events(today)
    breaks = _find_wellness_breaks(events)
    load = _assess_calendar_load(events)

    return {
        "date": today,
        "events": events,
        "wellness_breaks": breaks,
        "calendar_load": load,
        "bloomie_thought": _calendar_thought(load, breaks),
    }


@router.post("/breaks/add")
async def add_wellness_break(break_time: str, activity: str, user_id: str = "demo") -> dict:
    """Add a wellness break to the calendar."""
    return {
        "status": "added",
        "break": {
            "time": break_time,
            "activity": activity,
            "duration_minutes": 5,
        },
        "bloomie_says": f"I've saved your {activity} break at {break_time}! 🌸 I'll remind you.",
    }


def _get_demo_events(today: str) -> list[dict]:
    """Generate realistic demo calendar events."""
    return [
        {"title": "Morning standup", "start": f"{today}T09:00", "end": f"{today}T09:30", "type": "meeting"},
        {"title": "Sprint planning", "start": f"{today}T10:00", "end": f"{today}T11:00", "type": "meeting"},
        {"title": "Design review", "start": f"{today}T11:00", "end": f"{today}T11:45", "type": "meeting"},
        {"title": "Lunch", "start": f"{today}T12:00", "end": f"{today}T13:00", "type": "break"},
        {"title": "Client call", "start": f"{today}T14:00", "end": f"{today}T15:00", "type": "meeting"},
        {"title": "Focus time", "start": f"{today}T15:00", "end": f"{today}T16:30", "type": "focus"},
        {"title": "1-on-1 with manager", "start": f"{today}T16:30", "end": f"{today}T17:00", "type": "meeting"},
    ]


def _find_wellness_breaks(events: list[dict]) -> list[dict]:
    """Find gaps between meetings for wellness micro-breaks."""
    breaks = []
    sorted_events = sorted(events, key=lambda e: e["start"])

    for i in range(len(sorted_events) - 1):
        current_end = sorted_events[i]["end"]
        next_start = sorted_events[i + 1]["start"]

        # Parse times
        end_time = datetime.fromisoformat(current_end)
        start_time = datetime.fromisoformat(next_start)
        gap_minutes = (start_time - end_time).total_seconds() / 60

        if gap_minutes >= 5:
            # Found a break!
            break_start = end_time + timedelta(minutes=2)  # 2 min buffer
            available_minutes = int(gap_minutes - 4)  # buffers on both sides

            activities = _suggest_break_activities(available_minutes)

            breaks.append({
                "start": break_start.strftime("%H:%M"),
                "end": (start_time - timedelta(minutes=2)).strftime("%H:%M"),
                "duration_minutes": available_minutes,
                "suggested_activities": activities,
            })

    # Also suggest before first meeting and after last
    if sorted_events:
        first_start = datetime.fromisoformat(sorted_events[0]["start"])
        morning_break = first_start - timedelta(minutes=15)
        breaks.insert(0, {
            "start": morning_break.strftime("%H:%M"),
            "end": (first_start - timedelta(minutes=5)).strftime("%H:%M"),
            "duration_minutes": 10,
            "suggested_activities": [
                {"activity": "Morning stretch", "emoji": "🧘", "minutes": 5},
                {"activity": "Set intentions", "emoji": "🌅", "minutes": 3},
            ],
        })

    return breaks


def _suggest_break_activities(available_minutes: int) -> list[dict]:
    """Suggest wellness activities that fit the time slot."""
    activities = []

    if available_minutes >= 10:
        activities.append({"activity": "Short walk", "emoji": "🚶", "minutes": 10})
    if available_minutes >= 5:
        activities.append({"activity": "Deep breathing", "emoji": "🌬️", "minutes": 3})
        activities.append({"activity": "Stretch break", "emoji": "🧘", "minutes": 5})
    if available_minutes >= 3:
        activities.append({"activity": "Water break", "emoji": "💧", "minutes": 2})
    if available_minutes >= 15:
        activities.append({"activity": "Mindfulness", "emoji": "✨", "minutes": 10})

    return activities[:3]


def _assess_calendar_load(events: list[dict]) -> dict:
    """Assess how busy the day is."""
    meetings = [e for e in events if e["type"] == "meeting"]
    total_meeting_hours = sum(
        (datetime.fromisoformat(e["end"]) - datetime.fromisoformat(e["start"])).total_seconds() / 3600
        for e in meetings
    )

    if total_meeting_hours >= 6:
        level = "very_busy"
        label = "Very busy day"
        color = "red"
    elif total_meeting_hours >= 4:
        level = "busy"
        label = "Busy day"
        color = "yellow"
    elif total_meeting_hours >= 2:
        level = "moderate"
        label = "Moderate day"
        color = "green"
    else:
        level = "light"
        label = "Light day"
        color = "green"

    return {
        "level": level,
        "label": label,
        "color": color,
        "meeting_count": len(meetings),
        "meeting_hours": round(total_meeting_hours, 1),
    }


def _calendar_thought(load: dict, breaks: list[dict]) -> str:
    """Generate Bloomie's calendar-aware thought."""
    if load["level"] == "very_busy":
        return f"Tomorrow looks really busy! I found {len(breaks)} tiny wellness spaces for you. 🌷"
    elif load["level"] == "busy":
        return f"You have {load['meeting_count']} meetings today. I've spotted {len(breaks)} break opportunities! ✨"
    elif load["level"] == "moderate":
        return f"A balanced day ahead. {len(breaks)} perfect moments for wellness breaks. 🌱"
    else:
        return "A light day! Plenty of room for walks, water breaks, and fresh air. 🦋"
