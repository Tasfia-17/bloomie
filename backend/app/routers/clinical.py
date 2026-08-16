"""Clinical/Professional dashboard router - for caregivers and clinicians."""

import json
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter
from langchain_core.messages import HumanMessage

from ..services.supabase_client import (
    get_wellness_data,
    get_baselines,
    get_assessments,
    get_profile,
)
from ..services.openrouter_client import get_llm

router = APIRouter(prefix="/api/clinical", tags=["clinical"])


@router.get("/timeline")
async def get_patient_timeline(user_id: str = "demo", days: int = 7) -> dict:
    """Get patient health timeline for clinical review."""
    try:
        body_data = get_wellness_data(user_id, category="body", limit=100)
        habit_data = get_wellness_data(user_id, category="habits", limit=50)
        assessments = get_assessments(user_id, limit=days)
        baselines = get_baselines(user_id)
        profile = get_profile(user_id)
    except Exception:
        body_data = []
        habit_data = []
        assessments = []
        baselines = []
        profile = None

    # Group data by day
    timeline = _build_timeline(body_data, habit_data, days)

    # Flag anomalies
    anomalies = _detect_anomalies(timeline, baselines)

    # Generate AI summary
    ai_summary = await _generate_clinical_summary(timeline, anomalies, baselines)

    return {
        "patient": {
            "name": profile.get("name", "Patient") if profile else "Patient",
            "id": user_id,
        },
        "timeline": timeline,
        "anomalies": anomalies,
        "baselines": _format_baselines(baselines),
        "ai_summary": ai_summary,
        "risk_level": _overall_risk(anomalies),
        "recent_assessments": [
            {
                "date": a.get("created_at", "")[:10],
                "score": a.get("overall_score", 0.8),
                "deviation_level": a.get("deviation_level", "none"),
                "narrative": a.get("narrative", ""),
            }
            for a in assessments[:7]
        ],
    }


@router.get("/alerts")
async def get_clinical_alerts(user_id: str = "demo") -> dict:
    """Get active clinical alerts requiring attention."""
    try:
        assessments = get_assessments(user_id, limit=3)
        baselines = get_baselines(user_id)
        body_data = get_wellness_data(user_id, category="body", limit=20)
    except Exception:
        return {"alerts": [], "alert_level": "none"}

    alerts = []

    # Check latest assessment
    if assessments:
        latest = assessments[0]
        if latest.get("deviation_level") == "significant":
            alerts.append({
                "level": "high",
                "title": "Significant wellness deviation",
                "body": latest.get("narrative", "Multiple wellness signals deviated from baseline."),
                "time": latest.get("created_at", ""),
                "metrics": [d.get("metric", "") for d in latest.get("deviations", [])],
            })
        elif latest.get("deviation_level") == "moderate":
            alerts.append({
                "level": "moderate",
                "title": "Moderate deviation detected",
                "body": latest.get("narrative", "Some signals are different from usual."),
                "time": latest.get("created_at", ""),
                "metrics": [d.get("metric", "") for d in latest.get("deviations", [])],
            })

    # Check specific vital sign thresholds
    for d in body_data[:5]:
        metric = d.get("metric", "")
        value = d.get("value", {})

        if metric == "heart_rate" and value.get("bpm", 70) > 100:
            alerts.append({
                "level": "moderate",
                "title": "Elevated heart rate",
                "body": f"Resting heart rate: {value.get('bpm')} bpm",
                "time": d.get("recorded_at", ""),
                "metrics": ["heart_rate"],
            })

    alert_level = "none"
    if any(a["level"] == "high" for a in alerts):
        alert_level = "high"
    elif any(a["level"] == "moderate" for a in alerts):
        alert_level = "moderate"

    return {
        "alerts": alerts,
        "alert_level": alert_level,
        "total_alerts": len(alerts),
    }


