"""
Message API routes.

This module defines FastAPI routes for message/chat operations.
Depends on: FastAPI, models, storage, chat_handler
"""

from fastapi import APIRouter, HTTPException, Depends, Query

from models import MessageCreate, MessageResponse, MessagesResponse
from storage import MessageRepository, CharacterRepository
from chat_handler import ChatService
from exceptions import CharacterNotFoundError, LLMError
from api.dependencies import (
    get_chroma_client, get_embedding_generator, get_text_chunker, get_knowledge_base_manager
)
from vector_db import ChromaClient
from embeddings import EmbeddingGenerator
from utils import TextChunker


router = APIRouter(
    prefix="/api/characters/{character_id}/messages",
    tags=["messages"]
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


async def get_message_repo():
    """Dependency for getting message repository instance."""
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


# Note: ChatService requires character-specific parameters,
# so it will be instantiated in the route handlers instead of as a dependency


@router.get("/", response_model=MessagesResponse)
async def get_messages(
    character_id: str,
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    message_repo: MessageRepository = Depends(get_message_repo),
    character_repo: CharacterRepository = Depends(get_character_repo)
):
    """
    Get message history for a character.

    Args:
        character_id: Unique identifier of the character
        limit: Maximum number of messages to return
        offset: Number of messages to skip
        message_repo: Message repository dependency
        character_repo: Character repository dependency

    Returns:
        MessagesResponse: Paginated messages

    Raises:
        HTTPException: If character not found
    """
    try:
        # 1. Check character exists
        await character_repo.get_character_by_id(character_id)

        # 2. Get messages
        messages = await message_repo.get_messages_by_character(character_id, limit, offset)

        # 3. Get total count
        total = await message_repo.count_messages_by_character(character_id)

        return MessagesResponse(messages=messages, total=total)

    except CharacterNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get messages: {str(e)}")


@router.post("/", response_model=MessageResponse)
async def send_message(
    character_id: str,
    message: MessageCreate,
    character_repo: CharacterRepository = Depends(get_character_repo),
    message_repo: MessageRepository = Depends(get_message_repo),
    chroma_client: ChromaClient = Depends(get_chroma_client),
    embedding_generator: EmbeddingGenerator = Depends(get_embedding_generator),
    text_chunker: TextChunker = Depends(get_text_chunker)
):
    """
    Send a message to a character and get response.

    Args:
        character_id: Unique identifier of the character
        message: Message to send
        character_repo: Character repository dependency
        message_repo: Message repository dependency
        chroma_client: ChromaDB client dependency
        embedding_generator: Embedding generator dependency
        text_chunker: Text chunker dependency

    Returns:
        MessageResponse: User and assistant messages

    Raises:
        HTTPException: If character not found or message processing fails
    """
    from llm import OllamaClient
    from chat_handler import ChatService

    try:
        # 1. Get character
        character = await character_repo.get_character_by_id(character_id)

        # 2. Create chat service instance
        # Use character-specific ChromaDB client
        from api.dependencies import get_character_chroma_client
        character_chroma_client = get_character_chroma_client(character_id)
        kb_manager = get_knowledge_base_manager(
            character_id, character_chroma_client, embedding_generator, text_chunker
        )
        ollama_client = OllamaClient()
        chat_service = ChatService(
            character_id=character_id,
            character_name=character.name,
            kb_manager=kb_manager,
            ollama_client=ollama_client,
            message_repository=message_repo
        )

        # 3. Process message
        response = await chat_service.process_message(message.content)

        return response

    except CharacterNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except LLMError as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process message: {str(e)}")
