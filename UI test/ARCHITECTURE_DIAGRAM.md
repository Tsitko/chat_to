# UI Improvements - Architecture Diagram

## Component Hierarchy

```
App
├── CharacterList
│   └── [Future] Loader (while fetching)
│
├── CharacterModal
│   ├── Modal (wrapper) ← NEW
│   │   ├── closeOnOverlayClick={false} ← FIX
│   │   └── preventCloseWhileLoading={true}
│   ├── CharacterForm
│   │   ├── [Future] Loader (inline in submit button)
│   │   └── IndexingStatusDisplay ← NEW
│   │       ├── useIndexingStatus hook ← NEW
│   │       └── ProgressBar[] ← NEW
│   └── [Future] Enhanced character store
│
├── ChatWindow
│   ├── Message[]
│   └── [Future] Loader (dots variant for typing)
│
└── MessageInput
    ├── Textarea
    └── Send Button
        └── [Future] Loader (inline variant)
```

## State Management Flow

```
User Action
    ↓
Component
    ↓
Enhanced Store
    ├── Set loading state: 'loading'
    ├── Call API service
    │   ↓
    │   API Request
    │   ↓
    │   Backend
    │   ↓
    │   API Response
    ├── Set loading state: 'success' or 'error'
    └── Update data state
    ↓
Component Re-renders
    ├── Show/hide Loader based on loading state
    └── Display result or error
```

## Indexing Status Polling Flow

```
Character Created/Books Added
    ↓
IndexingStatusDisplay Component Mounts
    ↓
useIndexingStatus Hook Initializes
    ├── Fetch initial status
    │   ↓
    │   GET /api/characters/{id}/indexing-status
    │   ↓
    │   Update status state
    ├── Start polling interval (every 2s)
    │   ├── Fetch status
    │   ├── Update UI
    │   └── Check if should stop
    │       ├── All books completed/failed? → Stop polling
    │       └── Still indexing? → Continue polling
    └── Component Unmounts → Cleanup interval
    ↓
ProgressBar Components Update
    ├── Show progress for each book
    ├── Animated stripes during indexing
    └── Status-based colors
```

## Modal Behavior Decision Tree

```
User Clicks Overlay
    ↓
    ┌─ closeOnOverlayClick prop ─┐
    │                             │
    ├─ true                       ├─ false
    │  ↓                          │  ↓
    │  Check isLoading            │  Do nothing (FIX)
    │  ↓                          │
    │  ┌─ preventCloseWhileLoading ─┐
    │  │                             │
    │  ├─ true & isLoading           ├─ false or !isLoading
    │  │  ↓                          │  ↓
    │  │  Do nothing                 │  Call onClose()
    │  │                             │
    │  └─────────────────────────────┘
    │
    └───────────────────────────────┘
```

## Loader Variants Usage Map

```
Application Contexts
├── Buttons
│   └── Loader variant="inline" size="sm"
│       └── Create, Update, Delete, Send buttons
│
├── Full Screen Operations
│   └── Loader variant="overlay" text="..."
│       └── Initial app load, heavy operations
│
├── Chat Typing Indicator
│   └── Loader variant="dots" size="md"
│       └── When LLM is generating response
│
├── Section Loading
│   └── Loader variant="spinner" size="md"
│       └── Loading character list, messages
│
└── Progress Tracking
    └── ProgressBar with status
        └── Book indexing operations
```

## Enhanced Store Structure

```
characterStoreEnhanced
├── characters: Character[]
├── selectedCharacterId: string | null
├── selectedCharacter: Character | undefined
├── loadingStates
│   ├── fetchAll: { state, error? }
│   ├── create: { state, error? }
│   ├── update: { state, error? }
│   └── delete: { state, error? }
├── operatingCharacterId: string | null
└── Actions
    ├── fetchCharacters()
    ├── createCharacter()
    ├── updateCharacter()
    ├── deleteCharacter()
    ├── isOperationLoading()
    └── clearError()

messageStoreEnhanced
├── messages: Record<characterId, Message[]>
├── loadingStates: Record<characterId, MessageLoadingStates>
│   └── [characterId]
│       ├── fetch: { state, error? }
│       └── send: { state, error? }
└── Actions
    ├── fetchMessages()
    ├── sendMessage()
    ├── getLoadingState()
    ├── isLoading()
    └── clearError()
```

## File Dependencies Graph

