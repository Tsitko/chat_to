"""
Message repository for chat history persistence.

This module provides data access layer for message-related operations.
Depends on: SQLAlchemy (ORM)
"""

from typing import List, Union
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from models import Message
from exceptions import StorageError
from storage.database import MessageDB


class MessageRepository:
    """
    Repository for message data persistence using SQLite.

    This class handles all database operations related to chat messages,
    including storage, retrieval, and pagination.
    Supports both sync and async sessions.
    """

    def __init__(self, db_session: Union[Session, AsyncSession]):
        """
        Initialize the message repository.

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

    async def save_message(self, character_id: str, message: Message) -> Message:
        """
        Save a message to the database.

        Args:
            character_id: Unique identifier of the character
            message: Message model to persist

        Returns:
            Message: The saved message

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
            await self._commit()
            await self._refresh(db_message)

            return Message(
                id=db_message.id,
                role=db_message.role,
                content=db_message.content,
                created_at=db_message.created_at
            )
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to save message: {str(e)}")

    async def get_messages(self, character_id: str, limit: int = 10,
                          offset: int = 0) -> tuple[List[Message], int]:
        """
        Retrieve messages for a character with pagination.

        Args:
            character_id: Unique identifier of the character
            limit: Maximum number of messages to retrieve
            offset: Number of messages to skip

        Returns:
            tuple[List[Message], int]: Tuple of (messages list, total count)

        Raises:
            StorageError: If database operation fails
        """
        try:
            # Get total count
            count_stmt = select(func.count()).select_from(MessageDB).where(
                MessageDB.character_id == character_id
            )
            count_result = await self._execute(count_stmt)
            total = count_result.scalar()

            # Get paginated messages ordered by created_at descending
            stmt = select(MessageDB).where(
                MessageDB.character_id == character_id
            ).order_by(MessageDB.created_at.desc()).limit(limit).offset(offset)

            result = await self._execute(stmt)
            db_messages = result.scalars().all()

            messages = [
                Message(
                    id=msg.id,
                    role=msg.role,
                    content=msg.content,
                    created_at=msg.created_at
                )
                for msg in db_messages
            ]

            return messages, total
        except Exception as e:
            raise StorageError(f"Failed to retrieve messages: {str(e)}")

    async def get_recent_messages(self, character_id: str,
                                 count: int = 10) -> List[Message]:
        """
        Get most recent messages for context building.

        Args:
            character_id: Unique identifier of the character
            count: Number of recent messages to retrieve

        Returns:
            List[Message]: List of recent messages in chronological order

        Raises:
            StorageError: If database operation fails
        """
        try:
            stmt = select(MessageDB).where(
                MessageDB.character_id == character_id
            ).order_by(MessageDB.created_at.desc()).limit(count)

            result = await self._execute(stmt)
            db_messages = result.scalars().all()

            # Return in chronological order (oldest first)
            messages = [
                Message(
                    id=msg.id,
                    role=msg.role,
                    content=msg.content,
                    created_at=msg.created_at
                )
                for msg in reversed(db_messages)
            ]

            return messages
        except Exception as e:
            raise StorageError(f"Failed to retrieve recent messages: {str(e)}")

    async def get_messages_by_character(self, character_id: str, limit: int = 10,
                                       offset: int = 0) -> List[Message]:
        """
        Retrieve messages for a character with pagination (returns list only).

        Args:
            character_id: Unique identifier of the character
            limit: Maximum number of messages to retrieve
            offset: Number of messages to skip

        Returns:
            List[Message]: List of messages in chronological order (oldest first)

        Raises:
            StorageError: If database operation fails
        """
        try:
            # Get paginated messages ordered by created_at ascending (chronological order)
            stmt = select(MessageDB).where(
                MessageDB.character_id == character_id
            ).order_by(MessageDB.created_at.asc()).limit(limit).offset(offset)

            result = await self._execute(stmt)
            db_messages = result.scalars().all()

            messages = [
                Message(
                    id=msg.id,
                    role=msg.role,
                    content=msg.content,
                    created_at=msg.created_at
                )
                for msg in db_messages
            ]

            return messages
        except Exception as e:
            raise StorageError(f"Failed to retrieve messages: {str(e)}")

    async def count_messages_by_character(self, character_id: str) -> int:
        """
        Count total messages for a character.

        Args:
            character_id: Unique identifier of the character

        Returns:
            int: Total count of messages

        Raises:
            StorageError: If database operation fails
        """
        try:
            count_stmt = select(func.count()).select_from(MessageDB).where(
                MessageDB.character_id == character_id
            )
            count_result = await self._execute(count_stmt)
            total = count_result.scalar()
            return total
        except Exception as e:
            raise StorageError(f"Failed to count messages: {str(e)}")

    async def delete_all_messages(self, character_id: str) -> None:
        """
        Delete all messages for a character.

        Args:
            character_id: Unique identifier of the character

        Raises:
            StorageError: If database operation fails
        """
        try:
            from sqlalchemy import delete as sql_delete

            stmt = sql_delete(MessageDB).where(MessageDB.character_id == character_id)
            await self._execute(stmt)
            await self._commit()
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to delete messages: {str(e)}")
