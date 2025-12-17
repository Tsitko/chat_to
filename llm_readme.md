# Project Navigation Index - Chat To Historical Figures

**Project Status (2025-12-16):** Backend 100% complete | Frontend 65% complete (219/334 tests passing)

## Module Responsibility Matrix

| Module | Layer | Responsibility | Dependencies |
|--------|-------|----------------|--------------|
| `configs/` | Config | Configuration constants | None |
| `exceptions/` | Base | Custom exception classes | None |
| `models/` | Base | Pydantic data models | None |
| `storage/` | Data | File and database persistence | models, exceptions |
| `utils/` | Utilities | Text processing, validation | configs, exceptions |
| `vector_db/` | Data | ChromaDB vector operations | configs, exceptions |
| `embeddings/` | Logic | Embedding generation | configs, exceptions |
| `knowledge_base/` | Logic | Dual KB management | vector_db, embeddings, utils |
| `llm/` | Logic | LLM client and prompts | configs, models, exceptions |
| `chat_handler/` | Orchestration | Chat and indexing services | knowledge_base, llm, storage, models |
| `api/` | Presentation | FastAPI REST endpoints | storage, chat_handler, models, utils |
| `frontend/types/` | Types | TypeScript type definitions | None |
| `frontend/services/` | Service | API client with axios | types |
| `frontend/store/` | State | Zustand state management | services, types |
| `frontend/components/` | UI | React components | store, types |
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
2. **Chat Handler → Knowledge Base**: ChatService searches both KBs
3. **Chat Handler → LLM**: ChatService generates responses via OllamaClient
4. **Chat Handler → Storage**: ChatService persists messages
5. **Knowledge Base → Vector DB**: KBManager stores/queries ChromaDB
6. **Knowledge Base → Embeddings**: KBManager generates embeddings
7. **API → Storage**: Routes access repositories directly for CRUD

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

## Implementation Status

### Backend (100% Complete)
- ✅ All modules implemented and tested
- ✅ All pytest tests passing
- ✅ Server running on port 1310
- ✅ Full RAG pipeline working
- ✅ Async book indexing functional
- ✅ Dual knowledge bases (books + conversations)

### Frontend (65% Complete)
- ✅ Architecture design complete (Phase 1)
- ✅ TDD test suite complete (Phase 2) - 14 test files, 6,940+ lines
- ⚠️ Implementation (Phase 3) - 219/334 tests passing
  - ✅ API service (11 methods)
  - ✅ Zustand stores (2 stores)
  - ✅ All 5 components with JSX
  - ✅ File uploads (react-dropzone)
  - ✅ Form handling (react-hook-form + zod)
  - ⚠️ Advanced features (accessibility, keyboard nav, visual polish) - in progress
  - ⚠️ E2E tests (16 failures) - test infrastructure issues
  - ⚠️ Integration tests (12 failures) - mocking setup issues

**Remaining Work:** See TODO.md for detailed breakdown

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

### RAG Flow

1. User sends message
2. System searches both KBs for relevant context
3. Prompt is built with: character name, book context, previous discussions, chat history
4. LLM generates response based on prompt
5. User message is indexed into conversations KB

### Tech Stack

- **Backend**: Python, FastAPI, Uvicorn
- **Frontend**: React, TypeScript, Vite
- **LLM**: Ollama (qwen2.5:7b)
- **Embeddings**: Ollama (qwen-embeddings-*)
- **Vector DB**: ChromaDB with SQLite
- **State Management**: Zustand
- **Testing**: pytest, vitest
