"""Weather integration router - environment awareness for Bloomie."""

import os
import httpx
from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter(prefix="/api/weather", tags=["weather"])

WEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"


@router.get("")
async def get_weather(lat: float = 43.65, lon: float = -79.38) -> dict:
    """Get current weather and forecast. Defaults to Toronto."""
    # If no API key, return realistic mock data
    if not WEATHER_API_KEY:
        return _mock_weather()

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Current weather
            current_resp = await client.get(
                f"{WEATHER_BASE_URL}/weather",
                params={"lat": lat, "lon": lon, "appid": WEATHER_API_KEY, "units": "metric"},
            )
            current_data = current_resp.json()

            # 5-day forecast
            forecast_resp = await client.get(
                f"{WEATHER_BASE_URL}/forecast",
                params={"lat": lat, "lon": lon, "appid": WEATHER_API_KEY, "units": "metric", "cnt": 8},
            )
            forecast_data = forecast_resp.json()

            temp = current_data.get("main", {}).get("temp", 22)
            humidity = current_data.get("main", {}).get("humidity", 55)
            description = current_data.get("weather", [{}])[0].get("description", "clear sky")
            icon = current_data.get("weather", [{}])[0].get("icon", "01d")

            # Build recommendations based on weather
            recs = _generate_weather_recommendations(temp, humidity, description)

            # Garden effect
            garden_effect = _compute_garden_weather_effect(temp, humidity, description)

            return {
                "current": {
                    "temp": round(temp, 1),
                    "feels_like": round(current_data.get("main", {}).get("feels_like", temp), 1),
                    "humidity": humidity,
                    "description": description,
                    "icon": icon,
                    "wind_speed": current_data.get("wind", {}).get("speed", 0),
                },
                "forecast": [
                    {
                        "time": f.get("dt_txt", ""),
                        "temp": round(f.get("main", {}).get("temp", 22), 1),
                        "description": f.get("weather", [{}])[0].get("description", ""),
                        "icon": f.get("weather", [{}])[0].get("icon", "01d"),
                    }
                    for f in forecast_data.get("list", [])[:6]
                ],
                "recommendations": recs,
                "garden_effect": garden_effect,
                "bloomie_thought": _weather_bloomie_thought(temp, humidity, description),
            }
    except Exception:
        return _mock_weather()


def _mock_weather() -> dict:
    """Realistic mock weather data for demo."""
    hour = datetime.now(timezone.utc).hour
    is_day = 6 <= hour < 20

    return {
        "current": {
            "temp": 26.5 if is_day else 19.2,
            "feels_like": 28.1 if is_day else 18.5,
            "humidity": 62,
            "description": "partly cloudy" if is_day else "clear sky",
            "icon": "02d" if is_day else "01n",
            "wind_speed": 3.2,
        },
        "forecast": [
            {"time": "12:00", "temp": 28.0, "description": "sunny", "icon": "01d"},
            {"time": "15:00", "temp": 30.2, "description": "hot", "icon": "01d"},
            {"time": "18:00", "temp": 25.5, "description": "partly cloudy", "icon": "02d"},
            {"time": "21:00", "temp": 21.0, "description": "clear", "icon": "01n"},
            {"time": "00:00", "temp": 18.5, "description": "clear", "icon": "01n"},
            {"time": "06:00", "temp": 17.2, "description": "cool", "icon": "02d"},
        ],
        "recommendations": [
            {"type": "hydration", "message": "It's warm today! Drink extra water to keep your pond full. 💧", "priority": "high"},
            {"type": "activity", "message": "Great weather for a short outdoor walk! The butterflies will love it. 🦋", "priority": "medium"},
            {"type": "sun", "message": "UV is moderate. A hat would be nice if you go outside. ☀️", "priority": "low"},
        ],
        "garden_effect": {
            "pond_evaporation": 0.05,
            "butterfly_boost": 2,
            "sky_mood": "clear",
            "description": "Warm and sunny — your garden is soaking up the light!",
        },
        "bloomie_thought": "It's a beautiful warm day! ☀️ Your pond might need a little extra water today.",
    }


def _generate_weather_recommendations(temp: float, humidity: float, description: str) -> list[dict]:
    """Generate weather-aware wellness recommendations."""
    recs = []

    if temp >= 30:
        recs.append({"type": "hydration", "message": "It's really hot today! Drink lots of water. 💧", "priority": "high"})
        recs.append({"type": "activity", "message": "Best to exercise early morning or evening. 🌅", "priority": "high"})
    elif temp >= 25:
        recs.append({"type": "hydration", "message": "Warm day ahead! Keep that pond full. 💧", "priority": "medium"})
        recs.append({"type": "activity", "message": "Nice weather for a walk outside! 🚶", "priority": "medium"})
    elif temp < 5:
        recs.append({"type": "warmth", "message": "Bundle up today! It's cold outside. 🧣", "priority": "medium"})
        recs.append({"type": "activity", "message": "Indoor stretches might feel better today. 🧘", "priority": "low"})

    if humidity > 80:
        recs.append({"type": "comfort", "message": "High humidity today. Stay cool and hydrated. 💦", "priority": "medium"})

    if "rain" in description.lower():
        recs.append({"type": "mood", "message": "Rainy day! Perfect for cozy indoor activities. 🌧️", "priority": "low"})
        recs.append({"type": "activity", "message": "How about some indoor stretching or meditation? 🧘", "priority": "low"})

    if not recs:
        recs.append({"type": "activity", "message": "Nice weather today! Perfect for being outside. 🌿", "priority": "low"})

    return recs


def _compute_garden_weather_effect(temp: float, humidity: float, description: str) -> dict:
    """Determine how weather affects the garden visuals."""
    effect = {
        "pond_evaporation": 0.0,
        "butterfly_boost": 0,
        "sky_mood": "clear",
        "description": "",
    }

    # Hot weather evaporates the pond
    if temp >= 30:
        effect["pond_evaporation"] = 0.1
        effect["butterfly_boost"] = 3
        effect["description"] = "The heat makes your pond evaporate slightly, but butterflies love it!"
    elif temp >= 25:
        effect["pond_evaporation"] = 0.05
        effect["butterfly_boost"] = 2
        effect["description"] = "Warm and pleasant — your garden is thriving!"

    # Rain fills the pond
    if "rain" in description.lower():
        effect["pond_evaporation"] = -0.1  # negative = filling
        effect["sky_mood"] = "stormy"
        effect["butterfly_boost"] = -2
        effect["description"] = "Rain fills your pond! But the butterflies are hiding."
    elif "cloud" in description.lower():
        effect["sky_mood"] = "cloudy"
        effect["description"] = "Cloudy but calm. The garden rests."
    elif "clear" in description.lower() or "sun" in description.lower():
        effect["sky_mood"] = "clear"

    return effect


def _weather_bloomie_thought(temp: float, humidity: float, description: str) -> str:
    """Generate Bloomie's weather-aware thought."""
    if temp >= 32:
        return "It's going to be really warm today! ☀️ Let's keep your pond full together."
    elif temp >= 28:
        return "Warm and sunny! Great day for butterflies. Don't forget extra water! 💧"
    elif "rain" in description.lower():
        return "It's raining! 🌧️ Your pond is filling up naturally. A cozy day inside?"
    elif temp < 5:
        return "Brrr, it's cold! 🧣 Your garden is hibernating a bit. Stay warm!"
    else:
        return "Nice weather today! ☀️ Your garden is soaking up all the good vibes."
