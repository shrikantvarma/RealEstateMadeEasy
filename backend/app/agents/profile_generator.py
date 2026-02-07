"""
Buyer profile generation agent using OpenAI structured output.

Takes all extracted preferences (from transcript + chat) and an optional
chat history, then produces a scored buyer profile with deal-breakers,
nice-to-haves, budget analysis, readiness assessment, and a summary.
"""

import logging
from typing import Any

from openai import AsyncOpenAI
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are a real estate buyer profiling expert. You receive a list of buyer \
preferences (extracted from transcripts and chat conversations) and, \
optionally, the full chat history for additional context.

Your job is to synthesize everything into a comprehensive buyer profile.

Instructions:
1. **Extract NEW preferences from the chat** — The chat often reveals \
   preferences NOT in the original list (e.g., "we need a library", "must \
   have a home office", "want a pool"). Add these as new scored preferences \
   with source context. Be thorough — every stated want, need, or preference \
   from the chat should appear as a scored preference.
2. **Score every preference** on a 1-10 importance scale based on how \
   critical it is to the buyer. Use the buyer's own language as a guide:
   - "must have", "definitely need", "non-negotiable" → 9-10
   - "really want", "important to us" → 7-8
   - "would be nice", "ideally" → 4-6
   - "maybe", "not sure" → 1-3
3. **Assign confidence** ("low", "medium", "high") to each score based on \
   how clearly the buyer expressed the preference.
4. **Identify deal breakers** — items the buyer absolutely will not \
   compromise on. Use direct quotes when possible (e.g., "Must have 3+ \
   bedrooms", "Budget under $500k", "Needs a home library").
5. **Identify nice-to-haves** — things the buyer would like but can flex on \
   (e.g., "Pool would be great", "Prefer open floor plan").
6. **Summarize the budget situation** — what is their range, are they \
   pre-approved, any constraints?
7. **Assess overall buying readiness**:
   - "exploring" — just starting to look, unclear on many preferences
   - "active" — actively searching, knows what they want
   - "ready_to_buy" — urgent, clear preferences, ready to make offers
8. **Write a profile summary** — 2-3 sentences describing the ideal match \
   for this buyer, suitable for a real estate agent to use when searching \
   listings. Mention specific features from both the transcript AND chat.

IMPORTANT: Do not limit yourself to only the preferences already extracted. \
The chat conversation often contains critical new information. Every \
preference or requirement mentioned by the buyer should appear in your \
scored_preferences list.
"""


# -- Pydantic models for OpenAI structured output --------------------------


class ScoredPreference(BaseModel):
    category: str
    value: str
    score: int  # 1-10 importance to the buyer
    confidence: str  # "low" | "medium" | "high"
    notes: str  # Brief explanation of why this score


class BuyerProfileResult(BaseModel):
    scored_preferences: list[ScoredPreference]
    deal_breakers: list[str]  # Non-negotiable items
    nice_to_haves: list[str]  # Things they'd like but can flex on
    budget_summary: str  # Brief budget analysis
    overall_readiness: str  # "exploring" | "active" | "ready_to_buy"
    profile_summary: str  # 2-3 sentence summary of the ideal buyer match


# -- Helpers ---------------------------------------------------------------


def _format_preferences(preferences: list[dict]) -> str:
    """Format preference dicts into readable text for the prompt."""
    if not preferences:
        return "No preferences available."

    lines = []
    for p in preferences:
        conf = p.get("confidence", "unknown")
        source = p.get("source", "unknown")
        confirmed = " [CONFIRMED]" if p.get("is_confirmed") else ""
        lines.append(
            f"- {p.get('category', 'unknown')}: {p.get('value', '')} "
            f"(confidence: {conf}, source: {source}{confirmed})"
        )
    return "\n".join(lines)


def _format_chat_messages(chat_messages: list[dict]) -> str:
    """Format chat message dicts into a readable conversation log."""
    if not chat_messages:
        return ""

    lines = []
    for msg in chat_messages:
        role = msg.get("role", "unknown").capitalize()
        content = msg.get("content", "")
        lines.append(f"{role}: {content}")
    return "\n".join(lines)


def _build_fallback(preferences: list[dict]) -> dict[str, Any]:
    """Return a minimal profile when OpenAI fails."""
    scored = []
    for p in preferences:
        scored.append(
            {
                "category": p.get("category", "unknown"),
                "value": p.get("value", ""),
                "score": 5,
                "confidence": p.get("confidence", "low"),
                "notes": "Auto-scored (AI unavailable)",
            }
        )

    return {
        "scored_preferences": scored,
        "deal_breakers": [],
        "nice_to_haves": [],
        "budget_summary": "Unable to analyze budget — AI service unavailable.",
        "overall_readiness": "exploring",
        "profile_summary": (
            "Profile generated with fallback scoring. "
            "Re-run profile generation when the AI service is available "
            "for a more accurate analysis."
        ),
    }


# -- Public API ------------------------------------------------------------


async def generate_profile(
    preferences: list[dict],
    chat_messages: list[dict] | None = None,
) -> dict[str, Any]:
    """
    Generate a scored buyer profile from preferences and optional chat history.

    Returns:
        A dict matching the BuyerProfileResult schema.
        On error, returns a minimal fallback profile.
    """
    try:
        client = AsyncOpenAI(api_key=settings.openai_api_key)

        user_content = (
            "Here are the buyer's extracted preferences:\n\n"
            f"{_format_preferences(preferences)}"
        )

        if chat_messages:
            user_content += (
                "\n\nHere is the chat conversation for additional context:\n\n"
                f"{_format_chat_messages(chat_messages)}"
            )

        response = await client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            response_format=BuyerProfileResult,
        )

        parsed: BuyerProfileResult | None = response.choices[0].message.parsed

        if parsed is None:
            logger.warning("OpenAI returned None parsed result for profile generation")
            return _build_fallback(preferences)

        return {
            "scored_preferences": [sp.model_dump() for sp in parsed.scored_preferences],
            "deal_breakers": parsed.deal_breakers,
            "nice_to_haves": parsed.nice_to_haves,
            "budget_summary": parsed.budget_summary,
            "overall_readiness": parsed.overall_readiness,
            "profile_summary": parsed.profile_summary,
        }

    except Exception:
        logger.exception("Failed to generate buyer profile with OpenAI")
        return _build_fallback(preferences)
