"""Advanced science-backed wellness features:
- Voice/text check-in with AI metric extraction
- Wellness Score (0-100) with weighted multi-factor formula
- Personalized time-blocked daily plan
- Chronotype detection
- Social jet lag calculator
- Body battery / allostatic load estimation
"""

import json
import statistics
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel
from langchain_core.messages import HumanMessage

from ..services.openrouter_client import get_llm
from ..services.supabase_client import get_wellness_data, get_baselines, get_latest_assessment, _resolve_user_id

router = APIRouter(prefix="/api/science", tags=["science"])


# ============================================================================
# 1. AI VOICE/TEXT CHECK-IN (Natural Language Metric Extraction)
# ============================================================================

class CheckinInput(BaseModel):
    text: str  # Natural language input (from voice transcription or typed)
    user_name: str = "friend"


class ExtractedMetrics(BaseModel):
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[str] = None  # poor/fair/good/great
    mood: Optional[int] = None  # 1-10
    energy: Optional[int] = None  # 1-10
    stress: Optional[int] = None  # 1-10
    hydration_glasses: Optional[int] = None
    exercise_minutes: Optional[int] = None
    pain_level: Optional[int] = None  # 1-10
    caffeine_mg: Optional[int] = None
    weight_kg: Optional[float] = None
    steps: Optional[int] = None
    notes: Optional[str] = None


EXTRACTION_PROMPT = """Extract wellness metrics from this natural language check-in. Return JSON only.

User said: "{text}"

Extract any mentioned metrics into this exact JSON structure (use null for anything not mentioned):
{{
  "sleep_hours": <number or null>,
  "sleep_quality": <"poor"|"fair"|"good"|"great" or null>,
  "mood": <1-10 scale or null>,
  "energy": <1-10 scale or null>,
  "stress": <1-10 scale or null>,
  "hydration_glasses": <number or null>,
  "exercise_minutes": <number or null>,
  "pain_level": <1-10 or null>,
  "caffeine_mg": <number or null>,
  "weight_kg": <number or null>,
  "steps": <number or null>,
  "notes": <any additional context as string or null>
}}

Rules:
- Infer mood/energy/stress from tone if explicitly stated (e.g. "feeling great" = mood 8-9)
- "a cup of coffee" = ~95mg caffeine, "two cups" = ~190mg
- "slept well" without hours = sleep_quality "good", keep hours null
- "walked 30 minutes" = exercise_minutes 30
- "10k steps" = steps 10000
- Only extract what's clearly stated or strongly implied
- Return ONLY the JSON, no markdown fences"""


@router.post("/checkin")
async def smart_checkin(data: CheckinInput, user_id: str = "demo") -> dict:
    """Extract wellness metrics from natural language using AI."""
    user_id = _resolve_user_id(user_id)

    try:
        llm = get_llm()
        prompt = EXTRACTION_PROMPT.format(text=data.text)
        response = llm.invoke([HumanMessage(content=prompt)])
        raw = response.content.strip()

        # Parse JSON
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()

        metrics = json.loads(raw)
    except Exception:
        # Fallback: simple keyword extraction
        metrics = _fallback_extraction(data.text)

    # Store extracted metrics in wellness_data
    stored_count = 0
    from ..services.supabase_client import create_wellness_data

    if metrics.get("sleep_hours"):
        create_wellness_data(user_id, "body", "sleep", {"hours": metrics["sleep_hours"], "quality": metrics.get("sleep_quality", "fair")})
        stored_count += 1
    if metrics.get("mood"):
        create_wellness_data(user_id, "self_report", "mood", {"score": metrics["mood"]})
        stored_count += 1
    if metrics.get("energy"):
        create_wellness_data(user_id, "self_report", "energy", {"score": metrics["energy"]})
        stored_count += 1
    if metrics.get("stress"):
        create_wellness_data(user_id, "self_report", "stress", {"score": metrics["stress"]})
        stored_count += 1
    if metrics.get("hydration_glasses"):
        create_wellness_data(user_id, "habits", "hydration", {"glasses": metrics["hydration_glasses"]})
        stored_count += 1
    if metrics.get("exercise_minutes"):
        create_wellness_data(user_id, "habits", "exercise", {"minutes": metrics["exercise_minutes"]})
        stored_count += 1
    if metrics.get("caffeine_mg"):
        create_wellness_data(user_id, "habits", "caffeine", {"mg": metrics["caffeine_mg"], "time": datetime.now(timezone.utc).strftime("%H:%M")})
        stored_count += 1
    if metrics.get("steps"):
        create_wellness_data(user_id, "body", "steps", {"count": metrics["steps"]})
        stored_count += 1

    return {
        "extracted_metrics": metrics,
        "metrics_stored": stored_count,
        "original_text": data.text,
        "bloomie_response": _generate_checkin_response(metrics, data.user_name),
    }


