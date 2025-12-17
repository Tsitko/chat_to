# Knowledge Base Module

## File Map

- `knowledge_base_manager.py` - Dual knowledge base manager (books + conversations)
- `__init__.py` - Package exports

## Key Components

### KnowledgeBaseManager
- **Purpose**: Manage two knowledge bases per character (books and conversations)
- **Entities**: Book chunks, conversation messages, embeddings, search results
- **I/O**:
  - Input: Book texts, messages, search queries
  - Output: Search results (relevant context)
- **Dependencies**: vector_db, embeddings, utils

## Interface Signatures

```python
class KnowledgeBaseManager:
    async def index_book(book_id: str, book_text: str) -> None
    async def index_message(message_id: str, message_content: str) -> None
    async def search_books_kb(query: str, n_results: int) -> List[str]
    async def search_conversations_kb(query: str, n_results: int) -> List[str]
    async def delete_book_from_kb(book_id: str) -> None
    async def delete_all_knowledge_bases() -> None
```

## Data Flow

1. **Indexing**: Text → TextChunker → EmbeddingGenerator → ChromaClient
2. **Searching**: Query → EmbeddingGenerator → ChromaClient → Results

## Dependencies

- **Imports from**: vector_db (ChromaClient), embeddings (EmbeddingGenerator), utils (TextChunker)
- **Imported by**: chat_handler, api
