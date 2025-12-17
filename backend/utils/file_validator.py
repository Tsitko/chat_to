"""
File validation utility for checking uploaded files.

This module provides functionality for validating file types and sizes.
Depends on: configs
"""

from typing import Optional
from pathlib import Path

from configs import (
    ALLOWED_BOOK_EXTENSIONS,
    ALLOWED_AVATAR_EXTENSIONS,
    MAX_UPLOAD_SIZE,
)
from exceptions import InvalidFileTypeError, FileSizeExceededError


class FileValidator:
    """
    Validates uploaded files for type and size constraints.

    This class provides static methods for validating books and avatar files.
    """

    @staticmethod
    def validate_book(filename: str, file_size: int) -> None:
        """
        Validate a book file.

        Args:
            filename: Name of the file
            file_size: Size of the file in bytes

        Raises:
            InvalidFileTypeError: If file type is not allowed
            FileSizeExceededError: If file size exceeds limit
        """
        FileValidator.check_extension(filename, ALLOWED_BOOK_EXTENSIONS)
        FileValidator.check_file_size(file_size)

    @staticmethod
    def validate_avatar(filename: str, file_size: int) -> None:
        """
        Validate an avatar file.

        Args:
            filename: Name of the file
            file_size: Size of the file in bytes

        Raises:
            InvalidFileTypeError: If file type is not allowed
            FileSizeExceededError: If file size exceeds limit
        """
        FileValidator.check_extension(filename, ALLOWED_AVATAR_EXTENSIONS)
        FileValidator.check_file_size(file_size)

    @staticmethod
    def get_file_extension(filename: str) -> str:
        """
        Get the file extension from a filename.

        Args:
            filename: Name of the file

        Returns:
            str: File extension in lowercase (e.g., '.pdf')
        """
        return Path(filename).suffix.lower()

    @staticmethod
    def check_file_size(file_size: int, max_size: int = MAX_UPLOAD_SIZE) -> None:
        """
        Check if file size is within limits.

        Args:
            file_size: Size of the file in bytes
            max_size: Maximum allowed size in bytes

        Raises:
            FileSizeExceededError: If file size exceeds limit
        """
        if file_size > max_size:
            raise FileSizeExceededError(
                f"File size {file_size} bytes exceeds maximum allowed size {max_size} bytes"
            )

    @staticmethod
    def check_extension(filename: str, allowed_extensions: set) -> None:
        """
        Check if file extension is allowed.

        Args:
            filename: Name of the file
            allowed_extensions: Set of allowed extensions

        Raises:
            InvalidFileTypeError: If extension is not allowed
        """
        ext = FileValidator.get_file_extension(filename)
        if ext not in allowed_extensions:
            raise InvalidFileTypeError(
                f"File extension '{ext}' is not allowed. Allowed extensions: {allowed_extensions}"
            )
