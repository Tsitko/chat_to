"""
Configuration for the server settings.

This module centralizes server configuration including host and port settings.
"""

import os

# Server host address
HOST: str = os.getenv("HOST", "0.0.0.0")

# Server port
PORT: int = int(os.getenv("PORT", "1310"))

# Ollama server URL
OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")

# Maximum file upload size in bytes (100 MB)
MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024

# Allowed file extensions for books
ALLOWED_BOOK_EXTENSIONS: set = {".pdf", ".docx", ".txt"}

# Allowed file extensions for avatars
ALLOWED_AVATAR_EXTENSIONS: set = {".png", ".jpg", ".jpeg"}

# Data storage directory
DATA_DIR: str = os.getenv("DATA_DIR", "data")

# Character storage subdirectory
CHARACTERS_DIR: str = "characters"

# Books storage subdirectory
BOOKS_DIR: str = "books"

# Avatars storage subdirectory
AVATARS_DIR: str = "avatars"

# Groups storage subdirectory
GROUPS_DIR: str = "groups"

# ChromaDB storage subdirectory
CHROMA_DIR: str = os.getenv("CHROMA_DIR", "chroma")

