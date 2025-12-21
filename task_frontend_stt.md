# Frontend Architecture Design - Speech-to-Text (STT)

**Status:** Phase 1 Complete - Architecture skeleton created
**Date:** 2025-12-18

## Requirements

Add Speech-to-Text functionality to allow users to record audio and send it as text messages via browser's MediaRecorder API.

### Functional Requirements
1. Add record button next to send button in MessageInput component
2. Click to start recording (button shows recording state)
3. Click again to stop and transcribe
4. Send audio to backend POST /api/stt
5. Send transcribed text as user message via existing sendMessage flow
6. Show recording state, loading state, and error handling
7. Support browser's native audio recording (MediaRecorder API)

### Non-Functional Requirements
1. Follow project's bottom-up dependency flow
2. One class/hook per file
3. Interface-based design with TypeScript types
4. Comprehensive error handling
5. Accessibility support (ARIA labels)
6. Responsive UI states

## Architecture Design

### Created Structure

```
frontend/src/
├── types/
│   └── stt.ts                    # TypeScript types for STT
├── services/
│   └── sttService.ts             # HTTP client for /api/stt communication
├── hooks/
│   ├── useAudioRecorder.ts       # Audio recording state management (MediaRecorder)
│   └── useSTT.ts                 # STT orchestration hook
└── components/
    └── RecordButton.tsx          # UI component for record button
```

### Dependency Graph (Bottom-Up)

```
types/stt.ts (no dependencies)
    ↓
services/sttService.ts (depends on: types/stt.ts)
    ↓
hooks/useAudioRecorder.ts (depends on: MediaRecorder browser API)
    ↓
hooks/useSTT.ts (depends on: services/sttService.ts, hooks/useAudioRecorder.ts, store/messageStoreEnhanced.ts)
    ↓
components/RecordButton.tsx (depends on: hooks/useSTT.ts)
    ↓
components/MessageInput.tsx (updated to include RecordButton)
```

### Components Overview

#### 1. Types Module: `types/stt.ts`

**Responsibility:** TypeScript type definitions for STT functionality

**Types:**

```typescript
/**
 * Response from backend /api/stt endpoint.
 */
export interface STTResponse {
  transcribed_text: string;
}

/**
 * STT error types for specific failure modes.
 */
export type STTErrorType = 'network' | 'service' | 'timeout' | 'unknown';

/**
 * Custom error class for STT operations.
 */
export class STTError extends Error {
  type: STTErrorType;
  constructor(type: STTErrorType, message: string);
}

/**
 * Recording state machine states.
 */
export type RecordingState = 'idle' | 'recording' | 'processing';

/**
 * Audio recording result.
 */
export interface AudioRecording {
  blob: Blob;           // Audio data as Blob
  mimeType: string;     // MIME type (e.g., 'audio/webm')
  duration: number;     // Recording duration in milliseconds
}
```

**Dependencies:** None

---

#### 2. STT Service Module: `services/sttService.ts`

**Responsibility:** HTTP client for backend /api/stt communication

**Class: `STTService`**

**Attributes:**
- `private readonly baseUrl: string` - Base URL for API requests

**Methods:**

**`constructor(baseUrl: string = '')`**
- Initialize service with base URL
- Default empty string for relative URLs

**`async transcribeAudio(audioBlob: Blob, filename: string = 'recording.webm'): Promise<string>`**
- Send audio file to backend and get transcribed text
- Args: audioBlob (recorded audio), filename (optional, for content disposition)
- Returns: Promise<string> - Transcribed text
- Raises: STTError with specific type
- Process:
  1. Create FormData with audio blob
  2. POST to /api/stt with multipart/form-data
  3. Handle HTTP errors and map to STTError types
  4. Parse JSON response
  5. Return transcribed_text field

**`private mapStatusToErrorType(status: number): STTErrorType`**
- Map HTTP status code to error type
- 503 → 'service', 504 → 'timeout', other → 'unknown'

**`private getErrorMessage(status: number): string`**
- Get user-friendly error message for status code

**Dependencies:**
- types/stt (STTResponse, STTError)

**Singleton Export:**
```typescript
export const sttService = new STTService();
```

---

#### 3. Audio Recorder Hook: `hooks/useAudioRecorder.ts`

**Responsibility:** Manage audio recording state using browser MediaRecorder API

