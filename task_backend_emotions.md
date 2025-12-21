# Backend Task: Add Emotion Detection to LLM Responses

## Objective
Add emotion detection functionality to the chat system. Before generating the main LLM response, the system should detect emotions based on the character's role and chat history, then use these emotions to adjust the response generation.

## Requirements

### 1. Emotion Model
Create an Emotions data model with five emotion fields:
- `fear` (0-100): Fear increases when chat messages contradict the character's principles and beliefs
- `anger` (0-100): Anger increases when messages try to force the character to change their principles
- `sadness` (0-100): Sadness increases when conversation dynamics move away from the character's ideas
- `disgust` (0-100): Disgust increases when messages contradict the character's moral and ethical norms
- `joy` (0-100): Joy increases when messages confirm and strengthen the character's principles

### 2. Emotion Detection
Create an `EmotionDetector` class that:
- Sends an emotion detection prompt to the LLM with character name and chat history
- Uses this prompt template:
```python
SYSTEM_EMOTION_PROMPT_TEMPLATE = """Ты {name}.
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
"""
```

- Parses the LLM response using regex to extract emotion values from XML tags
- Returns 0 for any emotion value not found in the response
- Calculates optimal temperature based on the maximum emotion value:
  - 0-33: temperature = 0.1
  - 34-66: temperature = 0.3
  - 67-100: temperature = 0.5

### 3. Update PromptBuilder
Modify the `PromptBuilder` class to:
- Add `SYSTEM_EMOTION_PROMPT_TEMPLATE` constant
- Update `SYSTEM_PROMPT_TEMPLATE` to include emotions:
```python
SYSTEM_PROMPT_TEMPLATE = """Ты {name}.
Твои знания по обсуждаемой теме: {context}
Твои эмоции: {emotions}"""
```
- Add method to build emotion detection prompt
- Add method to format emotions dict into a string for the prompt

### 4. Update ChatService
Modify the `ChatService` class to:
- Detect emotions BEFORE generating the main response
- Pass chat history to emotion detector
- Include detected emotions in the system prompt
- Use dynamic temperature based on emotions
- Store emotions in the assistant message

### 5. Update Message Model
Extend the `Message` model to:
- Add optional `emotions` field of type `Emotions`
- Include `character_id` field (already exists)
- Ensure emotions are included in API responses

### 6. API Response
Ensure the message API endpoint returns emotions in the assistant message so the frontend can display them.

## Technical Constraints
- Use regex for parsing emotion XML tags (LLM response may not be perfectly formatted)
- Handle missing or invalid emotion values by defaulting to 0
- Emotion detection should not block or fail the main response generation
- If emotion detection fails, use default temperature (0.7)

## Testing Requirements
- Unit tests for EmotionDetector:
  - Test regex parsing with valid XML
  - Test parsing with missing tags
  - Test parsing with invalid values
  - Test temperature calculation for all ranges

- Unit tests for updated PromptBuilder:
  - Test emotion prompt building
  - Test system prompt with emotions
  - Test emotion formatting

- Integration tests for ChatService:
  - Test emotion detection flow
  - Test fallback when emotion detection fails
  - Test that emotions are saved in messages

## Files to Create/Modify
- **Create**: `backend/llm/emotion_detector.py` - New EmotionDetector class
- **Modify**: `backend/models/message.py` - Add Emotions model and update Message
- **Modify**: `backend/llm/prompt_builder.py` - Add emotion prompt methods
- **Modify**: `backend/chat_handler/chat_service.py` - Integrate emotion detection

## Dependencies
- Uses existing OllamaClient for LLM calls
- Uses existing Message and PromptBuilder classes
- No new external dependencies required

---

## Architecture Design

### Created Structure

```
backend/
├── models/
│   ├── emotions.py           # NEW - Emotions data model with validation
│   ├── message.py            # MODIFIED - Added emotions field
│   └── __init__.py           # MODIFIED - Export Emotions
├── llm/
│   ├── emotion_detector.py   # NEW - EmotionDetector class
│   ├── prompt_builder.py     # MODIFIED - Added emotion methods
│   ├── ollama_client.py      # UNCHANGED
│   └── __init__.py           # MODIFIED - Export EmotionDetector
└── chat_handler/
    └── chat_service.py       # MODIFIED - Integrated emotion detection
```

### Components Overview

#### 1. Emotions Model (`backend/models/emotions.py`)
**Purpose**: Data model representing the five emotion values with validation and utility methods.

**Responsibilities**:
- Store five emotion values (fear, anger, sadness, disgust, joy) as integers 0-100
- Validate emotion values are within range using Pydantic validators
- Calculate maximum emotion value across all emotions
- Map maximum emotion to optimal LLM temperature (0-33→0.1, 34-66→0.3, 67-100→0.5)
- Format emotions as human-readable string for prompt inclusion

