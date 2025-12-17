"""
Knowledge base package for the chat_to application.

This package manages dual knowledge bases (books and conversations) per character.
"""

from .knowledge_base_manager import KnowledgeBaseManager

__all__ = [
    "KnowledgeBaseManager",
]
