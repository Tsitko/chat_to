"""
Exceptions package for the chat_to application.
"""

from .base_exceptions import (
    ChatToException,
    CharacterNotFoundError,
    BookNotFoundError,
    InvalidFileTypeError,
    FileSizeExceededError,
    VectorDBError,
    EmbeddingError,
    LLMError,
    IndexingError,
    StorageError,
)

__all__ = [
    "ChatToException",
    "CharacterNotFoundError",
    "BookNotFoundError",
    "InvalidFileTypeError",
    "FileSizeExceededError",
    "VectorDBError",
    "EmbeddingError",
    "LLMError",
    "IndexingError",
    "StorageError",
]
