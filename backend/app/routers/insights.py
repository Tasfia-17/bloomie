"""Insights router - weekly trends, AI observations, Why explanations."""

import json

from fastapi import APIRouter
from langchain_core.messages import HumanMessage

from ..models.schemas import Insight, WhyExplanation, Assessment
from ..services.supabase_client import (
    get_insights,
    get_assessments,
    get_baselines,
    get_wellness_data,
    acknowledge_insight,
)
from ..services.openrouter_client import get_llm
from ..agents.prompts import WHY_EXPLANATION_PROMPT

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("", response_model=list[Insight])
async def list_insights(user_id: str = "demo", limit: int = 20) -> list[Insight]:
    """Get user's wellness insights."""
    data = get_insights(user_id, limit=limit)
    return [Insight(**i) for i in data]


@router.get("/weekly")
async def get_weekly_summary(user_id: str = "demo") -> dict:
    """Get weekly wellness summary with progress bars."""
    assessments = get_assessments(user_id, limit=7)

    if not assessments:
        return {
            "sleep": 0.8,
            "recovery": 0.7,
            "movement": 0.6,
            "hydration": 0.75,
            "social": 0.5,
            "mindfulness": 0.3,
            "overall": 0.7,
            "trend": "stable",
        }

    # Compute weekly averages from assessments
    scores = [a.get("overall_score", 0.8) for a in assessments]
    avg_score = sum(scores) / len(scores) if scores else 0.8

    # Get wellness data for specifics
    body_data = get_wellness_data(user_id, category="body", limit=50)
    habit_data = get_wellness_data(user_id, category="habits", limit=50)
    social_data = get_wellness_data(user_id, category="social", limit=20)

    # Compute category scores (normalized 0-1)
    sleep_vals = [d["value"].get("hours", 7) for d in body_data if d.get("metric") == "sleep" and isinstance(d.get("value"), dict)]
    step_vals = [d["value"].get("count", 5000) for d in body_data if d.get("metric") == "steps" and isinstance(d.get("value"), dict)]
    hydration_vals = [d["value"].get("glasses", 5) for d in habit_data if d.get("metric") == "hydration" and isinstance(d.get("value"), dict)]

    sleep_score = min(sum(sleep_vals) / (len(sleep_vals) * 8), 1.0) if sleep_vals else 0.75
    movement_score = min(sum(step_vals) / (len(step_vals) * 10000), 1.0) if step_vals else 0.6
    hydration_score = min(sum(hydration_vals) / (len(hydration_vals) * 8), 1.0) if hydration_vals else 0.7
    social_score = min(len(social_data) / 5, 1.0)

    # Trend
    if len(scores) >= 3:
        recent = sum(scores[:3]) / 3
        older = sum(scores[3:]) / max(len(scores) - 3, 1)
        if recent > older + 0.05:
            trend = "improving"
        elif recent < older - 0.05:
            trend = "declining"
        else:
            trend = "stable"
    else:
        trend = "stable"

    return {
        "sleep": round(sleep_score, 2),
        "recovery": round(avg_score, 2),
        "movement": round(movement_score, 2),
        "hydration": round(hydration_score, 2),
        "social": round(social_score, 2),
        "mindfulness": 0.4,  # Default until tracked
        "overall": round(avg_score, 2),
        "trend": trend,
    }


@router.post("/why", response_model=WhyExplanation)
async def explain_why(observation: str, user_id: str = "demo") -> WhyExplanation:
    """Explain why something is happening - the transparency feature."""
    # Gather context
    baselines = get_baselines(user_id)
    recent_data = get_wellness_data(user_id, limit=20)

    baselines_str = json.dumps(baselines[:10], indent=2, default=str)
    recent_str = json.dumps(recent_data[:10], indent=2, default=str)

    try:
        llm = get_llm()
        prompt = WHY_EXPLANATION_PROMPT.format(
            observation=observation,
            recent_data=recent_str,
            baselines=baselines_str,
        )
        response = llm.invoke([HumanMessage(content=prompt)])
        raw = response.content.strip()

        # Parse JSON
        json_str = raw
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0].strip()

        result = json.loads(json_str)
        return WhyExplanation(
            question=observation,
            explanation=result.get("explanation", "I don't have enough data to explain this yet."),
            contributing_factors=result.get("contributing_factors", []),
            context=result.get("context", "I can observe patterns but cannot determine medical causes."),
        )
    except Exception:
        return WhyExplanation(
            question=observation,
            explanation="Based on your recent data, several factors may be contributing to this change. I'm still learning your patterns.",
            contributing_factors=[],
            context="I can observe patterns in your data but cannot determine specific medical causes. If you're concerned, please speak with a healthcare professional.",
        )


@router.post("/{insight_id}/acknowledge")
async def ack_insight(insight_id: str) -> dict:
    """Mark an insight as acknowledged."""
    acknowledge_insight(insight_id)
    return {"status": "acknowledged"}
