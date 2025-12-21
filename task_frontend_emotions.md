# Frontend Task: Display Emotions in Assistant Messages

## Objective
Display emotion data in assistant messages with color-coded values to show the character's emotional state.

## Requirements

### 1. Update Message Type
Extend the `Message` interface in `frontend/src/types/message.ts` to include emotions:
```typescript
export interface Emotions {
  fear: number;      // 0-100
  anger: number;     // 0-100
  sadness: number;   // 0-100
  disgust: number;   // 0-100
  joy: number;       // 0-100
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  character_id?: string;
  emotions?: Emotions;  // Optional, only for assistant messages
}
```

### 2. Create EmotionDisplay Component
Create a new `EmotionDisplay` component in `frontend/src/components/EmotionDisplay.tsx` that:
- Accepts an `emotions` prop of type `Emotions`
- Displays all five emotions with their Russian labels:
  - `fear` → "Страх"
  - `anger` → "Злость"
  - `sadness` → "Печаль"
  - `disgust` → "Отвращение"
  - `joy` → "Радость"
- Colors each emotion value based on its range:
  - 0-33: green
  - 34-66: orange
  - 67-100: red
- Format: "Страх: 25  Злость: 50  Печаль: 10  Отвращение: 5  Радость: 80"
- Should be horizontally laid out, space-separated

### 3. Update AssistantMessage Component
Modify `frontend/src/components/AssistantMessage.tsx` to:
- Accept optional `emotions` prop of type `Emotions | undefined`
- Display the `EmotionDisplay` component before the message content if emotions are present
- Emotions should appear between the character name header and the message content

### 4. Component Styling
Create CSS for emotion display in `frontend/src/components/EmotionDisplay.css`:
- Use a flexbox layout for horizontal display
- Color classes for each range:
  - `.emotion-low` (0-33): green color
  - `.emotion-medium` (34-66): orange color
  - `.emotion-high` (67-100): red color
- Each emotion should be displayed as: "Label: Value"
- Compact spacing between emotions

### 5. Color Scheme
Use these specific colors:
- Green (low 0-33): `#22c55e` or similar green
- Orange (medium 34-66): `#f97316` or similar orange
- Red (high 67-100): `#ef4444` or similar red

## Technical Constraints
- Emotions are optional - component should gracefully handle missing emotions
- Only assistant messages have emotions, user messages do not
- Color determination is client-side based on value ranges
- Display should be compact and not dominate the message

## Testing Requirements

### Unit Tests for EmotionDisplay Component
Create `frontend/src/components/__tests__/EmotionDisplay.test.tsx`:
- Test rendering with all emotions at 0
- Test rendering with all emotions at different values
- Test color classes applied correctly:
  - Values 0-33 get green class
  - Values 34-66 get orange class
  - Values 67-100 get red class
- Test Russian labels displayed correctly
- Test edge cases (boundary values: 33, 34, 66, 67)

### Unit Tests for Updated AssistantMessage
Update `frontend/src/components/__tests__/AssistantMessage.test.tsx`:
- Test AssistantMessage renders without emotions (backward compatibility)
- Test AssistantMessage renders with emotions
- Test EmotionDisplay appears before message content
- Test emotions prop is passed correctly to EmotionDisplay

### Integration Tests
Create `frontend/src/__tests__/integration/EmotionDisplay.integration.test.tsx`:
- Test message flow with emotions from API
- Test that emotions are correctly parsed from MessageResponse
- Test that message store handles emotions correctly

## Files to Create/Modify
- **Modify**: `frontend/src/types/message.ts` - Add Emotions interface and update Message
- **Create**: `frontend/src/components/EmotionDisplay.tsx` - New component
- **Create**: `frontend/src/components/EmotionDisplay.css` - Styling
- **Modify**: `frontend/src/components/AssistantMessage.tsx` - Integrate EmotionDisplay
- **Create**: `frontend/src/components/__tests__/EmotionDisplay.test.tsx` - Unit tests
- **Modify**: `frontend/src/components/__tests__/AssistantMessage.test.tsx` - Update tests

## Dependencies
- No new external dependencies required
- Uses existing React, TypeScript, CSS

## Example Display
```
┌─────────────────────────────────────────┐
│ Hegel                                   │
├─────────────────────────────────────────┤
│ Страх: 15  Злость: 45  Печаль: 10      │
│ Отвращение: 5  Радость: 75              │
├─────────────────────────────────────────┤
│ Message content here...                 │
└─────────────────────────────────────────┘
```

