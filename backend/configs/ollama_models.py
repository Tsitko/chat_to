"""
Configuration for LLM model names.

This module centralizes all model name configurations for the application.
All models are served via LM Studio.
"""

# Chat LLM model for generating responses
CHAT_MODEL: str = "qwen/qwen3-30b-a3b-2507"

# Embedding model for both indexing and searching (same model)
EMBEDDING_MODEL: str = "text-embedding-qwen3-embedding-4b"
