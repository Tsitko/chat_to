# Group Message Models Module

## Purpose
Defines Pydantic data models for group chat operations where multiple characters respond to a conversation sequentially.

## Models

### GroupMessageRequest
**Purpose:** Request payload for group chat endpoint

**Fields:**
- `content: str` - User message content (required)
- `character_ids: List[str]` - List of character IDs that should respond (min 1, unique)

**Validation:**
- Ensures character_ids is not empty
- Ensures no duplicate character IDs
- Pydantic validation for types

**Usage:**
```python
request = GroupMessageRequest(
    content="What is dialectics?",
    character_ids=["hegel-id", "marx-id", "stalin-id"]
)
```

### CharacterResponse
**Purpose:** Response from a single character in a group chat

**Fields:**
- `character_id: str` - ID of the character
- `character_name: str` - Name of the character
- `message: Optional[Message]` - Generated message (None if failed)
- `error: Optional[str]` - Error message if character failed
- `success: bool` - Whether character responded successfully

**States:**
- Success: `message` is populated, `error` is None, `success` is True
- Failure: `message` is None, `error` contains error description, `success` is False

**Usage:**
```python
# Successful response
response = CharacterResponse(
    character_id="hegel-id",
    character_name="Hegel",
    message=assistant_message,
    error=None,
    success=True
)

# Failed response
response = CharacterResponse(
    character_id="marx-id",
    character_name="Marx",
    message=None,
    error="LLM timeout",
    success=False
)
```

### GroupMessageResponse
**Purpose:** Complete response from group chat endpoint

**Fields:**
- `user_message: Message` - The user's message
- `character_responses: List[CharacterResponse]` - Responses from all characters (in order)
- `total_characters: int` - Total number of characters in group
- `successful_responses: int` - Number of successful responses
- `failed_responses: int` - Number of failed responses

**Invariants:**
- `total_characters == len(character_responses)`
- `successful_responses + failed_responses == total_characters`
- Responses are in same order as character_ids in request

**Usage:**
```python
response = GroupMessageResponse(
    user_message=user_msg,
    character_responses=[resp1, resp2, resp3],
    total_characters=3,
    successful_responses=2,
    failed_responses=1
)
```

## Dependencies
- `models.message.Message` - For individual messages
- `pydantic` - For data validation

## Data Flow

```
GroupMessageRequest → API Endpoint → GroupChatService → GroupMessageResponse
                                           ↓
                                    CharacterResponse (for each character)
```

## Testing Considerations

### GroupMessageRequest
- Valid request with multiple characters
- Single character (edge case)
- Empty character_ids (should fail validation)
- Duplicate character_ids (should fail validation)
- Invalid content (empty string)

### CharacterResponse
- Successful response with all fields
- Failed response with error message
- Validate success flag consistency

### GroupMessageResponse
- Multiple successful responses
- All failed responses
- Mixed success/failure
- Validate statistics correctness
- Validate response ordering
