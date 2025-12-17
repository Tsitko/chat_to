"""
Character data model.

This module defines the Character model for database and API operations.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
import uuid


class Book(BaseModel):
    """Book model representing a book in character's knowledge base."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    character_id: str
    filename: str
    file_size: int
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    indexed: bool = False


class Character(BaseModel):
    """Character model representing a historical figure."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    avatar_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    books: List[Book] = Field(default_factory=list)


class CharacterCreate(BaseModel):
    """Model for creating a new character."""

    name: str


class CharacterUpdate(BaseModel):
    """Model for updating an existing character."""

    name: Optional[str] = None
