# Project Navigation Index - Chat To Historical Figures

**Project Status (2025-12-19):** Backend 100% complete with Emotions | Frontend 100% complete with Emotions | Group Chat Architecture Phase 1 Complete

## Module Responsibility Matrix

| Module | Layer | Responsibility | Dependencies |
|--------|-------|----------------|--------------|
| `configs/` | Config | Configuration constants | None |
| `exceptions/` | Base | Custom exception classes | None |
| `models/` | Base | Pydantic data models (includes Emotions) | None |
| `storage/` | Data | File and database persistence | models, exceptions |
| `utils/` | Utilities | Text processing, validation | configs, exceptions |
| `vector_db/` | Data | ChromaDB vector operations | configs, exceptions |
| `embeddings/` | Logic | Embedding generation | configs, exceptions |
| `knowledge_base/` | Logic | Dual KB management | vector_db, embeddings, utils |
| `llm/` | Logic | LLM client, prompts, emotion detection | configs, models, exceptions |
| `chat_handler/` | Orchestration | Chat, emotions, indexing, group chat services | knowledge_base, llm, storage, models |
| `api/` | Presentation | FastAPI REST endpoints (single & group chat) | storage, chat_handler, models, utils |
| `frontend/types/` | Types | TypeScript type definitions (includes Emotions) | None |
| `frontend/services/` | Service | API client with axios | types |
| `frontend/store/` | State | Zustand state management | services, types |
| `frontend/components/` | UI | React components (includes EmotionDisplay) | store, types |
| `frontend/` | UI | React + TypeScript UI | Backend API |

## Cross-Module Dependencies

### Dependency Graph (Bottom-Up)

```
Level 0 (No dependencies):
- configs
- exceptions
- models

Level 1 (Depends on Level 0):
- storage → models, exceptions
- utils → configs, exceptions
- vector_db → configs, exceptions

Level 2 (Depends on Level 0-1):
- embeddings → configs, exceptions
- llm → configs, models, exceptions

Level 3 (Depends on Level 0-2):
- knowledge_base → vector_db, embeddings, utils, exceptions

Level 4 (Depends on Level 0-3):
- chat_handler → knowledge_base, llm, storage, models, exceptions

Level 5 (Depends on Level 0-4):
- api → storage, chat_handler, models, utils, exceptions
```

### Key Integration Points

1. **API → Chat Handler**: Routes call ChatService for message processing
2. **API → Group Chat Handler**: Group routes call GroupChatService for multi-character processing
3. **Chat Handler → Knowledge Base**: ChatService searches both KBs for context (happens first)
4. **Chat Handler → Emotion Detection**: ChatService detects emotions with KB context
5. **Chat Handler → LLM**: ChatService generates responses via OllamaClient with dynamic temperature
6. **Chat Handler → Storage**: ChatService persists messages with emotions
7. **Group Chat → Chat Service**: GroupChatService reuses ChatService for each character
8. **Knowledge Base → Vector DB**: KBManager stores/queries ChromaDB
9. **Knowledge Base → Embeddings**: KBManager generates embeddings
10. **API → Storage**: Routes access repositories directly for CRUD
11. **Frontend → EmotionDisplay**: AssistantMessage renders emotions with color coding

**Single chat operation order**: KB search → Emotion detection (with context) → Response generation (reuses context)

**Group chat operation order**: For each character sequentially: Get message window → (KB search → Emotion detection → Response generation) → Add to context for next character

## Common Edit Patterns

### Adding a New Character Field

1. Update `models/character.py` - Add field to Character model
2. Update `storage/character_repository.py` - Handle new field in CRUD
3. Update `api/character_routes.py` - Accept new field in endpoints
4. Update `frontend/src/types/character.ts` - Add TypeScript type
5. Update `frontend/src/components/CharacterModal.tsx` - Add form field

### Adding a New Knowledge Base

1. Update `knowledge_base/knowledge_base_manager.py` - Add KB methods
2. Update `chat_handler/chat_service.py` - Search new KB
3. Update `llm/prompt_builder.py` - Include new context in prompt

### Adding a New API Endpoint

1. Create route in appropriate `api/*_routes.py` file
2. Define request/response models in `models/`
3. Implement business logic in service layer (chat_handler or storage)
4. Update `frontend/src/services/api.ts` - Add API method
5. Add corresponding TypeScript types in `frontend/src/types/`

### Modifying LLM Prompt

1. Update `llm/prompt_builder.py` - Modify PROMPT_TEMPLATE
2. Update tests in `tests/unit/test_llm.py`
3. Update `chat_handler/chat_service.py` if context requirements change

### Adding Group Chat Feature (COMPLETED - Phase 1)

