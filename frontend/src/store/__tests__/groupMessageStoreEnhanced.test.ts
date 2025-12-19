/**
 * Enhanced Group Message Store Unit Tests.
 *
 * Comprehensive tests for enhanced Zustand group message store covering:
 * - Message deduplication by ID
 * - Persistence tracking (isPersisted flag)
 * - Message merging logic
 * - Optimistic updates
 * - Chronological ordering
 * - Loading and error states
 * - Multiple group isolation
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { create } from 'zustand';
import type { GroupMessage, CharacterResponse } from '../../types/group';
import type { Message } from '../../types/message';
import {
  mockGroupUserMessage1,
  mockGroupAssistantMessage1,
  mockGroupAssistantMessage2,
  mockGroupUserMessage2,
  mockGroupMessages,
  mockGroupMessagesEmpty,
  mockGroupMessagesResponse,
  mockGroupMessagesResponseEmpty,
  mockGroupMessageResponse,
  mockGroupMessageResponseSingle,
  mockCharacterResponse1,
  mockCharacterResponse2,
  mockCharacterResponseWithError,
  mockGroupId1,
  mockGroupId2,
  mockNonexistentGroupId,
  mockCharacterIds,
  mockTrackedGroupUserMessage1,
  mockTrackedGroupAssistantMessage1,
  mockTrackedGroupUserMessage2Optimistic,
  mockTrackedGroupUserMessage2Persisted,
  TrackedGroupMessage,
} from '../../tests/mockGroupData';

// Extended message type with isPersisted flag
interface GroupMessageStoreEnhanced {
  // State
  messages: Record<string, TrackedGroupMessage[]>;
  isLoading: Record<string, boolean>;
  isSending: Record<string, boolean>;
  error: Record<string, string | null>;

  // Actions
  fetchGroupMessages: (groupId: string, limit?: number, offset?: number) => Promise<void>;
  sendGroupMessage: (
    groupId: string,
    content: string,
    characterIds: string[],
    messageLimit?: number
  ) => Promise<void>;
  mergeMessages: (groupId: string, loadedMessages: GroupMessage[]) => void;
  markMessageAsPersisted: (groupId: string, messageId: string) => void;
  clearGroupMessages: (groupId: string) => void;
  setMessages: (groupId: string, messages: TrackedGroupMessage[]) => void;
}

/**
 * Deduplicates messages by ID, preferring persisted over optimistic.
 */
