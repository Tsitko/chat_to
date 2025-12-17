# Frontend Components - Folder Level README

## Overview

This folder contains all React components for the chat application UI. Components follow a single-responsibility principle with one component per file.

## File Map

### Existing Components (Current Implementation)
- `CharacterList.tsx` - Sidebar list of characters with selection
- `CharacterModal.tsx` - Modal for creating/editing characters with file uploads
- `ChatWindow.tsx` - Chat message history display with scrolling
- `MessageInput.tsx` - Message composition and sending interface
- `CharacterHeader.tsx` - Character info display in main area header

### New Components (UI Improvements)
- `Loader.tsx` - Reusable loading indicator with multiple variants
- `Loader.css` - Styles and animations for Loader component
- `ProgressBar.tsx` - Progress indicator for book indexing
- `ProgressBar.css` - Styles for ProgressBar with status-based colors
- `IndexingStatusDisplay.tsx` - Displays indexing progress for character books
- `Modal.tsx` - Improved modal wrapper preventing accidental closing
- `Modal.css` - Enhanced modal styles with animations
- `UserMessage.tsx` - User message bubble component with right alignment
- `UserMessage.css` - Styles for user messages with blue theme
- `AssistantMessage.tsx` - Assistant/character message bubble with Markdown support
- `AssistantMessage.css` - Styles for assistant messages with dark theme

### Test Files
- `__tests__/` - Component unit tests

## Key Components

### Loader Component

**Purpose:** Reusable loading indicator for all async operations

**Entities:**
- LoaderVariant: 'spinner' | 'dots' | 'inline' | 'overlay'
- LoaderSize: 'sm' | 'md' | 'lg'

**Input:**
- variant: Type of loader visualization
- size: Size of loader
- text: Optional loading text
- className: Additional CSS classes
- testId: Test identifier

**Output:** Loading indicator JSX element

**Dependencies:**
- React
- Loader.css

**Usage:**
```tsx
<Loader variant="spinner" size="md" text="Loading..." />
<Loader variant="inline" size="sm" /> // For buttons
<Loader variant="overlay" text="Creating character..." /> // Full screen
```

### ProgressBar Component

**Purpose:** Visual progress indicator for book indexing

**Entities:**
- progress: number (0-100)
- status: 'pending' | 'indexing' | 'completed' | 'failed'

**Input:**
- progress: Current progress percentage
- status: Indexing status
- label: Optional label text
- showPercentage: Whether to show percentage
- className: Additional CSS classes
- testId: Test identifier

**Output:** Progress bar JSX element

**Dependencies:**
- React
- types/indexing.ts (IndexingStatus type)
- ProgressBar.css

**Usage:**
```tsx
<ProgressBar
  progress={75}
  status="indexing"
  label="Indexing book.pdf..."
  showPercentage={true}
/>
```

### IndexingStatusDisplay Component

**Purpose:** Displays indexing status for all books of a character

**Entities:**
- Uses IndexingStatusResponse from types/indexing.ts

**Input:**
- characterId: ID of character to monitor
- className: Additional CSS classes
- testId: Test identifier

**Output:** List of progress bars for indexing books

**Dependencies:**
- React
- hooks/useIndexingStatus (custom polling hook)
- ProgressBar component

**Usage:**
```tsx
<IndexingStatusDisplay characterId={character.id} />
```

### Modal Component

**Purpose:** Improved modal wrapper preventing accidental closing

**Entities:**
- isOpen: boolean
- closeOnOverlayClick: boolean (default true)
- preventCloseWhileLoading: boolean

**Input:**
- isOpen: Whether modal is visible
- onClose: Close callback
- title: Optional modal title
- children: Modal content
- closeOnOverlayClick: Allow overlay click to close
- closeOnEscape: Allow Escape key to close
- showCloseButton: Show X button
- preventCloseWhileLoading: Prevent closing during operations
- isLoading: Current loading state
- className: Additional CSS classes
- testId: Test identifier

**Output:** Modal overlay and content JSX

**Dependencies:**
- React (useEffect, useRef)
- Modal.css

**Usage:**
```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Create Character"
  closeOnOverlayClick={false}
  preventCloseWhileLoading={true}
  isLoading={isCreating}
>
  <CharacterForm />
</Modal>
```