# ============================================================================
# 2. WELLNESS SCORE (0-100) - Weighted Multi-Factor
# ============================================================================

SCORE_WEIGHTS = {
    "sleep": 0.25,       # 25% - sleep is the foundation
    "activity": 0.20,    # 20% - movement
    "hydration": 0.15,   # 15% - basic nutrition
    "mood": 0.15,        # 15% - mental state
    "recovery": 0.10,    # 10% - HRV/recovery signals
    "consistency": 0.15, # 15% - showing up daily
}


@router.get("/wellness-score")
async def get_wellness_score(user_id: str = "demo") -> dict:
    """Calculate composite wellness score (0-100) with breakdown."""
    user_id = _resolve_user_id(user_id)

    # Fetch recent data
    body_data = get_wellness_data(user_id, category="body", limit=30)
    habit_data = get_wellness_data(user_id, category="habits", limit=30)
    self_data = get_wellness_data(user_id, category="self_report", limit=20)
    baselines = get_baselines(user_id)

    baselines_map = {b["metric"]: b for b in baselines}

    # Calculate each component (0-100)
    sleep_score = _calc_sleep_score(body_data, baselines_map)
    activity_score = _calc_activity_score(body_data, baselines_map)
    hydration_score = _calc_hydration_score(habit_data)
    mood_score = _calc_mood_score(self_data)
    recovery_score = _calc_recovery_score(body_data, baselines_map)
    consistency_score = _calc_consistency_score(body_data, habit_data, self_data)

    # Weighted composite
    total = (
        sleep_score * SCORE_WEIGHTS["sleep"]
        + activity_score * SCORE_WEIGHTS["activity"]
        + hydration_score * SCORE_WEIGHTS["hydration"]
        + mood_score * SCORE_WEIGHTS["mood"]
        + recovery_score * SCORE_WEIGHTS["recovery"]
        + consistency_score * SCORE_WEIGHTS["consistency"]
    )

    total = round(min(max(total, 0), 100))

    # Trend (compare to 3 days ago)
    trend = "stable"
    assessment = get_latest_assessment(user_id)
    if assessment:
        prev_score = assessment.get("overall_score", 0.7) * 100
        if total > prev_score + 5:
            trend = "improving"
        elif total < prev_score - 5:
            trend = "declining"

    return {
        "score": total,
        "trend": trend,
        "breakdown": {
            "sleep": {"score": round(sleep_score), "weight": "25%", "label": _score_label(sleep_score)},
            "activity": {"score": round(activity_score), "weight": "20%", "label": _score_label(activity_score)},
            "hydration": {"score": round(hydration_score), "weight": "15%", "label": _score_label(hydration_score)},
            "mood": {"score": round(mood_score), "weight": "15%", "label": _score_label(mood_score)},
            "recovery": {"score": round(recovery_score), "weight": "10%", "label": _score_label(recovery_score)},
            "consistency": {"score": round(consistency_score), "weight": "15%", "label": _score_label(consistency_score)},
        },
        "interpretation": _interpret_score(total),
    }


# ============================================================================
# 3. PERSONALIZED TIME-BLOCKED DAILY PLAN
# ============================================================================

