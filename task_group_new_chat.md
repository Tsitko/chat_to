# Task: Implement "New Chat" Functionality for Group Chats

## Overview

Add functionality to clear group chat history, analogous to the existing "New Chat" feature in individual character chats. This allows users to start fresh conversations with groups without deleting the group itself.

## Requirements

### Functional Requirements

1. **Backend**: Add endpoint to clear all messages for a specific group
   - Route: `DELETE /api/groups/{group_id}/messages`
   - Delete all messages from `group_messages` table for the specified group
   - Log the operation for debugging/auditing
   - Return success confirmation

2. **Frontend**: Add "New Chat" button to group chat UI
   - Add button to `GroupHeader` component (similar to `CharacterHeader`)
   - Show confirmation dialog before clearing
   - Call backend API to clear database
   - Clear local state in `groupMessageStore`
   - Update UI to show empty state
   - Disable input during clearing operation

### Non-Functional Requirements

1. **Data Isolation**: Ensure clearing one group's messages does not affect other groups
2. **Race Condition Prevention**: Handle API call completion before state update
3. **User Experience**: Prevent user from sending messages during clear operation
4. **Error Handling**: Show error messages if clearing fails
5. **Consistency**: Match UX patterns from individual character chat clearing

## Technical Design

### Backend Architecture

#### Endpoint Location
- File: `/home/denis/Projects/chat_to/backend/api/group_routes.py`
- New endpoint: `DELETE /{group_id}/messages`

#### Dependencies
- `GroupMessageRepository.delete_messages_by_group()` - **Already exists** (line 264-286)
- `get_group_message_repo()` dependency - **Already exists** (line 353-374)
- `get_group_repo()` dependency - **Already exists** (line 24-43)

#### Implementation Pattern
Follow the same pattern as `DELETE /{group_id}` endpoint (lines 272-304):
1. Verify group exists
2. Call repository method to delete messages
3. Return 204 No Content status
4. Handle errors with appropriate HTTP codes

### Frontend Architecture

#### Component Updates

**GroupHeader Component** (`/home/denis/Projects/chat_to/frontend/src/components/GroupHeader.tsx`):
- Add "New Chat" button
- Add confirmation dialog state
- Add click handler for "New Chat"
- Follow pattern from `CharacterHeader` (lines 63-72, 114-121)

**API Service** (`/home/denis/Projects/chat_to/frontend/src/services/api.ts`):
- Add `clearGroupMessages(groupId: string)` method
- Follow pattern of `deleteGroup()` method

**GroupMessageStore** (`/home/denis/Projects/chat_to/frontend/src/store/groupMessageStore.ts`):
- `clearGroupMessages()` method **Already exists** (line 200-208)
- Add `isClearing` state per group (similar to `isSending`)
- Add `clearGroupMessagesWithAPI()` async method that:
  1. Sets `isClearing[groupId] = true`
  2. Calls API
  3. Calls local `clearGroupMessages(groupId)`
  4. Sets `isClearing[groupId] = false`

#### UI Flow

1. User clicks "New Chat" button in GroupHeader
2. Confirmation dialog appears
3. User confirms
4. `isClearing` state set to true
5. Input disabled (via `GroupMessageInput` checking `isClearing`)
6. API call to `DELETE /api/groups/{id}/messages`
7. On success: clear local state, show empty state message
8. On error: show error toast/message
9. `isClearing` state set to false
10. Input re-enabled

### Data Flow

```
User clicks "New Chat"
  ↓
GroupHeader → confirmation dialog
  ↓
groupMessageStore.clearGroupMessagesWithAPI(groupId)
  ↓
Set isClearing[groupId] = true
  ↓
apiService.clearGroupMessages(groupId)
  ↓
DELETE /api/groups/{groupId}/messages
  ↓
GroupMessageRepository.delete_messages_by_group(groupId)
  ↓
Database: DELETE FROM group_messages WHERE group_id = ?
  ↓
Return 204 No Content
  ↓
Clear local state: messages[groupId] = []
  ↓
Set isClearing[groupId] = false
  ↓
UI shows empty state
```

## Risk Mitigation

