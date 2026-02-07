import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class BuyerProfile(SQLModel, table=True):
    __tablename__ = "buyer_profiles"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(
        foreign_key="sessions.id", unique=True, index=True
    )
    scored_preferences: dict = Field(sa_column=Column(JSONB, nullable=False))
    generated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
