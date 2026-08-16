"""Nutrition tracking router - food logging without calorie obsession."""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from ..services.supabase_client import create_wellness_data, get_wellness_data

router = APIRouter(prefix="/api/nutrition", tags=["nutrition"])


class FoodEntry(BaseModel):
    description: str
    meal_type: str = "snack"  # breakfast, lunch, dinner, snack
    has_protein: bool = False
    has_fiber: bool = False
    has_vegetables: bool = False
    has_fruit: bool = False
    hydration_glasses: int = 0
    caffeine_mg: int = 0
    notes: Optional[str] = None


class NutritionSummary(BaseModel):
    meals_logged: int
    protein_meals: int
    fiber_meals: int
    vegetable_servings: int
    fruit_servings: int
    hydration_total: int
    caffeine_total: int
    balance_score: float
    tree_growth_boost: float
    bloomie_thought: str


@router.post("/log")
async def log_food(entry: FoodEntry, user_id: str = "demo") -> dict:
    """Log a food entry - focused on balance, not calories."""
    value = {
        "description": entry.description,
        "meal_type": entry.meal_type,
        "has_protein": entry.has_protein,
        "has_fiber": entry.has_fiber,
        "has_vegetables": entry.has_vegetables,
        "has_fruit": entry.has_fruit,
        "hydration_glasses": entry.hydration_glasses,
        "caffeine_mg": entry.caffeine_mg,
        "notes": entry.notes,
    }

    try:
        create_wellness_data(
            user_id=user_id,
            category="habits",
            metric="nutrition",
            value=value,
            source="manual",
        )

        # Also log hydration and caffeine separately if provided
        if entry.hydration_glasses > 0:
            create_wellness_data(
                user_id=user_id,
                category="habits",
                metric="hydration",
                value={"glasses": entry.hydration_glasses},
                source="nutrition_log",
            )

        if entry.caffeine_mg > 0:
            create_wellness_data(
                user_id=user_id,
                category="habits",
                metric="caffeine",
                value={"mg": entry.caffeine_mg, "time": datetime.now(timezone.utc).strftime("%H:%M")},
                source="nutrition_log",
            )
    except Exception:
        pass

    # Compute immediate feedback
    balance_factors = sum([entry.has_protein, entry.has_fiber, entry.has_vegetables, entry.has_fruit])
    thought = _food_thought(entry, balance_factors)

    return {
        "status": "logged",
        "balance_factors": balance_factors,
        "max_factors": 4,
        "tree_growth_boost": balance_factors * 0.05,
        "bloomie_says": thought,
    }


@router.get("/summary")
async def get_nutrition_summary(user_id: str = "demo") -> NutritionSummary:
    """Get today's nutrition summary."""
    try:
        data = get_wellness_data(user_id, category="habits", metric="nutrition", limit=20)
    except Exception:
        data = []

    # Filter today's entries
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_entries = [d for d in data if d.get("recorded_at", "").startswith(today)]

    meals_logged = len(today_entries)
    protein_meals = sum(1 for d in today_entries if d.get("value", {}).get("has_protein", False))
    fiber_meals = sum(1 for d in today_entries if d.get("value", {}).get("has_fiber", False))
    vegetable_servings = sum(1 for d in today_entries if d.get("value", {}).get("has_vegetables", False))
    fruit_servings = sum(1 for d in today_entries if d.get("value", {}).get("has_fruit", False))
    hydration_total = sum(d.get("value", {}).get("hydration_glasses", 0) for d in today_entries)
    caffeine_total = sum(d.get("value", {}).get("caffeine_mg", 0) for d in today_entries)

    # Balance score (0-1)
    total_factors = protein_meals + fiber_meals + vegetable_servings + fruit_servings
    max_expected = max(meals_logged * 4, 1)
    balance_score = min(total_factors / max_expected, 1.0) if meals_logged > 0 else 0.0

    # Tree growth
    tree_growth_boost = min(balance_score * 0.15, 0.15)

    thought = _daily_nutrition_thought(meals_logged, balance_score, hydration_total, caffeine_total)

    return NutritionSummary(
        meals_logged=meals_logged,
        protein_meals=protein_meals,
        fiber_meals=fiber_meals,
        vegetable_servings=vegetable_servings,
        fruit_servings=fruit_servings,
        hydration_total=hydration_total,
        caffeine_total=caffeine_total,
        balance_score=round(balance_score, 2),
        tree_growth_boost=round(tree_growth_boost, 3),
        bloomie_thought=thought,
    )


def _food_thought(entry: FoodEntry, balance_factors: int) -> str:
    """Generate Bloomie's reaction to a food entry."""
    if balance_factors >= 3:
        return f"What a balanced {entry.meal_type}! 🌳 Your tree is growing from all those good choices."
    elif balance_factors >= 2:
        return f"Nice {entry.meal_type}! 🌱 A good mix of nutrients. Your garden appreciates it."
    elif entry.has_vegetables:
        return "Vegetables! 🥬 Your garden loves when you eat your greens."
    elif entry.has_fruit:
        return "Fruit! 🍎 The fruit trees in your garden are blooming in solidarity."
    else:
        return f"Logged your {entry.meal_type}! 🌸 Every meal is a chance to nourish your garden."


def _daily_nutrition_thought(meals: int, score: float, hydration: int, caffeine: int) -> str:
    """Generate daily nutrition summary thought."""
    if meals == 0:
        return "No meals logged yet today. Remember to nourish your garden! 🌱"
    elif score >= 0.7:
        return f"Amazing balance today! 🌳 {meals} meals logged, all growing your tree beautifully."
    elif hydration < 4:
        return f"Your meals look good! But your pond could use more water — only {hydration} glasses so far. 💧"
    elif caffeine > 300:
        return f"Plenty of caffeine today ({caffeine}mg)! Maybe switch to water for your next drink. 🍵→💧"
    else:
        return f"{meals} meals logged today. Mix in more colors and your garden will thank you! 🌈"
