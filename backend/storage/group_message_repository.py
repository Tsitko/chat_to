"""
Group message repository for group chat history persistence.

This module provides data access layer for group message-related operations.
Follows the same pattern as MessageRepository.
Depends on: SQLAlchemy (ORM)
"""

from typing import List, Union
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from models import Message
from exceptions import StorageError
from storage.database import GroupMessageDB


class GroupMessageRepository:
    """
    Repository for group message data persistence using SQLite.

    This class handles all database operations related to group chat messages,
    including storage, retrieval, and pagination.
    Supports both sync and async sessions.
    Follows the same pattern as MessageRepository.
    """

    def __init__(self, db_session: Union[Session, AsyncSession]):
        """
        Initialize the group message repository.

        Args:
            db_session: SQLAlchemy database session (sync or async)
        """
        self.db = db_session
        self.is_async = isinstance(db_session, AsyncSession)

    async def _commit(self):
        """
        Commit transaction.

        Handles both sync and async database sessions.
        """
        if self.is_async:
            await self.db.commit()
        else:
            self.db.commit()

    async def _rollback(self):
        """
        Rollback transaction.

        Handles both sync and async database sessions.
        """
        if self.is_async:
            await self.db.rollback()
        else:
            self.db.rollback()

    async def _refresh(self, obj):
        """
        Refresh object from database.

        Args:
            obj: SQLAlchemy model instance to refresh

        Handles both sync and async database sessions.
        """
        if self.is_async:
            await self.db.refresh(obj)
        else:
            self.db.refresh(obj)

    async def _execute(self, stmt):
        """
        Execute SQLAlchemy statement.

        Args:
            stmt: SQLAlchemy statement to execute

        Returns:
            Result object

        Handles both sync and async database sessions.
        """
        if self.is_async:
            return await self.db.execute(stmt)
        else:
            return self.db.execute(stmt)

    async def create_message(
        self,
        group_id: str,
        message: Message
    ) -> Message:
        """
        Save a message to the database.

        Args:
            group_id: Unique identifier of the group
            message: Message model to persist (can be user or assistant message)

        Returns:
            Message: The saved message

        Raises:
            StorageError: If database operation fails

        Notes:
            - For user messages: character_id is None, character_name is None
            - For assistant messages: character_id and character_name must be set
        """
        try:
            db_message = GroupMessageDB(
                id=message.id,
                group_id=group_id,
                role=message.role,
                content=message.content,
                character_id=message.character_id,
                character_name=getattr(message, 'character_name', None),
                created_at=message.created_at
            )
            self.db.add(db_message)
            await self._commit()
            await self._refresh(db_message)

            return Message(
                id=db_message.id,
                role=db_message.role,
                content=db_message.content,
                character_id=db_message.character_id,
                created_at=db_message.created_at
            )
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to save group message: {str(e)}")

    async def get_messages_by_group(
        self,
        group_id: str,
        limit: int = 10,
        offset: int = 0
    ) -> tuple[List[Message], int]:
        """
        Retrieve messages for a group with pagination.

        Args:
            group_id: Unique identifier of the group
            limit: Maximum number of messages to retrieve
            offset: Number of messages to skip

        Returns:
            tuple[List[Message], int]: Tuple of (messages list, total count)

        Raises:
            StorageError: If database operation fails

        Notes:
            - Messages are ordered by created_at descending (newest first) for pagination
            - To display in chat, reverse the list to show chronological order
        """
        try:
            # Get total count
            count_stmt = select(func.count()).select_from(GroupMessageDB).where(
                GroupMessageDB.group_id == group_id
            )
            count_result = await self._execute(count_stmt)
            total = count_result.scalar()

            # Get paginated messages ordered by created_at descending
            stmt = select(GroupMessageDB).where(
                GroupMessageDB.group_id == group_id
            ).order_by(GroupMessageDB.created_at.desc()).limit(limit).offset(offset)

            result = await self._execute(stmt)
            db_messages = result.scalars().all()

            messages = [
                Message(
                    id=msg.id,
                    role=msg.role,
                    content=msg.content,
                    character_id=msg.character_id,
                    created_at=msg.created_at
                )
                for msg in reversed(db_messages)
            ]

            return messages, total
        except Exception as e:
            raise StorageError(f"Failed to retrieve group messages: {str(e)}")

    async def get_recent_messages_by_group(
        self,
        group_id: str,
        count: int = 5
    ) -> List[Message]:
        """
        Get most recent messages for a group.

        Args:
            group_id: Unique identifier of the group
            count: Number of recent messages to retrieve

        Returns:
            List[Message]: List of recent messages in chronological order (oldest first)

        Raises:
            StorageError: If database operation fails

        Notes:
            - Used by frontend to send recent context to backend
            - Returns messages in chronological order ready for API request
        """
        try:
            stmt = select(GroupMessageDB).where(
                GroupMessageDB.group_id == group_id
            ).order_by(GroupMessageDB.created_at.desc()).limit(count)

            result = await self._execute(stmt)
            db_messages = result.scalars().all()

            # Return in chronological order (oldest first)
            messages = [
                Message(
                    id=msg.id,
                    role=msg.role,
                    content=msg.content,
                    character_id=msg.character_id,
                    created_at=msg.created_at
                )
                for msg in reversed(db_messages)
            ]

            return messages
        except Exception as e:
            raise StorageError(f"Failed to retrieve recent group messages: {str(e)}")

    async def count_messages_by_group(self, group_id: str) -> int:
        """
        Count total messages for a group.

        Args:
            group_id: Unique identifier of the group

        Returns:
            int: Total count of messages

        Raises:
            StorageError: If database operation fails
        """
        try:
            count_stmt = select(func.count()).select_from(GroupMessageDB).where(
                GroupMessageDB.group_id == group_id
            )
            count_result = await self._execute(count_stmt)
            total = count_result.scalar()
            return total
        except Exception as e:
            raise StorageError(f"Failed to count group messages: {str(e)}")

    async def delete_messages_by_group(self, group_id: str) -> None:
        """
        Delete all messages for a group.

        Args:
            group_id: Unique identifier of the group

        Raises:
            StorageError: If database operation fails

        Notes:
            - Should be called when a group is deleted
            - Cascading delete is handled in database schema
        """
        try:
            from sqlalchemy import delete as sql_delete

            stmt = sql_delete(GroupMessageDB).where(GroupMessageDB.group_id == group_id)
            await self._execute(stmt)
            await self._commit()
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to delete group messages: {str(e)}")
