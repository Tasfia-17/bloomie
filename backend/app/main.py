import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import wellness, today, insights, nest, quests, chat, weather, calendar, nutrition, caffeine, spotify, ecosystem, clinical, privacy, auth

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler."""
    print("🌸 Bloomie backend starting up...")
    yield
    print("🌸 Bloomie backend shutting down...")


app = FastAPI(
    title="Bloomie API",
    description="Your little world for a healthier life - backend API",
    version="0.2.0",
    lifespan=lifespan,
)

# CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(wellness.router)
app.include_router(today.router)
app.include_router(insights.router)
app.include_router(nest.router)
app.include_router(quests.router)
app.include_router(chat.router)
app.include_router(weather.router)
app.include_router(calendar.router)
app.include_router(nutrition.router)
app.include_router(caffeine.router)
app.include_router(spotify.router)
app.include_router(ecosystem.router)
app.include_router(clinical.router)
app.include_router(privacy.router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": "bloomie-api", "version": "0.2.1"}


@app.get("/debug/db")
async def debug_db() -> dict:
    """Debug: test database connection."""
    try:
        from .services.supabase_client import get_supabase_client, DEMO_USER_UUID
        sb = get_supabase_client()
        resp = sb.table("profiles").select("id,name,email").eq("id", DEMO_USER_UUID).execute()
        return {"status": "connected", "demo_user": resp.data, "count": len(resp.data)}
    except Exception as e:
        return {"status": "error", "error": str(e)}
