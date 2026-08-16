"""
Bloomie Demo Data Seeder
Generates 14 days of realistic wellness data for the 'demo' user.
Run: python -m seed.seed_demo (from backend directory)
Or:  python seed_demo.py (directly)
"""

import os
import sys
import random
from datetime import datetime, timezone, timedelta
from uuid import uuid4

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env")
    sys.exit(1)

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

USER_ID = "demo"
DEMO_EMAIL = "bloom@bloomie.app"
DEMO_NAME = "Bloom Gardener"
DAYS = 14

print("🌸 Bloomie Demo Seeder — Generating 14 days of wellness history...")


# ============================================================================
# 1. Create/Update Profile
# ============================================================================

def seed_profile():
    print("  → Seeding profile...")
    profile = {
        "id": USER_ID,
        "email": DEMO_EMAIL,
        "name": DEMO_NAME,
        "avatar": "bloomie_default",
        "timezone": "America/Toronto",
        "garden_level": 4,
        "total_quests_completed": 18,
        "streak_days": 7,
    }
    sb.table("profiles").upsert(profile, on_conflict="id").execute()


# ============================================================================
# 2. Wellness Data (14 days of body + habits + self-report)
# ============================================================================

def seed_wellness_data():
    print("  → Seeding 14 days of wellness data...")
    now = datetime.now(timezone.utc)
    rows = []

    for day_offset in range(DAYS):
        day = now - timedelta(days=DAYS - 1 - day_offset)
        day_str = day.strftime("%Y-%m-%dT08:00:00+00:00")

        # Simulate gradual improvement over 14 days
        progress = day_offset / DAYS  # 0.0 → 1.0
        noise = random.uniform(-0.1, 0.1)

        # === BODY ===
        # Heart rate (resting): improves slightly over time
        resting_hr = int(72 - progress * 5 + random.randint(-3, 3))
        rows.append(_row("body", "heart_rate", {"bpm": resting_hr}, day_str))
        rows.append(_row("body", "resting_hr", {"bpm": resting_hr - 2}, day_str))

        # Sleep: getting better
        sleep_hours = round(6.0 + progress * 1.5 + random.uniform(-0.5, 0.5), 1)
        rows.append(_row("body", "sleep", {"hours": sleep_hours, "quality": "good" if sleep_hours > 7 else "fair"}, day_str))

        # Steps: variable but trending up
        steps = int(4000 + progress * 5000 + random.randint(-1000, 1500))
        rows.append(_row("body", "steps", {"count": steps}, day_str))

        # HRV: improving
        hrv = int(45 + progress * 15 + random.randint(-5, 5))
        rows.append(_row("body", "hrv", {"bpm": hrv, "ms": hrv}, day_str))

        # Activity minutes
        activity = int(20 + progress * 30 + random.randint(-10, 15))
        rows.append(_row("body", "activity_minutes", {"minutes": activity}, day_str))

        # === HABITS ===
        # Hydration: building good habits
        glasses = int(4 + progress * 4 + random.randint(-1, 2))
        rows.append(_row("habits", "hydration", {"glasses": min(glasses, 10)}, day_str))

        # Caffeine: reducing over time
        caffeine_mg = int(300 - progress * 120 + random.randint(-30, 30))
        caffeine_time = "09:30" if day_offset > 7 else "15:30"  # Moving caffeine earlier
        rows.append(_row("habits", "caffeine", {"mg": max(caffeine_mg, 80), "time": caffeine_time, "drink_type": "coffee"}, day_str))

        # Mindfulness: starts appearing after day 3
        if day_offset >= 3:
            mindful = random.choice([1, 1, 0])
            if mindful:
                rows.append(_row("habits", "mindfulness", {"minutes": random.randint(3, 15), "type": "breathing"}, day_str))

        # Exercise
        if random.random() < 0.5 + progress * 0.3:
            rows.append(_row("habits", "exercise", {"type": random.choice(["walk", "yoga", "stretch"]), "minutes": random.randint(10, 30)}, day_str))

        # === SELF-REPORT ===
        # Mood: trending up
        mood_score = round(4 + progress * 4 + random.uniform(-1, 1), 1)
        mood_score = min(max(mood_score, 1), 10)
        rows.append(_row("self_report", "mood", {"score": mood_score, "emoji": _mood_emoji(mood_score)}, day_str))

        # Energy
        energy_score = round(4 + progress * 3.5 + random.uniform(-1, 1), 1)
        rows.append(_row("self_report", "energy", {"score": min(max(energy_score, 1), 10), "level": "moderate"}, day_str))

        # Stress (decreasing)
        stress_score = round(7 - progress * 4 + random.uniform(-1, 1), 1)
        rows.append(_row("self_report", "stress", {"score": min(max(stress_score, 1), 10), "level": "moderate"}, day_str))

        # Journal entries (some days)
        if random.random() < 0.4:
            journals = [
                "Feeling a bit better today. Went for a walk.",
                "Busy day but managed to stay hydrated.",
                "Tried a breathing exercise. Actually felt calmer.",
                "Good sleep last night. Garden vibes ✨",
                "Called mom today. That felt nice.",
                "Stressed about work but the evening walk helped.",
            ]
            rows.append(_row("self_report", "journal", {"text": random.choice(journals), "mood_at_time": mood_score}, day_str))

    # Batch insert
    batch_size = 50
    for i in range(0, len(rows), batch_size):
        sb.table("wellness_data").insert(rows[i:i + batch_size]).execute()

    print(f"    ✓ Inserted {len(rows)} wellness records")


