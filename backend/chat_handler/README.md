# Chat Handler Module

## File Map

- `chat_service.py` - Main chat orchestration service
- `indexing_service.py` - Asynchronous book indexing service
- `__init__.py` - Package exports

## Key Components

### ChatService
- **Purpose**: Orchestrate complete message flow with emotion detection
- **Entities**: User messages, assistant responses, context, prompts, emotions
- **I/O**:
  - Input: User message content
  - Output: MessageResponse (user + assistant messages with emotions)
- **Dependencies**: knowledge_base, llm (OllamaClient, PromptBuilder, EmotionDetector), storage, models

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

### Chat Flow (with Emotion Detection and Context Reuse)
1. Receive user message
2. Get recent message history
3. **Search both KBs for context** (books KB + conversations KB)
4. **Detect emotions with books_context** (EmotionDetector analyzes chat + character knowledge)
5. Calculate dynamic temperature based on emotions (0.1/0.3/0.5)
6. **Build prompt with context and emotions** (reuses books_context from step 3)
7. Generate LLM response with dynamic temperature
8. Save both messages with detected emotions
9. Index user message asynchronously into conversations KB

**Key Optimization**: books_context retrieved in step 3 is reused in steps 4 and 6, eliminating duplicate KB queries.

### Indexing Flow
1. Parse document file
2. Chunk text
3. Generate embeddings
4. Store in ChromaDB
5. Update status

## Dependencies

- **Imports from**: knowledge_base, llm, storage, utils, models
- **Imported by**: api
