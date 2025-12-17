"""
Pytest configuration and fixtures.

This module provides common fixtures for all tests.
"""

import os
import sys
import tempfile
import shutil
import asyncio
from pathlib import Path
from typing import Generator
import pytest
from unittest.mock import MagicMock, AsyncMock

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))


# Test data paths
@pytest.fixture(scope="session")
def test_data_dir() -> Path:
    """Get the test data directory containing Hegel materials."""
    return Path(__file__).parent.parent / "Гегель"


@pytest.fixture(scope="session")
def hegel_avatar_path(test_data_dir: Path) -> Path:
    """Path to Hegel's avatar image."""
    return test_data_dir / "gegel-3.jpg"


@pytest.fixture(scope="session")
def hegel_book_paths(test_data_dir: Path) -> list[Path]:
    """Paths to all Hegel's books."""
    return list(test_data_dir.glob("*.txt"))


@pytest.fixture
def temp_dir() -> Generator[Path, None, None]:
    """Create a temporary directory for tests."""
    temp_path = Path(tempfile.mkdtemp())
    yield temp_path
    # Cleanup
    if temp_path.exists():
        shutil.rmtree(temp_path, ignore_errors=True)


@pytest.fixture
def temp_data_dir(temp_dir: Path) -> Path:
    """Create a temporary data directory structure."""
    data_dir = temp_dir / "data"
    (data_dir / "characters").mkdir(parents=True)
    (data_dir / "books").mkdir(parents=True)
    (data_dir / "avatars").mkdir(parents=True)
    (data_dir / "chroma").mkdir(parents=True)
    return data_dir


# Sample data fixtures
@pytest.fixture
def sample_text() -> str:
    """Sample text for testing chunking and embedding."""
    return """Философия есть наука о всеобщем.
    Она исследует природу мышления и бытия в их единстве.
    Диалектический метод позволяет понять противоречия как движущую силу развития.
    Абсолютный дух раскрывается в истории через искусство, религию и философию."""


@pytest.fixture
def sample_long_text() -> str:
    """Long sample text for testing chunking with overlap."""
    base_text = "This is a test sentence number {}. " * 50
    return "".join(base_text.format(i) for i in range(100))


@pytest.fixture
def sample_character_data() -> dict:
    """Sample character data for testing."""
    return {
        "id": "test-char-001",
        "name": "Георг Вильгельм Фридрих Гегель",
        "avatar_url": "/api/characters/test-char-001/avatar",
        "books": []
    }


@pytest.fixture
def sample_book_data() -> dict:
    """Sample book data for testing."""
    return {
        "id": "test-book-001",
        "filename": "test_book.txt",
        "file_size": 1024,
        "indexed": False
    }


@pytest.fixture
def sample_message_data() -> dict:
    """Sample message data for testing."""
    return {
        "role": "user",
        "content": "Что такое диалектика?"
    }


@pytest.fixture
def sample_chat_history() -> list[dict]:
    """Sample chat history for testing."""
    return [
        {"role": "user", "content": "Что такое диалектика?"},
        {"role": "assistant", "content": "Диалектика - это метод познания противоречий."},
        {"role": "user", "content": "Расскажите подробнее."},
    ]


# Mock fixtures for unit tests
@pytest.fixture
def mock_embedding_generator():
    """Mock embedding generator for unit tests."""
    mock = AsyncMock()
    mock.generate_indexing_embedding.return_value = [0.1, 0.2, 0.3] * 128
    mock.generate_query_embedding.return_value = [0.1, 0.2, 0.3] * 128
    mock.generate_batch_embeddings.return_value = [[0.1, 0.2, 0.3] * 128] * 5
    return mock


@pytest.fixture
def mock_chroma_client():
    """Mock ChromaDB client for unit tests."""
    mock = MagicMock()
    mock.get_or_create_collection.return_value = MagicMock()
    mock.add_documents.return_value = None
    mock.query_documents.return_value = {
        "documents": [["Sample text 1", "Sample text 2"]],
        "metadatas": [[{"book_id": "test"}, {"book_id": "test"}]],
        "distances": [[0.1, 0.2]]
    }
    mock.collection_exists.return_value = True
    mock.get_collection_count.return_value = 10
    return mock


@pytest.fixture
def mock_text_chunker():
    """Mock text chunker for unit tests."""
    mock = MagicMock()
    mock.chunk_text.return_value = ["chunk1", "chunk2", "chunk3"]
    mock.chunk_with_metadata.return_value = [
        ("chunk1", {"index": 0}),
        ("chunk2", {"index": 1}),
        ("chunk3", {"index": 2})
    ]
    return mock


@pytest.fixture
def mock_ollama_client():
    """Mock Ollama client for unit tests."""
    mock = AsyncMock()
    mock.generate_response.return_value = "This is a mocked response from the LLM."
    return mock


@pytest.fixture
def mock_file_storage():
    """Mock file storage for unit tests."""
    mock = AsyncMock()
    mock.save_avatar.return_value = "/avatars/test-char-001.jpg"
    mock.save_book.return_value = "/books/test-char-001/test-book-001.txt"
    mock.read_book_content.return_value = b"Sample book content"
    return mock


