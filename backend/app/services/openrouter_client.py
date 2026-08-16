"""OpenRouter AI client for Bloomie - replaces Gemini."""

import os
from functools import lru_cache

from langchain_openai import ChatOpenAI


@lru_cache(maxsize=1)
def get_llm() -> ChatOpenAI:
    """Get an OpenRouter-backed LLM instance (singleton)."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY must be set")

    model = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")

    return ChatOpenAI(
        model=model,
        openai_api_key=api_key,
        openai_api_base="https://openrouter.ai/api/v1",
        temperature=0.4,
        max_tokens=1024,
        default_headers={
            "HTTP-Referer": "https://bloomie.app",
            "X-Title": "Bloomie Wellness Companion",
        },
    )


@lru_cache(maxsize=1)
def get_creative_llm() -> ChatOpenAI:
    """Get a more creative LLM for narrative/chat (higher temperature)."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY must be set")

    model = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")

    return ChatOpenAI(
        model=model,
        openai_api_key=api_key,
        openai_api_base="https://openrouter.ai/api/v1",
        temperature=0.7,
        max_tokens=512,
        default_headers={
            "HTTP-Referer": "https://bloomie.app",
            "X-Title": "Bloomie Wellness Companion",
        },
    )