**Hook: `useAudioRecorder()`**

**Returns:**
```typescript
{
  state: RecordingState;              // Current recording state
  startRecording: () => Promise<void>; // Start recording
  stopRecording: () => Promise<AudioRecording>; // Stop and get audio
  error: string | null;               // Recording error message
  duration: number;                   // Current recording duration (ms)
}
```

**Internal State:**
- `state: RecordingState` - Current state (idle/recording/processing)
- `mediaRecorder: MediaRecorder | null` - MediaRecorder instance
- `audioChunks: Blob[]` - Accumulated audio chunks
- `error: string | null` - Error message
- `duration: number` - Recording duration in milliseconds
- `startTime: number | null` - Recording start timestamp

**Methods:**

**`startRecording(): Promise<void>`**
- Request microphone permission via navigator.mediaDevices.getUserMedia()
- Create MediaRecorder instance
- Set up event listeners (ondataavailable, onstop, onerror)
- Start recording
- Set state to 'recording'
- Handle errors: permission denied, not supported, etc.

**`stopRecording(): Promise<AudioRecording>`**
- Stop MediaRecorder
- Wait for onstop event
- Create Blob from audioChunks
- Calculate duration
- Reset state to 'idle'
- Return AudioRecording object
- Handle errors: no active recording, etc.

**Internal Effects:**
- Cleanup MediaRecorder and tracks on unmount
- Update duration every 100ms during recording

**Error Handling:**
- NotAllowedError → "Microphone permission denied"
- NotFoundError → "No microphone found"
- NotSupportedError → "Audio recording not supported in this browser"
- Generic errors → "Failed to start recording"

**Dependencies:**
- React (useState, useEffect, useRef)
- types/stt (RecordingState, AudioRecording)
- Browser MediaRecorder API

---

#### 4. STT Orchestration Hook: `hooks/useSTT.ts`

**Responsibility:** Orchestrate recording, transcription, and message sending

**Hook: `useSTT(characterId: string | null)`**

**Returns:**
```typescript
{
  recordingState: RecordingState;     // Current recording state
  isProcessing: boolean;              // True when transcribing or sending
  error: string | null;               // User-friendly error message
  startRecording: () => Promise<void>; // Start recording
  stopAndTranscribe: () => Promise<void>; // Stop, transcribe, send message
  cancelRecording: () => void;        // Cancel recording without sending
  duration: number;                   // Current recording duration (ms)
}
```

**Internal Dependencies:**
- `useAudioRecorder()` - For audio recording
- `useMessageStoreEnhanced()` - For sending messages
- `sttService` - For transcription

**Process Flow:**

**`startRecording()`**
1. Validate characterId is selected
2. Call recorder.startRecording()
3. Set error if validation/recording fails

**`stopAndTranscribe()`**
1. Set state to 'processing'
2. Call recorder.stopRecording() → AudioRecording
3. Call sttService.transcribeAudio(audioBlob) → text
4. Call messageStore.sendMessage(characterId, text)
5. Reset state to 'idle' on success
6. Set error and reset state on failure

**`cancelRecording()`**
1. Call recorder.stopRecording() (ignore result)
2. Reset to idle state

**Error Handling:**
- No character selected → "Please select a character first"
- Recording errors → Pass through from useAudioRecorder
- STTError → Map type to user-friendly message:
  - 'network' → "Network error. Please check your connection."
  - 'service' → "STT service is offline. Please try again later."
  - 'timeout' → "Transcription timed out. Try a shorter recording."
  - 'unknown' → "Transcription failed. Please try again."
- Message sending errors → Pass through from messageStore

**Dependencies:**
- React (useState, useCallback)
- hooks/useAudioRecorder
- services/sttService
- store/messageStoreEnhanced
- types/stt

---

#### 5. Record Button Component: `components/RecordButton.tsx`

**Responsibility:** UI component for recording button with visual states

**Component: `RecordButton`**

**Props:**
```typescript
interface RecordButtonProps {
  characterId: string | null;
  disabled?: boolean;  // External disable (e.g., no character selected)
}
```

**Internal State (from useSTT):**
- recordingState, isProcessing, error, duration
- startRecording, stopAndTranscribe, cancelRecording

**UI States:**

