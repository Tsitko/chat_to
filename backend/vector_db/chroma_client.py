"""
ChromaDB client for vector database operations.

This module provides a wrapper around ChromaDB for managing vector databases.
Depends on: ChromaDB library
"""

from typing import List, Dict, Optional
import chromadb
from chromadb.config import Settings

from configs import CHROMA_DIR
from exceptions import VectorDBError


class ChromaClient:
    """
    Client for interacting with ChromaDB vector database.

    This class handles low-level operations with ChromaDB including
    collection management, document insertion, and similarity search.
    """

    def __init__(self, persist_directory: str = CHROMA_DIR, character_id: str = None):
        """
        Initialize ChromaDB client.

        Args:
            persist_directory: Base directory for persisting ChromaDB data
            character_id: Optional character ID for per-character database isolation

        Raises:
            VectorDBError: If ChromaDB initialization fails
        """
        try:
            from pathlib import Path

            # If character_id provided, create per-character subdirectory
            if character_id:
                persist_directory = str(Path(persist_directory) / character_id)
                print(f"[CHROMA] Creating character-specific ChromaDB at: {persist_directory}")

            Path(persist_directory).mkdir(parents=True, exist_ok=True)

            self.client = chromadb.PersistentClient(
                path=persist_directory,
                settings=Settings(anonymized_telemetry=False)
            )
            self.persist_directory = persist_directory
        except Exception as e:
            raise VectorDBError(f"Failed to initialize ChromaDB: {str(e)}")

    def get_or_create_collection(self, collection_name: str) -> chromadb.Collection:
        """
        Get an existing collection or create a new one.

        Args:
            collection_name: Name of the collection

        Returns:
            chromadb.Collection: The collection object

        Raises:
            VectorDBError: If collection operation fails
        """
        try:
            return self.client.get_or_create_collection(name=collection_name)
        except Exception as e:
            raise VectorDBError(f"Failed to get or create collection '{collection_name}': {str(e)}")

    def add_documents(self, collection_name: str, documents: List[str],
                     embeddings: List[List[float]], metadatas: List[Dict],
                     ids: List[str]) -> None:
        """
        Add documents with embeddings to a collection.

        Args:
            collection_name: Name of the collection
            documents: List of document texts
            embeddings: List of embedding vectors
            metadatas: List of metadata dictionaries
            ids: List of unique document IDs

        Raises:
            VectorDBError: If document insertion fails
        """
        try:
            collection = self.get_or_create_collection(collection_name)
            collection.add(
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids
            )
        except Exception as e:
            raise VectorDBError(f"Failed to add documents to collection '{collection_name}': {str(e)}")

    def query_documents(self, collection_name: str, query_embedding: List[float],
                       n_results: int = 5) -> Dict:
        """
        Query documents by similarity to embedding.

        Args:
            collection_name: Name of the collection
            query_embedding: Query embedding vector
            n_results: Number of results to return

        Returns:
            Dict: Query results containing documents, metadatas, and distances

        Raises:
            VectorDBError: If query operation fails
        """
        try:
            collection = self.get_or_create_collection(collection_name)
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results
            )
            return results
        except Exception as e:
            raise VectorDBError(f"Failed to query collection '{collection_name}': {str(e)}")

    def delete_collection(self, collection_name: str) -> None:
        """
        Delete a collection and all its documents.

        Args:
            collection_name: Name of the collection to delete

        Raises:
            VectorDBError: If deletion fails
        """
        try:
            self.client.delete_collection(name=collection_name)
        except Exception as e:
            raise VectorDBError(f"Failed to delete collection '{collection_name}': {str(e)}")

    def collection_exists(self, collection_name: str) -> bool:
        """
        Check if a collection exists.

        Args:
            collection_name: Name of the collection

        Returns:
            bool: True if collection exists, False otherwise
        """
        try:
            collections = self.client.list_collections()
            return collection_name in collections
        except Exception:
            return False

    def get_collection_count(self, collection_name: str) -> int:
        """
        Get the number of documents in a collection.

        Args:
            collection_name: Name of the collection

        Returns:
            int: Number of documents in the collection

        Raises:
            VectorDBError: If count operation fails
        """
        try:
            collection = self.get_or_create_collection(collection_name)
            return collection.count()
        except Exception as e:
            raise VectorDBError(f"Failed to get count for collection '{collection_name}': {str(e)}")