```
Types Layer
├── types/loading.ts (NEW)
├── types/character.ts
├── types/message.ts
└── types/indexing.ts

Component Layer
├── components/Loader.tsx (NEW)
│   └── Loader.css (NEW)
├── components/ProgressBar.tsx (NEW)
│   ├── ProgressBar.css (NEW)
│   └── types/indexing.ts
├── components/Modal.tsx (NEW)
│   └── Modal.css (NEW)
├── components/IndexingStatusDisplay.tsx (NEW)
│   ├── ProgressBar.tsx
│   └── hooks/useIndexingStatus.ts
├── components/CharacterModal.tsx
│   ├── Modal.tsx (future)
│   ├── IndexingStatusDisplay.tsx (future)
│   └── store/characterStoreEnhanced.ts (future)
├── components/ChatWindow.tsx
│   ├── Loader.tsx (future)
│   └── store/messageStoreEnhanced.ts (future)
├── components/MessageInput.tsx
│   ├── Loader.tsx (future)
│   └── store/messageStoreEnhanced.ts (future)
└── components/CharacterList.tsx
    ├── Loader.tsx (future)
    └── store/characterStoreEnhanced.ts (future)

Hooks Layer
└── hooks/useIndexingStatus.ts (NEW)
    ├── services/api.ts
    └── types/indexing.ts

Store Layer
├── store/characterStoreEnhanced.ts (NEW)
│   ├── types/character.ts
│   ├── types/loading.ts
│   └── services/api.ts
├── store/messageStoreEnhanced.ts (NEW)
│   ├── types/message.ts
│   ├── types/loading.ts
│   └── services/api.ts
├── store/characterStore.ts (existing)
└── store/messageStore.ts (existing)

Service Layer
└── services/api.ts
    └── [needs] getIndexingStatus() method

Style Layer
├── AppEnhanced.css (NEW)
├── Loader.css (NEW)
├── ProgressBar.css (NEW)
├── Modal.css (NEW)
└── App.css (existing)
```

## Data Flow Sequence Diagrams

### Create Character Flow

```
User                CharacterModal          Modal           CharacterStore          API             Backend
  |                      |                    |                   |                  |                |
  | Fill form            |                    |                   |                  |                |
  |--------------------->|                    |                   |                  |                |
  |                      |                    |                   |                  |                |
  | Click Create         |                    |                   |                  |                |
  |--------------------->|                    |                   |                  |                |
  |                      | createCharacter()  |                   |                  |                |
  |                      |----------------------------------->|                  |                |
  |                      |                    |                   | set loading      |                |
  |                      |                    |                   | state='loading'  |                |
  |                      |<-----------------------------------|                  |                |
  | Show inline loader   |                    | isLoading=true    |                  |                |
  |<---------------------|                    |                   |                  |                |
  |                      |                    |                   | POST /characters |                |
  |                      |                    |                   |----------------->|                |
  |                      |                    |                   |                  | create char    |
  |                      |                    |                   |                  |--------------->|
  |                      |                    |                   |                  | start indexing |
  |                      |                    |                   |                  |<---------------|
  |                      |                    |                   |<-----------------|                |
  |                      |                    |                   | set loading      |                |
  |                      |                    |                   | state='success'  |                |
  |                      |<-----------------------------------|                  |                |
  | Modal closes         |                    | onClose()         |                  |                |
  |<---------------------|                    |                   |                  |                |
  | List updates         |                    |                   |                  |                |
  |<---------------------|                    |                   |                  |                |
```

### Book Indexing Progress Flow

```
IndexingStatusDisplay    useIndexingStatus        API                Backend          ChromaDB
         |                       |                  |                    |                |
         | mount                 |                  |                    |                |
         |---------------------->|                  |                    |                |
         |                       | initial fetch    |                    |                |
         |                       |----------------->| GET indexing-status|                |
         |                       |                  |------------------->|                |
         |                       |                  |                    | check status   |
         |                       |                  |                    |--------------->|
         |                       |                  |<-------------------|                |
         |                       |<-----------------|                    |                |
         |<----------------------| status update    |                    |                |
         | render ProgressBars   |                  |                    |                |
         |                       |                  |                    |                |
         |                       | start interval   |                    |                |
         |                       | (every 2s)       |                    |                |
         |                       |                  |                    |                |
         |                       | poll             |                    |                |
         |                       |----------------->|                    |                |
         |                       |                  |------------------->|                |
         |                       |                  |<-------------------|                |
         |                       |<-----------------|                    |                |
         |<----------------------| status update    |                    |                |
         | update progress bars  |                  |                    |                |
         |                       |                  |                    |                |
         |                       | ... polling continues until complete  |                |
         |                       |                  |                    |                |
         |                       | poll             |                    |                |
         |                       |----------------->|                    |                |
         |                       |                  |------------------->|                |
         |                       |                  |<-------------------| status=completed|
         |                       |<-----------------|                    |                |
         |<----------------------| final update     |                    |                |
         | show completed state  |                  |                    |                |
         |                       | stop polling     |                    |                |
         |                       |                  |                    |                |
```

### Send Message Flow

