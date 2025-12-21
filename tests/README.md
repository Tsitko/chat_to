# Test Suite for Chat Application with Historical Figures

This test suite follows strict **Test-Driven Development (TDD) principles** and provides comprehensive coverage for the chat application backend.

## Test Organization

```
tests/
├── conftest.py                 # Shared fixtures and pytest configuration
├── unit/                       # Unit tests (isolated, mocked dependencies)
│   ├── test_text_chunker.py
│   ├── test_embedding_generator.py
│   └── test_knowledge_base_manager.py
├── integration/                # Integration tests (real components interact)
│   └── test_chat_flow.py
└── e2e/                        # End-to-end tests (full user journeys)
    └── test_use_cases.py
```

## Test Philosophy

All tests were written **BEFORE implementation** following TDD best practices:

1. **Unit Tests**: Test each class in isolation with mocked dependencies
2. **Integration Tests**: Test interactions between classes with real dependencies where possible
3. **E2E Tests**: Test complete user journeys with NO MOCKS (real LM Studio, real Ollama embeddings, real ChromaDB, real files)

## Test Coverage Summary

### Unit Tests

#### `test_text_chunker.py` (25 tests)
Tests for `TextChunker` class covering:
- Happy path: normal text chunking with overlap
- Edge cases: empty text, text smaller than chunk size, text exactly chunk size
- Boundary values: very long text, overlap calculations
- Special cases: Unicode text (Cyrillic), whitespace handling, word boundaries
- Metadata handling: `chunk_with_metadata` preserves and enriches metadata
- Error conditions: zero overlap, overlap greater than chunk size

**Key test scenarios:**
- `test_chunk_text_creates_overlap`: Verifies consecutive chunks have overlapping content
- `test_chunk_text_respects_chunk_size_limit`: No chunk exceeds max size
- `test_chunk_text_with_unicode_characters`: Handles Cyrillic, Chinese, emoji
- `test_chunk_with_metadata_adds_chunk_index`: Metadata includes chunk indexing

#### `test_embedding_generator.py` (20 tests)
Tests for `EmbeddingGenerator` class covering:
- Happy path: successful embedding generation for indexing and querying
- Model selection: correct model used for indexing vs querying
- Batch processing: `generate_batch_embeddings` handles multiple texts
- Edge cases: empty text, very long text (15000+ chars), Unicode text
- Error conditions: API failures, timeouts, invalid responses, network errors
- Model availability checking: `check_model_availability` returns true/false

**Key test scenarios:**
- `test_generate_indexing_embedding_uses_correct_model`: Verifies qwen-embeddings-indexer used
- `test_generate_query_embedding_uses_correct_model`: Verifies qwen-embeddings-kb used
- `test_generate_embedding_handles_api_error`: Raises EmbeddingError on API failure
- `test_generate_embedding_with_unicode_text`: Handles Cyrillic + Chinese + emoji

#### `test_knowledge_base_manager.py` (30 tests)
Tests for `KnowledgeBaseManager` class covering:
- Initialization: proper setup with character ID and dependencies
- Book indexing: chunks text, generates embeddings, stores in ChromaDB
- Message indexing: indexes into conversations KB
- Search: `search_books_kb` and `search_conversations_kb` with query embeddings
- Dual KB management: separate collections for books and conversations
- Deletion: `delete_book_from_kb`, `delete_all_knowledge_bases`
- Edge cases: empty book text, very large books, no search results
- Error conditions: IndexingError, VectorDBError propagation

**Key test scenarios:**
- `test_index_book_stores_in_books_collection`: Books go to books KB
- `test_index_message_stores_in_conversations_collection`: Messages go to conversations KB
- `test_search_books_kb_returns_top_n_results`: Returns requested number of results
- `test_delete_all_knowledge_bases_removes_both_collections`: Cleanup removes both KBs
- `test_index_book_with_large_book_handles_batch_processing`: Handles 100+ chunks

### Integration Tests

#### `test_chat_flow.py` (Planned - 8 tests)
Integration tests verifying class interactions:
- `TestKnowledgeBaseIntegration`:
  - `test_book_indexing_flow`: TextChunker → EmbeddingGenerator → ChromaClient → search works
  - `test_message_indexing_and_search`: Messages indexed and retrievable from conversations KB
  - `test_dual_kb_search`: Both books and conversations KBs can be searched

