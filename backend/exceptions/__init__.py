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
    GroupNotFoundError,
    InvalidGroupDataError,
)
from .tts_exceptions import (
    TTSServiceUnavailableError,
    TTSTimeoutError,
    TTSProcessingError,
)
from .stt_exceptions import (
    STTServiceUnavailableError,
    STTTimeoutError,
    STTProcessingError,
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
    "GroupNotFoundError",
    "InvalidGroupDataError",
    "TTSServiceUnavailableError",
    "TTSTimeoutError",
    "TTSProcessingError",
    "STTServiceUnavailableError",
    "STTTimeoutError",
    "STTProcessingError",
]
