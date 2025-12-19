/**
 * Unit tests for useGroupMessages hook.
 *
 * Test Coverage:
 * - Initial state and configuration
 * - Auto-loading on mount when autoLoad=true
 * - No auto-load when autoLoad=false
 * - Message loading and pagination
 * - Loading states (isLoadingMessages, isSending)
 * - Error handling and error states
 * - hasMore pagination flag
 * - loadMore functionality
 * - reloadMessages functionality
 * - clearMessages functionality
 * - Group ID changes and cleanup
 * - Edge cases (null groupId, API errors, empty responses)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGroupMessages } from '../../hooks/useGroupMessages';
import * as groupMessageStore from '../../store/groupMessageStore';

// Mock the group message store
vi.mock('../../store/groupMessageStore', () => ({
  useGroupMessageStore: vi.fn(),
}));

describe('useGroupMessages Hook', () => {
  let mockStore: any;

  beforeEach(() => {
    // Reset mock implementation
    mockStore = {
      messages: {},
      isLoading: {},
      isSending: {},
      error: {},
      fetchGroupMessages: vi.fn(),
      clearGroupMessages: vi.fn(),
    };

    vi.mocked(groupMessageStore.useGroupMessageStore).mockReturnValue(mockStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return empty messages array when groupId is null', () => {
      const { result } = renderHook(() => useGroupMessages(null));

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoadingMessages).toBe(false);
      expect(result.current.isSending).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.hasMore).toBe(false);
    });

    it('should return empty messages array when group has no messages', () => {
      mockStore.messages = {};

      const { result } = renderHook(() => useGroupMessages('group-1'));

      expect(result.current.messages).toEqual([]);
    });

    it('should return messages for specific group', () => {
      const groupMessages = [
        { id: 'msg-1', role: 'user', content: 'Hello', created_at: '2025-01-01T00:00:00Z' },
        { id: 'msg-2', role: 'assistant', content: 'Hi there', created_at: '2025-01-01T00:00:01Z' },
      ];

      mockStore.messages = { 'group-1': groupMessages };

      const { result } = renderHook(() => useGroupMessages('group-1'));

      expect(result.current.messages).toEqual(groupMessages);
    });

    it('should use default configuration when no options provided', () => {
      const { result } = renderHook(() => useGroupMessages('group-1'));

      // Default values should be applied internally
      expect(result.current).toBeDefined();
    });

    it('should apply custom configuration options', () => {
      const { result } = renderHook(() =>
        useGroupMessages('group-1', {
          pageSize: 100,
          autoLoad: false,
          enablePagination: true,
        })
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('Auto-loading Messages', () => {
    it('should auto-load messages on mount when autoLoad=true (default)', async () => {
      mockStore.fetchGroupMessages.mockResolvedValue(undefined);

      renderHook(() => useGroupMessages('group-1'));

      await waitFor(() => {
        expect(mockStore.fetchGroupMessages).toHaveBeenCalledWith('group-1', 50, 0);
      });
    });

    it('should not auto-load when autoLoad=false', async () => {
      mockStore.fetchGroupMessages.mockResolvedValue(undefined);

      renderHook(() => useGroupMessages('group-1', { autoLoad: false }));

      // Wait a bit to ensure it doesn't load
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockStore.fetchGroupMessages).not.toHaveBeenCalled();
    });

    it('should reload messages when groupId changes', async () => {
      mockStore.fetchGroupMessages.mockResolvedValue(undefined);

      const { rerender } = renderHook(
        ({ groupId }) => useGroupMessages(groupId),
        { initialProps: { groupId: 'group-1' } }
      );

      await waitFor(() => {
        expect(mockStore.fetchGroupMessages).toHaveBeenCalledWith('group-1', 50, 0);
      });

      vi.clearAllMocks();

      // Change groupId
      rerender({ groupId: 'group-2' });

      await waitFor(() => {
        expect(mockStore.fetchGroupMessages).toHaveBeenCalledWith('group-2', 50, 0);
      });
    });

    it('should use custom pageSize when loading', async () => {
      mockStore.fetchGroupMessages.mockResolvedValue(undefined);

      renderHook(() => useGroupMessages('group-1', { pageSize: 100 }));

      await waitFor(() => {
        expect(mockStore.fetchGroupMessages).toHaveBeenCalledWith('group-1', 100, 0);
      });
    });

    it('should not load when groupId is null', async () => {
      mockStore.fetchGroupMessages.mockResolvedValue(undefined);

      renderHook(() => useGroupMessages(null));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockStore.fetchGroupMessages).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should return loading state from store', () => {
      mockStore.isLoading = { 'group-1': true };

      const { result } = renderHook(() => useGroupMessages('group-1', { autoLoad: false }));

      expect(result.current.isLoadingMessages).toBe(true);
    });

    it('should return sending state from store', () => {
      mockStore.isSending = { 'group-1': true };

      const { result } = renderHook(() => useGroupMessages('group-1', { autoLoad: false }));

      expect(result.current.isSending).toBe(true);
    });

    it('should return false for loading when group not in state', () => {
      mockStore.isLoading = { 'other-group': true };

      const { result } = renderHook(() => useGroupMessages('group-1', { autoLoad: false }));

      expect(result.current.isLoadingMessages).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should return error state from store', () => {
      mockStore.error = { 'group-1': 'Failed to load messages' };

      const { result } = renderHook(() => useGroupMessages('group-1', { autoLoad: false }));

      expect(result.current.error).toBe('Failed to load messages');
    });

    it('should return null for error when group not in state', () => {
      mockStore.error = { 'other-group': 'Some error' };

      const { result } = renderHook(() => useGroupMessages('group-1', { autoLoad: false }));

      expect(result.current.error).toBe(null);
    });

    it('should handle API errors during auto-load', async () => {
      mockStore.fetchGroupMessages.mockRejectedValue(new Error('Network error'));

      renderHook(() => useGroupMessages('group-1'));

      await waitFor(() => {
        expect(mockStore.fetchGroupMessages).toHaveBeenCalled();
      });

      // Error should be handled by store, hook should not throw
    });
  });

  describe('Pagination', () => {
    it('should set hasMore to true when loaded messages equals pageSize', async () => {
      const messages = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user',
        content: `Message ${i}`,
        created_at: new Date().toISOString(),
      }));

      mockStore.messages = { 'group-1': messages };
      mockStore.fetchGroupMessages.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGroupMessages('group-1', { pageSize: 50 }));

      await waitFor(() => {
        expect(result.current.hasMore).toBe(true);
      });
    });

    it('should set hasMore to false when loaded messages less than pageSize', async () => {
      const messages = Array.from({ length: 25 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user',
        content: `Message ${i}`,
        created_at: new Date().toISOString(),
      }));

      mockStore.messages = { 'group-1': messages };
      mockStore.fetchGroupMessages.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGroupMessages('group-1', { pageSize: 50 }));

      await waitFor(() => {
        expect(result.current.hasMore).toBe(false);
      });
    });

    it('should not load more when pagination disabled', async () => {
      mockStore.fetchGroupMessages.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useGroupMessages('group-1', { enablePagination: false, autoLoad: false })
      );

      await act(async () => {
        await result.current.loadMore();
      });

      expect(mockStore.fetchGroupMessages).not.toHaveBeenCalled();
    });

    it('should not load more when already loading', async () => {
      mockStore.isLoading = { 'group-1': true };
      mockStore.fetchGroupMessages.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useGroupMessages('group-1', { enablePagination: true, autoLoad: false })
      );

      // Force hasMore to true for test
      act(() => {
        result.current.hasMore = true;
      });

      await act(async () => {
        await result.current.loadMore();
      });

      expect(mockStore.fetchGroupMessages).not.toHaveBeenCalled();
    });

    it('should not load more when hasMore is false', async () => {
      mockStore.fetchGroupMessages.mockResolvedValue(undefined);
      mockStore.messages = { 'group-1': [{ id: 'msg-1', role: 'user', content: 'Test', created_at: '' }] };

      const { result } = renderHook(() =>
        useGroupMessages('group-1', { enablePagination: true })
      );

      await waitFor(() => {
        expect(result.current.hasMore).toBe(false);
      });

      vi.clearAllMocks();

      await act(async () => {
        await result.current.loadMore();
      });

      // Should not call fetch again since hasMore is false
      expect(mockStore.fetchGroupMessages).not.toHaveBeenCalled();
    });

    it('should load next page with correct offset', async () => {
      const initialMessages = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user',
        content: `Message ${i}`,
        created_at: new Date().toISOString(),
      }));

      mockStore.messages = { 'group-1': initialMessages };
      mockStore.fetchGroupMessages.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useGroupMessages('group-1', { enablePagination: true, pageSize: 50 })
      );

      await waitFor(() => {
        expect(result.current.hasMore).toBe(true);
      });

      vi.clearAllMocks();

      await act(async () => {
        await result.current.loadMore();
      });

      expect(mockStore.fetchGroupMessages).toHaveBeenCalledWith('group-1', 50, 50);
    });
  });

  describe('reloadMessages', () => {
    it('should reload messages from scratch', async () => {
      mockStore.fetchGroupMessages.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGroupMessages('group-1', { autoLoad: false }));

      await act(async () => {
        await result.current.reloadMessages();
      });

      expect(mockStore.fetchGroupMessages).toHaveBeenCalledWith('group-1', 50, 0);
    });

    it('should reset offset and hasMore when reloading', async () => {
      const messages = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user',
        content: `Message ${i}`,
        created_at: new Date().toISOString(),
      }));

      mockStore.messages = { 'group-1': messages };
      mockStore.fetchGroupMessages.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useGroupMessages('group-1', { enablePagination: true })
      );

      await waitFor(() => {
        expect(result.current.hasMore).toBe(true);
      });

      // Load more to increase offset
      await act(async () => {
        await result.current.loadMore();
      });

      vi.clearAllMocks();

      // Reload should reset to offset 0
      await act(async () => {
        await result.current.reloadMessages();
      });

      expect(mockStore.fetchGroupMessages).toHaveBeenCalledWith('group-1', 50, 0);
    });
  });

  describe('clearMessages', () => {
    it('should clear messages for current group', async () => {
      mockStore.clearGroupMessages.mockImplementation(() => {});

      const { result } = renderHook(() => useGroupMessages('group-1', { autoLoad: false }));

      act(() => {
        result.current.clearMessages();
      });

      expect(mockStore.clearGroupMessages).toHaveBeenCalledWith('group-1');
    });

    it('should reset offset and hasMore when clearing', async () => {
      mockStore.clearGroupMessages.mockImplementation(() => {});

      const { result } = renderHook(() => useGroupMessages('group-1', { autoLoad: false }));

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.hasMore).toBe(false);
    });

    it('should not call clear when groupId is null', () => {
      mockStore.clearGroupMessages.mockImplementation(() => {});

      const { result } = renderHook(() => useGroupMessages(null));

      act(() => {
        result.current.clearMessages();
      });

      expect(mockStore.clearGroupMessages).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle switching from null to valid groupId', async () => {
      mockStore.fetchGroupMessages.mockResolvedValue(undefined);

      const { rerender } = renderHook(
        ({ groupId }) => useGroupMessages(groupId),
        { initialProps: { groupId: null as string | null } }
      );

      expect(mockStore.fetchGroupMessages).not.toHaveBeenCalled();

      rerender({ groupId: 'group-1' });

      await waitFor(() => {
        expect(mockStore.fetchGroupMessages).toHaveBeenCalledWith('group-1', 50, 0);
      });
    });

    it('should handle switching from valid groupId to null', async () => {
      mockStore.fetchGroupMessages.mockResolvedValue(undefined);

      const { rerender, result } = renderHook(
        ({ groupId }) => useGroupMessages(groupId),
        { initialProps: { groupId: 'group-1' as string | null } }
      );

      await waitFor(() => {
        expect(mockStore.fetchGroupMessages).toHaveBeenCalled();
      });

      rerender({ groupId: null });

      expect(result.current.messages).toEqual([]);
    });

    it('should handle empty message arrays from store', () => {
      mockStore.messages = { 'group-1': [] };

      const { result } = renderHook(() => useGroupMessages('group-1', { autoLoad: false }));

      expect(result.current.messages).toEqual([]);
    });

    it('should handle concurrent load operations', async () => {
      mockStore.fetchGroupMessages.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGroupMessages('group-1', { autoLoad: false }));

      await act(async () => {
        await Promise.all([result.current.reloadMessages(), result.current.reloadMessages()]);
      });

      // Should handle gracefully without errors
      expect(mockStore.fetchGroupMessages).toHaveBeenCalled();
    });

    it('should maintain state isolation between different group IDs', () => {
      mockStore.messages = {
        'group-1': [{ id: 'msg-1', role: 'user', content: 'Group 1', created_at: '' }],
        'group-2': [{ id: 'msg-2', role: 'user', content: 'Group 2', created_at: '' }],
      };
      mockStore.isLoading = { 'group-1': true, 'group-2': false };
      mockStore.error = { 'group-1': 'Error 1', 'group-2': null };

      const { result: result1 } = renderHook(() =>
        useGroupMessages('group-1', { autoLoad: false })
      );
      const { result: result2 } = renderHook(() =>
        useGroupMessages('group-2', { autoLoad: false })
      );

      expect(result1.current.messages).toHaveLength(1);
      expect(result1.current.messages[0].content).toBe('Group 1');
      expect(result1.current.isLoadingMessages).toBe(true);
      expect(result1.current.error).toBe('Error 1');

      expect(result2.current.messages).toHaveLength(1);
      expect(result2.current.messages[0].content).toBe('Group 2');
      expect(result2.current.isLoadingMessages).toBe(false);
      expect(result2.current.error).toBe(null);
    });
  });
});