@router.get("/daily-plan")
async def get_daily_plan(user_id: str = "demo") -> dict:
    """Generate personalized morning/afternoon/evening wellness plan."""
    user_id = _resolve_user_id(user_id)

    body_data = get_wellness_data(user_id, category="body", limit=10)
    habit_data = get_wellness_data(user_id, category="habits", limit=10)
    self_data = get_wellness_data(user_id, category="self_report", limit=5)

    # Analyze what's missing/needed today
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_body = [d for d in body_data if d.get("recorded_at", "").startswith(today_str)]
    today_habits = [d for d in habit_data if d.get("recorded_at", "").startswith(today_str)]

    has_sleep = any(d.get("metric") == "sleep" for d in today_body)
    has_steps = any(d.get("metric") == "steps" for d in today_body)
    has_water = any(d.get("metric") == "hydration" for d in today_habits)
    has_exercise = any(d.get("metric") == "exercise" for d in today_habits)
    has_mindfulness = any(d.get("metric") == "mindfulness" for d in today_habits)

    # Get latest mood/energy for context
    latest_mood = next((d.get("value", {}).get("score", 7) for d in self_data if d.get("metric") == "mood"), 7)
    latest_energy = next((d.get("value", {}).get("score", 6) for d in self_data if d.get("metric") == "energy"), 6)

    # Generate personalized plan
    morning = _gen_morning_plan(has_sleep, latest_energy)
    afternoon = _gen_afternoon_plan(has_steps, has_water, has_exercise, latest_mood)
    evening = _gen_evening_plan(has_mindfulness, latest_mood)

    return {
        "date": today_str,
        "energy_level": latest_energy,
        "mood_level": latest_mood,
        "plan": {
            "morning": morning,
            "afternoon": afternoon,
            "evening": evening,
        },
        "completed_today": {
            "sleep_logged": has_sleep,
            "steps_logged": has_steps,
            "water_logged": has_water,
            "exercise_done": has_exercise,
            "mindfulness_done": has_mindfulness,
        },
    }


# ============================================================================
# 4. CHRONOTYPE DETECTION
# ============================================================================

@router.get("/chronotype")
async def detect_chronotype(user_id: str = "demo") -> dict:
    """Detect user's chronotype from sleep patterns."""
    user_id = _resolve_user_id(user_id)
    sleep_data = get_wellness_data(user_id, category="body", metric="sleep", limit=14)

    if len(sleep_data) < 3:
        return {
            "chronotype": "unknown",
            "confidence": 0,
            "message": "Need at least 3 days of sleep data to detect your chronotype.",
            "recommendations": [],
        }

    # Analyze sleep patterns
    sleep_hours = [d.get("value", {}).get("hours", 7) for d in sleep_data if d.get("value", {}).get("hours")]

    avg_sleep = statistics.mean(sleep_hours) if sleep_hours else 7
    # Infer sleep midpoint from recorded_at timestamps
    recorded_hours = []
    for d in sleep_data:
        ts = d.get("recorded_at", "")
        if ts:
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                recorded_hours.append(dt.hour)
            except (ValueError, TypeError):
                pass

    # Determine chronotype based on sleep logging time and duration
    avg_record_hour = statistics.mean(recorded_hours) if recorded_hours else 8

    if avg_sleep >= 7.5 and avg_record_hour < 7:
        chronotype = "lion"  # Early bird
        description = "You're a Lion (Early Chronotype). You naturally wake early and peak in the morning."
        peak_hours = "6:00 AM - 11:00 AM"
        wind_down = "8:00 PM - 9:30 PM"
    elif avg_record_hour > 10:
        chronotype = "wolf"  # Night owl
        description = "You're a Wolf (Late Chronotype). You come alive in the evening and peak later."
        peak_hours = "12:00 PM - 4:00 PM and 6:00 PM - midnight"
        wind_down = "11:00 PM - 12:30 AM"
    elif avg_sleep < 6.5:
        chronotype = "dolphin"  # Light sleeper
        description = "You're a Dolphin (Irregular Chronotype). You sleep lightly and may have variable patterns."
        peak_hours = "10:00 AM - 2:00 PM"
        wind_down = "10:30 PM - 11:30 PM"
    else:
        chronotype = "bear"  # Middle
        description = "You're a Bear (Standard Chronotype). You follow the solar cycle and peak mid-morning."
        peak_hours = "10:00 AM - 2:00 PM"
        wind_down = "10:00 PM - 11:00 PM"

    return {
        "chronotype": chronotype,
        "description": description,
        "confidence": min(len(sleep_data) / 14, 1.0),
        "peak_performance_hours": peak_hours,
        "ideal_wind_down": wind_down,
        "average_sleep": round(avg_sleep, 1),
        "data_points": len(sleep_data),
        "recommendations": _chronotype_recommendations(chronotype),
    }


