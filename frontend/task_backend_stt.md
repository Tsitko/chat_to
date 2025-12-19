# Backend Architecture Design - Speech-to-Text (STT)

**Status:** Phase 1 Complete - Architecture skeleton created
**Date:** 2025-12-18

## Requirements

Add Speech-to-Text functionality to allow users to record audio and convert it to text messages via a local STT service.

### Functional Requirements
1. Provide REST API endpoint POST /api/stt for audio transcription
2. Accept audio file uploads (multipart/form-data)
3. Forward audio to local STT service at http://localhost:8013/stt
4. Return transcribed text using processed_text (preferred) or raw_text (fallback)
5. Handle timeouts up to 300 seconds (service includes LLM processing)
6. Handle service unavailability and processing errors gracefully

### Non-Functional Requirements
1. Follow project's bottom-up dependency flow
2. One class per file
3. Configuration in configs/ folder
4. Interface-based design with comprehensive docstrings
5. Specific exception types for different failure modes

## Architecture Design

### Created Structure

```
backend/
├── configs/
│   └── stt_config.py          # STT service URL, timeout configuration
├── exceptions/
│   └── stt_exceptions.py      # STT-specific exception types
├── models/
│   └── stt.py                 # Pydantic models for STT request/response
├── utils/
│   └── stt_client.py          # HTTP client for STT service communication
└── api/
    └── stt_routes.py          # FastAPI route handlers for /api/stt
```

### Dependency Graph (Bottom-Up)

```
configs/stt_config.py (no dependencies)
    ↓
exceptions/stt_exceptions.py (no dependencies)
    ↓
utils/stt_client.py (depends on: configs, exceptions, requests)
    ↓
models/stt.py (depends on: pydantic)
    ↓
api/stt_routes.py (depends on: models, utils, exceptions, configs, fastapi)
```

### Components Overview

#### 1. Configuration Module: `configs/stt_config.py`

**Responsibility:** Centralized STT service configuration constants

**Constants:**
- `STT_SERVICE_URL: str` - Base URL of local STT service (default: "http://localhost:8013")
- `STT_TIMEOUT: float` - Request timeout in seconds (default: 300.0)
- `STT_MAX_FILE_SIZE: int` - Maximum audio file size in bytes (default: 10MB)
- `STT_ALLOWED_FORMATS: list[str]` - Allowed audio file extensions

**Dependencies:** None (pathlib, typing only)

---

#### 2. Exception Module: `exceptions/stt_exceptions.py`

**Responsibility:** Define specific exception types for STT errors

**Classes:**

**`class STTServiceUnavailableError(Exception)`**
- Raised when STT service cannot be reached
- Used for: connection errors, service offline

**`class STTTimeoutError(Exception)`**
- Raised when request exceeds timeout limit
- Used for: 300+ second requests

**`class STTProcessingError(Exception)`**
- Raised when STT service returns an error or processing fails
- Used for: HTTP errors, invalid responses

**Dependencies:** None (built-in Exception)

---

#### 3. Models Module: `models/stt.py`

**Responsibility:** Pydantic models for API request/response validation

**Classes:**

**`class STTResponse(BaseModel)`**
```python
transcribed_text: str  # The final transcribed text (processed_text or raw_text)
```

**Purpose:** Response model for /api/stt endpoint

**Dependencies:** pydantic.BaseModel

---

#### 4. STT Client Module: `utils/stt_client.py`

**Responsibility:** HTTP client for communicating with local STT service

**Class: `STTClient`**

**Attributes:**
- `service_url: str` - Base URL of STT service
- `timeout: float` - Request timeout in seconds

**Methods:**

**`__init__(self, service_url: str, timeout: float) -> None`**
- Initialize client with configuration
- Args: service_url (e.g., "http://localhost:8013"), timeout (seconds)

**`transcribe_audio(self, audio_file: BinaryIO, filename: str) -> str`**
- Send audio file to STT service and get transcribed text
- Args: audio_file (file-like object), filename (original filename)
- Returns: Transcribed text string (processed_text preferred, raw_text fallback)
- Raises: STTServiceUnavailableError, STTTimeoutError, STTProcessingError
- Process:
  1. Build multipart/form-data request with "file" field
  2. Send POST to {service_url}/stt
  3. Handle timeout, connection, HTTP errors
  4. Parse JSON response
  5. Return processed_text if available, else raw_text

**`_send_request(self, files: Dict[str, Any]) -> Dict[str, Any]`**
- Internal method to send HTTP request with error handling
- Args: files dict for multipart upload
- Returns: Response JSON dict
- Raises: Specific STT exceptions based on error type

**`_parse_response(self, response_json: Dict[str, Any]) -> str`**
- Internal method to extract text from response
- Args: Response JSON from STT service
- Returns: processed_text if available, else raw_text, else empty string
- Ensures non-None string return value

**Dependencies:**
- requests (HTTP client)
- pathlib (Path handling)
- typing (type hints)
- exceptions.stt_exceptions (custom exceptions)

---

