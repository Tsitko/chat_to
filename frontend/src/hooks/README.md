# Frontend Hooks - Folder Level README

## Overview

This folder contains custom React hooks for the chat application. Hooks encapsulate reusable stateful logic and side effects.

## File Map

- `useIndexingStatus.ts` - Custom hook for polling book indexing status
- `useAudioRecorder.ts` - Custom hook for audio recording with microphone
- `useTTS.ts` - Custom hook for text-to-speech synthesis and playback

## Key Hooks

### useIndexingStatus Hook

**Purpose:** Automatically polls the indexing status API for a character's books

**Features:**
- Configurable polling interval (default: 2000ms)
- Automatic start/stop of polling
- Stops polling when all books complete or fail
- Manual refetch capability
- Error handling
- Can be disabled via `enabled` prop

**Entities:**
- UseIndexingStatusOptions: Configuration interface
- UseIndexingStatusReturn: Return value interface
- IndexingStatusResponse: API response type

**Input:**
- characterId: string - ID of character to monitor
- pollingInterval?: number - Polling frequency in ms (default: 2000)
- enabled?: boolean - Whether to enable polling (default: true)

**Output:**
- status: IndexingStatusResponse | null - Current indexing status
- isIndexing: boolean - Whether any book is currently indexing
- isLoading: boolean - Initial load state
- error: string | null - Error message if any
- refetch: () => Promise<void> - Manual refresh function

**Dependencies:**
- React (useState, useEffect, useCallback, useRef)
- services/api.ts (apiService.getIndexingStatus)
- types/indexing.ts (IndexingStatusResponse)

### useAudioRecorder Hook

**Purpose:** Manages audio recording from microphone using MediaRecorder API

**Features:**
- Start/stop recording with proper cleanup
- Automatic microphone stream management
- Error handling with proper resource cleanup
- Returns audio as Blob for upload
- Prevents resource leaks on multiple recordings

**Entities:**
- RecordingState: 'idle' | 'recording' | 'paused'
- UseAudioRecorderReturn: Return value interface

**Input:** None (hook manages state internally)

**Output:**
- startRecording: () => Promise<void> - Start recording
- stopRecording: () => Promise<Blob | null> - Stop and get audio
- pauseRecording: () => void - Pause recording
- resumeRecording: () => void - Resume recording
- recordingState: RecordingState - Current state
- error: string | null - Error message if any

**Dependencies:**
- React (useState, useRef, useCallback)
- Browser MediaRecorder API
- services/sttService.ts (for transcription)

**Recent Fixes (2025-12-18):**
- Fixed microphone stream cleanup to prevent "Network error" on second recording
- Added cleanup in error path of stopRecording
- Added pre-start cleanup in startRecording
- Added comprehensive error cleanup in catch blocks

### useTTS Hook

**Purpose:** Manages text-to-speech synthesis and audio playback with caching

**Features:**
- Synthesize text to speech via backend API
- Play generated audio files
- Cache audio paths to prevent re-generation
- Automatic audio element management
- Error handling

**Entities:**
- UseTTSReturn: Return value interface
- TTSState: 'idle' | 'loading' | 'playing'

**Input:** None (hook manages state internally)

**Output:**
- synthesizeAndPlay: (text: string) => Promise<void> - Synthesize and play
- stop: () => void - Stop playback
- state: TTSState - Current state
- error: string | null - Error message if any

**Dependencies:**
- React (useState, useRef, useCallback)
- services/ttsService.ts (ttsService.synthesizeText)
- Browser Audio API

**Recent Fixes (2025-12-18):**
- Added global audioCache Map to prevent re-generation on repeat playback
- Checks cache before calling TTS service
- Exports clearAudioCache() for test isolation
- Cache persists across component remounts

## Interface Signatures

```typescript
interface UseIndexingStatusOptions {
  characterId: string;
  pollingInterval?: number;
  enabled?: boolean;
}

interface UseIndexingStatusReturn {
  status: IndexingStatusResponse | null;
  isIndexing: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useIndexingStatus = (
  characterId: string,
  pollingInterval?: number,
  enabled?: boolean
): UseIndexingStatusReturn
```

## Data Flow

### useIndexingStatus Hook Flow

