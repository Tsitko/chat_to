"""
Book API routes.

This module defines FastAPI routes for book operations.
Depends on: FastAPI, models, storage, chat_handler
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from typing import List

from models import Book
from storage import CharacterRepository, FileStorage
from utils import FileValidator
from exceptions import CharacterNotFoundError, BookNotFoundError, InvalidFileTypeError
from chat_handler import IndexingService
from api.dependencies import (
    get_chroma_client, get_embedding_generator, get_text_chunker, get_knowledge_base_manager
)
from vector_db import ChromaClient
from embeddings import EmbeddingGenerator
from utils import TextChunker


router = APIRouter(prefix="/api/characters/{character_id}/books", tags=["books"])


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


@router.get("/", response_model=List[Book])
async def get_character_books(
    character_id: str,
    repo: CharacterRepository = Depends(get_character_repo)
):
    """
    Get all books for a character.

    Args:
        character_id: Unique identifier of the character
        repo: Character repository dependency

    Returns:
        List[Book]: List of books

    Raises:
        HTTPException: If character not found
    """
    try:
        # Check character exists
        await repo.get_character_by_id(character_id)

        # Get books
        books = await repo.get_books_by_character(character_id)
        return books

    except CharacterNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get books: {str(e)}")


@router.post("/", response_model=Book)
async def add_book_to_character(
    character_id: str,
    background_tasks: BackgroundTasks,
    book: UploadFile = File(...),
    repo: CharacterRepository = Depends(get_character_repo),
    storage: FileStorage = Depends(get_file_storage),
    indexing_service: IndexingService = Depends(get_indexing_service_dependency),
    chroma_client: ChromaClient = Depends(get_chroma_client),
    embedding_generator: EmbeddingGenerator = Depends(get_embedding_generator),
    text_chunker: TextChunker = Depends(get_text_chunker)
):
    """
    Add a book to a character's knowledge base.

    Args:
        character_id: Unique identifier of the character
        book: Book file to upload
        repo: Character repository dependency
        storage: File storage dependency
        indexing_service: Indexing service dependency
        chroma_client: ChromaDB client dependency
        embedding_generator: Embedding generator dependency
        text_chunker: Text chunker dependency

    Returns:
        Book: Created book record

    Raises:
        HTTPException: If character not found or file validation fails
    """
    from uuid import uuid4
    from datetime import datetime

    try:
        # 1. Check character exists
        await repo.get_character_by_id(character_id)

        # 2. Validate book file
        FileValidator.validate_book(book.filename, book.size or 0)

        # 3. Save book file
        book_id = str(uuid4())
        book_content = await book.read()
        await storage.save_book(character_id, book_id, book_content, book.filename)

        # 4. Create book record
        book_data = Book(
            id=book_id,
            character_id=character_id,
            filename=book.filename,
            file_size=book.size or 0,
            uploaded_at=datetime.utcnow(),
            indexed=False
        )
        created_book = await repo.create_book(book_data)

        # 5. Start async indexing using FastAPI BackgroundTasks
        # Use character-specific ChromaDB client for isolation
        from api.dependencies import get_character_chroma_client
        character_chroma_client = get_character_chroma_client(character_id)
        kb_manager = get_knowledge_base_manager(
            character_id, character_chroma_client, embedding_generator, text_chunker
        )

        # Add indexing task to background tasks
        # Use run_book_indexing which is designed for BackgroundTasks
        # Note: run_book_indexing creates its own database session internally
        background_tasks.add_task(
            indexing_service.run_book_indexing,
            character_id,
            book_id,
            kb_manager
        )

        return created_book

    except CharacterNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except (InvalidFileTypeError, Exception) as e:
        raise HTTPException(status_code=400 if isinstance(e, InvalidFileTypeError) else 500, detail=str(e))


@router.delete("/{book_id}", status_code=200)
async def delete_book(
    character_id: str,
    book_id: str,
    repo: CharacterRepository = Depends(get_character_repo),
    storage: FileStorage = Depends(get_file_storage),
    chroma_client: ChromaClient = Depends(get_chroma_client),
    embedding_generator: EmbeddingGenerator = Depends(get_embedding_generator),
    text_chunker: TextChunker = Depends(get_text_chunker)
):
    """
    Delete a book from character's knowledge base.

    Args:
        character_id: Unique identifier of the character
        book_id: Unique identifier of the book
        repo: Character repository dependency
        storage: File storage dependency
        chroma_client: ChromaDB client dependency
        embedding_generator: Embedding generator dependency
        text_chunker: Text chunker dependency

    Returns:
        dict: Success message

    Raises:
        HTTPException: If character or book not found
    """
    try:
        # 1. Check character exists
        await repo.get_character_by_id(character_id)

        # 2. Get book to get filename
        book = await repo.get_book_by_id(book_id)
        if not book or book.character_id != character_id:
            raise BookNotFoundError(f"Book {book_id} not found for character {character_id}")

        # 3. Delete from knowledge base
        # Use character-specific ChromaDB client
        from api.dependencies import get_character_chroma_client
        character_chroma_client = get_character_chroma_client(character_id)
        kb_manager = get_knowledge_base_manager(
            character_id, character_chroma_client, embedding_generator, text_chunker
        )
        await kb_manager.delete_book_from_kb(book_id)

        # 4. Delete book file
        await storage.delete_book(character_id, book_id)

        # 5. Delete book record from database
        await repo.delete_book(book_id)

        return {"message": "Book deleted successfully"}

    except (CharacterNotFoundError, BookNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete book: {str(e)}")