**Key Methods**:
- `validate_emotion_range(cls, v: int) -> int`: Pydantic validator for 0-100 range
- `get_max_emotion_value() -> int`: Returns max emotion value
- `calculate_optimal_temperature() -> float`: Returns temperature based on max emotion
- `to_string() -> str`: Formats emotions in Russian for prompt

**Design Decisions**:
- Uses Pydantic for automatic validation and serialization
- Temperature mapping is hardcoded per requirements (0.1/0.3/0.5)
- to_string() returns Russian text matching existing prompt language

#### 2. EmotionDetector Class (`backend/llm/emotion_detector.py`)
**Purpose**: Detects character emotions by analyzing chat history using LLM.

**Responsibilities**:
- Build emotion detection prompt with character name and message history
- Send prompt to LLM via OllamaClient
- Parse LLM response using regex to extract XML-tagged emotion values
- Handle missing or malformed emotion values (default to 0)
- Return Emotions object or None if detection completely fails

**Key Methods**:
- `detect_emotions(character_name: str, messages: List[Message]) -> Optional[Emotions]`: Main entry point
- `_build_emotion_prompt(character_name: str, messages: List[Message]) -> str`: Constructs prompt
- `_format_messages_for_emotion_prompt(messages: List[Message]) -> str`: Formats message history
- `_parse_emotion_response(llm_response: str) -> Emotions`: Parses XML tags using regex
- `_extract_emotion_value(llm_response: str, emotion_name: str) -> int`: Extracts single emotion
- `_validate_emotion_value(value: str) -> int`: Validates and converts string to int

**Design Decisions**:
- Uses regex for parsing instead of XML parser (LLM output may be malformed)
- Returns Optional[Emotions] to allow graceful degradation
- Each emotion extraction is independent to maximize partial success
- No caching - emotions recalculated on every message (requirements may change)

**Regex Pattern Design**:
```python
pattern = f"<{emotion_name}>(.*?)</{emotion_name}>"
```
- Captures content between XML-like tags
- Non-greedy matching to handle multiple tags
- Returns 0 if tag not found or value invalid

#### 3. Updated Message Model (`backend/models/message.py`)
**Modifications**:
- Added `character_id: Optional[str]` field (was missing but used in code)
- Added `emotions: Optional[Emotions]` field for assistant messages
- Imports Emotions model

**Design Decisions**:
- Emotions are optional (only present in assistant messages)
- character_id added as optional for backward compatibility
- Pydantic automatically handles Emotions serialization in API responses

#### 4. Updated PromptBuilder (`backend/llm/prompt_builder.py`)
**Modifications**:
- Added `EMOTION_PROMPT_TEMPLATE` constant with emotion detection prompt
- Added `SYSTEM_PROMPT_TEMPLATE` with emotions placeholder
- Kept `SYSTEM_PROMPT_TEMPLATE_NO_EMOTIONS` for backward compatibility
- Updated `build_system_prompt()` to accept optional emotions parameter
- Updated `build_prompts()` to accept optional emotions parameter
- Added `build_emotion_prompt(character_name, messages)` method
- Added `format_emotions(emotions)` method

**Design Decisions**:
- Maintains backward compatibility (emotions optional)
- Two system prompt templates to avoid empty emotion field
- Static methods maintained for consistency with existing code
- Emotion formatting delegates to Emotions.to_string() for single source of truth

#### 5. Updated ChatService (`backend/chat_handler/chat_service.py`)
**Modifications**:
- Added `emotion_detector` instance in `__init__`
- Changed `_generate_response()` return type to `tuple[str, Emotions]`
- Updated `process_message()` to include emotions in assistant message
- Added `_detect_emotions()` helper method

**New Flow**:
1. Get recent messages
2. **Detect emotions** from message history
3. Calculate optimal temperature from emotions
4. Search knowledge bases
5. Build prompts **with emotions**
6. Generate response with **dynamic temperature**
7. Create assistant message **with emotions**
8. Save and index messages

**Design Decisions**:
- Emotion detection happens BEFORE KB search (requirements specify "before response")
- If emotion detection fails, use default temperature 0.7
- Emotions stored in assistant message for API response
- Error handling: emotion detection failures don't block message processing

### Implementation Recommendations

#### Phase 1: Implement Emotions Model
**File**: `backend/models/emotions.py`

1. **Validation logic**:
   - Pydantic Field constraints handle range validation automatically
   - field_validator provides custom error messages

