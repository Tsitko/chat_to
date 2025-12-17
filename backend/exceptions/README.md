# Exceptions Module

**Layer:** Base (Level 0)
**Dependencies:** None
**Purpose:** Custom exception hierarchy for error handling

## File Map

| File | Description |
|------|-------------|
| `base_exceptions.py` | All custom exception classes for the application |

## Key Components

### `base_exceptions.py`
**Purpose:** Define custom exception hierarchy for better error handling

**Exception Hierarchy:**
```
ChatToException (base)
├── CharacterNotFoundError
├── BookNotFoundError
├── InvalidFileTypeError
├── FileSizeExceededError
├── VectorDBError
├── EmbeddingError
├── LLMError
├── IndexingError
└── StorageError
```

**Dependencies:** None (Python standard library only)

## Interface Signatures

All exceptions follow standard Python exception interface:

```python
# Base exception
class ChatToException(Exception):
    """Base exception for all chat_to application errors."""

# Usage example
raise CharacterNotFoundError(f"Character {character_id} not found")
```

## Data Flow

**Exception Propagation:**
1. Lower-level modules raise specific exceptions
2. Higher-level modules catch and handle or re-raise
3. API layer converts exceptions to HTTP error responses

## Usage Notes

- Always raise specific exception types, never generic `Exception`
- Include descriptive error messages with context
- API routes handle these exceptions and convert to appropriate HTTP status codes