Where:
- "Страх: 15" is in green
- "Злость: 45" is in orange
- "Печаль: 10" is in green
- "Отвращение: 5" is in green
- "Радость: 75" is in red

---

## Architecture Design

### Created Structure

```
frontend/src/
├── types/
│   └── message.ts (MODIFIED)            # Added Emotions interface
├── components/
│   ├── EmotionDisplay.tsx (NEW)         # Emotion display component
│   ├── EmotionDisplay.css (NEW)         # Emotion display styling
│   └── AssistantMessage.tsx (MODIFIED)  # Integrated EmotionDisplay
```

### Components Overview

#### 1. Emotions Interface (`types/message.ts`)
**Purpose:** Type definition for emotion data structure.

**Properties:**
- `fear: number` - Fear level (0-100)
- `anger: number` - Anger level (0-100)
- `sadness: number` - Sadness level (0-100)
- `disgust: number` - Disgust level (0-100)
- `joy: number` - Joy level (0-100)

**Integration:** Added as optional property to Message interface.

#### 2. EmotionDisplay Component (`components/EmotionDisplay.tsx`)
**Purpose:** Displays character's emotional state with color-coded values.

**Props:**
- `emotions: Emotions` - Required emotions data object

**Key Functions:**
- `getEmotionColorClass(value: number): string`
  - Purpose: Determines CSS class based on emotion value
  - Logic: 0-33 → 'emotion-low', 34-66 → 'emotion-medium', 67-100 → 'emotion-high'
  - Returns: CSS class name for styling

- `mapEmotionsToEntries(emotions: Emotions): EmotionEntry[]`
  - Purpose: Converts Emotions object to array for rendering
  - Creates array with Russian labels in order: Страх, Злость, Печаль, Отвращение, Радость
  - Applies color class to each emotion using getEmotionColorClass
  - Returns: Array of EmotionEntry objects with label, value, colorClass

**Internal Types:**
- `EmotionEntry` - Contains label (string), value (number), colorClass (string)

**Rendering Structure:**
```html
<div class="emotion-display" data-testid="emotion-display">
  <span class="emotion-item" data-testid="emotion-fear">
    <span class="emotion-label">Страх:</span>
    <span class="emotion-value emotion-low">25</span>
  </span>
  <!-- Repeat for each emotion -->
</div>
```

#### 3. AssistantMessage Component (Modified)
**Purpose:** Displays assistant messages with optional emotion display.

**Updated Props:**
- Added: `emotions?: Emotions` - Optional emotions data

**Rendering Logic:**
- Emotions appear between character name header and message content
- Only renders EmotionDisplay when emotions prop is present
- Uses conditional rendering: `{emotions && <EmotionDisplay emotions={emotions} />}`

**Integration Point:** Line 151 in component structure (after header, before content)

### Implementation Recommendations

#### Phase 1: Implement EmotionDisplay Component

1. **getEmotionColorClass Function**
   ```typescript
   const getEmotionColorClass = (value: number): string => {
     if (value >= 0 && value <= 33) return 'emotion-low';
     if (value >= 34 && value <= 66) return 'emotion-medium';
     return 'emotion-high';
   };
   ```

2. **mapEmotionsToEntries Function**
   ```typescript
   const mapEmotionsToEntries = (emotions: Emotions): EmotionEntry[] => {
     return [
       { label: 'Страх', value: emotions.fear, colorClass: getEmotionColorClass(emotions.fear) },
       { label: 'Злость', value: emotions.anger, colorClass: getEmotionColorClass(emotions.anger) },
       { label: 'Печаль', value: emotions.sadness, colorClass: getEmotionColorClass(emotions.sadness) },
       { label: 'Отвращение', value: emotions.disgust, colorClass: getEmotionColorClass(emotions.disgust) },
       { label: 'Радость', value: emotions.joy, colorClass: getEmotionColorClass(emotions.joy) }
     ];
   };
   ```

3. **Component Render**
   ```typescript
   export const EmotionDisplay: React.FC<EmotionDisplayProps> = ({ emotions }) => {
     const emotionEntries = mapEmotionsToEntries(emotions);

     return (
       <div className="emotion-display" data-testid="emotion-display">
         {emotionEntries.map((emotion, index) => (
           <span
             key={emotion.label}
             className="emotion-item"
             data-testid={`emotion-${Object.keys(emotions)[index]}`}
           >
             <span className="emotion-label">{emotion.label}:</span>
             <span className={`emotion-value ${emotion.colorClass}`}>
               {emotion.value}
             </span>
           </span>
         ))}
       </div>
     );
   };
   ```

