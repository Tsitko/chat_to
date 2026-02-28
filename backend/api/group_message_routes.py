"""
Group message API routes.

This module defines FastAPI routes for group chat operations where multiple
characters respond to a single user message sequentially.

Depends on: FastAPI, models, storage, chat_handler
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict

from models import GroupMessageRequest, GroupMessageResponse
from storage import MessageRepository, CharacterRepository
from chat_handler import GroupChatService
from knowledge_base import KnowledgeBaseManager
from llm import OllamaClient
from exceptions import CharacterNotFoundError, LLMError
from api.dependencies import (
    get_embedding_generator,
    get_text_chunker,
    get_character_chroma_client
)
from vector_db import ChromaClient
from embeddings import EmbeddingGenerator
from utils import TextChunker


router = APIRouter(
    prefix="/api/groups/messages",
    tags=["group-messages"]
)


async def get_character_repo():
    """
    Dependency for getting character repository instance.

    Yields:
        CharacterRepository: Repository instance
    """
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


async def get_message_repo():
    """
    Dependency for getting message repository instance.

    Yields:
        MessageRepository: Repository instance
    """
    from storage.database import get_database
    db = get_database()
    session_factory = db.get_session_factory()

    if db.use_sync:
        # For sync mode, create and close session manually
        session = session_factory()
        try:
            yield MessageRepository(session)
        finally:
            session.close()
    else:
        # For async mode, use async context manager
        async with session_factory() as session:
            yield MessageRepository(session)


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
        # For sync mode, create and close session manually
        session = session_factory()
        try:
            yield GroupMessageRepository(session)
        finally:
            session.close()
    else:
        # For async mode, use async context manager
        async with session_factory() as session:
            yield GroupMessageRepository(session)


async def get_group_chat_service(
    character_repo: CharacterRepository = Depends(get_character_repo),
    message_repo: MessageRepository = Depends(get_message_repo),
    group_message_repo = Depends(get_group_message_repo)
):
    """
    Dependency for getting group chat service instance.

    Args:
        character_repo: Character repository dependency
        message_repo: Message repository dependency
        group_message_repo: Group message repository dependency

    Yields:
        GroupChatService: Group chat service instance
    """
    return GroupChatService(
        character_repository=character_repo,
        message_repository=message_repo,
        group_message_repository=group_message_repo
    )


@router.post("/", response_model=GroupMessageResponse)
async def send_group_message(
    request: GroupMessageRequest,
    service: GroupChatService = Depends(get_group_chat_service),
    character_repo: CharacterRepository = Depends(get_character_repo),
    embedding_generator: EmbeddingGenerator = Depends(get_embedding_generator),
    text_chunker: TextChunker = Depends(get_text_chunker)
):
    """
    Send a message to a group of characters and get all responses.

    Each character in the group responds sequentially, with later characters
    seeing earlier characters' responses in their context.

    Flow:
    1. Validate all character IDs exist
    2. Create KnowledgeBaseManager for each character
    3. Process group message through GroupChatService
    4. Return all character responses

    Args:
        request: Group message request with messages array and character IDs
        group_chat_service: Group chat service dependency
        character_repo: Character repository dependency
        embedding_generator: Embedding generator dependency
        text_chunker: Text chunker dependency

    Returns:
        GroupMessageResponse: User message and all character responses

    Raises:
        HTTPException 400: If request validation fails or group size exceeds limit
        HTTPException 404: If any character not found
        HTTPException 500: If processing fails
        HTTPException 504: If processing times out
    """
    import asyncio
    from configs.group_chat_config import TOTAL_GROUP_TIMEOUT_SECONDS

    try:
        # Process group message with total timeout (compatible with Python 3.9+)
        response = await asyncio.wait_for(
            service.process_group_message(request),
            timeout=TOTAL_GROUP_TIMEOUT_SECONDS
        )

        return response

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except CharacterNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Group message processing timeout")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process group message: {str(e)}")


def _create_kb_managers(
    character_ids: list[str],
    embedding_generator: EmbeddingGenerator,
    text_chunker: TextChunker
) -> Dict[str, KnowledgeBaseManager]:
    """
    Create KnowledgeBaseManager instances for all characters in the group.

    Args:
        character_ids: List of character IDs
        embedding_generator: Embedding generator instance
        text_chunker: Text chunker instance

    Returns:
        Dict[str, KnowledgeBaseManager]: Mapping of character_id to KB manager
    """
    kb_managers = {}
    for character_id in character_ids:
        # Create character-specific ChromaDB client
        chroma_client = get_character_chroma_client(character_id)

        # Create KB manager
        kb_manager = KnowledgeBaseManager(
            character_id=character_id,
            chroma_client=chroma_client,
            embedding_generator=embedding_generator,
            text_chunker=text_chunker
        )
        kb_managers[character_id] = kb_manager

    return kb_managers
