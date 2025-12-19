"""
Chat service for handling message flow and response generation.

This module orchestrates the complete chat flow including KB search and LLM response.
Depends on: knowledge_base, llm, storage, models
"""

from typing import List, Optional
import asyncio

from knowledge_base import KnowledgeBaseManager
from llm import OllamaClient, PromptBuilder, EmotionDetector
from storage import MessageRepository
from models import Message, MessageResponse, Emotions
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
        self.emotion_detector = EmotionDetector(ollama_client)

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

        # 2. Generate assistant response with emotions
        assistant_response, emotions = await self._generate_response(user_message_content)

        # 3. Create assistant message with emotions
        assistant_message = Message(
            id=str(uuid4()),
            character_id=self.character_id,
            role="assistant",
            content=assistant_response,
            created_at=datetime.utcnow(),
            emotions=emotions
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

    async def _generate_response(self, user_message: str) -> tuple[str, Optional[Emotions]]:
        """
        Generate assistant response using LLM with emotion detection.

        Args:
            user_message: User message content

        Returns:
            tuple[str, Optional[Emotions]]: (Generated response, detected emotions or None)

        Raises:
            LLMError: If generation fails
        """
        print(f"[EMOTION] Starting emotion detection for character: {self.character_name}")

        # 1. Get recent messages
        recent_messages = await self._get_recent_messages(count=5)
        print(f"[EMOTION] Found {len(recent_messages)} recent messages")

        # 2. Search knowledge bases FIRST (reordered to happen before emotion detection)
        books_context, conversations_context = await self._search_knowledge_bases(user_message)

        # 3. Detect emotions WITH books_context (context-aware emotion detection)
        emotions, temperature = await self._detect_emotions(recent_messages, books_context)
        print(f"[EMOTION] Detection result - emotions: {emotions}, temperature: {temperature}")

        # 4. Build prompts WITH emotions (reuse same books_context, no re-query)
        system_prompt, user_prompt = self.prompt_builder.build_prompts(
            character_name=self.character_name,
            context=books_context,
            previous_discussion=conversations_context,
            messages=recent_messages,
            current_question=user_message,
            emotions=emotions
        )
        print(f"[EMOTION] System prompt includes emotions: {emotions is not None}")
        if emotions:
            print(f"[EMOTION] Emotion values in prompt: fear={emotions.fear}, anger={emotions.anger}, sadness={emotions.sadness}, disgust={emotions.disgust}, joy={emotions.joy}")

        # 5. Generate response with dynamic temperature
        print(f"[EMOTION] Generating response with temperature: {temperature}")
        try:
            response = await self.ollama_client.generate_response(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature
            )
        except Exception as e:
            raise LLMError(f"Failed to generate response: {str(e)}")

        return response, emotions

    async def _detect_emotions(self, recent_messages: List[Message],
                              books_context: str) -> tuple[Optional[Emotions], float]:
        """
        Detect emotions based on chat history, knowledge context, and calculate optimal temperature.

        Args:
            recent_messages: Recent chat history
            books_context: Knowledge base context about the topic being discussed

        Returns:
            tuple[Optional[Emotions], float]: (Detected emotions or None, optimal temperature)
        """
        print(f"[EMOTION] _detect_emotions called with {len(recent_messages)} messages")
        try:
            emotions = await self.emotion_detector.detect_emotions(
                self.character_name, recent_messages, books_context
            )
            print(f"[EMOTION] EmotionDetector returned: {emotions}")

            if emotions:
                temperature = emotions.calculate_optimal_temperature()
                print(f"[EMOTION] Calculated temperature from emotions: {temperature}")
                return emotions, temperature
            else:
                # Fallback to default temperature if detection fails
                print(f"[EMOTION] No emotions detected, using default temperature 0.7")
                return None, 0.7
        except Exception as e:
            # Log error but continue with default temperature
            print(f"[EMOTION] Emotion detection error: {e}")
            import traceback
            traceback.print_exc()
            return None, 0.7

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
