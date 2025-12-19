"""
Emotion detector for analyzing character emotions based on chat history.

This module provides functionality for detecting emotions using LLM analysis.
Depends on: models, llm/ollama_client
"""

import re
from typing import Optional, List
from models import Message, Emotions
from llm import OllamaClient
from exceptions import LLMError


class EmotionDetector:
    """
    Detects character emotions based on chat history using LLM analysis.

    This class sends a specialized prompt to the LLM to analyze chat history
    and extract emotion values, which are then used to adjust response generation.
    """

    EMOTION_PROMPT_TEMPLATE = """Ты {name}.
Твои знания по обсуждаемой теме: {context}
Сообщения из чата: {messages}
Формат ответа:
<emotions>
<fear>0-100</fear>
<anger>0-100</anger>
<sadness>0-100</sadness>
<disgust>0-100</disgust>
<joy>0-100</joy>
</emotions>

fear - страх. Он тем больше, чем сильнее сообщения из чата противоречат твоим принципам и убеждениям, разрушают их.
anger - злость. Он тем больше, чем сильнее сообщения из чата пытаются заставить тебя изменить свои принципы и убеждения.
sadness - печаль. Он тем больше, чем сильнее динамика сообщений из чата уходит всё дальше от твоих идей, всё необратимее изменяют их.
disgust - отвращение. Он тем больше, чем сильнее сообщения из чата противоречат твоим нормам морали и этики.
joy - радость. Он тем больше, чем сильнее сообщения из чата подтверждают твои принципы и убеждения, укрепляют их."""

    def __init__(self, ollama_client: OllamaClient):
        """
        Initialize emotion detector.

        Args:
            ollama_client: Ollama client instance for LLM calls
        """
        self.ollama_client = ollama_client

    async def detect_emotions(self, character_name: str,
                             messages: List[Message],
                             context: str) -> Optional[Emotions]:
        """
        Detect emotions based on character role, chat history, and knowledge context.

        Args:
            character_name: Name of the character
            messages: Chat history to analyze
            context: Knowledge base context about the topic being discussed

        Returns:
            Optional[Emotions]: Detected emotions, or None if detection fails
        """
        print(f"[EMOTION_DETECTOR] detect_emotions called for {character_name} with {len(messages)} messages")
        try:
            prompt = self._build_emotion_prompt(character_name, messages, context)
            print(f"[EMOTION_DETECTOR] Built prompt (first 200 chars): {prompt[:200]}...")

            # Use low temperature for structured output
            print(f"[EMOTION_DETECTOR] Calling LLM for emotion detection...")
            response = await self.ollama_client.generate_response(
                system_prompt="",
                user_prompt=prompt,
                temperature=0.3
            )
            print(f"[EMOTION_DETECTOR] LLM response received (length: {len(response)})")
            print(f"[EMOTION_DETECTOR] LLM response: {response}")

            emotions = self._parse_emotion_response(response)
            print(f"[EMOTION_DETECTOR] Parsed emotions: {emotions}")
            return emotions
        except Exception as e:
            # Log error but don't fail - graceful degradation
            print(f"[EMOTION_DETECTOR] Emotion detection failed: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _build_emotion_prompt(self, character_name: str,
                             messages: List[Message],
                             context: str) -> str:
        """
        Build emotion detection prompt with knowledge base context.

        Args:
            character_name: Name of the character
            messages: Chat history
            context: Knowledge base context about the topic being discussed

        Returns:
            str: Formatted emotion detection prompt
        """
        formatted_messages = self._format_messages_for_emotion_prompt(messages)
        return self.EMOTION_PROMPT_TEMPLATE.format(
            name=character_name,
            context=context,
            messages=formatted_messages
        )

    def _format_messages_for_emotion_prompt(self, messages: List[Message]) -> str:
        """
        Format messages for emotion detection prompt.

        Args:
            messages: List of messages to format

        Returns:
            str: Formatted message history string
        """
        if not messages:
            return "Нет предыдущих сообщений"

        formatted = []
        for msg in messages:
            role_name = "Пользователь" if msg.role == "user" else "Ассистент"
            formatted.append(f"{role_name}: {msg.content}")

        return "\n".join(formatted)

    def _parse_emotion_response(self, llm_response: str) -> Emotions:
        """
        Parse LLM response to extract emotion values using regex.

        Extracts emotion values from XML-like tags in the format:
        <emotion_name>value</emotion_name>

        Args:
            llm_response: Raw response from LLM

        Returns:
            Emotions: Parsed emotions (defaults to 0 for missing values)
        """
        fear = self._extract_emotion_value(llm_response, "fear")
        anger = self._extract_emotion_value(llm_response, "anger")
        sadness = self._extract_emotion_value(llm_response, "sadness")
        disgust = self._extract_emotion_value(llm_response, "disgust")
        joy = self._extract_emotion_value(llm_response, "joy")

        return Emotions(
            fear=fear,
            anger=anger,
            sadness=sadness,
            disgust=disgust,
            joy=joy
        )

    def _extract_emotion_value(self, llm_response: str,
                               emotion_name: str) -> int:
        """
        Extract single emotion value from LLM response using regex.

        Args:
            llm_response: Raw response from LLM
            emotion_name: Name of the emotion to extract (fear, anger, etc.)

        Returns:
            int: Emotion value (0-100), defaults to 0 if not found or invalid
        """
        # Non-greedy matching to handle multiple tags
        pattern = f"<{emotion_name}>(.*?)</{emotion_name}>"
        match = re.search(pattern, llm_response, re.IGNORECASE | re.DOTALL)

        if match:
            return self._validate_emotion_value(match.group(1))

        return 0

    def _validate_emotion_value(self, value: str) -> int:
        """
        Validate and convert emotion value string to integer.

        Args:
            value: String value to validate

        Returns:
            int: Validated integer value (0-100), or 0 if invalid
        """
        try:
            # Strip whitespace and convert to float first, then int
            # This handles strings like "42.5" or "42.0"
            val = int(float(value.strip()))
            # Clamp to 0-100 range
            return max(0, min(100, val))
        except (ValueError, AttributeError, TypeError):
            return 0