1. **Idle State (not recording, not processing)**
   - Icon: Microphone icon
   - Label: "Record"
   - Color: Default
   - Click action: startRecording()
   - Disabled if: !characterId || disabled

2. **Recording State (recording in progress)**
   - Icon: Stop/Square icon
   - Label: "Stop (duration)"
   - Color: Red/Recording indicator
   - Click action: stopAndTranscribe()
   - Show pulsing animation
   - Show duration counter

3. **Processing State (transcribing/sending)**
   - Icon: Spinner/Loader
   - Label: "Processing..."
   - Color: Muted
   - Disabled: true
   - Show loading indicator

4. **Error State (error occurred)**
   - Show error message below button
   - Reset to idle state

**Accessibility:**
- aria-label with current state
- aria-disabled attribute
- role="button"
- Keyboard support (Enter/Space)
- Screen reader announcements for state changes

**Styling:**
- Match existing MessageInput button styles
- Position next to send button
- Responsive sizing
- Visual feedback for states

**Dependencies:**
- React
- hooks/useSTT
- components/Loader (reuse existing)

---

#### 6. Updated MessageInput Component: `components/MessageInput.tsx`

**Changes:**

1. Import RecordButton component
2. Add RecordButton before send button
3. Adjust layout to accommodate both buttons (flex layout)
4. Pass characterId prop to RecordButton

**Layout:**
```
[Textarea                    ]
[Record Button] [Send Button]
```

**No other logic changes** - RecordButton is self-contained

---

## Implementation Recommendations

### Phase 1: Architecture (This Phase)

1. **Create folder structure and skeleton files**
2. **Define all types in types/stt.ts**
3. **Create class/hook signatures with JSDoc comments**
4. **Add placeholder implementations**
5. **No new dependencies needed** (all browser APIs)

### Phase 2: Test Development (TDD)

**Test file structure:**
```
src/
├── services/__tests__/
│   └── sttService.test.ts
├── hooks/__tests__/
│   ├── useAudioRecorder.test.ts
│   └── useSTT.test.ts
└── components/__tests__/
    └── RecordButton.test.tsx
```

**Unit Tests:**

1. **sttService.test.ts**
   - Test successful transcription (mock fetch)
   - Test network error (fetch throws TypeError)
   - Test service unavailable (503 response)
   - Test timeout (504 response)
   - Test unknown error (500 response)
   - Test response parsing
   - Test error type mapping

2. **useAudioRecorder.test.ts**
   - Mock navigator.mediaDevices.getUserMedia
   - Mock MediaRecorder constructor
   - Test startRecording success
   - Test startRecording permission denied
   - Test startRecording not supported
   - Test stopRecording success
   - Test stopRecording without active recording
   - Test duration updates
   - Test cleanup on unmount

3. **useSTT.test.ts**
   - Mock useAudioRecorder hook
   - Mock sttService
   - Mock useMessageStoreEnhanced
   - Test startRecording success
   - Test startRecording without character
   - Test stopAndTranscribe success (full flow)
   - Test stopAndTranscribe with recording error
   - Test stopAndTranscribe with transcription error
   - Test stopAndTranscribe with message sending error
   - Test cancelRecording

4. **RecordButton.test.tsx**
   - Mock useSTT hook
   - Test idle state rendering
   - Test recording state rendering
   - Test processing state rendering
   - Test click handlers
   - Test disabled states
   - Test error display
   - Test accessibility attributes

### Phase 3: Implementation

1. **Implement bottom-up:** types → services → hooks → components
2. **Run npm test after each module**
3. **Fix failing tests before moving to next module**
4. **Manual browser testing with real microphone**

### Testing Strategy

**Run tests:**
```bash
# All STT tests
npm test -- stt

# Single file
npm test -- useSTT.test.ts

# Watch mode
npm test -- --watch
```

**Manual testing checklist:**
1. Test in Chrome, Firefox, Safari
2. Test microphone permission flow
3. Test recording short audio (< 5s)
4. Test recording longer audio (> 30s)
5. Test canceling recording
6. Test without STT service running (error handling)
7. Test without character selected
8. Test accessibility with screen reader
9. Test keyboard navigation

## Browser Compatibility

### MediaRecorder API Support
- Chrome: 47+ (WebM with Opus)
- Firefox: 25+ (WebM with Opus)
- Safari: 14.1+ (MP4 with AAC)
- Edge: 79+ (WebM with Opus)

