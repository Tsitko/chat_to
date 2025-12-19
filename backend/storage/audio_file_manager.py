"""
Audio file manager module.

This module provides functionality for managing audio file storage, naming, and path resolution.
"""

import uuid
from pathlib import Path


class AudioFileManager:
    """
    Manages audio file storage, naming, and path resolution.

    Responsibilities:
    - Generate unique filenames using UUIDs
    - Ensure output directory exists
    - Resolve absolute paths for file storage
    - Resolve relative paths for API responses
    - Provide file existence checks
    """

    def __init__(self, output_dir):
        """
        Initialize AudioFileManager with output directory.

        Args:
            output_dir: Path or string path to directory for storing audio files
        """
        self.output_dir = Path(output_dir) if not isinstance(output_dir, Path) else output_dir

    def generate_audio_filepath(self) -> Path:
        """
        Generate unique absolute path for new audio file.

        Creates unique filename using UUID and ensures directory exists.

        Returns:
            Path: Absolute Path object (e.g., /path/to/data/audio/abc123.ogg)
        """
        self.ensure_directory_exists()
        filename = f"{uuid.uuid4()}.ogg"
        return self.output_dir / filename

    def get_relative_path(self, absolute_path: Path) -> str:
        """
        Convert absolute path to relative API path.

        Converts absolute path to URL-friendly relative path for frontend.

        Args:
            absolute_path: Absolute path to audio file

        Returns:
            str: Relative path like /audio/abc123.ogg for frontend
        """
        return f"/audio/{absolute_path.name}"

    def ensure_directory_exists(self) -> None:
        """
        Create output directory if missing.

        Creates directory and all parent directories if they don't exist.
        """
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def file_exists(self, filepath: Path) -> bool:
        """
        Check if audio file exists.

        Args:
            filepath: Path to audio file

        Returns:
            bool: True if file exists, False otherwise
        """
        return filepath.exists()

    def get_absolute_path(self, filename: str) -> Path:
        """
        Convert filename to absolute path.

        Sanitizes filename to prevent directory traversal attacks.

        Args:
            filename: Name of audio file

        Returns:
            Path: Absolute path to audio file
        """
        # Sanitize filename to prevent directory traversal and null bytes
        sanitized_filename = filename.replace('\x00', '')  # Remove null bytes
        safe_filename = Path(sanitized_filename).name  # Strips any path components
        return self.output_dir / safe_filename
