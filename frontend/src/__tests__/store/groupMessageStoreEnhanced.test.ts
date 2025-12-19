/**
 * Unit tests for groupMessageStoreEnhanced.
 *
 * Test Coverage:
 * - Initial state
 * - fetchGroupMessages action (success, error, loading states)
 * - sendGroupMessage action (success, error, optimistic updates)
 * - mergeMessages action (deduplication logic)
 * - markMessageAsPersisted action
 * - clearGroupMessages action
 * - Message deduplication (prefer persisted over optimistic)
 * - isPersisted flag handling
 * - Chronological ordering
 * - Per-group state isolation
 * - Edge cases (empty arrays, concurrent operations, API errors)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGroupMessageStoreEnhanced } from '../../store/groupMessageStoreEnhanced';
import type { GroupMessage, CharacterResponse } from '../../types/group';

// Mock API service
vi.mock('../../services/api', () => ({
  apiService: {
    getGroupMessages: vi.fn(),
    sendGroupMessage: vi.fn(),
  },
}));

describe('groupMessageStoreEnhanced', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useGroupMessageStoreEnhanced.setState({
        messages: {},
        isLoading: {},
        isSending: {},
        error: {},
      });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have empty messages object', () => {
      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      expect(result.current.messages).toEqual({});
    });

    it('should have empty loading states', () => {
      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      expect(result.current.isLoading).toEqual({});
      expect(result.current.isSending).toEqual({});
      expect(result.current.error).toEqual({});
    });
  });

  describe('fetchGroupMessages', () => {
    const mockMessages: GroupMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        created_at: '2025-01-01T00:00:01Z',
        character_id: 'char-1',
        character_name: 'Hegel',
      },
    ];

    it('should fetch messages successfully', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.getGroupMessages).mockResolvedValue({
        messages: mockMessages,
      });

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchGroupMessages('group-1');
      });

      expect(result.current.messages['group-1']).toHaveLength(2);
      expect(result.current.messages['group-1'][0]).toMatchObject({
        ...mockMessages[0],
        isPersisted: true,
      });
      expect(result.current.isLoading['group-1']).toBe(false);
    });

    it('should set loading state during fetch', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.getGroupMessages).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ messages: mockMessages }), 100))
      );

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      const promise = act(async () => {
        await result.current.fetchGroupMessages('group-1');
      });

      await waitFor(() => {
        expect(result.current.isLoading['group-1']).toBe(true);
      });

      await promise;

      expect(result.current.isLoading['group-1']).toBe(false);
    });

    it('should handle fetch errors', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.getGroupMessages).mockRejectedValue(
        new Error('Failed to fetch messages')
      );

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchGroupMessages('group-1');
      });

      expect(result.current.error['group-1']).toBe('Failed to fetch messages');
      expect(result.current.isLoading['group-1']).toBe(false);
      expect(result.current.messages['group-1']).toBeUndefined();
    });

    it('should mark all loaded messages as persisted', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.getGroupMessages).mockResolvedValue({
        messages: mockMessages,
      });

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchGroupMessages('group-1');
      });

      result.current.messages['group-1'].forEach((msg) => {
        expect(msg.isPersisted).toBe(true);
      });
    });

    it('should use default limit and offset', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.getGroupMessages).mockResolvedValue({
        messages: mockMessages,
      });

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchGroupMessages('group-1');
      });

      expect(apiService.getGroupMessages).toHaveBeenCalledWith('group-1', 50, 0);
    });

    it('should use custom limit and offset', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.getGroupMessages).mockResolvedValue({
        messages: mockMessages,
      });

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchGroupMessages('group-1', 100, 25);
      });

      expect(apiService.getGroupMessages).toHaveBeenCalledWith('group-1', 100, 25);
    });

    it('should merge loaded messages with existing messages', async () => {
      const { apiService } = await import('../../services/api');
      const existingMessages = [
        {
          id: 'msg-old',
          role: 'user' as const,
          content: 'Old message',
          created_at: '2025-01-01T00:00:00Z',
          isPersisted: false,
        },
      ];

      vi.mocked(apiService.getGroupMessages).mockResolvedValue({
        messages: mockMessages,
      });

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      act(() => {
        useGroupMessageStoreEnhanced.setState({
          messages: { 'group-1': existingMessages },
        });
      });

      await act(async () => {
        await result.current.fetchGroupMessages('group-1');
      });

      // Should have merged messages (3 total if no duplicates)
      expect(result.current.messages['group-1'].length).toBeGreaterThan(mockMessages.length);
    });
  });

  describe('mergeMessages', () => {
    it('should merge new messages with existing messages', () => {
      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      const existingMessages = [
        {
          id: 'msg-1',
          role: 'user' as const,
          content: 'Existing',
          created_at: '2025-01-01T00:00:00Z',
          isPersisted: false,
        },
      ];

      const newMessages = [
        {
          id: 'msg-2',
          role: 'user' as const,
          content: 'New',
          created_at: '2025-01-01T00:00:01Z',
          isPersisted: true,
        },
      ];

      act(() => {
        useGroupMessageStoreEnhanced.setState({
          messages: { 'group-1': existingMessages },
        });
      });

      act(() => {
        result.current.mergeMessages('group-1', newMessages);
      });

      expect(result.current.messages['group-1']).toHaveLength(2);
    });

    it('should deduplicate messages by ID', () => {
      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      const existingMessages = [
        {
          id: 'msg-1',
          role: 'user' as const,
          content: 'Original',
          created_at: '2025-01-01T00:00:00Z',
          isPersisted: false,
        },
      ];

      const newMessages = [
        {
          id: 'msg-1',
          role: 'user' as const,
          content: 'Original',
          created_at: '2025-01-01T00:00:00Z',
          isPersisted: true,
        },
      ];

      act(() => {
        useGroupMessageStoreEnhanced.setState({
          messages: { 'group-1': existingMessages },
        });
      });

      act(() => {
        result.current.mergeMessages('group-1', newMessages);
      });

      // Should have only 1 message after deduplication
      expect(result.current.messages['group-1']).toHaveLength(1);
      // Should prefer persisted version
      expect(result.current.messages['group-1'][0].isPersisted).toBe(true);
    });

    it('should prefer persisted messages over optimistic messages', () => {
      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      const optimisticMessage = {
        id: 'msg-1',
        role: 'user' as const,
        content: 'Test',
        created_at: '2025-01-01T00:00:00Z',
        isPersisted: false,
      };

      const persistedMessage = {
        id: 'msg-1',
        role: 'user' as const,
        content: 'Test',
        created_at: '2025-01-01T00:00:00Z',
        isPersisted: true,
      };

      act(() => {
        useGroupMessageStoreEnhanced.setState({
          messages: { 'group-1': [optimisticMessage] },
        });
      });

      act(() => {
        result.current.mergeMessages('group-1', [persistedMessage]);
      });

      expect(result.current.messages['group-1']).toHaveLength(1);
      expect(result.current.messages['group-1'][0].isPersisted).toBe(true);
    });

    it('should sort messages chronologically', () => {
      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      const messages = [
        {
          id: 'msg-3',
          role: 'user' as const,
          content: 'Third',
          created_at: '2025-01-01T00:00:02Z',
          isPersisted: true,
        },
        {
          id: 'msg-1',
          role: 'user' as const,
          content: 'First',
          created_at: '2025-01-01T00:00:00Z',
          isPersisted: true,
        },
        {
          id: 'msg-2',
          role: 'user' as const,
          content: 'Second',
          created_at: '2025-01-01T00:00:01Z',
          isPersisted: true,
        },
      ];

      act(() => {
        result.current.mergeMessages('group-1', messages);
      });

      expect(result.current.messages['group-1'][0].content).toBe('First');
      expect(result.current.messages['group-1'][1].content).toBe('Second');
      expect(result.current.messages['group-1'][2].content).toBe('Third');
    });

    it('should handle empty message arrays', () => {
      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      act(() => {
        result.current.mergeMessages('group-1', []);
      });

      expect(result.current.messages['group-1']).toEqual([]);
    });
  });

  describe('markMessageAsPersisted', () => {
    it('should mark specific message as persisted', () => {
      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      const messages = [
        {
          id: 'msg-1',
          role: 'user' as const,
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
          isPersisted: false,
        },
      ];

      act(() => {
        useGroupMessageStoreEnhanced.setState({
          messages: { 'group-1': messages },
        });
      });

      act(() => {
        result.current.markMessageAsPersisted('group-1', 'msg-1');
      });

      expect(result.current.messages['group-1'][0].isPersisted).toBe(true);
    });

    it('should only mark the specified message, not others', () => {
      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      const messages = [
        {
          id: 'msg-1',
          role: 'user' as const,
          content: 'First',
          created_at: '2025-01-01T00:00:00Z',
          isPersisted: false,
        },
        {
          id: 'msg-2',
          role: 'user' as const,
          content: 'Second',
          created_at: '2025-01-01T00:00:01Z',
          isPersisted: false,
        },
      ];

      act(() => {
        useGroupMessageStoreEnhanced.setState({
          messages: { 'group-1': messages },
        });
      });

      act(() => {
        result.current.markMessageAsPersisted('group-1', 'msg-1');
      });

      expect(result.current.messages['group-1'][0].isPersisted).toBe(true);
      expect(result.current.messages['group-1'][1].isPersisted).toBe(false);
    });

    it('should handle marking non-existent message gracefully', () => {
      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      const messages = [
        {
          id: 'msg-1',
          role: 'user' as const,
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
          isPersisted: false,
        },
      ];

      act(() => {
        useGroupMessageStoreEnhanced.setState({
          messages: { 'group-1': messages },
        });
      });

      act(() => {
        result.current.markMessageAsPersisted('group-1', 'non-existent');
      });

      // Should not crash
      expect(result.current.messages['group-1'][0].isPersisted).toBe(false);
    });
  });

  describe('sendGroupMessage', () => {
    const mockCharacterResponses: CharacterResponse[] = [
      {
        character_id: 'char-1',
        character_name: 'Hegel',
        message: 'Response from Hegel',
        emotions: { joy: 80, fear: 10, anger: 5, sadness: 5, disgust: 0 },
      },
      {
        character_id: 'char-2',
        character_name: 'Kant',
        message: 'Response from Kant',
      },
    ];

    it('should send message successfully', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.sendGroupMessage).mockResolvedValue({
        responses: mockCharacterResponses,
      });

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      await act(async () => {
        await result.current.sendGroupMessage('group-1', 'Hello everyone', ['char-1', 'char-2']);
      });

      // Should have user message + 2 character responses
      expect(result.current.messages['group-1'].length).toBeGreaterThanOrEqual(3);
      expect(result.current.isSending['group-1']).toBe(false);
    });

    it('should add user message optimistically', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.sendGroupMessage).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ responses: mockCharacterResponses }), 100))
      );

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      const promise = act(async () => {
        await result.current.sendGroupMessage('group-1', 'Hello everyone', ['char-1', 'char-2']);
      });

      // Check optimistic message immediately
      await waitFor(() => {
        const messages = result.current.messages['group-1'] || [];
        expect(messages.some((m) => m.content === 'Hello everyone')).toBe(true);
        const userMessage = messages.find((m) => m.content === 'Hello everyone');
        expect(userMessage?.isPersisted).toBe(false);
      });

      await promise;
    });

    it('should mark user message as persisted after successful send', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.sendGroupMessage).mockResolvedValue({
        responses: mockCharacterResponses,
      });

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      await act(async () => {
        await result.current.sendGroupMessage('group-1', 'Hello everyone', ['char-1', 'char-2']);
      });

      const userMessage = result.current.messages['group-1'].find((m) => m.role === 'user');
      expect(userMessage?.isPersisted).toBe(true);
    });

    it('should add character responses as persisted messages', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.sendGroupMessage).mockResolvedValue({
        responses: mockCharacterResponses,
      });

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      await act(async () => {
        await result.current.sendGroupMessage('group-1', 'Hello everyone', ['char-1', 'char-2']);
      });

      const assistantMessages = result.current.messages['group-1'].filter(
        (m) => m.role === 'assistant'
      );
      expect(assistantMessages).toHaveLength(2);
      assistantMessages.forEach((msg) => {
        expect(msg.isPersisted).toBe(true);
      });
    });

    it('should set sending state during send', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.sendGroupMessage).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ responses: mockCharacterResponses }), 100))
      );

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      const promise = act(async () => {
        await result.current.sendGroupMessage('group-1', 'Hello everyone', ['char-1', 'char-2']);
      });

      await waitFor(() => {
        expect(result.current.isSending['group-1']).toBe(true);
      });

      await promise;

      expect(result.current.isSending['group-1']).toBe(false);
    });

    it('should handle send errors', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.sendGroupMessage).mockRejectedValue(
        new Error('Failed to send message')
      );

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      await act(async () => {
        await result.current.sendGroupMessage('group-1', 'Hello everyone', ['char-1', 'char-2']);
      });

      expect(result.current.error['group-1']).toBe('Failed to send message');
      expect(result.current.isSending['group-1']).toBe(false);
    });

    it('should remove optimistic user message on error', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.sendGroupMessage).mockRejectedValue(
        new Error('Failed to send message')
      );

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      await act(async () => {
        await result.current.sendGroupMessage('group-1', 'Hello everyone', ['char-1', 'char-2']);
      });

      // Optimistic message should be removed
      const messages = result.current.messages['group-1'] || [];
      expect(messages.some((m) => m.content === 'Hello everyone')).toBe(false);
    });

    it('should send recent persisted messages as context', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.sendGroupMessage).mockResolvedValue({
        responses: mockCharacterResponses,
      });

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      // Add some existing persisted messages
      const existingMessages = [
        {
          id: 'msg-1',
          role: 'user' as const,
          content: 'Message 1',
          created_at: '2025-01-01T00:00:00Z',
          isPersisted: true,
        },
        {
          id: 'msg-2',
          role: 'assistant' as const,
          content: 'Response 1',
          created_at: '2025-01-01T00:00:01Z',
          isPersisted: true,
        },
      ];

      act(() => {
        useGroupMessageStoreEnhanced.setState({
          messages: { 'group-1': existingMessages },
        });
      });

      await act(async () => {
        await result.current.sendGroupMessage('group-1', 'New message', ['char-1', 'char-2'], 5);
      });

      expect(apiService.sendGroupMessage).toHaveBeenCalled();
      const callArgs = vi.mocked(apiService.sendGroupMessage).mock.calls[0][0];
      expect(callArgs.messages.length).toBeGreaterThan(0);
    });

    it('should use custom message limit for context', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.sendGroupMessage).mockResolvedValue({
        responses: mockCharacterResponses,
      });

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      // Add many existing messages
      const existingMessages = Array.from({ length: 10 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
        created_at: new Date(2025, 0, 1, 0, 0, i).toISOString(),
        isPersisted: true,
      }));

      act(() => {
        useGroupMessageStoreEnhanced.setState({
          messages: { 'group-1': existingMessages },
        });
      });

      await act(async () => {
        await result.current.sendGroupMessage('group-1', 'New message', ['char-1', 'char-2'], 3);
      });

      const callArgs = vi.mocked(apiService.sendGroupMessage).mock.calls[0][0];
      // Should send last 3 messages + new message = 4 total
      expect(callArgs.messages.length).toBeLessThanOrEqual(4);
    });

    it('should include character metadata in responses', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.sendGroupMessage).mockResolvedValue({
        responses: mockCharacterResponses,
      });

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      await act(async () => {
        await result.current.sendGroupMessage('group-1', 'Hello everyone', ['char-1', 'char-2']);
      });

      const assistantMessages = result.current.messages['group-1'].filter(
        (m) => m.role === 'assistant'
      );

      expect(assistantMessages[0].character_id).toBe('char-1');
      expect(assistantMessages[0].character_name).toBe('Hegel');
      expect(assistantMessages[1].character_id).toBe('char-2');
      expect(assistantMessages[1].character_name).toBe('Kant');
    });
  });

  describe('clearGroupMessages', () => {
    it('should clear messages for specific group', () => {
      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      act(() => {
        useGroupMessageStoreEnhanced.setState({
          messages: {
            'group-1': [
              {
                id: 'msg-1',
                role: 'user' as const,
                content: 'Test',
                created_at: '2025-01-01T00:00:00Z',
              },
            ],
            'group-2': [
              {
                id: 'msg-2',
                role: 'user' as const,
                content: 'Test 2',
                created_at: '2025-01-01T00:00:00Z',
              },
            ],
          },
        });
      });

      act(() => {
        result.current.clearGroupMessages('group-1');
      });

      expect(result.current.messages['group-1']).toEqual([]);
      expect(result.current.messages['group-2']).toHaveLength(1);
    });

    it('should handle clearing non-existent group', () => {
      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      act(() => {
        result.current.clearGroupMessages('non-existent');
      });

      expect(result.current.messages['non-existent']).toEqual([]);
    });
  });

  describe('State Isolation', () => {
    it('should maintain separate state for different groups', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.getGroupMessages).mockResolvedValue({
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Group 1 message',
            created_at: '2025-01-01T00:00:00Z',
          },
        ],
      });

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchGroupMessages('group-1');
      });

      await act(async () => {
        await result.current.fetchGroupMessages('group-2');
      });

      expect(result.current.messages['group-1']).toBeDefined();
      expect(result.current.messages['group-2']).toBeDefined();
      expect(result.current.messages['group-1']).not.toEqual(result.current.messages['group-2']);
    });

    it('should maintain separate loading states for different groups', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.sendGroupMessage).mockResolvedValue({ responses: [] });

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      const promise1 = act(async () => {
        await result.current.sendGroupMessage('group-1', 'Message 1', ['char-1']);
      });

      await waitFor(() => {
        expect(result.current.isSending['group-1']).toBe(true);
      });

      const promise2 = act(async () => {
        await result.current.sendGroupMessage('group-2', 'Message 2', ['char-2']);
      });

      await waitFor(() => {
        expect(result.current.isSending['group-2']).toBe(true);
      });

      await Promise.all([promise1, promise2]);

      expect(result.current.isSending['group-1']).toBe(false);
      expect(result.current.isSending['group-2']).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty response from API', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.getGroupMessages).mockResolvedValue({ messages: [] });

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchGroupMessages('group-1');
      });

      expect(result.current.messages['group-1']).toEqual([]);
    });

    it('should handle concurrent operations on same group', async () => {
      const { apiService } = await import('../../services/api');
      vi.mocked(apiService.getGroupMessages).mockResolvedValue({ messages: [] });

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      await act(async () => {
        await Promise.all([
          result.current.fetchGroupMessages('group-1'),
          result.current.fetchGroupMessages('group-1'),
        ]);
      });

      // Should handle gracefully without errors
      expect(result.current.messages['group-1']).toBeDefined();
    });

    it('should handle API errors with different error types', async () => {
      const { apiService } = await import('../../services/api');

      // Test TypeError (network error)
      vi.mocked(apiService.getGroupMessages).mockRejectedValueOnce(new TypeError('Network error'));

      const { result } = renderHook(() => useGroupMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchGroupMessages('group-1');
      });

      expect(result.current.error['group-1']).toBeTruthy();

      // Test generic Error
      vi.mocked(apiService.getGroupMessages).mockRejectedValueOnce(new Error('Generic error'));

      await act(async () => {
        await result.current.fetchGroupMessages('group-2');
      });

      expect(result.current.error['group-2']).toBe('Generic error');
    });
  });
});
