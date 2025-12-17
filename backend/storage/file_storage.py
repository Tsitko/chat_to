"""
File storage manager for handling file operations.

This module provides functionality for storing and retrieving files (books, avatars).
Depends on: None (bottom layer)
"""

import os
import aiofiles
from typing import Optional
from pathlib import Path

from configs import DATA_DIR, CHARACTERS_DIR, BOOKS_DIR, AVATARS_DIR
from exceptions import StorageError


class FileStorage:
    """
    Manages file storage operations for characters, books, and avatars.

    This class handles all file system operations including saving, retrieving,
    and deleting files in the appropriate directories.
    """

    def __init__(self, base_dir: str = DATA_DIR):
        """
        Initialize the file storage manager.

        Args:
            base_dir: Base directory for all data storage

        Raises:
            StorageError: If base directory cannot be created
        """
        self.base_dir = Path(base_dir)
        self.characters_dir = self.base_dir / CHARACTERS_DIR
        self.books_dir = self.base_dir / BOOKS_DIR
        self.avatars_dir = self.base_dir / AVATARS_DIR

        # Create base directories
        try:
            self.base_dir.mkdir(parents=True, exist_ok=True)
            self.characters_dir.mkdir(parents=True, exist_ok=True)
            self.books_dir.mkdir(parents=True, exist_ok=True)
            self.avatars_dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            raise StorageError(f"Failed to create base directories: {str(e)}")

    async def save_avatar(self, character_id: str, file_content: bytes,
                         filename: str) -> str:
        """
        Save avatar file for a character.

        Args:
            character_id: Unique identifier of the character
            file_content: Binary content of the avatar file
            filename: Original filename with extension

        Returns:
            str: Path to the saved avatar file

        Raises:
            StorageError: If file save operation fails
        """
        try:
            char_dir = self.avatars_dir / character_id
            char_dir.mkdir(parents=True, exist_ok=True)

            file_path = char_dir / filename
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(file_content)

            return str(file_path)
        except Exception as e:
            raise StorageError(f"Failed to save avatar: {str(e)}")

    async def get_avatar_path(self, character_id: str) -> Optional[str]:
        """
        Get the path to a character's avatar file.

        Args:
            character_id: Unique identifier of the character

        Returns:
            Optional[str]: Path to avatar file if it exists, None otherwise
        """
        char_dir = self.avatars_dir / character_id
        if not char_dir.exists():
            return None

        # Find any avatar file in the directory
        for file_path in char_dir.iterdir():
            if file_path.is_file():
                return str(file_path)

        return None

    async def save_book(self, character_id: str, book_id: str,
                       file_content: bytes, filename: str) -> str:
        """
        Save book file for a character.

        Args:
            character_id: Unique identifier of the character
            book_id: Unique identifier of the book
            file_content: Binary content of the book file
            filename: Original filename with extension

        Returns:
            str: Path to the saved book file

        Raises:
            StorageError: If file save operation fails
        """
        try:
            char_books_dir = self.books_dir / character_id
            char_books_dir.mkdir(parents=True, exist_ok=True)

            # Use book_id + original extension to avoid conflicts
            ext = Path(filename).suffix
            file_path = char_books_dir / f"{book_id}{ext}"

            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(file_content)

            return str(file_path)
        except Exception as e:
            raise StorageError(f"Failed to save book: {str(e)}")

    async def get_book_path(self, character_id: str, book_id: str) -> Optional[str]:
        """
        Get the path to a specific book file.

        Args:
            character_id: Unique identifier of the character
            book_id: Unique identifier of the book

        Returns:
            Optional[str]: Path to book file if it exists, None otherwise
        """
        char_books_dir = self.books_dir / character_id
        if not char_books_dir.exists():
            return None

        # Find file with book_id prefix
        for file_path in char_books_dir.iterdir():
            if file_path.stem == book_id:
                return str(file_path)

        return None

    async def read_book_content(self, character_id: str, book_id: str) -> bytes:
        """
        Read and return the content of a book file.

        Args:
            character_id: Unique identifier of the character
            book_id: Unique identifier of the book

        Returns:
            bytes: Content of the book file

        Raises:
            StorageError: If file read operation fails
        """
        try:
            book_path = await self.get_book_path(character_id, book_id)
            if not book_path:
                raise StorageError(f"Book {book_id} not found for character {character_id}")

            async with aiofiles.open(book_path, 'rb') as f:
                return await f.read()
        except StorageError:
            raise
        except Exception as e:
            raise StorageError(f"Failed to read book content: {str(e)}")

    async def delete_book(self, character_id: str, book_id: str) -> None:
        """
        Delete a book file from storage.

        Args:
            character_id: Unique identifier of the character
            book_id: Unique identifier of the book

        Raises:
            StorageError: If file deletion fails
        """
        try:
            book_path = await self.get_book_path(character_id, book_id)
            if book_path:
                Path(book_path).unlink()
        except Exception as e:
            raise StorageError(f"Failed to delete book: {str(e)}")

    async def delete_character_data(self, character_id: str) -> None:
        """
        Delete all data for a character (avatar, books, etc.).

        Args:
            character_id: Unique identifier of the character

        Raises:
            StorageError: If directory deletion fails
        """
        try:
            import shutil

            # Delete books directory
            char_books_dir = self.books_dir / character_id
            if char_books_dir.exists():
                shutil.rmtree(char_books_dir)

            # Delete avatars directory
            char_avatar_dir = self.avatars_dir / character_id
            if char_avatar_dir.exists():
                shutil.rmtree(char_avatar_dir)

            # Delete character directory
            char_dir = self.characters_dir / character_id
            if char_dir.exists():
                shutil.rmtree(char_dir)
        except Exception as e:
            raise StorageError(f"Failed to delete character data: {str(e)}")

    def _ensure_directory(self, directory_path: str) -> None:
        """
        Ensure a directory exists, create if it doesn't.

        Args:
            directory_path: Path to the directory

        Raises:
            StorageError: If directory creation fails
        """
        try:
            Path(directory_path).mkdir(parents=True, exist_ok=True)
        except Exception as e:
            raise StorageError(f"Failed to create directory: {str(e)}")

    def get_character_directory(self, character_id: str) -> str:
        """
        Get the base directory path for a character's data.

        Args:
            character_id: Unique identifier of the character

        Returns:
            str: Path to character's directory
        """
        return str(self.characters_dir / character_id)