2. **Temperature mapping**:
   ```python
   def calculate_optimal_temperature(self) -> float:
       max_emotion = self.get_max_emotion_value()
       if max_emotion <= 33:
           return 0.1
       elif max_emotion <= 66:
           return 0.3
       else:
           return 0.5
   ```

3. **String formatting**:
   ```python
   def to_string(self) -> str:
       return f"страх: {self.fear}/100, злость: {self.anger}/100, печаль: {self.sadness}/100, отвращение: {self.disgust}/100, радость: {self.joy}/100"
   ```

#### Phase 2: Implement EmotionDetector
**File**: `backend/llm/emotion_detector.py`

1. **Emotion detection flow**:
   ```python
   async def detect_emotions(self, character_name, messages):
       try:
           prompt = self._build_emotion_prompt(character_name, messages)
           response = await self.ollama_client.generate_response(
               system_prompt="",
               user_prompt=prompt,
               temperature=0.3  # Low temp for structured output
           )
           return self._parse_emotion_response(response)
       except Exception as e:
           print(f"Emotion detection failed: {e}")
           return None  # Graceful degradation
   ```

2. **Regex parsing strategy**:
   ```python
   def _extract_emotion_value(self, llm_response, emotion_name):
       pattern = f"<{emotion_name}>(.*?)</{emotion_name}>"
       match = re.search(pattern, llm_response, re.IGNORECASE | re.DOTALL)
       if match:
           return self._validate_emotion_value(match.group(1))
       return 0
   ```

3. **Value validation**:
   ```python
   def _validate_emotion_value(self, value):
       try:
           val = int(value.strip())
           return max(0, min(100, val))  # Clamp to 0-100
       except (ValueError, AttributeError):
           return 0
   ```

4. **Message formatting**:
   - Format messages same as PromptBuilder.format_messages()
   - Include role labels in Russian
   - Keep recent N messages (5-10 recommended)

#### Phase 3: Update PromptBuilder
**File**: `backend/llm/prompt_builder.py`

1. **Build emotion prompt**:
   ```python
   @staticmethod
   def build_emotion_prompt(character_name, messages):
       formatted_messages = PromptBuilder.format_messages(messages)
       return PromptBuilder.EMOTION_PROMPT_TEMPLATE.format(
           name=character_name,
           messages=formatted_messages
       )
   ```

2. **Format emotions**:
   ```python
   @staticmethod
   def format_emotions(emotions):
       return emotions.to_string()
   ```

3. **Update build_system_prompt**:
   - Check if emotions parameter provided
   - Use SYSTEM_PROMPT_TEMPLATE if emotions present
   - Use SYSTEM_PROMPT_TEMPLATE_NO_EMOTIONS if None
   - Call format_emotions() before template formatting

#### Phase 4: Update ChatService
**File**: `backend/chat_handler/chat_service.py`

1. **Implement _detect_emotions**:
   ```python
   async def _detect_emotions(self, recent_messages):
       emotions = await self.emotion_detector.detect_emotions(
           self.character_name, recent_messages
       )
       if emotions:
           temperature = emotions.calculate_optimal_temperature()
           return emotions, temperature
       else:
           return None, 0.7  # Default temperature
   ```

2. **Update _generate_response**:
   ```python
   async def _generate_response(self, user_message):
       # 1. Get recent messages
       recent_messages = await self._get_recent_messages(count=5)

       # 2. Detect emotions FIRST
       emotions, temperature = await self._detect_emotions(recent_messages)

       # 3. Search knowledge bases
       books_context, conversations_context = await self._search_knowledge_bases(user_message)

       # 4. Build prompts WITH emotions
       system_prompt, user_prompt = self.prompt_builder.build_prompts(
           character_name=self.character_name,
           context=books_context,
           previous_discussion=conversations_context,
           messages=recent_messages,
           current_question=user_message,
           emotions=emotions
       )

       # 5. Generate with dynamic temperature
       response = await self.ollama_client.generate_response(
           system_prompt=system_prompt,
           user_prompt=user_prompt,
           temperature=temperature
       )

       return response, emotions
   ```

3. **Error handling**:
   - Wrap emotion detection in try-except
   - Log failures but continue processing
   - Use default temperature if detection fails

#### Phase 5: Database Migration (if needed)
**File**: Database schema

1. **Message table update**:
   - Add columns: fear, anger, sadness, disgust, joy (all INTEGER nullable)
   - No migration needed if using JSON column for emotions
   - SQLite JSON functions can query emotion fields

2. **Repository update**:
   - MessageRepository should handle emotions serialization
   - Pydantic models automatically serialize to dict
   - SQLite stores as JSON text

### Suggested Implementation Order