```
User          MessageInput       MessageStore         API              Backend          LLM
  |                |                  |                 |                  |              |
  | Type message   |                  |                 |                  |              |
  |--------------->|                  |                 |                  |              |
  |                |                  |                 |                  |              |
  | Press Enter    |                  |                 |                  |              |
  |--------------->| sendMessage()    |                 |                  |              |
  |                |----------------->|                 |                  |              |
  |                |                  | set send.loading|                 |              |
  |                |<-----------------|                 |                  |              |
  | Show inline    |                  |                 |                  |              |
  | loader in btn  |                  |                 |                  |              |
  |<---------------|                  |                 |                  |              |
  | Disable input  |                  |                 |                  |              |
  |<---------------|                  | POST message    |                  |              |
  |                |                  |---------------->|                  |              |
  |                |                  |                 | save message     |              |
  |                |                  |                 |----------------->|              |
  |                |                  |                 | search KB        |              |
  |                |                  |                 |----------------->|              |
  |                |                  |                 |<-----------------|              |
  |                |                  |                 | generate response|              |
  |                |                  |                 |------------------------------>|
  |                |                  |                 |                  |              |
  |                | Show typing dots |                 |                  |              |
  |<---------------|                  |                 |                  |              |
  |                |                  |                 |<------------------------------|
  |                |                  |<----------------|                  |              |
  |                |<-----------------|                 |                  |              |
  | Hide loader    | set send.success|                 |                  |              |
  |<---------------|                  |                 |                  |              |
  | Show messages  |                  |                 |                  |              |
  |<---------------|                  |                 |                  |              |
  | Clear input    |                  |                 |                  |              |
  |<---------------|                  |                 |                  |              |
```

## CSS Architecture

```
Root Variables (AppEnhanced.css)
├── Colors
│   ├── --primary-color
│   ├── --primary-hover
│   ├── --success-color
│   ├── --danger-color
│   └── --warning-color
├── Shadows
│   ├── --shadow-sm
│   ├── --shadow-md
│   └── --shadow-lg
└── Transitions
    ├── --transition-fast
    └── --transition-normal

Component Styles
├── Loader.css
│   ├── .loader-spinner
│   ├── .loader-dots
│   ├── .loader-inline
│   ├── .loader-overlay
│   └── Animations
│       ├── @keyframes loader-spin
│       └── @keyframes loader-bounce
├── ProgressBar.css
│   ├── .progress-bar-container
│   ├── .progress-bar-fill
│   ├── Status variants
│   │   ├── .status-pending
│   │   ├── .status-indexing
│   │   ├── .status-completed
│   │   └── .status-failed
│   └── @keyframes progress-bar-stripes
├── Modal.css
│   ├── .modal-overlay-improved
│   ├── .modal-content-improved
│   ├── .modal-header
│   ├── .modal-close-button
│   └── Animations
│       ├── @keyframes modal-fade-in
│       └── @keyframes modal-slide-up
└── AppEnhanced.css
    ├── Enhanced button styles
    ├── Enhanced message styles
    ├── Typing indicator
    ├── Loading skeleton
    ├── Error/success messages
    └── Accessibility styles
```

## Testing Architecture

```
Unit Tests
├── Loader.test.tsx
│   ├── Renders all variants
│   ├── Applies correct sizes
│   ├── Shows text when provided
│   └── Has accessibility attributes
├── ProgressBar.test.tsx
│   ├── Shows correct progress
│   ├── Applies status styles
│   ├── Handles edge cases (0, 100, >100)
│   └── Shows percentage when enabled
├── Modal.test.tsx
│   ├── Opens and closes
│   ├── Respects closeOnOverlayClick
│   ├── Prevents close when loading
│   ├── Traps focus
│   └── Handles Escape key
├── IndexingStatusDisplay.test.tsx
│   ├── Polls status
│   ├── Shows progress bars
│   ├── Hides when not indexing
│   └── Handles errors
└── useIndexingStatus.test.ts
    ├── Fetches initial status
    ├── Polls at interval
    ├── Stops when complete
    ├── Handles errors
    └── Cleans up on unmount

Integration Tests
├── CharacterModal Integration
│   ├── Create with loading
│   ├── Update with loading
│   ├── Show indexing progress
│   └── Modal behavior
├── Chat Integration
│   ├── Send with loading
│   ├── Typing indicator
│   └── Error handling
└── Store Integration
    ├── Operations set loading states
    ├── Multiple operations
    └── Error states

E2E Tests
├── Create Character Flow
│   ├── Fill form
│   ├── See loading indicator
│   ├── See indexing progress
│   └── Modal closes when done
├── Chat Flow
│   ├── Send message
│   ├── See typing indicator
│   └── Receive response
└── Modal Behavior
    ├── Click outside (no close)
    ├── Press Escape (closes)
    └── Loading prevents close
```
