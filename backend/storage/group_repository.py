"""
Group repository for database operations.

This module provides data access layer for group-related operations.
Follows the same pattern as CharacterRepository.
Depends on: SQLAlchemy (ORM)
"""

from typing import List, Optional, Union
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
import json

from models.group import Group
from exceptions import StorageError, GroupNotFoundError
from storage.database import GroupDB


class GroupRepository:
    """
    Repository for group data persistence using SQLite.

    This class handles all database operations related to groups,
    including CRUD operations. Supports both sync and async sessions.
    Follows the same pattern as CharacterRepository.
    """

    def __init__(self, db_session: Union[Session, AsyncSession]):
        """
        Initialize the group repository.

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

    async def _delete(self, obj):
        """
        Delete object from database.

        Args:
            obj: SQLAlchemy model instance to delete

        Handles both sync and async database sessions.
        """
        if self.is_async:
            await self.db.delete(obj)
        else:
            self.db.delete(obj)

    async def create_group(self, group: Group) -> Group:
        """
        Create a new group in the database.

        Args:
            group: Group model to persist

        Returns:
            Group: The created group with ID

        Raises:
            StorageError: If database operation fails
        """
        try:
            db_group = GroupDB(
                id=group.id,
                name=group.name,
                character_ids=json.dumps(group.character_ids),
                avatar_url=group.avatar_url,
                created_at=group.created_at,
                updated_at=group.updated_at
            )
            self.db.add(db_group)
            await self._commit()
            await self._refresh(db_group)
            return await self._to_pydantic_group(db_group)
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to create group: {str(e)}")

    async def get_group_by_id(self, group_id: str) -> Optional[Group]:
        """
        Retrieve a group by ID.

        Args:
            group_id: Unique identifier of the group

        Returns:
            Optional[Group]: Group if found, None otherwise
        """
        stmt = select(GroupDB).where(GroupDB.id == group_id)
        result = await self._execute(stmt)
        db_group = result.scalar_one_or_none()

        if db_group is None:
            return None

        return await self._to_pydantic_group(db_group)

    async def get_all_groups(self) -> List[Group]:
        """
        Retrieve all groups.

        Returns:
            List[Group]: List of all groups
        """
        stmt = select(GroupDB)
        result = await self._execute(stmt)
        db_groups = result.scalars().all()

        return [await self._to_pydantic_group(group) for group in db_groups]

    async def update_group(
        self,
        group_id: str,
        name: Optional[str] = None,
        character_ids: Optional[List[str]] = None,
        avatar_url: Optional[str] = None
    ) -> Group:
        """
        Update group information.

        Args:
            group_id: Unique identifier of the group
            name: New name for the group (optional)
            character_ids: New list of character IDs (optional)
            avatar_url: New avatar URL (optional)

        Returns:
            Group: Updated group

        Raises:
            GroupNotFoundError: If group doesn't exist
            StorageError: If database operation fails
        """
        try:
            stmt = select(GroupDB).where(GroupDB.id == group_id)
            result = await self._execute(stmt)
            db_group = result.scalar_one_or_none()

            if db_group is None:
                raise GroupNotFoundError(f"Group {group_id} not found")

            if name is not None:
                db_group.name = name
            if character_ids is not None:
                db_group.character_ids = json.dumps(character_ids)
            if avatar_url is not None:
                db_group.avatar_url = avatar_url

            db_group.updated_at = datetime.utcnow()
            await self._commit()
            await self._refresh(db_group)
            return await self._to_pydantic_group(db_group)
        except GroupNotFoundError:
            raise
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to update group: {str(e)}")

    async def delete_group(self, group_id: str) -> None:
        """
        Delete a group from the database.

        Args:
            group_id: Unique identifier of the group

        Raises:
            GroupNotFoundError: If group doesn't exist
            StorageError: If database operation fails
        """
        try:
            stmt = select(GroupDB).where(GroupDB.id == group_id)
            result = await self._execute(stmt)
            db_group = result.scalar_one_or_none()

            if db_group is None:
                raise GroupNotFoundError(f"Group {group_id} not found")

            await self._delete(db_group)
            await self._commit()
        except GroupNotFoundError:
            raise
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to delete group: {str(e)}")

    async def update_group_name(self, group_id: str, name: str) -> None:
        """
        Update a group's name.

        Args:
            group_id: Unique identifier of the group
            name: New name for the group

        Raises:
            GroupNotFoundError: If group doesn't exist
            StorageError: If database operation fails
        """
        try:
            stmt = select(GroupDB).where(GroupDB.id == group_id)
            result = await self._execute(stmt)
            db_group = result.scalar_one_or_none()

            if db_group is None:
                raise GroupNotFoundError(f"Group {group_id} not found")

            db_group.name = name
            db_group.updated_at = datetime.utcnow()
            await self._commit()
        except GroupNotFoundError:
            raise
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to update group name: {str(e)}")

    async def update_group_characters(
        self,
        group_id: str,
        character_ids: List[str]
    ) -> None:
        """
        Update a group's character list.

        Args:
            group_id: Unique identifier of the group
            character_ids: New list of character IDs

        Raises:
            GroupNotFoundError: If group doesn't exist
            StorageError: If database operation fails
        """
        try:
            stmt = select(GroupDB).where(GroupDB.id == group_id)
            result = await self._execute(stmt)
            db_group = result.scalar_one_or_none()

            if db_group is None:
                raise GroupNotFoundError(f"Group {group_id} not found")

            db_group.character_ids = json.dumps(character_ids)
            db_group.updated_at = datetime.utcnow()
            await self._commit()
        except GroupNotFoundError:
            raise
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to update group characters: {str(e)}")

    async def update_group_avatar(self, group_id: str, avatar_url: str) -> None:
        """
        Update a group's avatar URL.

        Args:
            group_id: Unique identifier of the group
            avatar_url: New avatar URL

        Raises:
            GroupNotFoundError: If group doesn't exist
            StorageError: If database operation fails
        """
        try:
            stmt = select(GroupDB).where(GroupDB.id == group_id)
            result = await self._execute(stmt)
            db_group = result.scalar_one_or_none()

            if db_group is None:
                raise GroupNotFoundError(f"Group {group_id} not found")

            db_group.avatar_url = avatar_url
            db_group.updated_at = datetime.utcnow()
            await self._commit()
        except GroupNotFoundError:
            raise
        except Exception as e:
            await self._rollback()
            raise StorageError(f"Failed to update group avatar: {str(e)}")

    async def _to_pydantic_group(self, db_group: GroupDB) -> Group:
        """
        Convert SQLAlchemy model to Pydantic model.

        Args:
            db_group: SQLAlchemy Group model

        Returns:
            Group: Pydantic Group model
        """
        character_ids = json.loads(db_group.character_ids)

        return Group(
            id=db_group.id,
            name=db_group.name,
            character_ids=character_ids,
            avatar_url=db_group.avatar_url,
            created_at=db_group.created_at,
            updated_at=db_group.updated_at
        )
