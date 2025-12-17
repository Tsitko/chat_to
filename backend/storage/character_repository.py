"""
Character repository for database operations.

This module provides data access layer for character-related operations.
Depends on: SQLAlchemy (ORM)
"""

from typing import List, Optional, Union
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
import json

from models import Character, Book
from exceptions import CharacterNotFoundError, StorageError
from storage.database import CharacterDB, BookDB


class CharacterRepository:
    """
    Repository for character data persistence using SQLite.

    This class handles all database operations related to characters,
    including CRUD operations and relationship management with books.
    Supports both sync and async sessions.
    """

    def __init__(self, db_session: Union[Session, AsyncSession]):
        """
        Initialize the character repository.

        Args:
            db_session: SQLAlchemy database session (sync or async)
        """
        self.db = db_session
        self.is_async = isinstance(db_session, AsyncSession)

    async def _commit(self):
        """Commit transaction (handles both sync and async)."""
        if self.is_async:
            await self.db.commit()
        else:
            self.db.commit()

    async def _rollback(self):
        """Rollback transaction (handles both sync and async)."""
        if self.is_async:
            await self.db.rollback()
        else:
            self.db.rollback()

    async def _refresh(self, obj):
        """Refresh object (handles both sync and async)."""
        if self.is_async:
            await self.db.refresh(obj)
        else:
            self.db.refresh(obj)

    async def _execute(self, stmt):
        """Execute statement (handles both sync and async)."""
        if self.is_async:
            return await self.db.execute(stmt)
        else:
            return self.db.execute(stmt)

    async def _delete(self, obj):
        """Delete object (handles both sync and async)."""
        if self.is_async:
            await self.db.delete(obj)
        else:
            self.db.delete(obj)

    async def create_character(self, character: Character) -> Character:
        """
        Create a new character in the database.

        Args:
            character: Character model to persist

        Returns:
            Character: The created character with ID

        Raises:
            StorageError: If database operation fails
        """
        try:
            db_character = CharacterDB(
                id=character.id,
                name=character.name,
                avatar_url=character.avatar_url,
                created_at=character.created_at
            )
            self.db.add(db_character)
            await self._commit()
            await self._refresh(db_character)
            return await self._to_pydantic_character(db_character)
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to create character: {str(e)}")

    async def get_character_by_id(self, character_id: str) -> Optional[Character]:
        """
        Retrieve a character by ID.

        Args:
            character_id: Unique identifier of the character

        Returns:
            Optional[Character]: Character if found, None otherwise
        """
        from sqlalchemy.orm import selectinload

        stmt = select(CharacterDB).where(CharacterDB.id == character_id).options(
            selectinload(CharacterDB.books)
        )
        result = await self._execute(stmt)
        db_character = result.scalar_one_or_none()

        if db_character is None:
            return None

        return await self._to_pydantic_character(db_character)

    async def get_all_characters(self) -> List[Character]:
        """
        Retrieve all characters.

        Returns:
            List[Character]: List of all characters
        """
        from sqlalchemy.orm import selectinload

        stmt = select(CharacterDB).options(selectinload(CharacterDB.books))
        result = await self._execute(stmt)
        db_characters = result.scalars().all()

        return [await self._to_pydantic_character(char) for char in db_characters]

    async def update_character(self, character_id: str, name: Optional[str] = None,
                              avatar_url: Optional[str] = None) -> Character:
        """
        Update character information.

        Args:
            character_id: Unique identifier of the character
            name: New name for the character (optional)
            avatar_url: New avatar URL (optional)

        Returns:
            Character: Updated character

        Raises:
            CharacterNotFoundError: If character doesn't exist
            StorageError: If database operation fails
        """
        try:
            from sqlalchemy.orm import selectinload

            stmt = select(CharacterDB).where(CharacterDB.id == character_id).options(
                selectinload(CharacterDB.books)
            )
            result = await self._execute(stmt)
            db_character = result.scalar_one_or_none()

            if db_character is None:
                raise CharacterNotFoundError(f"Character {character_id} not found")

            if name is not None:
                db_character.name = name
            if avatar_url is not None:
                db_character.avatar_url = avatar_url

            await self._commit()
            await self._refresh(db_character)
            return await self._to_pydantic_character(db_character)
        except CharacterNotFoundError:
            raise
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to update character: {str(e)}")

    async def delete_character(self, character_id: str) -> None:
        """
        Delete a character from the database.

        Args:
            character_id: Unique identifier of the character

        Raises:
            CharacterNotFoundError: If character doesn't exist
            StorageError: If database operation fails
        """
        try:
            stmt = select(CharacterDB).where(CharacterDB.id == character_id)
            result = await self._execute(stmt)
            db_character = result.scalar_one_or_none()

            if db_character is None:
                raise CharacterNotFoundError(f"Character {character_id} not found")

            await self._delete(db_character)
            await self._commit()
        except CharacterNotFoundError:
            raise
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to delete character: {str(e)}")

    async def add_book_to_character(self, character_id: str, book: Book) -> Character:
        """
        Add a book to a character's knowledge base.

        Args:
            character_id: Unique identifier of the character
            book: Book model to add

        Returns:
            Character: Updated character with new book

        Raises:
            CharacterNotFoundError: If character doesn't exist
            StorageError: If database operation fails
        """
        try:
            # Verify character exists
            character = await self.get_character_by_id(character_id)
            if character is None:
                raise CharacterNotFoundError(f"Character {character_id} not found")

            # Create book in database
            db_book = BookDB(
                id=book.id,
                character_id=character_id,
                filename=book.filename,
                file_size=book.file_size,
                uploaded_at=book.uploaded_at,
                indexed=book.indexed
            )
            self.db.add(db_book)
            await self._commit()

            # Return updated character
            return await self.get_character_by_id(character_id)
        except CharacterNotFoundError:
            raise
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to add book to character: {str(e)}")

    async def remove_book_from_character(self, character_id: str,
                                        book_id: str) -> Character:
        """
        Remove a book from a character's knowledge base.

        Args:
            character_id: Unique identifier of the character
            book_id: Unique identifier of the book

        Returns:
            Character: Updated character

        Raises:
            CharacterNotFoundError: If character doesn't exist
            StorageError: If database operation fails
        """
        try:
            # Verify character exists
            character = await self.get_character_by_id(character_id)
            if character is None:
                raise CharacterNotFoundError(f"Character {character_id} not found")

            # Delete book from database
            stmt = delete(BookDB).where(
                BookDB.id == book_id,
                BookDB.character_id == character_id
            )
            await self._execute(stmt)
            await self._commit()

            # Return updated character
            return await self.get_character_by_id(character_id)
        except CharacterNotFoundError:
            raise
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to remove book from character: {str(e)}")

    async def update_book_indexing_status(self, character_id: str, book_id: str,
                                         indexed: bool) -> None:
        """
        Update the indexing status of a book.

        Args:
            character_id: Unique identifier of the character
            book_id: Unique identifier of the book
            indexed: New indexing status

        Raises:
            CharacterNotFoundError: If character doesn't exist
            StorageError: If database operation fails
        """
        try:
            stmt = select(BookDB).where(
                BookDB.id == book_id,
                BookDB.character_id == character_id
            )
            result = await self._execute(stmt)
            db_book = result.scalar_one_or_none()

            if db_book is None:
                raise CharacterNotFoundError(f"Book {book_id} not found for character {character_id}")

            db_book.indexed = indexed
            await self._commit()
        except CharacterNotFoundError:
            raise
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to update book indexing status: {str(e)}")

    async def create_book(self, book: Book) -> Book:
        """
        Create a new book in the database.

        Args:
            book: Book model to persist

        Returns:
            Book: The created book

        Raises:
            StorageError: If database operation fails
        """
        try:
            db_book = BookDB(
                id=book.id,
                character_id=book.character_id,
                filename=book.filename,
                file_size=book.file_size,
                uploaded_at=book.uploaded_at,
                indexed=book.indexed
            )
            self.db.add(db_book)
            await self._commit()
            await self._refresh(db_book)
            return Book(
                id=db_book.id,
                character_id=db_book.character_id,
                filename=db_book.filename,
                file_size=db_book.file_size,
                uploaded_at=db_book.uploaded_at,
                indexed=db_book.indexed
            )
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to create book: {str(e)}")

    async def update_character_name(self, character_id: str, name: str) -> None:
        """
        Update a character's name.

        Args:
            character_id: Unique identifier of the character
            name: New name for the character

        Raises:
            CharacterNotFoundError: If character doesn't exist
            StorageError: If database operation fails
        """
        try:
            stmt = select(CharacterDB).where(CharacterDB.id == character_id)
            result = await self._execute(stmt)
            db_character = result.scalar_one_or_none()

            if db_character is None:
                raise CharacterNotFoundError(f"Character {character_id} not found")

            db_character.name = name
            await self._commit()
        except CharacterNotFoundError:
            raise
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to update character name: {str(e)}")

    async def get_books_by_character(self, character_id: str) -> List[Book]:
        """
        Get all books for a character.

        Args:
            character_id: Unique identifier of the character

        Returns:
            List[Book]: List of books

        Raises:
            CharacterNotFoundError: If character doesn't exist
        """
        try:
            stmt = select(BookDB).where(BookDB.character_id == character_id)
            result = await self._execute(stmt)
            db_books = result.scalars().all()

            return [
                Book(
                    id=book.id,
                    character_id=book.character_id,
                    filename=book.filename,
                    file_size=book.file_size,
                    uploaded_at=book.uploaded_at,
                    indexed=book.indexed
                )
                for book in db_books
            ]
        except Exception as e:
            raise StorageError(f"Failed to get books for character: {str(e)}")

    async def mark_book_indexed(self, book_id: str) -> None:
        """
        Mark a book as indexed.

        Args:
            book_id: Unique identifier of the book

        Raises:
            StorageError: If database operation fails
        """
        try:
            stmt = select(BookDB).where(BookDB.id == book_id)
            result = await self._execute(stmt)
            db_book = result.scalar_one_or_none()

            if db_book is None:
                raise StorageError(f"Book {book_id} not found")

            db_book.indexed = True
            await self._commit()
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to mark book as indexed: {str(e)}")

    async def get_book_by_id(self, book_id: str) -> Optional[Book]:
        """
        Get a book by ID.

        Args:
            book_id: Unique identifier of the book

        Returns:
            Optional[Book]: Book if found, None otherwise
        """
        try:
            stmt = select(BookDB).where(BookDB.id == book_id)
            result = await self._execute(stmt)
            db_book = result.scalar_one_or_none()

            if db_book is None:
                return None

            return Book(
                id=db_book.id,
                character_id=db_book.character_id,
                filename=db_book.filename,
                file_size=db_book.file_size,
                uploaded_at=db_book.uploaded_at,
                indexed=db_book.indexed
            )
        except Exception as e:
            raise StorageError(f"Failed to get book: {str(e)}")

    async def delete_book(self, book_id: str) -> None:
        """
        Delete a book from the database.

        Args:
            book_id: Unique identifier of the book

        Raises:
            StorageError: If database operation fails
        """
        try:
            from sqlalchemy import delete as sql_delete

            stmt = sql_delete(BookDB).where(BookDB.id == book_id)
            await self._execute(stmt)
            await self._commit()
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to delete book: {str(e)}")

    async def _to_pydantic_character(self, db_character: CharacterDB) -> Character:
        """
        Convert SQLAlchemy model to Pydantic model.

        Args:
            db_character: SQLAlchemy Character model

        Returns:
            Character: Pydantic Character model
        """
        books = [
            Book(
                id=book.id,
                character_id=book.character_id,
                filename=book.filename,
                file_size=book.file_size,
                uploaded_at=book.uploaded_at,
                indexed=book.indexed
            )
            for book in db_character.books
        ]

        return Character(
            id=db_character.id,
            name=db_character.name,
            avatar_url=db_character.avatar_url,
            created_at=db_character.created_at,
            books=books
        )
