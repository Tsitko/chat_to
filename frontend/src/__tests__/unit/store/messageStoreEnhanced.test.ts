/**
 * Unit tests for messageStoreEnhanced
 *
 * Test Coverage:
 * - Initial state
 * - fetchMessages action (success, error, loading states, per-character)
 * - sendMessage action (success, error, loading states, optimistic updates)
 * - clearMessages action
 * - getLoadingState helper method
 * - isLoading helper method
 * - clearError helper method
 * - Per-character loading state isolation
 * - Edge cases (concurrent operations, multiple characters, API errors)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMessageStoreEnhanced } from '../../../store/messageStoreEnhanced';
import { apiService } from '../../../services/api';
import type { Message } from '../../../types/message';

// Mock API service
vi.mock('../../../services/api', () => ({
  apiService: {
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

describe('messageStoreEnhanced', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useMessageStoreEnhanced.setState({
        messages: {},
        loadingStates: {},
      });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have empty messages object', () => {
      const { result } = renderHook(() => useMessageStoreEnhanced());

      expect(result.current.messages).toEqual({});
    });

    it('should have empty loadingStates object', () => {
      const { result } = renderHook(() => useMessageStoreEnhanced());

      expect(result.current.loadingStates).toEqual({});
    });
  });

  describe('fetchMessages', () => {
    const mockMessages: Message[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        created_at: '2024-01-01T00:00:01Z',
      },
    ];

    const mockResponse = {
      messages: mockMessages,
      total: 2,
    };

    it('should fetch messages successfully', async () => {
      vi.mocked(apiService.getMessages).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
      });

      expect(result.current.messages['char-1']).toEqual(mockMessages);
      expect(result.current.getLoadingState('char-1', 'fetch').state).toBe('success');
    });

    it('should set loading state during fetch', async () => {
      vi.mocked(apiService.getMessages).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100))
      );

      const { result } = renderHook(() => useMessageStoreEnhanced());

      const promise = act(async () => {
        await result.current.fetchMessages('char-1');
      });

      expect(result.current.getLoadingState('char-1', 'fetch').state).toBe('loading');

      await promise;

      expect(result.current.getLoadingState('char-1', 'fetch').state).toBe('success');
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Failed to fetch messages');
      vi.mocked(apiService.getMessages).mockRejectedValue(error);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
      });

      expect(result.current.getLoadingState('char-1', 'fetch').state).toBe('error');
      expect(result.current.getLoadingState('char-1', 'fetch').error).toBe('Failed to fetch messages');
      expect(result.current.messages['char-1']).toBeUndefined();
    });

    it('should fetch with custom limit and offset', async () => {
      vi.mocked(apiService.getMessages).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1', 20, 10);
      });

      expect(apiService.getMessages).toHaveBeenCalledWith('char-1', 20, 10);
    });

    it('should use default limit and offset', async () => {
      vi.mocked(apiService.getMessages).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
      });

      expect(apiService.getMessages).toHaveBeenCalledWith('char-1', 10, 0);
    });

    it('should isolate loading states per character', async () => {
      vi.mocked(apiService.getMessages).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
      });

      expect(result.current.getLoadingState('char-1', 'fetch').state).toBe('success');
      expect(result.current.getLoadingState('char-2', 'fetch').state).toBe('idle');
    });

    it('should initialize loading state for character if not exists', async () => {
      vi.mocked(apiService.getMessages).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      expect(result.current.loadingStates['char-1']).toBeUndefined();

      await act(async () => {
        await result.current.fetchMessages('char-1');
      });

      expect(result.current.loadingStates['char-1']).toBeDefined();
      expect(result.current.loadingStates['char-1'].fetch).toBeDefined();
    });
  });

  describe('sendMessage', () => {
    const mockUserMessage: Message = {
      id: 'msg-user',
      role: 'user',
      content: 'Test message',
      created_at: '2024-01-01T00:00:00Z',
    };

    const mockAssistantMessage: Message = {
      id: 'msg-assistant',
      role: 'assistant',
      content: 'Response',
      created_at: '2024-01-01T00:00:01Z',
    };

    const mockSendResponse = {
      user_message: mockUserMessage,
      assistant_message: mockAssistantMessage,
    };

    it('should send message successfully', async () => {
      vi.mocked(apiService.sendMessage).mockResolvedValue(mockSendResponse);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      let success = false;
      await act(async () => {
        success = await result.current.sendMessage('char-1', 'Test message');
      });

      expect(success).toBe(true);
      expect(result.current.messages['char-1']).toContainEqual(mockUserMessage);
      expect(result.current.messages['char-1']).toContainEqual(mockAssistantMessage);
      expect(result.current.getLoadingState('char-1', 'send').state).toBe('success');
    });

    it('should set loading state during send', async () => {
      vi.mocked(apiService.sendMessage).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockSendResponse), 100))
      );

      const { result } = renderHook(() => useMessageStoreEnhanced());

      const promise = act(async () => {
        await result.current.sendMessage('char-1', 'Test message');
      });

      expect(result.current.getLoadingState('char-1', 'send').state).toBe('loading');

      await promise;

      expect(result.current.getLoadingState('char-1', 'send').state).toBe('success');
    });

    it('should handle send errors', async () => {
      const error = new Error('Failed to send message');
      vi.mocked(apiService.sendMessage).mockRejectedValue(error);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      let success = false;
      await act(async () => {
        success = await result.current.sendMessage('char-1', 'Test message');
      });

      expect(success).toBe(false);
      expect(result.current.getLoadingState('char-1', 'send').state).toBe('error');
      expect(result.current.getLoadingState('char-1', 'send').error).toBe('Failed to send message');
    });

    it('should add optimistic user message immediately', async () => {
      vi.mocked(apiService.sendMessage).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockSendResponse), 100))
      );

      const { result } = renderHook(() => useMessageStoreEnhanced());

      const promise = act(async () => {
        await result.current.sendMessage('char-1', 'Test message');
      });

      // Should have optimistic message before API response
      await waitFor(() => {
        const messages = result.current.messages['char-1'] || [];
        expect(messages.some(m => m.content === 'Test message')).toBe(true);
      });

      await promise;
    });

    it('should append messages to existing messages', async () => {
      const existingMessages: Message[] = [
        { id: 'msg-old', role: 'user', content: 'Old message', created_at: '2024-01-01T00:00:00Z' },
      ];

      vi.mocked(apiService.sendMessage).mockResolvedValue(mockSendResponse);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      act(() => {
        useMessageStoreEnhanced.setState({
          messages: { 'char-1': existingMessages },
        });
      });

      await act(async () => {
        await result.current.sendMessage('char-1', 'Test message');
      });

      expect(result.current.messages['char-1'].length).toBeGreaterThan(existingMessages.length);
    });

    it('should isolate messages per character', async () => {
      vi.mocked(apiService.sendMessage).mockResolvedValue(mockSendResponse);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.sendMessage('char-1', 'Message to char 1');
      });

      expect(result.current.messages['char-1']).toBeDefined();
      expect(result.current.messages['char-2']).toBeUndefined();
    });

    it('should handle empty message content', async () => {
      vi.mocked(apiService.sendMessage).mockResolvedValue(mockSendResponse);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.sendMessage('char-1', '');
      });

      expect(apiService.sendMessage).toHaveBeenCalledWith('char-1', '');
    });
  });

  describe('clearMessages', () => {
    it('should clear messages for specific character', () => {
      const { result } = renderHook(() => useMessageStoreEnhanced());

      act(() => {
        useMessageStoreEnhanced.setState({
          messages: {
            'char-1': [
              { id: 'msg-1', role: 'user', content: 'Test', created_at: '' },
            ],
            'char-2': [
              { id: 'msg-2', role: 'user', content: 'Test 2', created_at: '' },
            ],
          },
        });
      });

      act(() => {
        result.current.clearMessages('char-1');
      });

      expect(result.current.messages['char-1']).toBeUndefined();
      expect(result.current.messages['char-2']).toBeDefined();
    });

    it('should handle clearing non-existent character', () => {
      const { result } = renderHook(() => useMessageStoreEnhanced());

      act(() => {
        result.current.clearMessages('non-existent');
      });

      // Should not throw error
      expect(result.current.messages['non-existent']).toBeUndefined();
    });
  });

  describe('Helper Methods', () => {
    describe('getLoadingState', () => {
      it('should return loading state for character and operation', () => {
        const { result } = renderHook(() => useMessageStoreEnhanced());

        act(() => {
          useMessageStoreEnhanced.setState({
            loadingStates: {
              'char-1': {
                fetch: { state: 'loading' },
                send: { state: 'success' },
              },
            },
          });
        });

        expect(result.current.getLoadingState('char-1', 'fetch').state).toBe('loading');
        expect(result.current.getLoadingState('char-1', 'send').state).toBe('success');
      });

      it('should return default idle state if not found', () => {
        const { result } = renderHook(() => useMessageStoreEnhanced());

        const state = result.current.getLoadingState('char-999', 'fetch');

        expect(state.state).toBe('idle');
        expect(state.error).toBeUndefined();
      });
    });

    describe('isLoading', () => {
      it('should return true when operation is loading', () => {
        const { result } = renderHook(() => useMessageStoreEnhanced());

        act(() => {
          useMessageStoreEnhanced.setState({
            loadingStates: {
              'char-1': {
                fetch: { state: 'loading' },
                send: { state: 'idle' },
              },
            },
          });
        });

        expect(result.current.isLoading('char-1', 'fetch')).toBe(true);
        expect(result.current.isLoading('char-1', 'send')).toBe(false);
      });

      it('should return false for non-existent character', () => {
        const { result } = renderHook(() => useMessageStoreEnhanced());

        expect(result.current.isLoading('non-existent', 'fetch')).toBe(false);
      });
    });

    describe('clearError', () => {
      it('should clear error for specific operation', () => {
        const { result } = renderHook(() => useMessageStoreEnhanced());

        act(() => {
          useMessageStoreEnhanced.setState({
            loadingStates: {
              'char-1': {
                fetch: { state: 'error', error: 'Fetch error' },
                send: { state: 'error', error: 'Send error' },
              },
            },
          });
        });

        expect(result.current.getLoadingState('char-1', 'fetch').error).toBe('Fetch error');

        act(() => {
          result.current.clearError('char-1', 'fetch');
        });

        expect(result.current.getLoadingState('char-1', 'fetch').error).toBeUndefined();
        expect(result.current.getLoadingState('char-1', 'send').error).toBe('Send error'); // Unchanged
      });

      it('should handle clearing error for non-existent character', () => {
        const { result } = renderHook(() => useMessageStoreEnhanced());

        act(() => {
          result.current.clearError('non-existent', 'fetch');
        });

        // Should not throw error
        expect(result.current.getLoadingState('non-existent', 'fetch').error).toBeUndefined();
      });
    });
  });

  describe('Per-Character State Isolation', () => {
    it('should maintain separate loading states for different characters', async () => {
      const response1 = {
        messages: [{ id: 'msg-1', role: 'user' as const, content: 'Test 1', created_at: '' }],
        total: 1,
      };
      const response2 = {
        messages: [{ id: 'msg-2', role: 'user' as const, content: 'Test 2', created_at: '' }],
        total: 1,
      };

      vi.mocked(apiService.getMessages)
        .mockResolvedValueOnce(response1)
        .mockResolvedValueOnce(response2);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
      });

      await act(async () => {
        await result.current.fetchMessages('char-2');
      });

      expect(result.current.getLoadingState('char-1', 'fetch').state).toBe('success');
      expect(result.current.getLoadingState('char-2', 'fetch').state).toBe('success');
      expect(result.current.messages['char-1']).not.toEqual(result.current.messages['char-2']);
    });

    it('should handle errors independently for different characters', async () => {
      const response = {
        messages: [{ id: 'msg-1', role: 'user' as const, content: 'Test', created_at: '' }],
        total: 1,
      };

      vi.mocked(apiService.getMessages)
        .mockResolvedValueOnce(response)
        .mockRejectedValueOnce(new Error('Error for char-2'));

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
      });

      await act(async () => {
        await result.current.fetchMessages('char-2');
      });

      expect(result.current.getLoadingState('char-1', 'fetch').state).toBe('success');
      expect(result.current.getLoadingState('char-2', 'fetch').state).toBe('error');
      expect(result.current.getLoadingState('char-2', 'fetch').error).toBe('Error for char-2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent fetch and send for same character', async () => {
      const fetchResponse = {
        messages: [{ id: 'msg-old', role: 'user' as const, content: 'Old', created_at: '' }],
        total: 1,
      };

      const sendResponse = {
        user_message: { id: 'msg-new-user', role: 'user' as const, content: 'New', created_at: '' },
        assistant_message: { id: 'msg-new-asst', role: 'assistant' as const, content: 'Reply', created_at: '' },
      };

      vi.mocked(apiService.getMessages).mockResolvedValue(fetchResponse);
      vi.mocked(apiService.sendMessage).mockResolvedValue(sendResponse);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await Promise.all([
          result.current.fetchMessages('char-1'),
          result.current.sendMessage('char-1', 'New'),
        ]);
      });

      expect(result.current.getLoadingState('char-1', 'fetch').state).toBe('success');
      expect(result.current.getLoadingState('char-1', 'send').state).toBe('success');
    });

    it('should handle very long message content', async () => {
      const longMessage = 'a'.repeat(10000);
      const response = {
        user_message: { id: 'msg-1', role: 'user' as const, content: longMessage, created_at: '' },
        assistant_message: { id: 'msg-2', role: 'assistant' as const, content: 'Reply', created_at: '' },
      };

      vi.mocked(apiService.sendMessage).mockResolvedValue(response);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.sendMessage('char-1', longMessage);
      });

      expect(result.current.messages['char-1'][0].content).toBe(longMessage);
    });

    it('should handle API returning empty messages array', async () => {
      vi.mocked(apiService.getMessages).mockResolvedValue({
        messages: [],
        total: 0,
      });

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
      });

      expect(result.current.messages['char-1']).toEqual([]);
    });

    it('should handle multiple characters simultaneously', async () => {
      const responses = ['char-1', 'char-2', 'char-3'].map(id => ({
        messages: [{ id: `msg-${id}`, role: 'user' as const, content: `Message for ${id}`, created_at: '' }],
        total: 1,
      }));

      vi.mocked(apiService.getMessages)
        .mockResolvedValueOnce(responses[0])
        .mockResolvedValueOnce(responses[1])
        .mockResolvedValueOnce(responses[2]);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await Promise.all([
          result.current.fetchMessages('char-1'),
          result.current.fetchMessages('char-2'),
          result.current.fetchMessages('char-3'),
        ]);
      });

      expect(result.current.messages['char-1']).toBeDefined();
      expect(result.current.messages['char-2']).toBeDefined();
      expect(result.current.messages['char-3']).toBeDefined();
    });

    it('should handle clearing error after successful retry', async () => {
      vi.mocked(apiService.sendMessage)
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({
          user_message: { id: 'msg-1', role: 'user', content: 'Test', created_at: '' },
          assistant_message: { id: 'msg-2', role: 'assistant', content: 'Reply', created_at: '' },
        });

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.sendMessage('char-1', 'Test');
      });

      expect(result.current.getLoadingState('char-1', 'send').error).toBe('First error');

      await act(async () => {
        await result.current.sendMessage('char-1', 'Test');
      });

      expect(result.current.getLoadingState('char-1', 'send').error).toBeUndefined();
      expect(result.current.getLoadingState('char-1', 'send').state).toBe('success');
    });
  });
});
