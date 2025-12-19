# LLM Module

**Layer:** Logic (Level 2)
**Dependencies:** configs, models, exceptions
**Purpose:** LLM client for response generation and prompt construction

## File Map

| File | Description |
|------|-------------|
| `ollama_client.py` | Ollama API client for chat completions |
| `prompt_builder.py` | Build system and user prompts with context and emotions |
| `emotion_detector.py` | Detect character emotions using LLM analysis with KB context |

## Key Components

### `ollama_client.py`
**Purpose:** Generate chat responses via Ollama

**Key Class:** `OllamaClient`

**Key Methods:**
- `generate_response(system_prompt: str, user_prompt: str, temperature: float, max_tokens: int) -> str`
- `generate_streaming_response(system_prompt: str, user_prompt: str, temperature: float) -> AsyncGenerator`

**Model Used:**
- Chat model: `qwen2.5:7b` (from config)

**Implementation:**
- Uses Ollama HTTP API (`/api/chat` endpoint)
- Supports streaming and non-streaming responses
- Async HTTP client via `httpx`

**Error Handling:**
- Raises `LLMError` if generation fails
- Includes error context (prompts, model name)

**Dependencies:** httpx, configs.ollama_models, exceptions

### `prompt_builder.py`
**Purpose:** Construct prompts with character context

**Key Class:** `PromptBuilder`

**Key Methods:**
- `build_system_prompt(character_name: str, context: str) -> str` - Character identity + knowledge
- `build_user_prompt(previous_discussion: str, messages: List[Message]) -> str` - Conversation context
- `build_prompts(character_name: str, context: str, previous_discussion: str, messages: List[Message]) -> tuple[str, str]`
- `format_messages(messages: List[Message]) -> str` - Format chat history
- `format_knowledge_chunks(chunks: List[str]) -> str` - Format KB search results

**Prompt Template:**

**System Prompt:**
```
Ты {character_name}.
Твои знания по обсуждаемой теме: {context}
```

**User Prompt:**
```
Раньше по этой теме вы обсуждали: {previous_discussion}
История беседы: {formatted_messages}

Изучи беседу исходя из своих знаний и сформулируй мнение: с чем ты согласен,
с чем нет и почему, что предлагаешь обсудить дополнительно.
```

**Dependencies:** models.Message

### `emotion_detector.py`
**Purpose:** Detect character emotions based on chat history and knowledge base context

**Key Class:** `EmotionDetector`

**Key Methods:**
- `detect_emotions(character_name: str, messages: List[Message], context: str) -> Optional[Emotions]`
- `_build_emotion_prompt(character_name: str, messages: List[Message], context: str) -> str`
- `_parse_emotion_response(llm_response: str) -> Emotions`

**Emotion Prompt Template:**
```
Ты {character_name}.
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
joy - радость. Он тем больше, чем сильнее сообщения из чата подтверждают твои принципы и убеждения, укрепляют их.
```

**Implementation:**
- Uses knowledge base context to ground emotion detection in character's actual knowledge
- Analyzes chat history in context of character's documented beliefs and principles
- Parses LLM response using regex to extract emotion values (0-100)
- Returns `None` on failure for graceful degradation (default temperature used)
- Uses low temperature (0.3) for structured output consistency

