# Frontend Hooks - Folder Level README

## Overview

This folder contains custom React hooks for the chat application. Hooks encapsulate reusable stateful logic and side effects.

## File Map

- `useIndexingStatus.ts` - Custom hook for polling book indexing status

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
