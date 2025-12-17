"""
Prompt builder for constructing LLM prompts.

This module builds prompts for character responses based on context.
Depends on: models
"""

from typing import List
from models import Message


class PromptBuilder:
    """
    Builds prompts for LLM based on character context and chat history.

    This class implements the prompt template defined in requirements.
    Prompts are split into system and user parts for proper LLM interaction.
    """

    SYSTEM_PROMPT_TEMPLATE = """Ты {name}.
Твои знания по обсуждаемой теме: {context}"""

    USER_PROMPT_TEMPLATE = """Раньше по этой теме вы обсуждали: {previous_discussion}
История предыдущих сообщений: {messages}

Новый вопрос пользователя: {current_question}

На основе своих знаний ответь на новый вопрос пользователя."""

    @staticmethod
    def build_system_prompt(character_name: str, context: str) -> str:
        """
        Build the system prompt with character identity and knowledge.

        Args:
            character_name: Name of the character
            context: Relevant knowledge from books KB

        Returns:
            str: Formatted system prompt for LLM
        """
        return PromptBuilder.SYSTEM_PROMPT_TEMPLATE.format(
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
                     messages: List[Message], current_question: str) -> tuple[str, str]:
        """
        Build both system and user prompts for the LLM.

        Args:
            character_name: Name of the character
            context: Relevant knowledge from books KB
            previous_discussion: Relevant snippets from conversations KB
            messages: Recent chat history
            current_question: The current user message/question

        Returns:
            tuple[str, str]: (system_prompt, user_prompt)
        """
        system_prompt = PromptBuilder.build_system_prompt(character_name, context)
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
            role_name = "Пользователь" if msg.role == "user" else "Ассистент"
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
