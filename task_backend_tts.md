# Backend Task: Add Text-to-Speech (TTS) Functionality

## Objective
Add Text-to-Speech functionality to the chat system by integrating with a local TTS service (http://localhost:8013). The backend will provide an API endpoint that accepts message text, forwards it to the TTS service, and returns the synthesized audio file path for the frontend to play.

## Requirements

### 1. TTS Service Client
Create a `TTSClient` class in `backend/utils/tts_client.py` that:
- Sends HTTP POST requests to the local TTS service at `http://localhost:8013/tts`
- Request format: `{"text": string, "output": path_string}`
- Response format: `{"ogg_path": path_string}`
- Handles timeouts (300 seconds for LLM processing)
- Handles connection errors and service unavailability gracefully
- Returns the path to the synthesized audio file

### 2. TTS Configuration
Create a configuration file `backend/configs/tts_config.py` that:
- Defines TTS service URL: `TTS_SERVICE_URL = "http://localhost:8013"`
- Defines request timeout: `TTS_TIMEOUT = 300.0` (seconds)
- Defines output directory for audio files: `TTS_OUTPUT_DIR`
- Exports configuration constants

### 3. Audio File Management
Create an `AudioFileManager` class in `backend/storage/audio_file_manager.py` that:
- Generates unique filenames for audio files using UUIDs
- Stores audio files in a dedicated directory under `data/audio/`
- Provides path resolution for serving audio files
- Handles cleanup of old audio files (optional)

### 4. TTS API Endpoint
Add a new route in `backend/api/tts_routes.py` that:
- Endpoint: `POST /api/tts`
- Request body: `{"text": string}`
- Response: `{"audio_path": string}` (relative path for frontend to fetch)
- Validates input text (not empty, max length)
- Generates unique output filename
- Calls TTSClient to synthesize speech
- Returns the audio file path
- Handles errors (service unavailable, timeout, etc.)

### 5. Audio File Serving
Add a static file route in `backend/main.py` that:
- Serves audio files from `data/audio/` directory
- Endpoint: `GET /audio/{filename}`
- Returns OGG audio files with correct MIME type (`audio/ogg`)
- Handles 404 for non-existent files

### 6. Request/Response Models
Create Pydantic models in `backend/models/tts.py` that:
- `TTSRequest`: Request model with `text: str` field
- `TTSResponse`: Response model with `audio_path: str` field
- Input validation: text length limits, non-empty validation

## Technical Constraints
- TTS service requires 300-second timeout due to LLM processing
- Service may be temporarily unavailable - must handle gracefully
- Audio files stored as OGG format
- File paths must be relative for frontend (e.g., `/audio/abc123.ogg`)
- No authentication required for local service
- Error handling must not expose internal paths to client

## Testing Requirements

### Unit Tests for TTSClient (`tests/utils/test_tts_client.py`)
- Test successful TTS request with mock HTTP response
- Test timeout handling (300s limit)
- Test connection error handling
- Test invalid response format handling
- Test service unavailable (connection refused)
- Mock requests library for all tests

### Unit Tests for AudioFileManager (`tests/storage/test_audio_file_manager.py`)
- Test unique filename generation (UUID format)
- Test output directory creation
- Test path resolution (relative vs absolute)
- Test file existence check
- Test cleanup functionality (if implemented)

### Unit Tests for TTS Models (`tests/models/test_tts.py`)
- Test TTSRequest validation (empty text, max length)
- Test TTSResponse serialization
- Test invalid input handling

### Integration Tests for TTS API (`tests/api/test_tts_routes.py`)
- Test POST /api/tts with valid text
- Test POST /api/tts with empty text (should fail)
- Test POST /api/tts with oversized text (should fail)
- Test POST /api/tts when service unavailable (graceful error)
- Test POST /api/tts timeout handling
- Test GET /audio/{filename} with existing file
- Test GET /audio/{filename} with non-existent file (404)
- Mock TTSClient for tests

### End-to-End Tests
- Test complete flow: API request → TTS service → audio file → serve file
- Test concurrent TTS requests (multiple users)
- Test audio file persistence and retrieval

## Files to Create/Modify

### Create New Files
- `backend/utils/tts_client.py` - TTSClient class
- `backend/storage/audio_file_manager.py` - AudioFileManager class
- `backend/configs/tts_config.py` - TTS configuration constants
- `backend/models/tts.py` - Pydantic models for TTS
- `backend/api/tts_routes.py` - FastAPI routes for TTS
- `tests/utils/test_tts_client.py` - Unit tests for TTSClient
- `tests/storage/test_audio_file_manager.py` - Unit tests for AudioFileManager
- `tests/models/test_tts.py` - Unit tests for TTS models
- `tests/api/test_tts_routes.py` - Integration tests for TTS API

### Modify Existing Files
- `backend/main.py` - Add TTS routes and audio file serving
- `backend/configs/__init__.py` - Export TTS config constants
- `backend/utils/__init__.py` - Export TTSClient
- `backend/storage/__init__.py` - Export AudioFileManager
- `backend/models/__init__.py` - Export TTS models

## Dependencies
- **Existing**: `requests` library for HTTP calls (already in requirements.txt)
- **Existing**: `fastapi.responses.FileResponse` for serving audio files
- **Existing**: `pathlib.Path` for file path handling
- **New**: None (all required libraries already available)

## Error Handling Strategy
1. **Service Unavailable**: Return 503 status with user-friendly message
2. **Timeout**: Return 504 status with timeout message
3. **Invalid Input**: Return 400 status with validation errors
4. **File Not Found**: Return 404 status for audio file requests
5. **Internal Errors**: Return 500 status with generic error message (log details)

## Security Considerations
- Validate text input length to prevent DoS (max 10,000 characters)
- Sanitize filenames to prevent directory traversal
- Use UUID for filenames to prevent path guessing
- Do not expose internal file paths in error messages
- Limit audio file storage size (consider cleanup strategy)

## Performance Considerations
- 300-second timeout may block the API endpoint (consider background tasks)
- Audio files accumulate over time (implement cleanup or TTL)
- Consider caching identical text requests (same text → same audio)
- File serving should be efficient (use sendfile if possible)

## Reference Implementation
Based on `/home/denis/Projects/telegram_agent/yandex_speech/src/yandex_speech/utils/local_service_client.py`:
- Use `requests.post()` with JSON payload
- Set timeout parameter explicitly (300 seconds)
- Wrap in try-except for connection errors
- Raise custom exception for service unavailability
- Parse JSON response and extract `ogg_path`

---

## Architecture Design

### Created Structure

```
backend/
├── configs/
│   ├── tts_config.py              # NEW - TTS service configuration
│   └── __init__.py                # MODIFIED - Export TTS config
├── models/
│   ├── tts.py                     # NEW - TTS request/response models
│   └── __init__.py                # MODIFIED - Export TTS models
├── utils/
│   ├── tts_client.py              # NEW - HTTP client for TTS service
│   └── __init__.py                # MODIFIED - Export TTSClient
├── storage/
│   ├── audio_file_manager.py     # NEW - Audio file storage management
│   └── __init__.py                # MODIFIED - Export AudioFileManager
├── api/
│   ├── tts_routes.py              # NEW - FastAPI routes for TTS
│   └── __init__.py                # UNCHANGED
├── main.py                        # MODIFIED - Add TTS routes and audio serving
└── exceptions/
    └── tts_exceptions.py          # NEW - Custom TTS exceptions

tests/
├── configs/
│   └── test_tts_config.py         # NEW - Config tests
├── models/
│   └── test_tts.py                # NEW - Model tests
├── utils/
│   └── test_tts_client.py         # NEW - TTSClient unit tests
├── storage/
│   └── test_audio_file_manager.py # NEW - AudioFileManager tests
└── api/
    └── test_tts_routes.py         # NEW - TTS API integration tests

data/
└── audio/                         # NEW - Directory for audio files
```

### Components Overview

#### 1. TTS Configuration (`backend/configs/tts_config.py`)
**Purpose**: Centralized configuration for TTS service integration.

**Responsibilities**:
- Define TTS service URL (default: `http://localhost:8013`)
- Define request timeout (300 seconds for LLM processing)
- Define output directory for audio files (`data/audio/`)
- Provide configuration constants for other modules

**Constants**:
- `TTS_SERVICE_URL: str` - Base URL of local TTS service
- `TTS_TIMEOUT: float` - HTTP request timeout in seconds (300.0)
- `TTS_OUTPUT_DIR: Path` - Directory path for storing audio files
- `TTS_MAX_TEXT_LENGTH: int` - Maximum text length for TTS (10,000 chars)

**Design Decisions**:
- 300-second timeout accounts for LLM processing in TTS service
- Output directory under `data/audio/` follows project structure
- Max text length prevents abuse and service overload
- All paths use pathlib.Path for cross-platform compatibility

#### 2. TTS Exceptions (`backend/exceptions/tts_exceptions.py`)
**Purpose**: Custom exceptions for TTS-specific error handling.

**Classes**:
- `TTSServiceUnavailableError(Exception)` - Raised when TTS service cannot be reached
- `TTSTimeoutError(Exception)` - Raised when TTS request times out
- `TTSProcessingError(Exception)` - Raised when TTS service returns error

**Design Decisions**:
- Separate exceptions for different failure modes
- Allows specific error handling and status code mapping
- Follows project's exception handling pattern

#### 3. TTSClient (`backend/utils/tts_client.py`)
**Purpose**: HTTP client for communicating with the local TTS service.

**Responsibilities**:
- Send HTTP POST requests to TTS service
- Build request payload: `{"text": str, "output": str}`
- Parse response payload: `{"ogg_path": str}`
- Handle timeouts, connection errors, and service failures
- Return path to synthesized audio file

**Key Methods**:
- `__init__(service_url: str, timeout: float)` - Initialize client with config
- `synthesize_speech(text: str, output_path: Path) -> Path` - Main entry point
  - Purpose: Request speech synthesis for given text
  - Parameters: text (message content), output_path (where to save audio)
  - Returns: Path to synthesized OGG audio file
  - Raises: TTSServiceUnavailableError, TTSTimeoutError, TTSProcessingError
- `_build_request_payload(text: str, output_path: Path) -> dict` - Build JSON payload
- `_send_request(payload: dict) -> dict` - Send HTTP POST with error handling
- `_parse_response(response_json: dict, default_path: Path) -> Path` - Extract ogg_path

**Design Decisions**:
- Uses `requests` library (already in project dependencies)
- Timeout configured at instance level (passed from config)
- Returns Path object for type safety
- Raises specific exceptions for different error conditions
- Falls back to default path if `ogg_path` missing in response
- Based on reference implementation from telegram_agent project

**Error Handling**:
```python
try:
    response = requests.post(url, json=payload, timeout=self.timeout)
    response.raise_for_status()
except requests.Timeout:
    raise TTSTimeoutError(f"TTS request timed out after {self.timeout}s")
except requests.ConnectionError:
    raise TTSServiceUnavailableError("Cannot connect to TTS service")
except requests.HTTPError as e:
    raise TTSProcessingError(f"TTS service error: {e}")
```

#### 4. AudioFileManager (`backend/storage/audio_file_manager.py`)
**Purpose**: Manage audio file storage, naming, and path resolution.

**Responsibilities**:
- Generate unique filenames using UUIDs
- Ensure output directory exists
- Resolve absolute paths for file storage
- Resolve relative paths for API responses
- Provide file existence checks
- (Optional) Cleanup old files

**Key Methods**:
- `__init__(output_dir: Path)` - Initialize with output directory path
- `generate_audio_filepath() -> Path` - Generate unique absolute path for new audio
  - Purpose: Create unique filename using UUID
  - Returns: Absolute Path object (e.g., `/path/to/data/audio/abc123.ogg`)
  - Ensures directory exists
- `get_relative_path(absolute_path: Path) -> str` - Convert to relative API path
  - Purpose: Convert absolute path to URL-friendly relative path
  - Returns: String like `/audio/abc123.ogg` for frontend
- `ensure_directory_exists() -> None` - Create output directory if missing
- `file_exists(filepath: Path) -> bool` - Check if audio file exists
- `get_absolute_path(filename: str) -> Path` - Convert filename to absolute path

**Design Decisions**:
- UUID v4 for unique filenames (prevents collisions and guessing)
- Always use `.ogg` extension (TTS service output format)
- Directory creation is automatic (lazy initialization)
- Separation of absolute (storage) and relative (API) paths
- No direct file deletion (keep for caching, manual cleanup)

**Filename Format**: `{uuid4}.ogg` (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890.ogg`)

#### 5. TTS Request/Response Models (`backend/models/tts.py`)
**Purpose**: Pydantic models for TTS API request and response validation.

**Models**:

**TTSRequest**:
```python
class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
```
- Purpose: Validate incoming TTS request
- Validation: text must be 1-10,000 characters
- Prevents empty strings and DoS attacks

**TTSResponse**:
```python
class TTSResponse(BaseModel):
    audio_path: str
```
- Purpose: Standardize TTS API response
- Contains relative path to audio file (e.g., `/audio/abc123.ogg`)
- Frontend uses this path to fetch and play audio

**Design Decisions**:
- Simple, focused models (single responsibility)
- Max length of 10,000 chars balances usability and safety
- Pydantic handles validation automatically
- audio_path is relative for frontend URL construction

#### 6. TTS API Routes (`backend/api/tts_routes.py`)
**Purpose**: FastAPI endpoints for TTS synthesis and audio file serving.

**Routes**:

**POST /api/tts**:
- Purpose: Synthesize speech from text
- Request: TTSRequest (JSON with text field)
- Response: TTSResponse (JSON with audio_path)
- Status Codes: 200 (success), 400 (invalid input), 503 (service unavailable), 504 (timeout)
- Process:
  1. Validate request (Pydantic automatic)
  2. Generate unique output filepath
  3. Call TTSClient.synthesize_speech()
  4. Get relative path from AudioFileManager
  5. Return TTSResponse

**Handler Signature**:
```python
async def synthesize_speech(
    request: TTSRequest,
    tts_client: TTSClient = Depends(get_tts_client),
    audio_manager: AudioFileManager = Depends(get_audio_file_manager)
) -> TTSResponse:
    pass  # TODO: Implementation
```

**Dependencies**:
- `get_tts_client() -> TTSClient` - Provides TTSClient instance
- `get_audio_file_manager() -> AudioFileManager` - Provides AudioFileManager instance

**Design Decisions**:
- POST method (not GET) because it creates resources
- Dependency injection for testability
- Async handler for non-blocking I/O (though TTS call is sync)
- Exception handling maps to appropriate HTTP status codes

**Error Handling**:
```python
try:
    audio_path = await synthesize_speech(...)
except TTSServiceUnavailableError:
    raise HTTPException(status_code=503, detail="TTS service unavailable")
except TTSTimeoutError:
    raise HTTPException(status_code=504, detail="TTS request timed out")
except TTSProcessingError as e:
    raise HTTPException(status_code=500, detail=str(e))
```

#### 7. Audio File Serving (`backend/main.py` modification)
**Purpose**: Serve synthesized audio files to frontend.

**Implementation**:
```python
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Option 1: Static files mounting
app.mount("/audio", StaticFiles(directory=str(TTS_OUTPUT_DIR)), name="audio")

# Option 2: Custom route for more control
@app.get("/audio/{filename}")
async def serve_audio_file(
    filename: str,
    audio_manager: AudioFileManager = Depends(get_audio_file_manager)
):
    filepath = audio_manager.get_absolute_path(filename)
    if not audio_manager.file_exists(filepath):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(
        path=filepath,
        media_type="audio/ogg",
        filename=filename
    )
```

**Design Decisions**:
- Custom route preferred for security (validates filename, checks existence)
- FileResponse handles streaming efficiently
- Correct MIME type: `audio/ogg`
- 404 for missing files (graceful degradation)
- No caching headers initially (can add later)

### Implementation Recommendations

#### Phase 1: Implement Configuration
**File**: `backend/configs/tts_config.py`

1. **Define constants**:
```python
from pathlib import Path

# TTS service configuration
TTS_SERVICE_URL: str = "http://localhost:8013"
TTS_TIMEOUT: float = 300.0  # 5 minutes for LLM processing

# Audio storage configuration
TTS_OUTPUT_DIR: Path = Path(__file__).parent.parent.parent / "data" / "audio"
TTS_MAX_TEXT_LENGTH: int = 10_000  # Maximum characters for TTS input
```

2. **Update `__init__.py`**:
```python
from .tts_config import (
    TTS_SERVICE_URL,
    TTS_TIMEOUT,
    TTS_OUTPUT_DIR,
    TTS_MAX_TEXT_LENGTH,
)

__all__ = [
    # ... existing exports
    "TTS_SERVICE_URL",
    "TTS_TIMEOUT",
    "TTS_OUTPUT_DIR",
    "TTS_MAX_TEXT_LENGTH",
]
```

#### Phase 2: Implement Exceptions
**File**: `backend/exceptions/tts_exceptions.py`

```python
class TTSServiceUnavailableError(Exception):
    """Raised when TTS service cannot be reached."""
    pass

class TTSTimeoutError(Exception):
    """Raised when TTS request exceeds timeout limit."""
    pass

class TTSProcessingError(Exception):
    """Raised when TTS service returns an error."""
    pass
```

#### Phase 3: Implement AudioFileManager
**File**: `backend/storage/audio_file_manager.py`

1. **Generate unique filepath**:
```python
import uuid
from pathlib import Path

def generate_audio_filepath(self) -> Path:
    self.ensure_directory_exists()
    filename = f"{uuid.uuid4()}.ogg"
    return self.output_dir / filename
```

2. **Path resolution**:
```python
def get_relative_path(self, absolute_path: Path) -> str:
    # Convert /path/to/data/audio/abc.ogg -> /audio/abc.ogg
    return f"/audio/{absolute_path.name}"

def get_absolute_path(self, filename: str) -> Path:
    # Sanitize filename to prevent directory traversal
    safe_filename = Path(filename).name  # Strips any path components
    return self.output_dir / safe_filename
```

3. **Directory management**:
```python
def ensure_directory_exists(self) -> None:
    self.output_dir.mkdir(parents=True, exist_ok=True)
```

#### Phase 4: Implement TTSClient
**File**: `backend/utils/tts_client.py`

1. **Main synthesis method**:
```python
import requests
from pathlib import Path

def synthesize_speech(self, text: str, output_path: Path) -> Path:
    payload = self._build_request_payload(text, output_path)
    response_data = self._send_request(payload)
    return self._parse_response(response_data, output_path)
```

2. **Request handling**:
```python
def _send_request(self, payload: dict) -> dict:
    try:
        response = requests.post(
            f"{self.service_url}/tts",
            json=payload,
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json() if response.content else {}
    except requests.Timeout:
        raise TTSTimeoutError(f"TTS request timed out after {self.timeout}s")
    except requests.ConnectionError as e:
        raise TTSServiceUnavailableError(f"Cannot connect to TTS service: {e}")
    except requests.HTTPError as e:
        raise TTSProcessingError(f"TTS service error: {e}")
    except Exception as e:
        raise TTSProcessingError(f"Unexpected error: {e}")
```

3. **Response parsing**:
```python
def _parse_response(self, response_json: dict, default_path: Path) -> Path:
    ogg_path_str = response_json.get("ogg_path") or str(default_path)
    return Path(ogg_path_str)
```

#### Phase 5: Implement TTS Models
**File**: `backend/models/tts.py`

```python
from pydantic import BaseModel, Field

class TTSRequest(BaseModel):
    """Request model for TTS synthesis."""
    text: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Text to synthesize into speech"
    )

class TTSResponse(BaseModel):
    """Response model for TTS synthesis."""
    audio_path: str = Field(
        ...,
        description="Relative path to synthesized audio file"
    )
```

#### Phase 6: Implement TTS API Routes
**File**: `backend/api/tts_routes.py`

1. **Dependencies**:
```python
from fastapi import APIRouter, HTTPException, Depends
from models import TTSRequest, TTSResponse
from utils import TTSClient
from storage import AudioFileManager
from configs import TTS_SERVICE_URL, TTS_TIMEOUT, TTS_OUTPUT_DIR
from exceptions import TTSServiceUnavailableError, TTSTimeoutError, TTSProcessingError

router = APIRouter(prefix="/api/tts", tags=["tts"])

def get_tts_client() -> TTSClient:
    return TTSClient(service_url=TTS_SERVICE_URL, timeout=TTS_TIMEOUT)

def get_audio_file_manager() -> AudioFileManager:
    return AudioFileManager(output_dir=TTS_OUTPUT_DIR)
```

2. **Main endpoint**:
```python
@router.post("/", response_model=TTSResponse)
async def synthesize_speech(
    request: TTSRequest,
    tts_client: TTSClient = Depends(get_tts_client),
    audio_manager: AudioFileManager = Depends(get_audio_file_manager)
) -> TTSResponse:
    try:
        # Generate unique output path
        output_path = audio_manager.generate_audio_filepath()

        # Call TTS service
        audio_path = tts_client.synthesize_speech(request.text, output_path)

        # Convert to relative path for API response
        relative_path = audio_manager.get_relative_path(audio_path)

        return TTSResponse(audio_path=relative_path)

    except TTSServiceUnavailableError as e:
        raise HTTPException(status_code=503, detail=f"TTS service unavailable: {e}")
    except TTSTimeoutError as e:
        raise HTTPException(status_code=504, detail=f"TTS request timed out: {e}")
    except TTSProcessingError as e:
        raise HTTPException(status_code=500, detail=f"TTS processing failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
```

#### Phase 7: Update main.py for Audio Serving
**File**: `backend/main.py`

1. **Add imports**:
```python
from fastapi.responses import FileResponse
from api import tts_routes
from storage import AudioFileManager
from configs import TTS_OUTPUT_DIR
```

2. **Include TTS router**:
```python
app.include_router(tts_routes.router)
```

3. **Add audio file serving route**:
```python
@app.get("/audio/{filename}")
async def serve_audio_file(filename: str):
    audio_manager = AudioFileManager(output_dir=TTS_OUTPUT_DIR)
    filepath = audio_manager.get_absolute_path(filename)

    if not audio_manager.file_exists(filepath):
        raise HTTPException(status_code=404, detail="Audio file not found")

    return FileResponse(
        path=filepath,
        media_type="audio/ogg",
        filename=filename
    )
```

### Suggested Implementation Order

1. **TTS Configuration** (independent, foundational)
   - Create `tts_config.py` with all constants
   - Update `configs/__init__.py` to export constants
   - Write unit tests for config values

2. **TTS Exceptions** (independent, foundational)
   - Create `tts_exceptions.py` with custom exceptions
   - Update `exceptions/__init__.py` to export exceptions
   - Test exception inheritance

3. **AudioFileManager** (depends on config)
   - Implement unique filename generation
   - Implement path resolution methods
   - Implement directory management
   - Write unit tests (mock filesystem)

4. **TTS Models** (independent)
   - Create TTSRequest with validation
   - Create TTSResponse
   - Write unit tests for validation

5. **TTSClient** (depends on config, exceptions)
   - Implement HTTP request logic
   - Implement error handling
   - Implement response parsing
   - Write unit tests (mock requests library)

6. **TTS API Routes** (depends on all above)
   - Implement POST /api/tts endpoint
   - Implement dependencies
   - Write integration tests (mock TTSClient)

7. **Audio File Serving** (depends on AudioFileManager)
   - Add route to main.py
   - Test file serving with mock files
   - Test 404 handling

8. **End-to-End Testing**
   - Test full TTS flow with real service (if available)
   - Test concurrent requests
   - Test error scenarios
   - Performance testing (300s timeout handling)

### Testing Strategy

#### Unit Tests

**test_tts_config.py**:
- Test all config constants are defined
- Test TTS_OUTPUT_DIR is a valid Path
- Test TTS_TIMEOUT is reasonable (>= 300)
- Test TTS_MAX_TEXT_LENGTH is positive

**test_tts_exceptions.py**:
- Test exception instantiation
- Test exception inheritance from Exception
- Test exception message passing

**test_audio_file_manager.py**:
- Test `generate_audio_filepath()` returns unique paths
- Test `generate_audio_filepath()` creates directory
- Test `get_relative_path()` converts correctly
- Test `get_absolute_path()` sanitizes input (no ../)
- Test `file_exists()` with existing and missing files
- Test `ensure_directory_exists()` creates parent dirs
- Mock filesystem operations

**test_tts_client.py**:
- Test `synthesize_speech()` with successful response
- Test `synthesize_speech()` with missing ogg_path (uses default)
- Test timeout raises TTSTimeoutError
- Test connection error raises TTSServiceUnavailableError
- Test HTTP error raises TTSProcessingError
- Test request payload format
- Mock requests.post for all tests

**test_tts_models.py**:
- Test TTSRequest with valid text
- Test TTSRequest with empty text (should fail)
- Test TTSRequest with oversized text (should fail)
- Test TTSRequest validation messages
- Test TTSResponse serialization

#### Integration Tests

**test_tts_routes.py**:
- Test POST /api/tts with valid text (200)
- Test POST /api/tts with empty text (422 validation error)
- Test POST /api/tts with oversized text (422)
- Test POST /api/tts when service unavailable (503)
- Test POST /api/tts timeout (504)
- Test GET /audio/{filename} with existing file (200)
- Test GET /audio/{filename} with non-existent file (404)
- Test GET /audio/{filename} with directory traversal attempt (sanitized)
- Mock TTSClient to control behavior
- Use TestClient from FastAPI

**Example Test**:
```python
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock

def test_tts_synthesis_success(client: TestClient):
    with patch('api.tts_routes.get_tts_client') as mock_client:
        mock_client.return_value.synthesize_speech.return_value = Path("/data/audio/test.ogg")

        response = client.post("/api/tts", json={"text": "Hello world"})

        assert response.status_code == 200
        assert "audio_path" in response.json()
        assert response.json()["audio_path"] == "/audio/test.ogg"
```

#### End-to-End Tests

**test_tts_e2e.py**:
- Test complete flow with real TTS service (if available)
- Test audio file creation and serving
- Test concurrent TTS requests don't interfere
- Test audio file persistence after request completes
- Optional: Test with actual audio playback validation

### Considerations

#### Edge Cases
1. **Empty text**: Handled by Pydantic validation (min_length=1)
2. **Very long text**: Handled by max_length=10,000 validation
3. **Special characters**: Should pass through to TTS service unchanged
4. **Non-ASCII text**: UTF-8 encoding handled by requests library
5. **Service restart**: Connection errors handled gracefully
6. **Concurrent requests**: UUID ensures unique filenames
7. **Disk space full**: OS-level error, catch as generic exception
8. **Invalid filename in GET request**: Sanitize with Path.name

#### Performance Notes
1. **300s timeout blocks**: Consider using FastAPI BackgroundTasks for async processing
   - Alternative: Return 202 Accepted immediately, poll for status
   - Current design: Synchronous, blocks during synthesis
2. **Audio file accumulation**: No automatic cleanup implemented
   - Consider TTL-based cleanup (e.g., delete files older than 7 days)
   - Consider disk space monitoring
3. **File serving efficiency**: FileResponse uses sendfile if available (efficient)
4. **Caching opportunity**: Same text → reuse audio file (not implemented)

#### Security Notes
1. **Path traversal prevention**: `Path.name` strips directory components
2. **Filename guessing**: UUID v4 has ~122 bits entropy (secure)
3. **DoS prevention**: Max text length limits payload size
4. **No authentication**: Local service, but consider adding API key for TTS endpoint
5. **Error message sanitization**: Don't expose internal paths to client

#### Error Handling Strategy
1. **Network errors**: Map to 503 (Service Unavailable) with retry suggestion
2. **Timeouts**: Map to 504 (Gateway Timeout) with clear message
3. **Validation errors**: Map to 422 (Unprocessable Entity) with field details
4. **File not found**: Map to 404 with generic message
5. **Unknown errors**: Map to 500, log details, return generic message

### Future Enhancements

1. **Background Processing**:
   - Use FastAPI BackgroundTasks or Celery
   - Return job ID immediately
   - Poll endpoint for completion status
   - WebSocket for real-time progress

2. **Caching**:
   - Hash text content
   - Reuse audio files for identical text
   - Implement cache expiration (LRU, TTL)

3. **Audio File Cleanup**:
   - Scheduled job to delete old files
   - Configurable TTL (e.g., 7 days)
   - Disk space monitoring and alerts

4. **Rate Limiting**:
   - Limit TTS requests per user/IP
   - Prevent abuse of expensive operation

5. **Audio Format Options**:
   - Support MP3, WAV, etc.
   - Allow format parameter in request
   - Convert using ffmpeg if needed

6. **Progress Tracking**:
   - Long TTS requests show progress
   - Estimated time remaining
   - Cancel operation support

7. **Authentication**:
   - Add API key for TTS endpoint
   - Integrate with user authentication

8. **Monitoring**:
   - Track TTS request success/failure rates
   - Monitor average synthesis time
   - Alert on service unavailability

### Required Libraries

**No new dependencies required**:
- `requests` - Already in requirements.txt
- `fastapi` - Already in requirements.txt
- `pydantic` - Already in requirements.txt
- `pathlib` - Python standard library
- `uuid` - Python standard library

### Data Flow Diagram

```
Frontend
   ↓ (POST /api/tts with text)
FastAPI TTS Route
   ↓
AudioFileManager.generate_audio_filepath()
   ↓ (unique filepath)
TTSClient.synthesize_speech(text, filepath)
   ↓ (HTTP POST)
Local TTS Service (localhost:8013)
   ↓ (300s processing)
TTS Service returns {"ogg_path": "..."}
   ↓
TTSClient returns Path
   ↓
AudioFileManager.get_relative_path()
   ↓
Return TTSResponse {audio_path: "/audio/abc.ogg"}
   ↓
Frontend
   ↓ (GET /audio/abc.ogg)
FastAPI Audio Serving Route
   ↓
AudioFileManager.get_absolute_path()
   ↓
FileResponse streams audio file
   ↓
Frontend plays audio
```

### Module Dependencies

**Dependency Graph** (bottom-up):
```
configs/tts_config.py (foundational)
    ↓
exceptions/tts_exceptions.py (foundational)
    ↓
storage/audio_file_manager.py (depends on config)
    ↓
utils/tts_client.py (depends on config, exceptions)
    ↓
models/tts.py (depends on config for validation)
    ↓
api/tts_routes.py (depends on models, utils, storage, exceptions)
    ↓
main.py (depends on api, storage)
```

### Documentation Updates Needed

After implementation, update these files:

1. **backend/README.md**
   - Document TTS feature
   - API endpoint usage examples
   - Configuration options

2. **llm_readme.md**
   - Add TTS components to module list
   - Document data flow for TTS
   - Note dependencies on external service

3. **CLAUDE.md** (if applicable)
   - Add TTS service URL to configuration section
   - Document timeout considerations

4. **API Documentation** (Swagger/OpenAPI)
   - Automatically generated by FastAPI
   - Ensure TTSRequest/Response models have descriptions