## Interface Signatures

### Loader
```typescript
interface LoaderProps {
  variant?: LoaderVariant;
  size?: LoaderSize;
  text?: string;
  className?: string;
  testId?: string;
}

export const Loader: React.FC<LoaderProps>
```

### ProgressBar
```typescript
interface ProgressBarProps {
  progress: number;
  status: IndexingStatus;
  label?: string;
  showPercentage?: boolean;
  className?: string;
  testId?: string;
}

export const ProgressBar: React.FC<ProgressBarProps>
```

### IndexingStatusDisplay
```typescript
interface IndexingStatusDisplayProps {
  characterId: string;
  className?: string;
  testId?: string;
}

export const IndexingStatusDisplay: React.FC<IndexingStatusDisplayProps>
```

### Modal
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventCloseWhileLoading?: boolean;
  isLoading?: boolean;
  className?: string;
  testId?: string;
}

export const Modal: React.FC<ModalProps>
```

### UserMessage Component

**Purpose:** Display user messages with right alignment and blue styling

**Entities:**
- content: string (message text)
- timestamp: string (ISO date string)
- messageId: string (unique identifier)

**Input:**
- content: Message content (plain text)
- timestamp: Message creation time
- messageId: Unique message identifier
- testId: Test identifier

**Output:** Right-aligned message bubble JSX

**Dependencies:**
- React
- UserMessage.css

**Usage:**
```tsx
<UserMessage
  content="What is the meaning of life?"
  timestamp="2025-12-17T18:00:00Z"
  messageId="msg-123"
/>
```

### AssistantMessage Component

**Purpose:** Display assistant/character messages with Markdown rendering

**Entities:**
- content: string (message with Markdown)
- characterName: string
- avatarUrl: string | null
- timestamp: string
- messageId: string

**Input:**
- content: Message content (Markdown supported)
- characterName: Name of character/assistant
- avatarUrl: Optional avatar image URL
- timestamp: Message creation time
- messageId: Unique message identifier
- testId: Test identifier

**Output:** Left-aligned message bubble with Markdown rendering

**Dependencies:**
- React
- react-markdown (Markdown rendering)
- remark-gfm (GitHub Flavored Markdown support)
- AssistantMessage.css

**Markdown Features:**
- Headers (H1-H6)
- Bold, italic, strikethrough
- Lists (ordered and unordered)
- Code blocks with syntax highlighting styles
- Inline code
- Links
- Tables (via remark-gfm)
- Blockquotes
- Horizontal rules

**Usage:**
```tsx
<AssistantMessage
  content="# Philosophy\n\nLife has **meaning** when:\n1. Purpose\n2. Love"
  characterName="Georg Wilhelm Friedrich Hegel"
  avatarUrl="/avatars/hegel.jpg"
  timestamp="2025-12-17T18:00:30Z"
  messageId="msg-124"
