"""
Indexing service for asynchronous book indexing.

This module handles asynchronous indexing of books into knowledge bases.
Depends on: knowledge_base, utils, storage
"""

from typing import Dict
import asyncio
from enum import Enum

from knowledge_base import KnowledgeBaseManager
from utils import DocumentParser
from storage import FileStorage, CharacterRepository
from exceptions import IndexingError


class IndexingStatus(str, Enum):
    """Enum for indexing statuses."""
    PENDING = "pending"
    INDEXING = "indexing"
    COMPLETED = "completed"
    FAILED = "failed"


class IndexingService:
    """
    Manages asynchronous indexing of books for characters.

    This service runs indexing tasks in the background and tracks their status.
    """

    def __init__(self, file_storage: FileStorage, character_repository: CharacterRepository = None):
        """
        Initialize indexing service.

        Args:
            file_storage: File storage instance
            character_repository: Character repository instance (optional, can be None for singleton)
        """
        self.file_storage = file_storage
        self.character_repository = character_repository
        self.document_parser = DocumentParser()
        # In-memory status tracking: {character_id: {book_id: {"status": ..., "progress": ...}}}
        self._indexing_status: Dict[str, Dict[str, Dict]] = {}
        # Keep references to running tasks to prevent garbage collection
        self._running_tasks: Dict[str, asyncio.Task] = {}

    async def run_book_indexing(self, character_id: str, book_id: str,
                                 kb_manager: KnowledgeBaseManager) -> None:
        """
        Run book indexing task (to be used with FastAPI BackgroundTasks).

        This method is designed to be called by FastAPI's background task system.
        It directly executes the indexing task without creating additional tasks.
        It creates its own database session to avoid session conflicts.

        Args:
            character_id: Unique identifier of the character
            book_id: Unique identifier of the book
            kb_manager: Knowledge base manager for the character
        """
        # Set initial status to pending
        self._update_status(character_id, book_id, IndexingStatus.PENDING, 0)

        # Create a new database session for this background task
        from storage.database import get_database
        db = get_database()
        session_factory = db.get_session_factory()

        try:
            if db.use_sync:
                # For sync mode, create session
                session = session_factory()
                try:
                    repo = CharacterRepository(session)
                    await self._index_book_task(character_id, book_id, kb_manager, repo)
                finally:
                    session.close()
            else:
                # For async mode
                async with session_factory() as session:
                    repo = CharacterRepository(session)
                    await self._index_book_task(character_id, book_id, kb_manager, repo)
        except Exception as e:
            print(f"ERROR in run_book_indexing: {e}")
            import traceback
            traceback.print_exc()

    async def start_book_indexing(self, character_id: str, book_id: str,
                                  kb_manager: KnowledgeBaseManager) -> None:
        """
        Start asynchronous indexing of a book.

        Args:
            character_id: Unique identifier of the character
            book_id: Unique identifier of the book
            kb_manager: Knowledge base manager for the character

        Raises:
            IndexingError: If indexing fails
        """
        print(f"[IndexingService.start_book_indexing] Called for character={character_id}, book={book_id}")
        print(f"[IndexingService.start_book_indexing] character_repository={'None' if self.character_repository is None else 'present'}")

        # Set initial status to pending
        self._update_status(character_id, book_id, IndexingStatus.PENDING, 0)
        print(f"[IndexingService.start_book_indexing] Status set to PENDING")

        # Start indexing task in background and keep reference
        task_key = f"{character_id}_{book_id}"
        try:
            task = asyncio.create_task(self._index_book_task(character_id, book_id, kb_manager, self.character_repository))
            self._running_tasks[task_key] = task
            print(f"[IndexingService.start_book_indexing] Task created and stored with key={task_key}")

            # Give the task a chance to start by yielding control to event loop
            await asyncio.sleep(0)
            print(f"[IndexingService.start_book_indexing] Task should have started now")

            # Remove task from tracking when done
            def task_done_callback(t):
                self._running_tasks.pop(task_key, None)
                print(f"[IndexingService.start_book_indexing] Task completed for key={task_key}")
                if t.exception():
                    print(f"[IndexingService.start_book_indexing] Task exception: {t.exception()}")
            task.add_done_callback(task_done_callback)
        except Exception as e:
            print(f"[IndexingService.start_book_indexing] ERROR creating task: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    async def _index_book_task(self, character_id: str, book_id: str,
                              kb_manager: KnowledgeBaseManager,
                              character_repository: CharacterRepository) -> None:
        """
        Background task for indexing a book.

        Args:
            character_id: Unique identifier of the character
            book_id: Unique identifier of the book
            kb_manager: Knowledge base manager for the character
            character_repository: Character repository for database operations
        """
        print(f"[INDEXING TASK START] character={character_id}, book={book_id}")
        print(f"[INDEXING TASK START] character_repository={'None' if character_repository is None else 'present'}")

        try:
            # Check if repository is None
            if character_repository is None:
                error_msg = f"[INDEXING TASK ERROR] character_repository is None for book {book_id}"
                print(error_msg)
                self._update_status(character_id, book_id, IndexingStatus.FAILED, 0)
                return

            # Update status to indexing
            self._update_status(character_id, book_id, IndexingStatus.INDEXING, 0)
            print(f"[INDEXING TASK] Status set to INDEXING for book {book_id}")

            # Get book from database
            print(f"[INDEXING TASK] Getting book {book_id} from database...")
            book = await character_repository.get_book_by_id(book_id)
            if not book:
                raise IndexingError(f"Book {book_id} not found")
            print(f"[INDEXING TASK] Book {book_id} retrieved: {book.filename}")

            # Get book file path
            print(f"[INDEXING TASK] Getting book file path...")
            book_path = await self.file_storage.get_book_path(character_id, book_id)
            print(f"[INDEXING TASK] Book path: {book_path}")

            # Parse document
            self._update_status(character_id, book_id, IndexingStatus.INDEXING, 30)
            print(f"[INDEXING TASK] Parsing document...")
            text = await self.document_parser.parse_file(str(book_path))
            print(f"[INDEXING TASK] Document parsed, text length: {len(text)} chars")

            # Index into knowledge base
            self._update_status(character_id, book_id, IndexingStatus.INDEXING, 60)
            print(f"[INDEXING TASK] Indexing into knowledge base...")
            await kb_manager.index_book(book_id, text)
            print(f"[INDEXING TASK] Indexing complete")

            # Mark book as indexed in database
            self._update_status(character_id, book_id, IndexingStatus.INDEXING, 90)
            print(f"[INDEXING TASK] Marking book as indexed in database...")
            await character_repository.mark_book_indexed(book_id)
            print(f"[INDEXING TASK] Book marked as indexed")

            # Update status to completed
            self._update_status(character_id, book_id, IndexingStatus.COMPLETED, 100)
            print(f"[INDEXING TASK COMPLETED] Book {book_id} successfully indexed")

        except Exception as e:
            # Update status to failed
            self._update_status(character_id, book_id, IndexingStatus.FAILED, 0)
            import traceback
            error_msg = f"[INDEXING TASK ERROR] Book {book_id} failed: {str(e)}\n{traceback.format_exc()}"
            print(error_msg)
            # Store error in status for debugging
            if character_id in self._indexing_status and book_id in self._indexing_status[character_id]:
                self._indexing_status[character_id][book_id]["error"] = str(e)

    async def get_indexing_status(self, character_id: str,
                                  character_repository: CharacterRepository = None) -> Dict:
        """
        Get indexing status for all books of a character.

        Args:
            character_id: Unique identifier of the character
            character_repository: Character repository instance for database operations

        Returns:
            Dict: Indexing status information
        """
        # Use provided repository or fall back to instance repository
        repo = character_repository or self.character_repository

        # Get all books for character
        books = await repo.get_books_by_character(character_id)

        books_indexing = []
        overall_status = IndexingStatus.COMPLETED
        indexed_count = 0

        for book in books:
            status_info = self._get_status(character_id, book.id)
            status_value = status_info["status"]

            # If no in-memory status but book is marked as indexed in DB, it's completed
            if status_value == IndexingStatus.PENDING and book.indexed:
                status_value = IndexingStatus.COMPLETED
                status_info["progress"] = 100

            books_indexing.append({
                "book_id": book.id,
                "status": status_value.value if isinstance(status_value, IndexingStatus) else status_value,
                "progress": status_info["progress"]
            })

            # Count indexed books
            if status_value == IndexingStatus.COMPLETED or status_value == "completed":
                indexed_count += 1

            # Determine overall status
            if status_value == IndexingStatus.FAILED or status_value == "failed":
                overall_status = IndexingStatus.FAILED
            elif (status_value == IndexingStatus.INDEXING or status_value == "indexing") and overall_status != IndexingStatus.FAILED:
                overall_status = IndexingStatus.INDEXING
            elif (status_value == IndexingStatus.PENDING or status_value == "pending") and overall_status not in [IndexingStatus.FAILED, IndexingStatus.INDEXING]:
                overall_status = IndexingStatus.PENDING

        return {
            "books_indexing": books_indexing,
            "overall_status": overall_status.value if isinstance(overall_status, IndexingStatus) else overall_status,
            "total_books": len(books),
            "indexed_books": indexed_count,
            "in_progress": overall_status in [IndexingStatus.INDEXING, IndexingStatus.PENDING, "indexing", "pending"]
        }

    def _update_status(self, character_id: str, book_id: str,
                      status: IndexingStatus, progress: int = 0) -> None:
        """
        Update indexing status in memory.

        Args:
            character_id: Unique identifier of the character
            book_id: Unique identifier of the book
            status: New status
            progress: Progress percentage (0-100)
        """
        if character_id not in self._indexing_status:
            self._indexing_status[character_id] = {}

        self._indexing_status[character_id][book_id] = {
            "status": status,
            "progress": progress
        }

    def _get_status(self, character_id: str, book_id: str) -> Dict:
        """
        Get indexing status for a specific book.

        Args:
            character_id: Unique identifier of the character
            book_id: Unique identifier of the book

        Returns:
            Dict: Status information
        """
        if character_id in self._indexing_status and book_id in self._indexing_status[character_id]:
            return self._indexing_status[character_id][book_id]

        # If no status tracked, default to pending (book might not be indexed yet)
        # The actual status will be determined by checking the database in get_indexing_status
        return {"status": IndexingStatus.PENDING, "progress": 0}
