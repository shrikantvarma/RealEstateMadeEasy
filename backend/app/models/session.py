import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import Column, DateTime, String
from sqlmodel import Field, SQLModel


class SessionStatus(str, Enum):
    parsing = "parsing"
    parsed = "parsed"
    chat_active = "chat_active"
    complete = "complete"


class Session(SQLModel, table=True):
    __tablename__ = "sessions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    buyer_name: str | None = Field(default=None, max_length=255)
    summary: str | None = Field(default=None, max_length=255)
    # Store as VARCHAR, not native Postgres ENUM
    status: str = Field(
        default=SessionStatus.parsing.value,
        sa_column=Column(String(20), nullable=False, server_default="parsing"),
    )
    overall_confidence: float | None = Field(default=None)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