# ============================================================================
# 5. SOCIAL JET LAG CALCULATOR
# ============================================================================

@router.get("/social-jetlag")
async def calculate_social_jetlag(user_id: str = "demo") -> dict:
    """Calculate social jet lag (difference between weekday/weekend sleep patterns)."""
    user_id = _resolve_user_id(user_id)
    sleep_data = get_wellness_data(user_id, category="body", metric="sleep", limit=14)

    if len(sleep_data) < 5:
        return {
            "social_jetlag_hours": 0,
            "severity": "unknown",
            "message": "Need at least 5 days of sleep data. Keep logging!",
            "weekday_avg": None,
            "weekend_avg": None,
        }

    weekday_hours = []
    weekend_hours = []

    for d in sleep_data:
        ts = d.get("recorded_at", "")
        hours = d.get("value", {}).get("hours")
        if not ts or not hours:
            continue
        try:
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            if dt.weekday() < 5:  # Mon-Fri
                weekday_hours.append(hours)
            else:
                weekend_hours.append(hours)
        except (ValueError, TypeError):
            pass

    if not weekday_hours or not weekend_hours:
        return {"social_jetlag_hours": 0, "severity": "unknown", "message": "Need both weekday and weekend data."}

    weekday_avg = statistics.mean(weekday_hours)
    weekend_avg = statistics.mean(weekend_hours)
    jetlag = abs(weekend_avg - weekday_avg)

    # Severity based on research (Wittmann et al., 2006)
    if jetlag < 0.5:
        severity = "minimal"
        impact = "Your sleep schedule is very consistent. Great for circadian health!"
    elif jetlag < 1.0:
        severity = "mild"
        impact = "Slight difference between weekdays and weekends. Monitor but not concerning."
    elif jetlag < 2.0:
        severity = "moderate"
        impact = "Associated with increased BMI and decreased wellbeing in research. Try keeping weekends closer to weekday times."
    else:
        severity = "significant"
        impact = "Research links this level to metabolic issues, mood disorders, and cardiovascular risk. Gradual alignment recommended."

    return {
        "social_jetlag_hours": round(jetlag, 1),
        "severity": severity,
        "impact": impact,
        "weekday_avg_sleep": round(weekday_avg, 1),
        "weekend_avg_sleep": round(weekend_avg, 1),
        "difference_direction": "sleep more on weekends" if weekend_avg > weekday_avg else "sleep more on weekdays",
        "recommendation": f"Try to keep your weekend sleep within 30 minutes of your weekday schedule ({weekday_avg:.1f}h).",
    }


# ============================================================================
# 6. BODY BATTERY / ALLOSTATIC LOAD ESTIMATION
# ============================================================================

