# Text-to-Speech (TTS) Architecture Summary

## Overview
This document provides a high-level overview of the TTS feature architecture for the chat application. The feature integrates with a local TTS service at http://localhost:8013 to synthesize speech from assistant messages and play it in the browser.

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React + TypeScript)               │
├─────────────────────────────────────────────────────────────────────┤
│  AssistantMessage Component                                         │
│    └─> TTSButton Component                                          │
│          └─> useTTS Hook                                            │
│                └─> TTSService                                       │
│                      │                                              │
│                      │ POST /api/tts {"text": "..."}               │
│                      ↓                                              │
├─────────────────────────────────────────────────────────────────────┤
│                      Backend (Python + FastAPI)                     │
├─────────────────────────────────────────────────────────────────────┤
│  TTS API Routes                                                     │
│    └─> AudioFileManager (generate unique filename)                 │
│    └─> TTSClient                                                    │
│          │                                                           │
│          │ POST http://localhost:8013/tts                          │
│          │ {"text": "...", "output": "/path/to/audio.ogg"}        │
│          ↓                                                           │
├─────────────────────────────────────────────────────────────────────┤
│                    Local TTS Service (External)                     │
│                    (LLM-enhanced speech synthesis)                  │
│                    300 second timeout                               │
│                      │                                              │
│                      │ Response: {"ogg_path": "/path/to/audio.ogg"}│
│                      ↓                                              │
├─────────────────────────────────────────────────────────────────────┤
│                      Backend (continued)                            │
├─────────────────────────────────────────────────────────────────────┤
│  Response: {"audio_path": "/audio/abc123.ogg"}                     │
│                      │                                              │
│                      │                                              │
│                      ↓                                              │
├─────────────────────────────────────────────────────────────────────┤
│                         Frontend (continued)                        │
├─────────────────────────────────────────────────────────────────────┤
│  useTTS creates Audio("/audio/abc123.ogg")                         │
│    └─> GET /audio/abc123.ogg                                       │
│          │                                                           │
│          │                                                           │
│          ↓                                                           │
├─────────────────────────────────────────────────────────────────────┤
│                      Backend (File Serving)                         │
├─────────────────────────────────────────────────────────────────────┤
│  FastAPI FileResponse                                               │
│    └─> Serves OGG file from data/audio/                            │
│          │                                                           │
│          │ audio/ogg stream                                        │
│          ↓                                                           │
├─────────────────────────────────────────────────────────────────────┤
│                         Browser Audio Player                        │
└─────────────────────────────────────────────────────────────────────┘
```

## Backend Components

### 1. Configuration (`backend/configs/tts_config.py`)
- `TTS_SERVICE_URL = "http://localhost:8013"`
- `TTS_TIMEOUT = 300.0` (5 minutes for LLM processing)
- `TTS_OUTPUT_DIR = data/audio/`
- `TTS_MAX_TEXT_LENGTH = 10000`

### 2. TTSClient (`backend/utils/tts_client.py`)
**Purpose**: HTTP client for local TTS service

**Key Method**:
```python
def synthesize_speech(text: str, output_path: Path) -> Path:
    """
    Request: POST http://localhost:8013/tts
    Payload: {"text": str, "output": str}
    Response: {"ogg_path": str}
    Timeout: 300 seconds
    Returns: Path to synthesized audio file
    """
```

**Error Handling**:
- `TTSServiceUnavailableError` - Connection failed
- `TTSTimeoutError` - Request > 300s
- `TTSProcessingError` - Service returned error

### 3. AudioFileManager (`backend/storage/audio_file_manager.py`)
**Purpose**: Manage audio file storage and naming

**Key Methods**:
```python
def generate_audio_filepath() -> Path:
    """Generate unique filename using UUID"""
    # Returns: /path/to/data/audio/{uuid}.ogg

def get_relative_path(absolute_path: Path) -> str:
    """Convert to API path"""
    # Returns: /audio/{uuid}.ogg