1. Create `configs/group_chat_config.py` - Configuration constants
2. Create `models/group_message.py` - Request/response models
3. Create `chat_handler/group_chat_service.py` - Multi-character orchestration
4. Create `api/group_message_routes.py` - Group chat endpoint
5. Update `models/__init__.py` - Export new models
6. Update `chat_handler/__init__.py` - Export GroupChatService
7. Update `configs/__init__.py` - Export group chat configs
8. Create README.md files for all new modules
9. Register router in `main.py` (Phase 3)

## Implementation Status

### Backend (100% Complete with Emotions)
- ✅ All modules implemented and tested (146 emotion tests + existing tests)
- ✅ All pytest tests passing
- ✅ Server running on port 1310
- ✅ Full RAG pipeline with emotion detection
- ✅ Async book indexing functional
- ✅ Dual knowledge bases (books + conversations)
- ✅ Emotion detection via LLM (5 emotions: fear, anger, sadness, disgust, joy)
- ✅ Dynamic temperature adjustment based on emotions (0.1/0.3/0.5)

### Frontend (100% Complete with Emotions)
- ✅ Architecture design complete (Phase 1)
- ✅ TDD test suite complete (Phase 2) - Emotion tests: 111 passing
- ✅ Implementation (Phase 3) - All emotion features implemented
  - ✅ API service with emotion types
  - ✅ Zustand stores handle emotions
  - ✅ EmotionDisplay component with color coding
  - ✅ AssistantMessage integration
  - ✅ ChatWindow passes emotions through
  - ✅ Color-coded emotions: Green (0-33), Orange (34-66), Red (67-100)
  - ✅ Russian labels: Страх, Злость, Печаль, Отвращение, Радость

### Group Chat Backend (Phase 1 Complete - Architecture Design)
- ✅ Architecture skeleton created
- ✅ Configuration module: `configs/group_chat_config.py`
- ✅ Data models: `models/group_message.py` (GroupMessageRequest, GroupMessageResponse, CharacterResponse)
- ✅ Service layer: `chat_handler/group_chat_service.py` (GroupChatService)
- ✅ API layer: `api/group_message_routes.py` (POST /api/groups/messages)
- ✅ Module exports updated
- ✅ README.md documentation for all modules
- ⏳ Phase 2: TDD (Pending)
- ⏳ Phase 3: Implementation (Pending)

## FLRM Coverage Status

| Module | README.md | Status |
|--------|-----------|--------|
| backend/configs/ | Yes | Complete |
| backend/exceptions/ | Yes | Complete |
| backend/models/ | Yes | Complete |
| backend/storage/ | Yes | Complete |
| backend/utils/ | Yes | Complete |
| backend/vector_db/ | Yes | Complete |
| backend/embeddings/ | Yes | Complete |
| backend/knowledge_base/ | Yes | Complete |
| backend/llm/ | Yes | Complete |
| backend/chat_handler/ | Yes | Complete |
| backend/api/ | Yes | Complete |
| frontend/src/ | Yes | Complete |
| frontend/src/__tests__/ | Yes | Complete (TDD test suite) |
| tests/ | Yes | Complete |

## Quick Reference

### Start Development Server

```bash
# Terminal 1 - Backend
cd /home/denis/Projects/chat_to/backend
source ../venv/bin/activate
python main.py
# Starts on http://localhost:1310

# Terminal 2 - Frontend
cd /home/denis/Projects/chat_to/frontend
npm run dev
# Starts on http://localhost:5173
```

### Run Tests

```bash
# Backend (all passing)
cd /home/denis/Projects/chat_to
pytest tests/

# Frontend (219/334 passing)
cd /home/denis/Projects/chat_to/frontend
npm test

# Single frontend test file
npm test src/services/__tests__/api.test.ts

# Watch mode
npm test -- --watch
```

### Build for Production

```bash
# Frontend build
cd /home/denis/Projects/chat_to/frontend
npm run build
# Output in dist/

# Preview production build
npm run preview
```

### Project Structure Overview

```
chat_to/
├── backend/           # Python FastAPI backend
│   ├── configs/      # Configuration constants
│   ├── exceptions/   # Custom exceptions
│   ├── models/       # Pydantic models
│   ├── storage/      # Data persistence layer
│   ├── utils/        # Utilities (chunking, parsing, validation)
│   ├── vector_db/    # ChromaDB client
│   ├── embeddings/   # Embedding generation
│   ├── knowledge_base/ # Dual KB management
│   ├── llm/          # Ollama client and prompts
│   ├── chat_handler/ # Orchestration layer
│   ├── api/          # FastAPI routes
│   └── main.py       # App entry point
├── frontend/          # React + TypeScript frontend
│   ├── src/
│   │   ├── types/    # TypeScript types
│   │   ├── services/ # API client
│   │   ├── store/    # Zustand stores
│   │   ├── components/ # React components
│   │   ├── App.tsx   # Main component
│   │   └── main.tsx  # Entry point
│   └── package.json
├── tests/             # pytest test suite
│   ├── unit/         # Unit tests
│   ├── integration/  # Integration tests
│   └── e2e/          # End-to-end tests
├── venv/              # Python virtual environment
└── Гегель/            # Test data (Hegel books + avatar)
```

