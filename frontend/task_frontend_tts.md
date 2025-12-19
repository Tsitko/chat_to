# Frontend Task: Add Text-to-Speech (TTS) Functionality

## Objective
Add Text-to-Speech functionality to the chat UI by placing a TTS button under each assistant message. When clicked, the button sends the message text to the backend TTS API, receives an audio file path, and plays the synthesized speech in the browser.

## Requirements

### 1. Update Message Type
The `Message` interface in `frontend/src/types/message.ts` should already support all required fields. No changes needed if emotions are already added.

### 2. Create TTS Service
Create a new `TTSService` class in `frontend/src/services/ttsService.ts` that:
- Sends POST requests to `/api/tts` with message text
- Request format: `{"text": string}`
- Response format: `{"audio_path": string}`
- Returns the audio file path (e.g., `/audio/abc123.ogg`)
- Handles HTTP errors (503 service unavailable, 504 timeout, etc.)
- Throws typed errors for different failure modes

### 3. Create TTS Hook
Create a custom React hook `useTTS` in `frontend/src/hooks/useTTS.ts` that:
- Manages TTS state: idle, loading, playing, error
- Provides `synthesizeAndPlay(text: string)` function
- Handles audio playback using HTML5 Audio API
- Provides `stopAudio()` function to stop current playback
- Tracks current playing audio to prevent multiple simultaneous playbacks
- Returns loading state, error state, and control functions

### 4. Create TTS Button Component
Create a new `TTSButton` component in `frontend/src/components/TTSButton.tsx` that:
- Displays a speaker icon button
- Shows loading spinner while synthesizing speech
- Shows playing state while audio is playing
- Displays error state if synthesis fails
- Accepts `text` prop (message content to synthesize)
- Uses the `useTTS` hook for functionality
- Styled to match existing UI (compact, non-intrusive)

### 5. Update AssistantMessage Component
Modify `frontend/src/components/AssistantMessage.tsx` to:
- Import and render `TTSButton` component
- Place TTSButton after message content (below text, near timestamp)
- Pass message content to TTSButton
- Ensure button appears only for assistant messages (not user messages)

### 6. Error Handling UI
The TTSButton should display error states:
- Service unavailable (503): "TTS service offline"
- Timeout (504): "TTS request timed out"
- Generic error (500): "TTS failed"
- Network error: "Network error"
- Display error in tooltip or small text below button

### 7. Loading States
The TTSButton should show visual feedback:
- **Idle**: Speaker icon button
- **Loading**: Spinner icon (synthesizing speech)
- **Playing**: Different icon (e.g., pause or sound waves)
- **Error**: Error icon with red color

## Technical Constraints
- TTS requests may take up to 300 seconds (5 minutes) due to LLM processing
- Show loading indicator during synthesis
- Only one audio can play at a time (stop previous if new one starts)
- Audio files are OGG format (supported by modern browsers)
- Handle browser audio playback errors (autoplay policy, codec support)
- No authentication required for TTS API

## Testing Requirements

### Unit Tests for TTSService (`frontend/src/services/__tests__/ttsService.test.ts`)
- Test successful TTS request
- Test request with empty text (should fail)
- Test 503 service unavailable error
- Test 504 timeout error
- Test 500 generic error
- Test network error handling
- Mock fetch for all tests

### Unit Tests for useTTS Hook (`frontend/src/hooks/__tests__/useTTS.test.ts`)
- Test initial state (idle)
- Test loading state during synthesis
- Test playing state during audio playback
- Test error state on failure
- Test stopAudio() function
- Test cleanup on unmount
- Mock TTSService and Audio API

### Unit Tests for TTSButton Component (`frontend/src/components/__tests__/TTSButton.test.tsx`)
- Test button renders in idle state
- Test button shows loading spinner during synthesis
- Test button shows playing state during playback
- Test button shows error state on failure
- Test button click triggers synthesis
- Test button is disabled during loading
- Mock useTTS hook

### Unit Tests for Updated AssistantMessage (`frontend/src/components/__tests__/AssistantMessage.test.tsx`)
- Test AssistantMessage renders TTSButton
- Test TTSButton receives correct text prop
- Test TTSButton positioned correctly (after content)
- Test backward compatibility (component works without TTS)

### Integration Tests
Create `frontend/src/__tests__/integration/TTS.integration.test.tsx`:
- Test complete TTS flow: button click → API call → audio playback
- Test error handling flow: API error → error display
- Test multiple messages: each has independent TTS button
- Test audio stopping when new audio starts
- Mock fetch and Audio API

