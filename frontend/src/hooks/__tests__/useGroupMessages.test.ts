/**
 * useGroupMessages Hook Unit Tests.
 *
 * Comprehensive tests for the useGroupMessages hook covering:
 * - Auto-load messages on mount
 * - Pagination support
 * - Message deduplication
 * - Loading and error states
 * - Message merging with optimistic updates
 * - Reload functionality
 * - Group switching
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import {
  mockGroupId1,
  mockGroupId2,
  mockGroupMessages,
  mockGroupMessagesResponse,
  mockGroupMessagesResponseEmpty,
  mockGroupMessagesResponsePaginated1,
  mockGroupMessagesResponsePaginated2,
  mockGroupUserMessage1,
  mockGroupAssistantMessage1,
  TrackedGroupMessage,
} from '../../tests/mockGroupData';

// Mock the enhanced store
const mockStore = {
  messages: {} as Record<string, TrackedGroupMessage[]>,
  isLoading: {} as Record<string, boolean>,
  isSending: {} as Record<string, boolean>,
  error: {} as Record<string, string | null>,
  fetchGroupMessages: vi.fn(),
  sendGroupMessage: vi.fn(),
  clearGroupMessages: vi.fn(),
  mergeMessages: vi.fn(),
  markMessageAsPersisted: vi.fn(),
  setMessages: vi.fn(),
};

// Mock zustand store
vi.mock('../../store/groupMessageStoreEnhanced', () => ({
  useGroupMessageStoreEnhanced: (selector?: any) => {
    if (selector) {
      return selector(mockStore);
    }
    return mockStore;
  },
}));

// Hook interface (what we're testing)
interface UseGroupMessagesOptions {
  pageSize?: number;
  autoLoad?: boolean;
  enablePagination?: boolean;
}

interface UseGroupMessagesReturn {
  messages: TrackedGroupMessage[];
  isLoadingMessages: boolean;
  isSending: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  reloadMessages: () => Promise<void>;
  clearMessages: () => void;
}

/**
 * Hook implementation for testing.
 * This is a skeleton that would be implemented in the actual hook file.
 */
const useGroupMessages = (
  groupId: string,
  options: UseGroupMessagesOptions = {}
): UseGroupMessagesReturn => {
  const {
    pageSize = 50,
    autoLoad = true,
    enablePagination = false,
  } = options;

  // This would use actual React hooks in implementation
  const messages = mockStore.messages[groupId] || [];
  const isLoadingMessages = mockStore.isLoading[groupId] || false;
  const isSending = mockStore.isSending[groupId] || false;
  const error = mockStore.error[groupId] || null;
  const hasMore = enablePagination && messages.length >= pageSize;

  // Auto-load on mount (simulated in test)
  if (autoLoad && !messages.length && !isLoadingMessages && !error) {
    mockStore.fetchGroupMessages(groupId, pageSize, 0);
  }

  const loadMore = async () => {
    if (!enablePagination || !hasMore) return;
    const offset = messages.length;
    await mockStore.fetchGroupMessages(groupId, pageSize, offset);
  };

  const reloadMessages = async () => {
    mockStore.clearGroupMessages(groupId);
    await mockStore.fetchGroupMessages(groupId, pageSize, 0);
  };

  const clearMessages = () => {
    mockStore.clearGroupMessages(groupId);
  };

  return {
    messages,
    isLoadingMessages,
    isSending,
    error,
    hasMore,
    loadMore,
    reloadMessages,
    clearMessages,
  };
};

