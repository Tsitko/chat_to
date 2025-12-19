"""
Prompt builder for constructing LLM prompts.

This module builds prompts for character responses based on context.
Depends on: models
"""

from typing import List, Optional
from models import Message, Emotions


class PromptBuilder:
    """
    Builds prompts for LLM based on character context and chat history.

    This class implements the prompt template defined in requirements.
    Prompts are split into system and user parts for proper LLM interaction.
    """

    SYSTEM_PROMPT_TEMPLATE = """Ты {name}.
Твои знания по обсуждаемой теме: {context}
Твои эмоции: {emotions}"""

    SYSTEM_PROMPT_TEMPLATE_NO_EMOTIONS = """Ты {name}.
Твои знания по обсуждаемой теме: {context}"""

    USER_PROMPT_TEMPLATE = """Раньше по этой теме вы обсуждали: {previous_discussion}
История предыдущих сообщений: {messages}

Новый вопрос пользователя: {current_question}

ВАЖНО: Ты участвуешь в групповой беседе с другими персонажами.
- ИЗУЧИ ответы других участников и дай СВОЙ взгляд, отличный от их мнений
- НЕ ПОВТОРЯЙ то, что уже сказали другие
- Используй СВОИ знания из книг (см. "Твои знания по обсуждаемой теме" в system prompt)
- Отвечай в СВОЕМ стиле: если ты философ - рассуждай глубоко, если политик - говори практично, если юморист - добавь иронию и шутки
- Приводи конкретные примеры, цитаты или рассуждения из твоих знаний

Дай содержательный ответ на вопрос от ТВОЕГО лица."""

    @staticmethod
    def build_system_prompt(character_name: str, context: str,
                           emotions: Optional[Emotions] = None) -> str:
        """
        Build the system prompt with character identity, knowledge, and emotions.

        Args:
            character_name: Name of the character
            context: Relevant knowledge from books KB
            emotions: Optional detected emotions to include in prompt

        Returns:
            str: Formatted system prompt for LLM
        """
        if emotions:
            emotions_str = PromptBuilder.format_emotions(emotions)
            return PromptBuilder.SYSTEM_PROMPT_TEMPLATE.format(
                name=character_name,
                context=context,
                emotions=emotions_str
            )
        else:
            return PromptBuilder.SYSTEM_PROMPT_TEMPLATE_NO_EMOTIONS.format(
                name=character_name,
                context=context
            )

    @staticmethod
    def build_user_prompt(previous_discussion: str, messages: List[Message],
                         current_question: str) -> str:
        """
        Build the user prompt with conversation context and task.

        Args:
            previous_discussion: Relevant snippets from conversations KB
            messages: Recent chat history
            current_question: The current user message/question

        Returns:
            str: Formatted user prompt for LLM
        """
        formatted_messages = PromptBuilder.format_messages(messages)
        return PromptBuilder.USER_PROMPT_TEMPLATE.format(
            previous_discussion=previous_discussion,
            messages=formatted_messages,
            current_question=current_question
        )

    @staticmethod
    def build_prompts(character_name: str, context: str, previous_discussion: str,
                     messages: List[Message], current_question: str,
                     emotions: Optional[Emotions] = None) -> tuple[str, str]:
        """
        Build both system and user prompts for the LLM.

        Args:
            character_name: Name of the character
            context: Relevant knowledge from books KB
            previous_discussion: Relevant snippets from conversations KB
            messages: Recent chat history
            current_question: The current user message/question
            emotions: Optional detected emotions to include in prompt

        Returns:
            tuple[str, str]: (system_prompt, user_prompt)
        """
        system_prompt = PromptBuilder.build_system_prompt(character_name, context, emotions)
        user_prompt = PromptBuilder.build_user_prompt(previous_discussion, messages,
                                                       current_question)
        return system_prompt, user_prompt

    @staticmethod
    def format_messages(messages: List[Message]) -> str:
        """
        Format message history into a readable string.

        Args:
            messages: List of messages

        Returns:
            str: Formatted message history
        """
        if not messages:
            return "Нет предыдущих сообщений"

        formatted = []
        for msg in messages:
            if msg.role == "user":
                role_name = "Пользователь"
            else:
                # For assistant messages, use character name if available
                character_name = getattr(msg, 'character_name', None)
                role_name = character_name if character_name else "Ассистент"
            formatted.append(f"{role_name}: {msg.content}")

        return "\n".join(formatted)

    @staticmethod
    def truncate_context(text: str, max_length: int = 2000) -> str:
        """
        Truncate context to fit within token limits.

        Args:
            text: Text to truncate
            max_length: Maximum length in characters

        Returns:
            str: Truncated text
        """
        if len(text) <= max_length:
            return text

        return text[:max_length] + "..."

    @staticmethod
    def format_knowledge_chunks(chunks: List[str]) -> str:
        """
        Format knowledge base chunks into a coherent context.

        Args:
            chunks: List of text chunks from KB

        Returns:
            str: Formatted context string
        """
        if not chunks:
            return "Нет релевантной информации"

        # Join chunks with newlines
        return "\n\n".join(chunks)

    @staticmethod
    def build_emotion_prompt(character_name: str, messages: List[Message]) -> str:
        """
        DEPRECATED: Use EmotionDetector.detect_emotions() instead.

        This method is no longer used by ChatService. Emotion detection
        has been moved to EmotionDetector class with context support.

        Args:
            character_name: Name of the character
            messages: Chat history to analyze for emotions

        Returns:
            str: Formatted emotion detection prompt
        """
        # This method is deprecated but kept for backward compatibility
        raise NotImplementedError(
            "build_emotion_prompt() is deprecated. "
            "Use EmotionDetector.detect_emotions() instead."
        )

    @staticmethod
    def format_emotions(emotions: Emotions) -> str:
        """
        Format emotions dict into a string for prompt inclusion.

        Args:
            emotions: Emotions object to format

        Returns:
            str: Formatted emotions string in Russian
        """
        return emotions.to_string()
