"""
API package for the chat_to application.

This package contains all FastAPI route definitions.
"""

from .character_routes import router as character_router
from .book_routes import router as book_router
from .message_routes import router as message_router
from .indexing_routes import router as indexing_router

__all__ = [
    "character_router",
    "book_router",
    "message_router",
    "indexing_router",
]
