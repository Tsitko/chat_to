"""
Pytest configuration and shared fixtures for group chat tests.

This module provides common fixtures, test utilities, and configuration
for all group chat backend tests. Fixtures help reduce code duplication
and provide consistent test data across test suites.
"""

import pytest
from unittest.mock import Mock, AsyncMock, MagicMock
from datetime import datetime
from typing import List, Dict
import uuid

from models import Message, Character, Emotions
from models.group_message import GroupMessageRequest, CharacterResponse, GroupMessageResponse


# ============================================================================
# Test Character Fixtures
# ============================================================================

@pytest.fixture
def hegel_character():
    """Provide Hegel test character."""
    return Character(
        id="hegel-id-123",
        name="Гегель",
        avatar_url="/avatars/hegel.jpg",
        created_at=datetime(2024, 1, 1, 12, 0, 0),
        books=[]
    )


@pytest.fixture
def marx_character():
    """Provide Marx test character."""
    return Character(
        id="marx-id-456",
        name="Маркс",
        avatar_url="/avatars/marx.jpg",
        created_at=datetime(2024, 1, 2, 12, 0, 0),
        books=[]
    )


@pytest.fixture
def stalin_character():
    """Provide Stalin test character."""
    return Character(
        id="stalin-id-789",
        name="Сталин",
        avatar_url="/avatars/stalin.jpg",
        created_at=datetime(2024, 1, 3, 12, 0, 0),
        books=[]
    )


@pytest.fixture
def test_characters(hegel_character, marx_character, stalin_character):
    """Provide list of all test characters."""
    return [hegel_character, marx_character, stalin_character]


@pytest.fixture
def test_character_ids(test_characters):
    """Provide list of test character IDs."""
    return [char.id for char in test_characters]


# ============================================================================
# Message Fixtures
# ============================================================================

@pytest.fixture
def sample_user_message():
    """Provide sample user message."""
    return Message(
        id=str(uuid.uuid4()),
        role="user",
        content="Что вы думаете о диалектике?",
        created_at=datetime.utcnow(),
        character_id="hegel-id-123",
        emotions=None
    )


@pytest.fixture
def sample_assistant_message():
    """Provide sample assistant message with emotions."""
    emotions = Emotions(
        fear=0.1,
        anger=0.0,
        sadness=0.2,
        disgust=0.0,
        joy=0.7
    )
    return Message(
        id=str(uuid.uuid4()),
        role="assistant",
        content="Диалектика - это метод познания противоречий...",
        created_at=datetime.utcnow(),
        character_id="hegel-id-123",
        emotions=emotions
    )


@pytest.fixture
def message_history(sample_user_message, sample_assistant_message):
    """Provide sample message history (last 5 messages)."""
    messages = []
    for i in range(5):
        if i % 2 == 0:
            msg = Message(
                id=str(uuid.uuid4()),
                role="user",
                content=f"User message {i}",
                created_at=datetime(2024, 1, 1, 12, i, 0),
                character_id="hegel-id-123"
            )
        else:
            msg = Message(
                id=str(uuid.uuid4()),
                role="assistant",
                content=f"Assistant message {i}",
                created_at=datetime(2024, 1, 1, 12, i, 0),
                character_id="hegel-id-123",
                emotions=Emotions(fear=0.1, anger=0.0, sadness=0.0, disgust=0.0, joy=0.9)
            )
        messages.append(msg)
    return messages


# ============================================================================
# Request/Response Fixtures
# ============================================================================

@pytest.fixture
def valid_group_message_request(test_character_ids):
    """Provide valid group message request."""
    return GroupMessageRequest(
        content="Что такое диалектический материализм?",
        character_ids=test_character_ids
    )


@pytest.fixture
def single_character_request():
    """Provide group message request with single character."""
    return GroupMessageRequest(
        content="Tell me about dialectics",
        character_ids=["hegel-id-123"]
    )


@pytest.fixture
def successful_character_response(hegel_character, sample_assistant_message):
    """Provide successful character response."""
    return CharacterResponse(
        character_id=hegel_character.id,
        character_name=hegel_character.name,
        message=sample_assistant_message,
        error=None,
        success=True
    )


@pytest.fixture
def failed_character_response(marx_character):
    """Provide failed character response."""
    return CharacterResponse(
        character_id=marx_character.id,
        character_name=marx_character.name,
        message=None,
        error="LLM service timeout",
        success=False
    )