1. **Emotions Model** (independent, foundational)
   - Implement validation
   - Implement temperature calculation
   - Implement to_string()
   - Write unit tests

2. **Update Message Model** (depends on Emotions)
   - Add emotions field
   - Update __init__.py
   - Test serialization

3. **Update PromptBuilder** (depends on Emotions)
   - Add emotion prompt template
   - Add build_emotion_prompt()
   - Add format_emotions()
   - Update build_system_prompt()
   - Write unit tests

4. **EmotionDetector** (depends on OllamaClient, PromptBuilder)
   - Implement prompt building
   - Implement regex parsing
   - Implement value validation
   - Write unit tests (mock OllamaClient)

5. **Update ChatService** (depends on all above)
   - Add _detect_emotions()
   - Update _generate_response()
   - Update process_message()
   - Write integration tests

6. **End-to-End Testing**
   - Test full message flow with emotions
   - Test fallback when emotion detection fails
   - Test API response includes emotions
   - Test different emotion ranges produce correct temperatures

### Testing Strategy

#### Unit Tests

**test_emotions.py**:
- Test emotion value validation (0-100 range)
- Test invalid values raise ValidationError
- Test get_max_emotion_value() with various combinations
- Test calculate_optimal_temperature() for all ranges:
  - 0-33 → 0.1
  - 34-66 → 0.3
  - 67-100 → 0.5
- Test to_string() formatting

**test_emotion_detector.py**:
- Test _extract_emotion_value() with valid XML tags
- Test _extract_emotion_value() with missing tags → returns 0
- Test _extract_emotion_value() with malformed tags → returns 0
- Test _validate_emotion_value() with valid numbers
- Test _validate_emotion_value() with invalid strings → returns 0
- Test _validate_emotion_value() with out-of-range values → clamped
- Test _parse_emotion_response() with complete XML
- Test _parse_emotion_response() with partial XML
- Test _build_emotion_prompt() formatting
- Mock OllamaClient for detect_emotions() tests

**test_prompt_builder.py**:
- Test build_emotion_prompt() with messages
- Test build_emotion_prompt() with empty messages
- Test format_emotions() output format
- Test build_system_prompt() with emotions
- Test build_system_prompt() without emotions
- Test build_prompts() with emotions parameter

#### Integration Tests

**test_chat_service_emotions.py**:
- Test _detect_emotions() with normal messages
- Test _detect_emotions() returns correct temperature
- Test _detect_emotions() handles None gracefully
- Test _generate_response() includes emotions
- Test process_message() stores emotions in assistant message
- Test emotion detection failure doesn't break flow
- Mock OllamaClient and repositories

#### End-to-End Tests

**test_message_api.py**:
- Test POST /api/characters/{id}/messages returns emotions
- Test emotions visible in API response
- Test stored emotions persist in database
- Test GET /api/characters/{id}/messages includes emotions

### Considerations

#### Edge Cases
1. **Empty chat history**: No emotions detected, use default temperature
2. **Malformed LLM response**: Partial emotion extraction, missing values default to 0
3. **LLM timeout**: Emotion detection fails, fallback to default temperature
4. **All emotions at 0**: Temperature 0.1 (calm response)
5. **Multiple high emotions**: Use max emotion for temperature
6. **First message**: No history, skip emotion detection

#### Performance Notes
1. **Emotion detection adds latency**: ~1-2 seconds per message
   - Consider async execution with timeout
   - Cache emotions for short periods if needed
2. **Two LLM calls per message**: Emotion detection + response generation
   - Future optimization: Single LLM call with structured output
3. **Regex parsing is fast**: Negligible overhead vs XML parser
4. **Database impact**: Additional columns, but minimal storage

#### Security Notes
1. **Input validation**: Emotions validated via Pydantic, safe
2. **Regex safety**: Non-greedy matching prevents ReDoS
3. **LLM injection**: Emotion prompt is controlled, no user input
4. **Database**: Emotions stored as integers or JSON, safe

#### Error Handling Strategy
1. **Non-blocking**: Emotion detection failures don't stop message processing
2. **Logging**: Log all emotion detection errors for monitoring
3. **Fallback**: Default temperature 0.7 when emotions unavailable
4. **Partial success**: Accept partial emotion data (some values missing)

#### Future Enhancements
1. **Emotion history**: Track emotion changes over conversation
2. **Emotion-based routing**: Different models for different emotional states
3. **Emotion visualization**: Frontend displays emotion trends
4. **Fine-tuned prompts**: Optimize emotion detection prompt per character
5. **Caching**: Cache emotions for N messages to reduce LLM calls
6. **Structured output**: Use JSON mode if Ollama supports it
