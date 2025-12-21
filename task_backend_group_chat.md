# Task: Backend Group Chat Architecture

**Date:** 2025-12-19
**Phase:** 1 - Architecture Design
**Status:** In Progress

## Requirements Summary

Design and implement backend architecture for group chat functionality where:
- Multiple characters can participate in a single conversation
- Each character receives context from previous messages including prior character responses
- Emotion detection happens for each character individually
- All character responses are returned as an array to frontend

## Functional Requirements

### Input
- Array of previous messages (last 5 messages from group chat)
- Array of character IDs participating in the group
- New user message

### Processing Flow
1. For each character in the group (sequential processing):
   - Take messages including previous character responses in this request
   - Detect emotions for the character based on their context
   - Generate response using character's knowledge base and emotions
   - Add response to message array
   - Pass updated message array to next character

2. Example with 3 characters:
   - Input: Messages 1-5 (existing) + 3 character IDs
   - Character 1: Process messages 1-5 → generate message 6
   - Character 2: Process messages 2-6 → generate message 7
   - Character 3: Process messages 3-7 → generate message 8
   - Output: Array [message 6, message 7, message 8]

### Output
- Array of assistant messages (one per character)
- Each message includes:
  - Character ID
  - Content
  - Emotions
  - Timestamp

## Technical Requirements

### Architecture Principles
- Follow three-phase TDD methodology (design → tests → implementation)
- One file = one class
- Dependencies flow bottom-up
- Interface-based design
- Configurations in `configs/` folder

### Integration Points
- Reuse existing `ChatService` for individual character processing
- Extend message models to support group context
- Add new API endpoint for group messages
- Maintain compatibility with existing single-character chat

### Dependencies
- `backend/models/` - Extend message models for group chat
- `backend/chat_handler/` - New `GroupChatService` orchestrating multiple characters
- `backend/api/` - New group chat routes
- `backend/configs/` - Configuration for group chat limits

## Non-Functional Requirements

### Performance
- Sequential processing to ensure proper context flow
- Async operations where possible
- Timeout protection for long-running operations

### Error Handling
- Partial success: If one character fails, return responses from successful characters
- Clear error messages indicating which character failed
- Graceful degradation

### Testing
- Unit tests for `GroupChatService`
- Integration tests for multi-character flow
- E2E tests for complete group chat scenario
- Edge cases: empty groups, single character, failed character responses

## Use Cases

### UC1: Basic Group Chat
**Actors:** User, 3 Characters (Hegel, Stalin, Marx)
**Flow:**
1. User sends message in group with 5 previous messages
2. System processes each character sequentially
3. Each character sees progressively updated context
4. System returns array of 3 responses
5. Frontend displays all responses

### UC2: Single Character in Group
**Actors:** User, 1 Character
**Flow:**
1. User sends message in "group" with 1 character
2. System processes single character
3. Returns array with 1 message
4. Behaves like regular chat but with group format

### UC3: Partial Failure
**Actors:** User, 3 Characters (one fails)
**Flow:**
1. User sends message
2. Character 1 responds successfully
3. Character 2 fails (LLM error)
4. Character 3 processes successfully with Character 1's response
5. System returns array with 2 messages and error info

## Design Constraints