#### Phase 2: Update Message Flow

1. **API Layer Considerations**
   - Backend should return emotions in MessageResponse.assistant_message
   - Ensure API types match the Emotions interface
   - Validate emotion values are in 0-100 range

2. **Store Layer**
   - No changes needed to messageStore
   - Emotions will flow through as part of Message type
   - TypeScript will enforce type safety

3. **Component Integration**
   - ChatWindow component should pass emotions from message to AssistantMessage
   - Example: `<AssistantMessage ... emotions={message.emotions} />`

### Considerations

#### Edge Cases
1. **Missing Emotions**: Component gracefully handles undefined emotions (conditional rendering)
2. **Invalid Values**: Consider adding validation for values outside 0-100 range
3. **Boundary Values**: Test 33, 34, 66, 67 to ensure correct color class assignment
4. **Zero Values**: All emotions at 0 should display correctly (all green)

#### Performance
- mapEmotionsToEntries is called on every render
- Consider memoization with useMemo if performance becomes an issue
- Current implementation is lightweight and should perform well

#### Accessibility
- Color-coded values should not be the only indicator
- Consider adding aria-label with emotion name and intensity level
- Example: `aria-label="Fear: 25 (low intensity)"`

#### Internationalization (Future)
- Russian labels are hardcoded
- For i18n support, move labels to a translation object
- Structure: `{ fear: t('emotions.fear'), anger: t('emotions.anger'), ... }`

#### Styling Notes
- EmotionDisplay uses flexbox with gap for spacing
- Responsive design reduces font size on mobile
- Colors chosen for good contrast on dark background
- `font-variant-numeric: tabular-nums` ensures aligned numeric display

### Testing Strategy

#### Unit Tests for EmotionDisplay
**File:** `frontend/src/components/__tests__/EmotionDisplay.test.tsx`

1. **Basic Rendering Tests**
   - Renders all five emotions with correct labels
   - Displays correct numeric values
   - Renders with data-testid attributes

2. **Color Class Tests**
   - Values 0-33 apply 'emotion-low' class
   - Values 34-66 apply 'emotion-medium' class
   - Values 67-100 apply 'emotion-high' class
   - Test boundary values: 0, 33, 34, 66, 67, 100

3. **Label Tests**
   - Страх label for fear
   - Злость label for anger
   - Печаль label for sadness
   - Отвращение label for disgust
   - Радость label for joy

4. **Edge Cases**
   - All emotions at 0 (all green)
   - All emotions at 100 (all red)
   - Mixed emotion values

**Test Data Examples:**
```typescript
const lowEmotions: Emotions = { fear: 10, anger: 20, sadness: 15, disgust: 5, joy: 25 };
const mediumEmotions: Emotions = { fear: 40, anger: 50, sadness: 45, disgust: 55, joy: 60 };
const highEmotions: Emotions = { fear: 70, anger: 80, sadness: 85, disgust: 90, joy: 95 };
const boundaryLow: Emotions = { fear: 33, anger: 33, sadness: 33, disgust: 33, joy: 33 };
const boundaryMedium: Emotions = { fear: 34, anger: 34, sadness: 66, disgust: 66, joy: 66 };
const boundaryHigh: Emotions = { fear: 67, anger: 67, sadness: 67, disgust: 67, joy: 67 };
```

#### Unit Tests for AssistantMessage (Updated)
**File:** `frontend/src/components/__tests__/AssistantMessage.test.tsx`

1. **Backward Compatibility**
   - Component renders without emotions prop
   - No EmotionDisplay rendered when emotions undefined
   - Existing tests continue to pass

2. **With Emotions**
   - EmotionDisplay renders when emotions provided
   - Emotions appear before message content
   - Emotions prop correctly passed to EmotionDisplay

3. **Positioning Test**
   - EmotionDisplay appears after header
   - EmotionDisplay appears before message-content div
   - Verify DOM order: header → emotions → content → timestamp