@router.get("/body-battery")
async def get_body_battery(user_id: str = "demo") -> dict:
    """Estimate body battery (recovery capacity) based on available metrics."""
    user_id = _resolve_user_id(user_id)

    body_data = get_wellness_data(user_id, category="body", limit=20)
    self_data = get_wellness_data(user_id, category="self_report", limit=10)
    baselines = get_baselines(user_id)
    baselines_map = {b["metric"]: b for b in baselines}

    # Factors that CHARGE the battery
    charge = 0
    charge_factors = []

    # Good sleep
    sleep_vals = [d.get("value", {}).get("hours", 0) for d in body_data if d.get("metric") == "sleep"]
    if sleep_vals:
        latest_sleep = sleep_vals[0]
        if latest_sleep >= 7:
            charge += 30
            charge_factors.append({"factor": "Good sleep", "impact": "+30", "detail": f"{latest_sleep:.1f}h"})
        elif latest_sleep >= 6:
            charge += 15
            charge_factors.append({"factor": "Moderate sleep", "impact": "+15", "detail": f"{latest_sleep:.1f}h"})

    # Low stress
    stress_vals = [d.get("value", {}).get("score", 5) for d in self_data if d.get("metric") == "stress"]
    if stress_vals:
        latest_stress = stress_vals[0]
        if latest_stress <= 3:
            charge += 20
            charge_factors.append({"factor": "Low stress", "impact": "+20", "detail": f"{latest_stress}/10"})
        elif latest_stress <= 5:
            charge += 10
            charge_factors.append({"factor": "Moderate stress", "impact": "+10", "detail": f"{latest_stress}/10"})

    # Good mood
    mood_vals = [d.get("value", {}).get("score", 5) for d in self_data if d.get("metric") == "mood"]
    if mood_vals and mood_vals[0] >= 7:
        charge += 15
        charge_factors.append({"factor": "Positive mood", "impact": "+15", "detail": f"{mood_vals[0]}/10"})

    # Activity (moderate is good)
    step_vals = [d.get("value", {}).get("count", 0) for d in body_data if d.get("metric") == "steps"]
    if step_vals and 5000 <= step_vals[0] <= 12000:
        charge += 15
        charge_factors.append({"factor": "Healthy activity", "impact": "+15", "detail": f"{step_vals[0]} steps"})

    # Factors that DRAIN the battery
    drain = 0
    drain_factors = []

    if sleep_vals and sleep_vals[0] < 5.5:
        drain += 25
        drain_factors.append({"factor": "Poor sleep", "impact": "-25", "detail": f"Only {sleep_vals[0]:.1f}h"})

    if stress_vals and stress_vals[0] >= 7:
        drain += 20
        drain_factors.append({"factor": "High stress", "impact": "-20", "detail": f"{stress_vals[0]}/10"})

    if step_vals and step_vals[0] > 15000:
        drain += 10
        drain_factors.append({"factor": "Overexertion", "impact": "-10", "detail": f"{step_vals[0]} steps"})

    # Baseline deviation drain
    hr_baseline = baselines_map.get("heart_rate", {}).get("baseline_mean")
    hr_vals = [d.get("value", {}).get("bpm", 0) for d in body_data if d.get("metric") == "heart_rate"]
    if hr_baseline and hr_vals and hr_vals[0] > hr_baseline * 1.15:
        drain += 15
        drain_factors.append({"factor": "Elevated heart rate", "impact": "-15", "detail": f"{hr_vals[0]} vs baseline {hr_baseline:.0f}"})

    # Calculate battery (start at 50, add charge, subtract drain, clamp 0-100)
    battery = 50 + charge - drain
    battery = round(min(max(battery, 5), 100))

    return {
        "battery_level": battery,
        "status": "charging" if charge > drain else "draining" if drain > charge else "stable",
        "charge_factors": charge_factors,
        "drain_factors": drain_factors,
        "recommendation": _battery_recommendation(battery),
        "allostatic_note": "Body battery estimates your capacity for stress. Sustained low levels may indicate allostatic overload. Prioritize recovery.",
    }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _fallback_extraction(text: str) -> dict:
    """Simple keyword-based extraction when AI is unavailable."""
    import re
    metrics: dict = {}
    t = text.lower()

    # Sleep
    sleep_match = re.search(r"(\d+\.?\d*)\s*(?:hours?|hrs?)\s*(?:of\s*)?sleep", t)
    if sleep_match:
        metrics["sleep_hours"] = float(sleep_match.group(1))

    # Steps
    step_match = re.search(r"(\d+[,.]?\d*)\s*(?:k\s*)?steps?", t)
    if step_match:
        val = step_match.group(1).replace(",", "")
        metrics["steps"] = int(float(val) * 1000) if "k" in t[step_match.start():step_match.end()+2] else int(val)

    # Mood inference
    if any(w in t for w in ["great", "amazing", "wonderful", "fantastic"]):
        metrics["mood"] = 9
    elif any(w in t for w in ["good", "fine", "okay", "decent"]):
        metrics["mood"] = 7
    elif any(w in t for w in ["bad", "terrible", "awful"]):
        metrics["mood"] = 3
    elif any(w in t for w in ["stressed", "anxious"]):
        metrics["stress"] = 7

    return metrics


