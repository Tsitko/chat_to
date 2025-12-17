# API Module

## File Map

- `character_routes.py` - Character CRUD endpoints
- `book_routes.py` - Book management endpoints
- `message_routes.py` - Chat/message endpoints
- `indexing_routes.py` - Indexing status endpoints
- `__init__.py` - Package exports

## Key Components

### Character Routes
- GET /api/characters - List all characters
- GET /api/characters/{id} - Get character details
- POST /api/characters - Create character
- PUT /api/characters/{id} - Update character
- DELETE /api/characters/{id} - Delete character
- GET /api/characters/{id}/avatar - Get avatar file

### Book Routes
- GET /api/characters/{id}/books - List character books
- POST /api/characters/{id}/books - Add book
- DELETE /api/characters/{id}/books/{book_id} - Delete book

### Message Routes
- GET /api/characters/{id}/messages - Get message history
- POST /api/characters/{id}/messages - Send message

### Indexing Routes
- GET /api/characters/{id}/indexing-status - Get indexing status

## Data Flow

1. Receive HTTP requests
2. Validate input
3. Call appropriate service layer (storage, chat_handler)
4. Return HTTP responses

## Dependencies

- **Imports from**: storage, chat_handler, models, utils, exceptions
- **Imported by**: main.py (FastAPI app)
