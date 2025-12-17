# Configs Module

## File Map

- `ollama_models.py` - Model name configurations (chat, embeddings indexer/kb)
- `server_config.py` - Server settings (host, port, file paths, upload limits)
- `chunking_config.py` - Text chunking parameters (size, overlap)
- `__init__.py` - Package exports

## Key Components

### ollama_models.py
- **Purpose**: Centralize Ollama model names
- **Entities**: Model name constants
- **I/O**: Provides string constants
- **Dependencies**: None

### server_config.py
- **Purpose**: Server and file storage configuration
- **Entities**: Server settings, file paths, upload constraints
- **I/O**: Provides configuration constants
- **Dependencies**: None

### chunking_config.py
- **Purpose**: Document chunking parameters
- **Entities**: Chunk size and overlap settings
- **I/O**: Provides integer constants
- **Dependencies**: None

## Data Flow

Configuration values flow from this module to all other modules that need them. No runtime dependencies.

## Usage

```python
from configs import CHAT_MODEL, HOST, PORT, CHUNK_SIZE
```
