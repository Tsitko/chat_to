"""
Embedding generator using Ollama models.

This module provides functionality for generating embeddings from text.
Depends on: Ollama API, configs
"""

from typing import List
import httpx

from configs import OLLAMA_URL, EMBEDDINGS_INDEXER_MODEL, EMBEDDINGS_KB_MODEL
from exceptions import EmbeddingError


class EmbeddingGenerator:
    """
    Generates embeddings using Ollama embedding models.

    This class provides methods for generating embeddings for both
    indexing (books) and searching (knowledge base queries).
    """

    def __init__(self, ollama_url: str = OLLAMA_URL):
        """
        Initialize the embedding generator.

        Args:
            ollama_url: URL of the Ollama server

        Raises:
            EmbeddingError: If Ollama connection fails
        """
        self.ollama_url = ollama_url
        self.indexing_model = EMBEDDINGS_INDEXER_MODEL
        self.query_model = EMBEDDINGS_KB_MODEL

    async def generate_indexing_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for indexing a document.

        Args:
            text: Text to generate embedding for

        Returns:
            List[float]: Embedding vector

        Raises:
            EmbeddingError: If embedding generation fails
        """
        return await self._call_ollama_api(self.indexing_model, text)

    async def generate_query_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for searching/querying.

        Args:
            text: Query text to generate embedding for

        Returns:
            List[float]: Embedding vector

        Raises:
            EmbeddingError: If embedding generation fails
        """
        return await self._call_ollama_api(self.query_model, text)

    async def generate_batch_embeddings(self, texts: List[str],
                                       for_indexing: bool = True) -> List[List[float]]:
        """
        Generate embeddings for multiple texts.

        Args:
            texts: List of texts to generate embeddings for
            for_indexing: If True, use indexing model; otherwise use query model

        Returns:
            List[List[float]]: List of embedding vectors

        Raises:
            EmbeddingError: If batch embedding generation fails
        """
        model = self.indexing_model if for_indexing else self.query_model
        embeddings = []

        for text in texts:
            embedding = await self._call_ollama_api(model, text)
            embeddings.append(embedding)

        return embeddings

    async def _call_ollama_api(self, model: str, text: str) -> List[float]:
        """
        Internal method to call Ollama API for embedding generation.

        Args:
            model: Name of the embedding model
            text: Text to generate embedding for

        Returns:
            List[float]: Embedding vector

        Raises:
            EmbeddingError: If API call fails
        """
        if not text or not text.strip():
            raise EmbeddingError("Text cannot be empty")

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/embeddings",
                    json={"model": model, "prompt": text}
                )
                response.raise_for_status()
                data = response.json()
                return data["embedding"]
        except httpx.HTTPError as e:
            raise EmbeddingError(f"HTTP error calling Ollama API: {str(e)}")
        except KeyError as e:
            raise EmbeddingError(f"Unexpected response format from Ollama: {str(e)}")
        except Exception as e:
            raise EmbeddingError(f"Failed to generate embedding: {str(e)}")

    async def check_model_availability(self, model: str) -> bool:
        """
        Check if a model is available in Ollama.

        Args:
            model: Name of the model to check

        Returns:
            bool: True if model is available, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.ollama_url}/api/tags")
                response.raise_for_status()
                data = response.json()
                models = [m["name"] for m in data.get("models", [])]
                return model in models
        except Exception:
            return False
