"""
TTS models module.

This module provides Pydantic models for TTS API request and response validation.
"""

from pydantic import BaseModel, Field


class TTSRequest(BaseModel):
    """Request model for TTS synthesis."""

    text: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Text to synthesize into speech"
    )


class TTSResponse(BaseModel):
    """Response model for TTS synthesis."""

    audio_path: str = Field(
        ...,
        description="Relative path to synthesized audio file"
    )
