"""
STT models module.

This module provides Pydantic models for Speech-to-Text API request/response validation.
"""

from pydantic import BaseModel, Field


class STTResponse(BaseModel):
    """
    Response model for /api/stt endpoint.

    Attributes:
        transcribed_text: The final transcribed text from audio
                         (processed_text preferred, raw_text as fallback)
    """

    transcribed_text: str = Field(
        ...,
        description="Transcribed text from audio",
        min_length=0
    )
