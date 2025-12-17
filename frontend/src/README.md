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
