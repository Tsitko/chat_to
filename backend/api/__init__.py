"""
API package for the chat_to application.

This package contains all FastAPI route definitions.
"""

from .character_routes import router as character_router
from .book_routes import router as book_router
from .message_routes import router as message_router
from .indexing_routes import router as indexing_router
from .tts_routes import router as tts_router
from . import stt_routes
from .group_routes import router as group_router
from .group_message_routes import router as group_message_router

__all__ = [
    "character_router",
    "book_router",
    "message_router",
    "indexing_router",
    "tts_router",
    "stt_routes",
    "group_router",
    "group_message_router",
]
