"""
Character API routes.

This module defines FastAPI routes for character operations.
Depends on: FastAPI, models, storage, chat_handler
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Response
from typing import List, Optional

from models import Character, CharacterCreate, CharacterUpdate, Book
from storage import CharacterRepository, FileStorage
from utils import FileValidator
from exceptions import CharacterNotFoundError, InvalidFileTypeError
from chat_handler import IndexingService
from api.dependencies import (
    get_chroma_client, get_embedding_generator, get_text_chunker, get_knowledge_base_manager
)
from vector_db import ChromaClient
from embeddings import EmbeddingGenerator
from utils import TextChunker


router = APIRouter(prefix="/api/characters", tags=["characters"])


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


async def get_file_storage():
    """
    Dependency for getting file storage instance.

    Yields:
        FileStorage: File storage instance
    """
    yield FileStorage()


async def get_indexing_service(
    storage: FileStorage = Depends(get_file_storage),
    repo: CharacterRepository = Depends(get_character_repo)
):
    """
    Dependency for getting indexing service instance.

    Yields:
        IndexingService: Indexing service instance
    """
    yield IndexingService(file_storage=storage, character_repository=repo)


@router.get("/", response_model=List[Character])
async def get_all_characters(
    repo: CharacterRepository = Depends(get_character_repo)
):
    """
    Get all characters.

    Args:
        repo: Character repository dependency

    Returns:
        List[Character]: List of all characters
    """
    characters = await repo.get_all_characters()
    return characters


@router.get("/{character_id}", response_model=Character)
async def get_character(
    character_id: str,
    repo: CharacterRepository = Depends(get_character_repo)
):
    """
    Get a specific character by ID.

    Args:
        character_id: Unique identifier of the character
        repo: Character repository dependency

    Returns:
        Character: Character details

    Raises:
        HTTPException: If character not found
    """
    try:
        character = await repo.get_character_by_id(character_id)
        if character is None:
            raise HTTPException(status_code=404, detail=f"Character {character_id} not found")
        return character
    except CharacterNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/", response_model=Character)
async def create_character(
    name: str = Form(...),
    avatar: Optional[UploadFile] = File(None),
    books: List[UploadFile] = File(default=[]),
    repo: CharacterRepository = Depends(get_character_repo),
    storage: FileStorage = Depends(get_file_storage),
    indexing_service: IndexingService = Depends(get_indexing_service),
    chroma_client: ChromaClient = Depends(get_chroma_client),
    embedding_generator: EmbeddingGenerator = Depends(get_embedding_generator),
    text_chunker: TextChunker = Depends(get_text_chunker)
):
    """
    Create a new character.

    Args:
        name: Character name
        avatar: Avatar image file (optional)
        books: List of book files (optional)
        repo: Character repository dependency
        storage: File storage dependency
        indexing_service: Indexing service dependency

    Returns:
        Character: Created character

    Raises:
        HTTPException: If file validation fails or creation fails
    """
    from uuid import uuid4
    from datetime import datetime
    from knowledge_base import KnowledgeBaseManager

    try:
        # DEBUG: Log received parameters
        print(f"[CREATE CHARACTER] name={name}")
        print(f"[CREATE CHARACTER] avatar={avatar}")
        print(f"[CREATE CHARACTER] books={books}")
        print(f"[CREATE CHARACTER] books type={type(books)}")
        print(f"[CREATE CHARACTER] books length={len(books)}")

        # 1. Create character
        character_id = str(uuid4())
        character_data = Character(
            id=character_id,
            name=name,
            avatar_url=f"/api/characters/{character_id}/avatar" if avatar else None,
            created_at=datetime.utcnow(),
            books=[]
        )

        # 2. Save avatar if provided
        if avatar:
            FileValidator.validate_avatar(avatar.filename, avatar.size or 0)
            avatar_content = await avatar.read()
            await storage.save_avatar(character_id, avatar_content, avatar.filename)

        # 3. Create character in database
        created_character = await repo.create_character(character_data)

        # 4. Save and index books if provided
        if books and len(books) > 0:
            # Use character-specific ChromaDB client
            from api.dependencies import get_character_chroma_client
            character_chroma_client = get_character_chroma_client(character_id)
            kb_manager = get_knowledge_base_manager(
                character_id, character_chroma_client, embedding_generator, text_chunker
            )
            for book_file in books:
                FileValidator.validate_book(book_file.filename, book_file.size or 0)
                book_id = str(uuid4())

                # Save book file
                book_content = await book_file.read()
                await storage.save_book(character_id, book_id, book_content, book_file.filename)

                # Create book record
                from models import Book
                book_data = Book(
                    id=book_id,
                    character_id=character_id,
                    filename=book_file.filename,
                    file_size=book_file.size or 0,
                    uploaded_at=datetime.utcnow(),
                    indexed=False
                )
                await repo.create_book(book_data)

                # Start async indexing with logging and error handling
                try:
                    print(f"[BOOK INDEXING] Starting indexing for book {book_id} of character {character_id}")
                    await indexing_service.start_book_indexing(character_id, book_id, kb_manager)
                    print(f"[BOOK INDEXING] Task created successfully for book {book_id}")
                except Exception as e:
                    print(f"[BOOK INDEXING ERROR] Failed to start indexing: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    # DON'T re-raise exception - book is added, indexing is background

        # 5. Return created character with books
        return await repo.get_character_by_id(character_id)

    except InvalidFileTypeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create character: {str(e)}")


@router.put("/{character_id}", response_model=Character)
async def update_character(
    character_id: str,
    name: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    books: List[UploadFile] = File(default=[]),
    repo: CharacterRepository = Depends(get_character_repo),
    storage: FileStorage = Depends(get_file_storage),
    indexing_service: IndexingService = Depends(get_indexing_service),
    chroma_client: ChromaClient = Depends(get_chroma_client),
    embedding_generator: EmbeddingGenerator = Depends(get_embedding_generator),
    text_chunker: TextChunker = Depends(get_text_chunker)
):
    """
    Update character information.

    Args:
        character_id: Unique identifier of the character
        name: New name (optional)
        avatar: New avatar file (optional)
        books: New book files to add (optional)
        repo: Character repository dependency
        storage: File storage dependency
        indexing_service: Indexing service dependency

    Returns:
        Character: Updated character

    Raises:
        HTTPException: If character not found or update fails
    """
    from uuid import uuid4
    from datetime import datetime
    from knowledge_base import KnowledgeBaseManager

    try:
        # DEBUG: Log received parameters
        print(f"[UPDATE CHARACTER] character_id={character_id}")
        print(f"[UPDATE CHARACTER] name={name}")
        print(f"[UPDATE CHARACTER] avatar={avatar}")
        print(f"[UPDATE CHARACTER] books={books}")
        print(f"[UPDATE CHARACTER] books type={type(books)}")
        print(f"[UPDATE CHARACTER] books length={len(books)}")

        # 1. Check if character exists
        character = await repo.get_character_by_id(character_id)

        # 2. Update name if provided
        if name:
            await repo.update_character_name(character_id, name)

        # 3. Update avatar if provided
        if avatar:
            FileValidator.validate_avatar(avatar.filename, avatar.size or 0)
            avatar_content = await avatar.read()
            await storage.save_avatar(character_id, avatar_content, avatar.filename)

        # 4. Add new books if provided
        if books and len(books) > 0:
            # Use character-specific ChromaDB client
            from api.dependencies import get_character_chroma_client
            character_chroma_client = get_character_chroma_client(character_id)
            kb_manager = get_knowledge_base_manager(
                character_id, character_chroma_client, embedding_generator, text_chunker
            )
            for book_file in books:
                FileValidator.validate_book(book_file.filename, book_file.size or 0)
                book_id = str(uuid4())

                # Save book file
                book_content = await book_file.read()
                await storage.save_book(character_id, book_id, book_content, book_file.filename)

                # Create book record
                from models import Book
                book_data = Book(
                    id=book_id,
                    character_id=character_id,
                    filename=book_file.filename,
                    file_size=book_file.size or 0,
                    uploaded_at=datetime.utcnow(),
                    indexed=False
                )
                await repo.create_book(book_data)

                # Start async indexing with logging and error handling
                try:
                    print(f"[BOOK INDEXING] Starting indexing for book {book_id} of character {character_id}")
                    await indexing_service.start_book_indexing(character_id, book_id, kb_manager)
                    print(f"[BOOK INDEXING] Task created successfully for book {book_id}")
                except Exception as e:
                    print(f"[BOOK INDEXING ERROR] Failed to start indexing: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    # DON'T re-raise exception - book is added, indexing is background

        # 5. Return updated character
        return await repo.get_character_by_id(character_id)

    except CharacterNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except InvalidFileTypeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update character: {str(e)}")


@router.delete("/{character_id}", status_code=204)
async def delete_character(
    character_id: str,
    repo: CharacterRepository = Depends(get_character_repo),
    storage: FileStorage = Depends(get_file_storage),
    chroma_client: ChromaClient = Depends(get_chroma_client),
    embedding_generator: EmbeddingGenerator = Depends(get_embedding_generator),
    text_chunker: TextChunker = Depends(get_text_chunker)
):
    """
    Delete a character and all associated data.

    Args:
        character_id: Unique identifier of the character
        repo: Character repository dependency
        storage: File storage dependency
        chroma_client: ChromaDB client dependency
        embedding_generator: Embedding generator dependency
        text_chunker: Text chunker dependency

    Raises:
        HTTPException: If character not found or deletion fails
    """
    try:
        # 1. Check if character exists
        await repo.get_character_by_id(character_id)

        # 2. Delete knowledge bases
        # Use character-specific ChromaDB client
        from api.dependencies import get_character_chroma_client
        character_chroma_client = get_character_chroma_client(character_id)
        kb_manager = get_knowledge_base_manager(
            character_id, character_chroma_client, embedding_generator, text_chunker
        )
        await kb_manager.delete_all_knowledge_bases()

        # 2.5. Delete character's ChromaDB directory
        import shutil
        from pathlib import Path
        from configs import CHROMA_DIR
        character_chroma_dir = Path(CHROMA_DIR) / character_id
        if character_chroma_dir.exists():
            shutil.rmtree(character_chroma_dir)

        # 3. Delete files from storage
        await storage.delete_character_data(character_id)

        # 4. Delete character from database (cascade deletes books and messages)
        await repo.delete_character(character_id)

        return Response(status_code=204)

    except CharacterNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete character: {str(e)}")


@router.get("/{character_id}/avatar")
async def get_character_avatar(
    character_id: str,
    repo: CharacterRepository = Depends(get_character_repo),
    storage: FileStorage = Depends(get_file_storage)
):
    """
    Get character avatar file.

    Args:
        character_id: Unique identifier of the character
        repo: Character repository dependency
        storage: File storage dependency

    Returns:
        FileResponse: Avatar image file

    Raises:
        HTTPException: If character or avatar not found
    """
    from fastapi.responses import FileResponse
    import os

    try:
        # 1. Check if character exists
        character = await repo.get_character_by_id(character_id)

        if not character.avatar_url:
            raise HTTPException(status_code=404, detail="Avatar not found for this character")

        # 2. Get avatar path
        avatar_path = await storage.get_avatar_path(character_id)

        if not avatar_path or not os.path.exists(avatar_path):
            raise HTTPException(status_code=404, detail="Avatar file not found")

        # 3. Return file
        return FileResponse(avatar_path)

    except CharacterNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve avatar: {str(e)}")
