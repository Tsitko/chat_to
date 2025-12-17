# Storage Module

**Layer:** Data (Level 1)
**Dependencies:** SQLAlchemy, models, exceptions
**Purpose:** Data persistence layer for characters, books, messages, and files

## File Map

| File | Description |
|------|-------------|
| `database.py` | SQLAlchemy ORM models and database setup |
| `character_repository.py` | Character and book CRUD operations |
| `message_repository.py` | Message persistence and retrieval |
| `file_storage.py` | File system operations for avatars and books |
| `sync_repositories.py` | Synchronous wrapper for sync contexts |

## Key Components

### `database.py`
**Purpose:** Database initialization and ORM models

**Entities:**
- `CharacterDB` - SQLAlchemy model for characters table
- `BookDB` - SQLAlchemy model for books table
- `MessageDB` - SQLAlchemy model for messages table

**Functions:**
- `get_async_session()` - Async session factory
- `get_sync_session()` - Sync session factory (for background tasks)
- `init_db()` - Initialize database tables

**Database:** SQLite with AsyncSession support

**Dependencies:** SQLAlchemy, aiosqlite

### `character_repository.py`
**Purpose:** Character and book CRUD operations

**Key Methods:**
- `create_character(character: Character) -> Character`
- `get_character_by_id(character_id: str) -> Optional[Character]`
- `get_all_characters() -> List[Character]`
- `update_character(character_id: str, name: str, avatar_url: Optional[str]) -> Character`
- `delete_character(character_id: str)`
- `add_book_to_character(character_id: str, book: Book) -> Character`
- `remove_book_from_character(character_id: str, book_id: str) -> Character`
- `mark_book_as_indexed(character_id: str, book_id: str) -> Character`

**Supports:** Both async and sync sessions

**Dependencies:** models, exceptions, database

### `message_repository.py`
**Purpose:** Message persistence and retrieval with pagination

**Key Methods:**
- `save_message(character_id: str, message: Message) -> Message`
- `get_messages(character_id: str, limit: int, offset: int) -> tuple[List[Message], int]`
- `get_recent_messages(character_id: str, count: int) -> List[Message]`
- `delete_all_messages(character_id: str)`

**Features:**
- Pagination support
- Returns total count for pagination
- Orders messages chronologically

**Dependencies:** models, exceptions, database

### `file_storage.py`
**Purpose:** File system operations for uploaded files

**Key Methods:**
- `save_avatar(character_id: str, file_content: bytes, filename: str) -> str`
- `get_avatar_path(character_id: str) -> Optional[str]`
- `save_book(character_id: str, book_id: str, file_content: bytes, filename: str) -> str`
- `read_book_content(character_id: str, book_id: str) -> bytes`
- `delete_book(character_id: str, book_id: str)`
- `delete_character_data(character_id: str)`

**Storage Structure:**
```
data/
├── avatars/{character_id}.{ext}
└── books/{character_id}/{book_id}/{filename}
```

**Dependencies:** pathlib, shutil, exceptions

### `sync_repositories.py`
**Purpose:** Synchronous wrappers for background tasks

**Key Classes:**
- `SyncCharacterRepository` - Sync wrapper for character operations
- `SyncMessageRepository` - Sync wrapper for message operations

**Usage:** Background tasks that can't use async (indexing service)

**Dependencies:** character_repository, message_repository

## Interface Signatures

```python
# CharacterRepository (async/sync)
async def create_character(character: Character) -> Character
async def get_character_by_id(character_id: str) -> Optional[Character]
async def get_all_characters() -> List[Character]
async def update_character(character_id: str, name: str, avatar_url: Optional[str]) -> Character
async def delete_character(character_id: str)
async def add_book_to_character(character_id: str, book: Book) -> Character
async def remove_book_from_character(character_id: str, book_id: str) -> Character
async def mark_book_as_indexed(character_id: str, book_id: str) -> Character

# MessageRepository (async/sync)
async def save_message(character_id: str, message: Message) -> Message
async def get_messages(character_id: str, limit: int = 10, offset: int = 0) -> tuple[List[Message], int]
async def get_recent_messages(character_id: str, count: int = 5) -> List[Message]
async def delete_all_messages(character_id: str)

# FileStorage
def save_avatar(character_id: str, file_content: bytes, filename: str) -> str
def get_avatar_path(character_id: str) -> Optional[str]
def save_book(character_id: str, book_id: str, file_content: bytes, filename: str) -> str
def read_book_content(character_id: str, book_id: str) -> bytes
def delete_book(character_id: str, book_id: str)
def delete_character_data(character_id: str)
```

## Data Flow

**Character Creation Flow:**
1. API receives character data + files
2. `CharacterRepository.create_character()` saves to database
3. `FileStorage.save_avatar()` saves avatar file
4. `FileStorage.save_book()` saves book files
5. Returns Character model with file URLs

**Message Flow:**
1. `MessageRepository.save_message()` persists to database
2. `MessageRepository.get_messages()` retrieves with pagination
3. Total count returned for pagination UI

**File Storage Flow:**
1. Files saved to `data/` directory with organized structure
2. Character ID used as primary directory key
3. Book files organized by book ID subdirectories

## Usage Notes

- Repository supports both async and sync sessions
- Use async for API requests, sync for background tasks
- `FileStorage` is synchronous (filesystem operations)
- Database auto-creates tables on initialization
- All file operations handle missing files gracefully
- Character deletion cascades to books and messages