# ============================================================================
# 3. Baselines
# ============================================================================

def seed_baselines():
    print("  → Seeding personal baselines...")
    baselines = [
        {"user_id": USER_ID, "metric": "heart_rate", "baseline_mean": 70, "baseline_stdev": 4, "baseline_min": 62, "baseline_max": 78, "sample_count": 14},
        {"user_id": USER_ID, "metric": "resting_hr", "baseline_mean": 68, "baseline_stdev": 3, "baseline_min": 63, "baseline_max": 74, "sample_count": 14},
        {"user_id": USER_ID, "metric": "sleep", "baseline_mean": 7.2, "baseline_stdev": 0.8, "baseline_min": 5.5, "baseline_max": 8.5, "sample_count": 14},
        {"user_id": USER_ID, "metric": "steps", "baseline_mean": 7200, "baseline_stdev": 2000, "baseline_min": 4000, "baseline_max": 11000, "sample_count": 14},
        {"user_id": USER_ID, "metric": "hrv", "baseline_mean": 55, "baseline_stdev": 8, "baseline_min": 42, "baseline_max": 65, "sample_count": 14},
        {"user_id": USER_ID, "metric": "hydration", "baseline_mean": 6.5, "baseline_stdev": 1.5, "baseline_min": 4, "baseline_max": 10, "sample_count": 14},
        {"user_id": USER_ID, "metric": "mood", "baseline_mean": 7.0, "baseline_stdev": 1.2, "baseline_min": 4, "baseline_max": 9, "sample_count": 14},
        {"user_id": USER_ID, "metric": "energy", "baseline_mean": 6.5, "baseline_stdev": 1.3, "baseline_min": 4, "baseline_max": 9, "sample_count": 14},
        {"user_id": USER_ID, "metric": "stress", "baseline_mean": 4.5, "baseline_stdev": 1.5, "baseline_min": 2, "baseline_max": 7, "sample_count": 14},
        {"user_id": USER_ID, "metric": "caffeine", "baseline_mean": 200, "baseline_stdev": 60, "baseline_min": 80, "baseline_max": 320, "sample_count": 14},
    ]
    for b in baselines:
        b["last_updated"] = datetime.now(timezone.utc).isoformat()
    sb.table("baselines").upsert(baselines, on_conflict="user_id,metric").execute()


# ============================================================================
# 4. Assessments (last 7 days)
# ============================================================================

def seed_assessments():
    print("  → Seeding assessments...")
    now = datetime.now(timezone.utc)
    assessments = []

    for i in range(7):
        day = now - timedelta(days=6 - i)
        score = 0.6 + (i / 6) * 0.25 + random.uniform(-0.05, 0.05)

        assessments.append({
            "user_id": USER_ID,
            "overall_score": round(min(score, 0.95), 2),
            "deviation_level": "none" if score > 0.75 else "mild",
            "narrative": _daily_narrative(i, score),
            "insights": ["Sleep improving", "Hydration consistent"] if score > 0.7 else ["Activity could improve"],
            "garden_state": {
                "sky": "clear" if score > 0.7 else "cloudy",
                "pond_level": round(0.5 + score * 0.4, 2),
                "tree_growth": round(0.4 + score * 0.4, 2),
                "butterfly_count": int(3 + score * 8),
                "bird_count": int(2 + score * 4),
                "firefly_count": int(score * 10) if i > 3 else 0,
                "flower_bloom": round(0.5 + score * 0.4, 2),
                "rabbit_mood": "happy" if score > 0.7 else "cozy",
            },
            "deviations": [],
            "recommendations": ["Keep up the great work! 🌸"] if score > 0.7 else ["Try a short walk today"],
            "created_at": day.isoformat(),
        })

    sb.table("assessments").insert(assessments).execute()


# ============================================================================
# 5. Quests
# ============================================================================

def seed_quests():
    print("  → Seeding active quests...")
    quests = [
        {"user_id": USER_ID, "type": "hydration", "title": "Pond Quest 💧", "description": "Drink 8 glasses today", "target_value": 8, "current_value": 5, "reward": "flower", "status": "active"},
        {"user_id": USER_ID, "type": "movement", "title": "Butterfly Walk 🦋", "description": "Take a 10-minute walk", "target_value": 1, "current_value": 0, "reward": "butterfly", "status": "active"},
        {"user_id": USER_ID, "type": "mindfulness", "title": "Firefly Breathe ✨", "description": "3-minute breathing exercise", "target_value": 1, "current_value": 0, "reward": "firefly", "status": "active"},
        {"user_id": USER_ID, "type": "connection", "title": "Bird Song 💌", "description": "Message someone you care about", "target_value": 1, "current_value": 0, "reward": "bird", "status": "active"},
    ]
    sb.table("quests").insert(quests).execute()


