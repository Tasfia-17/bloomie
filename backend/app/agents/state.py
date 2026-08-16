"""Bloomie AI pipeline state definition."""

from typing import TypedDict, Optional


class BloomieState(TypedDict):
    user_id: str
    raw_data: list[dict]
    baselines: dict
    current_values: dict
    deviations: list[dict]
    trend_signals: list[dict]
    risk_level: str  # none, low, moderate, high
    narrative: str
    garden_state: dict
    recommendations: list[str]
    insights: list[str]
    escalation: Optional[str]  # None, user_prompt, caregiver