## Files to Create/Modify

### Create New Files
- `frontend/src/services/ttsService.ts` - TTS API client
- `frontend/src/hooks/useTTS.ts` - TTS state management hook
- `frontend/src/components/TTSButton.tsx` - TTS button component
- `frontend/src/components/TTSButton.css` - TTS button styling
- `frontend/src/types/tts.ts` - TypeScript types for TTS
- `frontend/src/services/__tests__/ttsService.test.ts` - Service tests
- `frontend/src/hooks/__tests__/useTTS.test.ts` - Hook tests
- `frontend/src/components/__tests__/TTSButton.test.tsx` - Component tests
- `frontend/src/__tests__/integration/TTS.integration.test.tsx` - Integration tests

### Modify Existing Files
- `frontend/src/components/AssistantMessage.tsx` - Add TTSButton
- `frontend/src/components/__tests__/AssistantMessage.test.tsx` - Update tests

## Dependencies
- **Existing**: `fetch` API for HTTP requests
- **Existing**: HTML5 `Audio` API for audio playback
- **Existing**: React hooks (useState, useEffect, useCallback, useRef)
- **New**: None (all required APIs are browser built-ins)

## Error Handling Strategy
1. **Network Errors**: Display "Network error" message
2. **Service Unavailable (503)**: Display "TTS service offline"
3. **Timeout (504)**: Display "Request timed out (5 min limit)"
4. **Generic Errors (500)**: Display "TTS failed"
5. **Audio Playback Errors**: Display "Audio playback failed"
6. **Autoplay Policy Block**: Catch and display "Click to play audio"

## User Experience Considerations
1. **Loading Indicator**: Show spinner during 300s synthesis (long wait)
2. **Progress Feedback**: Consider showing elapsed time during synthesis
3. **Cancellation**: Consider adding cancel button during long synthesis
4. **Audio Controls**: Simple play/stop (no pause, seek, volume yet)
5. **Visual Feedback**: Clear distinction between idle/loading/playing/error states
6. **Accessibility**: Button has aria-label, keyboard accessible

## Performance Considerations
1. **Long Synthesis Time**: 300s max - show clear loading state
2. **Audio Caching**: Browser may cache audio files (no frontend caching needed)
3. **Multiple Requests**: Prevent rapid clicking (disable button during synthesis)
4. **Memory Leaks**: Clean up Audio objects on component unmount
5. **Concurrent Playback**: Stop previous audio when new one starts

## Accessibility Requirements
1. **Keyboard Navigation**: Button accessible via Tab key
2. **Screen Readers**: `aria-label` describes button purpose
3. **Visual Indicators**: Don't rely on color alone (use icons)
4. **Focus States**: Clear focus outline on button
5. **Error Announcements**: Use `aria-live` for error messages

---

## Architecture Design

### Created Structure

```
frontend/src/
├── types/
│   └── tts.ts                              # NEW - TTS type definitions
├── services/
│   ├── ttsService.ts                       # NEW - TTS API client
│   └── __tests__/
│       └── ttsService.test.ts              # NEW - Service tests
├── hooks/
│   ├── useTTS.ts                           # NEW - TTS state management hook
│   └── __tests__/
│       └── useTTS.test.ts                  # NEW - Hook tests
├── components/
│   ├── TTSButton.tsx                       # NEW - TTS button component
│   ├── TTSButton.css                       # NEW - TTS button styles
│   ├── AssistantMessage.tsx                # MODIFIED - Add TTSButton
│   └── __tests__/
│       ├── TTSButton.test.tsx              # NEW - Button tests
│       └── AssistantMessage.test.tsx       # MODIFIED - Update tests
└── __tests__/
    └── integration/
        └── TTS.integration.test.tsx        # NEW - Integration tests
```

### Components Overview

#### 1. TTS Types (`frontend/src/types/tts.ts`)
**Purpose**: TypeScript type definitions for TTS functionality.

**Types**:
```typescript
export interface TTSRequest {
  text: string;
}

export interface TTSResponse {
  audio_path: string;
}

export type TTSState = 'idle' | 'loading' | 'playing' | 'error';

export interface TTSError {
  type: 'network' | 'service' | 'timeout' | 'playback' | 'unknown';
  message: string;
}
```

