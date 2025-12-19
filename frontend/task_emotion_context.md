# Task: Add Knowledge Base Context to Emotion Detection

## Overview
Enhance the emotion detection system to include knowledge base context in the emotion detection prompt. This will make emotion detection more accurate by grounding it in the character's knowledge.

## Current State

### Files Involved
1. `backend/llm/emotion_detector.py` - EmotionDetector class
2. `backend/llm/prompt_builder.py` - PromptBuilder class (has duplicate EMOTION_PROMPT_TEMPLATE)
3. `backend/chat_handler/chat_service.py` - ChatService orchestration

### Current Flow (in ChatService._generate_response)
1. Get recent messages
2. **Detect emotions** (without context)
3. **Search knowledge bases** (get books_context and conversations_context)
4. Build prompts with context and emotions
5. Generate response

### Current EMOTION_PROMPT_TEMPLATE (without context)
```python
EMOTION_PROMPT_TEMPLATE = """Ты {name}.
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
```

## Target State

### Target EMOTION_PROMPT_TEMPLATE (with context)
```python
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
```

### Target Flow (in ChatService._generate_response)
1. Get recent messages
2. **Search knowledge bases** (get books_context and conversations_context) - MOVED EARLIER
3. **Detect emotions** (WITH books_context) - MOVED LATER, receives context
4. Build prompts with context and emotions (reuse same context, no re-query)
5. Generate response

## Requirements

### Functional Requirements
1. **Reorder operations in ChatService._generate_response()**:
   - KB search must happen BEFORE emotion detection
   - Same context used for both emotion detection and response generation
   - No duplicate KB queries

2. **Update EmotionDetector.detect_emotions() signature**:
   - Add `context: str` parameter
   - Pass context to prompt builder

3. **Update EmotionDetector.EMOTION_PROMPT_TEMPLATE**:
   - Add `{context}` field after character name
   - Keep all existing emotion definitions

4. **Update EmotionDetector._build_emotion_prompt()**:
   - Accept `context` parameter
   - Include context in template formatting

5. **Handle duplicate EMOTION_PROMPT_TEMPLATE in PromptBuilder**:
   - Remove it OR update it to match EmotionDetector version
   - PromptBuilder.build_emotion_prompt() is not used by ChatService currently

### Non-Functional Requirements
1. Maintain backward compatibility where possible
2. Preserve all existing tests (they should still pass with minimal changes)
3. Follow project coding standards (docstrings, type hints, error handling)
4. No changes to prompt parsing or emotion calculation logic

## Testing Strategy

### Unit Tests to Update/Add
1. **test_emotion_detector.py**:
   - Update tests for `detect_emotions()` to pass context parameter
   - Update tests for `_build_emotion_prompt()` to pass context
   - Add test that verifies context is included in generated prompt

2. **test_chat_service.py**:
   - Update integration tests to verify correct call order
   - Verify KB search happens before emotion detection
   - Verify same context used for both operations

### Test Data
- Use existing test fixtures
- Create mock context strings for emotion detection tests

## Implementation Notes

### Files to Modify
1. `backend/llm/emotion_detector.py`:
   - Update EMOTION_PROMPT_TEMPLATE constant
   - Update `detect_emotions()` method signature
   - Update `_build_emotion_prompt()` method signature and implementation

2. `backend/chat_handler/chat_service.py`:
   - Reorder operations in `_generate_response()`
   - Update `_detect_emotions()` call to pass books_context

3. `backend/llm/prompt_builder.py` (optional):
   - Remove duplicate EMOTION_PROMPT_TEMPLATE or update it
   - Mark `build_emotion_prompt()` as deprecated if not used

### Risk Assessment
- **Low Risk**: Changes are localized to emotion detection flow
- **No Breaking Changes**: API endpoints remain unchanged
- **Test Coverage**: Existing tests will catch regressions

## Success Criteria
1. All existing tests pass (with minimal updates to test code)
2. Emotion detection prompt includes knowledge base context
3. KB search happens exactly once per message (no duplicate queries)
4. Emotions are detected after KB search but before response generation
5. Code follows project standards (docstrings, type hints, error handling)