```
Hook Initialization
├─ Initialize state (status, isLoading, error)
├─ Create fetchStatus function
│   ├─ Set isLoading = true
│   ├─ Call apiService.getIndexingStatus(characterId)
│   ├─ On success:
│   │   ├─ Update status state
│   │   ├─ Set isLoading = false
│   │   └─ Calculate isIndexing flag
│   └─ On error:
│       ├─ Set error state
│       └─ Set isLoading = false
├─ useEffect: Polling logic
│   ├─ If !enabled: Skip
│   ├─ Call fetchStatus immediately
│   ├─ Set up setInterval
│   │   ├─ Call fetchStatus every pollingInterval ms
│   │   └─ Check if should stop polling
│   │       └─ If all books completed/failed: clearInterval
│   └─ Cleanup: clearInterval on unmount
└─ Return { status, isIndexing, isLoading, error, refetch }
```

### Polling Decision Logic

```
Should Continue Polling?
├─ If enabled === false → Stop
├─ If no status data → Continue
├─ If status.overall_status === 'completed' → Stop
├─ If status.overall_status === 'failed' → Stop
├─ If any book has status 'indexing' or 'pending' → Continue
└─ Otherwise → Stop
```

## Control Flow

### Hook Execution Flow

```
useIndexingStatus Hook
├─ Component mounts
│   └─ Hook initializes with characterId
├─ First useEffect run
│   ├─ Call fetchStatus() immediately
│   │   ├─ GET /api/characters/{characterId}/indexing-status
│   │   └─ Update status state
│   └─ Start polling interval
│       └─ Call fetchStatus() every pollingInterval ms
├─ Status updates
│   ├─ Component re-renders with new status
│   └─ IndexingStatusDisplay updates UI
├─ Polling continues until:
│   ├─ All books complete/fail → Stop polling
│   ├─ enabled prop becomes false → Stop polling
│   ├─ characterId changes → Restart polling for new character
│   └─ Component unmounts → Cleanup interval
└─ Component unmounts
    └─ Cleanup: clearInterval
```

### State Transitions

```
Initial State
└─ { status: null, isIndexing: false, isLoading: true, error: null }

First Fetch
├─ Success:
│   └─ { status: data, isIndexing: true, isLoading: false, error: null }
└─ Error:
    └─ { status: null, isIndexing: false, isLoading: false, error: message }

Subsequent Polls
├─ Books indexing:
│   └─ { status: updated, isIndexing: true, isLoading: false, error: null }
├─ Books complete:
│   └─ { status: updated, isIndexing: false, isLoading: false, error: null }
│   └─ Polling stops
└─ Network error:
    └─ { status: last_known, isIndexing: last_state, isLoading: false, error: message }
    └─ Polling continues (retries)
```

## Common Edit Patterns

### Using the hook in a component

```typescript
import { useIndexingStatus } from '../hooks/useIndexingStatus';

const MyComponent: React.FC<{ characterId: string }> = ({ characterId }) => {
  const { status, isIndexing, isLoading, error, refetch } = useIndexingStatus(
    characterId,
    2000,  // poll every 2 seconds
    true   // enabled
  );

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage error={error} />;
  if (!isIndexing) return null; // Hide when not indexing

  return (
    <div>
      {status?.books_indexing.map(book => (
        <ProgressBar
          key={book.book_id}
          progress={book.progress}
          status={book.status}
          label={`Indexing ${book.book_id}...`}
        />
      ))}
    </div>
  );
};
```

### Controlling polling with enabled prop

```typescript
// Only poll when character is selected and modal is open
const { status, isIndexing } = useIndexingStatus(
  characterId,
  2000,
  isModalOpen && !!characterId  // Only poll when needed
);
```

### Manual refetch

```typescript
const { status, refetch } = useIndexingStatus(characterId);

// User clicks refresh button
const handleRefresh = async () => {
  await refetch();
  showToast('Status updated');
};
```

### Adjusting poll frequency based on status

```typescript
// Poll more frequently when actively indexing
const pollingInterval = isIndexing ? 1000 : 5000;

const { status, isIndexing } = useIndexingStatus(
  characterId,
  pollingInterval,
  true
);
```

## Implementation Details

### State Management
- Uses useState for status, loading, and error states
- Uses useRef to track interval ID for cleanup
- Uses useCallback for memoized refetch function

### Side Effects
- useEffect with dependencies: [characterId, pollingInterval, enabled]
- Effect restarts when characterId changes (new character selected)
- Effect restarts when enabled changes (modal opens/closes)
- Cleanup function clears interval on unmount

### Error Handling
- Network errors: Set error state, keep last known status, continue polling
- API errors: Set error state, display to user, continue polling
- No error propagation: Hook handles all errors internally

