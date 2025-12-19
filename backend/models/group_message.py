"""
Group message data models.

This module defines models for group chat operations where multiple characters
respond to a conversation sequentially.
"""

from typing import List, Optional
from pydantic import BaseModel, Field, validator, ConfigDict

# Direct imports (no TYPE_CHECKING to avoid forward ref issues)
try:
    from models.message import Message
    from models.emotions import Emotions
except ImportError:
    from .message import Message
    from .emotions import Emotions


class GroupMessageRequest(BaseModel):
    """
    Request model for group chat messages.

    Contains conversation history (messages) and list of character IDs that should respond.
    Frontend sends recent messages as context since group messages are in-memory only.
    """

    group_id: str = Field(
        ...,
        description="Group ID for message persistence"
    )
    messages: List[Message] = Field(
        ...,
        description="Recent conversation messages (user + assistant) for context"
    )
    character_ids: List[str] = Field(
        ...,
        description="List of character IDs that should respond to the message"
    )

    @validator('messages')
    def validate_messages(cls, v):
        """
        Validate messages list.

        Args:
            v: List of messages

        Returns:
            List[Message]: Validated messages

        Raises:
            ValueError: If list is empty
        """
        if not v:
            raise ValueError("messages cannot be empty")
        return v

    @validator('character_ids')
    def validate_character_ids(cls, v):
        """
        Validate character IDs list.

        Args:
            v: List of character IDs

        Returns:
            List[str]: Validated character IDs

        Raises:
            ValueError: If list is empty or contains duplicates
        """
        if not v:
            raise ValueError("character_ids cannot be empty")
        if len(v) != len(set(v)):
            raise ValueError("character_ids must be unique")
        return v


class CharacterResponse(BaseModel):
    """
    Response from a single character in a group chat.

    Contains the character's message content and any error information if the
    character failed to generate a response.
    """

    model_config = ConfigDict(arbitrary_types_allowed=True)

    character_id: str = Field(..., description="ID of the character")
    character_name: str = Field(..., description="Name of the character")
    message: Optional[str] = Field(
        None,
        description="Generated message content (None if character failed)"
    )
    emotions: Optional[Emotions] = Field(
        None,
        description="Detected emotions in the response"
    )
    error: Optional[str] = Field(
        None,
        description="Error message if character failed to respond"
    )


class GroupMessageStatistics(BaseModel):
    """Statistics about group message processing."""

    total_time_ms: Optional[float] = Field(None, description="Total processing time in milliseconds")
    successful_count: int = Field(..., description="Number of successful responses")
    failed_count: int = Field(..., description="Number of failed responses")


class GroupMessageResponse(BaseModel):
    """
    Response model for group chat messages.

    Contains all character responses and optional statistics.
    Responses are in the order they were generated (same as character_ids order).
    """

    model_config = ConfigDict(arbitrary_types_allowed=True)

    responses: List[CharacterResponse] = Field(
        ...,
        description="Responses from all characters in order"
    )
    statistics: Optional[GroupMessageStatistics] = Field(
        None,
        description="Optional statistics about the processing"
    )
