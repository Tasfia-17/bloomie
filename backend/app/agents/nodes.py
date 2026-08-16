"""Bloomie AI pipeline nodes - personal baseline engine, trend detection, risk engine."""

import json
import statistics
from datetime import datetime, timedelta, timezone

from langchain_core.messages import HumanMessage

from .state import BloomieState
from .prompts import TREND_ANALYSIS_PROMPT, NARRATIVE_PROMPT, GARDEN_STATE_PROMPT
from ..services.openrouter_client import get_llm, get_creative_llm
from ..services.supabase_client import get_wellness_data, get_baselines, upsert_baseline


# ---------------------------------------------------------------------------
# Node 1: normalize_data (pure Python - builds current picture)
# ---------------------------------------------------------------------------

def normalize_data(state: BloomieState) -> dict:
    """Fetch and normalize recent wellness data into comparable metrics."""
    user_id = state["user_id"]

    now = datetime.now(timezone.utc)
    two_days_ago = now - timedelta(days=2)
    seven_days_ago = now - timedelta(days=7)

    # Fetch recent data
    recent_data = get_wellness_data(user_id, limit=200)

    # Filter to last 7 days
    recent_7d = []
    for r in recent_data:
        recorded = r.get("recorded_at", "")
        if isinstance(recorded, str):
            try:
                dt = datetime.fromisoformat(recorded.replace("Z", "+00:00"))
                if dt >= seven_days_ago:
                    recent_7d.append(r)
            except (ValueError, TypeError):
                pass

    # Build current values (last 48 hours)
    current_values: dict = {}
    recent_48h = [r for r in recent_7d if _parse_dt(r.get("recorded_at", "")) >= two_days_ago]

    # Extract key metrics
    metrics_data: dict[str, list[float]] = {}

    for r in recent_7d:
        metric = r.get("metric", "")
        value = r.get("value", {})

        numeric_val = _extract_numeric(metric, value)
        if numeric_val is not None:
            metrics_data.setdefault(metric, []).append(numeric_val)

    # Current values = most recent value for each metric
    for r in recent_48h:
        metric = r.get("metric", "")
        value = r.get("value", {})
        numeric_val = _extract_numeric(metric, value)
        if numeric_val is not None and metric not in current_values:
            current_values[metric] = numeric_val

    return {
        "raw_data": recent_7d,
        "current_values": current_values,
    }


# ---------------------------------------------------------------------------
# Node 2: compute_baselines (pure Python - personal baseline engine)
# ---------------------------------------------------------------------------

def compute_baselines(state: BloomieState) -> dict:
    """Compute personal baselines from 7-day rolling data."""
    user_id = state["user_id"]
    raw_data = state["raw_data"]

    # Group by metric
    metrics_data: dict[str, list[float]] = {}
    for r in raw_data:
        metric = r.get("metric", "")
        value = r.get("value", {})
        numeric_val = _extract_numeric(metric, value)
        if numeric_val is not None:
            metrics_data.setdefault(metric, []).append(numeric_val)

    # Compute baselines
    baselines: dict = {}
    for metric, values in metrics_data.items():
        if len(values) >= 2:
            mean = statistics.mean(values)
            stdev = statistics.stdev(values) if len(values) > 2 else mean * 0.1
            baselines[metric] = {
                "baseline_mean": round(mean, 2),
                "baseline_stdev": round(stdev, 2),
                "baseline_min": round(min(values), 2),
                "baseline_max": round(max(values), 2),
                "sample_count": len(values),
            }
            # Persist to database
            try:
                upsert_baseline(user_id, metric, baselines[metric])
            except Exception:
                pass
        elif len(values) == 1:
            baselines[metric] = {
                "baseline_mean": values[0],
                "baseline_stdev": values[0] * 0.15,
                "baseline_min": values[0],
                "baseline_max": values[0],
                "sample_count": 1,
            }

    # If we don't have enough data, load existing baselines
    if not baselines:
        stored = get_baselines(user_id)
        for b in stored:
            baselines[b["metric"]] = {
                "baseline_mean": b.get("baseline_mean", 0),
                "baseline_stdev": b.get("baseline_stdev", 0),
                "baseline_min": b.get("baseline_min", 0),
                "baseline_max": b.get("baseline_max", 0),
                "sample_count": b.get("sample_count", 0),
            }

    return {"baselines": baselines}


# ---------------------------------------------------------------------------
# Node 3: detect_deviations (pure Python - finds meaningful changes)
# ---------------------------------------------------------------------------

