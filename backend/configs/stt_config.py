"""
STT configuration module.

This module provides configuration constants for the Speech-to-Text service integration.
"""

from typing import List

# STT service configuration
STT_SERVICE_URL: str = "http://localhost:8013"
STT_TIMEOUT: float = 300.0  # 5 minutes for LLM processing

# Audio file validation configuration
STT_MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10 MB
STT_ALLOWED_FORMATS: List[str] = [".webm", ".ogg", ".wav", ".mp3", ".m4a"]
