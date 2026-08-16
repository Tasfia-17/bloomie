"""Wellness data ingestion and retrieval router."""

import time
from fastapi import APIRouter, HTTPException

from ..models.schemas import WellnessDataCreate, WellnessData, Assessment
from ..services.supabase_client import (
    create_wellness_data,
    get_wellness_data,
    get_latest_assessment,
    create_assessment,
)
from ..agents.graph import graph

router = APIRouter(prefix="/api/wellness", tags=["wellness"])

# Cooldown: run pipeline max once per 5 minutes per user
_last_pipeline_run: dict[str, float] = {}
PIPELINE_COOLDOWN_SECONDS = 300


@router.post("", response_model=Assessment)
async def post_wellness_data(data: WellnessDataCreate, user_id: str = "demo") -> Assessment:
    """Accept wellness data, trigger AI pipeline (with cooldown), return assessment."""

    # Store the data
    create_wellness_data(
        user_id=user_id,
        category=data.category,
        metric=data.metric,
        value=data.value,
        source=data.source,
        recorded_at=data.recorded_at,
    )

    # Check cooldown
    now = time.time()
    last_run = _last_pipeline_run.get(user_id, 0)
    if now - last_run < PIPELINE_COOLDOWN_SECONDS:
        existing = get_latest_assessment(user_id)
        if existing:
            return Assessment(**existing)

    _last_pipeline_run[user_id] = now

    # Run Bloomie AI pipeline
    initial_state = {
        "user_id": user_id,
        "raw_data": [],
        "baselines": {},
        "current_values": {},
        "deviations": [],
        "trend_signals": [],
        "risk_level": "none",
        "narrative": "",
        "garden_state": {},
        "recommendations": [],
        "insights": [],
        "escalation": None,
    }

    try:
        result = graph.invoke(initial_state)
    except Exception:
        _last_pipeline_run.pop(user_id, None)
        existing = get_latest_assessment(user_id)
        if existing:
            return Assessment(**existing)
        # Create fallback assessment
        fallback = create_assessment({
            "user_id": user_id,
            "overall_score": 0.8,
            "deviation_level": "none",
            "narrative": "Your garden is growing beautifully today! 🌸",
            "garden_state": {"sky": "clear", "pond_level": 0.8, "tree_growth": 0.5, "butterfly_count": 5, "bird_count": 3, "firefly_count": 0},
        })
        return Assessment(**fallback)

    # Compute overall score
    risk_to_score = {"none": 0.9, "low": 0.75, "moderate": 0.55, "high": 0.35}
    overall_score = risk_to_score.get(result.get("risk_level", "none"), 0.8)

    # Determine deviation level
    devs = result.get("deviations", [])
    if not devs:
        deviation_level = "none"
    elif max(d.get("magnitude", 0) for d in devs) >= 0.7:
        deviation_level = "significant"
    elif max(d.get("magnitude", 0) for d in devs) >= 0.4:
        deviation_level = "moderate"
    else:
        deviation_level = "mild"

    # Store assessment
    assessment_data = {
        "user_id": user_id,
        "overall_score": overall_score,
        "deviation_level": deviation_level,
        "narrative": result.get("narrative", ""),
        "insights": result.get("insights", []),
        "garden_state": result.get("garden_state", {}),
        "deviations": result.get("deviations", []),
        "recommendations": result.get("recommendations", []),
    }
    stored = create_assessment(assessment_data)
    return Assessment(**stored)


@router.get("", response_model=list[WellnessData])
async def get_data(user_id: str = "demo", category: str | None = None, metric: str | None = None, limit: int = 50) -> list[WellnessData]:
    """Retrieve wellness data with optional filters."""
    data = get_wellness_data(user_id, category=category, metric=metric, limit=limit)
    return [WellnessData(**d) for d in data]
