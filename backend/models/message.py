"""
Message data model.

This module defines the Message model for chat operations.
"""

from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field
import uuid


class Message(BaseModel):
    """Message model representing a chat message."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


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
