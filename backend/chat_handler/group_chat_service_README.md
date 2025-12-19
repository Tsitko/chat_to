# GroupChatService Module

## Purpose
Orchestrates sequential message processing across multiple characters in a group chat context. Each character receives progressively updated context including previous characters' responses within the same request.

## Class: GroupChatService

### Responsibility
Coordinates the complete group chat flow from user message to multiple character responses.

### Key Concepts

#### Sequential Processing
Characters process the message one at a time, in order:
1. Character 1 sees: original message history
2. Character 2 sees: original history + Character 1's response
3. Character 3 sees: original history + Character 1 & 2's responses
4. And so on...

#### Sliding Message Window
Each character receives a window of recent messages (configurable size):
- Window size: MESSAGE_WINDOW_SIZE (default: 5)
- Window slides forward as new responses are added
- Ensures context remains manageable and relevant

#### Partial Success
If a character fails, remaining characters still process (configurable):
- Failed character: CharacterResponse with error info
- Subsequent characters: Continue with available responses
- Final response includes both successful and failed responses

### Constructor

```python
def __init__(
    self,
    character_repository: CharacterRepository,
    message_repository: MessageRepository
)
```

**Parameters:**
- `character_repository` - For character data access and validation
- `message_repository` - For message persistence and retrieval

**Note:** KB managers and Ollama client are passed per-request, not stored.

### Public Methods

#### process_group_message
Main entry point for group chat processing.

```python
async def process_group_message(
    self,
    user_message_content: str,
    character_ids: List[str],
    kb_managers: Dict[str, KnowledgeBaseManager],
    ollama_client: OllamaClient
) -> GroupMessageResponse
```

**Flow:**
1. Validate characters (existence, group size limit)
2. Save user message to database
3. Initialize response tracking
4. For each character (sequential):
   a. Get message window (history + new responses)
   b. Process character with timeout
   c. Add response to tracking
   d. Continue or abort based on config
5. Build and return GroupMessageResponse

**Raises:**
- `ValueError` - Group size exceeds MAX_CHARACTERS_PER_GROUP
- `CharacterNotFoundError` - Invalid character_id

### Private Methods

#### _validate_characters
```python
async def _validate_characters(
    self,
    character_ids: List[str]
) -> List[Character]
```
- Checks group size against MAX_CHARACTERS_PER_GROUP
- Validates all character IDs exist
- Returns Character objects in same order as IDs

#### _save_user_message
```python
async def _save_user_message(
    self,
    content: str,
    character_ids: List[str]
) -> Message
```
- Creates user Message object
- Saves to database with first character's ID
- Returns saved message

**Design Note:** User message is associated with first character for database purposes, but conceptually belongs to the entire group.

#### _get_message_window
```python
async def _get_message_window(
    self,
    character_id: str,
    additional_messages: List[Message],
    window_size: int = MESSAGE_WINDOW_SIZE
) -> List[Message]
```
- Retrieves recent messages from database
- Combines with additional messages (new responses in this request)
- Returns sliding window of specified size
- Messages are ordered chronologically (oldest first, newest last)

**Example:**
```
Database: [msg1, msg2, msg3, msg4, msg5]
Additional: [msg6 (char1 response), msg7 (char2 response)]
Window size: 5

For Character 3:
- All messages: [msg1, msg2, msg3, msg4, msg5, msg6, msg7]
- Window (last 5): [msg3, msg4, msg5, msg6, msg7]
```

#### _process_character
```python
async def _process_character(
    self,
    character: Character,
    user_message: Message,
    message_window: List[Message],
    kb_manager: KnowledgeBaseManager,
    ollama_client: OllamaClient
) -> CharacterResponse
```
- Wraps character processing with timeout and error handling
- Calls _generate_character_response
- On success: returns CharacterResponse with message
- On failure: returns CharacterResponse with error
- Applies CHARACTER_TIMEOUT_SECONDS

