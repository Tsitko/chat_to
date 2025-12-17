# Models Module

**Layer:** Base (Level 0)
**Dependencies:** Pydantic
**Purpose:** Pydantic data models for validation and serialization

## File Map

| File | Description |
|------|-------------|
| `character.py` | Character and Book models with create/update variants |
| `message.py` | Message models for chat operations |
| `indexing.py` | Indexing status models |

## Key Components

### `character.py`
**Purpose:** Character and book data models

**Entities:**
- `Character` - Full character model with books list
- `Book` - Book metadata model
- `CharacterCreate` - Model for character creation (name only)
- `CharacterUpdate` - Model for character updates (optional fields)

**Key Fields:**
- `Character.id` - UUID string (auto-generated)
- `Character.name` - Character name
- `Character.avatar_url` - Optional avatar file path
- `Character.books` - List of Book objects
- `Book.indexed` - Boolean flag for indexing status

**Dependencies:** Pydantic, datetime, uuid

### `message.py`
**Purpose:** Message data models

**Entities:**
- `Message` - Single message (user or assistant)
- `MessageCreate` - Request model for new messages
- `MessageResponse` - Response with user + assistant messages
- `MessagesResponse` - Paginated message list response

**Key Fields:**
- `Message.role` - Literal["user", "assistant"]
- `Message.content` - Message text
- `MessagesResponse.total` - Total message count for pagination

**Dependencies:** Pydantic, datetime, uuid

### `indexing.py`
**Purpose:** Indexing status tracking models

**Entities:**
- `BookIndexingStatus` - Status for single book indexing
- `IndexingStatusResponse` - Overall indexing status

**Dependencies:** Pydantic

## Interface Signatures

```python
# Character operations
Character(id, name, avatar_url, created_at, books: List[Book])
CharacterCreate(name: str)
CharacterUpdate(name: Optional[str] = None)

# Book model
Book(id, character_id, filename, file_size, uploaded_at, indexed: bool)

# Message operations
Message(id, role: Literal["user", "assistant"], content, created_at)
MessageCreate(content: str)
MessageResponse(user_message: Message, assistant_message: Message)
MessagesResponse(messages: List[Message], total: int)

# Indexing status
BookIndexingStatus(book_id, status, progress)
IndexingStatusResponse(books_indexing: List[BookIndexingStatus], overall_status)
```

## Data Flow

**Validation Flow:**
1. API receives JSON data
2. Pydantic validates against model schema
3. Raises ValidationError if invalid
4. Valid model passed to service layer

**Serialization Flow:**
1. Service returns model instance
2. FastAPI automatically serializes to JSON
3. Response includes only defined fields

## Usage Notes

- All models use Pydantic for automatic validation
- UUIDs auto-generated using `uuid.uuid4()`
- Timestamps auto-generated using `datetime.utcnow()`
- Use `CharacterCreate/Update` for API requests, `Character` for responses
- `MessagesResponse.total` enables pagination in frontend