def _build_timeline(body_data: list[dict], habit_data: list[dict], days: int) -> list[dict]:
    """Build daily timeline from raw data."""
    now = datetime.now(timezone.utc)
    timeline = []

    for i in range(days):
        day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        day_label = (now - timedelta(days=i)).strftime("%b %d")

        # Filter data for this day
        day_body = [d for d in body_data if d.get("recorded_at", "").startswith(day)]
        day_habits = [d for d in habit_data if d.get("recorded_at", "").startswith(day)]

        # Extract key metrics
        hr = next((d.get("value", {}).get("bpm") for d in day_body if d.get("metric") == "heart_rate"), None)
        sleep = next((d.get("value", {}).get("hours") for d in day_body if d.get("metric") == "sleep"), None)
        steps = next((d.get("value", {}).get("count") for d in day_body if d.get("metric") == "steps"), None)
        hydration = next((d.get("value", {}).get("glasses") for d in day_habits if d.get("metric") == "hydration"), None)

        timeline.append({
            "date": day,
            "label": day_label,
            "metrics": {
                "heart_rate": hr,
                "sleep": sleep,
                "steps": steps,
                "hydration": hydration,
            },
            "data_points": len(day_body) + len(day_habits),
        })

    return list(reversed(timeline))


def _detect_anomalies(timeline: list[dict], baselines: list[dict]) -> list[dict]:
    """Detect anomalies against baselines."""
    anomalies = []
    baselines_map = {b["metric"]: b for b in baselines}

    for day in timeline:
        for metric, value in day["metrics"].items():
            if value is None:
                continue
            baseline = baselines_map.get(metric)
            if not baseline:
                continue

            mean = baseline.get("baseline_mean", 0)
            stdev = baseline.get("baseline_stdev", 1)

            if stdev > 0:
                z_score = (value - mean) / stdev
                if abs(z_score) >= 2.0:
                    anomalies.append({
                        "date": day["date"],
                        "metric": metric,
                        "value": value,
                        "baseline_mean": mean,
                        "z_score": round(z_score, 1),
                        "severity": "high" if abs(z_score) >= 3 else "moderate",
                    })

    return anomalies


def _format_baselines(baselines: list[dict]) -> list[dict]:
    """Format baselines for display."""
    return [
        {
            "metric": b.get("metric", ""),
            "mean": b.get("baseline_mean"),
            "range": f"{b.get('baseline_min', 0):.1f} - {b.get('baseline_max', 0):.1f}",
            "samples": b.get("sample_count", 0),
        }
        for b in baselines
    ]


def _overall_risk(anomalies: list[dict]) -> str:
    """Determine overall risk from anomalies."""
    if any(a["severity"] == "high" for a in anomalies):
        return "high"
    elif len(anomalies) >= 3:
        return "moderate"
    elif anomalies:
        return "low"
    return "none"


async def _generate_clinical_summary(timeline: list[dict], anomalies: list[dict], baselines: list[dict]) -> str:
    """Generate AI clinical summary."""
    if not timeline:
        return "Insufficient data for clinical summary."

    try:
        llm = get_llm()
        prompt = f"""Summarize the following patient wellness data for a clinician in 2-3 concise sentences.

Timeline (last 7 days): {json.dumps(timeline[-7:], default=str)}
Anomalies detected: {json.dumps(anomalies[:5], default=str)}
Baselines: {json.dumps([{{"metric": b.get("metric"), "mean": b.get("baseline_mean")}} for b in baselines[:8]], default=str)}

Rules:
- Be factual and concise
- Note any patterns (declining sleep, elevated HR, etc.)
- Do not diagnose
- Use clinical language appropriate for a healthcare professional"""

        response = llm.invoke([HumanMessage(content=prompt)])
        return response.content.strip()
    except Exception:
        if anomalies:
            return f"{len(anomalies)} anomalies detected in the past week. Review timeline for details."
        return "No significant deviations from baseline in the past week."