### Problem 1: Race Condition Between Local and DB Clearing
**Solution**:
- Call API **first**, wait for success response
- Only clear local state **after** successful API response
- Use async/await to ensure sequential execution
- Do **not** use optimistic updates for this operation

### Problem 2: User Sends Message During Clearing
**Solution**:
- Add `isClearing` state to `groupMessageStore`
- Pass `isClearing[groupId]` to `GroupMessageInput`
- Disable send button when `isClearing` is true
- Show loading indicator during clearing

### Problem 3: Clearing One Group Affects Another
**Solution**:
- Verify endpoint uses `group_id` from URL path parameter
- Backend repository method filters by `group_id` (already implemented correctly)
- Add integration test with multiple groups

### Problem 4: Old Messages Remain in Conversations KB
**Decision**: **Do not clear** conversations KB in this implementation.
**Rationale**:
- Individual character "New Chat" doesn't clear conversations KB
- Conversations KB provides long-term context that can be useful
- Consistency with existing behavior
- Can be added later as separate feature if needed

**Documentation**: Add comment in code explaining this behavior

## Files to Create/Modify

### Backend
1. **Modify**: `/home/denis/Projects/chat_to/backend/api/group_routes.py`
   - Add `clear_group_messages()` endpoint

### Frontend
1. **Modify**: `/home/denis/Projects/chat_to/frontend/src/components/GroupHeader.tsx`
   - Add "New Chat" button
   - Add confirmation dialog
   - Add click handlers

2. **Modify**: `/home/denis/Projects/chat_to/frontend/src/store/groupMessageStore.ts`
   - Add `isClearing` state
   - Add `clearGroupMessagesWithAPI()` method

3. **Modify**: `/home/denis/Projects/chat_to/frontend/src/services/api.ts`
   - Add `clearGroupMessages()` method

4. **Modify**: `/home/denis/Projects/chat_to/frontend/src/components/GroupMessageInput.tsx`
   - Check `isClearing` state and disable input

## Test Strategy

### Backend Tests
Location: `/home/denis/Projects/chat_to/backend/tests/`

1. **Unit Tests** (repository level):
   - Test `delete_messages_by_group()` deletes only specified group's messages
   - Test with empty group (no messages)
   - Test with multiple groups (isolation)

2. **Integration Tests** (API level):
   - Test `DELETE /api/groups/{id}/messages` returns 204
   - Test 404 when group doesn't exist
   - Test multi-group isolation
   - Test endpoint with group that has no messages

### Frontend Tests
Location: `/home/denis/Projects/chat_to/frontend/src/`

1. **Component Tests**:
   - `GroupHeader.test.tsx`: "New Chat" button renders and triggers handler
   - `GroupHeader.test.tsx`: Confirmation dialog appears and can be confirmed/cancelled
   - `GroupMessageInput.test.tsx`: Input disabled when `isClearing` is true

2. **Store Tests**:
   - `groupMessageStore.test.ts`: `clearGroupMessagesWithAPI()` calls API then clears state
   - `groupMessageStore.test.ts`: Error handling when API fails
   - `groupMessageStore.test.ts`: `isClearing` state changes correctly

3. **Integration Tests**:
   - E2E test: Clear messages, verify database is empty
   - E2E test: Clear one group doesn't affect another
   - E2E test: Cannot send message while clearing

## Success Criteria

1. User can click "New Chat" in group chat header
2. Confirmation dialog appears before clearing
3. All group messages are deleted from database
4. UI shows empty state after clearing
5. User cannot send messages during clearing operation
6. Clearing one group does not affect other groups
7. Error messages shown if operation fails
8. All tests pass (100% for new code)

## Implementation Order

### Phase 1: Architecture & Skeleton (This Phase)
1. Create this task.md file
2. Define method signatures in backend endpoint
3. Define method signatures in frontend components/stores
4. Update dependencies if needed

### Phase 2: Tests (TDD)
1. Write backend unit tests for endpoint
2. Write backend integration tests
3. Write frontend component tests
4. Write frontend store tests
5. Write E2E test

### Phase 3: Implementation
1. Implement backend endpoint
2. Implement frontend API service method
3. Implement store method
4. Implement UI components (button, dialog, disable logic)
5. Run all tests and iterate until passing

