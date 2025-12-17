# Vector Database Module

## File Map

- `chroma_client.py` - ChromaDB client wrapper for vector operations
- `__init__.py` - Package exports

## Key Components

### ChromaClient
- **Purpose**: Manage ChromaDB collections and vector operations
- **Entities**: Collections, documents, embeddings, metadata
- **I/O**:
  - Input: Collection names, documents, embeddings, query vectors
  - Output: Query results, operation success/failure
- **Dependencies**: chromadb, configs

## Interface Signatures

```python
class ChromaClient:
    def get_or_create_collection(collection_name: str) -> Collection
    def add_documents(collection_name: str, documents: List[str],
                     embeddings: List[List[float]], metadatas: List[Dict],
                     ids: List[str]) -> None
    def query_documents(collection_name: str, query_embedding: List[float],
                       n_results: int) -> Dict
    def delete_collection(collection_name: str) -> None
    def collection_exists(collection_name: str) -> bool
    def get_collection_count(collection_name: str) -> int
```

## Data Flow

1. Receives collection operations from knowledge_base module
2. Manages persistent SQLite-backed ChromaDB collections
3. Returns query results or confirms operations

## Dependencies

- **External**: chromadb
- **Internal**: configs (CHROMA_DIR), exceptions