### Fallback Strategy
- Check for MediaRecorder support before showing button
- Show "Recording not supported" message if unavailable
- Graceful degradation to text-only input

## Configuration

**No config file needed** - all settings in code:
```typescript
// In useAudioRecorder.ts
const AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
};

const MIME_TYPE_PREFERENCE = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4'
];
```

## User Experience Flow

1. **User clicks record button**
   - Browser prompts for microphone permission (first time)
   - Button changes to recording state
   - Duration counter starts
   - Visual recording indicator (pulsing red)

2. **User speaks into microphone**
   - Duration updates in real-time
   - Can click stop button anytime

3. **User clicks stop button**
   - Button changes to processing state
   - Shows "Processing..." with spinner
   - Audio sent to backend
   - Backend transcribes audio
   - Transcribed text sent as message
   - Button returns to idle state

4. **Error scenarios**
   - Error message shown below button
   - Button returns to idle state
   - User can retry

## Error Messages (User-Facing)

**Recording Errors:**
- "Microphone permission denied. Please allow microphone access."
- "No microphone found. Please connect a microphone."
- "Audio recording not supported in this browser."
- "Failed to start recording. Please try again."

**Transcription Errors:**
- "Network error. Please check your connection."
- "STT service is offline. Please try again later."
- "Transcription timed out. Try a shorter recording."
- "Transcription failed. Please try again."

**Validation Errors:**
- "Please select a character first."

## Performance Considerations

1. **Memory Management**
   - Clear audioChunks after transcription
   - Stop media tracks on cleanup
   - Dispose MediaRecorder properly

2. **Audio Quality vs Size**
   - Use browser's default quality (good balance)
   - Typical 1min recording ≈ 500KB (WebM/Opus)

3. **Network Efficiency**
   - Send audio as Blob (efficient binary transfer)
   - Use multipart/form-data for upload

## Accessibility Features

1. **ARIA Labels**
   - Dynamic aria-label based on state
   - aria-disabled for disabled states
   - aria-live for status announcements

2. **Keyboard Support**
   - Tab navigation
   - Enter/Space to activate
   - Esc to cancel recording (optional)

3. **Screen Reader Announcements**
   - "Recording started"
   - "Recording stopped, processing"
   - "Message sent"
   - Error announcements

4. **Visual Indicators**
   - Clear state changes
   - High contrast colors
   - Animation for recording state

## Security Considerations

1. **Permissions**
   - Request microphone permission only when needed
   - Handle permission denial gracefully
   - Don't store permission state

2. **Audio Data**
   - Audio data only in memory (not persisted)
   - Sent directly to backend, not stored locally
   - Cleared immediately after transcription

3. **HTTPS Requirement**
   - getUserMedia requires HTTPS in production
   - Works on localhost for development

## Edge Cases to Handle

1. Microphone permission denied
2. No microphone available
3. Browser doesn't support MediaRecorder
4. Network disconnection during recording
5. Network disconnection during upload
6. Very short recording (< 1 second)
7. Very long recording (> 5 minutes)
8. User navigates away during recording
9. User switches character during recording
10. Multiple rapid clicks on record button

## Future Enhancements (Not in Current Scope)

1. Audio level visualization (waveform)
2. Playback before sending
3. Audio editing (trim, delete)
4. Support for file upload (not just recording)
5. Voice activity detection (auto-stop)
6. Real-time streaming transcription
7. Language selection
8. Audio quality settings

## Dependencies

**No new dependencies required.**

**Browser APIs used:**
- navigator.mediaDevices.getUserMedia
- MediaRecorder
- Blob
- FormData
- fetch

**Existing dependencies:**
- React (already installed)
- TypeScript (already installed)

## Integration Points

1. **MessageInput Component**: Updated to include RecordButton
2. **Message Store**: Uses existing sendMessage from messageStoreEnhanced
3. **Backend API**: POST /api/stt endpoint (from backend task)
4. **Loader Component**: Reuses existing Loader for processing state

## Testing with Local STT Service

**Prerequisites:**
1. Start backend: `uvicorn main:app --port 1310`
2. Start STT service: (in ~/Projects/custom_tts)
3. Start frontend: `npm run dev`