### Performance Optimizations
- Stops polling when no active indexing
- Cleans up interval on unmount
- Uses useCallback to prevent unnecessary refetch recreations
- Conditional polling based on enabled prop

## Testing Strategy

### Unit Tests

```typescript
// Test initial fetch
test('fetches status on mount', async () => {
  const { result } = renderHook(() => useIndexingStatus('char-1'));
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.status).toBeDefined();
});

// Test polling
test('polls at specified interval', async () => {
  jest.useFakeTimers();
  const { result } = renderHook(() => useIndexingStatus('char-1', 1000));

  jest.advanceTimersByTime(1000);
  await waitFor(() => expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(2));
});

// Test stop polling when complete
test('stops polling when all books complete', async () => {
  mockApiResponse({ overall_status: 'completed' });
  const { result } = renderHook(() => useIndexingStatus('char-1'));

  await waitFor(() => expect(result.current.isIndexing).toBe(false));
  // Verify no more calls after completion
});

// Test refetch
test('refetch manually updates status', async () => {
  const { result } = renderHook(() => useIndexingStatus('char-1'));
  await result.current.refetch();
  expect(apiService.getIndexingStatus).toHaveBeenCalled();
});

// Test cleanup
test('clears interval on unmount', () => {
  const { unmount } = renderHook(() => useIndexingStatus('char-1'));
  unmount();
  // Verify interval cleared
});
```

## Dependencies

### Hook Dependencies
```
useIndexingStatus
├─ React hooks (useState, useEffect, useCallback, useRef)
├─ apiService.getIndexingStatus
└─ types/indexing (IndexingStatusResponse)
```

### Used By
```
useIndexingStatus
└─ IndexingStatusDisplay component
```

## API Requirements

### Required Endpoint
```
GET /api/characters/{character_id}/indexing-status
```

### Expected Response
```typescript
interface IndexingStatusResponse {
  books_indexing: Array<{
    book_id: string;
    status: 'pending' | 'indexing' | 'completed' | 'failed';
    progress: number; // 0-100
  }>;
  overall_status: 'pending' | 'indexing' | 'completed' | 'failed';
}
```

## Edge Cases

1. **Rapid character switching**
   - Hook cleans up old interval
   - Starts new polling for new character
   - No memory leaks

2. **API errors during polling**
   - Error state set
   - Polling continues (retries)
   - Last known status maintained

3. **Very long indexing operations**
   - Polling continues indefinitely until complete
   - Consider adding max duration or user cancellation

4. **Component unmounts during fetch**
   - Cleanup function clears interval
   - No state updates on unmounted component

5. **Enabled prop changes during polling**
   - Interval stopped if disabled
   - Interval started if enabled

## Notes

- Polling is more straightforward than WebSockets for this use case
- Consider WebSockets for production if many concurrent users
- Polling interval should balance responsiveness vs server load
- Hook is fully self-contained and reusable
- No external dependencies except API service

---

## Group Message Management Hooks

### useGroupMessages Hook

**Purpose:** Manage lifecycle of group messages with backend persistence support

**Features:**
- Load message history from backend on mount
- Merge loaded messages with existing store messages
- Automatic deduplication to prevent duplicates
- Pagination support for large histories
- Auto-load on group ID change
- Manual reload capability
- Proper error handling and loading states

**Entities:**
- UseGroupMessagesOptions: Configuration interface
- UseGroupMessagesReturn: Return value interface
- GroupMessage: Message type (from types/group.ts)

**Input:**
- groupId: string | null - ID of the group to manage
- options?: UseGroupMessagesOptions - Configuration
  - pageSize?: number - Messages per page (default: 50)
  - autoLoad?: boolean - Auto-load on mount (default: true)
  - enablePagination?: boolean - Enable pagination (default: false)

**Output:**
- messages: GroupMessage[] - Messages for current group
- isLoadingMessages: boolean - Loading state for fetch
- isSending: boolean - Loading state for send
- error: string | null - Error message if any
- hasMore: boolean - Whether more messages exist (pagination)
- loadMore: () => Promise<void> - Load next page
- reloadMessages: () => Promise<void> - Reload from scratch
- clearMessages: () => void - Clear messages from store

**Dependencies:**
- React (useState, useEffect, useCallback)
- store/groupMessageStore (useGroupMessageStore)
- types/group (GroupMessage)

**Usage:**
```typescript
const { messages, isLoadingMessages, reloadMessages } = useGroupMessages(groupId, {
  pageSize: 50,
  autoLoad: true,
  enablePagination: false
});
```

