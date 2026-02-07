import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import Column, DateTime, String
from sqlmodel import Field, SQLModel


class ConfidenceLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class PreferenceSource(str, Enum):
    transcript = "transcript"
    chat = "chat"
    both = "both"


class Preference(SQLModel, table=True):
    __tablename__ = "preferences"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(foreign_key="sessions.id", index=True)
    category: str = Field(max_length=100)
    value: str
    # Store as VARCHAR, not native Postgres ENUM
    confidence: str = Field(
        default=ConfidenceLevel.low.value,
        sa_column=Column(String(20), nullable=False, server_default="low"),
    )
    source: str = Field(
        default=PreferenceSource.transcript.value,
        sa_column=Column(String(20), nullable=False, server_default="transcript"),
    )
    is_confirmed: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
