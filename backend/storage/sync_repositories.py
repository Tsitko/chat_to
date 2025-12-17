"""
Synchronous repository wrappers for testing.

This module provides async-interface repositories that use sync SQLite internally.
This enables testing with sync SQLite and FastAPI TestClient while maintaining
the same async interface as the production async repositories.
"""

from typing import List, Optional
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from models import Character, Book, Message
from exceptions import CharacterNotFoundError, StorageError
from storage.database import CharacterDB, BookDB, MessageDB


class SyncCharacterRepository:
    """
    Async-interface repository using sync SQLite for testing.

    This repository has async methods but uses sync SQLite operations internally.
    This allows FastAPI's TestClient to work with sync databases while maintaining
    the same interface as async repositories.
    """

    def __init__(self, db_session: Session):
        """
        Initialize the sync character repository.

        Args:
            db_session: Sync SQLAlchemy database session
        """
        self.db = db_session

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
            self.db.commit()
            self.db.refresh(db_character)
            return self._to_pydantic_character(db_character)
        except Exception as e:
            self.db.rollback()
            raise StorageError(f"Failed to create character: {str(e)}")

    async def get_character_by_id(self, character_id: str) -> Optional[Character]:
        """
        Retrieve a character by ID.

        Args:
            character_id: Unique identifier of the character

        Returns:
            Optional[Character]: Character if found, None otherwise
        """
        stmt = select(CharacterDB).where(CharacterDB.id == character_id).options(
            selectinload(CharacterDB.books)
        )
        result = self.db.execute(stmt)
        db_character = result.scalar_one_or_none()

        if db_character is None:
            return None

        return self._to_pydantic_character(db_character)

    async def get_all_characters(self) -> List[Character]:
        """
        Retrieve all characters.

        Returns:
            List[Character]: List of all characters
        """
        stmt = select(CharacterDB).options(selectinload(CharacterDB.books))
        result = self.db.execute(stmt)
        db_characters = result.scalars().all()

        return [self._to_pydantic_character(char) for char in db_characters]

    async def update_character_name(self, character_id: str, name: str) -> None:
        """
        Update a character's name.

        Args:
            character_id: Unique identifier of the character
            name: New name

        Raises:
            CharacterNotFoundError: If character doesn't exist
        """
        stmt = select(CharacterDB).where(CharacterDB.id == character_id)
        result = self.db.execute(stmt)
        db_character = result.scalar_one_or_none()

        if db_character is None:
            raise CharacterNotFoundError(f"Character with id {character_id} not found")

        db_character.name = name

        try:
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise StorageError(f"Failed to update character name: {str(e)}")

    async def update_character(
        self, character_id: str, name: Optional[str] = None, avatar_url: Optional[str] = None
    ) -> Character:
        """
        Update a character's details.

        Args:
            character_id: Unique identifier of the character
            name: New name (if provided)
            avatar_url: New avatar URL (if provided)

        Returns:
            Character: Updated character

        Raises:
            CharacterNotFoundError: If character doesn't exist
        """
        stmt = select(CharacterDB).where(CharacterDB.id == character_id).options(
            selectinload(CharacterDB.books)
        )
        result = self.db.execute(stmt)
        db_character = result.scalar_one_or_none()

        if db_character is None:
            raise CharacterNotFoundError(f"Character with id {character_id} not found")

        if name is not None:
            db_character.name = name
        if avatar_url is not None:
            db_character.avatar_url = avatar_url

        try:
            self.db.commit()
            self.db.refresh(db_character)
            return self._to_pydantic_character(db_character)
        except Exception as e:
            self.db.rollback()
            raise StorageError(f"Failed to update character: {str(e)}")

    async def delete_character(self, character_id: str) -> None:
        """
        Delete a character from the database.

        Args:
            character_id: Unique identifier of the character

        Raises:
            CharacterNotFoundError: If character doesn't exist
        """
        stmt = select(CharacterDB).where(CharacterDB.id == character_id)
        result = self.db.execute(stmt)
        db_character = result.scalar_one_or_none()

        if db_character is None:
            raise CharacterNotFoundError(f"Character with id {character_id} not found")

        try:
            self.db.delete(db_character)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise StorageError(f"Failed to delete character: {str(e)}")

    async def add_book_to_character(self, character_id: str, book: Book) -> Character:
        """
        Add a book to a character.

        Args:
            character_id: Unique identifier of the character
            book: Book to add

        Returns:
            Character: Updated character with new book

        Raises:
            CharacterNotFoundError: If character doesn't exist
        """
        stmt = select(CharacterDB).where(CharacterDB.id == character_id).options(
            selectinload(CharacterDB.books)
        )
        result = self.db.execute(stmt)
        db_character = result.scalar_one_or_none()

        if db_character is None:
            raise CharacterNotFoundError(f"Character with id {character_id} not found")

        db_book = BookDB(
            id=book.id,
            character_id=character_id,
            filename=book.filename,
            file_size=book.file_size,
            uploaded_at=book.uploaded_at,
            indexed=book.indexed
        )

        try:
            self.db.add(db_book)
            self.db.commit()
            self.db.refresh(db_character)
            return self._to_pydantic_character(db_character)
        except Exception as e:
            self.db.rollback()
            raise StorageError(f"Failed to add book to character: {str(e)}")

    async def remove_book_from_character(self, character_id: str, book_id: str) -> Character:
        """
        Remove a book from a character.

        Args:
            character_id: Unique identifier of the character
            book_id: Unique identifier of the book to remove

        Returns:
            Character: Updated character without the book

        Raises:
            CharacterNotFoundError: If character doesn't exist
        """
        # Check character exists
        stmt = select(CharacterDB).where(CharacterDB.id == character_id).options(
            selectinload(CharacterDB.books)
        )
        result = self.db.execute(stmt)
        db_character = result.scalar_one_or_none()

        if db_character is None:
            raise CharacterNotFoundError(f"Character with id {character_id} not found")

        # Delete book
        book_stmt = select(BookDB).where(
            BookDB.id == book_id, BookDB.character_id == character_id
        )
        book_result = self.db.execute(book_stmt)
        db_book = book_result.scalar_one_or_none()

        if db_book is None:
            raise StorageError(f"Book {book_id} not found for character {character_id}")

        try:
            self.db.delete(db_book)
            self.db.commit()
            self.db.refresh(db_character)
            return self._to_pydantic_character(db_character)
        except Exception as e:
            self.db.rollback()
            raise StorageError(f"Failed to remove book from character: {str(e)}")

    async def create_book(self, book: Book) -> Book:
        """
        Create a new book record in the database.

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
            self.db.commit()
            self.db.refresh(db_book)

            return Book(
                id=db_book.id,
                character_id=db_book.character_id,
                filename=db_book.filename,
                file_size=db_book.file_size,
                uploaded_at=db_book.uploaded_at,
                indexed=db_book.indexed
            )
        except Exception as e:
            self.db.rollback()
            raise StorageError(f"Failed to create book: {str(e)}")

    async def update_book_indexed_status(self, book_id: str, indexed: bool) -> None:
        """
        Update the indexed status of a book.

        Args:
            book_id: Unique identifier of the book
            indexed: New indexed status
        """
        stmt = select(BookDB).where(BookDB.id == book_id)
        result = self.db.execute(stmt)
        db_book = result.scalar_one_or_none()

        if db_book is None:
            raise StorageError(f"Book {book_id} not found")

        db_book.indexed = indexed

        try:
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise StorageError(f"Failed to update book indexed status: {str(e)}")

    def _to_pydantic_character(self, db_character: CharacterDB) -> Character:
        """
        Convert SQLAlchemy model to Pydantic model.

        Args:
            db_character: SQLAlchemy character model

        Returns:
            Character: Pydantic character model
        """
        books = [
            Book(
                id=book.id,
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


class SyncMessageRepository:
    """
    Synchronous repository for message data persistence.

    This is a sync version of MessageRepository for use in tests.
    """

    def __init__(self, db_session: Session):
        """
        Initialize the sync message repository.

        Args:
            db_session: Sync SQLAlchemy database session
        """
        self.db = db_session

    async def save_message(self, character_id: str, message: Message) -> Message:
        """
        Save a message to the database.

        Args:
            character_id: ID of the character this message belongs to
            message: Message to save

        Returns:
            Message: Saved message with ID

        Raises:
            StorageError: If database operation fails
        """
        try:
            db_message = MessageDB(
                id=message.id,
                character_id=character_id,
                role=message.role,
                content=message.content,
                created_at=message.created_at
            )
            self.db.add(db_message)
            self.db.commit()
            self.db.refresh(db_message)
            return self._to_pydantic_message(db_message)
        except Exception as e:
            self.db.rollback()
            raise StorageError(f"Failed to save message: {str(e)}")

    async def create_message(self, character_id: str, message: Message) -> Message:
        """
        Create a message (alias for save_message for compatibility).

        Args:
            character_id: ID of the character this message belongs to
            message: Message to create

        Returns:
            Message: Created message with ID

        Raises:
            StorageError: If database operation fails
        """
        return await self.save_message(character_id, message)

    async def get_messages(
        self, character_id: str, limit: int = 10, offset: int = 0
    ) -> tuple[List[Message], int]:
        """
        Retrieve messages for a character with pagination.

        Args:
            character_id: ID of the character
            limit: Maximum number of messages to return
            offset: Number of messages to skip

        Returns:
            tuple[List[Message], int]: Tuple of (messages, total_count)
        """
        # Get total count
        count_stmt = select(MessageDB).where(MessageDB.character_id == character_id)
        total = len(self.db.execute(count_stmt).scalars().all())

        # Get paginated messages
        stmt = (
            select(MessageDB)
            .where(MessageDB.character_id == character_id)
            .order_by(MessageDB.created_at)
            .limit(limit)
            .offset(offset)
        )
        result = self.db.execute(stmt)
        db_messages = result.scalars().all()

        messages = [self._to_pydantic_message(msg) for msg in db_messages]
        return messages, total

    async def get_messages_by_character(
        self, character_id: str, limit: int = 10, offset: int = 0
    ) -> List[Message]:
        """
        Retrieve messages for a character with pagination.

        Args:
            character_id: ID of the character
            limit: Maximum number of messages to return
            offset: Number of messages to skip

        Returns:
            List[Message]: List of messages
        """
        stmt = (
            select(MessageDB)
            .where(MessageDB.character_id == character_id)
            .order_by(MessageDB.created_at)
            .limit(limit)
            .offset(offset)
        )
        result = self.db.execute(stmt)
        db_messages = result.scalars().all()

        return [self._to_pydantic_message(msg) for msg in db_messages]

    async def count_messages_by_character(self, character_id: str) -> int:
        """
        Count total messages for a character.

        Args:
            character_id: ID of the character

        Returns:
            int: Total count of messages
        """
        from sqlalchemy import func
        stmt = select(func.count()).select_from(MessageDB).where(MessageDB.character_id == character_id)
        result = self.db.execute(stmt)
        return result.scalar() or 0

    async def get_recent_messages(self, character_id: str, count: int = 10) -> List[Message]:
        """
        Get the most recent messages for a character.

        Args:
            character_id: ID of the character
            count: Number of recent messages to retrieve

        Returns:
            List[Message]: List of recent messages, newest first
        """
        stmt = (
            select(MessageDB)
            .where(MessageDB.character_id == character_id)
            .order_by(MessageDB.created_at.desc())
            .limit(count)
        )
        result = self.db.execute(stmt)
        db_messages = result.scalars().all()

        # Reverse to return in chronological order
        messages = [self._to_pydantic_message(msg) for msg in reversed(db_messages)]
        return messages

    async def delete_all_messages(self, character_id: str) -> None:
        """
        Delete all messages for a character.

        Args:
            character_id: ID of the character
        """
        try:
            stmt = select(MessageDB).where(MessageDB.character_id == character_id)
            result = self.db.execute(stmt)
            messages = result.scalars().all()

            for msg in messages:
                self.db.delete(msg)

            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise StorageError(f"Failed to delete messages: {str(e)}")

    def _to_pydantic_message(self, db_message: MessageDB) -> Message:
        """
        Convert SQLAlchemy model to Pydantic model.

        Args:
            db_message: SQLAlchemy message model

        Returns:
            Message: Pydantic message model
        """
        return Message(
            id=db_message.id,
            role=db_message.role,
            content=db_message.content,
            created_at=db_message.created_at
        )