#### _generate_character_response
```python
async def _generate_character_response(
    self,
    character: Character,
    user_message_content: str,
    message_window: List[Message],
    kb_manager: KnowledgeBaseManager,
    ollama_client: OllamaClient
) -> Message
```
- Creates ChatService instance for the character
- Generates response using existing ChatService logic
- Includes emotion detection and KB search
- Returns assistant Message with emotions

**Design Note:** Reuses ChatService to maintain consistency with single-character chat.

#### _save_character_message
```python
async def _save_character_message(
    self,
    character_id: str,
    message: Message
) -> None
```
- Saves character's response to database
- Associates message with character_id

#### _calculate_response_stats
```python
def _calculate_response_stats(
    self,
    responses: List[CharacterResponse]
) -> tuple[int, int]
```
- Counts successful and failed responses
- Returns (successful_count, failed_count)

## Dependencies

### Direct Dependencies
- `models` - Message, GroupMessageResponse, CharacterResponse, Character
- `storage` - MessageRepository, CharacterRepository
- `chat_handler` - ChatService (for individual character processing)
- `knowledge_base` - KnowledgeBaseManager
- `llm` - OllamaClient
- `exceptions` - CharacterNotFoundError, LLMError
- `configs.group_chat_config` - Configuration constants

### Dependency Flow
```
GroupChatService → ChatService → KnowledgeBaseManager → Vector DB
                → MessageRepository → Database
                → CharacterRepository → Database
                → OllamaClient → Ollama API
```

## Error Handling

### Character Not Found
- Raised during validation phase
- All characters must exist before processing starts
- Returns 404 to client

### Group Size Exceeded
- Raised during validation phase
- Prevents processing of oversized groups
- Returns 400 to client

### Character Processing Failure
- Caught per-character (if CONTINUE_ON_CHARACTER_FAILURE=True)
- Logged and included in response as failed CharacterResponse
- Does not block subsequent characters

### Timeout
- Per-character timeout: CHARACTER_TIMEOUT_SECONDS
- Treated as processing failure
- Allows continuation to next character

### LLM Errors
- Caught and wrapped in CharacterResponse
- Error message included in response
- Marked as failed

## Testing Strategy

### Unit Tests
- `test_validate_characters_success` - Valid character list
- `test_validate_characters_exceeds_limit` - Too many characters
- `test_validate_characters_not_found` - Invalid character ID
- `test_save_user_message` - Message persistence
- `test_get_message_window_empty_additional` - Window from DB only
- `test_get_message_window_with_additional` - Combined window
- `test_get_message_window_sliding` - Correct sliding behavior
- `test_calculate_response_stats` - Count accuracy

### Integration Tests
- `test_process_group_message_all_success` - All characters respond
- `test_process_group_message_partial_failure` - Some fail, some succeed
- `test_process_group_message_all_failure` - All characters fail
- `test_process_group_message_single_character` - Edge case
- `test_sequential_context_propagation` - Verify context passing
- `test_character_timeout` - Timeout handling
- `test_message_persistence` - Database operations

### E2E Tests
- `test_full_group_chat_flow` - Complete flow from request to response
- `test_emotion_detection_in_group` - Emotions per character
- `test_knowledge_base_integration` - KB search per character

## Implementation Notes

### Why Sequential, Not Parallel?
Sequential processing is intentional:
1. Later characters receive context from earlier responses
2. Creates more natural conversation flow
3. Simulates round-table discussion
4. Simpler error handling and state management

### Message Window Sliding
```
Original DB: [1, 2, 3, 4, 5]
User message: 6

Character 1: [2, 3, 4, 5, 6] → response 7
Character 2: [3, 4, 5, 6, 7] → response 8
Character 3: [4, 5, 6, 7, 8] → response 9
```

### ChatService Reuse
GroupChatService wraps ChatService rather than duplicating logic:
- Maintains consistency with single-character chat
- Reuses emotion detection and KB search
- Simplifies testing and maintenance
- Single source of truth for chat logic

### Database Association
User messages are associated with the first character's ID:
- Enables standard message queries
- Doesn't require new database schema
- Group membership is managed by frontend
- Future enhancement: add group_id field if needed