@pytest.fixture
def mock_character_repository():
    """Mock character repository for unit tests."""
    from models import Character

    mock = AsyncMock()
    mock.create_character.return_value = Character(
        id="test-char-001",
        name="Test Character",
        books=[]
    )
    mock.get_character_by_id.return_value = Character(
        id="test-char-001",
        name="Test Character",
        books=[]
    )
    mock.get_all_characters.return_value = []
    return mock


@pytest.fixture
def mock_message_repository():
    """Mock message repository for unit tests."""
    from models import Message

    mock = AsyncMock()
    mock.save_message.return_value = Message(
        id="test-msg-001",
        role="user",
        content="Test message"
    )
    mock.get_messages.return_value = ([], 0)
    mock.get_recent_messages.return_value = []
    return mock


@pytest.fixture
def mock_knowledge_base_manager():
    """Mock knowledge base manager for unit tests."""
    mock = AsyncMock()
    mock.index_book.return_value = None
    mock.index_message.return_value = None
    mock.search_books_kb.return_value = ["Context from books"]
    mock.search_conversations_kb.return_value = ["Previous discussion"]
    return mock


# E2E test fixtures with sync database
@pytest.fixture
def sync_test_db(temp_data_dir: Path):
    """
    Create a synchronous test database for E2E tests.

    This fixture sets up a sync SQLite database that works with FastAPI's TestClient.
    Uses test configuration to ensure isolation from production database.
    """
    from storage.database import Database, set_test_database
    from configs.test_config import get_test_db_path

    # Use test database path from test configuration
    # This ensures all tests use an isolated test database
    test_db_path = str(temp_data_dir / "test.db")
    test_db = Database(db_path=test_db_path, use_sync=True)
    test_db.init_db()

    # Set as global database instance
    set_test_database(test_db)

    yield test_db

    # Cleanup: dispose engine and clear global state
    if test_db.engine:
        test_db.engine.dispose()

    # Reset global database instance to None to prevent test pollution
    set_test_database(None)


@pytest.fixture
def test_client(sync_test_db, temp_data_dir):
    """
    Create FastAPI TestClient with sync database for E2E tests.

    This uses FastAPI's synchronous TestClient which works perfectly
    with sync database sessions. All file operations and database operations
    are isolated to the temp_data_dir to prevent affecting production data.
    """
    from fastapi.testclient import TestClient
    import os

    # Save original environment variables
    original_data_dir = os.environ.get('DATA_DIR')
    original_chroma_dir = os.environ.get('CHROMA_DIR')

    # Set test environment variables
    os.environ['DATA_DIR'] = str(temp_data_dir)
    os.environ['CHROMA_DIR'] = str(temp_data_dir / "chroma")

    # Import app AFTER setting environment variables
    from main import create_app

    app = create_app()

    # Override the database dependencies to use sync sessions
    # We need to import after app creation
    from api.character_routes import get_character_repo as char_routes_get_character_repo
    from api.message_routes import get_character_repo as msg_routes_get_character_repo
    from api.message_routes import get_message_repo
    from api.book_routes import get_character_repo as book_routes_get_character_repo
    from api.indexing_routes import get_character_repo as idx_routes_get_character_repo
    from storage.sync_repositories import SyncCharacterRepository, SyncMessageRepository

    def override_get_character_repo():
        session_factory = sync_test_db.get_session_factory()
        with session_factory() as session:
            yield SyncCharacterRepository(session)

    def override_get_message_repo():
        session_factory = sync_test_db.get_session_factory()
        with session_factory() as session:
            yield SyncMessageRepository(session)

    # Apply overrides for all routes that use these dependencies
    app.dependency_overrides[char_routes_get_character_repo] = override_get_character_repo
    app.dependency_overrides[msg_routes_get_character_repo] = override_get_character_repo
    app.dependency_overrides[book_routes_get_character_repo] = override_get_character_repo
    app.dependency_overrides[idx_routes_get_character_repo] = override_get_character_repo
    app.dependency_overrides[get_message_repo] = override_get_message_repo

    client = TestClient(app)

    yield client

    # Cleanup: clear overrides and restore environment variables
    app.dependency_overrides.clear()

    if original_data_dir:
        os.environ['DATA_DIR'] = original_data_dir
    else:
        os.environ.pop('DATA_DIR', None)

    if original_chroma_dir:
        os.environ['CHROMA_DIR'] = original_chroma_dir
    else:
        os.environ.pop('CHROMA_DIR', None)


# Pytest configuration
def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line("markers", "unit: mark test as a unit test")
    config.addinivalue_line("markers", "integration: mark test as an integration test")
    config.addinivalue_line("markers", "e2e: mark test as an end-to-end test")
    config.addinivalue_line("markers", "slow: mark test as slow running")
    config.addinivalue_line("markers", "requires_ollama: mark test as requiring Ollama")
