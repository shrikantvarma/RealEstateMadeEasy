import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import case
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.agents.transcript_parser import parse_transcript
from app.core.database import get_session
from app.models.preference import Preference
from app.models.session import Session, SessionStatus
from app.models.transcript import Transcript
from app.sessions.schemas import (
    PreferenceRead,
    SessionCreate,
    SessionRead,
    TranscriptUpload,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def api_response(data: Any = None, error: dict | None = None) -> dict:
    return {"data": data, "error": error}


@router.post("")
async def create_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_session),
) -> dict:
    session = Session(buyer_name=body.buyer_name, status=SessionStatus.parsing)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return api_response(data=SessionRead.model_validate(session).model_dump(mode="json"))


@router.get("")
async def list_sessions(
    db: AsyncSession = Depends(get_session),
) -> dict:
    result = await db.exec(
        select(Session).order_by(Session.created_at.desc())  # type: ignore[arg-type]
    )
    sessions = result.all()
    data = [
        SessionRead.model_validate(s).model_dump(mode="json") for s in sessions
    ]
    return api_response(data=data)


@router.get("/{session_id}")
async def get_session_detail(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
) -> dict:
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return api_response(data=SessionRead.model_validate(session).model_dump(mode="json"))


@router.post("/{session_id}/transcript")
async def upload_transcript(
    session_id: uuid.UUID,
    body: TranscriptUpload,
    db: AsyncSession = Depends(get_session),
) -> dict:
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if len(body.raw_text.strip()) < 100:
        return api_response(
            error={
                "code": "TRANSCRIPT_TOO_SHORT",
                "message": "Transcript seems too short. Paste the full conversation for best results.",
            }
        )

    transcript = Transcript(session_id=session_id, raw_text=body.raw_text)
    db.add(transcript)

    # Parse transcript with OpenAI agent to extract preferences
    result = await parse_transcript(body.raw_text)

    # Save each extracted preference to the database
    for pref in result["preferences"]:
        preference = Preference(
            session_id=session_id,
            category=pref["category"],
            value=pref["value"],
            confidence=pref["confidence"],
            source="transcript",
        )
        db.add(preference)

    # Update session with summary and status
    if result["summary"]:
        session.summary = result["summary"]
    session.status = SessionStatus.parsed
    session.updated_at = datetime.now(timezone.utc)
    db.add(session)

    await db.commit()
    await db.refresh(transcript)

    return api_response(
        data={
            "transcript_id": str(transcript.id),
            "session_id": str(session_id),
            "status": "parsed",
            "preferences_count": len(result["preferences"]),
        }
    )


@router.get("/{session_id}/preferences")
async def get_preferences(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_session),
) -> dict:
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Order by confidence (high first) then category alphabetically
    confidence_order = case(
        {"high": 0, "medium": 1, "low": 2},
        value=Preference.confidence,  # type: ignore[arg-type]
        else_=3,
    )

    result = await db.exec(
        select(Preference)
        .where(Preference.session_id == session_id)  # type: ignore[arg-type]
        .order_by(confidence_order, Preference.category)  # type: ignore[arg-type]
    )
    preferences = result.all()

    data = [
        PreferenceRead.model_validate(p).model_dump(mode="json") for p in preferences
    ]
    return api_response(data=data)
