"""Spotify integration router - wellness moments with music."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/spotify", tags=["spotify"])

# Curated wellness playlists (using Spotify embed URIs)
WELLNESS_PLAYLISTS = {
    "calm": {
        "name": "Garden Peace",
        "description": "Gentle ambient sounds for your garden",
        "emoji": "🌿",
        "uri": "spotify:playlist:37i9dQZF1DWZqd5JICZI0u",
        "embed_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DWZqd5JICZI0u",
    },
    "focus": {
        "name": "Deep Focus Garden",
        "description": "Concentration sounds while your tree grows",
        "emoji": "🌳",
        "uri": "spotify:playlist:37i9dQZF1DWZeKCadgRdKQ",
        "embed_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ",
    },
    "walk": {
        "name": "Butterfly Walk",
        "description": "Light upbeat music for movement",
        "emoji": "🦋",
        "uri": "spotify:playlist:37i9dQZF1DX0BcQWzuB7ZO",
        "embed_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DX0BcQWzuB7ZO",
    },
    "sleep": {
        "name": "Night Garden",
        "description": "Drift off with your fireflies",
        "emoji": "🌙",
        "uri": "spotify:playlist:37i9dQZF1DWZd79rJ6a7lp",
        "embed_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DWZd79rJ6a7lp",
    },
    "rain": {
        "name": "Rainy Day Garden",
        "description": "Cozy sounds for cloudy days",
        "emoji": "🌧️",
        "uri": "spotify:playlist:37i9dQZF1DX8ymr6UES7vc",
        "embed_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DX8ymr6UES7vc",
    },
    "morning": {
        "name": "Garden Sunrise",
        "description": "Energize your morning routine",
        "emoji": "🌅",
        "uri": "spotify:playlist:37i9dQZF1DX0UrRvztWcAU",
        "embed_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DX0UrRvztWcAU",
    },
    "meditation": {
        "name": "Firefly Meditation",
        "description": "Mindfulness in your garden",
        "emoji": "✨",
        "uri": "spotify:playlist:37i9dQZF1DWU0ScTcjJBdj",
        "embed_url": "https://open.spotify.com/embed/playlist/37i9dQZF1DWU0ScTcjJBdj",
    },
}


@router.get("/moments")
async def get_wellness_moments(mood: str = "calm", weather: str = "clear", time_of_day: str = "day") -> dict:
    """Get contextual music recommendations based on current state."""
    # Select playlist based on context
    suggested = _pick_playlist(mood, weather, time_of_day)

    return {
        "primary": suggested,
        "alternatives": _get_alternatives(suggested["key"]),
        "bloomie_says": _music_thought(suggested, weather, time_of_day),
    }


@router.get("/playlists")
async def list_playlists() -> dict:
    """List all available wellness playlists."""
    return {
        "playlists": [
            {**v, "key": k}
            for k, v in WELLNESS_PLAYLISTS.items()
        ]
    }


def _pick_playlist(mood: str, weather: str, time_of_day: str) -> dict:
    """Pick the best playlist for current context."""
    key = "calm"  # default

    if time_of_day == "night":
        key = "sleep"
    elif time_of_day == "morning":
        key = "morning"
    elif "rain" in weather.lower() or "storm" in weather.lower():
        key = "rain"
    elif mood in ("stressed", "anxious"):
        key = "meditation"
    elif mood in ("low", "sad", "tired"):
        key = "calm"
    elif mood in ("energetic", "active"):
        key = "walk"
    elif mood in ("focused", "working"):
        key = "focus"

    playlist = WELLNESS_PLAYLISTS[key]
    return {**playlist, "key": key}


def _get_alternatives(current_key: str) -> list[dict]:
    """Get 3 alternative playlists."""
    alternatives = []
    for k, v in WELLNESS_PLAYLISTS.items():
        if k != current_key:
            alternatives.append({**v, "key": k})
        if len(alternatives) >= 3:
            break
    return alternatives


def _music_thought(playlist: dict, weather: str, time_of_day: str) -> str:
    """Generate Bloomie's music suggestion."""
    if "rain" in weather.lower():
        return f"🌧️ Rainy day! Want some cozy music while we sit here? I picked '{playlist['name']}' for you."
    elif time_of_day == "night":
        return f"🌙 Time to wind down. '{playlist['name']}' will help your fireflies come out."
    elif time_of_day == "morning":
        return f"🌅 Good morning! '{playlist['name']}' to start your day with good energy."
    else:
        return f"{playlist['emoji']} I thought you might enjoy '{playlist['name']}'. Want to listen?"