# ============================================================================
# 6. Nest Contacts
# ============================================================================

def seed_nest():
    print("  → Seeding nest contacts...")
    contacts = [
        {"user_id": USER_ID, "name": "Mom", "relation": "Mother", "emoji": "❤️", "phone": "+1-555-0123", "contact_frequency_days": 3},
        {"user_id": USER_ID, "name": "Alex", "relation": "Best Friend", "emoji": "💜", "phone": "+1-555-0456", "contact_frequency_days": 7},
        {"user_id": USER_ID, "name": "Dad", "relation": "Father", "emoji": "💛", "phone": "+1-555-0789", "contact_frequency_days": 5},
    ]
    sb.table("nest_contacts").insert(contacts).execute()


# ============================================================================
# 7. Insights
# ============================================================================

def seed_insights():
    print("  → Seeding AI insights...")
    now = datetime.now(timezone.utc)
    insights = [
        {"user_id": USER_ID, "type": "trend", "title": "Sleep improving", "body": "Your sleep has increased by 45 minutes on average over the past week.", "related_metrics": ["sleep"], "confidence": 0.85, "created_at": (now - timedelta(days=1)).isoformat()},
        {"user_id": USER_ID, "type": "correlation", "title": "Caffeine & sleep link", "body": "You sleep 40 minutes less on days with afternoon caffeine. Moving coffee earlier seems to help!", "related_metrics": ["caffeine", "sleep"], "confidence": 0.72, "created_at": (now - timedelta(days=2)).isoformat()},
        {"user_id": USER_ID, "type": "celebration", "title": "7-day streak! 🔥", "body": "You've checked in every day for a week. Your garden tree just grew a new branch!", "related_metrics": [], "confidence": 1.0, "created_at": (now - timedelta(hours=12)).isoformat()},
        {"user_id": USER_ID, "type": "pattern", "title": "Morning walks boost mood", "body": "Your mood scores are 1.5 points higher on days when you walk before noon.", "related_metrics": ["mood", "steps", "exercise"], "confidence": 0.68, "created_at": (now - timedelta(days=3)).isoformat()},
    ]
    sb.table("insights").insert(insights).execute()


# ============================================================================
# 8. Garden Unlocks
# ============================================================================

def seed_unlocks():
    print("  → Seeding garden unlocks...")
    unlocks = [
        {"user_id": USER_ID, "item_type": "flower", "item_name": "Daisy"},
        {"user_id": USER_ID, "item_type": "flower", "item_name": "Rose"},
        {"user_id": USER_ID, "item_type": "animal", "item_name": "Rabbit"},
        {"user_id": USER_ID, "item_type": "animal", "item_name": "Butterfly"},
        {"user_id": USER_ID, "item_type": "structure", "item_name": "Garden Bench"},
        {"user_id": USER_ID, "item_type": "feature", "item_name": "Fireflies"},
    ]
    sb.table("garden_unlocks").upsert(unlocks, on_conflict="user_id,item_name").execute()


# ============================================================================
# Helpers
# ============================================================================

def _row(category: str, metric: str, value: dict, recorded_at: str) -> dict:
    return {
        "user_id": USER_ID,
        "category": category,
        "metric": metric,
        "value": value,
        "source": "demo_seeder",
        "recorded_at": recorded_at,
    }


def _mood_emoji(score: float) -> str:
    if score >= 8: return "😊"
    if score >= 6: return "🙂"
    if score >= 4: return "😐"
    if score >= 2: return "😔"
    return "😢"


def _daily_narrative(day_index: int, score: float) -> str:
    narratives = [
        "A quiet start to the week. Your garden is growing slowly but surely. 🌱",
        "You're building good habits! The pond is filling and butterflies are arriving. 🦋",
        "Your consistency is showing. The tree grew a little taller today. 🌳",
        "Great energy today! Your garden is thriving. Keep it up! 🌸",
        "A few small deviations but nothing to worry about. Gentle day. 🌿",
        "Your sleep has been wonderful this week. Clear skies in the garden! ☀️",
        "Everything is coming together. Your garden is the most beautiful it's been! 🌺",
    ]
    return narratives[min(day_index, len(narratives) - 1)]


# ============================================================================
# Run
# ============================================================================

if __name__ == "__main__":
    try:
        seed_profile()
        seed_wellness_data()
        seed_baselines()
        seed_assessments()
        seed_quests()
        seed_nest()
        seed_insights()
        seed_unlocks()
        print("\n🌸 Demo data seeded successfully! Login with bloom@bloomie.app / garden123")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
