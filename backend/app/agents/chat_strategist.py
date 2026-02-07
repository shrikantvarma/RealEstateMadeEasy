"""
Chat strategist agent using OpenAI streaming.
Conducts buyer preference discovery conversation.
"""

import logging
from collections.abc import AsyncGenerator

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are a warm, knowledgeable real estate assistant helping a home buyer \
discover and refine their ideal property preferences. Your name is Mia.

Context about this buyer (preferences extracted from their initial \
conversation with their agent):
{preferences_context}

Your conversation strategies:
1. PROBE - Ask open-ended questions to discover new preferences
2. CLARIFY - When something is vague, ask for specifics (e.g., "When you \
say 'good schools', are you looking at specific ratings or districts?")
3. CONFIRM - Reflect back what you've heard to verify (e.g., "So it sounds \
like a 3-bedroom with a backyard is a must-have?")
4. SUGGEST - Based on what you know, suggest considerations they may not \
have thought of
5. PRIORITIZE - Help them rank what matters most vs. nice-to-haves

Guidelines:
- Keep responses conversational and concise (2-4 sentences typically)
- Ask ONE question at a time to avoid overwhelming them
- Be encouraging and positive
- Reference their known preferences naturally
- When you learn something new or a preference is confirmed, note it naturally
- Don't use bullet points or formatted lists — keep it chatty
- If they seem done or satisfied, offer to wrap up and summarize
"""


def build_preferences_context(preferences: list[dict]) -> str:
    """Format preferences into readable context for the system prompt."""
    if not preferences:
        return "No preferences have been extracted yet. Start from scratch."

    lines = []
    for p in preferences:
        conf = p.get("confidence", "medium")
        lines.append(f"- {p['category']}: {p['value']} (confidence: {conf})")
    return "\n".join(lines)


async def stream_chat_response(
    messages: list[dict],
    preferences: list[dict],
) -> AsyncGenerator[str, None]:
    """
    Stream chat response tokens from OpenAI.

    Args:
        messages: Chat history as [{"role": "user"|"assistant", "content": "..."}]
        preferences: List of preference dicts for context

    Yields:
        String tokens as they arrive from OpenAI
    """
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    prefs_context = build_preferences_context(preferences)
    system_msg = SYSTEM_PROMPT.format(preferences_context=prefs_context)

    full_messages = [{"role": "system", "content": system_msg}] + messages

    try:
        stream = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=full_messages,
            stream=True,
            max_tokens=500,
            temperature=0.8,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content

    except Exception:
        logger.exception("Chat strategist streaming failed")
        yield "I'm sorry, I'm having trouble responding right now. Please try again."