def _generate_checkin_response(metrics: dict, name: str) -> str:
    """Generate Bloomie's response to extracted metrics."""
    parts = []
    if metrics.get("sleep_hours"):
        h = metrics["sleep_hours"]
        parts.append(f"{'Great' if h >= 7 else 'Noted'} - {h}h sleep {'🌙✨' if h >= 7 else '🌙'}")
    if metrics.get("mood"):
        m = metrics["mood"]
        parts.append(f"Mood at {m}/10 {'🌸' if m >= 7 else '🌿'}")
    if metrics.get("stress") and metrics["stress"] >= 6:
        parts.append("I see some stress. Let's work on that together 🧘")
    if not parts:
        parts.append("Got it! I've recorded your check-in 🌱")
    return f"Thanks, {name}! " + " | ".join(parts)


def _calc_sleep_score(body_data: list, baselines: dict) -> float:
    vals = [d.get("value", {}).get("hours", 0) for d in body_data if d.get("metric") == "sleep"]
    if not vals:
        return 50
    avg = statistics.mean(vals[:7])
    baseline = baselines.get("sleep", {}).get("baseline_mean", 7)
    ratio = avg / max(baseline, 1)
    return min(ratio * 85, 100)


def _calc_activity_score(body_data: list, baselines: dict) -> float:
    vals = [d.get("value", {}).get("count", 0) for d in body_data if d.get("metric") == "steps"]
    if not vals:
        return 40
    avg = statistics.mean(vals[:7])
    target = baselines.get("steps", {}).get("baseline_mean", 8000)
    return min((avg / max(target, 1)) * 80, 100)


def _calc_hydration_score(habit_data: list) -> float:
    vals = [d.get("value", {}).get("glasses", 0) for d in habit_data if d.get("metric") == "hydration"]
    if not vals:
        return 40
    avg = statistics.mean(vals[:7])
    return min((avg / 8) * 100, 100)


def _calc_mood_score(self_data: list) -> float:
    vals = [d.get("value", {}).get("score", 5) for d in self_data if d.get("metric") == "mood"]
    if not vals:
        return 60
    avg = statistics.mean(vals[:7])
    return avg * 10  # 1-10 -> 10-100


def _calc_recovery_score(body_data: list, baselines: dict) -> float:
    hrv_vals = [d.get("value", {}).get("bpm", 0) for d in body_data if d.get("metric") == "hrv"]
    if not hrv_vals:
        return 55
    avg = statistics.mean(hrv_vals[:5])
    baseline = baselines.get("hrv", {}).get("baseline_mean", 50)
    ratio = avg / max(baseline, 1)
    return min(ratio * 75, 100)


def _calc_consistency_score(body_data: list, habit_data: list, self_data: list) -> float:
    # Count unique days with any data in last 7 days
    now = datetime.now(timezone.utc)
    days_with_data = set()
    for d in body_data + habit_data + self_data:
        ts = d.get("recorded_at", "")[:10]
        if ts:
            try:
                dt = datetime.fromisoformat(ts)
                if (now - dt.replace(tzinfo=timezone.utc)).days <= 7:
                    days_with_data.add(ts)
            except (ValueError, TypeError):
                pass
    return min((len(days_with_data) / 7) * 100, 100)


def _score_label(score: float) -> str:
    if score >= 80: return "Excellent"
    if score >= 60: return "Good"
    if score >= 40: return "Fair"
    return "Needs attention"


def _interpret_score(score: int) -> str:
    if score >= 85: return "Your wellness is thriving! Keep up the excellent consistency. 🌟"
    if score >= 70: return "You're doing well. A few small improvements could make it great. 🌱"
    if score >= 50: return "Room for improvement. Focus on sleep and hydration first. 💧"
    return "Your body needs more care. Start with one small change today. 🌸"