**Design Decisions**:
- Separate state enum for type safety
- Structured error type for better error handling
- Request/Response types match backend models

#### 2. TTSService (`frontend/src/services/ttsService.ts`)
**Purpose**: HTTP client for TTS API communication.

**Responsibilities**:
- Send POST requests to `/api/tts`
- Build request payload from text
- Parse response to extract audio path
- Handle HTTP errors with specific error types
- Throw typed errors for different failure modes

**Key Methods**:
- `synthesizeSpeech(text: string): Promise<string>`
  - Purpose: Request speech synthesis for given text
  - Parameters: text (message content to synthesize)
  - Returns: Promise resolving to audio file path (e.g., `/audio/abc123.ogg`)
  - Throws: TTSError with specific type and message

**Implementation Approach**:
```typescript
async synthesizeSpeech(text: string): Promise<string> {
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const errorType = this.mapStatusToErrorType(response.status);
      throw new TTSError(errorType, this.getErrorMessage(response.status));
    }

    const data: TTSResponse = await response.json();
    return data.audio_path;
  } catch (error) {
    // Handle network errors, JSON parse errors, etc.
    throw this.handleError(error);
  }
}
```

**Error Mapping**:
```typescript
private mapStatusToErrorType(status: number): TTSError['type'] {
  switch (status) {
    case 503: return 'service';
    case 504: return 'timeout';
    default: return 'unknown';
  }
}

private getErrorMessage(status: number): string {
  switch (status) {
    case 503: return 'TTS service is offline';
    case 504: return 'TTS request timed out (5 minute limit)';
    case 500: return 'TTS processing failed';
    default: return 'TTS request failed';
  }
}
```

**Design Decisions**:
- Use native fetch API (no axios dependency)
- Throw typed errors instead of returning error objects
- Map HTTP status codes to user-friendly messages
- Separate error type for different UI handling

#### 3. useTTS Hook (`frontend/src/hooks/useTTS.ts`)
**Purpose**: React hook for managing TTS state and audio playback.

**Responsibilities**:
- Manage TTS state: idle → loading → playing → idle/error
- Call TTSService to synthesize speech
- Create and manage Audio objects for playback
- Provide functions to start and stop audio
- Clean up resources on unmount
- Prevent multiple simultaneous playbacks

**State**:
```typescript
const [state, setState] = useState<TTSState>('idle');
const [error, setError] = useState<TTSError | null>(null);
const audioRef = useRef<HTMLAudioElement | null>(null);
```

**Key Functions**:

**synthesizeAndPlay(text: string): Promise<void>**:
- Purpose: Synthesize speech and play audio
- Process:
  1. Set state to 'loading'
  2. Call TTSService.synthesizeSpeech(text)
  3. Create Audio object with returned path
  4. Set up event listeners (play, ended, error)
  5. Call audio.play()
  6. Set state to 'playing'
- Error Handling: Catch and set error state

**stopAudio(): void**:
- Purpose: Stop currently playing audio
- Process:
  1. Check if audioRef.current exists
  2. Call audio.pause()
  3. Set audio.currentTime = 0
  4. Remove event listeners
  5. Set audioRef.current = null
  6. Set state to 'idle'

**Cleanup**:
```typescript
useEffect(() => {
  return () => {
    // Cleanup on unmount
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };
}, []);
```

**Audio Event Handlers**:
```typescript
const handleAudioPlay = () => setState('playing');
const handleAudioEnded = () => {
  setState('idle');
  audioRef.current = null;
};
const handleAudioError = () => {
  setState('error');
  setError({ type: 'playback', message: 'Audio playback failed' });
};
```