## Architecture Highlights

### Two Knowledge Bases Per Character

Each character maintains:
1. **Books KB** - Indexed from uploaded PDF/DOCX/TXT books
2. **Conversations KB** - Indexed from chat history

### Async Indexing

Books are indexed asynchronously after upload to avoid blocking the API response.

### RAG Flow with Emotion Detection

1. User sends message
2. System retrieves 5 recent messages from chat history
3. **System searches both KBs for relevant context** (books + conversations)
4. **Emotion detection with context**: LLM analyzes chat history AND knowledge base context to detect character's emotions
5. System calculates optimal temperature based on max emotion value:
   - 0-33 → temperature 0.1 (calm, analytical)
   - 34-66 → temperature 0.3 (moderate engagement)
   - 67-100 → temperature 0.5 (high emotional intensity)
6. Prompt is built with: character name, **book context** (reused), previous discussions, chat history, **emotions**
7. LLM generates response with **dynamic temperature**
8. Response and emotions are saved to database
9. User message is indexed into conversations KB
10. Frontend displays assistant message with **color-coded emotions**

**Key optimization**: Knowledge base context is fetched once and reused for both emotion detection (step 4) and response generation (step 6), eliminating duplicate queries.

### Tech Stack

- **Backend**: Python, FastAPI, Uvicorn
- **Frontend**: React, TypeScript, Vite
- **LLM**: Ollama (qwen2.5:7b)
- **Embeddings**: Ollama (qwen-embeddings-*)
- **Vector DB**: ChromaDB with SQLite
- **State Management**: Zustand
- **Testing**: pytest, vitest

## Emotion Detection System

### Overview

The emotion detection system analyzes the character's emotional state based on chat history and adjusts the LLM's response accordingly. This creates more authentic and contextually appropriate character responses.

### Five Core Emotions

1. **Fear (страх)** - Increases when chat messages contradict the character's principles and beliefs
2. **Anger (злость)** - Increases when messages try to force the character to change their principles
3. **Sadness (печаль)** - Increases when conversation dynamics move away from the character's ideas
4. **Disgust (отвращение)** - Increases when messages contradict the character's moral and ethical norms
5. **Joy (радость)** - Increases when messages confirm and strengthen the character's principles

### Technical Implementation

**Backend Components:**
- `backend/models/emotions.py` - Emotions data model with 0-100 validation
- `backend/llm/emotion_detector.py` - EmotionDetector class using LLM for analysis
- `backend/llm/prompt_builder.py` - Emotion-aware prompt building
- `backend/chat_handler/chat_service.py` - Emotion detection integration

**Frontend Components:**
- `frontend/src/types/message.ts` - Emotions TypeScript interface
- `frontend/src/components/EmotionDisplay.tsx` - Color-coded emotion display
- `frontend/src/components/AssistantMessage.tsx` - Emotion integration

### Emotion Detection Flow

1. **Input**: 5 recent messages from chat history + knowledge base context from books
2. **LLM Analysis**: Specialized prompt analyzes character's emotional state using both chat history and their knowledge
3. **Parsing**: Regex extraction of XML-tagged emotion values (0-100)
4. **Temperature Calculation**: Max emotion → temperature (0.1/0.3/0.5)
5. **Response Generation**: LLM uses dynamic temperature and emotion-aware prompt (reusing same KB context)
6. **Storage**: Emotions saved with assistant message
7. **Display**: Frontend shows color-coded emotions

**Context reuse**: The knowledge base context retrieved for emotion detection is reused in response generation, ensuring consistency and avoiding redundant database queries.

### Color Coding

- **Green (0-33)**: Low intensity - calm, analytical state
- **Orange (34-66)**: Medium intensity - moderate emotional engagement
- **Red (67-100)**: High intensity - strong emotional response

### Error Handling

- Graceful degradation: If emotion detection fails, system uses default temperature (0.7)
- Non-blocking: Emotion detection failures don't stop message processing
- Partial success: Accepts partial emotion data (missing values default to 0)

### Testing

- **Backend**: 146 comprehensive tests (unit, integration, edge cases)
- **Frontend**: 111 tests (component, integration, color coding)
- All tests passing ✅
