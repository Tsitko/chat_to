"""
Pytest configuration and shared fixtures for STT tests.

This module provides common fixtures, test utilities, and configuration
for all STT backend tests. Fixtures help reduce code duplication and
provide consistent test data across test suites.
"""

import pytest
from unittest.mock import Mock, MagicMock
from io import BytesIO
import json


# ============================================================================
# Configuration Fixtures
# ============================================================================

@pytest.fixture
def stt_config_values():
    """Provide standard STT configuration values for testing."""
    return {
        "service_url": "http://localhost:8013",
        "timeout": 300.0,
        "max_file_size": 10 * 1024 * 1024,
        "allowed_formats": [".webm", ".ogg", ".wav", ".mp3", ".m4a"]
    }


# ============================================================================
# Mock Data Fixtures
# ============================================================================

@pytest.fixture
def sample_audio_data():
    """Provide sample audio data for testing."""
    return b"fake audio data for testing purposes"


@pytest.fixture
def sample_webm_audio():
    """Provide sample WebM audio data."""
    return b"fake webm opus audio from browser"


@pytest.fixture
def sample_large_audio():
    """Provide large audio data for size testing (5MB)."""
    return b"x" * (5 * 1024 * 1024)


@pytest.fixture
def empty_audio():
    """Provide empty audio data."""
    return b""


# ============================================================================
# File Object Fixtures
# ============================================================================

@pytest.fixture
def audio_file():
    """Provide a file-like object with audio data."""
    return BytesIO(b"fake audio data")


@pytest.fixture
def webm_file():
    """Provide a WebM file-like object."""
    return BytesIO(b"fake webm data")


@pytest.fixture
def large_audio_file():
    """Provide a large file-like object."""
    return BytesIO(b"x" * (5 * 1024 * 1024))


# ============================================================================
# STT Service Response Fixtures
# ============================================================================

@pytest.fixture
def successful_stt_response():
    """Provide a successful STT service response."""
    return {
        "processed_text": "This is the processed transcription",
        "raw_text": "This is the raw transcription"
    }


@pytest.fixture
def raw_text_only_response():
    """Provide STT response with only raw_text."""
    return {
        "raw_text": "This is only raw text"
    }


@pytest.fixture
def empty_transcription_response():
    """Provide STT response with empty transcriptions."""
    return {
        "processed_text": "",
        "raw_text": ""
    }


@pytest.fixture
def unicode_transcription_response():
    """Provide STT response with unicode text."""
    return {
        "processed_text": "Привет, мир! 你好世界 🌍",
        "raw_text": "Privet mir"
    }


@pytest.fixture
def long_transcription_response():
    """Provide STT response with very long text."""
    return {
        "processed_text": "This is a long transcription. " * 1000,
        "raw_text": "Short raw text"
    }


@pytest.fixture
def malformed_response():
    """Provide malformed STT response."""
    return {
        "unexpected_field": "value",
        "another_field": 123
    }


# ============================================================================
# Mock Response Object Fixtures
# ============================================================================

@pytest.fixture
def mock_success_response(successful_stt_response):
    """Provide a mock successful HTTP response."""
    mock_response = Mock()
    mock_response.status_code = 200
    mock_response.json.return_value = successful_stt_response
    mock_response.raise_for_status = Mock()
    return mock_response


@pytest.fixture
def mock_timeout_response():
    """Provide a mock timeout exception."""
    import requests
    return requests.exceptions.Timeout("Request timed out")


@pytest.fixture
def mock_connection_error():
    """Provide a mock connection error exception."""
    import requests
    return requests.exceptions.ConnectionError("Connection refused")


@pytest.fixture
def mock_http_error():
    """Provide a mock HTTP error response."""
    import requests
    mock_response = Mock()
    mock_response.status_code = 500
    mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(
        "500 Internal Server Error"
    )
    return mock_response


