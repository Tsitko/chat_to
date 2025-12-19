# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A chat application for conversing with historical figures using RAG (Retrieval Augmented Generation) based on their books. The system uses local Ollama LLMs with ChromaDB vector databases for knowledge retrieval.

**Tech Stack:**
- **Backend:** Python with Uvicorn server (port 1310)
- **Frontend:** React + TypeScript + Vite
- **LLM:** Ollama (qwen2.5:7b for chat, qwen-embeddings-* for embeddings)
- **Vector DB:** ChromaDB with SQLite (separate DB per character)
- **API:** REST endpoints for characters, books, and messages

## CRITICAL: Python Environment

**ALWAYS use the venv in the project root:**
- All Python code must be run from the venv in the project root directory
- All Python dependencies must be installed in the venv in the project root directory
- Before running any Python commands: `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows)
- Never install dependencies globally or in other venv locations

## Development Workflow

This project follows a strict **three-phase TDD methodology**:

### Phase 1: Architecture Design
- Design folder structure, class signatures, method declarations
- Define dependencies in `requirements.txt` (backend) or `package.json` (frontend)
- Create Python venv: `python -m venv venv && source venv/bin/activate`
- Install dependencies: `pip install -r requirements.txt`
- **Output:** Skeleton code with interfaces, docstrings, and `pass` statements
- Update task.md with architectural decisions and implementation recommendations

### Phase 2: Test Development (TDD)
- Write comprehensive unit tests for each class BEFORE implementation
- Write integration tests for class interactions
- Cover: happy paths, edge cases, error conditions, state transitions
- Tests must be written WITHOUT seeing implementation code
- **Location:** `tests/` folders at each module level

### Phase 3: Implementation
- Implement code WITHOUT looking at tests initially
- Run all tests: `pytest` (backend) or `npm test` (frontend)
- Iterate until all tests pass
- **Rule:** Modify tests ONLY with explicit user permission

## Architecture Principles

1. **Dependencies flow bottom-up only** - higher-level modules import lower-level, never reverse
2. **One file = one class** - strict single responsibility
3. **Configurations in `configs/` folder** - centralized config management
4. **Interface-based inheritance** - use protocols/interfaces over concrete inheritance

## Testing Requirements

**Every module must have:**
- Unit tests for all public methods in each class
- Integration tests where classes interact (one class imports another)
- E2E test for each use case defined in task.md
- Tests organized in `tests/` folder matching source structure

**Run tests:**
```bash
# Backend (when implemented)
pytest tests/

# Single test file
pytest tests/path/to/test_file.py

# Single test function
pytest tests/path/to/test_file.py::test_function_name

# Frontend (when implemented)
npm test
```

## Documentation Requirements

After EVERY code change, update:

1. **llm_readme.md** (root) - Project Navigation Index showing:
   - Module Responsibility Matrix
   - Cross-Module Dependencies
   - Common Edit Patterns
   - FLRM coverage status

2. **README.md** (each folder) - Folder-Level README Format (FLRM):
   - File map with single-line descriptions
   - Key components with purpose, entities, I/O, dependencies
   - Interface signatures
   - Data/control flow

3. **README.md** (root) - Human-readable overview (when project is implemented)

## Code Quality Standards

- **Encoding:** UTF-8 only
- **Docstrings:** Required for all modules, classes, and public methods
- **Line length:** 100-120 characters max
- **Function size:** Max 50 lines; split if exceeded
- **Class size:** Max 300 lines; consider splitting if exceeded
- **Nesting depth:** Max 3-4 levels
- **Naming:**
  - Classes: PascalCase (nouns)
  - Functions/methods: snake_case (verbs for Python), camelCase (for TypeScript)
  - Constants: UPPER_SNAKE_CASE
  - Files: Match class/module names

## Knowledge Base Architecture

Each character has TWO ChromaDB databases:
1. **Books KB** - indexed from uploaded books (PDF, DOCX, TXT)
   - Chunking: 3000 chars with 10% overlap
   - Indexed on book upload (async)

2. **Conversations KB** - indexed from chat history
   - Indexed on each message sent (async)

**Search flow:**
1. User sends message to character
2. Search both KBs for relevant context
3. Build prompt with: character name, book context, previous discussions, chat history
4. Generate response via LLM
5. Index user message into conversations KB

## API Endpoints Structure

```
/api/characters              GET, POST
/api/characters/{id}         GET, PUT, DELETE
/api/characters/{id}/avatar  GET
/api/characters/{id}/books   GET, POST
/api/characters/{id}/books/{book_id}  DELETE
/api/characters/{id}/messages  GET, POST
/api/characters/{id}/indexing-status  GET
```

## Configuration Files

All configs externalized to `configs/` folder:
- **ollama_models.py** - Model names (qwen2.5:7b, qwen-embeddings-indexer, qwen-embeddings-kb)
- **server_config.py** - Server port (default: 1310)
- **chunking_config.py** - Chunk size (3000) and overlap (10%)

## LLM Prompt Template

```python
prompt = """
Ты {name}.
Твои знания по обсуждаемой теме: {context}
Раньше по этой теме вы обсуждали: {previous_discussion}
История беседы: {messages}

Изучи беседу исходя из своих знаний и сформулируй мнение: с чем ты согласен,
с чем нет и почему, что предлагаешь обсудить дополнительно.
"""
```

## Test Data

Located in `Гегель/` folder:
- `gegel-3.jpg` - Avatar for testing character creation
- 4 TXT files with Hegel's philosophy books - For testing book indexing

## Error Handling Requirements

- All errors must be handled explicitly (no silent failures)
- Use specific exception types, not generic `Exception`
- Log all errors with sufficient context for debugging
- User-facing errors must be clear and actionable
- Critical errors abort execution; non-critical use fallback logic

## Security Requirements

- No secrets in code or git (use environment variables)
- Validate and sanitize all user inputs
- Use parameterized queries for database operations
- File uploads: validate file types and sizes

## Module Dependencies (When Implemented)

Expected dependency graph (bottom-up):
```
vector_db/ → embeddings/ → knowledge_base/
↑
api/ → llm/ → chat_handler/
↑
ui/ (React frontend)
```
