"""
Group data models.

This module defines the Group model for database and API operations.
Follows the same pattern as Character model.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, validator
import uuid
import json


class Group(BaseModel):
    """
    Group model representing a chat group with multiple characters.

    A group contains multiple characters that can participate in conversations.
    Each group has a name, avatar, and list of character IDs.
    """

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., description="Group name")
    character_ids: List[str] = Field(
        default_factory=list,
        description="List of character IDs in the group"
    )
    avatar_url: Optional[str] = Field(
        None,
        description="URL to group avatar image"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @validator('name')
    def validate_name(cls, v):
        """
        Validate group name is not empty.

        Args:
            v: Group name value

        Returns:
            str: Validated group name

        Raises:
            ValueError: If name is empty or whitespace only
        """
        if not v or not v.strip():
            raise ValueError("Group name cannot be empty")
        return v.strip()

    @validator('character_ids', always=True)
    def validate_character_ids(cls, v):
        """
        Validate character IDs list.

        Args:
            v: List of character IDs

        Returns:
            List[str]: Validated character IDs

        Raises:
            ValueError: If list has less than 2 characters or contains duplicates
        """
        if len(v) < 2:
            raise ValueError("Group must have at least 2 characters")
        if len(v) != len(set(v)):
            raise ValueError("Character IDs must be unique")
        return v


class GroupCreate(BaseModel):
    """
    Model for creating a new group.

    Used in POST /api/groups/ endpoint.
    Avatar is uploaded separately as multipart/form-data.
    """

    name: str = Field(..., description="Group name")
    character_ids: List[str] = Field(
        ...,
        description="List of character IDs (minimum 2)"
    )

    @validator('name')
    def validate_name(cls, v):
        """
        Validate group name is not empty.

        Args:
            v: Group name value

        Returns:
            str: Validated group name

        Raises:
            ValueError: If name is empty or whitespace only
        """
        if not v or not v.strip():
            raise ValueError("Group name cannot be empty")
        return v.strip()

    @validator('character_ids', always=True)
    def validate_character_ids(cls, v):
        """
        Validate character IDs list.

        Args:
            v: List of character IDs

        Returns:
            List[str]: Validated character IDs

        Raises:
            ValueError: If list has less than 2 characters or contains duplicates
        """
        if len(v) < 2:
            raise ValueError("Group must have at least 2 characters")
        if len(v) != len(set(v)):
            raise ValueError("Character IDs must be unique")
        return v


class GroupUpdate(BaseModel):
    """
    Model for updating an existing group.

    Used in PUT /api/groups/{id} endpoint.
    All fields are optional - only provided fields will be updated.
    """

    name: Optional[str] = Field(None, description="New group name")
    character_ids: Optional[List[str]] = Field(
        None,
        description="New list of character IDs"
    )

    @validator('name')
    def validate_name(cls, v):
        """
        Validate group name if provided.

        Args:
            v: Group name value

        Returns:
            Optional[str]: Validated group name or None

        Raises:
            ValueError: If name is empty or whitespace only
        """
        if v is not None:
            if not v or not v.strip():
                raise ValueError("Group name cannot be empty")
            return v.strip()
        return v

    @validator('character_ids')
    def validate_character_ids(cls, v):
        """
        Validate character IDs list if provided.

        Args:
            v: List of character IDs

        Returns:
            Optional[List[str]]: Validated character IDs or None

        Raises:
            ValueError: If list has less than 2 characters or contains duplicates
        """
        if v is not None:
            if len(v) < 2:
                raise ValueError("Group must have at least 2 characters")
            if len(v) != len(set(v)):
                raise ValueError("Character IDs must be unique")
        return v