### Message History Management
- Use sliding window of last 5 messages for each character
- Character 1 sees: original 5 messages
- Character 2 sees: messages 2-6 (includes Character 1's response)
- Character 3 sees: messages 3-7 (includes Character 1 & 2's responses)

### Emotion Detection
- Each character gets individual emotion analysis
- Emotions calculated based on their unique knowledge base
- Temperature adjustment per character

### Configuration
- Max characters per group (default: 10)
- Message window size (default: 5)
- Timeout per character (default: 30 seconds)
- Total group timeout (default: 5 minutes)

## Out of Scope (Phase 1)

- Frontend implementation (separate task)
- Group persistence/storage (groups are ephemeral, defined by frontend)
- User management within groups
- Group settings/configuration UI
- Inter-character awareness (characters don't know about each other)

## Success Criteria

### Phase 1 (Architecture Design)
- [ ] Complete folder structure created
- [ ] All class signatures defined with docstrings
- [ ] Method declarations with type hints
- [ ] No implementation code (only `pass` statements)
- [ ] Configuration files created
- [ ] Dependencies added to requirements.txt
- [ ] Architecture documented in this file
- [ ] README.md files updated

### Phase 2 (TDD)
- [ ] Comprehensive unit tests for `GroupChatService`
- [ ] Integration tests for multi-character processing
- [ ] E2E tests for complete flow
- [ ] Edge case tests (empty, single, failures)
- [ ] All tests written before implementation

### Phase 3 (Implementation)
- [ ] All tests passing
- [ ] Group chat endpoint functional
- [ ] Integration with existing chat system
- [ ] Error handling implemented
- [ ] Performance acceptable (< 30s per character)

## Questions and Assumptions

### Assumptions
1. Groups are stateless - no group entity stored in database
2. Frontend manages group membership
3. Messages are stored with character_id, not group_id
4. Each character processes independently (no inter-character context)
5. Sequential processing is acceptable (not parallel)

### Open Questions
1. Should we limit max group size? (Proposed: 10 characters)
2. How to handle very slow characters? (Proposed: 30s timeout per character)
3. Should failed characters block subsequent characters? (Proposed: No, continue with available responses)
4. Do we need group-level conversation KB? (Proposed: No, use individual character KBs)

## References

- Existing `ChatService` implementation: `/home/denis/Projects/chat_to/backend/chat_handler/chat_service.py`
- Message routes pattern: `/home/denis/Projects/chat_to/backend/api/message_routes.py`
- Emotion detection: `/home/denis/Projects/chat_to/backend/llm/emotion_detector.py`
- Project architecture: `/home/denis/Projects/chat_to/CLAUDE.md`

---

# Architecture Design (Phase 1 - COMPLETED)

**Date:** 2025-12-19
**Status:** Complete

## Created Structure

```
backend/
├── configs/
│   ├── group_chat_config.py                    # Group chat configuration constants
│   └── group_chat_config_README.md             # Configuration documentation
├── models/
│   ├── group_message.py                        # Group chat data models
│   └── group_message_README.md                 # Models documentation
├── chat_handler/
│   ├── group_chat_service.py                   # Multi-character orchestration service
│   └── group_chat_service_README.md            # Service documentation
└── api/
    ├── group_message_routes.py                 # Group chat REST endpoints
    └── group_message_routes_README.md          # API documentation
```

### Updated Files
- `backend/models/__init__.py` - Exported GroupMessageRequest, GroupMessageResponse, CharacterResponse
- `backend/chat_handler/__init__.py` - Exported GroupChatService
- `backend/configs/__init__.py` - Exported group chat configuration constants
- `llm_readme.md` - Updated with group chat architecture information

## Components Overview

### 1. Configuration Module (`configs/group_chat_config.py`)

**Purpose:** Centralized configuration for group chat behavior

**Constants:**
- `MAX_CHARACTERS_PER_GROUP: int = 10` - Maximum characters in a group
- `MESSAGE_WINDOW_SIZE: int = 5` - Sliding window size for context
- `CHARACTER_TIMEOUT_SECONDS: int = 30` - Per-character timeout
- `TOTAL_GROUP_TIMEOUT_SECONDS: int = 300` - Total group processing timeout
- `CONTINUE_ON_CHARACTER_FAILURE: bool = True` - Partial success behavior

**Dependencies:** None (Level 0)

### 2. Data Models Module (`models/group_message.py`)

**Purpose:** Pydantic models for group chat requests and responses

**Classes:**

#### GroupMessageRequest
- Fields: `content: str`, `character_ids: List[str]`
- Validation: Non-empty, unique character IDs
- Purpose: Request payload for group chat endpoint

#### CharacterResponse
- Fields: `character_id: str`, `character_name: str`, `message: Optional[Message]`, `error: Optional[str]`, `success: bool`
- Purpose: Individual character's response with success/failure state

#### GroupMessageResponse
- Fields: `user_message: Message`, `character_responses: List[CharacterResponse]`, `total_characters: int`, `successful_responses: int`, `failed_responses: int`
- Purpose: Complete response containing all character responses

**Dependencies:** `models.message.Message` (Level 0)

### 3. Service Module (`chat_handler/group_chat_service.py`)

**Purpose:** Orchestrates sequential multi-character message processing

**Class:** GroupChatService

**Public Methods:**
- `__init__(character_repository, message_repository)` - Initialize service
- `async process_group_message(user_message_content, character_ids, kb_managers, ollama_client) -> GroupMessageResponse` - Main processing method

**Private Methods:**
- `_validate_characters(character_ids)` - Validate existence and group size
- `_save_user_message(content, character_ids)` - Persist user message
- `_get_message_window(character_id, additional_messages, window_size)` - Get sliding context window
- `_process_character(character, user_message, message_window, kb_manager, ollama_client)` - Process single character
- `_generate_character_response(character, user_message_content, message_window, kb_manager, ollama_client)` - Generate response via ChatService
- `_save_character_message(character_id, message)` - Persist character message
- `_calculate_response_stats(responses)` - Count success/failure

**Responsibilities:**
1. Validate character list
2. Save user message
3. Sequential character processing with sliding window
4. Error handling and partial success
5. Statistics calculation

**Dependencies:**
- `models` (Message, GroupMessageResponse, CharacterResponse, Character)
- `storage` (MessageRepository, CharacterRepository)
- `chat_handler` (ChatService)
- `knowledge_base` (KnowledgeBaseManager)
- `llm` (OllamaClient)
- `exceptions` (CharacterNotFoundError, LLMError)
- `configs.group_chat_config`

**Level:** 4 (Same as ChatService)

### 4. API Module (`api/group_message_routes.py`)

**Purpose:** REST endpoint for group chat operations

**Endpoints:**

#### POST /api/groups/messages
- Request: `GroupMessageRequest`
- Response: `GroupMessageResponse`
- Status Codes: 200 (success), 400 (validation error), 404 (character not found), 500 (server error), 504 (timeout)

**Dependencies:**
- All FastAPI dependencies (get_character_repo, get_message_repo, etc.)
- Helper: `_create_kb_managers(character_ids, embedding_generator, text_chunker)`

**Responsibilities:**
1. Request validation
2. Character verification
3. KB manager creation for each character
4. GroupChatService invocation
5. Error handling and HTTP response mapping

**Dependencies:** Same as GroupChatService + FastAPI
**Level:** 5 (Presentation layer)

## Implementation Recommendations

### Phase 2: Test Development (TDD)

#### Unit Tests (`tests/unit/test_group_chat_service.py`)

**GroupChatService Tests:**

1. **Validation Tests**
   ```python
   test_validate_characters_success()
   test_validate_characters_exceeds_max_limit()
   test_validate_characters_not_found()
   test_validate_characters_empty_list()
   test_validate_characters_duplicate_ids()
   ```

2. **Message Window Tests**
   ```python
   test_get_message_window_empty_additional()  # Only DB messages
   test_get_message_window_with_additional()    # DB + new messages
   test_get_message_window_sliding_correctly()  # Window size enforcement
   test_get_message_window_less_than_size()     # Edge case
   ```

3. **Character Processing Tests**
   ```python
   test_process_character_success()
   test_process_character_llm_error()
   test_process_character_timeout()
   test_process_character_kb_error()
   ```

4. **Statistics Tests**
   ```python
   test_calculate_response_stats_all_success()
   test_calculate_response_stats_all_failure()
   test_calculate_response_stats_mixed()
   ```

#### Integration Tests (`tests/integration/test_group_chat_integration.py`)

1. **Multi-Character Flow**
   ```python
   test_process_group_message_all_success()        # Happy path
   test_process_group_message_partial_failure()    # Some fail
   test_process_group_message_all_failure()        # All fail
   test_process_group_message_single_character()   # Edge case
   ```

2. **Context Propagation**
   ```python
   test_sequential_context_includes_previous_responses()
   test_message_window_slides_correctly()
   test_each_character_sees_unique_window()
   ```

3. **Database Integration**
   ```python
   test_user_message_persisted()
   test_character_messages_persisted()
   test_messages_associated_correctly()
   ```

4. **Emotion Detection**
   ```python
   test_emotions_detected_per_character()
   test_temperature_varies_by_character()
   ```

#### API Tests (`tests/integration/test_group_message_routes.py`)

1. **Request Validation**
   ```python
   test_send_group_message_valid_request()
   test_send_group_message_empty_character_ids()
   test_send_group_message_duplicate_character_ids()
   test_send_group_message_exceeds_max_group_size()
   test_send_group_message_invalid_character_id()
   ```

2. **Response Format**
   ```python
   test_response_includes_all_fields()
   test_response_ordering_matches_request()
   test_partial_failure_response_format()
   ```

3. **Error Handling**
   ```python
   test_404_character_not_found()
   test_400_validation_error()
   test_500_server_error()
   test_504_timeout()
   ```

#### E2E Tests (`tests/e2e/test_group_chat_e2e.py`)

```python
test_full_group_chat_flow()                    # Complete happy path
test_group_chat_with_real_characters()         # Integration with existing data
test_group_chat_emotions_and_kb_search()       # Full RAG pipeline
test_group_chat_message_persistence()          # Database state verification
```

### Phase 3: Implementation

#### Implementation Order

1. **Start with Models** (Simplest, no dependencies)
   - Implement `GroupMessageRequest` validation
   - Implement `CharacterResponse` construction
   - Implement `GroupMessageResponse` construction
   - Run model tests

2. **Configuration** (Already complete - just constants)
   - No implementation needed
   - Tests verify constants exist and have correct types

3. **GroupChatService Core Methods** (Bottom-up within class)
   - Implement `_validate_characters`
   - Implement `_save_user_message`
   - Implement `_calculate_response_stats`
   - Implement `_save_character_message`
   - Run unit tests for these methods

4. **GroupChatService Message Window**
   - Implement `_get_message_window`
   - Run message window tests
   - Verify sliding window logic

5. **GroupChatService Character Processing**
   - Implement `_generate_character_response` (wrapper around ChatService)
   - Implement `_process_character` (with timeout and error handling)
   - Run character processing tests

6. **GroupChatService Main Method**
   - Implement `process_group_message` (orchestration)
   - Run integration tests
   - Verify sequential processing and context propagation

7. **API Routes**
   - Implement dependency injection functions
   - Implement `_create_kb_managers` helper
   - Implement `send_group_message` endpoint
   - Run API tests

8. **Main.py Integration**
   - Register router in main.py
   - Run E2E tests
   - Manual testing with real data

#### Key Implementation Details

**Sliding Window Logic:**
```python
async def _get_message_window(
    self,
    character_id: str,
    additional_messages: List[Message],
    window_size: int = MESSAGE_WINDOW_SIZE
) -> List[Message]:
    # 1. Get recent messages from database
    db_messages = await self.message_repository.get_messages_by_character(
        character_id, limit=window_size * 2, offset=0  # Get extra for safety
    )

    # 2. Combine with additional messages (from this request)
    all_messages = db_messages + additional_messages

    # 3. Sort by timestamp (oldest first)
    all_messages.sort(key=lambda m: m.created_at)

    # 4. Take last window_size messages
    return all_messages[-window_size:]
```

**Sequential Processing with Timeout:**
```python
async def process_group_message(self, ...):
    # 1. Validate
    characters = await self._validate_characters(character_ids)

    # 2. Save user message
    user_message = await self._save_user_message(user_message_content, character_ids)

    # 3. Process each character
    responses = []
    additional_messages = [user_message]  # Start with user message

    for character in characters:
        # Get message window (includes previous responses)
        message_window = await self._get_message_window(
            character.id, additional_messages
        )

        # Process with timeout
        try:
            async with asyncio.timeout(CHARACTER_TIMEOUT_SECONDS):
                response = await self._process_character(
                    character, user_message, message_window,
                    kb_managers[character.id], ollama_client
                )
        except asyncio.TimeoutError:
            response = CharacterResponse(
                character_id=character.id,
                character_name=character.name,
                message=None,
                error="Character response timeout",
                success=False
            )

        responses.append(response)

        # Add successful response to additional_messages for next character
        if response.success and response.message:
            additional_messages.append(response.message)
            await self._save_character_message(character.id, response.message)

    # 4. Build response
    successful, failed = self._calculate_response_stats(responses)
    return GroupMessageResponse(
        user_message=user_message,
        character_responses=responses,
        total_characters=len(responses),
        successful_responses=successful,
        failed_responses=failed
    )
```

**ChatService Reuse:**
```python
async def _generate_character_response(self, character, user_message_content, message_window, kb_manager, ollama_client):
    # Create ChatService instance for this character
    chat_service = ChatService(
        character_id=character.id,
        character_name=character.name,
        kb_manager=kb_manager,
        ollama_client=ollama_client,
        message_repository=self.message_repository
    )

    # Use internal method to generate response
    # (Don't use process_message as it saves to DB)
    response_text, emotions = await chat_service._generate_response(user_message_content)

    # Create Message object
    from uuid import uuid4
    from datetime import datetime

    message = Message(
        id=str(uuid4()),
        character_id=character.id,
        role="assistant",
        content=response_text,
        created_at=datetime.utcnow(),
        emotions=emotions
    )

    return message
```

**API Endpoint:**
```python
@router.post("/", response_model=GroupMessageResponse)
async def send_group_message(request: GroupMessageRequest, ...):
    try:
        # 1. Create KB managers for all characters
        kb_managers = _create_kb_managers(
            request.character_ids, embedding_generator, text_chunker
        )

        # 2. Create Ollama client (reused for all characters)
        ollama_client = OllamaClient()

        # 3. Process group message with total timeout
        async with asyncio.timeout(TOTAL_GROUP_TIMEOUT_SECONDS):
            response = await group_chat_service.process_group_message(
                user_message_content=request.content,
                character_ids=request.character_ids,
                kb_managers=kb_managers,
                ollama_client=ollama_client
            )

        return response

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except CharacterNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Group message processing timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process group message: {str(e)}")
```

## Considerations

### Edge Cases

1. **Empty character_ids**: Rejected at Pydantic validation level
2. **Single character**: Works normally, returns array with 1 response
3. **All characters fail**: Returns response with all failed CharacterResponse objects
4. **Very long messages**: Limited by existing message content validation
5. **Database unavailable**: Fails fast at validation stage
6. **LLM unavailable**: Each character marked as failed, continues to next

### Performance Notes

**Expected Processing Times:**
- Single character: ~5-10 seconds (2 LLM calls: emotion + response)
- Three characters: ~15-30 seconds (sequential)
- Ten characters (max): ~50-100 seconds (worst case)
- Timeout protection: 30s per character, 300s total

**Optimization Opportunities (Future):**
- Cache KB managers if group composition is stable
- Parallel processing option (config flag)
- Streaming responses via SSE
- Request queuing for rate limiting

### Security Notes

1. **Input Validation**: Pydantic handles basic validation
2. **Character Access**: Future enhancement - verify user permissions
3. **Rate Limiting**: Group chat more expensive than single chat - needs lower limits
4. **Resource Limits**: MAX_CHARACTERS_PER_GROUP prevents abuse

### Testing Strategy Summary

**Test Coverage Goals:**
- Unit tests: 100% of public methods
- Integration tests: All multi-character scenarios
- E2E tests: Complete flow with real data
- Edge cases: All failure modes covered

**Test Data:**
- Use existing test characters (Hegel, Marx, Stalin)
- Mock KnowledgeBaseManager for unit tests
- Real DB for integration tests
- Isolated test database for E2E

### Future Enhancements

1. **Group Persistence**: Add Group entity to database
2. **Parallel Processing**: Config option for speed vs context trade-off
3. **Response Streaming**: Server-Sent Events for real-time updates
4. **Inter-character Awareness**: Characters can reference each other
5. **Custom Ordering**: Priority-based character sequencing
6. **Group-level KB**: Shared context across group members
7. **User Permissions**: Authorization for group access

## Success Criteria - Updated

### Phase 1 (Architecture Design) - ✅ COMPLETED
- ✅ Complete folder structure created
- ✅ All class signatures defined with docstrings
- ✅ Method declarations with type hints
- ✅ No implementation code (only `pass` statements)
- ✅ Configuration files created
- ✅ Dependencies identified (no new requirements.txt needed)
- ✅ Architecture documented in this file
- ✅ README.md files created for all modules
- ✅ llm_readme.md updated

### Next Steps

**Phase 2: TDD**
1. Create test file structure under `tests/`
2. Write unit tests for GroupChatService
3. Write integration tests for multi-character flow
4. Write API tests for endpoint
5. Write E2E tests for complete flow
6. Ensure all tests fail initially (no implementation)

**Phase 3: Implementation**
1. Implement following the order above
2. Run tests after each component
3. Iterate until all tests pass
4. Register router in main.py
5. Manual testing with real characters
6. Performance verification
