# TTS Backend Test Suite Summary

## Overview

Comprehensive Test-Driven Development (TDD) test suite for the Text-to-Speech (TTS) backend implementation. This test suite was written **BEFORE** any implementation code, following strict TDD principles and aggressive testing practices.

## Test Coverage

### Total Test Files: 7
- **Unit Tests**: 6 files
- **Integration Tests**: 1 file
- **End-to-End Tests**: 1 file

### Estimated Total Test Cases: 150+

---

## Unit Tests

### 1. Configuration Tests (`test_tts_config.py`)
**Location**: `tests/backend/configs/test_tts_config.py`

**Test Classes**:
- `TestTTSConfig` (14 tests)
- `TestTTSConfigEdgeCases` (3 tests)

**Coverage**:
- ✅ TTS_SERVICE_URL existence and format validation
- ✅ TTS_TIMEOUT value and boundaries (≥300s, ≤3600s)
- ✅ TTS_OUTPUT_DIR path structure and type
- ✅ TTS_MAX_TEXT_LENGTH value (10,000 chars)
- ✅ Configuration constants immutability
- ✅ Export validation from main configs module

**Key Tests**:
- Service URL format (http://localhost:8013)
- Timeout sufficient for LLM processing (300+ seconds)
- Output directory structure (data/audio/)
- DoS prevention (max length validation)

---

### 2. Exception Tests (`test_tts_exceptions.py`)
**Location**: `tests/backend/exceptions/test_tts_exceptions.py`

**Test Classes**:
- `TestTTSServiceUnavailableError` (7 tests)
- `TestTTSTimeoutError` (6 tests)
- `TestTTSProcessingError` (6 tests)
- `TestTTSExceptionHierarchy` (3 tests)
- `TestTTSExceptionUseCases` (4 tests)

**Coverage**:
- ✅ All three custom exceptions can be instantiated
- ✅ Proper inheritance from Exception base class
- ✅ Message preservation and error context
- ✅ Exception distinction in except blocks
- ✅ Realistic error scenarios with details

**Key Tests**:
- TTSServiceUnavailableError for connection failures
- TTSTimeoutError for request timeouts
- TTSProcessingError for service errors
- Exception hierarchy and distinguishability

---

### 3. AudioFileManager Tests (`test_audio_file_manager.py`)
**Location**: `tests/backend/storage/test_audio_file_manager.py`

**Test Classes**:
- `TestAudioFileManagerInitialization` (4 tests)
- `TestGenerateAudioFilepath` (7 tests)
- `TestGetRelativePath` (4 tests)
- `TestGetAbsolutePath` (5 tests)
- `TestEnsureDirectoryExists` (3 tests)
- `TestFileExists` (3 tests)
- `TestAudioFileManagerEdgeCases` (4 tests)
- `TestAudioFileManagerSecurity` (3 tests)

**Coverage**:
- ✅ UUID-based unique filename generation
- ✅ Directory creation and management
- ✅ Absolute to relative path conversion
- ✅ Filename sanitization (directory traversal prevention)
- ✅ File existence checking
- ✅ Unicode filename handling

**Key Tests**:
- UUID ensures filename uniqueness
- .ogg extension for all files
- /audio/ prefix for relative paths
- Directory traversal attack prevention (../ stripping)
- Path.name sanitization for security

---

### 4. TTS Models Tests (`test_tts.py`)
**Location**: `tests/backend/models/test_tts.py`

**Test Classes**:
- `TestTTSRequest` (15 tests)
- `TestTTSRequestValidationBoundaries` (4 tests)
- `TestTTSResponse` (12 tests)
- `TestTTSModelsIntegration` (3 tests)
- `TestTTSModelsErrorMessages` (3 tests)
- `TestTTSModelsEdgeCases` (4 tests)

**Coverage**:
- ✅ TTSRequest validation (1-10,000 chars)
- ✅ Empty text rejection
- ✅ Oversized text rejection
- ✅ Unicode and special character support
- ✅ TTSResponse serialization
- ✅ JSON serialization/deserialization

**Key Tests**:
- min_length=1 (empty text rejected)
- max_length=10,000 (DoS prevention)
- Pydantic validation error messages
- Unicode text support (Cyrillic, Chinese, emoji)
- Model export from main module

---

### 5. TTSClient Tests (`test_tts_client.py`)
**Location**: `tests/backend/utils/test_tts_client.py`

**Test Classes**:
- `TestTTSClientInitialization` (5 tests)
- `TestSynthesizeSpeechSuccess` (8 tests)
- `TestSynthesizeSpeechTimeout` (2 tests)
- `TestSynthesizeSpeechConnectionError` (3 tests)
- `TestSynthesizeSpeechHTTPErrors` (3 tests)
- `TestSynthesizeSpeechResponseParsing` (4 tests)
- `TestTTSClientEdgeCases` (5 tests)
- `TestTTSClientConcurrency` (2 tests)

**Coverage**:
- ✅ HTTP POST to correct endpoint (/tts)
- ✅ Correct JSON payload format
- ✅ Timeout handling (300s)
- ✅ Connection error handling
- ✅ HTTP error handling (400, 500, 503)
- ✅ Response parsing (ogg_path extraction)
- ✅ Fallback to output_path if ogg_path missing

**Key Tests**:
- Calls http://localhost:8013/tts
- Sends {"text": str, "output": str} payload
- Parses {"ogg_path": str} response
- Raises TTSTimeoutError on timeout
- Raises TTSServiceUnavailableError on connection failure
- Raises TTSProcessingError on HTTP errors
- Uses configured timeout (300s default)

---

### 6. Exception Tests (`test_tts_exceptions.py`)
**Already covered above**

---

## Integration Tests

### 7. TTS API Routes Tests (`test_tts_routes.py`)
**Location**: `tests/backend/api/test_tts_routes.py`

**Test Classes**:
- `TestTTSSynthesisEndpoint` (5 tests)
- `TestTTSSynthesisValidation` (6 tests)
- `TestTTSSynthesisErrorHandling` (4 tests)
- `TestAudioFileServing` (4 tests - placeholders)
- `TestTTSEndpointIntegration` (3 tests)
- `TestTTSEndpointSecurity` (3 tests)

**Coverage**:
- ✅ POST /api/tts with valid text (200)
- ✅ Request validation (empty, missing, oversized text)
- ✅ Error handling (503, 504, 500)
- ✅ Dependency injection (get_tts_client, get_audio_file_manager)
- ✅ Relative path in response
- ✅ Complete workflow integration
- ✅ Security (DoS prevention, path sanitization)

**Key Tests**:
- Successful synthesis returns 200 with audio_path
- Empty text returns 422 (validation error)
- Oversized text (>10,000) returns 422
- Service unavailable returns 503
- Timeout returns 504
- Processing error returns 500
- Response contains relative path (/audio/uuid.ogg)
- Internal paths not exposed in errors

---

## End-to-End Tests

### 8. TTS E2E Tests (`test_tts_e2e.py`)
**Location**: `tests/backend/api/test_tts_e2e.py`

**Test Classes**:
- `TestTTSCompleteWorkflow` (3 tests)
- `TestTTSErrorRecovery` (3 tests)
- `TestTTSConcurrency` (2 tests)
- `TestTTSPerformance` (2 tests - marked @slow)
- `TestTTSDataFlow` (2 tests)

**Coverage**:
- ✅ Complete workflow: API → TTS service → file → serving
- ✅ Actual file creation and serving
- ✅ Multiple sequential requests
- ✅ Error recovery (timeout, unavailable)
- ✅ Concurrent request handling
- ✅ Data flow (text and path preservation)
- ✅ Performance with large text

**Key Tests**:
- API request creates actual audio file
- Files can be served after creation
- Multiple requests create unique files
- Timeout recovery works
- Service unavailable recovery works
- Concurrent requests don't interfere
- Text preserved through entire workflow
- Path flow tracked correctly

---

## Test Execution Commands

### Run All TTS Tests
```bash
pytest tests/backend/ -v
```

### Run Unit Tests Only
```bash
pytest tests/backend/ -m unit -v
```

### Run Integration Tests Only
```bash
pytest tests/backend/api/test_tts_routes.py -m integration -v
```

### Run E2E Tests Only
```bash
pytest tests/backend/api/test_tts_e2e.py -m e2e -v
```

### Run Specific Test File
```bash
pytest tests/backend/configs/test_tts_config.py -v
pytest tests/backend/utils/test_tts_client.py -v
pytest tests/backend/storage/test_audio_file_manager.py -v
```

### Run Single Test Class
```bash
pytest tests/backend/utils/test_tts_client.py::TestSynthesizeSpeechSuccess -v
```

### Run Single Test Function
```bash
pytest tests/backend/utils/test_tts_client.py::TestSynthesizeSpeechSuccess::test_synthesize_speech_successful_request -v
```

### Run with Coverage
```bash
pytest tests/backend/ --cov=backend --cov-report=html
```

---

## Test Categories by Marker

### @pytest.mark.unit
- Fast, isolated tests
- Mock all external dependencies
- Test single class/function behavior
- Total: ~100+ tests

### @pytest.mark.integration
- Test multiple components together
- Mock only external services (HTTP)
- Test API endpoints with FastAPI TestClient
- Total: ~25+ tests

### @pytest.mark.e2e
- Test complete workflows
- Minimal mocking (only external TTS service)
- Test real file creation and serving
- Total: ~15+ tests

### @pytest.mark.slow
- Tests that may take >5 seconds
- Performance tests
- Large data tests

---

## Coverage Breakdown by Component

### TTSConfig (tts_config.py)
- **Tests**: 17
- **Coverage Areas**:
  - Constants validation
  - Type checking
  - Value boundaries
  - Export verification

### TTS Exceptions (tts_exceptions.py)
- **Tests**: 26
- **Coverage Areas**:
  - Exception instantiation
  - Inheritance validation
  - Message preservation
  - Distinguishability
  - Realistic usage scenarios

### AudioFileManager (audio_file_manager.py)
- **Tests**: 33
- **Coverage Areas**:
  - Initialization
  - Unique filename generation (UUID)
  - Path conversion (absolute ↔ relative)
  - Directory management
  - File existence checking
  - Security (directory traversal prevention)
  - Edge cases (Unicode, long paths)

### TTS Models (tts.py)
- **Tests**: 41
- **Coverage Areas**:
  - TTSRequest validation
  - Boundary testing (1 char, 10,000 chars)
  - Empty/oversized rejection
  - Unicode support
  - TTSResponse serialization
  - Error messages
  - Edge cases

### TTSClient (tts_client.py)
- **Tests**: 32
- **Coverage Areas**:
  - Initialization
  - Successful requests
  - Timeout handling
  - Connection errors
  - HTTP errors (400, 500, 503)
  - Response parsing
  - Edge cases (large text, special chars)
  - Concurrency

### TTS API Routes (tts_routes.py)
- **Tests**: 25
- **Coverage Areas**:
  - POST /api/tts endpoint
  - Request validation
  - Error handling
  - Dependency injection
  - Complete workflow
  - Security

### E2E Workflow
- **Tests**: 12
- **Coverage Areas**:
  - Complete workflow
  - File creation
  - Error recovery
  - Concurrency
  - Performance
  - Data flow

---

## Test Design Principles Applied

### 1. **Test First, Implementation Later**
All tests were written WITHOUT seeing implementation code, following pure TDD methodology.

### 2. **Aggressive Testing**
- Tests anticipate edge cases, failure modes, and unexpected inputs
- Security tests prevent directory traversal and DoS attacks
- Boundary tests verify limits (1 char, 10,000 chars)

### 3. **AAA Pattern**
All tests follow Arrange-Act-Assert structure:
```python
# Arrange: Set up test data and mocks
mock_client = Mock()
# Act: Execute the behavior
result = client.synthesize_speech(text, path)
# Assert: Verify the outcome
assert result == expected_path
```

### 4. **Descriptive Test Names**
Test names read like specifications:
- `test_tts_request_with_empty_text_fails`
- `test_synthesize_speech_timeout_raises_tts_timeout_error`
- `test_get_absolute_path_prevents_directory_traversal`

### 5. **Isolation via Mocking**
Unit tests mock all external dependencies:
- `@patch('utils.tts_client.requests.post')` for HTTP calls
- `@patch.object(Path, 'mkdir')` for filesystem
- `@patch('storage.audio_file_manager.uuid.uuid4')` for UUID

### 6. **Realistic Test Data**
- Unicode text: "Привет, мир! 你好世界！"
- Special characters: "@#$%^&*()_+-="
- Boundary values: 1 char, 10,000 chars
- Attack attempts: "../../../etc/passwd"

### 7. **Error Path Coverage**
Tests don't just verify success—they ensure failures are handled correctly:
- Timeouts → TTSTimeoutError → 504
- Connection errors → TTSServiceUnavailableError → 503
- HTTP errors → TTSProcessingError → 500
- Validation errors → ValidationError → 422

---

## Implementation Guidance

### What Tests Expect from Implementation

#### TTSConfig
```python
TTS_SERVICE_URL: str = "http://localhost:8013"
TTS_TIMEOUT: float = 300.0
TTS_OUTPUT_DIR: Path = Path(__file__).parent.parent.parent / "data" / "audio"
TTS_MAX_TEXT_LENGTH: int = 10_000
```

#### TTS Exceptions
```python
class TTSServiceUnavailableError(Exception): pass
class TTSTimeoutError(Exception): pass
class TTSProcessingError(Exception): pass
```

#### AudioFileManager
```python
class AudioFileManager:
    def __init__(self, output_dir: Path)
    def generate_audio_filepath() -> Path  # Uses uuid.uuid4()
    def get_relative_path(absolute_path: Path) -> str  # Returns "/audio/{filename}"
    def get_absolute_path(filename: str) -> Path  # Sanitizes with Path.name
    def ensure_directory_exists() -> None  # mkdir(parents=True, exist_ok=True)
    def file_exists(filepath: Path) -> bool
```

#### TTS Models
```python
class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)

class TTSResponse(BaseModel):
    audio_path: str
```

#### TTSClient
```python
class TTSClient:
    def __init__(self, service_url: str, timeout: float)
    def synthesize_speech(text: str, output_path: Path) -> Path:
        # POST to {service_url}/tts
        # Payload: {"text": text, "output": str(output_path)}
        # Response: {"ogg_path": path_string}
        # Returns: Path(ogg_path) or output_path if missing
        # Raises: TTSTimeoutError, TTSServiceUnavailableError, TTSProcessingError
```

#### TTS API Routes
```python
@router.post("/api/tts", response_model=TTSResponse)
async def synthesize_speech(
    request: TTSRequest,
    tts_client: TTSClient = Depends(get_tts_client),
    audio_manager: AudioFileManager = Depends(get_audio_file_manager)
) -> TTSResponse:
    # Generate output path
    # Call tts_client.synthesize_speech()
    # Convert to relative path
    # Return TTSResponse
    # Handle exceptions → HTTP status codes
```

---

## Expected Test Results

### Before Implementation
All tests should **FAIL** with ImportError or AttributeError since no implementation exists yet.

### After Implementation
All tests should **PASS** if implementation matches test expectations.

### Metrics
- **Unit Tests**: Should run in <5 seconds
- **Integration Tests**: Should run in <10 seconds
- **E2E Tests**: May take up to 30 seconds (marked @slow)

---

## Files Created

```
tests/backend/
├── configs/
│   ├── __init__.py
│   └── test_tts_config.py          (17 tests)
├── exceptions/
│   ├── __init__.py
│   └── test_tts_exceptions.py      (26 tests)
├── storage/
│   ├── __init__.py
│   └── test_audio_file_manager.py  (33 tests)
├── models/
│   ├── __init__.py
│   └── test_tts.py                 (41 tests)
├── utils/
│   ├── __init__.py
│   └── test_tts_client.py          (32 tests)
└── api/
    ├── __init__.py
    ├── test_tts_routes.py          (25 tests)
    └── test_tts_e2e.py             (12 tests)
```

---

## Notes for Implementation Phase

1. **Requests Library**: The task mentions `requests` should be in requirements.txt but it's currently missing. Add:
   ```
   requests==2.31.0
   ```

2. **Import Structure**: All tests assume standard import patterns:
   ```python
   from configs.tts_config import TTS_SERVICE_URL
   from exceptions.tts_exceptions import TTSTimeoutError
   from storage.audio_file_manager import AudioFileManager
   from utils.tts_client import TTSClient
   from models.tts import TTSRequest, TTSResponse
   ```

3. **Dependency Injection**: API routes should use FastAPI Depends() for testability.

4. **Path Handling**: Always use `pathlib.Path` for cross-platform compatibility.

5. **Security**: Tests verify directory traversal prevention—implement with `Path.name`.

6. **Error Mapping**: Tests expect specific HTTP status codes:
   - 200: Success
   - 422: Validation Error (Pydantic)
   - 500: Processing Error
   - 503: Service Unavailable
   - 504: Timeout

---

## Summary

This comprehensive TDD test suite provides:
- **150+ test cases** covering all TTS components
- **Unit, integration, and E2E tests**
- **Aggressive edge case and security testing**
- **Clear implementation guidance**
- **Realistic error scenarios**

The tests serve as both:
1. **Specification**: Defines exact behavior expected from implementation
2. **Safety Net**: Catches bugs before they reach production
3. **Documentation**: Test names explain what code should do

Implementation should now proceed by making these tests pass, one component at a time, following the suggested order in the task document.