**Key Features:**
- **Auto-load:** Loads messages when groupId changes
- **Deduplication:** Handled by enhanced store
- **Pagination:** Optional, supports "Load More" pattern
- **Error handling:** Graceful error states with retry

---

### useGroupTTS Hook

**Purpose:** Manage sequential TTS playback for multiple character responses in group chats

**Features:**
- Sequential playback of all assistant messages
- Playlist management (track current position)
- Play/pause/skip controls
- Auto-play next message when current finishes
- Individual message playback support
- Reuses existing useTTS infrastructure
- Error handling and recovery

**Entities:**
- PlaylistItem: Internal playlist entry
- UseGroupTTSReturn: Return value interface
- GroupMessage: Message type (from types/group.ts)

**Input:** None (hook manages state internally)

**Output:**
- state: TTSState - Current state (idle | loading | playing | error)
- error: TTSError | null - Error if playback failed
- currentMessageId: string | null - ID of currently playing message
- currentIndex: number - Position in playlist (0-based)
- totalMessages: number - Total messages in playlist
- hasNext: boolean - Whether next message exists
- hasPrevious: boolean - Whether previous message exists
- playMessage: (messageId, text, characterName?) => Promise<void> - Play single message
- playAllResponses: (messages: GroupMessage[]) => Promise<void> - Play all assistant messages
- stopPlayback: () => void - Stop and clear playlist
- playNext: () => Promise<void> - Skip to next
- playPrevious: () => Promise<void> - Skip to previous
- pause: () => void - Pause current playback
- resume: () => Promise<void> - Resume from current position

**Dependencies:**
- React (useState, useCallback, useEffect)
- hooks/useTTS (useTTS hook)
- types/tts (TTSState, TTSError)
- types/group (GroupMessage)

**Usage:**
```typescript
const {
  state,
  currentMessageId,
  playAllResponses,
  stopPlayback,
  playNext,
  playPrevious
} = useGroupTTS();

// Play all responses
await playAllResponses(groupMessages);

// Navigation
await playNext();
await playPrevious();
```

**Auto-Play Logic:**
```typescript
// Automatically plays next message when current finishes
useEffect(() => {
  if (state === 'idle' && !isPaused && hasNext && currentIndex >= 0) {
    playNext();
  }
}, [state, isPaused, hasNext, currentIndex]);
```

**Playlist Structure:**
```typescript
interface PlaylistItem {
  messageId: string;
  text: string;
  characterName?: string;
}
```

**State Machine:**
```
idle → loading → playing → idle (auto-play next if available)
  ↓                ↓
error ← ─── ─── ←─┘
```

---

## Interface Signatures (Group Hooks)

```typescript
// useGroupMessages
interface UseGroupMessagesOptions {
  pageSize?: number;          // Default: 50
  autoLoad?: boolean;         // Default: true
  enablePagination?: boolean; // Default: false
}

interface UseGroupMessagesReturn {
  messages: GroupMessage[];
  isLoadingMessages: boolean;
  isSending: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  reloadMessages: () => Promise<void>;
  clearMessages: () => void;
}

export const useGroupMessages = (
  groupId: string | null,
  options?: UseGroupMessagesOptions
): UseGroupMessagesReturn

// useGroupTTS
interface UseGroupTTSReturn {
  state: TTSState;
  error: TTSError | null;
  currentMessageId: string | null;
  currentIndex: number;
  totalMessages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  playMessage: (messageId: string, text: string, characterName?: string) => Promise<void>;
  playAllResponses: (messages: GroupMessage[]) => Promise<void>;
  stopPlayback: () => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  pause: () => void;
  resume: () => Promise<void>;
}

export const useGroupTTS = (): UseGroupTTSReturn
```

---

## Data Flow (Group Hooks)

### useGroupMessages Flow

```
Hook Initialization
├─ Extract groupId and options
├─ Connect to groupMessageStore
├─ Initialize pagination state (offset, hasMore)
└─ Set up auto-load effect

Auto-Load Effect (when groupId changes)
├─ If autoLoad && groupId exists
│   └─ Call reloadMessages()
│       ├─ Reset offset to 0
│       ├─ Call fetchGroupMessages(groupId, pageSize, 0)
│       │   ├─ GET /api/groups/{groupId}/messages?limit=50&offset=0
│       │   ├─ Store merges with existing messages
│       │   └─ Deduplication happens in store
│       └─ Update hasMore flag
└─ Return loading state

Load More (pagination)
├─ User clicks "Load More" button
├─ Call loadMore()
│   ├─ Increment offset by pageSize
│   ├─ Call fetchGroupMessages(groupId, pageSize, newOffset)
│   │   └─ Append results to existing messages
│   └─ Update hasMore flag
└─ Component re-renders with more messages

Reload Messages
├─ User pulls to refresh or manual trigger
├─ Call reloadMessages()
│   ├─ Reset offset to 0
│   ├─ Call fetchGroupMessages with offset=0
│   └─ Replace messages in store
└─ Component shows refreshed messages
```

