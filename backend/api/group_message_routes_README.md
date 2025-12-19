# Group Message Routes Module

## Purpose
Defines FastAPI REST endpoints for group chat operations where multiple characters respond to a single user message.

## Endpoints

### POST /api/groups/messages

**Purpose:** Send a message to a group of characters and receive all responses

**Request Body:**
```json
{
  "content": "What is dialectical materialism?",
  "character_ids": ["hegel-uuid", "marx-uuid", "stalin-uuid"]
}
```

**Response (200 OK):**
```json
{
  "user_message": {
    "id": "user-msg-uuid",
    "role": "user",
    "content": "What is dialectical materialism?",
    "created_at": "2025-12-19T10:00:00Z",
    "character_id": "hegel-uuid"
  },
  "character_responses": [
    {
      "character_id": "hegel-uuid",
      "character_name": "Hegel",
      "message": {
        "id": "msg1-uuid",
        "role": "assistant",
        "content": "Dialectics is...",
        "created_at": "2025-12-19T10:00:05Z",
        "character_id": "hegel-uuid",
        "emotions": {
          "fear": 10,
          "anger": 5,
          "sadness": 8,
          "disgust": 3,
          "joy": 75
        }
      },
      "error": null,
      "success": true
    },
    {
      "character_id": "marx-uuid",
      "character_name": "Marx",
      "message": {
        "id": "msg2-uuid",
        "role": "assistant",
        "content": "Building on Hegel's point...",
        "created_at": "2025-12-19T10:00:12Z",
        "character_id": "marx-uuid",
        "emotions": {
          "fear": 5,
          "anger": 15,
          "sadness": 10,
          "disgust": 8,
          "joy": 60
        }
      },
      "error": null,
      "success": true
    },
    {
      "character_id": "stalin-uuid",
      "character_name": "Stalin",
      "message": null,
      "error": "LLM timeout after 30 seconds",
      "success": false
    }
  ],
  "total_characters": 3,
  "successful_responses": 2,
  "failed_responses": 1
}
```

**Error Responses:**

```json
// 400 Bad Request - Group size exceeded
{
  "detail": "Group size 15 exceeds maximum of 10"
}

// 400 Bad Request - Validation error
{
  "detail": "character_ids must be unique"
}

// 404 Not Found - Character doesn't exist
{
  "detail": "Character abc-123 not found"
}

// 500 Internal Server Error
{
  "detail": "Failed to process group message: <error details>"
}

// 504 Gateway Timeout
{
  "detail": "Group message processing exceeded timeout of 300 seconds"
}
```

**Processing Flow:**
1. Validate request (character_ids format, group size)
2. Verify all characters exist
3. Create KnowledgeBaseManager for each character
4. Create OllamaClient instance
5. Call GroupChatService.process_group_message
6. Return response

**Timeout Behavior:**
- Individual character timeout: 30 seconds (CHARACTER_TIMEOUT_SECONDS)
- Total group timeout: 300 seconds (TOTAL_GROUP_TIMEOUT_SECONDS)
- If total timeout reached, returns partial results

## Dependencies

### FastAPI Dependencies

#### get_character_repo
```python
async def get_character_repo() -> CharacterRepository
```
- Provides CharacterRepository instance
- Uses database session factory
- Handles sync/async mode

#### get_message_repo
```python
async def get_message_repo() -> MessageRepository
```
- Provides MessageRepository instance
- Uses database session factory
- Handles sync/async mode

#### get_group_chat_service
```python
async def get_group_chat_service(
    character_repo: CharacterRepository,
    message_repo: MessageRepository
) -> GroupChatService
```
- Creates GroupChatService instance
- Injects repositories

### Helper Functions

#### _create_kb_managers
```python
def _create_kb_managers(
    character_ids: list[str],
    embedding_generator: EmbeddingGenerator,
    text_chunker: TextChunker
) -> Dict[str, KnowledgeBaseManager]
```
- Creates KnowledgeBaseManager for each character
- Uses character-specific ChromaDB clients
- Returns mapping of character_id → KnowledgeBaseManager

