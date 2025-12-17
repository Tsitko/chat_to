"""
Text chunking utility for splitting documents.

This module provides functionality for chunking text into overlapping segments.
Depends on: configs
"""

from typing import List

from configs import CHUNK_SIZE, OVERLAP_SIZE


class TextChunker:
    """
    Chunks text into overlapping segments for embedding.

    This class implements a sliding window approach to split large texts
    into smaller chunks with configurable overlap.
    """

    def __init__(self, chunk_size: int = CHUNK_SIZE, overlap_size: int = OVERLAP_SIZE):
        """
        Initialize the text chunker.

        Args:
            chunk_size: Size of each chunk in characters
            overlap_size: Size of overlap between chunks in characters
        """
        self.chunk_size = chunk_size
        self.overlap_size = overlap_size

    def chunk_text(self, text: str) -> List[str]:
        """
        Split text into overlapping chunks.

        Args:
            text: Text to be chunked

        Returns:
            List[str]: List of text chunks
        """
        if not text:
            return []

        chunks = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = start + self.chunk_size
            chunk = text[start:end]
            cleaned_chunk = self._clean_chunk(chunk)

            if cleaned_chunk:
                chunks.append(cleaned_chunk)

            # Move forward by chunk_size minus overlap
            # Ensure we always move forward by at least 1 character to avoid infinite loops
            step = max(1, self.chunk_size - self.overlap_size)
            start += step

            # If we're at the end and haven't captured all text, ensure we get the last bit
            if start < text_len and end >= text_len:
                break

        return chunks

    def chunk_with_metadata(self, text: str, metadata: dict) -> List[tuple[str, dict]]:
        """
        Split text into chunks with metadata attached.

        Args:
            text: Text to be chunked
            metadata: Metadata to attach to each chunk

        Returns:
            List[tuple[str, dict]]: List of (chunk_text, metadata) tuples
        """
        chunks = self.chunk_text(text)
        result = []
        for i, chunk in enumerate(chunks):
            chunk_meta = metadata.copy()
            chunk_meta['chunk_index'] = i
            result.append((chunk, chunk_meta))
        return result

    def _clean_chunk(self, chunk: str) -> str:
        """
        Clean a chunk by removing extra whitespace and normalizing.

        Args:
            chunk: Text chunk to clean

        Returns:
            str: Cleaned chunk
        """
        # Strip leading/trailing whitespace
        chunk = chunk.strip()

        # Replace multiple spaces with single space
        import re
        chunk = re.sub(r'\s+', ' ', chunk)

        return chunk
