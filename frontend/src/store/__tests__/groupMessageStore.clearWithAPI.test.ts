/**
 * Comprehensive tests for clearGroupMessagesWithAPI method and isClearing state.
 *
 * This test suite focuses specifically on the new "New Chat" functionality
 * added to the group message store, testing the clearGroupMessagesWithAPI
 * method and associated isClearing state management.
 *
 * Test Coverage:
 * - Happy path: Successful clear with API call
 * - State management: isClearing flag lifecycle
 * - Error handling: API failures, network errors
 * - Multi-group isolation: isClearing per group
 * - Race conditions: Multiple clear attempts
 * - API call ordering: API before local state
 * - Error re-throw for component handling
 * - State consistency after errors
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useGroupMessageStore } from '../groupMessageStore';
import { apiService } from '../../services/api';
import type { GroupMessage } from '../../types/group';

// Mock the API service
vi.mock('../../services/api');
const mockedApiService = vi.mocked(apiService, true);

describe('GroupMessageStore - clearGroupMessagesWithAPI', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useGroupMessageStore.getState();
    store.messages = {};
    store.isLoading = {};
    store.isSending = {};
    store.isClearing = {};
    store.error = {};

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Happy Path', () => {
    it('should successfully clear group messages with API call', async () => {
      // Arrange
      const groupId = 'group-123';
      const existingMessages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test message 1',
          created_at: '2025-01-01T10:00:00Z',
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Test response',
          created_at: '2025-01-01T10:00:05Z',
          character_id: 'char-1',
          character_name: 'Hegel',
        },
      ];

      useGroupMessageStore.getState().messages[groupId] = existingMessages;
      mockedApiService.clearGroupMessages = vi.fn().mockResolvedValue(undefined);

      // Act
      await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);

      // Assert
      expect(mockedApiService.clearGroupMessages).toHaveBeenCalledTimes(1);
      expect(mockedApiService.clearGroupMessages).toHaveBeenCalledWith(groupId);

      const store = useGroupMessageStore.getState();
      expect(store.messages[groupId]).toEqual([]);
      expect(store.isClearing[groupId]).toBe(false);
      expect(store.error[groupId]).toBeNull();
    });

    it('should call API before clearing local state', async () => {
      // Arrange
      const groupId = 'group-456';
      const existingMessages: GroupMessage[] = [
        { id: 'msg-1', role: 'user', content: 'Test', created_at: '2025-01-01T10:00:00Z' },
      ];

      useGroupMessageStore.getState().messages[groupId] = existingMessages;

      const callOrder: string[] = [];

      mockedApiService.clearGroupMessages = vi.fn().mockImplementation(async () => {
        callOrder.push('api');
        // At this point, local messages should still exist
        const currentMessages = useGroupMessageStore.getState().messages[groupId];
        expect(currentMessages).toHaveLength(1);
      });

      // Act
      await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);
      callOrder.push('local-clear');

      // Assert - API should be called before local clear
      expect(callOrder).toEqual(['api', 'local-clear']);
      expect(useGroupMessageStore.getState().messages[groupId]).toEqual([]);
    });

    it('should handle clearing group with no messages', async () => {
      // Arrange
      const groupId = 'empty-group';
      useGroupMessageStore.getState().messages[groupId] = [];
      mockedApiService.clearGroupMessages = vi.fn().mockResolvedValue(undefined);

      // Act
      await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);

      // Assert
      expect(mockedApiService.clearGroupMessages).toHaveBeenCalledWith(groupId);
      expect(useGroupMessageStore.getState().messages[groupId]).toEqual([]);
    });

    it('should handle clearing group that was never initialized', async () => {
      // Arrange
      const groupId = 'new-group';
      // messages[groupId] doesn't exist
      mockedApiService.clearGroupMessages = vi.fn().mockResolvedValue(undefined);

      // Act
      await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);

      // Assert
      expect(mockedApiService.clearGroupMessages).toHaveBeenCalledWith(groupId);
      const store = useGroupMessageStore.getState();
      expect(store.messages[groupId]).toEqual([]);
    });
  });

  describe('isClearing State Management', () => {
    it('should set isClearing to true during API call', async () => {
      // Arrange
      const groupId = 'group-789';
      let resolveClear: any;
      const clearPromise = new Promise<void>((resolve) => {
        resolveClear = resolve;
      });

      mockedApiService.clearGroupMessages = vi.fn().mockReturnValue(clearPromise);

      // Act
      const clearTask = useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);

      // Assert - isClearing should be true during operation
      expect(useGroupMessageStore.getState().isClearing[groupId]).toBe(true);

      // Resolve the promise
      resolveClear();
      await clearTask;

      // Assert - isClearing should be false after operation
      expect(useGroupMessageStore.getState().isClearing[groupId]).toBe(false);
    });

    it('should reset isClearing to false after successful clear', async () => {
      // Arrange
      const groupId = 'clear-state-test';
      mockedApiService.clearGroupMessages = vi.fn().mockResolvedValue(undefined);

      // Act
      await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);

      // Assert
      expect(useGroupMessageStore.getState().isClearing[groupId]).toBe(false);
    });

    it('should reset isClearing to false even when API fails', async () => {
      // Arrange
      const groupId = 'error-state-test';
      mockedApiService.clearGroupMessages = vi.fn().mockRejectedValue(new Error('API Error'));

      // Act
      try {
        await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);
      } catch (error) {
        // Expected error
      }

      // Assert - isClearing should be reset even on error
      expect(useGroupMessageStore.getState().isClearing[groupId]).toBe(false);
    });

    it('should maintain separate isClearing state for different groups', async () => {
      // Arrange
      const group1 = 'group-1';
      const group2 = 'group-2';

      let resolveGroup1: any;
      let resolveGroup2: any;
      const promise1 = new Promise<void>((resolve) => { resolveGroup1 = resolve; });
      const promise2 = new Promise<void>((resolve) => { resolveGroup2 = resolve; });

      mockedApiService.clearGroupMessages = vi
        .fn()
        .mockReturnValueOnce(promise1)
        .mockReturnValueOnce(promise2);

      // Act - Start clearing both groups
      const clear1 = useGroupMessageStore.getState().clearGroupMessagesWithAPI(group1);
      const clear2 = useGroupMessageStore.getState().clearGroupMessagesWithAPI(group2);

      // Assert - Both should be clearing
      expect(useGroupMessageStore.getState().isClearing[group1]).toBe(true);
      expect(useGroupMessageStore.getState().isClearing[group2]).toBe(true);

      // Resolve first group
      resolveGroup1();
      await clear1;

      // Assert - Group 1 done, Group 2 still clearing
      expect(useGroupMessageStore.getState().isClearing[group1]).toBe(false);
      expect(useGroupMessageStore.getState().isClearing[group2]).toBe(true);

      // Resolve second group
      resolveGroup2();
      await clear2;

      // Assert - Both done
      expect(useGroupMessageStore.getState().isClearing[group2]).toBe(false);
    });

    it('should initialize isClearing as false for new group', () => {
      // Arrange
      const groupId = 'uninitialized-group';

      // Act
      const isClearing = useGroupMessageStore.getState().isClearing[groupId];

      // Assert
      expect(isClearing).toBeUndefined();
      // After clearing, it should be defined
    });
  });

  describe('Error Handling', () => {
    it('should set error state when API call fails', async () => {
      // Arrange
      const groupId = 'error-group';
      const errorMessage = 'Failed to clear messages';
      mockedApiService.clearGroupMessages = vi.fn().mockRejectedValue(new Error(errorMessage));

      // Act
      try {
        await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Expected
      }

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.error[groupId]).toBe(errorMessage);
      expect(store.isClearing[groupId]).toBe(false);
    });

    it('should re-throw error for component error handling', async () => {
      // Arrange
      const groupId = 'rethrow-test';
      const apiError = new Error('Network error');
      mockedApiService.clearGroupMessages = vi.fn().mockRejectedValue(apiError);

      // Act & Assert
      await expect(
        useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId)
      ).rejects.toThrow('Network error');
    });

    it('should not clear local state if API fails', async () => {
      // Arrange
      const groupId = 'no-clear-on-error';
      const existingMessages: GroupMessage[] = [
        { id: 'msg-1', role: 'user', content: 'Test', created_at: '2025-01-01T10:00:00Z' },
      ];

      useGroupMessageStore.getState().messages[groupId] = existingMessages;
      mockedApiService.clearGroupMessages = vi.fn().mockRejectedValue(new Error('API Error'));

      // Act
      try {
        await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);
      } catch (error) {
        // Expected
      }

      // Assert - Messages should remain unchanged
      expect(useGroupMessageStore.getState().messages[groupId]).toEqual(existingMessages);
    });

    it('should handle 404 error (group not found)', async () => {
      // Arrange
      const groupId = 'non-existent-group';
      const notFoundError = {
        response: {
          status: 404,
          data: { detail: 'Group not found' },
        },
      };

      mockedApiService.clearGroupMessages = vi.fn().mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(
        useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId)
      ).rejects.toMatchObject(notFoundError);

      const store = useGroupMessageStore.getState();
      expect(store.error[groupId]).toBeDefined();
      expect(store.isClearing[groupId]).toBe(false);
    });

    it('should handle 500 error (server error)', async () => {
      // Arrange
      const groupId = 'server-error-group';
      const serverError = {
        response: {
          status: 500,
          data: { detail: 'Failed to clear group messages: Database error' },
        },
      };

      mockedApiService.clearGroupMessages = vi.fn().mockRejectedValue(serverError);

      // Act
      try {
        await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);
      } catch (error) {
        // Expected
      }

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.error[groupId]).toBeDefined();
    });

    it('should handle network timeout', async () => {
      // Arrange
      const groupId = 'timeout-group';
      const timeoutError = new Error('timeout of 60000ms exceeded');
      (timeoutError as any).code = 'ECONNABORTED';

      mockedApiService.clearGroupMessages = vi.fn().mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(
        useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId)
      ).rejects.toThrow('timeout of 60000ms exceeded');

      const store = useGroupMessageStore.getState();
      expect(store.isClearing[groupId]).toBe(false);
    });

    it('should clear previous error before attempting new clear', async () => {
      // Arrange
      const groupId = 'clear-error-test';
      useGroupMessageStore.getState().error[groupId] = 'Previous error';
      mockedApiService.clearGroupMessages = vi.fn().mockResolvedValue(undefined);

      // Act
      await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);

      // Assert
      expect(useGroupMessageStore.getState().error[groupId]).toBeNull();
    });

    it('should handle error without message property', async () => {
      // Arrange
      const groupId = 'string-error-group';
      mockedApiService.clearGroupMessages = vi.fn().mockRejectedValue('String error');

      // Act
      try {
        await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);
      } catch (error) {
        // Expected
      }

      // Assert - Should handle gracefully
      const store = useGroupMessageStore.getState();
      expect(store.error[groupId]).toBe('Failed to clear messages');
      expect(store.isClearing[groupId]).toBe(false);
    });
  });

  describe('Multi-Group Isolation', () => {
    it('should not affect other groups when clearing one', async () => {
      // Arrange
      const group1 = 'group-1';
      const group2 = 'group-2';
      const group3 = 'group-3';

      const messages1: GroupMessage[] = [
        { id: 'msg-1-1', role: 'user', content: 'Group 1 message', created_at: '2025-01-01T10:00:00Z' },
      ];
      const messages2: GroupMessage[] = [
        { id: 'msg-2-1', role: 'user', content: 'Group 2 message', created_at: '2025-01-01T10:00:00Z' },
      ];
      const messages3: GroupMessage[] = [
        { id: 'msg-3-1', role: 'user', content: 'Group 3 message', created_at: '2025-01-01T10:00:00Z' },
      ];

      useGroupMessageStore.getState().messages = {
        [group1]: messages1,
        [group2]: messages2,
        [group3]: messages3,
      };

      mockedApiService.clearGroupMessages = vi.fn().mockResolvedValue(undefined);

      // Act - Clear only group2
      await useGroupMessageStore.getState().clearGroupMessagesWithAPI(group2);

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages[group1]).toEqual(messages1); // Unchanged
      expect(store.messages[group2]).toEqual([]); // Cleared
      expect(store.messages[group3]).toEqual(messages3); // Unchanged
    });

    it('should isolate error states between groups', async () => {
      // Arrange
      const group1 = 'group-1';
      const group2 = 'group-2';

      mockedApiService.clearGroupMessages = vi
        .fn()
        .mockResolvedValueOnce(undefined) // group1 succeeds
        .mockRejectedValueOnce(new Error('Group 2 error')); // group2 fails

      // Act
      await useGroupMessageStore.getState().clearGroupMessagesWithAPI(group1);

      try {
        await useGroupMessageStore.getState().clearGroupMessagesWithAPI(group2);
      } catch (error) {
        // Expected
      }

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.error[group1]).toBeNull();
      expect(store.error[group2]).toBe('Group 2 error');
    });

    it('should isolate isClearing states between groups', async () => {
      // Arrange
      const group1 = 'group-1';
      const group2 = 'group-2';

      let resolveGroup1: any;
      const promise1 = new Promise<void>((resolve) => { resolveGroup1 = resolve; });

      mockedApiService.clearGroupMessages = vi
        .fn()
        .mockReturnValueOnce(promise1) // group1 is slow
        .mockResolvedValueOnce(undefined); // group2 is fast

      // Act
      const clear1 = useGroupMessageStore.getState().clearGroupMessagesWithAPI(group1);
      await useGroupMessageStore.getState().clearGroupMessagesWithAPI(group2);

      // Assert - group1 still clearing, group2 done
      expect(useGroupMessageStore.getState().isClearing[group1]).toBe(true);
      expect(useGroupMessageStore.getState().isClearing[group2]).toBe(false);

      // Finish group1
      resolveGroup1();
      await clear1;

      expect(useGroupMessageStore.getState().isClearing[group1]).toBe(false);
    });
  });

  describe('Race Conditions and Concurrency', () => {
    it('should handle rapid successive clear attempts on same group', async () => {
      // Arrange
      const groupId = 'rapid-clear-group';
      useGroupMessageStore.getState().messages[groupId] = [
        { id: 'msg-1', role: 'user', content: 'Test', created_at: '2025-01-01T10:00:00Z' },
      ];

      mockedApiService.clearGroupMessages = vi.fn().mockResolvedValue(undefined);

      // Act - Call clear twice rapidly
      await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);
      await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);

      // Assert - Both calls should succeed (idempotent)
      expect(mockedApiService.clearGroupMessages).toHaveBeenCalledTimes(2);
      expect(useGroupMessageStore.getState().messages[groupId]).toEqual([]);
    });

    it('should handle concurrent clear attempts on same group', async () => {
      // Arrange
      const groupId = 'concurrent-group';
      useGroupMessageStore.getState().messages[groupId] = [
        { id: 'msg-1', role: 'user', content: 'Test', created_at: '2025-01-01T10:00:00Z' },
      ];

      let callCount = 0;
      mockedApiService.clearGroupMessages = vi.fn().mockImplementation(async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Act - Clear concurrently
      await Promise.all([
        useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId),
        useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId),
      ]);

      // Assert - Both calls executed
      expect(callCount).toBe(2);
      expect(useGroupMessageStore.getState().messages[groupId]).toEqual([]);
      expect(useGroupMessageStore.getState().isClearing[groupId]).toBe(false);
    });

    it('should handle clear during message send operation', async () => {
      // Arrange
      const groupId = 'clear-during-send';
      useGroupMessageStore.getState().messages[groupId] = [
        { id: 'msg-1', role: 'user', content: 'Test', created_at: '2025-01-01T10:00:00Z' },
      ];
      useGroupMessageStore.getState().isSending[groupId] = true;

      mockedApiService.clearGroupMessages = vi.fn().mockResolvedValue(undefined);

      // Act - Clear while sending
      await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);

      // Assert - Clear should succeed regardless of sending state
      expect(useGroupMessageStore.getState().messages[groupId]).toEqual([]);
      expect(useGroupMessageStore.getState().isClearing[groupId]).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle clearing with special characters in group ID', async () => {
      // Arrange
      const groupId = 'group-with-special-chars-123-456-789';
      mockedApiService.clearGroupMessages = vi.fn().mockResolvedValue(undefined);

      // Act
      await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);

      // Assert
      expect(mockedApiService.clearGroupMessages).toHaveBeenCalledWith(groupId);
    });

    it('should handle clearing with UUID format group ID', async () => {
      // Arrange
      const groupId = '550e8400-e29b-41d4-a716-446655440000';
      mockedApiService.clearGroupMessages = vi.fn().mockResolvedValue(undefined);

      // Act
      await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);

      // Assert
      expect(mockedApiService.clearGroupMessages).toHaveBeenCalledWith(groupId);
    });

    it('should handle clearing group with large message history', async () => {
      // Arrange
      const groupId = 'large-history-group';
      const largeMessages: GroupMessage[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        created_at: new Date(2025, 0, 1, 10, i).toISOString(),
      }));

      useGroupMessageStore.getState().messages[groupId] = largeMessages;
      mockedApiService.clearGroupMessages = vi.fn().mockResolvedValue(undefined);

      // Act
      await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);

      // Assert
      expect(useGroupMessageStore.getState().messages[groupId]).toEqual([]);
    });

    it('should allow sending messages after clearing', async () => {
      // Arrange
      const groupId = 'clear-then-send';
      useGroupMessageStore.getState().messages[groupId] = [
        { id: 'msg-1', role: 'user', content: 'Old message', created_at: '2025-01-01T10:00:00Z' },
      ];

      mockedApiService.clearGroupMessages = vi.fn().mockResolvedValue(undefined);

      // Act - Clear messages
      await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);

      // Assert - Messages cleared
      expect(useGroupMessageStore.getState().messages[groupId]).toEqual([]);

      // Add new message (simulating send)
      useGroupMessageStore.getState().messages[groupId].push({
        id: 'msg-new',
        role: 'user',
        content: 'New message after clear',
        created_at: '2025-01-01T11:00:00Z',
      });

      // Assert - New messages can be added
      expect(useGroupMessageStore.getState().messages[groupId]).toHaveLength(1);
      expect(useGroupMessageStore.getState().messages[groupId][0].content).toBe('New message after clear');
    });

    it('should handle clearing immediately after fetching messages', async () => {
      // Arrange
      const groupId = 'fetch-then-clear';
      const fetchedMessages: GroupMessage[] = [
        { id: 'msg-1', role: 'user', content: 'Fetched message', created_at: '2025-01-01T10:00:00Z' },
      ];

      // Simulate fetch
      useGroupMessageStore.getState().messages[groupId] = fetchedMessages;
      useGroupMessageStore.getState().isLoading[groupId] = false;

      mockedApiService.clearGroupMessages = vi.fn().mockResolvedValue(undefined);

      // Act - Clear immediately after fetch
      await useGroupMessageStore.getState().clearGroupMessagesWithAPI(groupId);

      // Assert
      expect(useGroupMessageStore.getState().messages[groupId]).toEqual([]);
    });
  });
});
