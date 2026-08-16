"""Chat router - Bloomie companion conversation with safety guardrails."""

import json
import re

from fastapi import APIRouter
from langchain_core.messages import SystemMessage, HumanMessage

from ..models.schemas import ChatRequest, ChatResponse
from ..services.openrouter_client import get_creative_llm
from ..services.supabase_client import (
    get_latest_assessment,
    get_active_quests,
    save_chat_message,
    get_chat_history,
)
from ..agents.prompts import CHAT_SYSTEM_PROMPT

router = APIRouter(prefix="/api", tags=["chat"])

# ============================================================================
# SAFETY GUARDRAILS
# ============================================================================

# Crisis keywords that trigger immediate helpline routing
CRISIS_KEYWORDS = [
    r"\bsuicid", r"\bkill\s*(my)?self", r"\bwant\s*to\s*die", r"\bend\s*(my)?\s*life",
    r"\bself[- ]?harm", r"\bcutting\s*(my)?self", r"\bhurt\s*(my)?self",
    r"\bdon'?t\s*want\s*to\s*(be\s*here|live|exist)",
    r"\bno\s*reason\s*to\s*live", r"\beveryone.*better.*without",
]

# Negative self-talk patterns that need gentle reframing
NEGATIVE_PATTERNS = [
    r"\bi'?m\s*(so\s*)?(stupid|worthless|ugly|useless|pathetic|terrible|horrible|disgusting)",
    r"\bnobody\s*(loves|cares|likes)\s*me",
    r"\bi\s*hate\s*(my)?self", r"\bi'?m\s*a\s*(failure|loser|burden)",
    r"\bwhat'?s\s*the\s*point", r"\bnothing\s*matters",
    r"\bi\s*can'?t\s*do\s*anything\s*right",
    r"\beveryone\s*hates\s*me", r"\bi'?m\s*so\s*alone",
]

# Crisis response - ALWAYS show helpline info
CRISIS_RESPONSE = (
    "I hear you, and I want you to know that what you're feeling matters. "
    "Please reach out to someone who can help right now:\n\n"
    "📞 **988 Suicide & Crisis Lifeline**: Call or text 988\n"
    "💬 **Crisis Text Line**: Text HOME to 741741\n"
    "🌍 **International**: findahelpline.com\n\n"
    "You don't have to go through this alone. I'm here too, "
    "but a trained counselor can support you better right now. 💜"
)

# Positive reframing responses for negative self-talk
REFRAME_RESPONSES = [
    "I hear that you're being really hard on yourself right now. "
    "Would it help to think about one small thing that went okay today? Even tiny things count. 🌱",

    "Those feelings are real, and I'm not going to dismiss them. "
    "But I've noticed you show up every day — that takes strength. 💪",

    "It sounds like your inner voice is being harsh today. "
    "What would you say to a friend feeling this way? "
    "Try speaking to yourself with that same kindness. 🌸",

    "I'm sorry you're feeling this way. Remember: difficult moments are not permanent states. "
    "Your garden has weathered storms before and grown back. 🌿",

    "Those thoughts feel loud right now, but they don't define you. "
    "Want to try a 3-minute breathing exercise? Sometimes it helps create a little space. 🧘",
]


def _check_crisis(message: str) -> bool:
    """Check if message contains crisis indicators."""
    msg_lower = message.lower()
    return any(re.search(pattern, msg_lower) for pattern in CRISIS_KEYWORDS)


def _check_negative_self_talk(message: str) -> bool:
    """Check if message contains negative self-talk patterns."""
    msg_lower = message.lower()
    return any(re.search(pattern, msg_lower) for pattern in NEGATIVE_PATTERNS)


def _get_reframe_response(message: str) -> str:
    """Get an appropriate positive reframing response."""
    import random
    return random.choice(REFRAME_RESPONSES)


# ============================================================================
# FALLBACK RESPONSES
# ============================================================================

# Fallback responses for when AI is unavailable
FALLBACK_RESPONSES = {
    "greeting": [
        "Hey there! 🌸 Your garden is looking lovely today. How can I help?",
        "Hello, friend! 🐰 I was just tending to your flowers. What's on your mind?",
        "Welcome back! ✨ The butterflies have been waiting for you!",
    ],
    "sleep": [
        "Sleep is so important for your garden! Try winding down earlier tonight. 🌙",
        "Your body grows while you rest, just like the plants in your garden. 💤",
        "I noticed your sky has been a bit cloudy. A good night's rest could clear it up!",
    ],
    "mood": [
        "I'm sorry you're feeling that way. Remember, even rainy days help the garden grow. 🌧️",
        "It's okay to have tough days. Want me to suggest something gentle? 💜",
        "Your feelings matter. Sometimes a tiny walk or a message to someone you love helps.",
    ],
    "activity": [
        "Even 5 minutes of movement brings butterflies to your garden! 🦋",
        "Your body loves gentle movement. Want to try a tiny walk?",
        "The butterflies are waiting! A little activity goes a long way.",
    ],
    "hydration": [
        "Let's fill up that pond! 💧 Every glass counts.",
        "Your garden pond is a little low. Time for some water? 💧",
        "Water is life! For you AND your garden. Let's drink up! 🌊",
    ],
    "general": [
        "I'm here for you! Your garden reflects how you take care of yourself. 🌸",
        "Every small step counts. What would feel good right now?",
        "Remember: progress, not perfection. Your garden loves consistency! 🌱",
    ],
}