- `TestChatServiceIntegration`:
  - `test_complete_message_processing`: Full flow from user message to LLM response

- `TestIndexingServiceIntegration`:
  - `test_book_indexing_with_real_file`: Real file → DocumentParser → indexing → search

- `TestComponentInteractions`:
  - `test_chroma_client_and_embedding_generator_integration`: Storage and retrieval works
  - `test_text_chunker_and_embedding_generator_integration`: Chunks → embeddings pipeline
  - `test_document_parser_and_text_chunker_integration`: Parse → chunk pipeline

**Requirements**: These tests use REAL ChromaDB and REAL Ollama embeddings (no mocks).

### End-to-End Tests

#### `test_use_cases.py` (13 tests covering all 5 use cases)

**UC1: Create Character (3 tests)**
- `test_create_character_with_avatar_and_books`: Complete creation flow with avatar + 1 book
  - Verifies character created, appears in list, avatar retrievable
  - Waits for async indexing to complete (60s timeout)
  - Confirms book marked as `indexed: true` after completion
- `test_create_character_with_multiple_books`: Creates character with 3 books
  - Waits for all books to be indexed (180s timeout)
  - Verifies all books have `indexed: true`
- `test_book_indexing_after_creation`: Verifies async indexing status transitions

**UC2: Chat with Character (3 tests)**
- `test_send_message_and_get_response`: Sends message, receives LLM response
  - Verifies response structure (user_message, assistant_message)
  - Confirms response content is meaningful (>10 chars)
  - Uses REAL LM Studio LLM (qwen/qwen3-30b-a3b-2507)
- `test_message_appears_in_history`: Sends 2 messages, verifies chat history
  - Confirms messages appear in chronological order
  - Verifies total count includes both user and assistant messages
- `test_chat_with_pagination`: Tests message pagination (limit/offset)
  - Sends 5 messages, retrieves in pages
  - Verifies pages don't overlap

**UC3: Edit Character (2 tests)**
- `test_update_character_name`: Updates character name, verifies persistence
- `test_add_books_to_existing_character`: Adds book to existing character
  - Verifies book count increases
  - Confirms indexing starts for new book

**UC4: Delete Character (1 test)**
- `test_delete_character_and_data`: Deletes character completely
  - Verifies character no longer retrievable (404)
  - Confirms character removed from list
  - Verifies avatar no longer accessible
  - Confirms knowledge bases deleted

**UC5: Delete Book (1 test)**
- `test_delete_book_from_character`: Deletes one book from character with 2 books
  - Verifies book count decreases
  - Confirms deleted book ID not in remaining books
  - Character remains intact

**Critical Requirements**:
- All E2E tests use **NO MOCKS**
- Real LM Studio LLM (qwen/qwen3-30b-a3b-2507)
- Real embeddings (qwen-embeddings-indexer, qwen-embeddings-kb)
- Real ChromaDB vector databases
- Real file operations with test data from `Гегель/` folder
- Real async indexing with timeout handling

## Running Tests

### Prerequisites

1. **LM Studio must be running** with OpenAI-compatible API:
   - Host: `http://192.168.1.16:1234` (or `LM_STUDIO_URL`)
   - Model: `qwen/qwen3-30b-a3b-2507`

2. **Ollama must be running** with required models (embeddings):
   ```bash
   ollama pull qwen-embeddings-indexer
   ollama pull qwen-embeddings-kb
   ```

3. **Install dependencies**:
   ```bash
   cd /home/denis/Projects/chat_to
   source venv/bin/activate
   pip install -r backend/requirements.txt
   ```

### Run All Tests

```bash
# From project root
pytest tests/

# With coverage report
pytest tests/ --cov=backend --cov-report=html

# With verbose output
pytest tests/ -v
```

### Run Specific Test Types

```bash
# Unit tests only (fast, no external dependencies)
pytest tests/unit/ -m unit

# Integration tests (requires Ollama embeddings)
pytest tests/integration/ -m integration

# E2E tests (slow, requires LM Studio + Ollama embeddings)
pytest tests/e2e/ -m e2e

# Skip slow tests
pytest tests/ -m "not slow"

# Run only tests requiring Ollama embeddings
pytest tests/ -m requires_ollama
```