**Design Decisions**:
- Use useRef for Audio object (doesn't trigger re-renders)
- Use useCallback for memoized functions
- Automatic cleanup prevents memory leaks
- Single audio instance (stop previous when starting new)

#### 4. TTSButton Component (`frontend/src/components/TTSButton.tsx`)
**Purpose**: UI button for triggering TTS synthesis and playback.

**Props**:
```typescript
interface TTSButtonProps {
  text: string;           // Message text to synthesize
  disabled?: boolean;     // Optional external disable
}
```

**State Management**:
- Uses `useTTS` hook for all TTS logic
- Local state for button interactions (if needed)

**Rendering Logic**:
```typescript
const { state, error, synthesizeAndPlay, stopAudio } = useTTS();

const handleClick = () => {
  if (state === 'playing') {
    stopAudio();
  } else {
    synthesizeAndPlay(text);
  }
};

const getButtonIcon = () => {
  switch (state) {
    case 'idle': return <SpeakerIcon />;
    case 'loading': return <SpinnerIcon />;
    case 'playing': return <PauseIcon />;
    case 'error': return <ErrorIcon />;
  }
};

const isButtonDisabled = state === 'loading' || disabled;
```

**Visual States**:
1. **Idle**: Speaker icon, default color, enabled
2. **Loading**: Spinner icon, blue color, disabled
3. **Playing**: Pause/sound waves icon, green color, enabled (click to stop)
4. **Error**: Error icon, red color, enabled (click to retry)

**Accessibility**:
```typescript
<button
  onClick={handleClick}
  disabled={isButtonDisabled}
  aria-label={getAriaLabel()}
  aria-busy={state === 'loading'}
  className={`tts-button tts-button--${state}`}
>
  {getButtonIcon()}
</button>

{error && (
  <span className="tts-error" role="alert" aria-live="polite">
    {error.message}
  </span>
)}
```

**Design Decisions**:
- Single button with state-dependent behavior (toggle play/stop)
- Icon-only button (compact, visual)
- Error message below button (optional, can be tooltip)
- Disabled during loading prevents double-clicks
- Accessible labels and ARIA attributes

#### 5. TTSButton Styles (`frontend/src/components/TTSButton.css`)
**Purpose**: Styling for TTS button component.

**Key Styles**:
```css
.tts-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tts-button:hover:not(:disabled) {
  background-color: rgba(0, 0, 0, 0.05);
}

.tts-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.tts-button--idle {
  color: #6b7280;
}

.tts-button--loading {
  color: #3b82f6;
}

.tts-button--playing {
  color: #22c55e;
}

.tts-button--error {
  color: #ef4444;
}

.tts-button svg {
  width: 20px;
  height: 20px;
}

.tts-error {
  display: block;
  font-size: 11px;
  color: #ef4444;
  margin-top: 4px;
}

/* Loading spinner animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.tts-button--loading svg {
  animation: spin 1s linear infinite;
}
```

**Design Decisions**:
- Minimal styling, matches existing UI
- State-based colors (gray, blue, green, red)
- Hover effect for interactivity
- Spinner animation for loading state
- Small, compact button (20px icon)
- Error message below button (optional)

#### 6. Updated AssistantMessage Component
**Purpose**: Display assistant messages with TTS functionality.

**Modifications**:
```typescript
import TTSButton from './TTSButton';

interface AssistantMessageProps {
  // ... existing props
  content: string;
  // ... other props
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  content,
  // ... other props
}) => {
  return (
    <div className="assistant-message">
      <div className="assistant-message-header">
        {/* Character name */}
      </div>

      {/* Emotions display (if exists) */}

      <div className="assistant-message-content">
        {/* Message content with Markdown */}
      </div>

      <div className="assistant-message-footer">
        <span className="assistant-message-timestamp">
          {/* Timestamp */}
        </span>
        <TTSButton text={content} />
      </div>
    </div>
  );
};
```

**Design Decisions**:
- TTSButton placed in footer area (after timestamp)
- Pass raw content (not HTML) to TTSButton
- TTS button always rendered (handles its own error states)
- Minimal layout changes to existing component

### Implementation Recommendations

#### Phase 1: Implement TTS Types
**File**: `frontend/src/types/tts.ts`

```typescript
export interface TTSRequest {
  text: string;
}

export interface TTSResponse {
  audio_path: string;
}

export type TTSState = 'idle' | 'loading' | 'playing' | 'error';

export interface TTSError {
  type: 'network' | 'service' | 'timeout' | 'playback' | 'unknown';
  message: string;
}

export class TTSError extends Error {
  constructor(
    public type: TTSError['type'],
    message: string
  ) {
    super(message);
    this.name = 'TTSError';
  }
}
```

#### Phase 2: Implement TTSService
**File**: `frontend/src/services/ttsService.ts`

1. **Service Class**:
```typescript
import { TTSRequest, TTSResponse, TTSError } from '../types/tts';

export class TTSService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async synthesizeSpeech(text: string): Promise<string> {
    // TODO: Implementation
    pass;
  }

  private mapStatusToErrorType(status: number): TTSError['type'] {
    // TODO: Implementation
    pass;
  }

  private getErrorMessage(status: number): string {
    // TODO: Implementation
    pass;
  }

  private handleError(error: unknown): never {
    // TODO: Implementation
    pass;
  }
}

// Export singleton instance
export const ttsService = new TTSService();
```

2. **Error Handling Strategy**:
```typescript
async synthesizeSpeech(text: string): Promise<string> {
  try {
    const response = await fetch(`${this.baseUrl}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text } as TTSRequest)
    });

    if (!response.ok) {
      const errorType = this.mapStatusToErrorType(response.status);
      const message = this.getErrorMessage(response.status);
      throw new TTSError(errorType, message);
    }

    const data: TTSResponse = await response.json();
    return data.audio_path;
  } catch (error) {
    if (error instanceof TTSError) {
      throw error;
    }
    if (error instanceof TypeError) {
      throw new TTSError('network', 'Network error occurred');
    }
    throw new TTSError('unknown', 'An unexpected error occurred');
  }
}
```

#### Phase 3: Implement useTTS Hook
**File**: `frontend/src/hooks/useTTS.ts`

```typescript
import { useState, useRef, useCallback, useEffect } from 'react';
import { TTSState, TTSError } from '../types/tts';
import { ttsService } from '../services/ttsService';