```

### 4. TTS API Routes (`backend/api/tts_routes.py`)
**Endpoint**: `POST /api/tts`

**Request**:
```json
{
  "text": "Message content to synthesize"
}
```

**Response**:
```json
{
  "audio_path": "/audio/abc123-def456.ogg"
}
```

**Status Codes**:
- 200: Success
- 400: Invalid input (empty text, too long)
- 503: TTS service unavailable
- 504: Request timed out (> 300s)
- 500: Internal error

### 5. Audio File Serving (`backend/main.py`)
**Endpoint**: `GET /audio/{filename}`

**Response**:
- Content-Type: `audio/ogg`
- Body: OGG audio file stream
- 404 if file not found

## Frontend Components

### 1. TTSService (`frontend/src/services/ttsService.ts`)
**Purpose**: HTTP client for TTS API

**Key Method**:
```typescript
async synthesizeSpeech(text: string): Promise<string>
```

**Process**:
1. POST /api/tts with text
2. Parse response to get audio_path
3. Handle errors (network, service, timeout)
4. Return audio path for playback

### 2. useTTS Hook (`frontend/src/hooks/useTTS.ts`)
**Purpose**: React hook for TTS state management

**State Machine**:
```
idle → loading → playing → idle/error
         ↓          ↓
       error     error
```

**Key Functions**:
- `synthesizeAndPlay(text: string)` - Synthesize and play audio
- `stopAudio()` - Stop current playback

**State**:
- `state: 'idle' | 'loading' | 'playing' | 'error'`
- `error: TTSError | null`

### 3. TTSButton Component (`frontend/src/components/TTSButton.tsx`)
**Purpose**: UI button for TTS functionality

**Props**:
```typescript
interface TTSButtonProps {
  text: string;      // Message content to synthesize
  disabled?: boolean;
}
```

**Visual States**:
- **Idle**: 🔊 Speaker icon (gray)
- **Loading**: ⟳ Spinner icon (blue, animated)
- **Playing**: ⏸ Pause icon (green)
- **Error**: ⚠ Error icon (red)

**Behavior**:
- Click in idle state: Start synthesis
- Click in playing state: Stop playback
- Disabled during loading
- Shows error message below button

### 4. AssistantMessage Integration
**Location**: Footer area (after timestamp)

```tsx
<div className="assistant-message-footer">
  <span className="assistant-message-timestamp">...</span>
  <TTSButton text={content} />
</div>
```

## Key Design Decisions

### 1. 300-Second Timeout
**Reason**: TTS service includes LLM processing for quality
**Implication**: Long wait time for users
**UX Solution**: Clear loading indicator with spinner

### 2. UUID Filenames
**Reason**: Prevent filename collisions and guessing
**Format**: `{uuid4}.ogg` (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890.ogg`)
**Security**: ~122 bits entropy

### 3. Two-Step Process
**Step 1**: Synthesize speech (POST /api/tts) → get audio path
**Step 2**: Fetch audio (GET /audio/{filename}) → play audio
**Reason**: Separates synthesis from delivery, enables caching

### 4. Single Audio Playback
**Rule**: Only one audio can play at a time
**Implementation**: Stop previous audio when starting new
**Reason**: Prevents audio overlap confusion

### 5. No Automatic Cleanup
**Current**: Audio files persist indefinitely
**Future**: Implement TTL-based cleanup (e.g., 7 days)
**Reason**: Enables browser caching and repeated playback

### 6. Error Handling Strategy
**Network errors**: User-friendly messages (not technical details)
**Service unavailable**: "TTS service offline" (503)
**Timeout**: "Request timed out" (504)
**Validation**: Pydantic automatic validation (422)

## Testing Strategy

### Backend Tests
1. **Unit Tests**: TTSClient, AudioFileManager, Models
2. **Integration Tests**: API routes with mocked service
3. **E2E Tests**: Full flow with real service (optional)

### Frontend Tests
1. **Unit Tests**: TTSService, useTTS hook, TTSButton
2. **Integration Tests**: Full flow from button to audio
3. **Accessibility Tests**: Keyboard navigation, screen readers

## Implementation Order

### Backend (Phase 1)
1. Configuration → Exceptions → AudioFileManager
2. TTSClient (with tests)
3. TTS Models → API Routes
4. Audio file serving in main.py