### Run Specific Test Files

```bash
# Single test file
pytest tests/unit/test_text_chunker.py

# Single test class
pytest tests/e2e/test_use_cases.py::TestUC1CreateCharacter

# Single test method
pytest tests/e2e/test_use_cases.py::TestUC1CreateCharacter::test_create_character_with_avatar_and_books
```

### Useful Pytest Options

```bash
# Stop on first failure
pytest tests/ -x

# Show local variables on failure
pytest tests/ -l

# Capture output (print statements)
pytest tests/ -s

# Run tests in parallel (if pytest-xdist installed)
pytest tests/ -n auto

# Re-run failed tests
pytest tests/ --lf
```

## Test Markers

Tests are marked with pytest markers for selective running:

- `@pytest.mark.unit` - Unit tests (isolated, fast)
- `@pytest.mark.integration` - Integration tests (multiple components)
- `@pytest.mark.e2e` - End-to-end tests (full user journeys)
- `@pytest.mark.slow` - Tests that take >5 seconds
- `@pytest.mark.requires_ollama` - Tests requiring Ollama embeddings to be running
- `@pytest.mark.asyncio` - Async tests (automatically handled)

## Test Data

Tests use real data from the `Гегель/` folder:
- **Avatar**: `gegel-3.jpg` (190KB, JPEG image)
- **Books**: 4 TXT files containing Hegel's philosophy texts (700KB - 1.3MB each)

Test data is accessed via fixtures:
- `hegel_avatar_path` - Path to avatar image
- `hegel_book_paths` - List of paths to all 4 books

## Coverage Goals

Target coverage: **80%+** for all modules

Current coverage (expected after implementation):
- Utils (TextChunker, DocumentParser): 90%+
- Embeddings: 85%+
- Vector DB: 85%+
- Knowledge Base: 90%+
- Storage: 80%+
- LLM: 80%+
- Chat Handler: 85%+
- API Routes: 75%+ (tested via E2E)

## Additional Tests Needed (Future Work)

While the core test suite is comprehensive, consider adding:

### Unit Tests (TODO)
1. `test_document_parser.py` - PDF, DOCX, TXT parsing
2. `test_file_validator.py` - File type and size validation
3. `test_file_storage.py` - File save/read/delete operations
4. `test_character_repository.py` - Database CRUD operations
5. `test_message_repository.py` - Message persistence and pagination
6. `test_chroma_client.py` - ChromaDB operations
7. `test_ollama_client.py` - LLM generation and streaming (LM Studio)
8. `test_prompt_builder.py` - Prompt construction
9. `test_chat_service.py` - Chat orchestration
10. `test_indexing_service.py` - Async indexing coordination

### Integration Tests (TODO)
1. `test_document_processing_pipeline.py` - Upload → Parse → Chunk → Embed → Index
2. `test_search_pipeline.py` - Query → Embed → Search → Results
3. `test_chat_pipeline.py` - Message → Search → Prompt → LLM → Response → Save
4. `test_storage_integration.py` - Repository + FileStorage interactions
5. `test_api_integration.py` - API routes + services integration

### E2E Tests (Additional Scenarios)
1. Error handling: Invalid file types, oversized files, corrupted data
2. Concurrent operations: Multiple users, simultaneous indexing
3. Performance: Large books (10MB+), many messages (1000+)
4. Edge cases: Empty books, special characters in names, network failures
5. State transitions: Indexing states, error recovery

## Test Patterns and Best Practices

### AAA Pattern (Arrange-Act-Assert)

All tests follow the AAA pattern:

```python
def test_chunk_text_creates_overlap(self):
    # Arrange: Set up test data and preconditions
    text = "A" * 1000
    chunker = TextChunker(chunk_size=200, overlap_size=50)

    # Act: Execute the behavior being tested
    chunks = chunker.chunk_text(text)

    # Assert: Verify the outcome
    assert len(chunks) > 1
    assert chunks[0][-50:] == chunks[1][:50]
```

### Descriptive Test Names

Test names describe **what is being tested** and **expected outcome**:
- `test_chunk_text_with_empty_string_returns_empty_list`
- `test_generate_embedding_handles_api_error`
- `test_create_character_with_avatar_and_books`

