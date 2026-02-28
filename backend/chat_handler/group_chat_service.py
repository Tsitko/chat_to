"""
Group chat service for handling multi-character conversations.

This module orchestrates sequential message processing across multiple characters
in a group chat context. Each character receives progressively updated context
including previous characters' responses.

Depends on: chat_handler.ChatService, models, storage, exceptions
"""

from typing import List, Dict, Optional
import asyncio

from models import Message, Character, Emotions
from models.group_message import GroupMessageResponse, CharacterResponse
from storage import MessageRepository, CharacterRepository
from knowledge_base import KnowledgeBaseManager
from llm import OllamaClient
from exceptions import CharacterNotFoundError, LLMError
from configs.group_chat_config import (
    MAX_CHARACTERS_PER_GROUP,
    MESSAGE_WINDOW_SIZE,
    CHARACTER_TIMEOUT_SECONDS,
    TOTAL_GROUP_TIMEOUT_SECONDS,
    CONTINUE_ON_CHARACTER_FAILURE
)


class GroupChatService:
    """
    Orchestrates group chat operations with multiple characters.

    This service handles the sequential processing of messages across multiple
    characters, where each character receives context from previous responses
    in the same request.

    Flow:
    1. Validate character list
    2. Save user message
    3. For each character (sequential):
       a. Get message window (including prior character responses)
       b. Create ChatService for character
       c. Generate response with emotions
       d. Add response to message list
    4. Return all character responses
    """

    def __init__(
        self,
        character_repository: CharacterRepository,
        message_repository: MessageRepository,
        group_message_repository=None
    ):
        """
        Initialize group chat service.

        Args:
            character_repository: Repository for character data access
            message_repository: Repository for message data access
            group_message_repository: Repository for group message data access (optional)
        """
        self.character_repository = character_repository
        self.message_repository = message_repository
        self.group_message_repository = group_message_repository

    async def process_group_message(
        self,
        request=None,
        messages: List[Message] = None,
        character_ids: List[str] = None,
        kb_managers: Dict[str, KnowledgeBaseManager] = None,
        ollama_client: OllamaClient = None,
        group_id: str = None
    ) -> GroupMessageResponse:
        """
        Process a user message and generate responses from all characters in the group.

        Each character processes the message sequentially, with later characters
        receiving context from earlier characters' responses in this request.

        Args:
            request: GroupMessageRequest object (new interface for persistence)
            messages: Recent conversation messages (old interface, for backward compatibility)
            character_ids: List of character IDs that should respond (old interface)
            kb_managers: Dictionary mapping character_id to KnowledgeBaseManager (old interface)
            ollama_client: Ollama client instance for LLM operations (old interface)
            group_id: Group ID for message persistence (old interface)

        Returns:
            GroupMessageResponse: User message and all character responses

        Raises:
            ValueError: If character_ids exceeds MAX_CHARACTERS_PER_GROUP or messages is empty
            CharacterNotFoundError: If any character_id is invalid
        """
        # Support new request-based interface for persistence tests
        if request is not None:
            from models.group_message import GroupMessageRequest
            messages = request.messages
            character_ids = request.character_ids
            group_id = request.group_id
            print(f"[GROUP_CHAT] Received character_ids: {character_ids}")
            print(f"[GROUP_CHAT] Unique count: {len(set(character_ids))}, Total count: {len(character_ids)}")
            # Create kb_managers and ollama_client if not provided
            if kb_managers is None:
                from embeddings import EmbeddingGenerator
                from utils import TextChunker
                from api.dependencies import get_character_chroma_client
                embedding_generator = EmbeddingGenerator()
                text_chunker = TextChunker()
                kb_managers = {}
                for char_id in character_ids:
                    chroma_client = get_character_chroma_client(char_id)
                    kb_manager = KnowledgeBaseManager(
                        character_id=char_id,
                        chroma_client=chroma_client,
                        embedding_generator=embedding_generator,
                        text_chunker=text_chunker
                    )
                    kb_managers[char_id] = kb_manager
            if ollama_client is None:
                ollama_client = OllamaClient()

        # 0. Validate messages
        if not messages:
            raise ValueError("messages cannot be empty")

        # Get the last user message (most recent message should be from user)
        user_message = messages[-1]
        if user_message.role != "user":
            raise ValueError("Last message must be from user")

        # 1. Validate characters
        characters = await self._validate_characters(character_ids)

        # 2. Save user message to database
        # If group_message_repository is available and group_id provided, save there
        # Otherwise, fall back to old per-character message storage
        if group_id and self.group_message_repository:
            await self._save_user_message_to_group(group_id, user_message.content)
        else:
            await self._save_user_message(user_message.content, character_ids)

        # 3. Process each character sequentially
        responses = []
        # Start with all existing messages from frontend
        additional_messages = list(messages)

        for character in characters:
            # Get message window (includes previous character responses from this request)
            print(f"\n[MESSAGE_WINDOW] Before getting window for {character.name}:")
            print(f"[MESSAGE_WINDOW] additional_messages count: {len(additional_messages)}")
            for i, msg in enumerate(additional_messages):
                print(f"[MESSAGE_WINDOW] {i}: role={msg.role}, char_name={getattr(msg, 'character_name', None)}, created_at={msg.created_at}, content_len={len(msg.content)}")

            message_window = await self._get_message_window(
                character.id, additional_messages
            )

            print(f"[MESSAGE_WINDOW] After window (size={len(message_window)}):")
            for i, msg in enumerate(message_window):
                print(f"[MESSAGE_WINDOW] {i}: role={msg.role}, char_name={getattr(msg, 'character_name', None)}")

            # Process character with timeout (compatible with Python 3.9+)
            try:
                response = await asyncio.wait_for(
                    self._process_character(
                        character, user_message, message_window,
                        kb_managers[character.id], ollama_client
                    ),
                    timeout=CHARACTER_TIMEOUT_SECONDS
                )
            except asyncio.TimeoutError:
                response = CharacterResponse(
                    character_id=character.id,
                    character_name=character.name,
                    message=None,
                    emotions=None,
                    error="Character response timeout"
                )

            responses.append(response)

            # Add successful response to additional_messages for next character
            # If message is not None, create a Message object and add it to context
            if response.message and not response.error:
                # Create Message object from the response content
                from uuid import uuid4
                from datetime import datetime

                assistant_message = Message(
                    id=str(uuid4()),
                    character_id=character.id,
                    character_name=character.name,
                    role="assistant",
                    content=response.message,
                    created_at=datetime.utcnow(),
                    emotions=response.emotions
                )
                additional_messages.append(assistant_message)

                # Save character message to group_messages table if group_id provided
                if group_id and self.group_message_repository:
                    await self._save_character_message_to_group(group_id, response)

        # 4. Calculate statistics and build response
        successful, failed = self._calculate_response_stats(responses)

        from models.group_message import GroupMessageStatistics

        return GroupMessageResponse(
            responses=responses,
            statistics=GroupMessageStatistics(
                successful_count=successful,
                failed_count=failed
            )
        )

    async def _validate_characters(self, character_ids: List[str]) -> List[Character]:
        """
        Validate that all character IDs exist and group size is within limits.

        Args:
            character_ids: List of character IDs to validate

        Returns:
            List[Character]: List of validated Character objects in same order

        Raises:
            ValueError: If group size exceeds limit or list is empty
            CharacterNotFoundError: If any character doesn't exist
        """
        # Check for empty list
        if not character_ids:
            raise ValueError("character_ids cannot be empty")

        # Check group size limit
        if len(character_ids) > MAX_CHARACTERS_PER_GROUP:
            raise ValueError(
                f"Group size {len(character_ids)} exceeds maximum limit of {MAX_CHARACTERS_PER_GROUP}"
            )

        # Validate all characters exist
        characters = []
        for character_id in character_ids:
            character = await self.character_repository.get_character_by_id(character_id)
            if not character:
                raise CharacterNotFoundError(f"Character with ID {character_id} not found")
            characters.append(character)

        return characters

    async def _save_user_message(
        self,
        content: str,
        character_ids: List[str]
    ) -> Message:
        """
        Save user message to database.

        The message is saved with the first character's ID for database purposes,
        but conceptually belongs to the entire group.

        Args:
            content: Message content
            character_ids: List of character IDs in the group

        Returns:
            Message: Saved user message
        """
        from uuid import uuid4
        from datetime import datetime

        # Create user message (associate with first character for DB purposes)
        user_message = Message(
            id=str(uuid4()),
            character_id=character_ids[0],
            role="user",
            content=content,
            created_at=datetime.utcnow()
        )

        # Save to database
        await self.message_repository.save_message(character_ids[0], user_message)

        return user_message

    async def _get_message_window(
        self,
        character_id: str,
        additional_messages: List[Message],
        window_size: int = MESSAGE_WINDOW_SIZE
    ) -> List[Message]:
        """
        Get sliding window of messages for a character's context.

        Uses messages from frontend (in-memory store) since group messages are not
        persisted to database yet. Combines existing messages with new character
        responses generated in this request.

        Args:
            character_id: ID of character to get messages for (not used currently)
            additional_messages: All messages (from frontend + new responses in this request)
            window_size: Size of message window

        Returns:
            List[Message]: Window of messages for context (most recent last)
        """
        # For group chats, we use messages provided by frontend (in-memory)
        # No database lookup since group messages are not persisted yet

        # Sort by timestamp (oldest first) to ensure proper ordering
        # Normalize all datetimes to naive (remove timezone) to avoid comparison errors
        def get_naive_datetime(msg):
            dt = msg.created_at
            if dt.tzinfo is not None:
                # Convert to naive by removing timezone
                return dt.replace(tzinfo=None)
            return dt

        sorted_messages = sorted(additional_messages, key=get_naive_datetime)

        # Take last window_size messages
        return sorted_messages[-window_size:]

    async def _process_character(
        self,
        character: Character,
        user_message: Message,
        message_window: List[Message],
        kb_manager: KnowledgeBaseManager,
        ollama_client: OllamaClient
    ) -> CharacterResponse:
        """
        Process message for a single character and generate response.

        Creates a ChatService instance for the character and generates a response
        based on the provided message window.

        Args:
            character: Character object
            user_message: The user's message
            message_window: Window of recent messages for context
            kb_manager: Knowledge base manager for this character
            ollama_client: Ollama client for LLM operations

        Returns:
            CharacterResponse: Character's response or error information
        """
        try:
            # Generate response using the helper method
            message = await self._generate_character_response(
                character,
                user_message.content,
                message_window,
                kb_manager,
                ollama_client
            )

            # Handle both Message objects and strings (for test mocking compatibility)
            if isinstance(message, str):
                content = message
                emotions = None
            else:
                content = message.content
                emotions = message.emotions

            return CharacterResponse(
                character_id=character.id,
                character_name=character.name,
                message=content,
                emotions=emotions,
                error=None
            )

        except Exception as e:
            # Log error and return failed response
            print(f"Error processing character {character.name}: {str(e)}")
            import traceback
            traceback.print_exc()

            return CharacterResponse(
                character_id=character.id,
                character_name=character.name,
                message=None,
                emotions=None,
                error=str(e)
            )

    async def _generate_character_response(
        self,
        character: Character,
        user_message_content: str,
        message_window: List[Message],
        kb_manager: KnowledgeBaseManager,
        ollama_client: OllamaClient
    ) -> Message:
        """
        Generate response from character using knowledge base and LLM.

        This method generates a response for group chat context using the provided
        message window instead of querying the database (since group messages may
        not be persisted yet).

        Args:
            character: Character object
            user_message_content: Content of user's message
            message_window: Recent messages for context (including other characters' responses)
            kb_manager: Knowledge base manager for character
            ollama_client: Ollama client for LLM operations

        Returns:
            Message: Generated assistant message with emotions

        Raises:
            LLMError: If response generation fails
        """
        from uuid import uuid4
        from datetime import datetime
        from llm import PromptBuilder, EmotionDetector

        # 1. Search knowledge bases
        books_context, conversations_context = await self._search_knowledge_bases(
            kb_manager, user_message_content
        )

        # 2. Detect emotions with books context
        emotion_detector = EmotionDetector(ollama_client)
        emotions, temperature = await self._detect_emotions_for_character(
            emotion_detector, character.name, message_window, books_context
        )

        # 3. Build prompts with emotions
        prompt_builder = PromptBuilder()
        system_prompt, user_prompt = prompt_builder.build_prompts(
            character_name=character.name,
            context=books_context,
            previous_discussion=conversations_context,
            messages=message_window,
            current_question=user_message_content,
            emotions=emotions
        )

        # Log the formatted messages for debugging
        formatted_messages = prompt_builder.format_messages(message_window)
        print(f"\n{'='*80}")
        print(f"[PROMPT DEBUG] Character: {character.name}")
        print(f"[PROMPT DEBUG] Books context (first 200 chars): {books_context[:200]}")
        print(f"[PROMPT DEBUG] Conversations context (first 200 chars): {conversations_context[:200]}")
        print(f"[PROMPT DEBUG] Message window count: {len(message_window)}")
        print(f"[PROMPT DEBUG] Formatted messages:\n{formatted_messages}")
        print(f"[PROMPT DEBUG] System prompt:\n{system_prompt[:500]}")
        print(f"[PROMPT DEBUG] User prompt:\n{user_prompt[:500]}")
        print(f"{'='*80}\n")

        # 4. Generate response with dynamic temperature
        try:
            response_text = await ollama_client.generate_response(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=temperature
            )
            print(f"[RESPONSE] {character.name} generated response (length: {len(response_text)}, first 300 chars):")
            print(f"{response_text[:300]}\n")
        except Exception as e:
            raise LLMError(f"Failed to generate response: {str(e)}")

        # 5. Create Message object
        message = Message(
            id=str(uuid4()),
            character_id=character.id,
            role="assistant",
            content=response_text,
            created_at=datetime.utcnow(),
            emotions=emotions
        )

        return message

    async def _search_knowledge_bases(
        self,
        kb_manager: KnowledgeBaseManager,
        query: str
    ) -> tuple[str, str]:
        """
        Search both knowledge bases for relevant context.

        Args:
            kb_manager: Knowledge base manager instance
            query: Search query (user message)

        Returns:
            tuple[str, str]: (books_context, conversations_context)
        """
        import asyncio

        print(f"[KB_SEARCH] Query: {query}")

        # Search both KBs in parallel
        books_results, conversations_results = await asyncio.gather(
            kb_manager.search_books_kb(query, n_results=5),
            kb_manager.search_conversations_kb(query, n_results=3),
            return_exceptions=True
        )

        # Handle potential errors
        if isinstance(books_results, Exception):
            print(f"[KB_SEARCH] Books search error: {books_results}")
            books_results = []
        if isinstance(conversations_results, Exception):
            print(f"[KB_SEARCH] Conversations search error: {conversations_results}")
            conversations_results = []

        print(f"[KB_SEARCH] Books results count: {len(books_results)}")
        print(f"[KB_SEARCH] Conversations results count: {len(conversations_results)}")

        # Combine results into context strings
        books_context = "\n\n".join(books_results) if books_results else "Нет релевантной информации в книгах."
        conversations_context = "\n\n".join(conversations_results) if conversations_results else "Нет предыдущих обсуждений по этой теме."

        print(f"[KB_SEARCH] Books context length: {len(books_context)}")
        print(f"[KB_SEARCH] Full books context:\n{books_context}\n")

        return books_context, conversations_context

    async def _detect_emotions_for_character(
        self,
        emotion_detector,
        character_name: str,
        message_window: List[Message],
        books_context: str
    ) -> tuple[Optional[Emotions], float]:
        """
        Detect emotions based on message window and knowledge context.

        Args:
            emotion_detector: EmotionDetector instance
            character_name: Name of the character
            message_window: Recent messages for context
            books_context: Knowledge base context about the topic being discussed

        Returns:
            tuple[Optional[Emotions], float]: (Detected emotions or None, optimal temperature)
        """
        try:
            emotions = await emotion_detector.detect_emotions(
                character_name, message_window, books_context
            )

            if emotions:
                temperature = emotions.calculate_optimal_temperature()
                return emotions, temperature
            else:
                # Fallback to default temperature if detection fails
                return None, 0.7
        except Exception as e:
            # Log error but continue with default temperature
            print(f"[GROUP CHAT] Emotion detection error: {e}")
            import traceback
            traceback.print_exc()
            return None, 0.7

    async def _save_character_message(
        self,
        character_id: str,
        message: Message
    ) -> None:
        """
        Save character's response message to database.

        Args:
            character_id: ID of the character
            message: Message to save
        """
        await self.message_repository.save_message(character_id, message)

    def _calculate_response_stats(
        self,
        responses: List[CharacterResponse]
    ) -> tuple[int, int]:
        """
        Calculate statistics about character responses.

        A response is considered successful if it has a message and no error.

        Args:
            responses: List of character responses

        Returns:
            tuple[int, int]: (successful_count, failed_count)
        """
        successful = sum(1 for r in responses if r.message is not None and not r.error)
        failed = sum(1 for r in responses if r.message is None or r.error)
        return successful, failed

    async def _save_user_message_to_group(
        self,
        group_id: str,
        content: str
    ) -> Message:
        """
        Save user message to group_messages table.

        Args:
            group_id: Group ID
            content: Message content

        Returns:
            Message: Saved message (returned from repository)
        """
        from uuid import uuid4
        from datetime import datetime

        user_message = Message(
            id=str(uuid4()),
            role="user",
            content=content,
            character_id=None,
            created_at=datetime.utcnow()
        )
        saved_message = await self.group_message_repository.create_message(group_id, user_message)
        return saved_message

    async def _save_character_message_to_group(
        self,
        group_id: str,
        response: CharacterResponse
    ) -> None:
        """
        Save character response to group_messages table.

        Args:
            group_id: Group ID
            response: Character response
        """
        if response.message and not response.error:
            try:
                from uuid import uuid4
                from datetime import datetime

                # Create a custom message object that includes character_name
                # We can't add it to Message model, so we'll pass it via the repository
                message = Message(
                    id=str(uuid4()),
                    role="assistant",
                    content=response.message,
                    character_id=response.character_id,
                    created_at=datetime.utcnow(),
                    emotions=response.emotions
                )
                # Store character_name temporarily as an attribute for the repository to use
                # This is a workaround since Message model doesn't have character_name field
                object.__setattr__(message, 'character_name', response.character_name)
                await self.group_message_repository.create_message(group_id, message)
            except Exception as e:
                # Log error but continue processing (don't let storage errors break the flow)
                print(f"[GROUP CHAT] Failed to save character message: {e}")
                import traceback
                traceback.print_exc()
