"""
Configuration for Ollama model names.

This module centralizes all model name configurations for the application.
"""

# Chat LLM model for generating responses
CHAT_MODEL: str = "qwen/qwen3-30b-a3b-2507"

# Embedding model for indexing documents
EMBEDDINGS_INDEXER_MODEL: str = "qwen-embeddings-indexer"

# Embedding model for searching knowledge base
EMBEDDINGS_KB_MODEL: str = "qwen-embeddings-kb"
