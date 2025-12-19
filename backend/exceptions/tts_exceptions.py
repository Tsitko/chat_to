"""
TTS exceptions module.

This module provides custom exception classes for TTS-specific error handling.
"""


class TTSServiceUnavailableError(Exception):
    """Raised when TTS service cannot be reached."""
    pass


class TTSTimeoutError(Exception):
    """Raised when TTS request exceeds timeout limit."""
    pass


class TTSProcessingError(Exception):
    """Raised when TTS service returns an error."""
    pass
