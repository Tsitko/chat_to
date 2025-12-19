"""
Group chat configuration.

This module defines configuration constants for group chat functionality.
"""

# Maximum number of characters allowed in a single group
MAX_CHARACTERS_PER_GROUP: int = 10

# Number of recent messages to use for context (sliding window)
MESSAGE_WINDOW_SIZE: int = 5

# Timeout for individual character response generation (seconds)
CHARACTER_TIMEOUT_SECONDS: int = 30

# Total timeout for entire group chat request (seconds)
TOTAL_GROUP_TIMEOUT_SECONDS: int = 300  # 5 minutes

# Whether to continue processing if a character fails
CONTINUE_ON_CHARACTER_FAILURE: bool = True
