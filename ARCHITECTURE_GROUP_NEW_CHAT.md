# Architecture Design: Group Chat "New Chat" Feature

## Summary

This document describes the architectural design for implementing "New Chat" functionality in group chats, allowing users to clear all message history for a group while keeping the group itself intact.

## Design Phase Complete

**Status**: Architecture and skeleton code complete
**Next Phase**: Write tests (TDD Phase 2)
**Implementation**: Ready for Phase 3 after tests are written

## Files Modified

### Backend (1 file)
- **`/home/denis/Projects/chat_to/backend/api/group_routes.py`**
  - Added endpoint: `DELETE /{group_id}/messages` (lines 425-479)
  - Fully implemented with logging and error handling
  - Uses existing `GroupMessageRepository.delete_messages_by_group()` method

### Frontend (4 files)

1. **`/home/denis/Projects/chat_to/frontend/src/services/api.ts`**
   - Added method: `clearGroupMessages(groupId: string)` (lines 323-335)
   - Simple DELETE request to backend endpoint

2. **`/home/denis/Projects/chat_to/frontend/src/store/groupMessageStore.ts`**
   - Added state: `isClearing: Record<string, boolean>` (line 29)
   - Added method: `clearGroupMessagesWithAPI(groupId: string)` (lines 231-262)
   - Full async flow with error handling

3. **`/home/denis/Projects/chat_to/frontend/src/components/GroupHeader.tsx`**
   - Added "New Chat" button with confirmation dialog
   - Added state management for confirmation and errors
   - Added handlers: `handleNewChatClick`, `handleConfirmClear`, `handleCancelClear`
   - Fully implemented UI with accessibility

4. **`/home/denis/Projects/chat_to/frontend/src/components/GroupMessageInput.tsx`**
   - Added `isClearing` state check
   - Input disabled during clear operation
   - Loading indicators for clearing state
   - Updated placeholders and button text

## Key Features

### User Experience
1. "New Chat" button in group header
2. Confirmation dialog before clearing
3. Input disabled during clearing (prevents race conditions)
4. Loading indicators during operation
5. Error messages if clearing fails
6. Consistent with individual character chat UX

### Technical Features
1. Database isolation per group (clearing one doesn't affect others)
2. API-first approach (database cleared before local state)
3. Proper error handling at all levels
4. Logging for debugging
5. Accessibility support (keyboard navigation, ARIA labels)

## Architecture Patterns

### Following Project Standards
- **TDD Methodology**: Skeleton → Tests → Implementation
- **Single Responsibility**: Each component has one clear purpose
- **Error Handling**: Explicit error handling at each layer
- **Type Safety**: Full TypeScript type coverage
- **Consistency**: Matches patterns from character chat "New Chat"

### State Management
- Per-group loading states (`isClearing[groupId]`)
- Clear error propagation (store → component)
- No optimistic updates (safety for destructive operation)

### API Design
- RESTful endpoint: `DELETE /api/groups/{group_id}/messages`
- Proper HTTP status codes (204 success, 404 not found, 500 error)
- Idempotent operation (safe to retry)

## Risk Mitigation

### Problems Addressed

1. **Race Condition**: API called before state cleared
2. **User Input During Clear**: Input disabled via `isClearing` state
3. **Multi-Group Isolation**: Separate state per group ID
4. **Conversations KB**: Intentionally not cleared (documented)

## Testing Requirements

### Backend Tests Needed
- Endpoint returns 204 on success
- Endpoint returns 404 for nonexistent group
- Messages deleted only for specified group
- Empty group handled gracefully

### Frontend Tests Needed
- Button renders and triggers confirmation
- Confirmation dialog shows/hides correctly
- Store method called on confirmation
- Input disabled during clearing
- Error displayed if operation fails
- State changes correctly (isClearing true → false)

## Implementation Status

### Completed (Phase 1)
- ✅ Architecture design documented
- ✅ Backend endpoint skeleton created
- ✅ Frontend API method created
- ✅ Store method with full logic created
- ✅ UI components updated with handlers
- ✅ Task documentation complete

### Next Steps (Phase 2)
- ⏳ Write backend unit tests
- ⏳ Write backend integration tests
- ⏳ Write frontend component tests
- ⏳ Write frontend store tests
- ⏳ Write E2E test

### Future (Phase 3)
- ⏳ Run all tests
- ⏳ Verify implementation (most code is complete)
- ⏳ Fix any test failures
- ⏳ Integration testing
- ⏳ Manual QA testing

## Code Quality

### Documentation
- All methods have comprehensive docstrings
- Type annotations throughout
- Comments explain design decisions
- Architecture documented in task file

### Accessibility
- Keyboard navigation support
- ARIA labels on all interactive elements
- Screen reader announcements
- Semantic HTML

### Error Handling
- Try-catch blocks at all async boundaries
- User-friendly error messages
- Error state displayed in UI
- Logging for debugging

## Design Decisions

### Key Choices

1. **No Conversations KB Clearing**
   - Rationale: Consistency with character chat behavior
   - Benefit: Preserves long-term context
   - Future: Can be added as separate feature

2. **Confirmation Dialog**
   - Rationale: Destructive operation needs confirmation
   - Benefit: Prevents accidental data loss
   - Pattern: Matches delete confirmation UX

3. **Disable Input During Clear**
   - Rationale: Prevent race conditions
   - Benefit: Clear feedback, prevents errors
   - Pattern: Consistent with other loading states

4. **API-First State Update**
   - Rationale: Ensure database consistency
   - Benefit: No state/database mismatch
   - Tradeoff: Slower UX, but safer

## Files Summary

| File | Type | Lines Added | Purpose |
|------|------|-------------|---------|
| `backend/api/group_routes.py` | Python | +55 | DELETE endpoint |
| `frontend/src/services/api.ts` | TypeScript | +13 | API client method |
| `frontend/src/store/groupMessageStore.ts` | TypeScript | +34 | State & async logic |
| `frontend/src/components/GroupHeader.tsx` | React | +85 | UI & handlers |
| `frontend/src/components/GroupMessageInput.tsx` | React | +18 | Disable logic |
| **Total** | | **~205** | |

## External Documentation

Full architectural details available in:
- **`/home/denis/Projects/chat_to/task_group_new_chat.md`** - Complete task specification
- **`/home/denis/Projects/chat_to/TODO.md`** - Original requirements

## Dependencies

**No new dependencies required**
- All required libraries already in project
- Uses existing repository methods
- No database migrations needed

## Conclusion

The architecture is complete and ready for Phase 2 (test development). All code follows project patterns and standards. The implementation is straightforward since the skeleton code includes most of the logic needed.

**Estimated Effort**:
- Tests: 4-6 hours (comprehensive test coverage)
- Implementation verification: 1-2 hours (most code is done)
- QA: 1 hour
- **Total**: 6-9 hours

**Complexity**: Low-Medium
- Backend: Simple (1 endpoint using existing method)
- Frontend: Medium (multiple components, state management)
- Testing: Medium (need good coverage for destructive operation)
