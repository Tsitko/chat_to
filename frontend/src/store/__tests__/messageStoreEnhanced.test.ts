/**
 * Unit tests for messageStoreEnhanced.
 *
 * Test Coverage:
 * - Initial state
 * - fetchMessages per character with loading states
 * - sendMessage per character with loading states
 * - clearMessages functionality
 * - Per-character loading states isolation
 * - Error handling per character
 * - Helper methods (getLoadingState, isLoading, clearError)
 * - Multiple characters simultaneously
 * - State transitions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMessageStoreEnhanced } from '../messageStoreEnhanced';
import { apiService } from '../../services/api';
import type { Message, MessagesResponse, MessageResponse } from '../../types/message';

// Mock API service
vi.mock('../../services/api', () => ({
  apiService: {
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

describe('messageStoreEnhanced', () => {
  const mockApiService = vi.mocked(apiService);

  const mockMessage1: Message = {
    id: 'msg-1',
    role: 'user',
    content: 'Hello Hegel',
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockMessage2: Message = {
    id: 'msg-2',
    role: 'assistant',
    content: 'Greetings',
    created_at: '2024-01-01T00:00:01Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state
    const store = useMessageStoreEnhanced.getState();
    store.messages = {};
    store.loadingStates = {};
  });

  describe('Initial State', () => {
    it('should have empty messages object initially', () => {
      const { result } = renderHook(() => useMessageStoreEnhanced());

      expect(result.current.messages).toEqual({});
      expect(result.current.loadingStates).toEqual({});
    });
  });

  describe('fetchMessages', () => {
    it('should fetch messages for a character successfully', async () => {
      const mockResponse: MessagesResponse = {
        messages: [mockMessage1, mockMessage2],
        total: 2,
      };
      mockApiService.getMessages.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
      });

      expect(result.current.messages['char-1']).toEqual([mockMessage1, mockMessage2]);
      expect(mockApiService.getMessages).toHaveBeenCalledWith('char-1', 10, 0);
    });

    it('should fetch messages with custom limit and offset', async () => {
      const mockResponse: MessagesResponse = {
        messages: [mockMessage1],
        total: 1,
      };
      mockApiService.getMessages.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1', 20, 10);
      });

      expect(mockApiService.getMessages).toHaveBeenCalledWith('char-1', 20, 10);
    });

    it('should initialize loading state for new character', async () => {
      mockApiService.getMessages.mockResolvedValue({
        messages: [],
        total: 0,
      });

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
      });

      expect(result.current.loadingStates['char-1']).toBeDefined();
      expect(result.current.loadingStates['char-1'].fetch.state).toBe('success');
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: MessagesResponse) => void;
      const promise = new Promise<MessagesResponse>((resolve) => {
        resolvePromise = resolve;
      });
      mockApiService.getMessages.mockReturnValue(promise);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      act(() => {
        result.current.fetchMessages('char-1');
      });

      await waitFor(() => {
        expect(result.current.loadingStates['char-1']?.fetch.state).toBe('loading');
      });

      await act(async () => {
        resolvePromise!({ messages: [], total: 0 });
        await promise;
      });

      expect(result.current.loadingStates['char-1'].fetch.state).toBe('success');
    });

    it('should handle fetch error', async () => {
      mockApiService.getMessages.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
      });

      expect(result.current.loadingStates['char-1'].fetch.state).toBe('error');
      expect(result.current.loadingStates['char-1'].fetch.error).toBe('Network error');
      expect(result.current.messages['char-1']).toEqual([]);
    });

    it('should isolate loading states per character', async () => {
      mockApiService.getMessages.mockResolvedValue({ messages: [], total: 0 });

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
        await result.current.fetchMessages('char-2');
      });

      expect(result.current.loadingStates['char-1']).toBeDefined();
      expect(result.current.loadingStates['char-2']).toBeDefined();
      expect(result.current.loadingStates['char-1'].fetch.state).toBe('success');
      expect(result.current.loadingStates['char-2'].fetch.state).toBe('success');
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockResponse: MessageResponse = {
        user_message: mockMessage1,
        assistant_message: mockMessage2,
      };
      mockApiService.sendMessage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      let success = false;
      await act(async () => {
        success = await result.current.sendMessage('char-1', 'Hello Hegel');
      });

      expect(success).toBe(true);
      expect(result.current.messages['char-1']).toEqual([mockMessage1, mockMessage2]);
      expect(mockApiService.sendMessage).toHaveBeenCalledWith('char-1', {
        content: 'Hello Hegel',
      });
    });

    it('should append messages to existing messages', async () => {
      // First fetch existing messages
      mockApiService.getMessages.mockResolvedValue({
        messages: [mockMessage1],
        total: 1,
      });

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
      });

      // Then send new message
      const newUserMessage: Message = {
        id: 'msg-3',
        role: 'user',
        content: 'New message',
        created_at: '2024-01-01T00:00:02Z',
      };
      const newAssistantMessage: Message = {
        id: 'msg-4',
        role: 'assistant',
        content: 'Response',
        created_at: '2024-01-01T00:00:03Z',
      };

      mockApiService.sendMessage.mockResolvedValue({
        user_message: newUserMessage,
        assistant_message: newAssistantMessage,
      });

      await act(async () => {
        await result.current.sendMessage('char-1', 'New message');
      });

      expect(result.current.messages['char-1']).toHaveLength(3);
      expect(result.current.messages['char-1']).toContain(newUserMessage);
      expect(result.current.messages['char-1']).toContain(newAssistantMessage);
    });

    it('should set loading state during send', async () => {
      let resolvePromise: (value: MessageResponse) => void;
      const promise = new Promise<MessageResponse>((resolve) => {
        resolvePromise = resolve;
      });
      mockApiService.sendMessage.mockReturnValue(promise);

      const { result } = renderHook(() => useMessageStoreEnhanced());

      act(() => {
        result.current.sendMessage('char-1', 'Test message');
      });

      await waitFor(() => {
        expect(result.current.loadingStates['char-1']?.send.state).toBe('loading');
      });

      await act(async () => {
        resolvePromise!({
          user_message: mockMessage1,
          assistant_message: mockMessage2,
        });
        await promise;
      });

      expect(result.current.loadingStates['char-1'].send.state).toBe('success');
    });

    it('should handle send error', async () => {
      mockApiService.sendMessage.mockRejectedValue(new Error('Send failed'));

      const { result } = renderHook(() => useMessageStoreEnhanced());

      let success = true;
      await act(async () => {
        success = await result.current.sendMessage('char-1', 'Test');
      });

      expect(success).toBe(false);
      expect(result.current.loadingStates['char-1'].send.state).toBe('error');
      expect(result.current.loadingStates['char-1'].send.error).toBe('Send failed');
    });

    it('should not affect send loading state during fetch', async () => {
      mockApiService.getMessages.mockResolvedValue({ messages: [], total: 0 });

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
      });

      expect(result.current.loadingStates['char-1'].send.state).toBe('idle');
    });

    it('should isolate send operations per character', async () => {
      mockApiService.sendMessage.mockResolvedValue({
        user_message: mockMessage1,
        assistant_message: mockMessage2,
      });

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.sendMessage('char-1', 'Message to char-1');
        await result.current.sendMessage('char-2', 'Message to char-2');
      });

      expect(result.current.messages['char-1']).toHaveLength(2);
      expect(result.current.messages['char-2']).toHaveLength(2);
      expect(result.current.loadingStates['char-1'].send.state).toBe('success');
      expect(result.current.loadingStates['char-2'].send.state).toBe('success');
    });
  });

  describe('clearMessages', () => {
    it('should clear messages for a specific character', async () => {
      mockApiService.getMessages.mockResolvedValue({
        messages: [mockMessage1, mockMessage2],
        total: 2,
      });

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
        await result.current.fetchMessages('char-2');
      });

      expect(result.current.messages['char-1']).toHaveLength(2);
      expect(result.current.messages['char-2']).toHaveLength(2);

      act(() => {
        result.current.clearMessages('char-1');
      });

      expect(result.current.messages['char-1']).toEqual([]);
      expect(result.current.messages['char-2']).toHaveLength(2);
    });

    it('should handle clearing non-existent character messages', () => {
      const { result } = renderHook(() => useMessageStoreEnhanced());

      expect(() => {
        act(() => {
          result.current.clearMessages('non-existent');
        });
      }).not.toThrow();
    });
  });

  describe('Helper Methods', () => {
    describe('getLoadingState', () => {
      it('should return loading state for existing character', async () => {
        mockApiService.getMessages.mockResolvedValue({ messages: [], total: 0 });

        const { result } = renderHook(() => useMessageStoreEnhanced());

        await act(async () => {
          await result.current.fetchMessages('char-1');
        });

        const fetchState = result.current.getLoadingState('char-1', 'fetch');
        expect(fetchState.state).toBe('success');
      });

      it('should return default state for non-existent character', () => {
        const { result } = renderHook(() => useMessageStoreEnhanced());

        const fetchState = result.current.getLoadingState('non-existent', 'fetch');
        expect(fetchState.state).toBe('idle');
        expect(fetchState.error).toBeUndefined();
      });

      it('should return correct state for different operations', async () => {
        mockApiService.getMessages.mockResolvedValue({ messages: [], total: 0 });
        mockApiService.sendMessage.mockResolvedValue({
          user_message: mockMessage1,
          assistant_message: mockMessage2,
        });

        const { result } = renderHook(() => useMessageStoreEnhanced());

        await act(async () => {
          await result.current.fetchMessages('char-1');
          await result.current.sendMessage('char-1', 'Test');
        });

        expect(result.current.getLoadingState('char-1', 'fetch').state).toBe('success');
        expect(result.current.getLoadingState('char-1', 'send').state).toBe('success');
      });
    });

    describe('isLoading', () => {
      it('should return true when operation is loading', async () => {
        let resolvePromise: (value: MessagesResponse) => void;
        const promise = new Promise<MessagesResponse>((resolve) => {
          resolvePromise = resolve;
        });
        mockApiService.getMessages.mockReturnValue(promise);

        const { result } = renderHook(() => useMessageStoreEnhanced());

        act(() => {
          result.current.fetchMessages('char-1');
        });

        await waitFor(() => {
          expect(result.current.isLoading('char-1', 'fetch')).toBe(true);
        });

        await act(async () => {
          resolvePromise!({ messages: [], total: 0 });
          await promise;
        });

        expect(result.current.isLoading('char-1', 'fetch')).toBe(false);
      });

      it('should return false when operation is not loading', () => {
        const { result } = renderHook(() => useMessageStoreEnhanced());

        expect(result.current.isLoading('char-1', 'fetch')).toBe(false);
        expect(result.current.isLoading('char-1', 'send')).toBe(false);
      });

      it('should return false for non-existent character', () => {
        const { result } = renderHook(() => useMessageStoreEnhanced());

        expect(result.current.isLoading('non-existent', 'fetch')).toBe(false);
      });

      it('should isolate loading state per character', async () => {
        let resolvePromise1: (value: MessagesResponse) => void;
        const promise1 = new Promise<MessagesResponse>((resolve) => {
          resolvePromise1 = resolve;
        });
        mockApiService.getMessages.mockReturnValueOnce(promise1);
        mockApiService.getMessages.mockResolvedValueOnce({ messages: [], total: 0 });

        const { result } = renderHook(() => useMessageStoreEnhanced());

        act(() => {
          result.current.fetchMessages('char-1');
        });

        await act(async () => {
          await result.current.fetchMessages('char-2');
        });

        await waitFor(() => {
          expect(result.current.isLoading('char-1', 'fetch')).toBe(true);
        });
        expect(result.current.isLoading('char-2', 'fetch')).toBe(false);

        await act(async () => {
          resolvePromise1!({ messages: [], total: 0 });
          await promise1;
        });
      });
    });

    describe('clearError', () => {
      it('should clear error for specific operation', async () => {
        mockApiService.getMessages.mockRejectedValue(new Error('Fetch error'));

        const { result } = renderHook(() => useMessageStoreEnhanced());

        await act(async () => {
          await result.current.fetchMessages('char-1');
        });

        expect(result.current.loadingStates['char-1'].fetch.error).toBe('Fetch error');

        act(() => {
          result.current.clearError('char-1', 'fetch');
        });

        expect(result.current.loadingStates['char-1'].fetch.error).toBeUndefined();
      });

      it('should not affect other operation errors', async () => {
        mockApiService.getMessages.mockRejectedValue(new Error('Fetch error'));
        mockApiService.sendMessage.mockRejectedValue(new Error('Send error'));

        const { result } = renderHook(() => useMessageStoreEnhanced());

        await act(async () => {
          await result.current.fetchMessages('char-1');
          await result.current.sendMessage('char-1', 'Test');
        });

        act(() => {
          result.current.clearError('char-1', 'fetch');
        });

        expect(result.current.loadingStates['char-1'].fetch.error).toBeUndefined();
        expect(result.current.loadingStates['char-1'].send.error).toBe('Send error');
      });

      it('should handle clearing error for non-existent character', () => {
        const { result } = renderHook(() => useMessageStoreEnhanced());

        expect(() => {
          act(() => {
            result.current.clearError('non-existent', 'fetch');
          });
        }).not.toThrow();
      });
    });
  });

  describe('Multiple Characters', () => {
    it('should handle messages for multiple characters independently', async () => {
      const messages1 = [mockMessage1];
      const messages2 = [mockMessage2];

      mockApiService.getMessages.mockResolvedValueOnce({ messages: messages1, total: 1 });
      mockApiService.getMessages.mockResolvedValueOnce({ messages: messages2, total: 1 });

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
        await result.current.fetchMessages('char-2');
      });

      expect(result.current.messages['char-1']).toEqual(messages1);
      expect(result.current.messages['char-2']).toEqual(messages2);
    });

    it('should maintain separate loading states for multiple characters', async () => {
      let resolveChar1: (value: MessagesResponse) => void;
      const promiseChar1 = new Promise<MessagesResponse>((resolve) => {
        resolveChar1 = resolve;
      });
      mockApiService.getMessages.mockReturnValueOnce(promiseChar1);
      mockApiService.getMessages.mockResolvedValueOnce({ messages: [], total: 0 });

      const { result } = renderHook(() => useMessageStoreEnhanced());

      act(() => {
        result.current.fetchMessages('char-1');
      });

      await act(async () => {
        await result.current.fetchMessages('char-2');
      });

      await waitFor(() => {
        expect(result.current.isLoading('char-1', 'fetch')).toBe(true);
      });
      expect(result.current.isLoading('char-2', 'fetch')).toBe(false);

      await act(async () => {
        resolveChar1!({ messages: [], total: 0 });
        await promiseChar1;
      });

      expect(result.current.isLoading('char-1', 'fetch')).toBe(false);
    });

    it('should handle errors independently for multiple characters', async () => {
      mockApiService.getMessages.mockRejectedValueOnce(new Error('Error for char-1'));
      mockApiService.getMessages.mockResolvedValueOnce({ messages: [], total: 0 });

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
        await result.current.fetchMessages('char-2');
      });

      expect(result.current.loadingStates['char-1'].fetch.state).toBe('error');
      expect(result.current.loadingStates['char-2'].fetch.state).toBe('success');
    });
  });

  describe('State Transitions', () => {
    it('should transition from idle -> loading -> success for fetch', async () => {
      mockApiService.getMessages.mockResolvedValue({ messages: [], total: 0 });

      const { result } = renderHook(() => useMessageStoreEnhanced());

      expect(result.current.getLoadingState('char-1', 'fetch').state).toBe('idle');

      await act(async () => {
        await result.current.fetchMessages('char-1');
      });

      expect(result.current.getLoadingState('char-1', 'fetch').state).toBe('success');
    });

    it('should transition from idle -> loading -> error', async () => {
      mockApiService.getMessages.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
      });

      expect(result.current.getLoadingState('char-1', 'fetch').state).toBe('error');
    });

    it('should allow retrying after error', async () => {
      mockApiService.getMessages.mockRejectedValueOnce(new Error('First error'));
      mockApiService.getMessages.mockResolvedValueOnce({
        messages: [mockMessage1],
        total: 1,
      });

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
      });

      expect(result.current.loadingStates['char-1'].fetch.state).toBe('error');

      await act(async () => {
        await result.current.fetchMessages('char-1');
      });

      expect(result.current.loadingStates['char-1'].fetch.state).toBe('success');
      expect(result.current.messages['char-1']).toEqual([mockMessage1]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message response', async () => {
      mockApiService.getMessages.mockResolvedValue({ messages: [], total: 0 });

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await result.current.fetchMessages('char-1');
      });

      expect(result.current.messages['char-1']).toEqual([]);
    });

    it('should handle sending empty message', async () => {
      mockApiService.sendMessage.mockRejectedValue(new Error('Message required'));

      const { result } = renderHook(() => useMessageStoreEnhanced());

      let success = true;
      await act(async () => {
        success = await result.current.sendMessage('char-1', '');
      });

      expect(success).toBe(false);
    });

    it('should handle concurrent fetch and send', async () => {
      mockApiService.getMessages.mockResolvedValue({ messages: [mockMessage1], total: 1 });
      mockApiService.sendMessage.mockResolvedValue({
        user_message: { ...mockMessage1, id: 'msg-3' },
        assistant_message: mockMessage2,
      });

      const { result } = renderHook(() => useMessageStoreEnhanced());

      await act(async () => {
        await Promise.all([
          result.current.fetchMessages('char-1'),
          result.current.sendMessage('char-1', 'Test'),
        ]);
      });

      expect(result.current.messages['char-1'].length).toBeGreaterThan(0);
    });
  });
});
