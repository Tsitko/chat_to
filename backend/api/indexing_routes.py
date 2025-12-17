"""
Indexing status API routes.

This module defines FastAPI routes for checking indexing status.
Depends on: FastAPI, models, chat_handler
"""

from fastapi import APIRouter, HTTPException, Depends

from models import IndexingStatusResponse
from storage import CharacterRepository, FileStorage
from chat_handler import IndexingService
from exceptions import CharacterNotFoundError


router = APIRouter(
    prefix="/api/characters/{character_id}/indexing-status",
    tags=["indexing"]
)


async def get_character_repo():
    """Dependency for getting character repository instance."""
    from storage.database import get_database
    db = get_database()
    session_factory = db.get_session_factory()

    if db.use_sync:
        # For sync mode, create and close session manually
        session = session_factory()
        try:
            yield CharacterRepository(session)
        finally:
            session.close()
    else:
        # For async mode, use async context manager
        async with session_factory() as session:
            yield CharacterRepository(session)


async def get_file_storage():
    """Dependency for getting file storage instance."""
    yield FileStorage()


async def get_indexing_service_dependency():
    """Dependency for getting indexing service singleton instance."""
    from api.dependencies import get_indexing_service
    yield get_indexing_service()


@router.get("/", response_model=IndexingStatusResponse)
async def get_indexing_status(
    character_id: str,
    indexing_service: IndexingService = Depends(get_indexing_service_dependency),
    character_repo: CharacterRepository = Depends(get_character_repo)
):
    """
    Get indexing status for all books of a character.

    Args:
        character_id: Unique identifier of the character
        indexing_service: Indexing service dependency
        character_repo: Character repository dependency

    Returns:
        IndexingStatusResponse: Indexing status information

    Raises:
        HTTPException: If character not found
    """
    try:
        # 1. Check character exists
        await character_repo.get_character_by_id(character_id)

        # 2. Get indexing status (pass repository for database access)
        status = await indexing_service.get_indexing_status(character_id, character_repo)

        return IndexingStatusResponse(**status)

    except CharacterNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get indexing status: {str(e)}")