**Context Integration:**
- **Input**: Chat history + books KB context (character's knowledge)
- **Purpose**: Emotions based on how chat aligns/conflicts with character's documented views
- **Reuse**: Same KB context passed to both emotion detection and response generation

**Dependencies:** models.Message, models.Emotions, llm.OllamaClient

## Interface Signatures

```python
# OllamaClient
class OllamaClient:
    def __init__(self, ollama_base_url: str = "http://localhost:11434"):
        """
        Initialize Ollama client.

        Args:
            ollama_base_url: Ollama server URL
        """

    async def generate_response(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """
        Generate chat response.

        Args:
            system_prompt: System message (character identity + knowledge)
            user_prompt: User message (conversation context + task)
            temperature: Randomness (0.0-1.0)
            max_tokens: Max response length

        Returns:
            Generated response text

        Raises:
            LLMError: If generation fails
        """

    async def generate_streaming_response(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        """Generate streaming response (yields tokens as generated)."""

# PromptBuilder
class PromptBuilder:
    @staticmethod
    def build_system_prompt(character_name: str, context: str) -> str:
        """Build system prompt with character identity and knowledge."""

    @staticmethod
    def build_user_prompt(previous_discussion: str, messages: List[Message]) -> str:
        """Build user prompt with conversation context."""

    @staticmethod
    def build_prompts(
        character_name: str,
        context: str,
        previous_discussion: str,
        messages: List[Message]
    ) -> tuple[str, str]:
        """Build both system and user prompts."""

    @staticmethod
    def format_messages(messages: List[Message]) -> str:
        """Format message list as conversation history."""

    @staticmethod
    def format_knowledge_chunks(chunks: List[str]) -> str:
        """Format KB search results as context."""

# EmotionDetector
class EmotionDetector:
    def __init__(self, ollama_client: OllamaClient):
        """Initialize emotion detector with LLM client."""

    async def detect_emotions(
        self,
        character_name: str,
        messages: List[Message],
        context: str
    ) -> Optional[Emotions]:
        """
        Detect emotions based on chat history and KB context.

        Args:
            character_name: Name of the character
            messages: Chat history to analyze
            context: Knowledge base context (books KB)

        Returns:
            Detected emotions or None if detection fails
        """

    def _build_emotion_prompt(
        self,
        character_name: str,
        messages: List[Message],
        context: str
    ) -> str:
        """Build emotion detection prompt with KB context."""

    def _parse_emotion_response(self, llm_response: str) -> Emotions:
        """Parse LLM response to extract emotion values."""
```

## Data Flow

**Complete Message Processing Flow (with Emotion Detection):**
1. User sends message
2. ChatService retrieves recent messages from DB
3. **Knowledge Base Search** → [books_context, conversations_context]
4. **Emotion Detection** (uses books_context):
   - `EmotionDetector.detect_emotions(name, messages, books_context)`
   - LLM analyzes emotions with character's knowledge
   - Returns `Emotions` object or `None`
5. **Response Generation** (reuses books_context):
   - `PromptBuilder.build_prompts()` constructs prompts with emotions
   - System prompt: character name + books_context + emotions
   - User prompt: conversations_context + chat history + current message
   - `OllamaClient.generate_response()` sends to Ollama with dynamic temperature
   - Ollama generates response as character
6. Response and emotions saved to DB

**Key Optimization**: books_context fetched once, reused for both emotion detection and response generation.

**Context Reuse Pattern:**
```
Knowledge Base Search (once)
    ↓
[books_context] ─────┬──→ EmotionDetector.detect_emotions()
                     │       ↓
                     │   [Emotions detected with KB grounding]
                     │       ↓
                     └──→ PromptBuilder.build_system_prompt()
                             ↓
                         [system_prompt with context + emotions]
                             ↓
                         OllamaClient.generate_response(dynamic_temp)
```

**Emotion Detection Flow:**
```
Recent Messages + Books Context
    ↓
EmotionDetector._build_emotion_prompt(name, messages, context)
    ↓
[emotion_prompt: "Ты {name}. Твои знания: {context}. Сообщения: {messages}"]
    ↓
OllamaClient.generate_response(emotion_prompt, temperature=0.3)
    ↓
EmotionDetector._parse_emotion_response(llm_response)
    ↓
[Emotions(fear=X, anger=Y, sadness=Z, disgust=A, joy=B)]
```

**Response Generation Flow:**
```
Knowledge Base Search
    ↓
[book context chunks]
    ↓
PromptBuilder.format_knowledge_chunks()
    ↓
[formatted context string]
    ↓
PromptBuilder.build_system_prompt(name, context, emotions)
    ↓
[system_prompt: "Ты {name}. Твои знания: {context}. Твои эмоции: {emotions}"]

Conversation KB Search + Recent Messages
    ↓
[previous discussion chunks] + [recent messages]
    ↓
PromptBuilder.build_user_prompt(prev_disc, messages, current_msg)
    ↓
[user_prompt with full context]
    ↓
OllamaClient.generate_response(system_prompt, user_prompt, dynamic_temperature)
    ↓
[character response]
```

**API Communication:**
```
Client → Ollama HTTP API
POST /api/chat
{
  "model": "qwen2.5:7b",
  "messages": [
    {"role": "system", "content": system_prompt},
    {"role": "user", "content": user_prompt}
  ],
  "temperature": 0.7,
  "options": {"num_predict": 2000}
}
←
{
  "message": {
    "role": "assistant",
    "content": "generated response..."
  }
}
```

## Usage Notes

**Prompt Design:**
- **System prompt**: Establishes character identity and knowledge
- **User prompt**: Provides conversation context and task
- Russian language for both prompts (target audience)
- Instructs character to form opinion based on knowledge

**Context Management:**
- `context`: Top 5 results from Books KB
- `previous_discussion`: Top 3 results from Conversations KB
- `messages`: Last 10 messages from current conversation
- All combined into prompts

**Temperature Settings:**
- Default: 0.7 (balanced creativity/coherence)
- Lower (0.3-0.5): More factual, less creative
- Higher (0.8-1.0): More creative, less consistent

**Token Limits:**
- Max tokens: 2000 (configurable)
- Typical response: 200-500 tokens
- Prevents overly long responses

**Error Handling:**
- Network errors → `LLMError`
- Model not found → `LLMError`
- Invalid prompts → `LLMError`
- Ollama must be running locally

**Configuration:**
- Model configured in `configs/ollama_models.py`
- Ollama base URL configurable
- Temperature and max_tokens adjustable per request
