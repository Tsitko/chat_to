"""
Message data model.

This module defines the Message model for chat operations.
"""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field
import uuid

from .emotions import Emotions


class Message(BaseModel):
    """Message model representing a chat message."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    character_id: Optional[str] = Field(default=None, description="ID of the character this message belongs to")
    character_name: Optional[str] = Field(default=None, description="Name of the character (for group chat display)")
    emotions: Optional[Emotions] = Field(default=None, description="Detected emotions (assistant messages only)")


class MessageCreate(BaseModel):
    """Model for creating a new message."""

    content: str


class MessageResponse(BaseModel):
    """Model for message response containing both user and assistant messages."""

    user_message: Message
    assistant_message: Message


class MessagesResponse(BaseModel):
    """Model for paginated messages response."""

    messages: list[Message]
    total: int