def _get_fallback(message: str) -> str:
    """Simple keyword matching for fallback responses."""
    import random
    msg = message.lower()

    if any(w in msg for w in ["hi", "hello", "hey", "morning", "evening"]):
        return random.choice(FALLBACK_RESPONSES["greeting"])
    elif any(w in msg for w in ["sleep", "tired", "rest", "insomnia", "nap"]):
        return random.choice(FALLBACK_RESPONSES["sleep"])
    elif any(w in msg for w in ["sad", "anxious", "stressed", "down", "mood", "feeling"]):
        return random.choice(FALLBACK_RESPONSES["mood"])
    elif any(w in msg for w in ["walk", "exercise", "move", "steps", "run", "active"]):
        return random.choice(FALLBACK_RESPONSES["activity"])
    elif any(w in msg for w in ["water", "drink", "hydrat", "thirst"]):
        return random.choice(FALLBACK_RESPONSES["hydration"])
    else:
        return random.choice(FALLBACK_RESPONSES["general"])


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, user_id: str = "demo") -> ChatResponse:
    """Chat with Bloomie - includes safety guardrails."""

    # =========================================================
    # GUARDRAIL 1: Crisis detection - immediate helpline routing
    # =========================================================
    if _check_crisis(req.message):
        # Save for safety audit
        try:
            save_chat_message(user_id, "user", req.message, {"flagged": "crisis"})
            save_chat_message(user_id, "bloomie", CRISIS_RESPONSE, {"type": "crisis_response"})
        except Exception:
            pass
        return ChatResponse(reply=CRISIS_RESPONSE, emotion="caring")

    # =========================================================
    # GUARDRAIL 2: Negative self-talk - positive reframing
    # =========================================================
    if _check_negative_self_talk(req.message):
        reframe = _get_reframe_response(req.message)
        try:
            save_chat_message(user_id, "user", req.message, {"flagged": "negative_self_talk"})
            save_chat_message(user_id, "bloomie", reframe, {"type": "reframe_response"})
        except Exception:
            pass
        return ChatResponse(reply=reframe, emotion="caring")

    # =========================================================
    # Normal AI chat flow
    # =========================================================

    # Get context for Bloomie
    assessment = get_latest_assessment(user_id)
    quests = get_active_quests(user_id)

    wellness_summary = "No recent data available."
    garden_state = "A peaceful garden with clear skies."
    active_quests_str = "No active quests."

    if assessment:
        wellness_summary = assessment.get("narrative", "Your garden is growing well.")
        gs = assessment.get("garden_state", {})
        garden_state = f"Sky: {gs.get('sky', 'clear')}, Pond: {gs.get('pond_level', 0.7):.0%}, Butterflies: {gs.get('butterfly_count', 5)}, Birds: {gs.get('bird_count', 3)}"

    if quests:
        active_quests_str = ", ".join([q.get("title", "") for q in quests[:3]])

    # Save user message
    try:
        save_chat_message(user_id, "user", req.message)
    except Exception:
        pass

    # Try AI response
    try:
        llm = get_creative_llm()
        system_prompt = CHAT_SYSTEM_PROMPT.format(
            user_name=req.user_name,
            wellness_summary=wellness_summary,
            garden_state=garden_state,
            active_quests=active_quests_str,
        )
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=req.message),
        ]
        response = llm.invoke(messages)
        reply = response.content.strip()

        # Determine emotion from response
        emotion = "happy"
        if any(w in reply.lower() for w in ["sorry", "tough", "difficult", "rest"]):
            emotion = "caring"
        elif any(w in reply.lower() for w in ["great", "amazing", "wonderful", "fantastic"]):
            emotion = "excited"
        elif any(w in reply.lower() for w in ["gentle", "easy", "slow"]):
            emotion = "gentle"

    except Exception:
        reply = _get_fallback(req.message)
        emotion = "happy"

    # Save Bloomie's response
    try:
        save_chat_message(user_id, "bloomie", reply)
    except Exception:
        pass

    return ChatResponse(reply=reply, emotion=emotion)
