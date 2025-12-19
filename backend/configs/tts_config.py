"""
TTS configuration module.

This module provides configuration constants for the Text-to-Speech service integration.
"""

from pathlib import Path

# TTS service configuration
TTS_SERVICE_URL: str = "http://localhost:8013"
TTS_TIMEOUT: float = 300.0  # 5 minutes for LLM processing

# Audio storage configuration
TTS_OUTPUT_DIR: Path = Path(__file__).parent.parent / "data" / "audio"
TTS_MAX_TEXT_LENGTH: int = 10_000  # Maximum characters for TTS input
