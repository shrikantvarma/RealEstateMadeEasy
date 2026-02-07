"""
Transcript parsing agent using OpenAI structured output.

Extracts buyer preferences from raw agent-buyer conversation transcripts
and returns structured preference data with confidence levels.
"""

import logging
from typing import Any

from openai import AsyncOpenAI
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are a real estate transcript analyzer. You read conversation transcripts \
between a real estate agent and a prospective home buyer and extract the \
buyer's stated and implied preferences.

Instructions:
- Extract ALL preferences the buyer mentions or implies, not just the top ones.
- Categories to look for include (but are not limited to):
  budget, location, bedrooms, bathrooms, property_type, style, square_footage, \
  lot_size, amenities, schools, commute, timeline, deal_breakers, \
  nice_to_haves, parking, neighborhood, age_of_home, condition, \
  outdoor_space, pets, hoa, financing, must_haves.
- Assign a confidence level to each preference:
  - "high": The buyer stated it explicitly and clearly (e.g., "We need at least 3 bedrooms").
  - "medium": The buyer implied or suggested it (e.g., "We have two kids" implies bedrooms >= 3).
  - "low": The preference is vague or uncertain (e.g., "Maybe somewhere on the west side?").
- For the value field, use a concise but complete description of the preference.
- Also produce a short 1-2 sentence summary of the buyer's overall needs.
- If the transcript is not a real estate conversation or contains no useful \
  preferences, return an empty preferences list and a summary saying so.
"""


# ── Pydantic models for OpenAI structured output ──────────────────────


class ExtractedPreference(BaseModel):
    category: str
    value: str
    confidence: str  # "low" | "medium" | "high"


class TranscriptParseResult(BaseModel):
    preferences: list[ExtractedPreference]
    summary: str


# ── Public API ─────────────────────────────────────────────────────────


async def parse_transcript(raw_text: str) -> dict[str, Any]:
    """
    Parse a raw transcript and return extracted preferences + summary.

    Returns:
        {"preferences": [{"category": ..., "value": ..., "confidence": ...}, ...],
         "summary": "..."}

    On any error, returns {"preferences": [], "summary": ""}.
    """
    try:
        client = AsyncOpenAI(api_key=settings.openai_api_key)

        response = await client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        "Extract all buyer preferences from the following "
                        "real estate transcript:\n\n"
                        f"{raw_text}"
                    ),
                },
            ],
            response_format=TranscriptParseResult,
        )

        parsed: TranscriptParseResult | None = response.choices[0].message.parsed

        if parsed is None:
            logger.warning("OpenAI returned None parsed result")
            return {"preferences": [], "summary": ""}

        return {
            "preferences": [p.model_dump() for p in parsed.preferences],
            "summary": parsed.summary,
        }

    except Exception:
        logger.exception("Failed to parse transcript with OpenAI")
        return {"preferences": [], "summary": ""}
