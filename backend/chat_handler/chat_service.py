"""
Chat service for handling message flow and response generation.

This module orchestrates the complete chat flow including KB search and LLM response.
Depends on: knowledge_base, llm, storage, models
"""

from typing import List
import asyncio

from knowledge_base import KnowledgeBaseManager
from llm import OllamaClient, PromptBuilder
from storage import MessageRepository
from models import Message, MessageResponse
from exceptions import LLMError


class ChatService:
    """
    Orchestrates chat operations for a character.

    This service handles the complete flow:
    1. Receive user message
    2. Search both knowledge bases
    3. Build prompt with context
    4. Generate LLM response
    5. Save both messages
    6. Index user message into conversations KB
    """

    def __init__(self, character_id: str, character_name: str,
                 kb_manager: KnowledgeBaseManager, ollama_client: OllamaClient,
                 message_repository: MessageRepository):
        """
        Initialize chat service for a character.

        Args:
            character_id: Unique identifier of the character
            character_name: Name of the character
            kb_manager: Knowledge base manager instance
            ollama_client: Ollama client instance
            message_repository: Message repository instance
        """
        self.character_id = character_id
        self.character_name = character_name
        self.kb_manager = kb_manager
        self.ollama_client = ollama_client
        self.message_repository = message_repository
        self.prompt_builder = PromptBuilder()

    async def process_message(self, user_message_content: str) -> MessageResponse:
        """
        Process a user message and generate character response.

        Args:
            user_message_content: Content of the user message

        Returns:
            MessageResponse: Both user and assistant messages

        Raises:
            LLMError: If response generation fails
        """
        # 1. Create user message
        from uuid import uuid4
        from datetime import datetime

        user_message = Message(
            id=str(uuid4()),
            character_id=self.character_id,
            role="user",
            content=user_message_content,
            created_at=datetime.utcnow()
        )

        # 2. Generate assistant response
        assistant_response = await self._generate_response(user_message_content)

        # 3. Create assistant message
        assistant_message = Message(
            id=str(uuid4()),
            character_id=self.character_id,
            role="assistant",
            content=assistant_response,
            created_at=datetime.utcnow()
        )

        # 4. Save both messages
        await self._save_messages(user_message, assistant_message)

        # 5. Index user message asynchronously (fire and forget)
        asyncio.create_task(self._index_user_message(user_message))

        # 6. Return response
        return MessageResponse(
            user_message=user_message,
            assistant_message=assistant_message
        )

    async def _search_knowledge_bases(self, query: str) -> tuple[str, str]:
        """
        Search both knowledge bases for relevant context.

        Args:
            query: Search query (user message)

        Returns:
            tuple[str, str]: (books_context, conversations_context)
        """
        # Search both KBs in parallel
        books_results, conversations_results = await asyncio.gather(
            self.kb_manager.search_books_kb(query, n_results=5),
            self.kb_manager.search_conversations_kb(query, n_results=3),
            return_exceptions=True
        )

        # Handle potential errors
        if isinstance(books_results, Exception):
            books_results = []
        if isinstance(conversations_results, Exception):
            conversations_results = []

        # Combine results into context strings
        books_context = "\n\n".join(books_results) if books_results else "Нет релевантной информации в книгах."
        conversations_context = "\n\n".join(conversations_results) if conversations_results else "Нет предыдущих обсуждений по этой теме."

        return books_context, conversations_context

    async def _get_recent_messages(self, count: int = 5) -> List[Message]:
        """
        Get recent messages for chat history.

        Args:
            count: Number of recent messages to retrieve

        Returns:
            List[Message]: Recent messages
        """
        messages = await self.message_repository.get_messages_by_character(
            self.character_id, limit=count, offset=0
        )
        return messages

    async def _generate_response(self, user_message: str) -> str:
        """
        Generate assistant response using LLM.

        Args:
            user_message: User message content

        Returns:
            str: Generated response

        Raises:
            LLMError: If generation fails
        """
        print(f"[DEBUG] Starting _generate_response for message: {user_message[:50]}...")

        # 1. Search knowledge bases for context
        print("[DEBUG] Searching knowledge bases...")
        books_context, conversations_context = await self._search_knowledge_bases(user_message)
        print(f"[DEBUG] Books context length: {len(books_context)}, Conversations context length: {len(conversations_context)}")
        print(f"[DEBUG] Books context preview: {books_context[:200]}...")
        print(f"[DEBUG] Conversations context preview: {conversations_context[:200]}...")

        # 2. Get recent messages for chat history
        print("[DEBUG] Getting recent messages...")
        recent_messages = await self._get_recent_messages(count=5)
        print(f"[DEBUG] Found {len(recent_messages)} recent messages")
        if recent_messages:
            print("[DEBUG] Chat history:")
            for msg in recent_messages:
                role_name = "User" if msg.role == "user" else "Assistant"
                print(f"[DEBUG]   {role_name}: {msg.content[:100]}...")
        else:
            print("[DEBUG] Chat history: No previous messages")

        # 3. Build prompts
        print("[DEBUG] Building prompts...")
        system_prompt, user_prompt = self.prompt_builder.build_prompts(
            character_name=self.character_name,
            context=books_context,
            previous_discussion=conversations_context,
            messages=recent_messages,
            current_question=user_message
        )
        print(f"[DEBUG] System prompt length: {len(system_prompt)}, User prompt length: {len(user_prompt)}")
        print(f"[DEBUG] Current question being passed to LLM: {user_message[:100]}...")
        print(f"[DEBUG] User prompt preview:\n{user_prompt[:500]}...")

        # 4. Generate response using LLM
        print("[DEBUG] Calling LLM...")
        response = await self.ollama_client.generate_response(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.7
        )
        print(f"[DEBUG] LLM response received, length: {len(response)}")

        return response

    async def _save_messages(self, user_message: Message,
                            assistant_message: Message) -> None:
        """
        Save both user and assistant messages to database.

        Args:
            user_message: User message to save
            assistant_message: Assistant message to save
        """
        await self.message_repository.save_message(self.character_id, user_message)
        await self.message_repository.save_message(self.character_id, assistant_message)

    async def _index_user_message(self, message: Message) -> None:
        """
        Index user message into conversations knowledge base asynchronously.

        Args:
            message: User message to index
        """
        try:
            await self.kb_manager.index_message(message.id, message.content)
        except Exception as e:
            # Log error but don't fail the request
            print(f"Warning: Failed to index message {message.id}: {str(e)}")
