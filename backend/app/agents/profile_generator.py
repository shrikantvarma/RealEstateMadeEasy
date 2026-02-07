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
1. **Score every preference** on a 1-10 importance scale based on how \
   critical it is to the buyer. A score of 10 means non-negotiable; 1 means \
   barely mentioned.
2. **Assign confidence** ("low", "medium", "high") to each score based on \
   how clearly the buyer expressed the preference.
3. **Identify deal breakers** — items the buyer absolutely will not \
   compromise on (e.g., "must have 3+ bedrooms", "budget under $500k").
4. **Identify nice-to-haves** — things the buyer would like but can flex on \
   (e.g., "pool would be great", "prefer open floor plan").
5. **Summarize the budget situation** — what is their range, are they \
   pre-approved, any constraints?
6. **Assess overall buying readiness**:
   - "exploring" — just starting to look, unclear on many preferences
   - "active" — actively searching, knows what they want
   - "ready_to_buy" — urgent, clear preferences, ready to make offers
7. **Write a profile summary** — 2-3 sentences describing the ideal match \
   for this buyer, suitable for a real estate agent to use when searching \
   listings.

If preferences are sparse, do your best with what you have and note the \
gaps in the summary.
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
