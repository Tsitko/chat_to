"""
Emotions data model.

This module defines the Emotions model for emotion detection in chat responses.
"""

from pydantic import BaseModel, Field, field_validator


class Emotions(BaseModel):
    """
    Emotions model representing detected emotions in character responses.

    Each emotion is represented as an integer value from 0 to 100:
    - fear: Increases when chat contradicts character's principles and beliefs
    - anger: Increases when chat tries to force character to change principles
    - sadness: Increases when conversation dynamics move away from character's ideas
    - disgust: Increases when chat contradicts character's moral and ethical norms
    - joy: Increases when chat confirms and strengthens character's principles
    """

    fear: int = Field(default=0, ge=0, le=100, description="Fear level (0-100)")
    anger: int = Field(default=0, ge=0, le=100, description="Anger level (0-100)")
    sadness: int = Field(default=0, ge=0, le=100, description="Sadness level (0-100)")
    disgust: int = Field(default=0, ge=0, le=100, description="Disgust level (0-100)")
    joy: int = Field(default=0, ge=0, le=100, description="Joy level (0-100)")

    @field_validator('fear', 'anger', 'sadness', 'disgust', 'joy', mode='before')
    @classmethod
    def validate_emotion_range(cls, v) -> int:
        """
        Validate that emotion values are within 0-100 range.
        Converts floats to ints if needed.

        Args:
            v: Emotion value (int or float)

        Returns:
            int: Validated emotion value

        Raises:
            ValueError: If value is outside 0-100 range
        """
        # Convert float to int if needed
        if isinstance(v, float):
            v = int(v)

        if not isinstance(v, int):
            raise ValueError(f"Emotion value must be an integer, got {type(v)}")

        if not 0 <= v <= 100:
            raise ValueError(f"Emotion value must be between 0 and 100, got {v}")
        return v

    def get_max_emotion_value(self) -> int:
        """
        Get the maximum emotion value across all emotions.

        Returns:
            int: Maximum emotion value (0-100)
        """
        return max(self.fear, self.anger, self.sadness, self.disgust, self.joy)

    def calculate_optimal_temperature(self) -> float:
        """
        Calculate optimal LLM temperature based on maximum emotion value.

        Temperature mapping:
        - 0-33: temperature = 0.1 (calm, rational responses)
        - 34-66: temperature = 0.3 (moderate emotional responses)
        - 67-100: temperature = 0.5 (highly emotional responses)

        Returns:
            float: Optimal temperature value (0.1, 0.3, or 0.5)
        """
        max_emotion = self.get_max_emotion_value()

        if max_emotion <= 33:
            return 0.1
        elif max_emotion <= 66:
            return 0.3
        else:
            return 0.5

    def to_string(self) -> str:
        """
        Format emotions as a human-readable string for prompt inclusion.

        Returns:
            str: Formatted emotions string in Russian
        """
        emotions_map = {
            'fear': 'страх',
            'anger': 'злость',
            'sadness': 'печаль',
            'disgust': 'отвращение',
            'joy': 'радость'
        }

        emotion_strings = []
        for emotion_key, emotion_name in emotions_map.items():
            value = getattr(self, emotion_key)
            emotion_strings.append(f"{emotion_name}: {value}/100")

        return ", ".join(emotion_strings)
