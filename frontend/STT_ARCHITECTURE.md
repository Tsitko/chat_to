# Speech-to-Text (STT) Architecture Overview

**Status:** Phase 1 Complete - Skeleton created
**Date:** 2025-12-18

## Quick Reference

### Task Files
- **Backend Architecture:** `/home/denis/Projects/chat_to/task_backend_stt.md`
- **Frontend Architecture:** `/home/denis/Projects/chat_to/task_frontend_stt.md`

### User Flow

```
User clicks record button
       ↓
Microphone permission requested (first time)
       ↓
Recording starts (shows duration counter)
       ↓
User speaks into microphone
       ↓
User clicks stop button
       ↓
Audio blob created
       ↓
POST /api/stt (multipart/form-data)
       ↓
Backend forwards to http://localhost:8013/stt
       ↓
STT service transcribes (up to 300s with LLM processing)
       ↓
Backend returns transcribed text
       ↓
Frontend sends text as user message
       ↓
Character responds
```

## Architecture Diagram

### Backend Structure

```
┌─────────────────────────────────────────────────┐
│              Backend (Python)                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  configs/stt_config.py                          │
│  ├── STT_SERVICE_URL = "http://localhost:8013"  │
│  ├── STT_TIMEOUT = 300.0                        │
│  ├── STT_MAX_FILE_SIZE = 10MB                   │
│  └── STT_ALLOWED_FORMATS = [...]                │
│                                                  │
│  exceptions/stt_exceptions.py                   │
│  ├── STTServiceUnavailableError                 │
│  ├── STTTimeoutError                            │
│  └── STTProcessingError                         │
│                                                  │
│  models/stt.py                                  │
│  └── STTResponse(transcribed_text: str)         │
│                                                  │
│  utils/stt_client.py                            │
│  └── STTClient                                  │
│      ├── transcribe_audio()                     │
│      ├── _build_multipart_files()               │
│      ├── _send_request()                        │
│      └── _parse_response()                      │
│                                                  │
│  api/stt_routes.py                              │
│  └── POST /api/stt                              │
│      ├── validate file                          │
│      ├── call STTClient                         │
│      └── return STTResponse                     │
│                                                  │
└─────────────────────────────────────────────────┘
                      ↓
                HTTP POST
                      ↓
┌─────────────────────────────────────────────────┐
│         Local STT Service (Port 8013)            │
│         ~/Projects/custom_tts                    │
├─────────────────────────────────────────────────┤
│  POST /stt                                       │
│  Request: multipart/form-data (audio file)       │
│  Response: {                                     │
│    "processed_text": str,  // LLM-processed      │
│    "raw_text": str         // Raw transcription  │
│  }                                               │
└─────────────────────────────────────────────────┘
```

### Frontend Structure

```
┌─────────────────────────────────────────────────┐
│            Frontend (React + TypeScript)         │
├─────────────────────────────────────────────────┤
│                                                  │
│  types/stt.ts                                   │
│  ├── STTResponse                                │
│  ├── STTError                                   │
│  ├── RecordingState                             │
│  └── AudioRecording                             │
│                                                  │
│  services/sttService.ts                         │
│  └── STTService                                 │
│      ├── transcribeAudio()                      │
│      ├── mapStatusToErrorType()                 │
│      └── getErrorMessage()                      │
│                                                  │
│  hooks/useAudioRecorder.ts                      │
│  └── useAudioRecorder()                         │
│      ├── startRecording()                       │
│      ├── stopRecording()                        │
│      ├── state: RecordingState                  │
│      ├── error: string                          │
│      └── duration: number                       │
│                                                  │
│  hooks/useSTT.ts                                │
│  └── useSTT(characterId)                        │
│      ├── startRecording()                       │
│      ├── stopAndTranscribe()                    │
│      ├── cancelRecording()                      │
│      ├── recordingState                         │
│      └── isProcessing                           │
│                                                  │
│  components/RecordButton.tsx                    │
│  └── RecordButton                               │
│      ├── Shows idle/recording/processing state  │
│      ├── Duration counter                       │
│      └── Error display                          │
│                                                  │
│  components/MessageInput.tsx (to be updated)    │
│  └── Includes RecordButton + Send button        │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Dependency Graph

### Backend Dependencies (Bottom-Up)

```
Level 0: configs/stt_config.py (no dependencies)
         exceptions/stt_exceptions.py (no dependencies)

Level 1: models/stt.py (← pydantic)

Level 2: utils/stt_client.py (← configs, exceptions, requests)

Level 3: api/stt_routes.py (← models, utils, configs, exceptions, fastapi)
```

### Frontend Dependencies (Bottom-Up)

```
Level 0: types/stt.ts (no dependencies)

Level 1: services/sttService.ts (← types/stt)

Level 2: hooks/useAudioRecorder.ts (← types/stt, MediaRecorder API)

Level 3: hooks/useSTT.ts (← services/sttService, hooks/useAudioRecorder, store)

Level 4: components/RecordButton.tsx (← hooks/useSTT, components/Loader)

