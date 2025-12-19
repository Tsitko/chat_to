"""
STT exception module.

This module defines specific exception types for Speech-to-Text operations.
"""


class STTServiceUnavailableError(Exception):
    """
    Raised when STT service cannot be reached.

    This exception is used for connection errors, when the service is offline,
    or when the network is unavailable.
    """

    pass


class STTTimeoutError(Exception):
    """
    Raised when STT request exceeds timeout limit.

    This exception is used when the transcription request takes longer
    than the configured timeout (typically 300 seconds).
    """

    pass


class STTProcessingError(Exception):
    """
    Raised when STT service returns an error or processing fails.

    This exception is used for HTTP errors, invalid responses,
    or any other processing failures.
    """

    pass