## Notes

- This feature follows the same pattern as character chat "New Chat"
- The repository method `delete_messages_by_group()` already exists
- No new database migrations needed
- No new dependencies needed
- Conversations KB is intentionally NOT cleared (document this)

---

## Architecture Design

### Created Structure

All files modified (no new files created):

```
backend/
├── api/
│   └── group_routes.py          [MODIFIED] Added clear_group_messages endpoint

frontend/
├── src/
│   ├── components/
│   │   ├── GroupHeader.tsx      [MODIFIED] Added "New Chat" button & confirmation dialog
│   │   └── GroupMessageInput.tsx [MODIFIED] Added isClearing check to disable input
│   ├── services/
│   │   └── api.ts               [MODIFIED] Added clearGroupMessages method
│   └── store/
│       └── groupMessageStore.ts [MODIFIED] Added isClearing state & clearGroupMessagesWithAPI
```

### Components Overview

#### Backend Components

**1. group_routes.py::clear_group_messages()**
- **Location**: `/home/denis/Projects/chat_to/backend/api/group_routes.py:425-479`
- **Type**: FastAPI endpoint
- **Signature**:
  ```python
  @router.delete("/{group_id}/messages", status_code=204)
  async def clear_group_messages(
      group_id: str,
      group_repo: GroupRepository = Depends(get_group_repo),
      message_repo = Depends(get_group_message_repo)
  ) -> Response
  ```
- **Responsibilities**:
  - Verify group exists (404 if not found)
  - Log the clearing operation
  - Call `message_repo.delete_messages_by_group(group_id)`
  - Return 204 No Content on success
  - Handle errors with appropriate HTTP codes
- **Dependencies**: Uses existing `GroupMessageRepository.delete_messages_by_group()` method
- **Error Handling**: Returns 404 for missing group, 500 for other errors

#### Frontend Components

**1. apiService.clearGroupMessages()**
- **Location**: `/home/denis/Projects/chat_to/frontend/src/services/api.ts:323-335`
- **Type**: API client method
- **Signature**:
  ```typescript
  async clearGroupMessages(groupId: string): Promise<void>
  ```
- **Responsibilities**:
  - Send DELETE request to `/groups/{groupId}/messages`
  - Handle HTTP response (204 No Content expected)
  - Throw error on failure
- **Dependencies**: axios client

**2. groupMessageStore.clearGroupMessagesWithAPI()**
- **Location**: `/home/denis/Projects/chat_to/frontend/src/store/groupMessageStore.ts:231-262`
- **Type**: Zustand store action
- **Signature**:
  ```typescript
  clearGroupMessagesWithAPI: (groupId: string) => Promise<void>
  ```
- **State Changes**:
  - `isClearing[groupId]`: false → true → false
  - `error[groupId]`: cleared on start, set on error
  - `messages[groupId]`: cleared after successful API call
- **Process**:
  1. Set `isClearing[groupId] = true`
  2. Call `apiService.clearGroupMessages(groupId)`
  3. On success: clear `messages[groupId] = []`
  4. On error: set error message and re-throw
  5. Always: set `isClearing[groupId] = false`
- **Error Handling**: Sets error in state and re-throws for component handling

**3. groupMessageStore state additions**
- **Location**: `/home/denis/Projects/chat_to/frontend/src/store/groupMessageStore.ts:29`
- **New field**: `isClearing: Record<string, boolean>`
- **Purpose**: Track clearing operation status per group
- **Usage**: Disable input and show loading indicator during clear

**4. GroupHeader component updates**
- **Location**: `/home/denis/Projects/chat_to/frontend/src/components/GroupHeader.tsx`
- **New imports**: `useState`, `useGroupMessageStore`
- **New state**:
  - `showClearConfirm: boolean` - controls confirmation dialog visibility
  - `clearError: string | null` - stores error message from clear operation
- **New handlers**:
  - `handleNewChatClick()` - shows confirmation dialog
  - `handleConfirmClear()` - calls `clearGroupMessagesWithAPI()`
  - `handleCancelClear()` - hides confirmation dialog
  - `handleNewChatKeyDown()` - keyboard accessibility