**Test flow:**
1. Select a character
2. Click record button
3. Allow microphone permission
4. Speak a short phrase
5. Click stop button
6. Verify transcribed text appears as user message
7. Verify assistant responds

## Notes

- Use browser's native MediaRecorder (no external libraries)
- Audio format depends on browser (typically WebM with Opus)
- Backend accepts any audio format (validated on backend)
- Recording button disabled until character selected (consistent with send button)
- Error messages are user-friendly and actionable
- Follow existing component patterns (MessageInput, TTS button)
- Maintain consistency with project's TypeScript strict mode

---

## Phase 1 Completion Summary

### Files Created

All frontend skeleton files have been created with complete signatures and JSDoc comments:

1. **types/stt.ts** - TypeScript type definitions
   - STTResponse interface
   - STTErrorType type ('network' | 'service' | 'timeout' | 'unknown')
   - STTError class extending Error
   - RecordingState type ('idle' | 'recording' | 'processing')
   - AudioRecording interface

2. **services/sttService.ts** - HTTP client for /api/stt
   - STTService class with transcribeAudio() method
   - Private methods: mapStatusToErrorType(), getErrorMessage()
   - Singleton export: sttService
   - All methods have TODO placeholders

3. **hooks/useAudioRecorder.ts** - Audio recording hook
   - useAudioRecorder() hook
   - Returns: state, startRecording, stopRecording, error, duration
   - Audio constraints and MIME type preferences defined
   - All logic has TODO placeholders

4. **hooks/useSTT.ts** - STT orchestration hook
   - useSTT(characterId) hook
   - Returns: recordingState, isProcessing, error, control methods
   - Methods: startRecording(), stopAndTranscribe(), cancelRecording()
   - All logic has TODO placeholders

5. **components/RecordButton.tsx** - UI component
   - RecordButton component with characterId and disabled props
   - State-based rendering (idle/recording/processing)
   - formatDuration() helper function
   - All logic has TODO placeholders

### Component Integration Points

The RecordButton component will be integrated into MessageInput:

**Location:** frontend/src/components/MessageInput.tsx

**Changes needed:**
1. Import RecordButton component
2. Add RecordButton before send button
3. Adjust layout to accommodate both buttons (flex layout)
4. Pass characterId prop to RecordButton

### Next Steps

**Phase 2: Test Development (TDD)**

Create test files in the following order:

1. src/services/__tests__/sttService.test.ts
2. src/hooks/__tests__/useAudioRecorder.test.ts
3. src/hooks/__tests__/useSTT.test.ts
4. src/components/__tests__/RecordButton.test.tsx

**Phase 3: Implementation**

Implement bottom-up after all tests are written:
1. Implement types/stt.ts (already complete)
2. Implement services/sttService.ts
3. Implement hooks/useAudioRecorder.ts
4. Implement hooks/useSTT.ts
5. Implement components/RecordButton.tsx
6. Update components/MessageInput.tsx to include RecordButton

### Browser API Requirements

The implementation will use the following browser APIs:
- navigator.mediaDevices.getUserMedia() - Request microphone access
- MediaRecorder - Record audio
- Blob - Store audio data
- FormData - Upload audio file
- fetch - HTTP requests

**Browser Compatibility:**
- Chrome 47+
- Firefox 25+
- Safari 14.1+
- Edge 79+

### Testing Requirements

**Unit Tests:**
- Mock browser APIs (getUserMedia, MediaRecorder)
- Mock fetch for HTTP requests
- Mock hooks (useAudioRecorder, useMessageStoreEnhanced)
- Test all state transitions
- Test error handling

**Manual Testing:**
- Test microphone permission flow
- Test recording and transcription with real STT service
- Test accessibility with keyboard and screen reader
- Test in different browsers

### File Locations

All files created at:
- /home/denis/Projects/chat_to/frontend/src/types/stt.ts
- /home/denis/Projects/chat_to/frontend/src/services/sttService.ts
- /home/denis/Projects/chat_to/frontend/src/hooks/useAudioRecorder.ts
- /home/denis/Projects/chat_to/frontend/src/hooks/useSTT.ts
- /home/denis/Projects/chat_to/frontend/src/components/RecordButton.tsx

### No Dependencies Required

All necessary dependencies are already installed:
- React (hooks, components)
- TypeScript (types, interfaces)
- Browser APIs (MediaRecorder, getUserMedia)

No npm install needed.
