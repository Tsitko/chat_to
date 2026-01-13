"""
Embedding generator using LM Studio.

This module provides functionality for generating embeddings from text.
Depends on: LM Studio API, configs
"""

from typing import List
import httpx

from configs import LM_STUDIO_URL, EMBEDDING_MODEL
from exceptions import EmbeddingError


class EmbeddingGenerator:
    """
    Generates embeddings using LM Studio.

    This class provides methods for generating embeddings for both
    indexing (books) and searching (knowledge base queries).
    Uses the same model for both operations via LM Studio API.
    """

    def __init__(self, lm_studio_url: str = LM_STUDIO_URL):
        """
        Initialize the embedding generator.

        Args:
            lm_studio_url: URL of the LM Studio server

        Raises:
            EmbeddingError: If LM Studio connection fails
        """
        self.lm_studio_url = lm_studio_url.rstrip('/')
        self.model = EMBEDDING_MODEL

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
        return await self._call_lm_studio_api(text)

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
        return await self._call_lm_studio_api(text)

    async def generate_batch_embeddings(self, texts: List[str],
                                       for_indexing: bool = True) -> List[List[float]]:
        """
        Generate embeddings for multiple texts.

        Args:
            texts: List of texts to generate embeddings for
            for_indexing: Ignored - same model used for both operations

        Returns:
            List[List[float]]: List of embedding vectors

        Raises:
            EmbeddingError: If batch embedding generation fails
        """
        embeddings = []

        for text in texts:
            embedding = await self._call_lm_studio_api(text)
            embeddings.append(embedding)

        return embeddings

    async def _call_lm_studio_api(self, text: str) -> List[float]:
        """
        Internal method to call LM Studio API for embedding generation.

        Args:
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
                    f"{self.lm_studio_url}/v1/embeddings",
                    json={"model": self.model, "input": text}
                )
                response.raise_for_status()
                data = response.json()

                # LM Studio uses OpenAI-compatible format: {"data": [{"embedding": [...]}]}
                return data["data"][0]["embedding"]
        except httpx.HTTPError as e:
            raise EmbeddingError(f"HTTP error calling LM Studio API: {str(e)}")
        except (KeyError, IndexError) as e:
            raise EmbeddingError(f"Unexpected response format from LM Studio: {str(e)}")
        except Exception as e:
            raise EmbeddingError(f"Failed to generate embedding: {str(e)}")

    async def check_model_availability(self) -> bool:
        """
        Check if the embedding model is available in LM Studio.

        Returns:
            bool: True if model is available, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.lm_studio_url}/v1/models")
                response.raise_for_status()
                data = response.json()
                models = [m.get("id") for m in data.get("data", [])]
                return self.model in models
        except Exception:
            return False
