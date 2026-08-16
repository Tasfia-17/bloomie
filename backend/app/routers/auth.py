"""Auth router - signup creates a real profile, login verifies credentials."""

import hashlib
import secrets
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from ..services.supabase_client import (
    get_supabase_client,
    get_profile_by_email,
    create_profile,
    DEMO_USER_UUID,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    id: str
    email: str
    name: str
    garden_level: int
    streak_days: int
    is_new: bool = False


def _hash_password(password: str, salt: str = "") -> str:
    """Simple password hashing for demo purposes."""
    return hashlib.sha256(f"{password}{salt}".encode()).hexdigest()


@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignupRequest) -> AuthResponse:
    """Create a new user profile."""
    email = req.email.lower().strip()
    name = req.name.strip()

    if not name or not email or not req.password:
        raise HTTPException(status_code=400, detail="All fields are required")

    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Check if email already exists
    existing = get_profile_by_email(email)
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    # Create profile
    salt = secrets.token_hex(8)
    password_hash = _hash_password(req.password, salt)

    profile_data = {
        "email": email,
        "name": name,
        "password_hash": password_hash,
        "password_salt": salt,
        "avatar": "bloomie_default",
        "timezone": "America/Toronto",
        "garden_level": 1,
        "total_quests_completed": 0,
        "streak_days": 0,
    }

    try:
        profile = create_profile(profile_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create account: {str(e)}")

    # Generate starter quests for new user
    _create_starter_quests(profile["id"])

    return AuthResponse(
        id=profile["id"],
        email=profile["email"],
        name=profile["name"],
        garden_level=profile.get("garden_level", 1),
        streak_days=profile.get("streak_days", 0),
        is_new=True,
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest) -> AuthResponse:
    """Login with email and password."""
    email = req.email.lower().strip()

    # Demo account shortcut
    if email == "bloom@bloomie.app" and req.password == "garden123":
        return AuthResponse(
            id=DEMO_USER_UUID,
            email="bloom@bloomie.app",
            name="Bloom Gardener",
            garden_level=4,
            streak_days=7,
            is_new=False,
        )

    if email == "lily@bloomie.app" and req.password == "bloom123":
        return AuthResponse(
            id="00000000-0000-0000-0000-000000000002",
            email="lily@bloomie.app",
            name="Lily Wellness",
            garden_level=1,
            streak_days=0,
            is_new=False,
        )

    # Look up user
    profile = get_profile_by_email(email)
    if not profile:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Verify password
    salt = profile.get("password_salt", "")
    password_hash = _hash_password(req.password, salt)

    if password_hash != profile.get("password_hash", ""):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return AuthResponse(
        id=profile["id"],
        email=profile["email"],
        name=profile["name"],
        garden_level=profile.get("garden_level", 1),
        streak_days=profile.get("streak_days", 0),
        is_new=False,
    )


def _create_starter_quests(user_id: str):
    """Create initial quests for a new user."""
    sb = get_supabase_client()
    quests = [
        {
            "user_id": user_id,
            "type": "hydration",
            "title": "First Sip 💧",
            "description": "Drink a glass of water to fill your pond.",
            "target_value": 1,
            "current_value": 0,
            "reward": "flower",
            "status": "active",
        },
        {
            "user_id": user_id,
            "type": "movement",
            "title": "First Steps 🚶",
            "description": "Take a short walk to attract butterflies.",
            "target_value": 1,
            "current_value": 0,
            "reward": "butterfly",
            "status": "active",
        },
        {
            "user_id": user_id,
            "type": "mindfulness",
            "title": "First Breath ✨",
            "description": "Try a breathing exercise to grow fireflies.",
            "target_value": 1,
            "current_value": 0,
            "reward": "firefly",
            "status": "active",
        },
    ]
    try:
        sb.table("quests").insert(quests).execute()
    except Exception:
        pass
