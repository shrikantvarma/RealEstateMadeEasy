import json
import uuid
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.agents.chat_strategist import stream_chat_response
from app.chat.schemas import ChatMessageRead, ChatMessageSend
from app.core.database import async_session, get_session
from app.models.chat_message import ChatMessage
from app.models.preference import Preference
from app.models.session import Session, SessionStatus

router = APIRouter(prefix="/api/chat", tags=["chat"])


def api_response(data: Any = None, error: dict | None = None) -> dict:
    return {"data": data, "error": error}


# ── GET  /api/chat/{session_id}/messages ─────────────────────────────


@router.get("/{session_id}/messages")
async def get_messages(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
) -> dict:
    """Return the full chat history for a session, ordered by turn number."""
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    result = await db.exec(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)  # type: ignore[arg-type]
        .order_by(ChatMessage.turn_number, ChatMessage.created_at)  # type: ignore[arg-type]
    )
    messages = result.all()

    data = [
        ChatMessageRead.model_validate(m).model_dump(mode="json") for m in messages
    ]
    return api_response(data=data)


# ── POST /api/chat/{session_id}/messages ─────────────────────────────


async def _stream_and_save(
    session_id: uuid.UUID,
    messages_for_openai: list[dict],
    preferences: list[dict],
    turn_number: int,
) -> AsyncGenerator[str, None]:
    """SSE generator that streams tokens and saves the complete assistant message."""
    full_response: list[str] = []

    async for token in stream_chat_response(messages_for_openai, preferences):
        full_response.append(token)
        event = json.dumps({"type": "token", "content": token})
        yield f"data: {event}\n\n"

    # Save assistant message to DB using its own session
    complete_text = "".join(full_response)
    async with async_session() as db:
        assistant_msg = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=complete_text,
            turn_number=turn_number,
        )
        db.add(assistant_msg)
        await db.commit()
        await db.refresh(assistant_msg)

        done_event = json.dumps(
            {"type": "done", "message_id": str(assistant_msg.id)}
        )
        yield f"data: {done_event}\n\n"


@router.post("/{session_id}/messages")
async def send_message(
    session_id: uuid.UUID,
    body: ChatMessageSend,
    db: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    """
    Accept a user message and stream the AI assistant response via SSE.

    Flow:
    1. Validate session exists; flip status to chat_active if needed.
    2. Determine turn_number from existing message count.
    3. Persist the user message.
    4. Load preferences and chat history for OpenAI context.
    5. Return a StreamingResponse that streams tokens, then saves the
       assistant message and emits a final "done" event.
    """
    # 1. Validate session
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Flip status to chat_active on the first message
    if session.status in (SessionStatus.parsed.value, SessionStatus.parsing.value):
        session.status = SessionStatus.chat_active.value
        session.updated_at = datetime.now(timezone.utc)
        db.add(session)

    # 2. Count existing messages to determine turn_number
    count_result = await db.exec(
        select(func.count()).where(ChatMessage.session_id == session_id)  # type: ignore[arg-type]
    )
    existing_count: int = count_result.one()
    user_turn = existing_count + 1
    assistant_turn = existing_count + 2

    # 3. Save user message
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=body.content,
        turn_number=user_turn,
    )
    db.add(user_msg)
    await db.commit()
    await db.refresh(user_msg)

    # 4a. Load preferences for context
    pref_result = await db.exec(
        select(Preference).where(Preference.session_id == session_id)  # type: ignore[arg-type]
    )
    preferences_rows = pref_result.all()
    preferences: list[dict] = [
        {
            "category": p.category,
            "value": p.value,
            "confidence": p.confidence,
        }
        for p in preferences_rows
    ]

    # 4b. Load full chat history (including the message we just saved)
    history_result = await db.exec(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)  # type: ignore[arg-type]
        .order_by(ChatMessage.turn_number, ChatMessage.created_at)  # type: ignore[arg-type]
    )
    history = history_result.all()
    messages_for_openai: list[dict] = [
        {"role": m.role, "content": m.content} for m in history
    ]

    # 5. Return SSE streaming response
    return StreamingResponse(
        _stream_and_save(
            session_id=session_id,
            messages_for_openai=messages_for_openai,
            preferences=preferences,
            turn_number=assistant_turn,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
