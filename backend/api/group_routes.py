"""
Group API routes.

This module defines FastAPI routes for group operations.
Follows the same pattern as character_routes.py.
Depends on: FastAPI, models, storage
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Response
from typing import List, Optional
from uuid import uuid4
from datetime import datetime

from models.group import Group, GroupCreate, GroupUpdate
from storage.group_repository import GroupRepository, GroupNotFoundError
from storage import FileStorage, CharacterRepository
from utils import FileValidator
from exceptions import InvalidFileTypeError, StorageError, CharacterNotFoundError


router = APIRouter(prefix="/api/groups", tags=["groups"])


async def get_group_repo():
    """
    Dependency for getting group repository instance.

    Yields:
        GroupRepository: Repository instance
    """
    from storage.database import get_database
    db = get_database()
    session_factory = db.get_session_factory()

    if db.use_sync:
        session = session_factory()
        try:
            yield GroupRepository(session)
        finally:
            session.close()
    else:
        async with session_factory() as session:
            yield GroupRepository(session)


async def get_file_storage():
    """
    Dependency for getting file storage instance.

    Yields:
        FileStorage: File storage instance
    """
    yield FileStorage()


async def get_character_repo():
    """
    Dependency for getting character repository instance.

    Used for validating that characters exist when creating/updating groups.

    Yields:
        CharacterRepository: Repository instance
    """
    from storage.database import get_database
    db = get_database()
    session_factory = db.get_session_factory()

    if db.use_sync:
        session = session_factory()
        try:
            yield CharacterRepository(session)
        finally:
            session.close()
    else:
        async with session_factory() as session:
            yield CharacterRepository(session)


@router.get("/", response_model=List[Group])
async def get_all_groups(repo: GroupRepository = Depends(get_group_repo)):
    """
    Get all groups.

    Args:
        repo: Group repository dependency

    Returns:
        List[Group]: List of all groups
    """
    groups = await repo.get_all_groups()
    return groups


@router.get("/{group_id}", response_model=Group)
async def get_group(
    group_id: str,
    repo: GroupRepository = Depends(get_group_repo)
):
    """
    Get a specific group by ID.

    Args:
        group_id: Unique identifier of the group
        repo: Group repository dependency

    Returns:
        Group: Group details

    Raises:
        HTTPException: If group not found
    """
    try:
        group = await repo.get_group_by_id(group_id)
        if group is None:
            raise HTTPException(status_code=404, detail=f"Group {group_id} not found")
        return group
    except GroupNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/", response_model=Group)
async def create_group(
    name: str = Form(...),
    character_ids: str = Form(...),  # JSON string, will be parsed
    avatar: Optional[UploadFile] = File(None),
    repo: GroupRepository = Depends(get_group_repo),
    storage: FileStorage = Depends(get_file_storage),
    character_repo: CharacterRepository = Depends(get_character_repo)
):
    """
    Create a new group.

    Args:
        name: Group name
        character_ids: JSON string of character IDs (e.g., '["id1", "id2"]')
        avatar: Avatar image file (optional)
        repo: Group repository dependency
        storage: File storage dependency
        character_repo: Character repository for validation

    Returns:
        Group: Created group

    Raises:
        HTTPException: If validation fails or creation fails
    """
    import json
    from uuid import uuid4
    from datetime import datetime

    try:
        parsed_character_ids = json.loads(character_ids)

        for char_id in parsed_character_ids:
            character = await character_repo.get_character_by_id(char_id)
            if character is None:
                raise HTTPException(
                    status_code=400,
                    detail=f"Character {char_id} not found"
                )

        group_id = str(uuid4())
        avatar_url = None

        if avatar:
            FileValidator.validate_avatar(avatar.filename, getattr(avatar, 'size', None) or 0)
            avatar_content = await avatar.read()
            await storage.save_group_avatar(group_id, avatar_content, avatar.filename)
            avatar_url = f"/api/groups/{group_id}/avatar"

        group_data = Group(
            id=group_id,
            name=name,
            character_ids=parsed_character_ids,
            avatar_url=avatar_url,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        created_group = await repo.create_group(group_data)
        return created_group

    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format for character_ids")
    except InvalidFileTypeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create group: {str(e)}")


@router.put("/{group_id}", response_model=Group)
async def update_group(
    group_id: str,
    name: Optional[str] = Form(None),
    character_ids: Optional[str] = Form(None),  # JSON string, will be parsed
    avatar: Optional[UploadFile] = File(None),
    repo: GroupRepository = Depends(get_group_repo),
    storage: FileStorage = Depends(get_file_storage),
    character_repo: CharacterRepository = Depends(get_character_repo)
):
    """
    Update group information.

    Args:
        group_id: Unique identifier of the group
        name: New name (optional)
        character_ids: JSON string of new character IDs (optional)
        avatar: New avatar file (optional)
        repo: Group repository dependency
        storage: File storage dependency
        character_repo: Character repository for validation

    Returns:
        Group: Updated group

    Raises:
        HTTPException: If group not found or update fails
    """
    import json

    try:
        group = await repo.get_group_by_id(group_id)
        if group is None:
            raise HTTPException(status_code=404, detail=f"Group {group_id} not found")

        if name is not None and (not name or not name.strip()):
            raise HTTPException(status_code=400, detail="Group name cannot be empty")

        parsed_character_ids = None
        if character_ids is not None:
            parsed_character_ids = json.loads(character_ids)

            for char_id in parsed_character_ids:
                character = await character_repo.get_character_by_id(char_id)
                if character is None:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Character {char_id} not found"
                    )

        avatar_url = None
        if avatar:
            FileValidator.validate_avatar(avatar.filename, getattr(avatar, 'size', None) or 0)
            avatar_content = await avatar.read()
            await storage.save_group_avatar(group_id, avatar_content, avatar.filename)
            avatar_url = f"/api/groups/{group_id}/avatar"

        updated_group = await repo.update_group(
            group_id=group_id,
            name=name,
            character_ids=parsed_character_ids,
            avatar_url=avatar_url
        )

        return updated_group

    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format for character_ids")
    except GroupNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except InvalidFileTypeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update group: {str(e)}")


@router.delete("/{group_id}", status_code=204)
async def delete_group(
    group_id: str,
    repo: GroupRepository = Depends(get_group_repo),
    storage: FileStorage = Depends(get_file_storage)
):
    """
    Delete a group and all associated data.

    Args:
        group_id: Unique identifier of the group
        repo: Group repository dependency
        storage: File storage dependency

    Raises:
        HTTPException: If group not found or deletion fails
    """
    try:
        group = await repo.get_group_by_id(group_id)
        if group is None:
            raise HTTPException(status_code=404, detail=f"Group {group_id} not found")

        await storage.delete_group_data(group_id)
        await repo.delete_group(group_id)

        return Response(status_code=204)

    except HTTPException:
        raise
    except GroupNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete group: {str(e)}")


@router.get("/{group_id}/avatar")
async def get_group_avatar(
    group_id: str,
    repo: GroupRepository = Depends(get_group_repo),
    storage: FileStorage = Depends(get_file_storage)
):
    """
    Get group avatar file.

    Args:
        group_id: Unique identifier of the group
        repo: Group repository dependency
        storage: File storage dependency

    Returns:
        FileResponse: Avatar image file

    Raises:
        HTTPException: If group or avatar not found
    """
    from fastapi.responses import FileResponse
    import os

    try:
        group = await repo.get_group_by_id(group_id)
        if group is None:
            raise HTTPException(status_code=404, detail=f"Group {group_id} not found")

        if not group.avatar_url:
            raise HTTPException(status_code=404, detail="Avatar not found for this group")

        avatar_path = await storage.get_group_avatar_path(group_id)

        if not avatar_path or not os.path.exists(avatar_path):
            raise HTTPException(status_code=404, detail="Avatar file not found")

        return FileResponse(avatar_path)

    except GroupNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve avatar: {str(e)}")


async def get_group_message_repo():
    """
    Dependency for getting group message repository instance.

    Yields:
        GroupMessageRepository: Repository instance
    """
    from storage.database import get_database
    from storage.group_message_repository import GroupMessageRepository

    db = get_database()
    session_factory = db.get_session_factory()

    if db.use_sync:
        session = session_factory()
        try:
            yield GroupMessageRepository(session)
        finally:
            session.close()
    else:
        async with session_factory() as session:
            yield GroupMessageRepository(session)


@router.get("/{group_id}/messages")
async def get_group_messages(
    group_id: str,
    limit: int = 50,
    offset: int = 0,
    group_repo: GroupRepository = Depends(get_group_repo),
    message_repo = Depends(get_group_message_repo)
):
    """
    Get group message history with pagination.

    Args:
        group_id: Unique identifier of the group
        limit: Maximum number of messages to retrieve (default: 50)
        offset: Number of messages to skip for pagination (default: 0)
        repo: Group repository dependency
        message_repo: Group message repository dependency

    Returns:
        MessagesResponse: Dictionary with "messages" (list) and "total" (int) keys

    Raises:
        HTTPException: If group not found or retrieval fails

    Notes:
        - Messages are returned in chronological order (oldest first) for display
        - Frontend should reverse for pagination display if needed
    """
    try:
        # Verify group exists
        group = await group_repo.get_group_by_id(group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")

        # Retrieve messages from database (already in chronological order)
        messages, total = await message_repo.get_messages_by_group(group_id, limit, offset)

        return {
            "messages": messages,
            "total": total
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve group messages: {str(e)}")