---

## Architecture Design

### Created Structure

No new files were created. The following existing files were modified:

```
backend/
├── llm/
│   ├── emotion_detector.py       # Updated EMOTION_PROMPT_TEMPLATE and method signatures
│   └── prompt_builder.py         # Removed duplicate template, deprecated method
└── chat_handler/
    └── chat_service.py           # Reordered operations, updated method calls
```

### Components Overview

#### 1. EmotionDetector (backend/llm/emotion_detector.py)

**Modified Class Constant:**
- `EMOTION_PROMPT_TEMPLATE`: Added `{context}` field after character name

**Modified Methods:**

```python
async def detect_emotions(
    self,
    character_name: str,
    messages: List[Message],
    context: str  # NEW PARAMETER
) -> Optional[Emotions]:
    """
    Detect emotions based on character role, chat history, and knowledge context.

    Args:
        character_name: Name of the character
        messages: Chat history to analyze
        context: Knowledge base context about the topic being discussed  # NEW

    Returns:
        Optional[Emotions]: Detected emotions, or None if detection fails
    """
    pass  # Implementation unchanged except context parameter passed to _build_emotion_prompt
```

```python
def _build_emotion_prompt(
    self,
    character_name: str,
    messages: List[Message],
    context: str  # NEW PARAMETER
) -> str:
    """
    Build emotion detection prompt with knowledge base context.

    Args:
        character_name: Name of the character
        messages: Chat history
        context: Knowledge base context about the topic being discussed  # NEW

    Returns:
        str: Formatted emotion detection prompt
    """
    pass  # Implementation: format template with name, context, and messages
```

**Unchanged Methods:**
- `_format_messages_for_emotion_prompt()`: No changes needed
- `_parse_emotion_response()`: No changes needed
- `_extract_emotion_value()`: No changes needed
- `_validate_emotion_value()`: No changes needed

#### 2. ChatService (backend/chat_handler/chat_service.py)

**Modified Method:**

```python
async def _generate_response(self, user_message: str) -> tuple[str, Optional[Emotions]]:
    """
    Generate assistant response using LLM with emotion detection.

    OPERATION ORDER CHANGED:
    1. Get recent messages
    2. Search knowledge bases FIRST (moved earlier)  # REORDERED
    3. Detect emotions WITH books_context           # REORDERED, receives context
    4. Build prompts (reuse same context)
    5. Generate response

    Args:
        user_message: User message content

    Returns:
        tuple[str, Optional[Emotions]]: (Generated response, detected emotions or None)

    Raises:
        LLMError: If generation fails
    """
    pass  # Implementation: KB search before emotion detection, pass context to _detect_emotions
```

```python
async def _detect_emotions(
    self,
    recent_messages: List[Message],
    books_context: str  # NEW PARAMETER
) -> tuple[Optional[Emotions], float]:
    """
    Detect emotions based on chat history, knowledge context, and calculate optimal temperature.

    Args:
        recent_messages: Recent chat history
        books_context: Knowledge base context about the topic being discussed  # NEW

    Returns:
        tuple[Optional[Emotions], float]: (Detected emotions or None, optimal temperature)
    """
    pass  # Implementation: pass books_context to emotion_detector.detect_emotions()
```

**Unchanged Methods:**
- `process_message()`: No signature changes
- `_search_knowledge_bases()`: No changes
- `_get_recent_messages()`: No changes
- `_save_messages()`: No changes
- `_index_user_message()`: No changes

#### 3. PromptBuilder (backend/llm/prompt_builder.py)

**Removed:**
- `EMOTION_PROMPT_TEMPLATE` constant (duplicate, conflicts with EmotionDetector version)

**Deprecated Method:**

```python
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

    Raises:
        NotImplementedError: Always raised to indicate deprecation
    """
    raise NotImplementedError(
        "build_emotion_prompt() is deprecated. "
        "Use EmotionDetector.detect_emotions() instead."
    )
```