#### 5. API Routes Module: `api/stt_routes.py`

**Responsibility:** FastAPI route handlers for STT endpoints

**Components:**

**Router:**
```python
router = APIRouter(prefix="/api/stt", tags=["stt"])
```

**Dependency Injection Functions:**

**`get_stt_client() -> STTClient`**
- Factory function for STTClient dependency injection
- Returns: Configured STTClient instance
- Allows easy mocking in tests

**Route Handler:**

**`@router.post("/", response_model=STTResponse)`**
**`async def transcribe_audio(file: UploadFile = File(...)) -> STTResponse`**
- Endpoint for audio transcription
- Request: multipart/form-data with "file" field
- Response: STTResponse with transcribed_text
- Process:
  1. Validate file is uploaded
  2. Validate file size (< STT_MAX_FILE_SIZE)
  3. Validate file format (in STT_ALLOWED_FORMATS)
  4. Get STTClient via dependency injection
  5. Call client.transcribe_audio(file.file, file.filename)
  6. Return STTResponse with transcribed text
- Error Handling:
  - 400 Bad Request: Missing file, invalid size/format
  - 503 Service Unavailable: STTServiceUnavailableError
  - 504 Gateway Timeout: STTTimeoutError
  - 500 Internal Server Error: STTProcessingError, unexpected errors

**Dependencies:**
- fastapi (APIRouter, HTTPException, UploadFile, File)
- models.stt (STTResponse)
- utils.stt_client (STTClient)
- configs.stt_config (constants)
- exceptions.stt_exceptions (custom exceptions)

---

## Implementation Recommendations

### Phase 1: Architecture (This Phase)

1. **Create folder structure and skeleton files**
2. **Define all class signatures with docstrings**
3. **Add placeholder implementations (`pass` or `# TODO`)**
4. **Update requirements.txt if needed** (requests already present)
5. **Register router in main.py** (import and include stt_routes.router)

### Phase 2: Test Development (TDD)

**Test file structure:**
```
tests/
├── configs/
│   └── test_stt_config.py
├── exceptions/
│   └── test_stt_exceptions.py
├── models/
│   └── test_stt.py
├── utils/
│   └── test_stt_client.py
└── api/
    └── test_stt_routes.py
```

**Unit Tests:**

1. **test_stt_config.py**
   - Verify all constants are defined
   - Test default values

2. **test_stt_exceptions.py**
   - Test exception instantiation
   - Test exception inheritance
   - Test exception messages

3. **test_stt.py**
   - Test STTResponse model validation
   - Test required/optional fields
   - Test serialization/deserialization

4. **test_stt_client.py**
   - Test successful transcription (mock requests.post)
   - Test timeout handling (mock timeout)
   - Test connection error handling (mock ConnectionError)
   - Test HTTP error handling (mock HTTPError)
   - Test response parsing (processed_text priority)
   - Test response parsing (raw_text fallback)
   - Test response parsing (empty string fallback)
   - Test multipart file upload format

5. **test_stt_routes.py**
   - Test successful transcription (mock STTClient)
   - Test missing file (400 error)
   - Test file too large (400 error)
   - Test invalid file format (400 error)
   - Test service unavailable (503 error)
   - Test timeout (504 error)
   - Test processing error (500 error)
   - Test dependency injection

**Integration Tests:**

6. **test_stt_integration.py**
   - Test STTClient with mocked HTTP server
   - Test route handler with STTClient
   - Test end-to-end flow (if local service available)

### Phase 3: Implementation

1. **Implement bottom-up:** configs → exceptions → models → utils → api
2. **Run pytest after each module implementation**
3. **Fix failing tests before moving to next module**
4. **Update main.py to register router:**
   ```python
   from api import stt_routes
   app.include_router(stt_routes.router)
   ```

### Testing Strategy

**Run tests:**
```bash
# All STT tests
pytest tests/ -k stt

# Single module
pytest tests/utils/test_stt_client.py

# Single test
pytest tests/api/test_stt_routes.py::test_transcribe_audio_success

# With coverage
pytest tests/ -k stt --cov=backend --cov-report=html
```

## Configuration Values

```python
# configs/stt_config.py
STT_SERVICE_URL = "http://localhost:8013"
STT_TIMEOUT = 300.0  # 5 minutes for LLM processing
STT_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
STT_ALLOWED_FORMATS = [".webm", ".ogg", ".wav", ".mp3", ".m4a"]
```

## API Contract

### Request
```
POST /api/stt
Content-Type: multipart/form-data

file: <audio file binary>
```

### Response (Success)
```json
{
  "transcribed_text": "Hello, this is the transcribed text from speech."
}
```

### Response (Error Examples)

**400 Bad Request**
```json
{
  "detail": "No file uploaded"
}
```

**503 Service Unavailable**
```json
{
  "detail": "STT service unavailable: Cannot connect to STT service"
}
```

**504 Gateway Timeout**
```json
{
  "detail": "STT request timeout: Request exceeded 300s limit"
}
```

## Security Considerations