def detect_deviations(state: BloomieState) -> dict:
    """Detect meaningful deviations from personal baselines."""
    current_values = state["current_values"]
    baselines = state["baselines"]
    deviations: list[dict] = []

    for metric, current in current_values.items():
        baseline = baselines.get(metric)
        if not baseline or baseline.get("sample_count", 0) < 2:
            continue

        mean = baseline["baseline_mean"]
        stdev = baseline["baseline_stdev"]

        if stdev == 0:
            continue

        # Calculate z-score
        z_score = (current - mean) / stdev

        if abs(z_score) >= 1.5:
            direction = "up" if z_score > 0 else "down"
            magnitude = min(abs(z_score) / 3.0, 1.0)  # Normalize to 0-1

            description = _describe_deviation(metric, current, mean, direction, magnitude)

            deviations.append({
                "metric": metric,
                "direction": direction,
                "magnitude": round(magnitude, 2),
                "z_score": round(z_score, 2),
                "current": current,
                "baseline_mean": mean,
                "description": description,
            })

    # Sort by magnitude (most significant first)
    deviations.sort(key=lambda d: d["magnitude"], reverse=True)

    return {"deviations": deviations}


# ---------------------------------------------------------------------------
# Node 4: assess_risk (hybrid: deterministic + optional AI)
# ---------------------------------------------------------------------------

def assess_risk(state: BloomieState) -> dict:
    """Determine risk level and generate trend signals."""
    deviations = state["deviations"]
    current_values = state["current_values"]
    baselines = state["baselines"]

    # Deterministic risk scoring
    risk_score = 0.0
    risk_factors: list[str] = []

    # Count significant deviations
    significant_devs = [d for d in deviations if d["magnitude"] >= 0.5]
    moderate_devs = [d for d in deviations if 0.3 <= d["magnitude"] < 0.5]

    if len(significant_devs) >= 3:
        risk_score += 40
        risk_factors.append(f"{len(significant_devs)} significant deviations from baseline")
    elif len(significant_devs) >= 1:
        risk_score += 20
        risk_factors.append(f"{len(significant_devs)} significant deviation(s)")

    if len(moderate_devs) >= 2:
        risk_score += 15
        risk_factors.append(f"{len(moderate_devs)} moderate deviations")

    # Check specific critical metrics
    hr = current_values.get("heart_rate")
    resting_hr_baseline = baselines.get("resting_hr", {}).get("baseline_mean")
    if hr and resting_hr_baseline:
        if hr > resting_hr_baseline * 1.3:
            risk_score += 20
            risk_factors.append(f"Heart rate significantly elevated ({hr} vs baseline {resting_hr_baseline:.0f})")

    # Sleep check
    sleep = current_values.get("sleep")
    sleep_baseline = baselines.get("sleep", {}).get("baseline_mean")
    if sleep and sleep_baseline:
        if sleep < sleep_baseline * 0.6:
            risk_score += 15
            risk_factors.append(f"Sleep significantly reduced ({sleep:.1f}h vs baseline {sleep_baseline:.1f}h)")

    # Activity check
    steps = current_values.get("steps")
    steps_baseline = baselines.get("steps", {}).get("baseline_mean")
    if steps and steps_baseline:
        if steps < steps_baseline * 0.3:
            risk_score += 10
            risk_factors.append(f"Activity very low ({steps} steps vs baseline {steps_baseline:.0f})")

    risk_score = min(risk_score, 100.0)

    # Determine risk level
    if risk_score >= 60:
        risk_level = "high"
    elif risk_score >= 30:
        risk_level = "moderate"
    elif risk_score >= 10:
        risk_level = "low"
    else:
        risk_level = "none"

    # Determine escalation
    escalation = None
    if risk_level == "high":
        escalation = "caregiver"
    elif risk_level == "moderate":
        escalation = "user_prompt"

    # Try AI trend analysis for richer signals
    trend_signals: list[dict] = []
    try:
        llm = get_llm()
        prompt = TREND_ANALYSIS_PROMPT.format(
            baselines=json.dumps(baselines, indent=2),
            current_values=json.dumps(current_values, indent=2),
            deviations=json.dumps(deviations, indent=2),
        )
        response = llm.invoke([HumanMessage(content=prompt)])
        raw = response.content.strip()
        json_str = _extract_json(raw)
        result = json.loads(json_str)
        trend_signals = result.get("trend_signals", [])
    except Exception:
        # Build trend signals from deviations
        for d in deviations[:5]:
            trend_signals.append({
                "metric": d["metric"],
                "direction": d["direction"],
                "magnitude": d["magnitude"],
                "concern_level": "significant" if d["magnitude"] >= 0.5 else "mild",
                "description": d["description"],
            })

    return {
        "risk_level": risk_level,
        "trend_signals": trend_signals,
        "escalation": escalation,
    }