**Implementation:**
```python
kb_managers = {}
for character_id in character_ids:
    chroma_client = get_character_chroma_client(character_id)
    kb_manager = get_knowledge_base_manager(
        character_id, chroma_client, embedding_generator, text_chunker
    )
    kb_managers[character_id] = kb_manager
return kb_managers
```

## Dependencies Graph

```
group_message_routes.py
├── models (GroupMessageRequest, GroupMessageResponse)
├── storage (MessageRepository, CharacterRepository)
├── chat_handler (GroupChatService)
├── knowledge_base (KnowledgeBaseManager)
├── llm (OllamaClient)
├── embeddings (EmbeddingGenerator)
├── utils (TextChunker)
├── exceptions (CharacterNotFoundError, LLMError)
└── api.dependencies (get_character_chroma_client, etc.)
```

## Error Handling Strategy

### Validation Errors (400)
- Empty character_ids list
- Duplicate character_ids
- Group size exceeds MAX_CHARACTERS_PER_GROUP
- Invalid request format

### Not Found Errors (404)
- Any character_id doesn't exist
- Check performed before processing starts

### Server Errors (500)
- Unexpected exceptions during processing
- Database errors
- Logged with full traceback

### Timeout Errors (504)
- Total processing time exceeds TOTAL_GROUP_TIMEOUT_SECONDS
- Returns partial results if some characters completed
- Includes timeout info in response

### Partial Failures
- Not HTTP errors - returned as successful response
- Failed characters included in character_responses
- success=false, error field populated
- HTTP 200 with mixed results

## Testing Strategy

### Unit Tests
- `test_create_kb_managers` - Correct manager creation
- `test_get_character_repo_dependency` - Repository injection
- `test_get_message_repo_dependency` - Repository injection

### Integration Tests
- `test_send_group_message_success` - All characters respond
- `test_send_group_message_partial_failure` - Mixed results
- `test_send_group_message_invalid_character` - 404 error
- `test_send_group_message_group_too_large` - 400 error
- `test_send_group_message_empty_characters` - 400 error
- `test_send_group_message_duplicate_characters` - 400 error
- `test_send_group_message_timeout` - 504 error

### E2E Tests
- `test_full_group_chat_e2e` - Complete flow with real data
- `test_emotion_detection_per_character` - Verify emotions
- `test_sequential_context_propagation` - Context passing
- `test_message_persistence` - Database state

## API Integration

### Registration
The router must be registered in main.py:

```python
from api.group_message_routes import router as group_message_router

app.include_router(group_message_router)
```

### CORS Considerations
- Same origin policy as other endpoints
- No special CORS requirements

### Rate Limiting
Consider implementing:
- Per-IP rate limiting for group endpoints
- Lower limits than single-character chat (more expensive)
- Suggested: 10 requests/minute for group chat

## Performance Considerations

### Processing Time
- Sequential processing: 3 characters × 5 seconds = 15 seconds minimum
- With timeouts: could reach 3 × 30 seconds = 90 seconds
- Total timeout: 300 seconds prevents indefinite waiting

### Resource Usage
- Multiple KB searches (2 per character)
- Multiple LLM calls (2 per character: emotion + response)
- Database writes (1 user + N assistant messages)

### Optimization Opportunities
- Reuse OllamaClient across characters (already done)
- Cache KB managers if called multiple times (future)
- Implement request queuing for high load (future)

## Security Considerations

### Input Validation
- Validate character_ids format (UUID)
- Sanitize message content
- Enforce group size limits

### Authorization
- Future: verify user has access to all characters
- Future: verify group membership permissions

### Rate Limiting
- Prevent abuse of expensive group operations
- Track per-user/per-IP request counts

## Future Enhancements

### Group Persistence
- Store group entities in database
- Associate messages with group_id
- Track group chat history

### Parallel Processing Option
- Config flag for parallel vs sequential
- Use asyncio.gather for parallel
- Trade-off: speed vs context continuity

### Streaming Responses
- Stream character responses as they complete
- Use Server-Sent Events (SSE)
- Improves perceived performance

### Character Ordering
- Allow custom character order
- Prioritize certain characters
- Dynamic ordering based on relevance