@pytest.fixture
def group_message_response(sample_user_message, successful_character_response):
    """Provide complete group message response."""
    return GroupMessageResponse(
        user_message=sample_user_message,
        character_responses=[successful_character_response],
        total_characters=1,
        successful_responses=1,
        failed_responses=0
    )


# ============================================================================
# Mock Repository Fixtures
# ============================================================================

@pytest.fixture
def mock_character_repository(test_characters):
    """Provide mock character repository."""
    repo = AsyncMock()

    async def get_by_id(character_id: str):
        for char in test_characters:
            if char.id == character_id:
                return char
        return None

    repo.get_by_id = AsyncMock(side_effect=get_by_id)
    return repo


@pytest.fixture
def mock_message_repository(message_history):
    """Provide mock message repository."""
    repo = AsyncMock()

    async def get_messages_by_character(character_id: str, limit: int, offset: int):
        # Return message history for testing
        return message_history[:limit]

    async def save_message(character_id: str, message: Message):
        # Mock save operation
        return message

    repo.get_messages_by_character = AsyncMock(side_effect=get_messages_by_character)
    repo.save_message = AsyncMock(side_effect=save_message)
    return repo


# ============================================================================
# Mock KB Manager Fixtures
# ============================================================================

@pytest.fixture
def mock_kb_manager():
    """Provide mock knowledge base manager."""
    kb_manager = AsyncMock()

    async def search_books_kb(query: str, n_results: int = 5):
        return [
            "Context from book 1 about dialectics",
            "Context from book 2 about materialism",
            "Context from book 3 about philosophy"
        ]

    async def search_conversations_kb(query: str, n_results: int = 3):
        return [
            "Previous discussion about Hegel",
            "Previous discussion about Marx"
        ]

    async def index_message(message_id: str, content: str):
        return True

    kb_manager.search_books_kb = AsyncMock(side_effect=search_books_kb)
    kb_manager.search_conversations_kb = AsyncMock(side_effect=search_conversations_kb)
    kb_manager.index_message = AsyncMock(side_effect=index_message)

    return kb_manager


@pytest.fixture
def mock_kb_managers_dict(test_character_ids, mock_kb_manager):
    """Provide dictionary of KB managers for all test characters."""
    return {char_id: mock_kb_manager for char_id in test_character_ids}


# ============================================================================
# Mock Ollama Client Fixtures
# ============================================================================

@pytest.fixture
def mock_ollama_client():
    """Provide mock Ollama client."""
    client = AsyncMock()

    async def generate_response(system_prompt: str, user_prompt: str, temperature: float = 0.7):
        return "This is a mock LLM response from the character."

    client.generate_response = AsyncMock(side_effect=generate_response)

    return client


# ============================================================================
# Mock ChatService Fixtures
# ============================================================================

@pytest.fixture
def mock_chat_service(sample_assistant_message):
    """Provide mock ChatService."""
    service = AsyncMock()

    async def generate_response(user_message_content: str):
        # Return mock response with emotions
        emotions = Emotions(
            fear=0.1,
            anger=0.0,
            sadness=0.2,
            disgust=0.0,
            joy=0.7
        )
        return "Mock character response", emotions

    service._generate_response = AsyncMock(side_effect=generate_response)

    return service


# ============================================================================
# Emotion Fixtures
# ============================================================================

@pytest.fixture
def high_joy_emotions():
    """Provide emotions with high joy (low temperature)."""
    return Emotions(
        fear=0.0,
        anger=0.0,
        sadness=0.1,
        disgust=0.0,
        joy=0.9
    )


@pytest.fixture
def high_anger_emotions():
    """Provide emotions with high anger (high temperature)."""
    return Emotions(
        fear=0.2,
        anger=0.8,
        sadness=0.0,
        disgust=0.1,
        joy=0.0
    )


@pytest.fixture
def neutral_emotions():
    """Provide neutral emotions (medium temperature)."""
    return Emotions(
        fear=0.2,
        anger=0.2,
        sadness=0.2,
        disgust=0.2,
        joy=0.2
    )


# ============================================================================
# Group Chat Service Fixtures
# ============================================================================

@pytest.fixture
def group_chat_service(mock_character_repository, mock_message_repository):
    """Provide GroupChatService instance with mock dependencies."""
    from chat_handler.group_chat_service import GroupChatService
    return GroupChatService(
        character_repository=mock_character_repository,
        message_repository=mock_message_repository
    )


