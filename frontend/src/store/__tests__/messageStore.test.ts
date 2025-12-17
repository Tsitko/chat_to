/**
 * Message Store Unit Tests.
 *
 * Comprehensive tests for Zustand message store covering:
 * - State initialization
 * - Fetching messages
 * - Sending messages
 * - Clearing messages
 * - Loading states
 * - Error handling
 * - Multiple character contexts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useMessageStore } from '../messageStore';
import { apiService } from '../../services/api';
import {
  mockMessages,
  mockMessagesResponse,
  mockMessageResponse,
  mockUserMessage1,
  mockAssistantMessage1,
} from '../../tests/mockData';

// Mock the API service
vi.mock('../../services/api');
const mockedApiService = vi.mocked(apiService, true);

describe('MessageStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useMessageStore.getState();
    store.messages = {};
    store.isLoading = false;
    store.isSending = false;
    store.error = null;

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      // Arrange & Act
      const store = useMessageStore.getState();

      // Assert
      expect(store.messages).toEqual({});
      expect(store.isLoading).toBe(false);
      expect(store.isSending).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe('fetchMessages', () => {
    it('should fetch messages for a character with default pagination', async () => {
      // Arrange
      mockedApiService.getMessages = vi.fn().mockResolvedValue(mockMessagesResponse);

      // Act
      await useMessageStore.getState().fetchMessages('char-1');

      // Assert
      expect(mockedApiService.getMessages).toHaveBeenCalledWith('char-1', 10, 0);
      const store = useMessageStore.getState();
      expect(store.messages['char-1']).toEqual(mockMessages);
      expect(store.messages['char-1']).toHaveLength(4);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should fetch messages with custom pagination', async () => {
      // Arrange
      mockedApiService.getMessages = vi.fn().mockResolvedValue(mockMessagesResponse);

      // Act
      await useMessageStore.getState().fetchMessages('char-1', 50, 100);

      // Assert
      expect(mockedApiService.getMessages).toHaveBeenCalledWith('char-1', 50, 100);
      const store = useMessageStore.getState();
      expect(store.messages['char-1']).toEqual(mockMessages);
    });

    it('should set loading state while fetching messages', async () => {
      // Arrange
      let resolveFetch: any;
      const promise = new Promise<typeof mockMessagesResponse>((resolve) => {
        resolveFetch = resolve;
      });
      mockedApiService.getMessages = vi.fn().mockReturnValue(promise);

      // Act
      const fetchPromise = useMessageStore.getState().fetchMessages('char-1');

      // Assert - loading should be true during fetch
      expect(useMessageStore.getState().isLoading).toBe(true);

      // Resolve the promise
      resolveFetch(mockMessagesResponse);
      await fetchPromise;

      // Assert - loading should be false after fetch
      expect(useMessageStore.getState().isLoading).toBe(false);
    });

    it('should handle empty messages response', async () => {
      // Arrange
      const emptyResponse = { messages: [], total: 0 };
      mockedApiService.getMessages = vi.fn().mockResolvedValue(emptyResponse);

      // Act
      await useMessageStore.getState().fetchMessages('char-1');

      // Assert
      const store = useMessageStore.getState();
      expect(store.messages['char-1']).toEqual([]);
      expect(store.messages['char-1']).toHaveLength(0);
      expect(store.error).toBeNull();
    });

    it('should handle network error when fetching messages', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedApiService.getMessages = vi.fn().mockRejectedValue(networkError);

      // Act
      await useMessageStore.getState().fetchMessages('char-1');

      // Assert
      const store = useMessageStore.getState();
      expect(store.messages['char-1']).toBeUndefined();
      expect(store.error).toBe('Network Error');
      expect(store.isLoading).toBe(false);
    });

    it('should handle 404 error when fetching messages for nonexistent character', async () => {
      // Arrange
      const notFoundError = {
        response: {
          status: 404,
          data: { detail: 'Character not found' },
        },
      };
      mockedApiService.getMessages = vi.fn().mockRejectedValue(notFoundError);

      // Act
      await useMessageStore.getState().fetchMessages('nonexistent');

      // Assert
      const store = useMessageStore.getState();
      expect(store.error).toBeDefined();
      expect(store.isLoading).toBe(false);
    });

    it('should handle fetching messages for multiple characters independently', async () => {
      // Arrange
      const messagesChar1 = { messages: [mockUserMessage1], total: 1 };
      const messagesChar2 = { messages: [mockAssistantMessage1], total: 1 };
      mockedApiService.getMessages = vi
        .fn()
        .mockResolvedValueOnce(messagesChar1)
        .mockResolvedValueOnce(messagesChar2);

      // Act
      await useMessageStore.getState().fetchMessages('char-1');
      await useMessageStore.getState().fetchMessages('char-2');

      // Assert
      const store = useMessageStore.getState();
      expect(store.messages['char-1']).toEqual([mockUserMessage1]);
      expect(store.messages['char-2']).toEqual([mockAssistantMessage1]);
      expect(Object.keys(store.messages)).toHaveLength(2);
    });

    it('should overwrite previous messages when fetching again', async () => {
      // Arrange
      const firstFetch = { messages: [mockUserMessage1], total: 1 };
      const secondFetch = { messages: mockMessages, total: 4 };
      mockedApiService.getMessages = vi
        .fn()
        .mockResolvedValueOnce(firstFetch)
        .mockResolvedValueOnce(secondFetch);

      // Act
      await useMessageStore.getState().fetchMessages('char-1');
      await useMessageStore.getState().fetchMessages('char-1');

      // Assert
      const store = useMessageStore.getState();
      expect(store.messages['char-1']).toEqual(mockMessages);
      expect(store.messages['char-1']).toHaveLength(4);
    });

    it('should clear previous error on successful fetch', async () => {
      // Arrange
      useMessageStore.getState().error = 'Previous error';
      mockedApiService.getMessages = vi.fn().mockResolvedValue(mockMessagesResponse);

      // Act
      await useMessageStore.getState().fetchMessages('char-1');

      // Assert
      expect(useMessageStore.getState().error).toBeNull();
    });

    it('should handle negative limit and offset', async () => {
      // Arrange
      mockedApiService.getMessages = vi.fn().mockResolvedValue(mockMessagesResponse);

      // Act
      await useMessageStore.getState().fetchMessages('char-1', -10, -5);

      // Assert
      expect(mockedApiService.getMessages).toHaveBeenCalledWith('char-1', -10, -5);
    });

    it('should handle extremely large limit value', async () => {
      // Arrange
      mockedApiService.getMessages = vi.fn().mockResolvedValue(mockMessagesResponse);

      // Act
      await useMessageStore.getState().fetchMessages('char-1', 999999, 0);

      // Assert
      expect(mockedApiService.getMessages).toHaveBeenCalledWith('char-1', 999999, 0);
    });
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      // Arrange
      mockedApiService.sendMessage = vi.fn().mockResolvedValue(mockMessageResponse);
      useMessageStore.getState().messages['char-1'] = [];

      // Act
      await useMessageStore.getState().sendMessage('char-1', 'What is dialectics?');

      // Assert
      expect(mockedApiService.sendMessage).toHaveBeenCalledWith('char-1', {
        content: 'What is dialectics?',
      });
      const store = useMessageStore.getState();
      expect(store.messages['char-1']).toContainEqual(mockUserMessage1);
      expect(store.messages['char-1']).toContainEqual(mockAssistantMessage1);
      expect(store.messages['char-1']).toHaveLength(2);
      expect(store.isSending).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should set sending state while sending message', async () => {
      // Arrange
      let resolveSend: any;
      const promise = new Promise<typeof mockMessageResponse>((resolve) => {
        resolveSend = resolve;
      });
      mockedApiService.sendMessage = vi.fn().mockReturnValue(promise);
      useMessageStore.getState().messages['char-1'] = [];

      // Act
      const sendPromise = useMessageStore.getState().sendMessage('char-1', 'Hello');

      // Assert - sending should be true during send
      expect(useMessageStore.getState().isSending).toBe(true);

      // Resolve the promise
      resolveSend(mockMessageResponse);
      await sendPromise;

      // Assert - sending should be false after send
      expect(useMessageStore.getState().isSending).toBe(false);
    });

    it('should append messages to existing conversation', async () => {
      // Arrange
      useMessageStore.getState().messages['char-1'] = [mockUserMessage1, mockAssistantMessage1];
      const newUserMessage = {
        id: 'msg-new-1',
        role: 'user' as const,
        content: 'Another question',
        created_at: '2025-01-10T12:00:00Z',
      };
      const newAssistantMessage = {
        id: 'msg-new-2',
        role: 'assistant' as const,
        content: 'Another answer',
        created_at: '2025-01-10T12:00:05Z',
      };
      const newMessageResponse = {
        user_message: newUserMessage,
        assistant_message: newAssistantMessage,
      };
      mockedApiService.sendMessage = vi.fn().mockResolvedValue(newMessageResponse);

      // Act
      await useMessageStore.getState().sendMessage('char-1', 'Another question');

      // Assert
      const store = useMessageStore.getState();
      expect(store.messages['char-1']).toHaveLength(4);
      expect(store.messages['char-1'][2]).toEqual(newUserMessage);
      expect(store.messages['char-1'][3]).toEqual(newAssistantMessage);
    });

    it('should initialize messages array if not exists for character', async () => {
      // Arrange
      mockedApiService.sendMessage = vi.fn().mockResolvedValue(mockMessageResponse);

      // Act
      await useMessageStore.getState().sendMessage('char-new', 'First message');

      // Assert
      const store = useMessageStore.getState();
      expect(store.messages['char-new']).toBeDefined();
      expect(store.messages['char-new']).toHaveLength(2);
    });

    it('should handle empty message content', async () => {
      // Arrange
      const validationError = {
        response: {
          status: 400,
          data: { detail: 'Message content cannot be empty' },
        },
      };
      mockedApiService.sendMessage = vi.fn().mockRejectedValue(validationError);
      useMessageStore.getState().messages['char-1'] = [];

      // Act
      await useMessageStore.getState().sendMessage('char-1', '');

      // Assert
      const store = useMessageStore.getState();
      expect(store.error).toBeDefined();
      expect(store.messages['char-1']).toHaveLength(0);
      expect(store.isSending).toBe(false);
    });

    it('should handle extremely long message content', async () => {
      // Arrange
      const longContent = 'a'.repeat(100000);
      const longMessageResponse = {
        user_message: { ...mockUserMessage1, content: longContent },
        assistant_message: mockAssistantMessage1,
      };
      mockedApiService.sendMessage = vi.fn().mockResolvedValue(longMessageResponse);
      useMessageStore.getState().messages['char-1'] = [];

      // Act
      await useMessageStore.getState().sendMessage('char-1', longContent);

      // Assert
      const store = useMessageStore.getState();
      expect(store.messages['char-1'][0].content).toBe(longContent);
    });

    it('should handle special characters in message content', async () => {
      // Arrange
      const specialContent = 'Hello! @#$%^&*() <script>alert("xss")</script>';
      const specialMessageResponse = {
        user_message: { ...mockUserMessage1, content: specialContent },
        assistant_message: mockAssistantMessage1,
      };
      mockedApiService.sendMessage = vi.fn().mockResolvedValue(specialMessageResponse);
      useMessageStore.getState().messages['char-1'] = [];

      // Act
      await useMessageStore.getState().sendMessage('char-1', specialContent);

      // Assert
      const store = useMessageStore.getState();
      expect(store.messages['char-1'][0].content).toBe(specialContent);
    });

    it('should handle network error when sending message', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedApiService.sendMessage = vi.fn().mockRejectedValue(networkError);
      useMessageStore.getState().messages['char-1'] = [];

      // Act
      await useMessageStore.getState().sendMessage('char-1', 'Hello');

      // Assert
      const store = useMessageStore.getState();
      expect(store.error).toBe('Network Error');
      expect(store.messages['char-1']).toHaveLength(0);
      expect(store.isSending).toBe(false);
    });

    it('should handle 404 error when sending to nonexistent character', async () => {
      // Arrange
      const notFoundError = {
        response: {
          status: 404,
          data: { detail: 'Character not found' },
        },
      };
      mockedApiService.sendMessage = vi.fn().mockRejectedValue(notFoundError);

      // Act
      await useMessageStore.getState().sendMessage('nonexistent', 'Hello');

      // Assert
      const store = useMessageStore.getState();
      expect(store.error).toBeDefined();
      expect(store.isSending).toBe(false);
    });

    it('should handle timeout error when LLM takes too long', async () => {
      // Arrange
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 60000ms exceeded',
      };
      mockedApiService.sendMessage = vi.fn().mockRejectedValue(timeoutError);
      useMessageStore.getState().messages['char-1'] = [];

      // Act
      await useMessageStore.getState().sendMessage('char-1', 'Complex question');

      // Assert
      const store = useMessageStore.getState();
      expect(store.error).toBeDefined();
      expect(store.messages['char-1']).toHaveLength(0);
    });

    it('should handle 503 error when LLM service is unavailable', async () => {
      // Arrange
      const serviceUnavailableError = {
        response: {
          status: 503,
          data: { detail: 'LLM service unavailable' },
        },
      };
      mockedApiService.sendMessage = vi.fn().mockRejectedValue(serviceUnavailableError);
      useMessageStore.getState().messages['char-1'] = [];

      // Act
      await useMessageStore.getState().sendMessage('char-1', 'Hello');

      // Assert
      const store = useMessageStore.getState();
      expect(store.error).toBeDefined();
      expect(store.isSending).toBe(false);
    });

    it('should clear previous error on successful send', async () => {
      // Arrange
      useMessageStore.getState().error = 'Previous error';
      useMessageStore.getState().messages['char-1'] = [];
      mockedApiService.sendMessage = vi.fn().mockResolvedValue(mockMessageResponse);

      // Act
      await useMessageStore.getState().sendMessage('char-1', 'Hello');

      // Assert
      expect(useMessageStore.getState().error).toBeNull();
    });
  });

  describe('clearMessages', () => {
    it('should clear messages for a specific character', () => {
      // Arrange
      useMessageStore.getState().messages = {
        'char-1': mockMessages,
        'char-2': [mockUserMessage1],
      };

      // Act
      useMessageStore.getState().clearMessages('char-1');

      // Assert
      const store = useMessageStore.getState();
      expect(store.messages['char-1']).toEqual([]);
      expect(store.messages['char-2']).toEqual([mockUserMessage1]);
    });

    it('should handle clearing messages for character with no messages', () => {
      // Arrange
      useMessageStore.getState().messages = {
        'char-1': mockMessages,
      };

      // Act
      useMessageStore.getState().clearMessages('char-2');

      // Assert
      const store = useMessageStore.getState();
      expect(store.messages['char-2']).toEqual([]);
      expect(store.messages['char-1']).toEqual(mockMessages);
    });

    it('should handle clearing messages for nonexistent character', () => {
      // Arrange
      useMessageStore.getState().messages = {};

      // Act
      useMessageStore.getState().clearMessages('nonexistent');

      // Assert
      const store = useMessageStore.getState();
      expect(store.messages['nonexistent']).toEqual([]);
    });

    it('should not affect other character messages when clearing', () => {
      // Arrange
      useMessageStore.getState().messages = {
        'char-1': mockMessages,
        'char-2': [mockUserMessage1],
        'char-3': [mockAssistantMessage1],
      };

      // Act
      useMessageStore.getState().clearMessages('char-2');

      // Assert
      const store = useMessageStore.getState();
      expect(store.messages['char-1']).toEqual(mockMessages);
      expect(store.messages['char-2']).toEqual([]);
      expect(store.messages['char-3']).toEqual([mockAssistantMessage1]);
    });

    it('should clear messages multiple times for same character', () => {
      // Arrange
      useMessageStore.getState().messages = {
        'char-1': mockMessages,
      };

      // Act
      useMessageStore.getState().clearMessages('char-1');
      useMessageStore.getState().clearMessages('char-1');

      // Assert
      const store = useMessageStore.getState();
      expect(store.messages['char-1']).toEqual([]);
    });

    it('should allow fetching messages after clearing', async () => {
      // Arrange
      useMessageStore.getState().messages = {
        'char-1': mockMessages,
      };
      useMessageStore.getState().clearMessages('char-1');
      mockedApiService.getMessages = vi.fn().mockResolvedValue(mockMessagesResponse);

      // Act
      await useMessageStore.getState().fetchMessages('char-1');

      // Assert
      const store = useMessageStore.getState();
      expect(store.messages['char-1']).toEqual(mockMessages);
    });
  });

  describe('Multiple Character Context', () => {
    it('should maintain separate message histories for different characters', async () => {
      // Arrange
      const messagesChar1 = { messages: [mockUserMessage1], total: 1 };
      const messagesChar2 = { messages: [mockAssistantMessage1], total: 1 };
      mockedApiService.getMessages = vi
        .fn()
        .mockResolvedValueOnce(messagesChar1)
        .mockResolvedValueOnce(messagesChar2);

      // Act
      await useMessageStore.getState().fetchMessages('char-1');
      await useMessageStore.getState().fetchMessages('char-2');

      // Assert
      const store = useMessageStore.getState();
      expect(store.messages['char-1']).not.toEqual(store.messages['char-2']);
      expect(store.messages['char-1']).toHaveLength(1);
      expect(store.messages['char-2']).toHaveLength(1);
    });

    it('should handle sending messages to different characters independently', async () => {
      // Arrange
      const messageResponseChar1 = {
        user_message: { ...mockUserMessage1, id: 'msg-1a' },
        assistant_message: { ...mockAssistantMessage1, id: 'msg-1b' },
      };
      const messageResponseChar2 = {
        user_message: { ...mockUserMessage1, id: 'msg-2a' },
        assistant_message: { ...mockAssistantMessage1, id: 'msg-2b' },
      };
      mockedApiService.sendMessage = vi
        .fn()
        .mockResolvedValueOnce(messageResponseChar1)
        .mockResolvedValueOnce(messageResponseChar2);

      // Act
      await useMessageStore.getState().sendMessage('char-1', 'Question to char-1');
      await useMessageStore.getState().sendMessage('char-2', 'Question to char-2');

      // Assert
      const store = useMessageStore.getState();
      expect(store.messages['char-1'][0].id).toBe('msg-1a');
      expect(store.messages['char-2'][0].id).toBe('msg-2a');
    });

    it('should handle clearing messages for one character while preserving others', () => {
      // Arrange
      useMessageStore.getState().messages = {
        'char-1': mockMessages,
        'char-2': [mockUserMessage1],
        'char-3': [mockAssistantMessage1],
      };

      // Act
      useMessageStore.getState().clearMessages('char-1');

      // Assert
      const store = useMessageStore.getState();
      expect(store.messages['char-1']).toEqual([]);
      expect(store.messages['char-2']).toHaveLength(1);
      expect(store.messages['char-3']).toHaveLength(1);
    });
  });

  describe('Error State Management', () => {
    it('should persist error state across operations', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedApiService.getMessages = vi.fn().mockRejectedValue(networkError);

      // Act
      await useMessageStore.getState().fetchMessages('char-1');

      // Assert
      expect(useMessageStore.getState().error).toBe('Network Error');

      // Try another operation
      mockedApiService.sendMessage = vi.fn().mockRejectedValue(new Error('Another error'));
      await useMessageStore.getState().sendMessage('char-1', 'Hello');

      // Error should be updated
      expect(useMessageStore.getState().error).toBe('Another error');
    });

    it('should not mix loading and sending states', async () => {
      // Arrange
      let resolveFetch: any;
      const fetchPromise = new Promise<typeof mockMessagesResponse>((resolve) => {
        resolveFetch = resolve;
      });
      mockedApiService.getMessages = vi.fn().mockReturnValue(fetchPromise);

      // Act
      const fetchOp = useMessageStore.getState().fetchMessages('char-1');

      // Assert
      expect(useMessageStore.getState().isLoading).toBe(true);
      expect(useMessageStore.getState().isSending).toBe(false);

      resolveFetch(mockMessagesResponse);
      await fetchOp;
    });
  });
});