const deduplicateMessages = (messages: TrackedGroupMessage[]): TrackedGroupMessage[] => {
  const messageMap = new Map<string, TrackedGroupMessage>();

  for (const message of messages) {
    const existing = messageMap.get(message.id);

    // Prefer persisted version over optimistic
    if (!existing || (message.isPersisted && !existing.isPersisted)) {
      messageMap.set(message.id, message);
    }
  }

  // Return sorted chronologically
  return Array.from(messageMap.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
};

// Mock API service
const mockApiService = {
  getGroupMessages: vi.fn(),
  sendGroupMessage: vi.fn(),
};

// Create enhanced store (skeleton implementation for testing)
const createGroupMessageStoreEnhanced = create<GroupMessageStoreEnhanced>((set, get) => ({
  messages: {},
  isLoading: {},
  isSending: {},
  error: {},

  fetchGroupMessages: async (groupId: string, limit = 50, offset = 0) => {
    set((state) => ({
      isLoading: { ...state.isLoading, [groupId]: true },
      error: { ...state.error, [groupId]: null },
    }));

    try {
      const response = await mockApiService.getGroupMessages(groupId, limit, offset);
      const loadedMessages = response.messages.map((msg: GroupMessage) => ({
        ...msg,
        isPersisted: true,
      }));

      // Merge with existing messages using deduplication
      const existing = get().messages[groupId] || [];
      const merged = deduplicateMessages([...existing, ...loadedMessages]);

      set({
        messages: { ...get().messages, [groupId]: merged },
        isLoading: { ...get().isLoading, [groupId]: false },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch messages';
      set((state) => ({
        error: { ...state.error, [groupId]: errorMessage },
        isLoading: { ...state.isLoading, [groupId]: false },
      }));
    }
  },

  sendGroupMessage: async (
    groupId: string,
    content: string,
    characterIds: string[],
    messageLimit = 5
  ) => {
    const { messages: currentMessages } = get();
    const groupMessages = currentMessages[groupId] || [];
    const recentMessages = messageLimit > 0 ? groupMessages.slice(-messageLimit) : [];

    // Create optimistic user message
    const userMessage: TrackedGroupMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
      isPersisted: false,
    };

    // Add optimistically
    set((state) => ({
      messages: {
        ...state.messages,
        [groupId]: [...groupMessages, userMessage],
      },
      isSending: { ...state.isSending, [groupId]: true },
      error: { ...state.error, [groupId]: null },
    }));

    try {
      const response = await mockApiService.sendGroupMessage({
        messages: [...recentMessages, userMessage],
        character_ids: characterIds,
      });

      // Mark user message as persisted
      const updatedUserMessage = { ...userMessage, isPersisted: true };

      // Convert character responses to messages
      const characterMessages: TrackedGroupMessage[] = response.responses.map(
        (resp: CharacterResponse, index: number) => ({
          id: `${resp.character_id}-${Date.now()}-${index}`,
          role: 'assistant' as const,
          content: resp.message,
          created_at: new Date().toISOString(),
          character_id: resp.character_id,
          character_name: resp.character_name,
          emotions: resp.emotions,
          error: resp.error,
          isPersisted: true,
        })
      );

      // Replace optimistic message with persisted one and add responses
      const currentGroupMessages = get().messages[groupId] || [];
      const withoutOptimistic = currentGroupMessages.filter((msg) => msg.id !== userMessage.id);

      set({
        messages: {
          ...get().messages,
          [groupId]: [...withoutOptimistic, updatedUserMessage, ...characterMessages],
        },
        isSending: { ...get().isSending, [groupId]: false },
      });
    } catch (error) {
      // Remove optimistic message on error
      const currentGroupMessages = get().messages[groupId] || [];
      const withoutOptimistic = currentGroupMessages.filter((msg) => msg.id !== userMessage.id);

      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      set((state) => ({
        messages: { ...state.messages, [groupId]: withoutOptimistic },
        error: { ...state.error, [groupId]: errorMessage },
        isSending: { ...state.isSending, [groupId]: false },
      }));
    }
  },

  mergeMessages: (groupId: string, loadedMessages: GroupMessage[]) => {
    const existing = get().messages[groupId] || [];
    const trackedLoaded = loadedMessages.map((msg) => ({ ...msg, isPersisted: true }));
    const merged = deduplicateMessages([...existing, ...trackedLoaded]);

    set({
      messages: { ...get().messages, [groupId]: merged },
    });
  },

  markMessageAsPersisted: (groupId: string, messageId: string) => {
    const groupMessages = get().messages[groupId] || [];
    const updated = groupMessages.map((msg) =>
      msg.id === messageId ? { ...msg, isPersisted: true } : msg
    );

    set({
      messages: { ...get().messages, [groupId]: updated },
    });
  },

  clearGroupMessages: (groupId: string) => {
    set({
      messages: { ...get().messages, [groupId]: [] },
    });
  },

  setMessages: (groupId: string, messages: TrackedGroupMessage[]) => {
    set({
      messages: { ...get().messages, [groupId]: messages },
    });
  },
}));

describe('GroupMessageStoreEnhanced', () => {
  let store: ReturnType<typeof createGroupMessageStoreEnhanced>;

  beforeEach(() => {
    // Reset store state before each test
    store = createGroupMessageStoreEnhanced;
    store.setState({
      messages: {},
      isLoading: {},
      isSending: {},
      error: {},
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState();

      expect(state.messages).toEqual({});
      expect(state.isLoading).toEqual({});
      expect(state.isSending).toEqual({});
      expect(state.error).toEqual({});
    });
  });

  describe('Deduplication Logic', () => {
    it('should deduplicate messages by ID', () => {
      // Arrange
      const duplicate1: TrackedGroupMessage = { ...mockGroupUserMessage1, isPersisted: false };
      const duplicate2: TrackedGroupMessage = { ...mockGroupUserMessage1, isPersisted: true };
      const messages = [duplicate1, duplicate2, mockGroupAssistantMessage1];

      // Act
      const deduplicated = deduplicateMessages(messages);

      // Assert
      expect(deduplicated).toHaveLength(2);
      expect(deduplicated.map((m) => m.id)).toEqual([
        mockGroupUserMessage1.id,
        mockGroupAssistantMessage1.id,
      ]);
    });

    it('should prefer persisted version over optimistic', () => {
      // Arrange
      const optimistic: TrackedGroupMessage = {
        ...mockGroupUserMessage1,
        isPersisted: false,
        content: 'Optimistic content',
      };
      const persisted: TrackedGroupMessage = {
        ...mockGroupUserMessage1,
        isPersisted: true,
        content: 'Persisted content',
      };
      const messages = [optimistic, persisted];

      // Act
      const deduplicated = deduplicateMessages(messages);

      // Assert
      expect(deduplicated).toHaveLength(1);
      expect(deduplicated[0].content).toBe('Persisted content');
      expect(deduplicated[0].isPersisted).toBe(true);
    });

    it('should keep optimistic if no persisted version exists', () => {
      // Arrange
      const optimistic: TrackedGroupMessage = {
        ...mockGroupUserMessage1,
        isPersisted: false,
      };
      const messages = [optimistic];

      // Act
      const deduplicated = deduplicateMessages(messages);

      // Assert
      expect(deduplicated).toHaveLength(1);
      expect(deduplicated[0].isPersisted).toBe(false);
    });

    it('should maintain chronological order after deduplication', () => {
      // Arrange
      const msg1: TrackedGroupMessage = { ...mockGroupUserMessage1, isPersisted: true };
      const msg2: TrackedGroupMessage = { ...mockGroupAssistantMessage1, isPersisted: true };
      const msg3: TrackedGroupMessage = { ...mockGroupUserMessage2, isPersisted: true };
      const messages = [msg3, msg1, msg2]; // Out of order

      // Act
      const deduplicated = deduplicateMessages(messages);

      // Assert
      expect(deduplicated).toHaveLength(3);
      expect(deduplicated[0].id).toBe(msg1.id);
      expect(deduplicated[1].id).toBe(msg2.id);
      expect(deduplicated[2].id).toBe(msg3.id);
    });

    it('should handle empty message array', () => {
      // Arrange
      const messages: TrackedGroupMessage[] = [];

      // Act
      const deduplicated = deduplicateMessages(messages);

      // Assert
      expect(deduplicated).toEqual([]);
    });

    it('should handle messages with same timestamp', () => {
      // Arrange
      const msg1: TrackedGroupMessage = {
        ...mockGroupAssistantMessage1,
        id: 'msg-1',
        created_at: '2025-01-15T10:00:00Z',
        isPersisted: true,
      };
      const msg2: TrackedGroupMessage = {
        ...mockGroupAssistantMessage2,
        id: 'msg-2',
        created_at: '2025-01-15T10:00:00Z',
        isPersisted: true,
      };
      const messages = [msg1, msg2];

      // Act
      const deduplicated = deduplicateMessages(messages);

      // Assert
      expect(deduplicated).toHaveLength(2);
    });
  });

  describe('fetchGroupMessages', () => {
    it('should fetch messages and mark them as persisted', async () => {
      // Arrange
      mockApiService.getGroupMessages = vi.fn().mockResolvedValue(mockGroupMessagesResponse);

      // Act
      await store.getState().fetchGroupMessages(mockGroupId1);

      // Assert
      expect(mockApiService.getGroupMessages).toHaveBeenCalledWith(mockGroupId1, 50, 0);
      const state = store.getState();
      expect(state.messages[mockGroupId1]).toHaveLength(mockGroupMessages.length);
      expect(state.messages[mockGroupId1].every((msg) => msg.isPersisted === true)).toBe(true);
      expect(state.isLoading[mockGroupId1]).toBe(false);
      expect(state.error[mockGroupId1]).toBeNull();
    });

    it('should merge fetched messages with existing messages', async () => {
      // Arrange
      const existingOptimistic: TrackedGroupMessage = {
        ...mockGroupUserMessage1,
        isPersisted: false,
      };
      store.getState().setMessages(mockGroupId1, [existingOptimistic]);
      mockApiService.getGroupMessages = vi.fn().mockResolvedValue(mockGroupMessagesResponse);

      // Act
      await store.getState().fetchGroupMessages(mockGroupId1);

      // Assert
      const state = store.getState();
      // Should have all fetched messages, with persisted version replacing optimistic
      expect(state.messages[mockGroupId1]).toHaveLength(mockGroupMessages.length);
      const userMsg = state.messages[mockGroupId1].find(
        (msg) => msg.id === mockGroupUserMessage1.id
      );
      expect(userMsg?.isPersisted).toBe(true);
    });

    it('should set loading state while fetching', async () => {
      // Arrange
      let resolveFetch: any;
      const promise = new Promise((resolve) => {
        resolveFetch = resolve;
      });
      mockApiService.getGroupMessages = vi.fn().mockReturnValue(promise);

      // Act
      const fetchPromise = store.getState().fetchGroupMessages(mockGroupId1);

      // Assert - loading should be true during fetch
      expect(store.getState().isLoading[mockGroupId1]).toBe(true);

      // Resolve the promise
      resolveFetch(mockGroupMessagesResponse);
      await fetchPromise;

      // Assert - loading should be false after fetch
      expect(store.getState().isLoading[mockGroupId1]).toBe(false);
    });

    it('should handle empty messages response', async () => {
      // Arrange
      mockApiService.getGroupMessages = vi.fn().mockResolvedValue(mockGroupMessagesResponseEmpty);

      // Act
      await store.getState().fetchGroupMessages(mockGroupId1);

      // Assert
      const state = store.getState();
      expect(state.messages[mockGroupId1]).toEqual([]);
      expect(state.error[mockGroupId1]).toBeNull();
    });

    it('should handle network error', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockApiService.getGroupMessages = vi.fn().mockRejectedValue(networkError);

      // Act
      await store.getState().fetchGroupMessages(mockGroupId1);

      // Assert
      const state = store.getState();
      expect(state.error[mockGroupId1]).toBe('Network Error');
      expect(state.isLoading[mockGroupId1]).toBe(false);
    });

    it('should fetch messages with custom pagination', async () => {
      // Arrange
      mockApiService.getGroupMessages = vi.fn().mockResolvedValue(mockGroupMessagesResponse);

      // Act
      await store.getState().fetchGroupMessages(mockGroupId1, 100, 50);

      // Assert
      expect(mockApiService.getGroupMessages).toHaveBeenCalledWith(mockGroupId1, 100, 50);
    });

    it('should maintain separate state for different groups', async () => {
      // Arrange
      const response1 = {
        messages: [mockGroupUserMessage1],
        total: 1,
      };
      const response2 = {
        messages: [mockGroupAssistantMessage1],
        total: 1,
      };
      mockApiService.getGroupMessages = vi
        .fn()
        .mockResolvedValueOnce(response1)
        .mockResolvedValueOnce(response2);

      // Act
      await store.getState().fetchGroupMessages(mockGroupId1);
      await store.getState().fetchGroupMessages(mockGroupId2);

      // Assert
      const state = store.getState();
      expect(state.messages[mockGroupId1]).toHaveLength(1);
      expect(state.messages[mockGroupId2]).toHaveLength(1);
      expect(state.messages[mockGroupId1][0].id).not.toBe(state.messages[mockGroupId2][0].id);
    });
  });

  describe('sendGroupMessage', () => {
    it('should add user message optimistically then mark as persisted', async () => {
      // Arrange
      mockApiService.sendGroupMessage = vi.fn().mockResolvedValue(mockGroupMessageResponse);
      store.getState().setMessages(mockGroupId1, []);

      // Act
      const sendPromise = store.getState().sendGroupMessage(mockGroupId1, 'Test message', mockCharacterIds);

      // Assert - optimistic message should be added with isPersisted: false
      let state = store.getState();
      expect(state.messages[mockGroupId1]).toHaveLength(1);
      expect(state.messages[mockGroupId1][0].isPersisted).toBe(false);
      expect(state.messages[mockGroupId1][0].content).toBe('Test message');

      await sendPromise;

      // Assert - after response, message should be marked as persisted
      state = store.getState();
      const userMsg = state.messages[mockGroupId1].find((msg) => msg.role === 'user');
      expect(userMsg?.isPersisted).toBe(true);
    });

    it('should add character responses as persisted messages', async () => {
      // Arrange
      mockApiService.sendGroupMessage = vi.fn().mockResolvedValue(mockGroupMessageResponse);
      store.getState().setMessages(mockGroupId1, []);

      // Act
      await store.getState().sendGroupMessage(mockGroupId1, 'Test message', mockCharacterIds);

      // Assert
      const state = store.getState();
      const assistantMessages = state.messages[mockGroupId1].filter((msg) => msg.role === 'assistant');
      expect(assistantMessages).toHaveLength(2);
      expect(assistantMessages.every((msg) => msg.isPersisted === true)).toBe(true);
      expect(assistantMessages[0].character_id).toBe(mockCharacterResponse1.character_id);
      expect(assistantMessages[1].character_id).toBe(mockCharacterResponse2.character_id);
    });

    it('should set sending state during operation', async () => {
      // Arrange
      let resolveSend: any;
      const promise = new Promise((resolve) => {
        resolveSend = resolve;
      });
      mockApiService.sendGroupMessage = vi.fn().mockReturnValue(promise);
      store.getState().setMessages(mockGroupId1, []);

      // Act
      const sendPromise = store.getState().sendGroupMessage(mockGroupId1, 'Test', mockCharacterIds);

      // Assert - sending should be true during operation
      expect(store.getState().isSending[mockGroupId1]).toBe(true);

      // Resolve the promise
      resolveSend(mockGroupMessageResponse);
      await sendPromise;

      // Assert - sending should be false after operation
      expect(store.getState().isSending[mockGroupId1]).toBe(false);
    });

    it('should remove optimistic message on error', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockApiService.sendGroupMessage = vi.fn().mockRejectedValue(networkError);
      store.getState().setMessages(mockGroupId1, []);

      // Act
      await store.getState().sendGroupMessage(mockGroupId1, 'Test message', mockCharacterIds);

      // Assert
      const state = store.getState();
      expect(state.messages[mockGroupId1]).toHaveLength(0); // Optimistic message removed
      expect(state.error[mockGroupId1]).toBe('Network Error');
      expect(state.isSending[mockGroupId1]).toBe(false);
    });

    it('should include recent messages as context', async () => {
      // Arrange
      store.getState().setMessages(mockGroupId1, [
        { ...mockGroupUserMessage1, isPersisted: true },
        { ...mockGroupAssistantMessage1, isPersisted: true },
        { ...mockGroupAssistantMessage2, isPersisted: true },
      ]);
      mockApiService.sendGroupMessage = vi.fn().mockResolvedValue(mockGroupMessageResponse);

      // Act
      await store.getState().sendGroupMessage(mockGroupId1, 'New message', mockCharacterIds, 2);

      // Assert
      const callArgs = mockApiService.sendGroupMessage.mock.calls[0][0];
      // Should include last 2 messages + new message
      expect(callArgs.messages).toHaveLength(3);
      expect(callArgs.messages[0].id).toBe(mockGroupAssistantMessage1.id);
      expect(callArgs.messages[1].id).toBe(mockGroupAssistantMessage2.id);
      expect(callArgs.messages[2].content).toBe('New message');
    });

    it('should handle character response with error', async () => {
      // Arrange
      const responseWithError = {
        responses: [mockCharacterResponse1, mockCharacterResponseWithError],
      };
      mockApiService.sendGroupMessage = vi.fn().mockResolvedValue(responseWithError);
      store.getState().setMessages(mockGroupId1, []);

      // Act
      await store.getState().sendGroupMessage(mockGroupId1, 'Test', mockCharacterIds);

      // Assert
      const state = store.getState();
      const errorMessage = state.messages[mockGroupId1].find((msg) => msg.error);
      expect(errorMessage).toBeDefined();
      expect(errorMessage?.error).toBe('LLM service temporarily unavailable');
    });

    it('should append to existing messages', async () => {
      // Arrange
      store.getState().setMessages(mockGroupId1, [
        { ...mockGroupUserMessage1, isPersisted: true },
        { ...mockGroupAssistantMessage1, isPersisted: true },
      ]);
      mockApiService.sendGroupMessage = vi.fn().mockResolvedValue(mockGroupMessageResponseSingle);

      // Act
      await store.getState().sendGroupMessage(mockGroupId1, 'Another question', mockCharacterIds);

      // Assert
      const state = store.getState();
      expect(state.messages[mockGroupId1].length).toBeGreaterThan(2);
    });
  });

  describe('mergeMessages', () => {
    it('should merge loaded messages with existing messages', () => {
      // Arrange
      const existing: TrackedGroupMessage[] = [
        { ...mockGroupUserMessage1, isPersisted: false },
      ];
      store.getState().setMessages(mockGroupId1, existing);

      // Act
      store.getState().mergeMessages(mockGroupId1, [mockGroupUserMessage1, mockGroupAssistantMessage1]);

      // Assert
      const state = store.getState();
      expect(state.messages[mockGroupId1]).toHaveLength(2);
      const userMsg = state.messages[mockGroupId1].find((msg) => msg.id === mockGroupUserMessage1.id);
      expect(userMsg?.isPersisted).toBe(true); // Should prefer persisted version
    });

    it('should mark merged messages as persisted', () => {
      // Arrange
      store.getState().setMessages(mockGroupId1, []);

      // Act
      store.getState().mergeMessages(mockGroupId1, mockGroupMessages);

      // Assert
      const state = store.getState();
      expect(state.messages[mockGroupId1].every((msg) => msg.isPersisted === true)).toBe(true);
    });

    it('should deduplicate during merge', () => {
      // Arrange
      store.getState().setMessages(mockGroupId1, [
        { ...mockGroupUserMessage1, isPersisted: true },
        { ...mockGroupAssistantMessage1, isPersisted: true },
      ]);

      // Act - merge with overlapping messages
      store.getState().mergeMessages(mockGroupId1, [
        mockGroupUserMessage1,
        mockGroupAssistantMessage1,
        mockGroupAssistantMessage2,
      ]);

      // Assert
      const state = store.getState();
      expect(state.messages[mockGroupId1]).toHaveLength(3); // No duplicates
    });
  });

  describe('markMessageAsPersisted', () => {
    it('should mark specific message as persisted', () => {
      // Arrange
      const optimistic: TrackedGroupMessage = {
        ...mockGroupUserMessage1,
        isPersisted: false,
      };
      store.getState().setMessages(mockGroupId1, [optimistic]);

      // Act
      store.getState().markMessageAsPersisted(mockGroupId1, mockGroupUserMessage1.id);

      // Assert
      const state = store.getState();
      expect(state.messages[mockGroupId1][0].isPersisted).toBe(true);
    });

    it('should not modify other messages', () => {
      // Arrange
      const msg1: TrackedGroupMessage = { ...mockGroupUserMessage1, isPersisted: false };
      const msg2: TrackedGroupMessage = { ...mockGroupAssistantMessage1, isPersisted: false };
      store.getState().setMessages(mockGroupId1, [msg1, msg2]);

      // Act
      store.getState().markMessageAsPersisted(mockGroupId1, mockGroupUserMessage1.id);

      // Assert
      const state = store.getState();
      expect(state.messages[mockGroupId1][0].isPersisted).toBe(true);
      expect(state.messages[mockGroupId1][1].isPersisted).toBe(false);
    });

    it('should handle non-existent message ID gracefully', () => {
      // Arrange
      store.getState().setMessages(mockGroupId1, [{ ...mockGroupUserMessage1, isPersisted: false }]);

      // Act
      store.getState().markMessageAsPersisted(mockGroupId1, 'non-existent-id');

      // Assert - should not throw error
      const state = store.getState();
      expect(state.messages[mockGroupId1]).toHaveLength(1);
    });
  });

  describe('clearGroupMessages', () => {
    it('should clear messages for specific group', () => {
      // Arrange
      store.getState().setMessages(mockGroupId1, [...mockGroupMessages]);
      store.getState().setMessages(mockGroupId2, [mockGroupUserMessage1]);

      // Act
      store.getState().clearGroupMessages(mockGroupId1);

      // Assert
      const state = store.getState();
      expect(state.messages[mockGroupId1]).toEqual([]);
      expect(state.messages[mockGroupId2]).toHaveLength(1);
    });

    it('should handle clearing non-existent group', () => {
      // Arrange
      store.getState().setMessages(mockGroupId1, [...mockGroupMessages]);

      // Act
      store.getState().clearGroupMessages(mockNonexistentGroupId);

      // Assert - should not throw error
      const state = store.getState();
      expect(state.messages[mockNonexistentGroupId]).toEqual([]);
      expect(state.messages[mockGroupId1]).toHaveLength(mockGroupMessages.length);
    });

    it('should allow fetching after clearing', async () => {
      // Arrange
      store.getState().setMessages(mockGroupId1, [...mockGroupMessages]);
      store.getState().clearGroupMessages(mockGroupId1);
      mockApiService.getGroupMessages = vi.fn().mockResolvedValue(mockGroupMessagesResponse);

      // Act
      await store.getState().fetchGroupMessages(mockGroupId1);

      // Assert
      const state = store.getState();
      expect(state.messages[mockGroupId1]).toHaveLength(mockGroupMessages.length);
    });
  });

  describe('Multiple Group Isolation', () => {
    it('should maintain separate message histories for different groups', async () => {
      // Arrange
      mockApiService.getGroupMessages = vi
        .fn()
        .mockResolvedValueOnce({ messages: [mockGroupUserMessage1], total: 1 })
        .mockResolvedValueOnce({ messages: [mockGroupAssistantMessage1], total: 1 });

      // Act
      await store.getState().fetchGroupMessages(mockGroupId1);
      await store.getState().fetchGroupMessages(mockGroupId2);

      // Assert
      const state = store.getState();
      expect(state.messages[mockGroupId1]).not.toEqual(state.messages[mockGroupId2]);
      expect(state.messages[mockGroupId1][0].id).toBe(mockGroupUserMessage1.id);
      expect(state.messages[mockGroupId2][0].id).toBe(mockGroupAssistantMessage1.id);
    });

    it('should maintain separate loading states', async () => {
      // Arrange
      let resolveGroup1: any;
      const promise1 = new Promise((resolve) => {
        resolveGroup1 = resolve;
      });
      mockApiService.getGroupMessages = vi
        .fn()
        .mockReturnValueOnce(promise1)
        .mockResolvedValueOnce(mockGroupMessagesResponse);

      // Act
      const fetch1 = store.getState().fetchGroupMessages(mockGroupId1);
      await store.getState().fetchGroupMessages(mockGroupId2);

      // Assert - group1 still loading, group2 done
      let state = store.getState();
      expect(state.isLoading[mockGroupId1]).toBe(true);
      expect(state.isLoading[mockGroupId2]).toBe(false);

      resolveGroup1(mockGroupMessagesResponse);
      await fetch1;

      state = store.getState();
      expect(state.isLoading[mockGroupId1]).toBe(false);
    });

    it('should maintain separate error states', async () => {
      // Arrange
      const error = new Error('Group 1 Error');
      mockApiService.getGroupMessages = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockGroupMessagesResponse);

      // Act
      await store.getState().fetchGroupMessages(mockGroupId1);
      await store.getState().fetchGroupMessages(mockGroupId2);

      // Assert
      const state = store.getState();
      expect(state.error[mockGroupId1]).toBe('Group 1 Error');
      expect(state.error[mockGroupId2]).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle messages with invalid timestamps', () => {
      // Arrange
      const invalidMsg: TrackedGroupMessage = {
        ...mockGroupUserMessage1,
        created_at: 'invalid-date',
        isPersisted: true,
      };

      // Act & Assert - should not crash
      const messages = [invalidMsg];
      const deduplicated = deduplicateMessages(messages);
      expect(deduplicated).toHaveLength(1);
    });

    it('should handle extremely large message count', () => {
      // Arrange
      const manyMessages: TrackedGroupMessage[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: `Message ${i}`,
        created_at: new Date(Date.now() + i * 1000).toISOString(),
        isPersisted: true,
      }));

      // Act
      store.getState().setMessages(mockGroupId1, manyMessages);

      // Assert
      const state = store.getState();
      expect(state.messages[mockGroupId1]).toHaveLength(1000);
    });

    it('should handle concurrent fetch and send operations', async () => {
      // Arrange
      mockApiService.getGroupMessages = vi.fn().mockResolvedValue(mockGroupMessagesResponse);
      mockApiService.sendGroupMessage = vi.fn().mockResolvedValue(mockGroupMessageResponse);

      // Act - start both operations simultaneously
      const fetchPromise = store.getState().fetchGroupMessages(mockGroupId1);
      const sendPromise = store.getState().sendGroupMessage(mockGroupId1, 'Test', mockCharacterIds);

      await Promise.all([fetchPromise, sendPromise]);

      // Assert - both operations should complete successfully
      const state = store.getState();
      expect(state.isLoading[mockGroupId1]).toBe(false);
      expect(state.isSending[mockGroupId1]).toBe(false);
      expect(state.messages[mockGroupId1].length).toBeGreaterThan(0);
    });
  });
});
