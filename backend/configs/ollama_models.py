"""
Configuration for Ollama model names.

This module centralizes all model name configurations for the application.
"""

# Chat LLM model for generating responses
CHAT_MODEL: str = "qwen2.5:7b"

# Embedding model for indexing documents
EMBEDDINGS_INDEXER_MODEL: str = "qwen-embeddings-indexer"

# Embedding model for searching knowledge base
EMBEDDINGS_KB_MODEL: str = "qwen-embeddings-kb"
