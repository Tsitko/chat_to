"""
Configuration for document chunking settings.

This module centralizes chunking parameters for text processing.
"""

# Chunk size in characters
CHUNK_SIZE: int = 3000

# Overlap percentage (10% of chunk size)
OVERLAP_PERCENTAGE: float = 0.1

# Calculated overlap size
OVERLAP_SIZE: int = int(CHUNK_SIZE * OVERLAP_PERCENTAGE)