**Unchanged Methods:**
- `build_system_prompt()`: No changes
- `build_user_prompt()`: No changes
- `build_prompts()`: No changes
- `format_messages()`: No changes
- `truncate_context()`: No changes
- `format_knowledge_chunks()`: No changes
- `format_emotions()`: No changes

### Implementation Recommendations

#### Phase 1: Update EmotionDetector Implementation

**File:** `backend/llm/emotion_detector.py`

1. **Update `detect_emotions()` method:**
   - Accept new `context: str` parameter
   - Pass context to `_build_emotion_prompt()`
   - No other logic changes needed

2. **Update `_build_emotion_prompt()` method:**
   - Accept new `context: str` parameter
   - Include `context=context` in template formatting
   - Template already updated with `{context}` field

**Implementation Pattern:**
```python
async def detect_emotions(self, character_name: str,
                         messages: List[Message],
                         context: str) -> Optional[Emotions]:
    # Existing logging...
    try:
        # CHANGED: Pass context to prompt builder
        prompt = self._build_emotion_prompt(character_name, messages, context)

        # Rest of implementation unchanged
        response = await self.ollama_client.generate_response(...)
        emotions = self._parse_emotion_response(response)
        return emotions
    except Exception as e:
        # Existing error handling unchanged
        return None

def _build_emotion_prompt(self, character_name: str,
                         messages: List[Message],
                         context: str) -> str:
    formatted_messages = self._format_messages_for_emotion_prompt(messages)
    # CHANGED: Include context in format()
    return self.EMOTION_PROMPT_TEMPLATE.format(
        name=character_name,
        context=context,  # NEW
        messages=formatted_messages
    )
```

#### Phase 2: Update ChatService Implementation

**File:** `backend/chat_handler/chat_service.py`

1. **Reorder operations in `_generate_response()`:**
   - Move KB search (step 3 → step 2)
   - Move emotion detection (step 2 → step 3)
   - Pass `books_context` to `_detect_emotions()`

2. **Update `_detect_emotions()` method:**
   - Accept new `books_context: str` parameter
   - Pass context to `emotion_detector.detect_emotions()`

**Implementation Pattern:**
```python
async def _generate_response(self, user_message: str) -> tuple[str, Optional[Emotions]]:
    # Step 1: Get recent messages (unchanged)
    recent_messages = await self._get_recent_messages(count=5)

    # Step 2: Search KB FIRST (moved from step 3)
    books_context, conversations_context = await self._search_knowledge_bases(user_message)

    # Step 3: Detect emotions WITH context (moved from step 2, receives context)
    emotions, temperature = await self._detect_emotions(recent_messages, books_context)

    # Step 4: Build prompts (unchanged, reuses same books_context)
    system_prompt, user_prompt = self.prompt_builder.build_prompts(
        character_name=self.character_name,
        context=books_context,  # Same context, no re-query
        previous_discussion=conversations_context,
        messages=recent_messages,
        current_question=user_message,
        emotions=emotions
    )

    # Step 5: Generate response (unchanged)
    response = await self.ollama_client.generate_response(...)
    return response, emotions

async def _detect_emotions(self, recent_messages: List[Message],
                          books_context: str) -> tuple[Optional[Emotions], float]:
    try:
        # CHANGED: Pass books_context to emotion detector
        emotions = await self.emotion_detector.detect_emotions(
            self.character_name, recent_messages, books_context
        )

        # Rest of implementation unchanged
        if emotions:
            temperature = emotions.calculate_optimal_temperature()
            return emotions, temperature
        else:
            return None, 0.7
    except Exception as e:
        # Existing error handling unchanged
        return None, 0.7
```

#### Phase 3: Handle PromptBuilder Deprecation

**File:** `backend/llm/prompt_builder.py`

1. **Remove duplicate template:**
   - EMOTION_PROMPT_TEMPLATE constant removed (already done in architecture phase)

2. **Deprecate `build_emotion_prompt()` method:**
   - Replace implementation with NotImplementedError
   - Add clear deprecation message in docstring
   - Method kept for backward compatibility but not callable

