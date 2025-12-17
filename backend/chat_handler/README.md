# Chat Handler Module

## File Map

- `chat_service.py` - Main chat orchestration service
- `indexing_service.py` - Asynchronous book indexing service
- `__init__.py` - Package exports

## Key Components

### ChatService
- **Purpose**: Orchestrate complete message flow
- **Entities**: User messages, assistant responses, context, prompts
- **I/O**:
  - Input: User message content
  - Output: MessageResponse (user + assistant messages)
- **Dependencies**: knowledge_base, llm, storage, models

### IndexingService
- **Purpose**: Manage asynchronous book indexing tasks
- **Entities**: Indexing jobs, status tracking
- **I/O**:
  - Input: Character ID, book ID, file content
  - Output: Indexing status updates
- **Dependencies**: knowledge_base, utils, storage

## Interface Signatures

```python
class ChatService:
    async def process_message(user_message_content: str) -> MessageResponse

class IndexingService:
    async def start_book_indexing(character_id: str, book_id: str,
                                  kb_manager: KnowledgeBaseManager) -> None
    async def get_indexing_status(character_id: str) -> Dict
```

## Data Flow

### Chat Flow
1. Receive user message
2. Search both KBs for context
3. Get recent message history
4. Build prompt with context
5. Generate LLM response
6. Save both messages
7. Index user message asynchronously

### Indexing Flow
1. Parse document file
2. Chunk text
3. Generate embeddings
4. Store in ChromaDB
5. Update status

## Dependencies

- **Imports from**: knowledge_base, llm, storage, utils, models
- **Imported by**: api