/>
```

## Data Flow

### Loading Indicators Flow
1. Component initiates async operation (create, update, send)
2. Enhanced store sets loading state to 'loading'
3. Component checks loading state via store
4. Component renders Loader with appropriate variant
5. Operation completes, store sets state to 'success' or 'error'
6. Component hides Loader, shows result

### Indexing Status Flow
1. User creates character or adds books
2. IndexingStatusDisplay component mounts
3. useIndexingStatus hook starts polling
4. Hook calls API every 2 seconds
5. ProgressBar components update with current progress
6. Polling stops when all books completed/failed
7. Component auto-hides when no active indexing

### Modal Behavior Flow
1. User opens modal (isOpen = true)
2. Modal component renders overlay and content
3. Focus trapped inside modal
4. User clicks overlay:
   - If closeOnOverlayClick=false: Nothing happens
   - If closeOnOverlayClick=true: onClose called
5. User presses Escape:
   - If closeOnEscape=true && !isLoading: onClose called
   - If isLoading && preventCloseWhileLoading: Nothing happens
6. Modal closes, focus returns to trigger element

## Control Flow

### Loader Component
```
Loader Component
├─ Determine variant (spinner, dots, inline, overlay)
├─ Apply size classes
├─ Render appropriate HTML structure
├─ Add accessibility attributes (aria-live, role)
└─ Display optional text
```

### ProgressBar Component
```
ProgressBar Component
├─ Validate progress (clamp 0-100)
├─ Calculate fill width percentage
├─ Apply status-based CSS class
├─ Render track and fill elements
├─ Show label if provided
├─ Show percentage if enabled
└─ Add animations for 'indexing' status
```

### IndexingStatusDisplay Component
```
IndexingStatusDisplay Component
├─ useIndexingStatus hook initialized
│   ├─ Start polling interval
│   ├─ Fetch status from API
│   ├─ Update state
│   └─ Stop when complete
├─ Check if any books indexing
├─ If no indexing: Hide component
├─ If indexing:
│   ├─ Map over books array
│   ├─ Render ProgressBar for each book
│   └─ Show overall status
└─ Handle loading/error states
```

### Modal Component
```
Modal Component
├─ If !isOpen: Return null
├─ Render overlay
│   ├─ onClick handler (conditional on closeOnOverlayClick)
│   └─ Conditional cursor style
├─ Render content
│   ├─ Stop propagation on click
│   ├─ Render header with title
│   ├─ Render close button if enabled
│   ├─ Render children
│   └─ Render loading overlay if isLoading
├─ useEffect: Handle Escape key
│   ├─ Check closeOnEscape
│   ├─ Check preventCloseWhileLoading && isLoading
│   └─ Call onClose if allowed
├─ useEffect: Focus trap
│   ├─ Save currently focused element
│   ├─ Focus first focusable in modal
│   └─ Restore focus on unmount
└─ useEffect: Body scroll lock
    ├─ Disable body scroll when open
    └─ Restore on close
```

## Common Edit Patterns

### Adding a new loading state to a component
1. Import Loader component
2. Get loading state from enhanced store
3. Conditionally render Loader
```tsx
import { Loader } from './Loader';
import { useCharacterStoreEnhanced } from '../store/characterStoreEnhanced';

const { isOperationLoading } = useCharacterStoreEnhanced();

<button disabled={isOperationLoading('create')}>
  {isOperationLoading('create') ? (
    <Loader variant="inline" size="sm" />
  ) : (
    'Create'
  )}
</button>
```

### Adding indexing status to a component
1. Import IndexingStatusDisplay
2. Pass character ID
```tsx
import { IndexingStatusDisplay } from './IndexingStatusDisplay';

<IndexingStatusDisplay characterId={character.id} />
```

### Converting a modal to use improved Modal component
1. Import Modal component
2. Replace overlay/content divs with Modal wrapper
3. Move form content to children
4. Set closeOnOverlayClick={false}
5. Pass isLoading from store
```tsx
// Before
<div className="modal-overlay" onClick={onClose}>
  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
    <h2>Title</h2>
    <form>...</form>
  </div>
</div>

// After
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Title"
  closeOnOverlayClick={false}
  isLoading={isLoading}
>
  <form>...</form>
</Modal>
```

## Dependencies

### Component Dependencies Graph
```
Modal (standalone)
Loader (standalone)
UserMessage (standalone)
AssistantMessage → react-markdown, remark-gfm
ProgressBar → types/indexing
IndexingStatusDisplay → useIndexingStatus, ProgressBar
CharacterModal → Modal, IndexingStatusDisplay, Loader (future)
ChatWindow → UserMessage, AssistantMessage
MessageInput → Loader (future)
CharacterList → Loader (future)
```

### External Dependencies
- React (all components)
- react-dropzone (CharacterModal)
- react-markdown (AssistantMessage)
- remark-gfm (AssistantMessage - GitHub Flavored Markdown)
- Zustand stores (CharacterList, CharacterModal, ChatWindow, MessageInput)
- API service (via stores)
- Custom hooks (IndexingStatusDisplay)

## Testing Strategy

### Unit Tests
- Test each component with different props
- Mock dependencies (stores, hooks)
- Test loading states
- Test user interactions (clicks, key presses)
- Test accessibility attributes

### Integration Tests
- Test components with real stores
- Test components with real hooks
- Test component interactions

### Visual Tests
- Test animations render correctly
- Test responsive behavior
- Test different screen sizes

## Notes

- All components use TypeScript with strict typing
- All components have accessibility attributes
- All components support custom className for extension
- All components have testId for testing
- Animations respect prefers-reduced-motion
- Components follow existing code style