**Implementation Pattern:**
```python
@staticmethod
def build_emotion_prompt(character_name: str, messages: List[Message]) -> str:
    """
    DEPRECATED: Use EmotionDetector.detect_emotions() instead.

    This method is no longer used by ChatService. Emotion detection
    has been moved to EmotionDetector class with context support.
    """
    raise NotImplementedError(
        "build_emotion_prompt() is deprecated. "
        "Use EmotionDetector.detect_emotions() instead."
    )
```

### Testing Updates Required

#### Unit Tests: test_emotion_detector.py

**Changes needed:**
1. Update all calls to `detect_emotions()` to include context parameter
2. Update all calls to `_build_emotion_prompt()` to include context parameter
3. Add new test: verify context is included in generated prompt

**Example test updates:**
```python
# BEFORE:
emotions = await emotion_detector.detect_emotions("Гегель", sample_messages)

# AFTER:
emotions = await emotion_detector.detect_emotions(
    "Гегель", sample_messages, "Контекст из книг"
)

# NEW TEST:
def test_build_emotion_prompt_includes_context(self, emotion_detector, sample_messages):
    """Test building emotion prompt includes knowledge base context."""
    # Arrange
    context = "Диалектика - метод познания через противоречия."

    # Act
    prompt = emotion_detector._build_emotion_prompt("Гегель", sample_messages, context)

    # Assert
    assert "Ты Гегель" in prompt
    assert "Твои знания по обсуждаемой теме:" in prompt
    assert context in prompt
    assert "Сообщения из чата:" in prompt
```

#### Integration Tests: test_chat_service_emotions.py

**Changes needed:**
1. Verify KB search happens before emotion detection (operation order)
2. Verify same context used for both operations (no duplicate queries)
3. Update mock setup to return books_context from KB manager
4. Verify context is passed to emotion detector

**Example test updates:**
```python
@pytest.mark.asyncio
async def test_generate_response_searches_kb_before_emotions(
    self, chat_service, mock_kb_manager, mock_ollama_client, mock_message_repository
):
    """Test _generate_response searches KB before detecting emotions."""
    # Arrange
    mock_kb_manager.search_books_kb.return_value = ["Контекст из книг"]
    mock_ollama_client.generate_response.side_effect = [
        """<emotions><fear>10</fear>...</emotions>""",
        "Ответ"
    ]

    # Act
    await chat_service._generate_response("Вопрос")

    # Assert - KB search called before emotion detection
    # Verify call order by checking when each was called
    assert mock_kb_manager.search_books_kb.call_count == 1
    # Emotion detection uses context from KB
    emotion_call = mock_ollama_client.generate_response.call_args_list[0]
    assert "Контекст из книг" in emotion_call.kwargs.get("user_prompt")
```

### Considerations

#### Edge Cases
1. **Empty context:** What if KB search returns empty context?
   - Solution: Pass empty string or "Нет релевантной информации"
   - EmotionDetector will still work, just without grounding

2. **KB search failure:** What if KB search throws exception?
   - Solution: `_search_knowledge_bases()` already handles exceptions
   - Returns default text on error, emotion detection continues

3. **Very long context:** What if context exceeds token limits?
   - Solution: Use `PromptBuilder.truncate_context()` before passing
   - Consider adding truncation in `_generate_response()`

#### Performance Notes
1. **Single KB query:** Context fetched once and reused
   - Before: 1 KB query for response generation
   - After: Still 1 KB query (now also used for emotion detection)
   - No performance degradation

2. **Emotion detection latency:** No significant change
   - Prompt is slightly longer with context
   - LLM call time may increase marginally (~5-10%)

3. **Memory usage:** Minimal increase
   - Context string stored in memory once
   - Reused for emotion detection and response generation

#### Security Notes
1. **No new security risks:** Context comes from trusted KB
2. **Input validation:** KB search already validates queries
3. **No user input in context:** Context is generated from books, not user input

