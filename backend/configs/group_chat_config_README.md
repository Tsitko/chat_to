# Group Chat Configuration Module

## Purpose
Defines configuration constants for group chat functionality where multiple characters respond to a single user message sequentially.

## Configuration Parameters

### MAX_CHARACTERS_PER_GROUP
- **Type:** int
- **Default:** 10
- **Purpose:** Maximum number of characters allowed in a single group
- **Rationale:** Prevents excessive processing time and resource consumption

### MESSAGE_WINDOW_SIZE
- **Type:** int
- **Default:** 5
- **Purpose:** Number of recent messages to include in each character's context
- **Rationale:** Provides sufficient context while keeping prompt size manageable

### CHARACTER_TIMEOUT_SECONDS
- **Type:** int
- **Default:** 30
- **Purpose:** Maximum time (in seconds) allowed for a single character to generate a response
- **Rationale:** Prevents individual slow characters from blocking the entire group

### TOTAL_GROUP_TIMEOUT_SECONDS
- **Type:** int
- **Default:** 300 (5 minutes)
- **Purpose:** Maximum total time for processing all characters in a group
- **Rationale:** Provides reasonable upper bound for API response time

### CONTINUE_ON_CHARACTER_FAILURE
- **Type:** bool
- **Default:** True
- **Purpose:** Whether to continue processing remaining characters if one fails
- **Rationale:** Enables partial success - users still get responses from working characters

## Usage Example

```python
from configs import (
    MAX_CHARACTERS_PER_GROUP,
    MESSAGE_WINDOW_SIZE,
    CHARACTER_TIMEOUT_SECONDS
)

# Validate group size
if len(character_ids) > MAX_CHARACTERS_PER_GROUP:
    raise ValueError(f"Group size exceeds limit of {MAX_CHARACTERS_PER_GROUP}")

# Get message window
messages = get_recent_messages(limit=MESSAGE_WINDOW_SIZE)

# Set timeout for character processing
async with asyncio.timeout(CHARACTER_TIMEOUT_SECONDS):
    response = await process_character(character_id, messages)
```

## Dependencies
- None (pure configuration)

## Testing Considerations
- Test with groups at max size
- Test timeout behavior
- Test failure continuation logic
- Test message window sliding mechanism
