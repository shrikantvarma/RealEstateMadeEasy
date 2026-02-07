import uuid
from datetime import datetime

from sqlmodel import SQLModel


class SessionCreate(SQLModel):
    buyer_name: str | None = None


class SessionRead(SQLModel):
    id: uuid.UUID
    buyer_name: str | None
    summary: str | None
    status: str
    overall_confidence: float | None
    created_at: datetime
    updated_at: datetime


class TranscriptUpload(SQLModel):
    raw_text: str


class TranscriptRead(SQLModel):
    id: uuid.UUID
    session_id: uuid.UUID
    raw_text: str
    uploaded_at: datetime