export interface UseTTSReturn {
  state: TTSState;
  error: TTSError | null;
  synthesizeAndPlay: (text: string) => Promise<void>;
  stopAudio: () => void;
}

export const useTTS = (): UseTTSReturn => {
  const [state, setState] = useState<TTSState>('idle');
  const [error, setError] = useState<TTSError | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    // TODO: Implementation
    pass;
  }, []);

  const synthesizeAndPlay = useCallback(async (text: string) => {
    // TODO: Implementation
    pass;
  }, [stopAudio]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { state, error, synthesizeAndPlay, stopAudio };
};
```

**Key Implementation Details**:
```typescript
const synthesizeAndPlay = useCallback(async (text: string) => {
  try {
    // Stop any currently playing audio
    stopAudio();

    // Reset error state
    setError(null);
    setState('loading');

    // Synthesize speech
    const audioPath = await ttsService.synthesizeSpeech(text);

    // Create audio element
    const audio = new Audio(audioPath);
    audioRef.current = audio;

    // Set up event listeners
    audio.addEventListener('play', () => setState('playing'));
    audio.addEventListener('ended', () => {
      setState('idle');
      audioRef.current = null;
    });
    audio.addEventListener('error', () => {
      setState('error');
      setError(new TTSError('playback', 'Audio playback failed'));
    });

    // Start playback
    await audio.play();
  } catch (err) {
    if (err instanceof TTSError) {
      setError(err);
    } else {
      setError(new TTSError('unknown', 'An unexpected error occurred'));
    }
    setState('error');
  }
}, [stopAudio]);
```

#### Phase 4: Implement TTSButton Component
**File**: `frontend/src/components/TTSButton.tsx`

```typescript
import React from 'react';
import { useTTS } from '../hooks/useTTS';
import './TTSButton.css';

interface TTSButtonProps {
  text: string;
  disabled?: boolean;
}

export const TTSButton: React.FC<TTSButtonProps> = ({ text, disabled = false }) => {
  const { state, error, synthesizeAndPlay, stopAudio } = useTTS();

  const handleClick = () => {
    // TODO: Implementation
    pass;
  };

  const getButtonIcon = () => {
    // TODO: Implementation
    pass;
  };

  const getAriaLabel = (): string => {
    // TODO: Implementation
    pass;
  };

  const isButtonDisabled = state === 'loading' || disabled;

  return (
    <div className="tts-button-container">
      <button
        onClick={handleClick}
        disabled={isButtonDisabled}
        aria-label={getAriaLabel()}
        aria-busy={state === 'loading'}
        className={`tts-button tts-button--${state}`}
        data-testid="tts-button"
      >
        {getButtonIcon()}
      </button>
      {error && (
        <span className="tts-error" role="alert" aria-live="polite">
          {error.message}
        </span>
      )}
    </div>
  );
};

export default TTSButton;
```

**Icon Components** (use existing icon library or inline SVGs):
```typescript
const SpeakerIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    {/* Speaker icon SVG path */}
  </svg>
);

const SpinnerIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    {/* Spinner icon SVG path */}
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    {/* Pause icon SVG path */}
  </svg>
);

const ErrorIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    {/* Error icon SVG path */}
  </svg>
);
```

#### Phase 5: Update AssistantMessage Component
**File**: `frontend/src/components/AssistantMessage.tsx`

```typescript
import TTSButton from './TTSButton';

// Add to render method:
<div className="assistant-message-footer">
  <span className="assistant-message-timestamp">
    {formatTimestamp(created_at)}
  </span>
  <TTSButton text={content} />
</div>
```

Update CSS to position footer:
```css
.assistant-message-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  gap: 12px;
}

.assistant-message-timestamp {
  font-size: 12px;
  color: #9ca3af;
}
```

### Suggested Implementation Order

1. **TTS Types** (independent, foundational)
   - Create `tts.ts` with all type definitions
   - Ensure TTSError class extends Error
   - Export all types

2. **TTSService** (depends on types)
   - Implement HTTP request logic
   - Implement error mapping
   - Test with mock fetch

3. **useTTS Hook** (depends on TTSService)
   - Implement state management
   - Implement audio playback logic
   - Implement cleanup
   - Test with mock service and Audio API

4. **TTSButton Component** (depends on useTTS)
   - Implement button UI
   - Implement icon switching logic
   - Implement accessibility features
   - Test with mock hook

5. **Update AssistantMessage** (depends on TTSButton)
   - Import TTSButton
   - Add to component layout
   - Update styles
   - Test integration

6. **End-to-End Testing**
   - Test complete flow with backend
   - Test error scenarios
   - Test accessibility
   - Test on different browsers

### Testing Strategy

#### Unit Tests

**test_ttsService.test.ts**:
```typescript
import { TTSService } from '../ttsService';
import { TTSError } from '../../types/tts';

describe('TTSService', () => {
  let service: TTSService;

  beforeEach(() => {
    service = new TTSService();
    global.fetch = jest.fn();
  });

  it('should synthesize speech successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ audio_path: '/audio/test.ogg' })
    });

    const result = await service.synthesizeSpeech('Hello');
    expect(result).toBe('/audio/test.ogg');
  });

  it('should throw TTSError on 503 service unavailable', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503
    });

    await expect(service.synthesizeSpeech('Hello'))
      .rejects
      .toThrow(TTSError);
  });

  // More tests...
});
```

**test_useTTS.test.ts**:
```typescript
import { renderHook, act } from '@testing-library/react';
import { useTTS } from '../useTTS';
import { ttsService } from '../../services/ttsService';

jest.mock('../../services/ttsService');

describe('useTTS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start in idle state', () => {
    const { result } = renderHook(() => useTTS());
    expect(result.current.state).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  it('should transition to loading state during synthesis', async () => {
    const { result } = renderHook(() => useTTS());

    (ttsService.synthesizeSpeech as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve('/audio/test.ogg'), 100))
    );

    act(() => {
      result.current.synthesizeAndPlay('Hello');
    });

    expect(result.current.state).toBe('loading');
  });

  // More tests...
});
```

**test_TTSButton.test.tsx**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TTSButton } from '../TTSButton';
import { useTTS } from '../../hooks/useTTS';

jest.mock('../../hooks/useTTS');

describe('TTSButton', () => {
  const mockUseTTS = {
    state: 'idle' as const,
    error: null,
    synthesizeAndPlay: jest.fn(),
    stopAudio: jest.fn()
  };

  beforeEach(() => {
    (useTTS as jest.Mock).mockReturnValue(mockUseTTS);
  });

  it('should render button in idle state', () => {
    render(<TTSButton text="Hello" />);
    const button = screen.getByTestId('tts-button');
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('should call synthesizeAndPlay on click', () => {
    render(<TTSButton text="Hello" />);
    const button = screen.getByTestId('tts-button');
    fireEvent.click(button);
    expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith('Hello');
  });

  it('should be disabled in loading state', () => {
    (useTTS as jest.Mock).mockReturnValue({
      ...mockUseTTS,
      state: 'loading'
    });

    render(<TTSButton text="Hello" />);
    const button = screen.getByTestId('tts-button');
    expect(button).toBeDisabled();
  });

  // More tests...
});
```

#### Integration Tests

**TTS.integration.test.tsx**:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssistantMessage } from '../../components/AssistantMessage';

