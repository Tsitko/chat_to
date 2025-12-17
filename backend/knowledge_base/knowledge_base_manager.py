"""
Knowledge base manager for character-specific vector databases.

This module manages dual knowledge bases (books and conversations) for each character.
Depends on: vector_db, embeddings, utils
"""

from typing import List, Dict, Optional
import uuid

from vector_db import ChromaClient
from embeddings import EmbeddingGenerator
from utils import TextChunker
from exceptions import IndexingError, VectorDBError


class KnowledgeBaseManager:
    """
    Manages knowledge bases for a character.

    Each character has two knowledge bases:
    1. Books KB - indexed from uploaded books
    2. Conversations KB - indexed from chat history
    """

    def __init__(self, character_id: str, chroma_client: ChromaClient,
                 embedding_generator: EmbeddingGenerator, text_chunker: TextChunker):
        """
        Initialize knowledge base manager for a character.

        Args:
            character_id: Unique identifier of the character
            chroma_client: ChromaDB client instance
            embedding_generator: Embedding generator instance
            text_chunker: Text chunker instance
        """
        self.character_id = character_id
        self.chroma_client = chroma_client
        self.embedding_generator = embedding_generator
        self.text_chunker = text_chunker

    async def index_book(self, book_id: str, book_text: str) -> None:
        """
        Index a book into the books knowledge base.

        Args:
            book_id: Unique identifier of the book
            book_text: Full text content of the book

        Raises:
            IndexingError: If indexing operation fails
        """
        try:
            # Chunk the book text
            chunks = self.text_chunker.chunk_text(book_text)

            if not chunks:
                return  # Nothing to index

            # Prepare metadata for each chunk
            metadata_list = [{"book_id": book_id, "chunk_index": i} for i in range(len(chunks))]

            # Index chunks into books collection
            await self._index_chunks(self._get_books_collection_name(), chunks, metadata_list)
        except Exception as e:
            raise IndexingError(f"Failed to index book {book_id}: {str(e)}")

    async def index_message(self, message_id: str, message_content: str) -> None:
        """
        Index a message into the conversations knowledge base.

        Args:
            message_id: Unique identifier of the message
            message_content: Content of the message

        Raises:
            IndexingError: If indexing operation fails
        """
        try:
            # For messages, we can index directly without chunking or chunk if very long
            chunks = [message_content]
            metadata_list = [{"message_id": message_id}]

            # Index into conversations collection
            await self._index_chunks(self._get_conversations_collection_name(), chunks, metadata_list)
        except Exception as e:
            raise IndexingError(f"Failed to index message {message_id}: {str(e)}")

    async def search_books_kb(self, query: str, n_results: int = 5) -> List[str]:
        """
        Search the books knowledge base for relevant context.

        Args:
            query: Search query
            n_results: Number of results to return

        Returns:
            List[str]: List of relevant text chunks

        Raises:
            VectorDBError: If search operation fails
        """
        try:
            # Generate query embedding
            query_embedding = await self.embedding_generator.generate_query_embedding(query)

            # Search in books collection
            results = self.chroma_client.query_documents(
                self._get_books_collection_name(),
                query_embedding,
                n_results
            )

            # Extract documents from results
            documents = results.get("documents", [[]])[0]
            return documents
        except Exception as e:
            raise VectorDBError(f"Failed to search books KB: {str(e)}")

    async def search_conversations_kb(self, query: str,
                                     n_results: int = 3) -> List[str]:
        """
        Search the conversations knowledge base for previous discussions.

        Args:
            query: Search query
            n_results: Number of results to return

        Returns:
            List[str]: List of relevant conversation snippets

        Raises:
            VectorDBError: If search operation fails
        """
        try:
            # Generate query embedding
            query_embedding = await self.embedding_generator.generate_query_embedding(query)

            # Search in conversations collection
            results = self.chroma_client.query_documents(
                self._get_conversations_collection_name(),
                query_embedding,
                n_results
            )

            # Extract documents from results
            documents = results.get("documents", [[]])[0]
            return documents
        except Exception as e:
            raise VectorDBError(f"Failed to search conversations KB: {str(e)}")

    async def delete_book_from_kb(self, book_id: str) -> None:
        """
        Delete all chunks of a book from the knowledge base.

        Args:
            book_id: Unique identifier of the book

        Raises:
            VectorDBError: If deletion fails
        """
        try:
            # Get collection and delete by metadata filter
            collection = self.chroma_client.get_or_create_collection(
                self._get_books_collection_name()
            )
            # Delete documents with matching book_id metadata
            collection.delete(where={"book_id": book_id})
        except Exception as e:
            raise VectorDBError(f"Failed to delete book from KB: {str(e)}")

    async def delete_all_knowledge_bases(self) -> None:
        """
        Delete both knowledge bases for the character.

        Raises:
            VectorDBError: If deletion fails
        """
        try:
            # Delete books collection if it exists
            books_collection = self._get_books_collection_name()
            if self.chroma_client.collection_exists(books_collection):
                self.chroma_client.delete_collection(books_collection)

            # Delete conversations collection if it exists
            conversations_collection = self._get_conversations_collection_name()
            if self.chroma_client.collection_exists(conversations_collection):
                self.chroma_client.delete_collection(conversations_collection)
        except Exception as e:
            raise VectorDBError(f"Failed to delete knowledge bases: {str(e)}")

    def _get_books_collection_name(self) -> str:
        """
        Get the collection name for books knowledge base.

        Returns:
            str: Collection name
        """
        return f"{self.character_id}_books"

    def _get_conversations_collection_name(self) -> str:
        """
        Get the collection name for conversations knowledge base.

        Returns:
            str: Collection name
        """
        return f"{self.character_id}_conversations"

    async def _index_chunks(self, collection_name: str, chunks: List[str],
                           metadata_list: List[Dict]) -> None:
        """
        Internal method to index text chunks into a collection.

        Args:
            collection_name: Name of the collection
            chunks: List of text chunks
            metadata_list: List of metadata for each chunk

        Raises:
            IndexingError: If indexing fails
        """
        try:
            # Generate embeddings for all chunks
            embeddings = await self.embedding_generator.generate_batch_embeddings(
                chunks, for_indexing=True
            )

            # Generate unique IDs for each chunk
            ids = [str(uuid.uuid4()) for _ in chunks]

            # Add to vector database
            self.chroma_client.add_documents(
                collection_name=collection_name,
                documents=chunks,
                embeddings=embeddings,
                metadatas=metadata_list,
                ids=ids
            )
        except Exception as e:
            raise IndexingError(f"Failed to index chunks: {str(e)}")
