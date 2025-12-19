# Frontend Source

## File Map

- `main.tsx` - Application entry point
- `App.tsx` - Main app component with layout
- `App.css` - Main application styles
- `types/` - TypeScript type definitions
- `services/` - API service layer
- `store/` - Zustand state management
- `components/` - React components

## Key Components

### App.tsx
- **Purpose**: Root component with Telegram-like layout
- **Layout**: 20% sidebar + 80% chat area
- **Children**: CharacterList, ChatWindow, MessageInput, CharacterHeader, CharacterModal

### Components

1. **CharacterList** - Displays characters in sidebar
2. **ChatWindow** - Shows message history
3. **MessageInput** - Input field for sending messages
4. **CharacterHeader** - Character info and edit button
5. **CharacterModal** - Create/edit character form with file uploads
6. **AssistantMessage** - Left-aligned message with Markdown support (ReactMarkdown + remark-gfm)
7. **UserMessage** - Right-aligned user message with Markdown support
8. **Modal** - Reusable modal component
9. **Loader** - Loading spinner component
10. **ProgressBar** - Progress indicator
11. **IndexingStatusDisplay** - Shows book indexing progress

### Services

- **ApiService** - Axios-based API client for backend communication

### Stores

- **characterStore** - Character state management
- **messageStore** - Message state management

## Data Flow

1. User interaction → Component
2. Component → Store action
3. Store → API Service
4. API Service → Backend
5. Response → Store update
6. Store → Component re-render

## Dependencies

- React + React DOM
- Zustand (state management)
- Axios (HTTP client)
- React Dropzone (file uploads)
- React Hook Form + Zod (forms + validation)
- React Markdown + remark-gfm (Markdown rendering with GitHub Flavored Markdown)

## Component Details

### AssistantMessage
- **Purpose**: Renders character messages with Markdown support
- **Features**:
  - Custom list rendering (ordered/unordered) with proper numbering
  - Flattens `<p>` tags inside list items to prevent layout issues
  - Trims leading whitespace from list items
  - Dark theme styling with syntax highlighting for code blocks
  - Avatar display with initials fallback
- **Dependencies**: ReactMarkdown, remark-gfm

### UserMessage
- **Purpose**: Renders user messages with Markdown support
- **Features**: Right-aligned styling, Markdown rendering, timestamp
- **Dependencies**: ReactMarkdown, remark-gfm