- **UI additions**:
  - "New Chat" button (lines 114-123)
  - Confirmation dialog (lines 143-170)
  - Error message display (lines 172-176)
- **Behavior**: Button hidden when confirmation dialog shown

**5. GroupMessageInput component updates**
- **Location**: `/home/denis/Projects/chat_to/frontend/src/components/GroupMessageInput.tsx`
- **New imports**: Extract `isClearing` from `useGroupMessageStore`
- **New computed values**:
  - `isClearingMessages = isClearing[groupId]`
  - `isDisabled = isSendingMessage || isClearingMessages`
- **UI updates**:
  - Textarea disabled when `isClearing` is true
  - Placeholder shows "Clearing messages..." during clear
  - Send button shows "Clearing..." loader during clear
  - RecordButton disabled during clear
- **Purpose**: Prevent user from sending messages while clearing

### Implementation Recommendations

#### Backend Implementation

**File**: `backend/api/group_routes.py`

The endpoint skeleton is complete with proper structure:
- Uses existing repository method (no implementation needed there)
- Follows same error handling pattern as other endpoints
- Includes logging for debugging
- Documents that conversations KB is not cleared

**Implementation steps**:
1. Endpoint is already complete with all logic
2. No additional backend code needed
3. Repository method already exists and tested

#### Frontend Implementation

**1. API Service** (`frontend/src/services/api.ts`)
- Method signature complete
- Simple DELETE call, no complex logic
- Error handling via axios (automatic)

**2. Store** (`frontend/src/store/groupMessageStore.ts`)
- State additions complete
- `clearGroupMessagesWithAPI` method complete with full logic
- Follows async/await pattern consistently
- Proper error handling with re-throw

**3. GroupHeader** (`frontend/src/components/GroupHeader.tsx`)
- All handlers defined with proper signatures
- Confirmation dialog structure complete
- Error display implemented
- Follows same pattern as CharacterHeader

**4. GroupMessageInput** (`frontend/src/components/GroupMessageInput.tsx`)
- Disable logic implemented
- Loading indicators complete
- Follows existing patterns from sending logic

### Implementation Order

Since this is skeleton code only, the implementation order for Phase 3 would be:

1. **Backend** (already complete in skeleton):
   - Endpoint is fully defined with all logic
   - Just needs to be tested

2. **Frontend API Service** (already complete):
   - Simple method, no additional logic needed

3. **Frontend Store** (already complete):
   - Full async flow implemented in skeleton
   - Error handling included

4. **Frontend Components** (already complete):
   - GroupHeader: button, dialog, handlers all defined
   - GroupMessageInput: disable logic complete

### Considerations

#### Edge Cases Handled

1. **Group doesn't exist**: Backend returns 404
2. **No messages to clear**: Backend handles gracefully (deletes 0 rows)
3. **Multiple groups**: Each group has separate state (isolation guaranteed)
4. **Concurrent operations**: `isClearing` prevents sending during clear
5. **Network errors**: Error caught, displayed, state reset

#### Performance Notes

- Clearing is async, doesn't block UI
- Local state cleared after DB operation (consistency)
- No optimistic updates (safety over speed for destructive operation)

#### Security Notes

- Endpoint verifies group exists before deletion
- Repository uses parameterized queries (SQLAlchemy ORM)
- Group ID validated via route parameter
- No user input sanitization needed (ID is UUID)

#### Testing Strategy

**Backend tests** should cover:
1. Success case: 204 returned, messages deleted
2. Group not found: 404 returned
3. Empty group: Success with 0 deletions
4. Multi-group isolation: Clearing one doesn't affect others

**Frontend component tests** should cover:
1. "New Chat" button renders and is clickable
2. Confirmation dialog shows/hides correctly
3. Confirmation calls store method
4. Error display when clear fails
5. Input disabled during clearing

**Frontend store tests** should cover:
1. `isClearing` state changes correctly
2. API called before local state cleared
3. Error handling and re-throw behavior
4. Messages cleared on success

**Integration/E2E tests** should cover:
1. Full flow: click button → confirm → messages cleared
2. Multiple groups remain isolated
3. Cannot send message while clearing
4. Error recovery (can retry after error)

### API Contract

**Request**:
```
DELETE /api/groups/{group_id}/messages
```