1. **File Size Validation**: Enforce STT_MAX_FILE_SIZE to prevent DoS attacks
2. **File Format Validation**: Whitelist allowed audio formats
3. **Temporary File Cleanup**: Ensure uploaded files are properly cleaned up
4. **Error Message Sanitization**: Don't expose internal paths or sensitive info
5. **Rate Limiting**: Consider adding rate limiting for STT endpoint (future)

## Performance Considerations

1. **Async Processing**: Use FastAPI's async capabilities
2. **File Streaming**: Stream audio file to STT service (don't load entirely in memory)
3. **Timeout Configuration**: 300s timeout is appropriate for LLM processing
4. **Connection Pooling**: requests library handles connection pooling

## Error Handling Strategy

1. **Specific Exceptions**: Use typed exceptions for different failure modes
2. **Proper HTTP Status Codes**: Map exceptions to appropriate status codes
3. **User-Friendly Messages**: Provide clear error messages for debugging
4. **Logging**: Log all errors with context (add logging in implementation phase)

## Edge Cases to Handle

1. Empty audio file
2. Corrupted audio file
3. Very long audio (> 5 minutes)
4. STT service returns empty response
5. STT service returns malformed JSON
6. Network interruption during upload
7. File encoding issues

## Future Enhancements (Not in Current Scope)

1. Audio format conversion on backend
2. Audio quality validation
3. Caching of transcriptions
4. Support for multiple STT services
5. Real-time streaming transcription
6. Language detection/selection

## Dependencies

**Already in requirements.txt:**
- requests==0.25.2 (or similar)
- fastapi==0.104.1
- pydantic==2.5.0
- python-multipart==0.0.6

**No new dependencies required.**

## Integration Points

1. **Frontend → Backend**: POST /api/stt with audio file
2. **Backend → STT Service**: POST http://localhost:8013/stt with audio file
3. **Frontend Message Flow**: Transcribed text → sendMessage() via existing API

## Notes

- STT service must be running on http://localhost:8013 before testing
- Audio recording format depends on browser (typically WebM with Opus codec)
- Service includes LLM processing for quality improvement (hence 300s timeout)
- Follow reference implementation pattern from telegram_agent project
- Maintain consistency with existing TTS implementation patterns

---

## Phase 1 Completion Summary

### Files Created

All backend skeleton files have been created with complete signatures and docstrings:

1. **configs/stt_config.py** - Configuration constants
   - STT_SERVICE_URL = "http://localhost:8013"
   - STT_TIMEOUT = 300.0
   - STT_MAX_FILE_SIZE = 10MB
   - STT_ALLOWED_FORMATS = [".webm", ".ogg", ".wav", ".mp3", ".m4a"]

2. **exceptions/stt_exceptions.py** - Custom exception types
   - STTServiceUnavailableError
   - STTTimeoutError
   - STTProcessingError

3. **models/stt.py** - Pydantic response model
   - STTResponse with transcribed_text field

4. **utils/stt_client.py** - HTTP client for STT service
   - STTClient class with transcribe_audio() method
   - Internal methods: _build_multipart_files(), _send_request(), _parse_response()
   - All methods have docstrings with TODO placeholders

5. **api/stt_routes.py** - FastAPI route handler
   - POST /api/stt endpoint
   - get_stt_client() dependency injection
   - File validation logic placeholders
   - Error handling for all exception types

### Package Updates

Updated __init__.py files to export new modules:
- configs/__init__.py - Added STT config exports
- exceptions/__init__.py - Added STT exception exports
- models/__init__.py - Added STTResponse export
- utils/__init__.py - Added STTClient export

### Next Steps

**Phase 2: Test Development (TDD)**

Create test files in the following order:

1. tests/configs/test_stt_config.py
2. tests/exceptions/test_stt_exceptions.py
3. tests/models/test_stt.py
4. tests/utils/test_stt_client.py
5. tests/api/test_stt_routes.py

**Phase 3: Implementation**

Implement bottom-up after all tests are written:
1. No implementation needed for configs/exceptions/models (already complete)
2. Implement utils/stt_client.py
3. Implement api/stt_routes.py
4. Update main.py to register stt_routes.router

### Integration Requirements

To complete the backend integration:

1. **Register router in main.py:**
   ```python
   from api import stt_routes
   app.include_router(stt_routes.router)
   ```

2. **Ensure STT service is running:**
   - Service must be available at http://localhost:8013
   - Endpoint: POST /stt
   - Request: multipart/form-data with "file" field
   - Response: {"processed_text": str, "raw_text": str}

3. **Test dependencies:**
   - requests library (already in requirements.txt)
   - python-multipart (already in requirements.txt)

### File Locations

All files created at:
- /home/denis/Projects/chat_to/backend/configs/stt_config.py
- /home/denis/Projects/chat_to/backend/exceptions/stt_exceptions.py
- /home/denis/Projects/chat_to/backend/models/stt.py
- /home/denis/Projects/chat_to/backend/utils/stt_client.py
- /home/denis/Projects/chat_to/backend/api/stt_routes.py
