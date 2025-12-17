# Chat To - AI Chat with Historical Figures

## Project Overview

**Chat To** is a web application that enables conversations with historical figures using Retrieval Augmented Generation (RAG) based on their books. The system combines local Ollama LLMs with ChromaDB vector databases to create an intelligent, context-aware chat experience where each character responds based on their written works and previous conversations.

## Architecture

### Tech Stack

**Backend:**
- Python with FastAPI framework
- Uvicorn ASGI server (port 1310)
- ChromaDB for vector storage (SQLite backend)
- Ollama for LLM inference and embeddings
  - `qwen2.5:7b` for chat responses
  - `qwen-embeddings-indexer` for indexing
  - `qwen-embeddings-kb` for search queries

**Frontend:**
- React 18 + TypeScript
- Vite build tool
- Zustand for state management
- Axios for HTTP requests
- React Dropzone for file uploads
- React Hook Form + Zod for validation

### Core Concepts

**Dual Knowledge Base System:**
Each character maintains two separate ChromaDB vector databases:

1. **Books Knowledge Base** - Indexed from uploaded books (PDF, DOCX, TXT)
   - Text chunked into 3000-character segments with 10% overlap
   - Indexed asynchronously upon book upload
   - Provides domain knowledge from the character's writings

2. **Conversations Knowledge Base** - Indexed from chat history
   - Each user message is indexed after being sent
   - Enables the character to reference previous discussions
   - Creates continuity across multiple conversations

**RAG Flow:**
1. User sends a message to a character
2. System generates embedding for the message
3. Both knowledge bases are searched for relevant context:
   - Books KB provides theoretical/philosophical context
   - Conversations KB provides discussion history context
4. System builds a two-part prompt:
   - System prompt: Character identity + book context
   - User prompt: Previous discussions + conversation history + task
5. Ollama LLM generates response based on complete context
6. User message is asynchronously indexed into conversations KB

### Architecture Layers

**Backend (Bottom-Up Dependency Flow):**

```
Layer 0: configs/, exceptions/, models/
         ↓
Layer 1: storage/, utils/, vector_db/
         ↓
Layer 2: embeddings/, llm/
         ↓
Layer 3: knowledge_base/
         ↓
Layer 4: chat_handler/
         ↓
Layer 5: api/ (FastAPI routes)
```

**Frontend (Bottom-Up Dependency Flow):**

```
types/ → services/api.ts → store/ → components/ → App.tsx
```

### Key Features

**Character Management:**
- Create characters with name, avatar (PNG/JPG), and books
- Upload books in PDF, DOCX, or TXT format
- Edit character details and add more books
- Delete characters (removes all data including KBs)
- View indexing status for uploaded books

**Chat Interface:**
- Telegram-inspired design (20% sidebar, 80% chat area)
- Real-time conversation with character
- Auto-scrolling message window
- Message history with pagination
- Context-aware responses based on character's knowledge

**File Handling:**
- Drag-and-drop file uploads
- File validation (type and size)
- Automatic book parsing and chunking
- Progress tracking for async indexing

### API Endpoints

```
GET    /api/characters                    - List all characters
POST   /api/characters                    - Create character (multipart/form-data)
GET    /api/characters/{id}               - Get character details
PUT    /api/characters/{id}               - Update character
DELETE /api/characters/{id}               - Delete character
GET    /api/characters/{id}/avatar        - Get avatar image
GET    /api/characters/{id}/books         - List character books
POST   /api/characters/{id}/books         - Add book
DELETE /api/characters/{id}/books/{bookId} - Delete book
GET    /api/characters/{id}/messages      - Get message history
POST   /api/characters/{id}/messages      - Send message
GET    /api/characters/{id}/indexing-status - Check indexing progress
```

### Project Status (2025-12-15)

**Backend: 100% Complete**
- All modules implemented and tested
- Comprehensive pytest test suite (all passing)
- RAG pipeline fully functional
- Async book indexing working
- Server ready for production

**Frontend: 65% Complete (219/334 tests passing)**
- ✅ Architecture design (Phase 1)
- ✅ TDD test suite (Phase 2) - 14 test files, 6,940+ lines
- ⚠️ Implementation (Phase 3) - Core functionality complete
  - API service: All 11 methods implemented
  - State management: Both Zustand stores functional
  - Components: All 5 components with rendering
  - File uploads: Working with react-dropzone
  - Form handling: Working with validation
  - Remaining: Advanced features (accessibility, keyboard nav, visual polish)

### Development Workflow

The project follows strict **Test-Driven Development (TDD)**:

**Phase 1 - Architecture:** Design structure, define interfaces, create skeletons
**Phase 2 - Testing:** Write comprehensive tests before implementation
**Phase 3 - Implementation:** Implement code to pass tests, iterate until all pass

### Test Data

Located in `Гегель/` folder:
- `gegel-3.jpg` - Avatar for Hegel character
- 4 TXT files - Hegel's philosophy books for knowledge base testing

### Getting Started

```bash
# Start Backend (Terminal 1)
cd /home/denis/Projects/chat_to/backend
source ../venv/bin/activate
python main.py
# → http://localhost:1310

# Start Frontend (Terminal 2)
cd /home/denis/Projects/chat_to/frontend
npm run dev
# → http://localhost:5173
```

### Use Cases

1. **Create Character** - Upload Hegel with avatar and books, wait for indexing
2. **Chat** - Ask Hegel about dialectics, system searches books and responds
3. **Edit** - Add more books or change avatar
4. **Delete Character** - Remove character and all associated data
5. **Delete Book** - Remove specific book from knowledge base

### Next Steps

See `TODO.md` for detailed remaining work:
- Complete advanced frontend features
- Fix E2E and integration test infrastructure
- Add accessibility enhancements
- Implement keyboard navigation
- Production build optimization
- Manual testing with real backend

**Estimated completion:** 7-11 hours
