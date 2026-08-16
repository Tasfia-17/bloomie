"""Bloomie Pydantic models."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ============================================================================
# WELLNESS DATA
# ============================================================================

class WellnessDataCreate(BaseModel):
    category: str = Field(pattern=r"^(body|habits|self_report|environment|life_context|social)$")
    metric: str
    value: dict
    source: str = "manual"
    recorded_at: Optional[datetime] = None


class WellnessData(BaseModel):
    id: str
    user_id: str
    category: str
    metric: str
    value: dict
    source: str
    recorded_at: datetime


# ============================================================================
# BASELINES
# ============================================================================

class Baseline(BaseModel):
    metric: str
    baseline_mean: Optional[float] = None
    baseline_stdev: Optional[float] = None
    baseline_min: Optional[float] = None
    baseline_max: Optional[float] = None
    sample_count: int = 0
    last_updated: Optional[datetime] = None


# ============================================================================
# ASSESSMENTS
# ============================================================================

class GardenState(BaseModel):
    sky: str = Field(default="clear", pattern=r"^(clear|cloudy|stormy|sunset|night)$")
    pond_level: float = Field(default=0.8, ge=0.0, le=1.0)
    tree_growth: float = Field(default=0.5, ge=0.0, le=1.0)
    butterfly_count: int = Field(default=5, ge=0)
    bird_count: int = Field(default=3, ge=0)
    firefly_count: int = Field(default=0, ge=0)
    flower_bloom: float = Field(default=0.7, ge=0.0, le=1.0)
    rabbit_mood: str = Field(default="happy", pattern=r"^(happy|sleepy|playful|cozy)$")


class Deviation(BaseModel):
    metric: str
    direction: str = Field(pattern=r"^(up|down)$")
    magnitude: float
    description: str


class Assessment(BaseModel):
    id: str
    user_id: str
    overall_score: float = Field(default=0.8, ge=0.0, le=1.0)
    deviation_level: str = "none"
    narrative: Optional[str] = None
    insights: list[str] = Field(default_factory=list)
    garden_state: Optional[dict] = None
    deviations: list[dict] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None


# ============================================================================
# QUESTS
# ============================================================================

class QuestCreate(BaseModel):
    type: str = Field(pattern=r"^(hydration|movement|connection|sleep|recovery|kindness|mindfulness|nutrition)$")
    title: str
    description: Optional[str] = None
    target_value: float = 1
    reward: str = "flower"


class Quest(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    description: Optional[str] = None
    target_value: float
    current_value: float
    reward: str
    status: str
    expires_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class QuestProgress(BaseModel):
    progress: float


# ============================================================================
# NEST CONTACTS
# ============================================================================

class NestContactCreate(BaseModel):
    name: str
    relation: str
    emoji: str = "❤️"
    phone: Optional[str] = None
    email: Optional[str] = None
    contact_frequency_days: int = 7


class NestContact(BaseModel):
    id: str
    user_id: str
    name: str
    relation: str
    emoji: str
    phone: Optional[str] = None
    email: Optional[str] = None
    last_contact_at: Optional[datetime] = None
    contact_frequency_days: int
    created_at: Optional[datetime] = None


# ============================================================================
# INSIGHTS
# ============================================================================

class Insight(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    body: str
    related_metrics: list[str] = Field(default_factory=list)
    confidence: float = 0.5
    acknowledged: bool = False
    created_at: Optional[datetime] = None


# ============================================================================
# TODAY SUMMARY
# ============================================================================

class TodaySummary(BaseModel):
    user_name: str
    greeting: str
    body_stats: dict
    bloomie_thought: str
    active_quests: list[Quest] = Field(default_factory=list)
    garden_state: GardenState
    streak_days: int = 0


# ============================================================================
# CHAT
# ============================================================================

class ChatRequest(BaseModel):
    message: str
    user_name: str = "friend"


class ChatResponse(BaseModel):
    reply: str
    emotion: str = "happy"


# ============================================================================
# PROFILE
# ============================================================================

class Profile(BaseModel):
    id: str
    email: str
    name: str
    avatar: str
    timezone: str
    garden_level: int
    total_quests_completed: int
    streak_days: int
    created_at: Optional[datetime] = None


# ============================================================================
# WHY EXPLANATION
# ============================================================================

class WhyExplanation(BaseModel):
    question: str
    explanation: str
    contributing_factors: list[dict] = Field(default_factory=list)
    context: Optional[str] = None