### useGroupTTS Flow

```
Hook Initialization
├─ Initialize useTTS hook (for audio playback)
├─ Initialize playlist state
├─ Initialize currentIndex state
└─ Set up auto-play effect

Play All Responses
├─ User clicks "Play All" button
├─ Call playAllResponses(messages)
│   ├─ Filter messages: only role='assistant'
│   ├─ Create playlist: map to PlaylistItems
│   ├─ Set currentIndex = 0
│   ├─ Call synthesizeAndPlay(playlist[0].text)
│   │   ├─ Check audio cache
│   │   ├─ Synthesize if not cached
│   │   ├─ Create Audio element
│   │   └─ Play audio
│   └─ State: idle → loading → playing
└─ Auto-play effect triggers when current finishes

Auto-Play Next Effect
├─ Watch: state, isPaused, hasNext, currentIndex
├─ When state becomes 'idle'
│   └─ If !isPaused && hasNext && currentIndex >= 0
│       └─ Call playNext()
│           ├─ Increment currentIndex
│           ├─ Synthesize and play next message
│           └─ State: idle → loading → playing
└─ Continues until no more messages

Manual Navigation
├─ User clicks "Next" button
│   └─ Call playNext() (skips current)
├─ User clicks "Previous" button
│   └─ Call playPrevious() (goes back)
└─ User clicks "Stop"
    └─ Call stopPlayback()
        ├─ Stop audio
        ├─ Clear playlist
        └─ Reset state
```

---

## Common Edit Patterns (Group Hooks)

### Using useGroupMessages in a component

```typescript
import { useGroupMessages } from '../hooks/useGroupMessages';

const GroupChatWindow = ({ groupId }) => {
  const {
    messages,
    isLoadingMessages,
    error,
    reloadMessages
  } = useGroupMessages(groupId, {
    autoLoad: true,
    pageSize: 50
  });

  if (isLoadingMessages) return <Loader />;
  if (error) return <ErrorMessage error={error} />;
  if (messages.length === 0) return <EmptyState />;

  return (
    <div>
      {messages.map(msg => (
        <Message key={msg.id} message={msg} />
      ))}
    </div>
  );
};
```

### Using useGroupMessages with pagination

```typescript
const GroupChatWindow = ({ groupId }) => {
  const {
    messages,
    isLoadingMessages,
    hasMore,
    loadMore
  } = useGroupMessages(groupId, {
    enablePagination: true,
    pageSize: 30
  });

  return (
    <div>
      {hasMore && (
        <button onClick={loadMore} disabled={isLoadingMessages}>
          Load More
        </button>
      )}
      {messages.map(msg => <Message key={msg.id} message={msg} />)}
    </div>
  );
};
```

### Using useGroupTTS for sequential playback

```typescript
import { useGroupTTS } from '../hooks/useGroupTTS';

const GroupTTSControls = ({ messages }) => {
  const {
    state,
    currentMessageId,
    currentIndex,
    totalMessages,
    playAllResponses,
    stopPlayback,
    playNext,
    playPrevious
  } = useGroupTTS();

  return (
    <div>
      <button onClick={() => playAllResponses(messages)}>
        {state === 'playing' ? 'Stop All' : 'Play All'}
      </button>
      <button onClick={playPrevious} disabled={!hasPrevious}>
        Previous
      </button>
      <button onClick={playNext} disabled={!hasNext}>
        Next
      </button>
      {state === 'playing' && (
        <span>Playing: {currentIndex + 1} of {totalMessages}</span>
      )}
    </div>
  );
};
```

### Using useGroupTTS for individual message playback

```typescript
const MessageTTSButton = ({ messageId, text, characterName }) => {
  const { playMessage, currentMessageId, state } = useGroupTTS();

  const isPlaying = currentMessageId === messageId && state === 'playing';

  return (
    <button onClick={() => playMessage(messageId, text, characterName)}>
      {isPlaying ? 'Stop' : 'Play'}
    </button>
  );
};
```