# ---------------------------------------------------------------------------
# Node 5: generate_narrative (AI or fallback)
# ---------------------------------------------------------------------------

def generate_narrative(state: BloomieState) -> dict:
    """Generate Bloomie's narrative and garden state."""
    user_id = state["user_id"]
    risk_level = state["risk_level"]
    deviations = state["deviations"]
    current_values = state["current_values"]
    baselines = state["baselines"]

    # Compute overall score (inverse of risk)
    risk_to_score = {"none": 0.9, "low": 0.75, "moderate": 0.55, "high": 0.35}
    overall_score = risk_to_score.get(risk_level, 0.8)

    # Build observations
    observations = [d["description"] for d in deviations[:3]]
    if not observations:
        observations = ["Everything looks close to your usual patterns today."]

    # Time of day
    now = datetime.now(timezone.utc)
    hour = now.hour
    if hour < 12:
        time_of_day = "morning"
    elif hour < 17:
        time_of_day = "afternoon"
    else:
        time_of_day = "evening"

    # Try AI narrative
    try:
        llm = get_creative_llm()
        prompt = NARRATIVE_PROMPT.format(
            user_name="friend",
            risk_level=risk_level,
            observations="; ".join(observations),
            time_of_day=time_of_day,
        )
        response = llm.invoke([HumanMessage(content=prompt)])
        narrative = response.content.strip()
    except Exception:
        # Fallback narratives
        if risk_level == "none":
            narrative = "Your garden is thriving today! Everything looks wonderful. 🌱"
        elif risk_level == "low":
            narrative = "Things look mostly good today. A few small differences from your usual, but nothing to worry about."
        elif risk_level == "moderate":
            narrative = "Several things look a little different from your usual pattern today. Want to take it easy?"
        else:
            narrative = "Your body is telling me it needs a gentler day. That's okay. Let's take care of you."

    # Generate garden state
    garden_state = _compute_garden_state(current_values, baselines, overall_score)

    # Generate recommendations
    recommendations = _generate_recommendations(deviations, current_values, risk_level)

    # Generate insights
    insights = [d["description"] for d in deviations]

    return {
        "narrative": narrative,
        "garden_state": garden_state,
        "recommendations": recommendations,
        "insights": insights,
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_numeric(metric: str, value: dict) -> float | None:
    """Extract a single numeric value from a metric reading."""
    if isinstance(value, (int, float)):
        return float(value)

    # Common patterns
    if "value" in value:
        v = value["value"]
        if isinstance(v, (int, float)):
            return float(v)

    if metric == "blood_pressure" and "systolic" in value:
        return float(value["systolic"])
    if metric in ("heart_rate", "resting_hr", "hrv") and "bpm" in value:
        return float(value["bpm"])
    if metric == "sleep" and "hours" in value:
        return float(value["hours"])
    if metric == "steps" and "count" in value:
        return float(value["count"])
    if metric == "hydration" and "glasses" in value:
        return float(value["glasses"])
    if metric == "activity_minutes" and "minutes" in value:
        return float(value["minutes"])
    if metric == "weight" and "kg" in value:
        return float(value["kg"])
    if metric in ("mood", "energy", "stress") and "score" in value:
        return float(value["score"])
    if metric == "caffeine" and "mg" in value:
        return float(value["mg"])
    if metric == "spo2" and "percent" in value:
        return float(value["percent"])

    # Try first numeric value
    for v in value.values():
        if isinstance(v, (int, float)):
            return float(v)

    return None


def _parse_dt(ts: str) -> datetime:
    """Parse a timestamp string."""
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except (ValueError, TypeError, AttributeError):
        return datetime.min.replace(tzinfo=timezone.utc)


def _describe_deviation(metric: str, current: float, mean: float, direction: str, magnitude: float) -> str:
    """Generate human-readable deviation description."""
    metric_labels = {
        "heart_rate": "Heart rate",
        "resting_hr": "Resting heart rate",
        "hrv": "Heart rate variability",
        "blood_pressure": "Blood pressure",
        "steps": "Steps",
        "sleep": "Sleep",
        "hydration": "Hydration",
        "activity_minutes": "Activity",
        "mood": "Mood",
        "energy": "Energy",
        "stress": "Stress",
        "caffeine": "Caffeine intake",
        "weight": "Weight",
    }
    label = metric_labels.get(metric, metric.replace("_", " ").title())
    arrow = "↑" if direction == "up" else "↓"
    diff = abs(current - mean)

    if metric == "sleep":
        return f"{label} {arrow} ({current:.1f}h vs usual {mean:.1f}h)"
    elif metric == "steps":
        return f"{label} {arrow} ({current:.0f} vs usual {mean:.0f})"
    elif metric in ("mood", "energy", "stress"):
        return f"{label} {arrow} ({current:.1f}/10 vs usual {mean:.1f}/10)"
    else:
        return f"{label} {arrow} ({current:.1f} vs usual {mean:.1f})"


def _compute_garden_state(current_values: dict, baselines: dict, overall_score: float) -> dict:
    """Compute garden visual state from wellness data."""
    # Defaults
    garden = {
        "sky": "clear",
        "pond_level": 0.7,
        "tree_growth": overall_score * 0.8,
        "butterfly_count": 5,
        "bird_count": 3,
        "firefly_count": 0,
        "flower_bloom": overall_score,
        "rabbit_mood": "happy",
    }

    # Sky from sleep
    sleep = current_values.get("sleep")
    sleep_baseline = baselines.get("sleep", {}).get("baseline_mean")
    if sleep and sleep_baseline:
        ratio = sleep / sleep_baseline
        if ratio >= 0.9:
            garden["sky"] = "clear"
        elif ratio >= 0.7:
            garden["sky"] = "cloudy"
        else:
            garden["sky"] = "stormy"

    # Pond from hydration
    hydration = current_values.get("hydration")
    if hydration:
        garden["pond_level"] = min(hydration / 8.0, 1.0)  # 8 glasses = full

    # Butterflies from activity
    steps = current_values.get("steps")
    steps_baseline = baselines.get("steps", {}).get("baseline_mean", 7000)
    if steps:
        ratio = steps / max(steps_baseline, 1)
        garden["butterfly_count"] = int(min(ratio * 8, 15))

    # Birds from social
    social_score = current_values.get("social_checkins", 0)
    garden["bird_count"] = min(int(social_score) + 2, 10)

    # Fireflies from mindfulness
    mindfulness = current_values.get("mindfulness")
    if mindfulness:
        garden["firefly_count"] = min(int(mindfulness) * 4, 20)

    # Rabbit mood
    mood = current_values.get("mood")
    energy = current_values.get("energy")
    if mood and mood <= 3:
        garden["rabbit_mood"] = "sleepy"
    elif energy and energy >= 7:
        garden["rabbit_mood"] = "playful"
    elif overall_score >= 0.8:
        garden["rabbit_mood"] = "happy"
    else:
        garden["rabbit_mood"] = "cozy"

    return garden


def _generate_recommendations(deviations: list[dict], current_values: dict, risk_level: str) -> list[str]:
    """Generate personalized recommendations."""
    recs: list[str] = []

    for d in deviations[:3]:
        metric = d["metric"]
        direction = d["direction"]

        if metric == "sleep" and direction == "down":
            recs.append("Consider winding down earlier tonight — your body might appreciate extra rest.")
        elif metric == "steps" and direction == "down":
            recs.append("A tiny walk might do wonders. Even 5 minutes counts!")
        elif metric == "hydration" and direction == "down":
            recs.append("Your pond is looking a little low. Let's fill it up together! 💧")
        elif metric == "heart_rate" and direction == "up":
            recs.append("Your heart rate is a bit higher than usual. A few deep breaths might help.")
        elif metric == "stress" and direction == "up":
            recs.append("Stress seems higher today. A 3-minute reset could make a difference.")
        elif metric == "mood" and direction == "down":
            recs.append("Noticed your mood is a bit lower. Want to connect with someone in your Nest?")
        elif metric == "caffeine" and direction == "up":
            recs.append("Lots of caffeine today! You might want to stop before the afternoon for better sleep.")

    if not recs:
        if risk_level == "none":
            recs.append("You're doing great! Keep it up. 🌸")
        else:
            recs.append("Today might be a good day for a gentler routine.")

    return recs


def _extract_json(raw: str) -> str:
    """Extract JSON from a response that might have markdown fences."""
    if "```json" in raw:
        return raw.split("```json")[1].split("```")[0].strip()
    elif "```" in raw:
        return raw.split("```")[1].split("```")[0].strip()
    return raw
