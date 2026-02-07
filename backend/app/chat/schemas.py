import uuid
from datetime import datetime

from pydantic import BaseModel, model_validator


class ChatMessageSend(BaseModel):
    content: str


class ChatMessageRead(BaseModel):
    """Read schema returned in API responses for chat messages."""

    id: str
    role: str
    content: str
    strategy_used: str | None = None
    turn_number: int
    created_at: str

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def coerce_fields(cls, values: dict | object) -> dict:
        """Handle SQLModel objects: convert UUID to str, datetime to ISO."""
        # When from_attributes is True, values may be an ORM object
        if not isinstance(values, dict):
            data: dict = {}
            data["id"] = str(values.id) if isinstance(values.id, uuid.UUID) else values.id
            data["role"] = values.role
            data["content"] = values.content
            data["strategy_used"] = values.strategy_used
            data["turn_number"] = values.turn_number
            data["created_at"] = (
                values.created_at.isoformat()
                if isinstance(values.created_at, datetime)
                else values.created_at
            )
            return data

        # Already a dict — normalise UUID / datetime if present
        if isinstance(values.get("id"), uuid.UUID):
            values["id"] = str(values["id"])
        if isinstance(values.get("created_at"), datetime):
            values["created_at"] = values["created_at"].isoformat()
        return values