@pytest.fixture
def mock_json_decode_error():
    """Provide a mock JSON decode error."""
    return json.JSONDecodeError("Invalid JSON", "", 0)


# ============================================================================
# STT Client Fixtures
# ============================================================================

@pytest.fixture
def stt_client():
    """Provide a configured STTClient instance."""
    from utils.stt_client import STTClient
    return STTClient(
        service_url="http://localhost:8013",
        timeout=300.0
    )


@pytest.fixture
def mock_stt_client():
    """Provide a mock STTClient for testing."""
    mock_client = Mock()
    mock_client.service_url = "http://localhost:8013"
    mock_client.timeout = 300.0
    mock_client.transcribe_audio = Mock(return_value="Mocked transcription")
    return mock_client


# ============================================================================
# FastAPI Test Client Fixtures
# ============================================================================

@pytest.fixture
def test_app():
    """Provide a FastAPI test application with STT routes."""
    from fastapi import FastAPI
    from api.stt_routes import router

    app = FastAPI()
    app.include_router(router)
    return app


@pytest.fixture
def test_client(test_app):
    """Provide a FastAPI TestClient instance."""
    from fastapi.testclient import TestClient
    return TestClient(test_app)


# ============================================================================
# File Upload Fixtures
# ============================================================================

@pytest.fixture
def valid_wav_upload():
    """Provide valid WAV file upload data."""
    return {
        "filename": "recording.wav",
        "content": b"fake wav audio data",
        "content_type": "audio/wav"
    }


@pytest.fixture
def valid_webm_upload():
    """Provide valid WebM file upload data."""
    return {
        "filename": "recording.webm",
        "content": b"fake webm audio data",
        "content_type": "audio/webm"
    }


@pytest.fixture
def valid_mp3_upload():
    """Provide valid MP3 file upload data."""
    return {
        "filename": "recording.mp3",
        "content": b"fake mp3 audio data",
        "content_type": "audio/mpeg"
    }


@pytest.fixture
def invalid_pdf_upload():
    """Provide invalid PDF file upload data."""
    return {
        "filename": "document.pdf",
        "content": b"fake pdf data",
        "content_type": "application/pdf"
    }


@pytest.fixture
def oversized_file_upload():
    """Provide oversized file upload data."""
    from configs.stt_config import STT_MAX_FILE_SIZE
    return {
        "filename": "huge.wav",
        "content": b"x" * (STT_MAX_FILE_SIZE + 1000),
        "content_type": "audio/wav"
    }


# ============================================================================
# Test Utility Functions
# ============================================================================

@pytest.fixture
def create_multipart_files():
    """Provide a helper function to create multipart file upload data."""
    def _create_files(filename, content, content_type):
        return {"file": (filename, content, content_type)}
    return _create_files


@pytest.fixture
def assert_error_response():
    """Provide a helper function to assert error response structure."""
    def _assert_error(response, expected_status, expected_keywords=None):
        assert response.status_code == expected_status
        data = response.json()
        assert "detail" in data
        if expected_keywords:
            detail_lower = data["detail"].lower()
            for keyword in expected_keywords:
                assert keyword.lower() in detail_lower
    return _assert_error


# ============================================================================
# Pytest Markers
# ============================================================================

def pytest_configure(config):
    """Register custom pytest markers."""
    config.addinivalue_line(
        "markers", "unit: mark test as a unit test (isolated component)"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test (multiple components)"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running (> 1 second)"
    )
    config.addinivalue_line(
        "markers", "edge_case: mark test as testing edge cases or boundary conditions"
    )


# ============================================================================
# Test Collection Hooks
# ============================================================================

def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers automatically based on test location."""
    for item in items:
        # Auto-mark integration tests
        if "integration" in item.nodeid:
            item.add_marker(pytest.mark.integration)

        # Auto-mark edge case tests
        if "edge" in item.name.lower() or "boundary" in item.name.lower():
            item.add_marker(pytest.mark.edge_case)