---

## Testing Strategy (Group Hooks)

### useGroupMessages Tests

```typescript
// Test auto-load on mount
test('loads messages on mount when autoLoad=true', async () => {
  const { result } = renderHook(() => useGroupMessages('group-1', { autoLoad: true }));
  await waitFor(() => expect(result.current.isLoadingMessages).toBe(false));
  expect(result.current.messages.length).toBeGreaterThan(0);
});

// Test pagination
test('loads more messages on loadMore call', async () => {
  const { result } = renderHook(() => 
    useGroupMessages('group-1', { enablePagination: true, pageSize: 10 })
  );
  const initialCount = result.current.messages.length;
  
  await result.current.loadMore();
  
  expect(result.current.messages.length).toBeGreaterThan(initialCount);
});

// Test reload
test('reloads messages from scratch', async () => {
  const { result } = renderHook(() => useGroupMessages('group-1'));
  await result.current.reloadMessages();
  expect(apiService.getGroupMessages).toHaveBeenCalledWith('group-1', 50, 0);
});

// Test group change
test('clears messages when groupId changes', async () => {
  const { result, rerender } = renderHook(
    ({ id }) => useGroupMessages(id),
    { initialProps: { id: 'group-1' } }
  );
  
  rerender({ id: 'group-2' });
  
  await waitFor(() => expect(result.current.messages.length).toBe(0));
});
```

### useGroupTTS Tests

```typescript
// Test single message playback
test('plays single message', async () => {
  const { result } = renderHook(() => useGroupTTS());
  
  await result.current.playMessage('msg-1', 'Hello world', 'Hegel');
  
  expect(result.current.state).toBe('playing');
  expect(result.current.currentMessageId).toBe('msg-1');
});

// Test play all responses
test('plays all assistant messages sequentially', async () => {
  const messages = [
    { id: '1', role: 'user', content: 'Hi' },
    { id: '2', role: 'assistant', content: 'Hello', character_name: 'Hegel' },
    { id: '3', role: 'assistant', content: 'Greetings', character_name: 'Kant' },
  ];
  
  const { result } = renderHook(() => useGroupTTS());
  
  await result.current.playAllResponses(messages);
  
  expect(result.current.totalMessages).toBe(2); // Only assistant messages
  expect(result.current.currentIndex).toBe(0);
});

// Test auto-play next
test('auto-plays next message when current finishes', async () => {
  const { result } = renderHook(() => useGroupTTS());
  
  // Setup playlist with 2 messages
  await result.current.playAllResponses(assistantMessages);
  
  // Simulate audio ending
  act(() => {
    // Trigger state change to 'idle'
  });
  
  await waitFor(() => expect(result.current.currentIndex).toBe(1));
});

// Test stop playback
test('stops playback and clears playlist', () => {
  const { result } = renderHook(() => useGroupTTS());
  
  result.current.stopPlayback();
  
  expect(result.current.state).toBe('idle');
  expect(result.current.currentMessageId).toBeNull();
  expect(result.current.totalMessages).toBe(0);
});
```

---

## Edge Cases (Group Hooks)

### useGroupMessages Edge Cases

1. **Group ID changes during load:**
   - Hook cancels previous fetch
   - Starts new fetch for new group
   - No race conditions

2. **Pagination offset exceeds total:**
   - Backend returns empty array
   - hasMore becomes false
   - No errors shown

3. **Reload while sending message:**
   - Optimistic message preserved in store
   - Reload merges with existing
   - Deduplication prevents duplicates

4. **Empty group (no messages):**
   - Returns empty array
   - Shows "No messages yet" state
   - No errors

### useGroupTTS Edge Cases

1. **Playlist is empty:**
   - playAllResponses does nothing
   - Shows warning in console
   - No errors thrown

2. **Audio synthesis fails:**
   - State becomes 'error'
   - Auto-play stops (doesn't continue)
   - User can retry manually

3. **User switches groups during playback:**
   - Playback continues (not auto-stopped)
   - Recommendation: Call stopPlayback on group change

4. **Multiple instances of hook:**
   - Each instance has own playlist
   - Shared useTTS stops previous audio automatically
   - Last playback wins

---

## Notes

- useGroupMessages hook is the primary interface for components
- Store (groupMessageStoreEnhanced) handles deduplication logic
- useGroupTTS extends useTTS for multi-message scenarios
- TTS audio cache is shared globally (singleton pattern)
- Both hooks are fully self-contained and reusable
- No external dependencies except API service and TTS service