def _gen_morning_plan(has_sleep: bool, energy: int) -> list:
    plan = []
    if not has_sleep:
        plan.append({"time": "7:00 AM", "action": "Log your sleep", "emoji": "😴", "duration": "1 min", "type": "log"})
    plan.append({"time": "7:05 AM", "action": "Glass of water", "emoji": "💧", "duration": "1 min", "type": "habit"})
    if energy >= 6:
        plan.append({"time": "7:30 AM", "action": "Morning stretch or walk", "emoji": "🧘", "duration": "10 min", "type": "exercise"})
    else:
        plan.append({"time": "7:30 AM", "action": "Gentle stretching in bed", "emoji": "🛏️", "duration": "5 min", "type": "recovery"})
    plan.append({"time": "8:00 AM", "action": "Mindful breakfast (no screens)", "emoji": "🍳", "duration": "15 min", "type": "nutrition"})
    plan.append({"time": "9:00 AM", "action": "Set 3 intentions for today", "emoji": "📝", "duration": "3 min", "type": "mindfulness"})
    return plan


def _gen_afternoon_plan(has_steps: bool, has_water: bool, has_exercise: bool, mood: int) -> list:
    plan = []
    if not has_water:
        plan.append({"time": "12:00 PM", "action": "Hydration check (aim for 4 glasses by now)", "emoji": "💧", "duration": "1 min", "type": "habit"})
    plan.append({"time": "12:30 PM", "action": "Balanced lunch with protein + vegetables", "emoji": "🥗", "duration": "20 min", "type": "nutrition"})
    if not has_exercise:
        plan.append({"time": "2:00 PM", "action": "10-minute walk (boosts afternoon energy)", "emoji": "🚶", "duration": "10 min", "type": "exercise"})
    if mood < 6:
        plan.append({"time": "3:00 PM", "action": "3-minute breathing exercise", "emoji": "🌬️", "duration": "3 min", "type": "mindfulness"})
    plan.append({"time": "4:00 PM", "action": "Caffeine cutoff (no coffee after this)", "emoji": "☕", "duration": "0 min", "type": "awareness"})
    return plan


def _gen_evening_plan(has_mindfulness: bool, mood: int) -> list:
    plan = []
    plan.append({"time": "6:00 PM", "action": "Light movement or evening walk", "emoji": "🌅", "duration": "15 min", "type": "exercise"})
    plan.append({"time": "7:30 PM", "action": "Dinner (finish eating 2-3h before bed)", "emoji": "🍽️", "duration": "30 min", "type": "nutrition"})
    if not has_mindfulness:
        plan.append({"time": "9:00 PM", "action": "Wind-down: journal or gratitude", "emoji": "📖", "duration": "10 min", "type": "mindfulness"})
    plan.append({"time": "9:30 PM", "action": "Screen-off time (blue light affects sleep)", "emoji": "📵", "duration": "0 min", "type": "awareness"})
    plan.append({"time": "10:00 PM", "action": "Bedtime routine (dim lights, relax)", "emoji": "🌙", "duration": "30 min", "type": "recovery"})
    return plan


def _chronotype_recommendations(chronotype: str) -> list:
    recs = {
        "lion": [
            "Schedule important tasks before 11 AM when your focus peaks",
            "Avoid late-night social events that push your bedtime",
            "Exercise in the morning for maximum benefit",
            "Wind down by 9 PM for optimal sleep onset",
        ],
        "wolf": [
            "Don't force early morning productivity - your brain peaks later",
            "Schedule creative work for evening hours",
            "Use morning light exposure to gently shift your rhythm",
            "Your best exercise time is late afternoon/evening",
        ],
        "bear": [
            "You align well with standard 9-5 schedules",
            "Mid-morning (10 AM) is your peak focus time",
            "Avoid post-lunch drowsiness with a short walk",
            "Maintain consistent sleep/wake times for best results",
        ],
        "dolphin": [
            "Focus on sleep hygiene - your body needs extra help settling",
            "Avoid stimulants after noon",
            "Short naps (20 min max) can help without disrupting night sleep",
            "Cognitive behavioral techniques may help with sleep onset",
        ],
    }
    return recs.get(chronotype, [])


def _battery_recommendation(battery: int) -> str:
    if battery >= 80:
        return "Your body battery is well-charged! Great day for challenges and exercise. ⚡"
    elif battery >= 60:
        return "Good charge level. Balance activity with adequate rest today. 🌱"
    elif battery >= 40:
        return "Battery is moderate. Prioritize recovery: sleep, hydration, gentle movement. 🌿"
    else:
        return "Battery is low. Your body needs rest and nourishment. Be gentle with yourself today. 💜"