**Success Response**:
```
Status: 204 No Content
Body: (empty)
```

**Error Responses**:
```
404 Not Found
{
  "detail": "Group not found"
}

500 Internal Server Error
{
  "detail": "Failed to clear group messages: <error details>"
}
```

### Data Flow Sequence

```
1. User clicks "New Chat" button in GroupHeader
   ↓
2. GroupHeader.handleNewChatClick() → setShowClearConfirm(true)
   ↓
3. Confirmation dialog appears
   ↓
4. User clicks "Yes"
   ↓
5. GroupHeader.handleConfirmClear() calls clearGroupMessagesWithAPI(groupId)
   ↓
6. Store: set isClearing[groupId] = true
   ↓
7. GroupMessageInput re-renders: input disabled, placeholder shows "Clearing..."
   ↓
8. Store: apiService.clearGroupMessages(groupId)
   ↓
9. API: DELETE /api/groups/{groupId}/messages
   ↓
10. Backend: Verify group exists
    ↓
11. Backend: Log operation
    ↓
12. Backend: message_repo.delete_messages_by_group(groupId)
    ↓
13. Database: DELETE FROM group_messages WHERE group_id = ?
    ↓
14. Backend: Return Response(status_code=204)
    ↓
15. Store: Clear messages[groupId] = []
    ↓
16. Store: Set isClearing[groupId] = false
    ↓
17. GroupMessageInput re-renders: input enabled, shows empty state
    ↓
18. GroupChatWindow shows "No messages yet. Start a conversation!"
```

### Design Decisions

**1. Why not clear conversations KB?**
- Individual character "New Chat" doesn't clear it
- Conversations KB provides long-term context
- Consistency with existing behavior
- Can be added as separate feature later

**2. Why disable input during clearing?**
- Prevents race condition (sending while clearing)
- Clear user feedback about operation in progress
- Matches UX pattern from other loading states

**3. Why confirmation dialog?**
- Destructive operation (cannot be undone)
- Follows UX best practice
- Matches pattern from character deletion

**4. Why call API before clearing local state?**
- Ensure database is actually cleared
- Avoid inconsistency if API fails
- Safety over optimistic UX for destructive operations

**5. Why separate `clearGroupMessages` and `clearGroupMessagesWithAPI`?**
- `clearGroupMessages`: Local-only (useful for testing, internal state management)
- `clearGroupMessagesWithAPI`: Full operation with API call
- Flexibility for different use cases
- Clear separation of concerns

### Files Modified Summary

| File | Lines Changed | Type | Description |
|------|--------------|------|-------------|
| `backend/api/group_routes.py` | +55 | Add | New endpoint `clear_group_messages` |
| `frontend/src/services/api.ts` | +13 | Add | New method `clearGroupMessages` |
| `frontend/src/store/groupMessageStore.ts` | +34 | Add/Modify | Add `isClearing` state, add `clearGroupMessagesWithAPI` |
| `frontend/src/components/GroupHeader.tsx` | +85 | Add/Modify | Add button, dialog, handlers, imports |
| `frontend/src/components/GroupMessageInput.tsx` | +18 | Modify | Add disable logic for clearing state |

**Total**: ~205 lines of code (skeleton + implementation)

### Potential Issues & Solutions

**Issue**: User navigates away during clearing
- **Solution**: Store cleanup on unmount not needed (state is global, operation completes)

**Issue**: Multiple rapid clicks on "New Chat"
- **Solution**: Button hidden when dialog shown, dialog hidden during clearing (via conditional render)

**Issue**: Backend succeeds but frontend fails to clear local state
- **Solution**: User can refresh page to see actual state; consider retry logic in Phase 3

**Issue**: Network timeout during clear operation
- **Solution**: Axios default timeout applies; user gets error message and can retry

### Dependencies

**Backend**: None (all dependencies already exist)
- SQLAlchemy (already used)
- FastAPI (already used)
- Existing repository methods

**Frontend**: None (all dependencies already exist)
- axios (already used)
- zustand (already used)
- react (already used)

### Migration Requirements

**Database**: None (no schema changes)
**Configuration**: None (no new config values)
**Environment**: None (no new environment variables)