Level 5: components/MessageInput.tsx (← components/RecordButton)
```

## Files Created

### Backend (5 files)
- `/home/denis/Projects/chat_to/backend/configs/stt_config.py`
- `/home/denis/Projects/chat_to/backend/exceptions/stt_exceptions.py`
- `/home/denis/Projects/chat_to/backend/models/stt.py`
- `/home/denis/Projects/chat_to/backend/utils/stt_client.py`
- `/home/denis/Projects/chat_to/backend/api/stt_routes.py`

### Frontend (5 files)
- `/home/denis/Projects/chat_to/frontend/src/types/stt.ts`
- `/home/denis/Projects/chat_to/frontend/src/services/sttService.ts`
- `/home/denis/Projects/chat_to/frontend/src/hooks/useAudioRecorder.ts`
- `/home/denis/Projects/chat_to/frontend/src/hooks/useSTT.ts`
- `/home/denis/Projects/chat_to/frontend/src/components/RecordButton.tsx`

### Updated (4 files)
- `/home/denis/Projects/chat_to/backend/configs/__init__.py`
- `/home/denis/Projects/chat_to/backend/exceptions/__init__.py`
- `/home/denis/Projects/chat_to/backend/models/__init__.py`
- `/home/denis/Projects/chat_to/backend/utils/__init__.py`

## Next Steps

### Phase 2: Test Development (TDD)

**Backend Tests:**
1. `tests/configs/test_stt_config.py`
2. `tests/exceptions/test_stt_exceptions.py`
3. `tests/models/test_stt.py`
4. `tests/utils/test_stt_client.py`
5. `tests/api/test_stt_routes.py`

**Frontend Tests:**
1. `src/services/__tests__/sttService.test.ts`
2. `src/hooks/__tests__/useAudioRecorder.test.ts`
3. `src/hooks/__tests__/useSTT.test.ts`
4. `src/components/__tests__/RecordButton.test.tsx`

### Phase 3: Implementation

**Backend (after tests written):**
1. Implement `utils/stt_client.py` (replace TODO placeholders)
2. Implement `api/stt_routes.py` (replace TODO placeholders)
3. Register router in `main.py`:
   ```python
   from api import stt_routes
   app.include_router(stt_routes.router)
   ```

**Frontend (after tests written):**
1. Implement `services/sttService.ts` (replace TODO placeholders)
2. Implement `hooks/useAudioRecorder.ts` (replace TODO placeholders)
3. Implement `hooks/useSTT.ts` (replace TODO placeholders)
4. Implement `components/RecordButton.tsx` (replace TODO placeholders)
5. Update `components/MessageInput.tsx` to include RecordButton

## Key Design Decisions

1. **Bottom-up dependency flow** - Follows project's strict architecture
2. **One class per file** - Single responsibility principle
3. **Configuration externalized** - Easy to modify service URL/timeout
4. **Specific exception types** - Better error handling and debugging
5. **MediaRecorder API** - Native browser support, no external libraries
6. **State machine pattern** - Clear state transitions (idle → recording → processing)
7. **Dependency injection** - Easy to mock for testing
8. **Interface-based design** - Clear contracts between modules

## API Contract

### Frontend → Backend
```
POST /api/stt
Content-Type: multipart/form-data

file: <audio blob>
```

### Backend → STT Service
```
POST http://localhost:8013/stt
Content-Type: multipart/form-data

file: <audio file>
```

### Response (Success)
```json
{
  "transcribed_text": "Hello, this is the transcribed text."
}
```

## Browser Compatibility

**MediaRecorder API:**
- Chrome 47+
- Firefox 25+
- Safari 14.1+
- Edge 79+

**Audio Format:**
- Chrome/Edge: WebM with Opus codec
- Firefox: WebM with Opus codec
- Safari: MP4 with AAC codec

## Configuration

**Backend:**
- Service URL: `http://localhost:8013`
- Timeout: 300 seconds (5 minutes)
- Max file size: 10 MB
- Allowed formats: .webm, .ogg, .wav, .mp3, .m4a

**Frontend:**
- Audio constraints: Echo cancellation, noise suppression, auto gain
- MIME type preference: audio/webm;codecs=opus (fallback to others)

## Error Handling

**Backend:**
- 400: Invalid file (missing, too large, wrong format)
- 503: STT service unavailable
- 504: Request timeout (> 300s)
- 500: Processing error

**Frontend:**
- Network errors → "Network error. Please check your connection."
- Service errors → "STT service is offline. Please try again later."
- Timeout errors → "Transcription timed out. Try a shorter recording."
- Unknown errors → "Transcription failed. Please try again."

## Testing Strategy

**Unit Tests:**
- Mock all external dependencies (HTTP, MediaRecorder)
- Test all state transitions
- Test error handling paths
- Test edge cases

**Integration Tests:**
- Test backend STTClient with mocked HTTP server
- Test frontend service with mocked fetch
- Test hooks with mocked dependencies

**E2E Tests (Manual):**
- Record and transcribe with real STT service
- Test microphone permission flow
- Test in different browsers
- Test accessibility (keyboard, screen reader)

## Notes

- All skeleton files created with complete type signatures and docstrings
- All implementation logic marked with `# TODO: Implementation needed`
- All __init__.py files updated to export new modules
- No new dependencies required (all already installed)
- Follows project's strict TDD methodology
- Maintains consistency with existing TTS implementation