#### Testing Strategy
1. **Phase 1 (Architecture):** All signatures updated, no implementation
2. **Phase 2 (Tests):** Update tests to pass context parameter
3. **Phase 3 (Implementation):** Implement changes, run tests until all pass

#### Implementation Order
1. Update `EmotionDetector.EMOTION_PROMPT_TEMPLATE` (done in architecture phase)
2. Update `EmotionDetector.detect_emotions()` signature and implementation
3. Update `EmotionDetector._build_emotion_prompt()` signature and implementation
4. Update `ChatService._generate_response()` to reorder operations
5. Update `ChatService._detect_emotions()` signature and implementation
6. Remove duplicate template from `PromptBuilder` (done in architecture phase)
7. Deprecate `PromptBuilder.build_emotion_prompt()` (done in architecture phase)
8. Update all tests to pass context parameter
9. Run tests and verify all pass

### Data Flow Diagram

**Before (Current):**
```
User Message
    ↓
1. Get Recent Messages
    ↓
2. Detect Emotions (no context) ← EmotionDetector
    ↓
3. Search KB → books_context, conversations_context
    ↓
4. Build Prompts (with context & emotions)
    ↓
5. Generate Response
```

**After (Target):**
```
User Message
    ↓
1. Get Recent Messages
    ↓
2. Search KB → books_context, conversations_context
    ↓                    ↓
    |                    └─────────────┐
    |                                  ↓
3. Detect Emotions (WITH books_context) ← EmotionDetector
    ↓
4. Build Prompts (reuse books_context & emotions)
    ↓
5. Generate Response
```

**Key Changes:**
- KB search moved earlier (step 2 instead of step 3)
- books_context flows into both emotion detection AND prompt building
- Single KB query, context reused twice

### Files Modified Summary

| File | Changes | Lines Modified | Risk |
|------|---------|----------------|------|
| `backend/llm/emotion_detector.py` | Updated template, 2 method signatures | ~15 lines | Low |
| `backend/chat_handler/chat_service.py` | Reordered operations, 2 method signatures | ~20 lines | Low |
| `backend/llm/prompt_builder.py` | Removed template, deprecated method | ~25 lines | Low |
| `tests/backend/llm/test_emotion_detector.py` | Update test calls with context | ~30 lines | Low |
| `tests/backend/chat_handler/test_chat_service_emotions.py` | Update test assertions | ~20 lines | Low |

**Total:** 5 files, ~110 lines modified, Low risk

### Backward Compatibility

**Breaking Changes:**
- `EmotionDetector.detect_emotions()` signature changed (added required parameter)
- `EmotionDetector._build_emotion_prompt()` signature changed (added required parameter)
- `ChatService._detect_emotions()` signature changed (added required parameter)

**Mitigation:**
- These are internal methods, not exposed in public API
- No API endpoint signatures changed
- Frontend code unaffected
- All changes are backend-internal refactoring

**Deprecated but Not Removed:**
- `PromptBuilder.build_emotion_prompt()` raises NotImplementedError
- Method kept for backward compatibility awareness
- Clear error message directs to new approach

### Success Validation Checklist

- [ ] EMOTION_PROMPT_TEMPLATE includes `{context}` field
- [ ] EmotionDetector.detect_emotions() accepts context parameter
- [ ] EmotionDetector._build_emotion_prompt() accepts context parameter
- [ ] ChatService._generate_response() searches KB before emotions
- [ ] ChatService._detect_emotions() accepts books_context parameter
- [ ] books_context passed to emotion_detector.detect_emotions()
- [ ] books_context reused for prompt building (no re-query)
- [ ] Duplicate template removed from PromptBuilder
- [ ] PromptBuilder.build_emotion_prompt() deprecated
- [ ] All tests in test_emotion_detector.py updated and passing
- [ ] All tests in test_chat_service_emotions.py updated and passing
- [ ] No duplicate KB queries in execution flow
- [ ] Emotion detection prompt includes context in LLM call
- [ ] All docstrings updated with new parameters
- [ ] Type hints correct for all modified signatures