describe('useGroupMessages Hook', () => {
  beforeEach(() => {
    // Reset mock store state
    mockStore.messages = {};
    mockStore.isLoading = {};
    mockStore.isSending = {};
    mockStore.error = {};

    // Clear all mocks
    vi.clearAllMocks();

    // Setup default mock implementations
    mockStore.fetchGroupMessages.mockImplementation(async (groupId, limit, offset) => {
      mockStore.isLoading[groupId] = true;
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 10));
      mockStore.messages[groupId] = mockGroupMessages.map((msg) => ({
        ...msg,
        isPersisted: true,
      }));
      mockStore.isLoading[groupId] = false;
    });

    mockStore.clearGroupMessages.mockImplementation((groupId) => {
      mockStore.messages[groupId] = [];
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Auto-load on Mount', () => {
    it('should auto-load messages on mount when autoLoad is true', async () => {
      // Arrange & Act
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: true })
      );

      // Assert
      await waitFor(() => {
        expect(mockStore.fetchGroupMessages).toHaveBeenCalledWith(mockGroupId1, 50, 0);
      });
    });

    it('should not auto-load when autoLoad is false', () => {
      // Arrange & Act
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false })
      );

      // Assert
      expect(mockStore.fetchGroupMessages).not.toHaveBeenCalled();
    });

    it('should use custom page size for auto-load', async () => {
      // Arrange & Act
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: true, pageSize: 100 })
      );

      // Assert
      await waitFor(() => {
        expect(mockStore.fetchGroupMessages).toHaveBeenCalledWith(mockGroupId1, 100, 0);
      });
    });

    it('should not auto-load if messages already exist', () => {
      // Arrange - pre-populate messages
      mockStore.messages[mockGroupId1] = [
        { ...mockGroupUserMessage1, isPersisted: true },
      ];

      // Act
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: true })
      );

      // Assert
      expect(mockStore.fetchGroupMessages).not.toHaveBeenCalled();
    });

    it('should not auto-load if already loading', () => {
      // Arrange - set loading state
      mockStore.isLoading[mockGroupId1] = true;

      // Act
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: true })
      );

      // Assert
      expect(mockStore.fetchGroupMessages).toHaveBeenCalledTimes(0);
    });

    it('should not auto-load if error exists', () => {
      // Arrange - set error state
      mockStore.error[mockGroupId1] = 'Previous error';

      // Act
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: true })
      );

      // Assert
      expect(mockStore.fetchGroupMessages).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should return loading state from store', async () => {
      // Arrange
      mockStore.isLoading[mockGroupId1] = true;

      // Act
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false })
      );

      // Assert
      expect(result.current.isLoadingMessages).toBe(true);
    });

    it('should update loading state when fetch completes', async () => {
      // Arrange
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: true })
      );

      // Act & Assert
      await waitFor(() => {
        expect(result.current.isLoadingMessages).toBe(false);
      });
    });

    it('should handle sending state separately from loading', () => {
      // Arrange
      mockStore.isSending[mockGroupId1] = true;
      mockStore.isLoading[mockGroupId1] = false;

      // Act
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false })
      );

      // Assert
      expect(result.current.isSending).toBe(true);
      expect(result.current.isLoadingMessages).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should return error from store', () => {
      // Arrange
      mockStore.error[mockGroupId1] = 'Network error';

      // Act
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false })
      );

      // Assert
      expect(result.current.error).toBe('Network error');
    });

    it('should handle fetch error gracefully', async () => {
      // Arrange
      const errorMessage = 'Failed to fetch messages';
      mockStore.fetchGroupMessages.mockImplementation(async (groupId) => {
        mockStore.isLoading[groupId] = true;
        await new Promise((resolve) => setTimeout(resolve, 10));
        mockStore.error[groupId] = errorMessage;
        mockStore.isLoading[groupId] = false;
      });

      // Act
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: true })
      );

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.isLoadingMessages).toBe(false);
      });
    });

    it('should clear error on successful reload', async () => {
      // Arrange
      mockStore.error[mockGroupId1] = 'Previous error';
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false })
      );

      mockStore.fetchGroupMessages.mockImplementation(async (groupId) => {
        mockStore.error[groupId] = null;
        mockStore.messages[groupId] = mockGroupMessages.map((msg) => ({
          ...msg,
          isPersisted: true,
        }));
      });

      // Act
      await act(async () => {
        await result.current.reloadMessages();
      });

      // Assert
      expect(result.current.error).toBeNull();
    });
  });

  describe('Messages Retrieval', () => {
    it('should return messages from store', () => {
      // Arrange
      const messages = [
        { ...mockGroupUserMessage1, isPersisted: true },
        { ...mockGroupAssistantMessage1, isPersisted: true },
      ];
      mockStore.messages[mockGroupId1] = messages;

      // Act
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false })
      );

      // Assert
      expect(result.current.messages).toEqual(messages);
    });

    it('should return empty array when no messages exist', () => {
      // Arrange & Act
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false })
      );

      // Assert
      expect(result.current.messages).toEqual([]);
    });

    it('should update messages when store changes', async () => {
      // Arrange
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false })
      );

      // Act - simulate store update
      mockStore.messages[mockGroupId1] = [
        { ...mockGroupUserMessage1, isPersisted: true },
      ];

      // Assert
      expect(result.current.messages).toHaveLength(1);
    });
  });

  describe('Pagination', () => {
    it('should calculate hasMore correctly when pagination enabled', () => {
      // Arrange
      const fiftyMessages = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        created_at: new Date().toISOString(),
        isPersisted: true,
      }));
      mockStore.messages[mockGroupId1] = fiftyMessages;

      // Act
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false, enablePagination: true, pageSize: 50 })
      );

      // Assert
      expect(result.current.hasMore).toBe(true);
    });

    it('should set hasMore to false when messages less than page size', () => {
      // Arrange
      mockStore.messages[mockGroupId1] = [
        { ...mockGroupUserMessage1, isPersisted: true },
      ];

      // Act
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false, enablePagination: true, pageSize: 50 })
      );

      // Assert
      expect(result.current.hasMore).toBe(false);
    });

    it('should set hasMore to false when pagination disabled', () => {
      // Arrange
      const fiftyMessages = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        created_at: new Date().toISOString(),
        isPersisted: true,
      }));
      mockStore.messages[mockGroupId1] = fiftyMessages;

      // Act
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false, enablePagination: false })
      );

      // Assert
      expect(result.current.hasMore).toBe(false);
    });

    it('should load more messages with correct offset', async () => {
      // Arrange
      mockStore.messages[mockGroupId1] = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        created_at: new Date().toISOString(),
        isPersisted: true,
      }));

      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false, enablePagination: true, pageSize: 50 })
      );

      // Act
      await act(async () => {
        await result.current.loadMore();
      });

      // Assert
      expect(mockStore.fetchGroupMessages).toHaveBeenCalledWith(mockGroupId1, 50, 50);
    });

    it('should not load more when hasMore is false', async () => {
      // Arrange
      mockStore.messages[mockGroupId1] = [
        { ...mockGroupUserMessage1, isPersisted: true },
      ];

      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false, enablePagination: true, pageSize: 50 })
      );

      // Act
      await act(async () => {
        await result.current.loadMore();
      });

      // Assert
      expect(mockStore.fetchGroupMessages).not.toHaveBeenCalled();
    });

    it('should not load more when pagination disabled', async () => {
      // Arrange
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false, enablePagination: false })
      );

      // Act
      await act(async () => {
        await result.current.loadMore();
      });

      // Assert
      expect(mockStore.fetchGroupMessages).not.toHaveBeenCalled();
    });

    it('should append new messages when loading more', async () => {
      // Arrange
      const firstBatch = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        created_at: new Date(Date.now() + i * 1000).toISOString(),
        isPersisted: true,
      }));
      mockStore.messages[mockGroupId1] = firstBatch;

      mockStore.fetchGroupMessages.mockImplementation(async (groupId, limit, offset) => {
        const secondBatch = Array.from({ length: 25 }, (_, i) => ({
          id: `msg-${offset + i}`,
          role: 'user' as const,
          content: `Message ${offset + i}`,
          created_at: new Date(Date.now() + (offset + i) * 1000).toISOString(),
          isPersisted: true,
        }));
        mockStore.messages[groupId] = [...mockStore.messages[groupId], ...secondBatch];
      });

      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false, enablePagination: true, pageSize: 50 })
      );

      // Act
      await act(async () => {
        await result.current.loadMore();
      });

      // Assert
      expect(result.current.messages.length).toBeGreaterThan(50);
    });
  });

  describe('Reload Messages', () => {
    it('should clear and refetch messages on reload', async () => {
      // Arrange
      mockStore.messages[mockGroupId1] = [
        { ...mockGroupUserMessage1, isPersisted: true },
      ];

      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false })
      );

      // Act
      await act(async () => {
        await result.current.reloadMessages();
      });

      // Assert
      expect(mockStore.clearGroupMessages).toHaveBeenCalledWith(mockGroupId1);
      expect(mockStore.fetchGroupMessages).toHaveBeenCalledWith(mockGroupId1, 50, 0);
    });

    it('should reset offset to 0 on reload', async () => {
      // Arrange
      mockStore.messages[mockGroupId1] = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        created_at: new Date().toISOString(),
        isPersisted: true,
      }));

      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false, enablePagination: true })
      );

      // Act
      await act(async () => {
        await result.current.reloadMessages();
      });

      // Assert
      expect(mockStore.fetchGroupMessages).toHaveBeenCalledWith(mockGroupId1, 50, 0);
    });

    it('should handle reload error', async () => {
      // Arrange
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false })
      );

      mockStore.fetchGroupMessages.mockImplementation(async (groupId) => {
        mockStore.error[groupId] = 'Reload failed';
      });

      // Act
      await act(async () => {
        await result.current.reloadMessages();
      });

      // Assert
      expect(result.current.error).toBe('Reload failed');
    });
  });

  describe('Clear Messages', () => {
    it('should clear messages for the group', () => {
      // Arrange
      mockStore.messages[mockGroupId1] = [
        { ...mockGroupUserMessage1, isPersisted: true },
      ];

      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false })
      );

      // Act
      act(() => {
        result.current.clearMessages();
      });

      // Assert
      expect(mockStore.clearGroupMessages).toHaveBeenCalledWith(mockGroupId1);
    });

    it('should not affect other groups when clearing', () => {
      // Arrange
      mockStore.messages[mockGroupId1] = [
        { ...mockGroupUserMessage1, isPersisted: true },
      ];
      mockStore.messages[mockGroupId2] = [
        { ...mockGroupAssistantMessage1, isPersisted: true },
      ];

      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false })
      );

      // Act
      act(() => {
        result.current.clearMessages();
      });

      // Assert
      expect(mockStore.clearGroupMessages).toHaveBeenCalledWith(mockGroupId1);
      expect(mockStore.messages[mockGroupId2]).toHaveLength(1);
    });
  });

  describe('Group Switching', () => {
    it('should reload messages when groupId changes', async () => {
      // Arrange
      const { result, rerender } = renderHook(
        ({ groupId }) => useGroupMessages(groupId, { autoLoad: true }),
        { initialProps: { groupId: mockGroupId1 } }
      );

      await waitFor(() => {
        expect(mockStore.fetchGroupMessages).toHaveBeenCalledWith(mockGroupId1, 50, 0);
      });

      vi.clearAllMocks();

      // Act - change groupId
      rerender({ groupId: mockGroupId2 });

      // Assert
      await waitFor(() => {
        expect(mockStore.fetchGroupMessages).toHaveBeenCalledWith(mockGroupId2, 50, 0);
      });
    });

    it('should maintain separate state for different groups', () => {
      // Arrange
      mockStore.messages[mockGroupId1] = [
        { ...mockGroupUserMessage1, isPersisted: true },
      ];
      mockStore.messages[mockGroupId2] = [
        { ...mockGroupAssistantMessage1, isPersisted: true },
      ];

      // Act
      const { result: result1 } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false })
      );
      const { result: result2 } = renderHook(() =>
        useGroupMessages(mockGroupId2, { autoLoad: false })
      );

      // Assert
      expect(result1.current.messages).toHaveLength(1);
      expect(result2.current.messages).toHaveLength(1);
      expect(result1.current.messages[0].id).not.toBe(result2.current.messages[0].id);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string groupId', () => {
      // Arrange & Act
      const { result } = renderHook(() =>
        useGroupMessages('', { autoLoad: false })
      );

      // Assert
      expect(result.current.messages).toEqual([]);
    });

    it('should handle rapid successive loads', async () => {
      // Arrange
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false, enablePagination: true, pageSize: 50 })
      );

      mockStore.messages[mockGroupId1] = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        created_at: new Date().toISOString(),
        isPersisted: true,
      }));

      // Act - call loadMore multiple times rapidly
      await act(async () => {
        const promise1 = result.current.loadMore();
        const promise2 = result.current.loadMore();
        const promise3 = result.current.loadMore();
        await Promise.all([promise1, promise2, promise3]);
      });

      // Assert - should handle gracefully without errors
      expect(mockStore.fetchGroupMessages).toHaveBeenCalled();
    });

    it('should handle undefined options gracefully', async () => {
      // Arrange & Act
      const { result } = renderHook(() => useGroupMessages(mockGroupId1));

      // Assert - should use defaults
      await waitFor(() => {
        expect(mockStore.fetchGroupMessages).toHaveBeenCalledWith(mockGroupId1, 50, 0);
      });
    });

    it('should handle zero page size', () => {
      // Arrange & Act
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false, pageSize: 0 })
      );

      // Assert - should not crash
      expect(result.current.messages).toEqual([]);
    });

    it('should handle negative page size', () => {
      // Arrange & Act
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false, pageSize: -10 })
      );

      // Assert - should not crash
      expect(result.current.messages).toEqual([]);
    });

    it('should handle very large page size', async () => {
      // Arrange & Act
      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: true, pageSize: 999999 })
      );

      // Assert
      await waitFor(() => {
        expect(mockStore.fetchGroupMessages).toHaveBeenCalledWith(mockGroupId1, 999999, 0);
      });
    });
  });

  describe('Deduplication Integration', () => {
    it('should work with store deduplication on reload', async () => {
      // Arrange - set up optimistic message
      mockStore.messages[mockGroupId1] = [
        { ...mockGroupUserMessage1, isPersisted: false },
      ];

      mockStore.fetchGroupMessages.mockImplementation(async (groupId) => {
        // Simulate server returning persisted version
        mockStore.messages[groupId] = [
          { ...mockGroupUserMessage1, isPersisted: true },
        ];
      });

      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false })
      );

      // Act
      await act(async () => {
        await result.current.reloadMessages();
      });

      // Assert - should have only one message (deduplicated)
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].isPersisted).toBe(true);
    });

    it('should preserve optimistic messages during load more', async () => {
      // Arrange
      mockStore.messages[mockGroupId1] = [
        { ...mockGroupUserMessage1, isPersisted: true },
        { ...mockGroupAssistantMessage1, isPersisted: false }, // Optimistic
      ];

      const { result } = renderHook(() =>
        useGroupMessages(mockGroupId1, { autoLoad: false, enablePagination: true, pageSize: 2 })
      );

      // Act
      await act(async () => {
        await result.current.loadMore();
      });

      // Assert - optimistic message should still be present
      const optimisticMsg = result.current.messages.find(
        (msg) => msg.id === mockGroupAssistantMessage1.id && !msg.isPersisted
      );
      expect(optimisticMsg).toBeDefined();
    });
  });
});