### Frontend (Phase 2)
1. TTS Types → TTSService
2. useTTS Hook
3. TTSButton Component
4. AssistantMessage integration

### Testing (Phase 3)
1. Unit tests for all components
2. Integration tests
3. E2E tests with real backend

## Dependencies

### Backend
- **Existing**: `requests`, `fastapi`, `pydantic`, `pathlib`, `uuid`
- **New**: None

### Frontend
- **Existing**: `fetch`, `Audio`, React hooks
- **New**: None

## Security Considerations

1. **Input Validation**: Max 10,000 characters
2. **Path Traversal Prevention**: Sanitize filenames with `Path.name`
3. **UUID Filenames**: Prevent path guessing
4. **Error Message Sanitization**: Don't expose internal paths
5. **No Authentication**: Local service only (consider adding API key)

## Performance Considerations

1. **Long Synthesis**: 300s max - show clear loading state
2. **File Accumulation**: Consider cleanup strategy
3. **Concurrent Requests**: UUID prevents collisions
4. **Memory Management**: Clean up Audio objects on unmount

## Accessibility Requirements

1. **Keyboard Navigation**: Tab to button, Enter/Space to activate
2. **Screen Readers**: aria-label describes button purpose
3. **Visual Feedback**: Icons + colors (not color alone)
4. **Error Announcements**: aria-live for errors
5. **Focus Management**: Maintain focus after click

## Browser Compatibility

- **Audio API**: All modern browsers ✓
- **OGG Format**: Chrome, Firefox, Edge ✓ | Safari ✗
  - Consider MP3 fallback for Safari support
- **Fetch API**: All modern browsers ✓

## Future Enhancements

1. **Background Processing**: Use FastAPI BackgroundTasks or Celery
2. **Caching**: Reuse audio for identical text
3. **Progress Tracking**: Show elapsed time during synthesis
4. **Cancellation**: Allow canceling long requests
5. **Audio Controls**: Pause/resume, seek, volume, speed
6. **Voice Selection**: Multiple voices per character
7. **Audio Download**: Save audio file locally

## Files Created

### Backend (9 files + tests)
- `backend/configs/tts_config.py`
- `backend/exceptions/tts_exceptions.py`
- `backend/models/tts.py`
- `backend/utils/tts_client.py`
- `backend/storage/audio_file_manager.py`
- `backend/api/tts_routes.py`
- 5 test files

### Frontend (6 files + tests)
- `frontend/src/types/tts.ts`
- `frontend/src/services/ttsService.ts`
- `frontend/src/hooks/useTTS.ts`
- `frontend/src/components/TTSButton.tsx`
- `frontend/src/components/TTSButton.css`
- 5 test files

### Modified Files (4)
- `backend/main.py` - Add TTS routes and audio serving
- `backend/configs/__init__.py` - Export TTS config
- `frontend/src/components/AssistantMessage.tsx` - Add TTSButton
- Update various `__init__.py` files for exports

## Quick Start Guide

### Backend Setup
1. Ensure TTS service running at http://localhost:8013
2. Create `data/audio/` directory
3. Run tests: `pytest tests/api/test_tts_routes.py`

### Frontend Setup
1. Run tests: `npm test -- TTSButton`
2. Build: `npm run build`

### Testing TTS
1. Start backend: `python backend/main.py`
2. Start frontend: `npm run dev`
3. Send message to character
4. Click speaker icon under assistant message
5. Wait for synthesis (up to 5 minutes)
6. Audio plays automatically

## Troubleshooting

### "TTS service unavailable"
- Check if service running at http://localhost:8013
- Check network connectivity

### "Request timed out"
- Text may be too long or complex
- Service may be overloaded
- Check service logs

### "Audio playback failed"
- Check browser console for errors
- Verify OGG format support
- Check browser autoplay policy

### Button stays in loading state
- Check browser console for errors
- Check network tab for failed requests
- Verify backend logs

## Reference Implementation
Based on `/home/denis/Projects/telegram_agent/yandex_speech/src/yandex_speech/utils/local_service_client.py`
