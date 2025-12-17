# Embeddings Module

**Layer:** Logic (Level 2)
**Dependencies:** configs, exceptions
**Purpose:** Generate text embeddings via Ollama API

## File Map

| File | Description |
|------|-------------|
| `embedding_generator.py` | Ollama-based embedding generation for indexing and search |

## Key Components

### `embedding_generator.py`
**Purpose:** Generate embeddings for text chunks and queries

**Key Class:** `EmbeddingGenerator`

**Key Methods:**
- `generate_indexing_embedding(text: str) -> List[float]` - For document indexing
- `generate_query_embedding(text: str) -> List[float]` - For search queries
- `generate_batch_embeddings(texts: List[str], for_indexing: bool) -> List[List[float]]` - Batch processing

**Models Used:**
- Indexing: `qwen-embeddings-indexer` (from config)
- Querying: `qwen-embeddings-kb` (from config)

**Implementation:**
- Uses Ollama HTTP API (`/api/embeddings` endpoint)
- Synchronous HTTP requests via `httpx`
- Returns normalized embedding vectors

**Error Handling:**
- Raises `EmbeddingError` if API call fails
- Includes error context (text length, model name)

**Dependencies:** httpx, configs.ollama_models, exceptions

## Interface Signatures

```python
class EmbeddingGenerator:
    def __init__(self, ollama_base_url: str = "http://localhost:11434"):
        """
        Initialize embedding generator.

        Args:
            ollama_base_url: Ollama server URL (default: http://localhost:11434)
        """

    def generate_indexing_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for document indexing.

        Args:
            text: Text to embed

        Returns:
            List of float values (embedding vector)

        Raises:
            EmbeddingError: If embedding generation fails
        """

    def generate_query_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for search query.

        Args:
            text: Query text to embed

        Returns:
            List of float values (embedding vector)

        Raises:
            EmbeddingError: If embedding generation fails
        """

    def generate_batch_embeddings(
        self,
        texts: List[str],
        for_indexing: bool = True
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batch.

        Args:
            texts: List of texts to embed
            for_indexing: If True, use indexing model; else use query model

        Returns:
            List of embedding vectors

        Raises:
            EmbeddingError: If any embedding fails
        """
```

## Data Flow

**Indexing Flow (Book Chunks):**
1. Text chunks from `TextChunker`
2. `generate_batch_embeddings(chunks, for_indexing=True)`
3. Uses `qwen-embeddings-indexer` model
4. Returns list of embedding vectors
5. Vectors stored in ChromaDB with chunks

**Search Flow (User Query):**
1. User query text
2. `generate_query_embedding(query)`
3. Uses `qwen-embeddings-kb` model
4. Returns single embedding vector
5. Vector used for ChromaDB similarity search

**API Communication:**
```
Client → Ollama HTTP API
POST /api/embeddings
{
  "model": "qwen-embeddings-indexer",
  "prompt": "text to embed"
}
←
{
  "embedding": [0.1, -0.2, 0.3, ...]
}
```

## Usage Notes

**Two Different Models:**
- **Indexing model** (`qwen-embeddings-indexer`): Used when indexing book chunks
- **Query model** (`qwen-embeddings-kb`): Used when searching knowledge base
- Different models optimize for different embedding purposes

**Performance Considerations:**
- Batch processing reduces API calls
- Typical batch size: 10-20 chunks
- Each API call takes ~100-500ms depending on text length
- Ollama must be running locally (`ollama serve`)

**Error Handling:**
- Network errors → `EmbeddingError`
- Model not found → `EmbeddingError`
- Invalid text → `EmbeddingError`
- All errors include context for debugging

**Configuration:**
- Models configured in `configs/ollama_models.py`
- Ollama base URL configurable (default: localhost:11434)
- Can switch models without code changes
