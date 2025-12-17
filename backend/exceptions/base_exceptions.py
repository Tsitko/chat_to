"""
Base exception classes for the chat_to application.

This module defines custom exception hierarchy for better error handling.
"""


class ChatToException(Exception):
    """Base exception for all chat_to application errors."""
    pass


class CharacterNotFoundError(ChatToException):
    """Raised when a character is not found."""
    pass


class BookNotFoundError(ChatToException):
    """Raised when a book is not found."""
    pass


class InvalidFileTypeError(ChatToException):
    """Raised when an invalid file type is uploaded."""
    pass


class FileSizeExceededError(ChatToException):
    """Raised when uploaded file exceeds size limit."""
    pass


class VectorDBError(ChatToException):
    """Raised when vector database operation fails."""
    pass


class EmbeddingError(ChatToException):
    """Raised when embedding generation fails."""
    pass


class LLMError(ChatToException):
    """Raised when LLM operation fails."""
    pass


class IndexingError(ChatToException):
    """Raised when document indexing fails."""
    pass


class StorageError(ChatToException):
    """Raised when file storage operation fails."""
    pass