**Test Examples:**
```typescript
describe('With Emotions', () => {
  it('should not render EmotionDisplay when emotions undefined', () => {
    render(<AssistantMessage {...defaultProps} />);
    expect(screen.queryByTestId('emotion-display')).not.toBeInTheDocument();
  });

  it('should render EmotionDisplay when emotions provided', () => {
    const emotions = { fear: 25, anger: 50, sadness: 10, disgust: 5, joy: 75 };
    render(<AssistantMessage {...defaultProps} emotions={emotions} />);
    expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
  });

  it('should position EmotionDisplay between header and content', () => {
    const emotions = { fear: 25, anger: 50, sadness: 10, disgust: 5, joy: 75 };
    const { container } = render(<AssistantMessage {...defaultProps} emotions={emotions} />);
    const bubble = container.querySelector('.assistant-message-bubble');
    const children = Array.from(bubble?.children || []);

    expect(children[0]).toHaveClass('assistant-message-header');
    expect(children[1]).toHaveClass('emotion-display');
    expect(children[2]).toHaveClass('assistant-message-content');
  });
});
```

#### Integration Tests
**File:** `frontend/src/__tests__/integration/EmotionDisplay.integration.test.tsx`

1. **API to UI Flow**
   - Mock API returns emotions in MessageResponse
   - Verify emotions parsed correctly from response
   - Verify emotions displayed in UI

2. **Store Integration**
   - Verify messageStore handles emotions in Message objects
   - Verify emotions persist through store operations

3. **Complete Message Flow**
   - Send message with emotions in API response
   - Verify emotions displayed in ChatWindow
   - Verify emotions passed to AssistantMessage component

### Implementation Order

1. **Types First** (COMPLETED)
   - Update message.ts with Emotions interface
   - Ensures type safety throughout implementation

2. **EmotionDisplay Component** (NEXT)
   - Implement getEmotionColorClass function
   - Implement mapEmotionsToEntries function
   - Implement component render logic
   - Test with various emotion values

3. **AssistantMessage Integration** (COMPLETED)
   - Import EmotionDisplay and Emotions types
   - Add emotions prop
   - Add conditional rendering

4. **Testing Phase**
   - Write EmotionDisplay unit tests
   - Update AssistantMessage unit tests
   - Write integration tests
   - Verify all tests pass

5. **Integration with Backend**
   - Verify backend returns emotions in correct format
   - Test with real API responses
   - Handle missing emotions gracefully

6. **Visual Testing**
   - Test all color ranges visually
   - Verify responsive design on mobile
   - Check contrast and readability
   - Test with various emotion combinations

### Required Libraries
**No new dependencies required** - all functionality uses existing React, TypeScript, and CSS.

### Security Considerations
- Validate emotion values are numbers in range 0-100
- Sanitize display values to prevent injection attacks (React handles this automatically)
- No user input processing in this component (read-only display)

### Data Flow Diagram

```
Backend API
    ↓
MessageResponse { assistant_message: { emotions: Emotions } }
    ↓
messageStore.sendMessage()
    ↓
Message object with emotions
    ↓
ChatWindow renders messages
    ↓
AssistantMessage component
    ↓
EmotionDisplay component (if emotions present)
    ↓
Colored emotion values in UI
```

### CSS Architecture

**Color Variables (if needed in future):**
```css
:root {
  --emotion-low: #22c55e;
  --emotion-medium: #f97316;
  --emotion-high: #ef4444;
}
```

**Key CSS Classes:**
- `.emotion-display` - Container with flexbox layout
- `.emotion-item` - Individual emotion wrapper
- `.emotion-label` - Russian label styling
- `.emotion-value` - Value styling with tabular numbers
- `.emotion-low` - Green color for low intensity
- `.emotion-medium` - Orange color for medium intensity
- `.emotion-high` - Red color for high intensity

**Responsive Breakpoints:**
- Desktop (default): 13px font, 12px gap
- Mobile (<768px): 12px font, 10px gap

### Future Enhancements

1. **Visual Indicators**
   - Add emotion icons (emoji or SVG)
   - Add intensity bars alongside numbers

2. **Animations**
   - Fade in emotions when message appears
   - Pulse effect for high-intensity emotions

3. **Tooltips**
   - Show emotion description on hover
   - Explain intensity levels

4. **Accessibility**
   - Add screen reader announcements
   - Provide text alternatives for colors
   - Support high contrast mode

5. **Customization**
   - Allow users to hide/show emotions
   - Configurable color schemes
   - Adjustable display format

### Documentation Updates Needed

After implementation, update these files:

1. **frontend/README.md** (if exists)
   - Document emotion display feature
   - Explain color coding system

2. **llm_readme.md**
   - Add EmotionDisplay to component list
   - Document data flow for emotions

3. **Component-level README** (if applicable)
   - Document EmotionDisplay API
   - Provide usage examples