describe('TTS Integration', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    global.Audio = jest.fn().mockImplementation(() => ({
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }));
  });

  it('should complete full TTS flow', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ audio_path: '/audio/test.ogg' })
    });

    render(
      <AssistantMessage
        content="Hello world"
        characterName="Test Character"
        created_at={new Date().toISOString()}
      />
    );

    const button = screen.getByTestId('tts-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/tts',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ text: 'Hello world' })
        })
      );
    });

    await waitFor(() => {
      expect(global.Audio).toHaveBeenCalledWith('/audio/test.ogg');
    });
  });

  // More integration tests...
});
```

### Considerations

#### Edge Cases
1. **Empty text**: Should be prevented by validation (but handle gracefully)
2. **Very long text**: Backend handles max length, frontend shows error
3. **Special characters**: Should pass through unchanged
4. **Network offline**: Catch and show "Network error"
5. **Audio format not supported**: Catch playback error
6. **Autoplay blocked by browser**: Catch and show message
7. **Multiple rapid clicks**: Disable button during loading
8. **Component unmount during synthesis**: Cleanup in useEffect

#### Performance Notes
1. **Long synthesis time (300s)**: Show clear loading indicator
2. **Audio file caching**: Browser handles automatically
3. **Memory management**: Clean up Audio objects properly
4. **Concurrent playback**: Stop previous audio when starting new
5. **React re-renders**: Use useCallback and useMemo where appropriate

#### Accessibility Notes
1. **Keyboard navigation**: Button accessible via Tab
2. **Screen readers**: Clear aria-labels for all states
3. **Focus management**: Maintain focus on button after click
4. **Error announcements**: Use aria-live for errors
5. **Loading announcements**: Use aria-busy during synthesis
6. **Color independence**: Use icons, not just colors

#### Browser Compatibility
1. **Audio API**: Supported in all modern browsers
2. **OGG format**: Supported in Chrome, Firefox, Edge (not Safari)
   - Consider MP3 fallback if Safari support needed
3. **Fetch API**: Supported in all modern browsers
4. **CSS animations**: Supported in all modern browsers

#### User Experience Enhancements
1. **Progress indicator**: Show elapsed time during long synthesis
2. **Cancel button**: Allow canceling during synthesis
3. **Keyboard shortcuts**: Space to play/pause
4. **Volume control**: Add volume slider
5. **Playback speed**: Add speed control (1x, 1.5x, 2x)
6. **Audio caching**: Remember recently synthesized audio
7. **Download button**: Allow downloading audio file

### Future Enhancements

1. **Advanced Audio Controls**:
   - Pause/resume (not just stop)
   - Seek bar (timeline)
   - Volume control
   - Playback speed control

2. **Progress Tracking**:
   - Show elapsed time during synthesis
   - Show estimated time remaining
   - Progress bar for long requests

3. **Cancellation Support**:
   - Cancel button during synthesis
   - AbortController for fetch requests

4. **Caching**:
   - Cache synthesized audio in memory
   - Reuse audio for repeated text
   - IndexedDB for persistent cache

5. **Batch Synthesis**:
   - Synthesize all messages button
   - Queue multiple TTS requests

6. **Audio Download**:
   - Download button next to play
   - Save audio file locally

7. **Voice Selection**:
   - Multiple voice options (if backend supports)
   - Voice settings per character

8. **Visual Feedback**:
   - Waveform animation during playback
   - Text highlighting during speech

### Required Libraries

**No new dependencies required**:
- `fetch` - Browser built-in
- `Audio` - Browser built-in
- React hooks - Already in project

### Data Flow Diagram

```
User clicks TTSButton
   ↓
useTTS.synthesizeAndPlay(text)
   ↓
TTSService.synthesizeSpeech(text)
   ↓
fetch POST /api/tts
   ↓
Backend TTS API
   ↓
Response: {audio_path: "/audio/abc.ogg"}
   ↓
TTSService returns audio_path
   ↓
useTTS creates Audio object
   ↓
Audio.play()
   ↓
Browser plays OGG file
   ↓
Audio 'ended' event
   ↓
useTTS sets state to 'idle'
   ↓
TTSButton updates UI
```

### Documentation Updates Needed

After implementation, update these files:

1. **frontend/src/README.md**
   - Document TTS feature
   - Usage examples
   - Accessibility notes

2. **llm_readme.md**
   - Add TTS components to module list
   - Document data flow for TTS
   - Note browser compatibility

3. **User Documentation**
   - How to use TTS feature
   - Troubleshooting common issues
   - Browser requirements
