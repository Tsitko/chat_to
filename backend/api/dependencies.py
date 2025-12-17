"""
Common API dependencies.

This module provides shared dependency injection functions for FastAPI routes.
"""

from vector_db import ChromaClient
from embeddings import EmbeddingGenerator
from utils import TextChunker
from knowledge_base import KnowledgeBaseManager


# Singleton instances for reuse across requests
_chroma_client = None
_embedding_generator = None
_text_chunker = None
_indexing_service = None


def get_chroma_client() -> ChromaClient:
    """
    Dependency for getting ChromaDB client instance (global singleton).

    NOTE: For character-specific ChromaDB, use get_character_chroma_client() instead.

    Returns:
        ChromaClient: Singleton ChromaDB client instance
    """
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = ChromaClient()
    return _chroma_client


def get_character_chroma_client(character_id: str) -> ChromaClient:
    """
    Get a character-specific ChromaDB client instance.

    Each character gets their own isolated ChromaDB database in a separate directory.

    Args:
        character_id: Unique identifier of the character

    Returns:
        ChromaClient: Character-specific ChromaDB client instance
    """
    return ChromaClient(character_id=character_id)


def get_embedding_generator() -> EmbeddingGenerator:
    """
    Dependency for getting embedding generator instance.

    Returns:
        EmbeddingGenerator: Singleton embedding generator instance
    """
    global _embedding_generator
    if _embedding_generator is None:
        _embedding_generator = EmbeddingGenerator()
    return _embedding_generator


def get_text_chunker() -> TextChunker:
    """
    Dependency for getting text chunker instance.

    Returns:
        TextChunker: Singleton text chunker instance
    """
    global _text_chunker
    if _text_chunker is None:
        _text_chunker = TextChunker()
    return _text_chunker


def get_knowledge_base_manager(
    character_id: str,
    chroma_client: ChromaClient,
    embedding_generator: EmbeddingGenerator,
    text_chunker: TextChunker
) -> KnowledgeBaseManager:
    """
    Factory function for creating KnowledgeBaseManager instances.

    Args:
        character_id: Unique identifier of the character
        chroma_client: ChromaDB client instance
        embedding_generator: Embedding generator instance
        text_chunker: Text chunker instance

    Returns:
        KnowledgeBaseManager: New knowledge base manager instance
    """
    return KnowledgeBaseManager(
        character_id=character_id,
        chroma_client=chroma_client,
        embedding_generator=embedding_generator,
        text_chunker=text_chunker
    )


def get_indexing_service():
    """
    Dependency for getting indexing service singleton instance.

    The IndexingService is a singleton to maintain indexing status across requests.
    It accepts character_repository as a parameter in its methods for database
    access since repository is request-scoped.

    Returns:
        IndexingService: Singleton indexing service instance
    """
    from chat_handler import IndexingService
    from storage import FileStorage

    global _indexing_service
    if _indexing_service is None:
        # Create singleton instance without repository (passed per-request)
        file_storage = FileStorage()
        _indexing_service = IndexingService(
            file_storage=file_storage,
            character_repository=None
        )
    return _indexing_service