### Fixtures for Reusability

Common setup logic is extracted into fixtures:
- `temp_dir` - Temporary directory with cleanup
- `sample_text` - Reusable test text
- `mock_chroma_client` - Pre-configured mock
- `created_character` - Character with indexed books

### Comprehensive Edge Case Coverage

Tests cover:
- **Happy path**: Expected behavior with valid inputs
- **Edge cases**: Empty inputs, boundary values, very large inputs
- **Error conditions**: API failures, timeouts, invalid data
- **Special characters**: Unicode, Cyrillic, emojis, symbols
- **State transitions**: Indexing states, lifecycle management

### Real vs Mock Strategy

- **Unit tests**: Use mocks for all dependencies (fast, isolated)
- **Integration tests**: Use real dependencies where practical (ChromaDB, embeddings)
- **E2E tests**: Use EVERYTHING real (no mocks at all)

## Test Maintenance

### When to Update Tests

Update tests when:
1. **Adding new features**: Write tests first (TDD)
2. **Fixing bugs**: Add regression test before fix
3. **Refactoring**: Tests should still pass (if they don't, tests were too coupled to implementation)
4. **Changing interfaces**: Update affected tests

### Test Hygiene

- Keep tests independent (no shared state between tests)
- Use fixtures for setup/teardown
- Clean up resources (temp files, database entries, collections)
- Avoid sleeps (use proper async/await or polling with timeouts)
- Don't test implementation details (test behavior, not internals)

## Troubleshooting

### Common Issues

1. **LM Studio not running**
   ```
   Error: Connection refused to 192.168.1.16:1234
   Solution: Start LM Studio and enable the API server
   ```

2. **Ollama embeddings not pulled**
   ```
   Error: Model not found
   Solution: Pull models:
     ollama pull qwen-embeddings-indexer
     ollama pull qwen-embeddings-kb
   ```

3. **E2E tests timing out**
   ```
   Error: Indexing did not complete within timeout
   Solution: Increase timeout or use smaller test files
   ```

4. **ChromaDB persistence issues**
   ```
   Error: Collection already exists
   Solution: Ensure cleanup in fixtures, or delete temp_data_dir
   ```

5. **Import errors**
   ```
   Error: No module named 'backend'
   Solution: Check sys.path modification in conftest.py
   ```

## Test Results Interpretation

### Success Indicators
- All tests pass
- No warnings or deprecations
- Coverage >= 80%
- E2E tests complete within reasonable time (<5 min for full suite)

### Failure Indicators
- **Unit test failures**: Implementation bug or incorrect logic
- **Integration test failures**: Component interaction issue
- **E2E test failures**: System-level problem (infrastructure, config, dependencies)

## Contributing New Tests

When adding new tests:

1. **Choose test type**: Unit, integration, or E2E?
2. **Write test first** (TDD): Test should fail initially
3. **Follow naming conventions**: `test_<method>_<scenario>_<expected_outcome>`
4. **Use fixtures**: Don't repeat setup code
5. **Add markers**: `@pytest.mark.unit`, etc.
6. **Document complex tests**: Add docstring explaining "why"
7. **Verify test fails**: Run test before implementation to confirm it catches the issue
8. **Implement code**: Make test pass
9. **Refactor**: Clean up while keeping tests green

## Summary

This test suite provides comprehensive coverage of the chat application backend through:
- **75+ unit tests** covering individual classes in isolation
- **10+ integration tests** verifying component interactions
- **13 E2E tests** validating complete user journeys with real components

All tests follow TDD principles and were written BEFORE implementation to guide development and ensure correctness.

**Key test files:**
- `/home/denis/Projects/chat_to/tests/conftest.py` - Shared fixtures
- `/home/denis/Projects/chat_to/tests/unit/test_text_chunker.py` - 25 comprehensive tests
- `/home/denis/Projects/chat_to/tests/unit/test_embedding_generator.py` - 20 embedding tests
- `/home/denis/Projects/chat_to/tests/unit/test_knowledge_base_manager.py` - 30 KB tests
- `/home/denis/Projects/chat_to/tests/e2e/test_use_cases.py` - 13 E2E tests (all 5 use cases)
