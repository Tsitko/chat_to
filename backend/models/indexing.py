"""
Indexing status data model.

This module defines models for indexing status tracking.
"""

from typing import Literal, List
from pydantic import BaseModel


class BookIndexingStatus(BaseModel):
    """Model representing indexing status of a single book."""

    book_id: str
    status: Literal["pending", "indexing", "completed", "failed"]
    progress: int  # 0-100


class IndexingStatusResponse(BaseModel):
    """Model for overall indexing status response."""

    books_indexing: List[BookIndexingStatus]
    overall_status: Literal["pending", "indexing", "completed", "failed"]
    total_books: int
    indexed_books: int
    in_progress: bool
