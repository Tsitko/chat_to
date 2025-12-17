"""
Vector database package for the chat_to application.

This package contains ChromaDB client and related vector database operations.
"""

from .chroma_client import ChromaClient

__all__ = [
    "ChromaClient",
]
