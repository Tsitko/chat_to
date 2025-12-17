"""
Configuration package for the chat_to application.

This package contains all configuration modules for the application.
"""

from .ollama_models import (
    CHAT_MODEL,
    EMBEDDINGS_INDEXER_MODEL,
    EMBEDDINGS_KB_MODEL,
)
from .server_config import (
    HOST,
    PORT,
    OLLAMA_URL,
    MAX_UPLOAD_SIZE,
    ALLOWED_BOOK_EXTENSIONS,
    ALLOWED_AVATAR_EXTENSIONS,
    DATA_DIR,
    CHARACTERS_DIR,
    BOOKS_DIR,
    AVATARS_DIR,
    CHROMA_DIR,
)
from .chunking_config import (
    CHUNK_SIZE,
    OVERLAP_PERCENTAGE,
    OVERLAP_SIZE,
)

__all__ = [
    "CHAT_MODEL",
    "EMBEDDINGS_INDEXER_MODEL",
    "EMBEDDINGS_KB_MODEL",
    "HOST",
    "PORT",
    "OLLAMA_URL",
    "MAX_UPLOAD_SIZE",
    "ALLOWED_BOOK_EXTENSIONS",
    "ALLOWED_AVATAR_EXTENSIONS",
    "DATA_DIR",
    "CHARACTERS_DIR",
    "BOOKS_DIR",
    "AVATARS_DIR",
    "CHROMA_DIR",
    "CHUNK_SIZE",
    "OVERLAP_PERCENTAGE",
    "OVERLAP_SIZE",
]
