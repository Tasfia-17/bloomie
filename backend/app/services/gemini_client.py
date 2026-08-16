"""Gemini AI client for Bloomie."""

import os
from functools import lru_cache

from langchain_google_genai import ChatGoogleGenerativeAI


@lru_cache(maxsize=1)
def get_gemini_llm() -> ChatGoogleGenerativeAI:
    """Get a singleton Gemini 2.0 Flash instance."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY must be set")
    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    return ChatGoogleGenerativeAI(
        model=model,
        google_api_key=api_key,
        temperature=0.4,
        max_output_tokens=1024,
    )