# ============================================================================
# Test Utility Functions
# ============================================================================

@pytest.fixture
def create_test_message():
    """Provide helper to create test messages."""
    def _create(role: str, content: str, character_id: str, emotions: Emotions = None):
        return Message(
            id=str(uuid.uuid4()),
            role=role,
            content=content,
            created_at=datetime.utcnow(),
            character_id=character_id,
            emotions=emotions
        )
    return _create


@pytest.fixture
def create_message_window():
    """Provide helper to create message windows for testing."""
    def _create_window(size: int, character_id: str):
        messages = []
        for i in range(size):
            msg = Message(
                id=str(uuid.uuid4()),
                role="user" if i % 2 == 0 else "assistant",
                content=f"Message {i}",
                created_at=datetime(2024, 1, 1, 12, i, 0),
                character_id=character_id
            )
            messages.append(msg)
        return messages
    return _create_window


@pytest.fixture
def assert_character_response():
    """Provide helper to assert character response structure."""
    def _assert(response: CharacterResponse, expected_success: bool):
        assert isinstance(response, CharacterResponse)
        assert response.success == expected_success
        assert response.character_id is not None
        assert response.character_name is not None

        if expected_success:
            assert response.message is not None
            assert response.error is None
        else:
            assert response.message is None
            assert response.error is not None

    return _assert


@pytest.fixture
def assert_group_response():
    """Provide helper to assert group response structure."""
    def _assert(response: GroupMessageResponse, expected_total: int):
        assert isinstance(response, GroupMessageResponse)
        assert response.user_message is not None
        assert len(response.character_responses) == expected_total
        assert response.total_characters == expected_total
        assert response.successful_responses + response.failed_responses == expected_total

    return _assert


# ============================================================================
# Configuration Fixtures
# ============================================================================

@pytest.fixture
def group_chat_config():
    """Provide group chat configuration values."""
    from configs.group_chat_config import (
        MAX_CHARACTERS_PER_GROUP,
        MESSAGE_WINDOW_SIZE,
        CHARACTER_TIMEOUT_SECONDS,
        TOTAL_GROUP_TIMEOUT_SECONDS,
        CONTINUE_ON_CHARACTER_FAILURE
    )
    return {
        "max_characters": MAX_CHARACTERS_PER_GROUP,
        "window_size": MESSAGE_WINDOW_SIZE,
        "character_timeout": CHARACTER_TIMEOUT_SECONDS,
        "total_timeout": TOTAL_GROUP_TIMEOUT_SECONDS,
        "continue_on_failure": CONTINUE_ON_CHARACTER_FAILURE
    }


# ============================================================================
# Edge Case Fixtures
# ============================================================================

@pytest.fixture
def max_group_size_character_ids():
    """Provide character IDs list at maximum allowed size."""
    from configs.group_chat_config import MAX_CHARACTERS_PER_GROUP
    return [f"char-{i}" for i in range(MAX_CHARACTERS_PER_GROUP)]


@pytest.fixture
def oversized_group_character_ids():
    """Provide character IDs list exceeding maximum size."""
    from configs.group_chat_config import MAX_CHARACTERS_PER_GROUP
    return [f"char-{i}" for i in range(MAX_CHARACTERS_PER_GROUP + 5)]


@pytest.fixture
def duplicate_character_ids():
    """Provide list with duplicate character IDs."""
    return ["hegel-id-123", "marx-id-456", "hegel-id-123"]


@pytest.fixture
def empty_character_ids():
    """Provide empty character IDs list."""
    return []


# ============================================================================
# Pytest Markers
# ============================================================================

def pytest_configure(config):
    """Register custom pytest markers for group chat tests."""
    config.addinivalue_line(
        "markers", "group_chat_unit: mark test as group chat unit test"
    )
    config.addinivalue_line(
        "markers", "group_chat_integration: mark test as group chat integration test"
    )
    config.addinivalue_line(
        "markers", "group_chat_e2e: mark test as group chat end-to-end test"
    )
    config.addinivalue_line(
        "markers", "sliding_window: mark test as testing sliding window behavior"
    )
    config.addinivalue_line(
        "markers", "partial_failure: mark test as testing partial failure scenarios"
    )
