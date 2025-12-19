/**
 * Group Message Store Unit Tests.
 *
 * Comprehensive tests for Zustand group message store covering:
 * - State initialization
 * - Fetching group messages
 * - Sending messages to groups (with last 5 messages)
 * - Handling multiple character responses
 * - Clearing group messages
 * - Loading states (per-group)
 * - Error handling
 * - Optimistic UI updates
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useGroupMessageStore } from '../groupMessageStore';
import { apiService } from '../../services/api';
import type { GroupMessage, CharacterResponse, GroupMessageResponse } from '../../types/group';
import type { Message } from '../../types/message';

// Mock the API service
vi.mock('../../services/api');
const mockedApiService = vi.mocked(apiService, true);

// Mock data
const mockUserMessage1: GroupMessage = {
  id: 'msg-user-1',
  role: 'user',
  content: 'What is dialectics?',
  created_at: '2025-01-01T10:00:00Z',
};

const mockCharacterMessage1: GroupMessage = {
  id: 'msg-char-1',
  role: 'assistant',
  content: 'Dialectics is the art of investigating or discussing truth through logical argumentation.',
  created_at: '2025-01-01T10:00:05Z',
  character_id: 'char-1',
  character_name: 'Hegel',
  avatar_url: '/api/characters/char-1/avatar',
};

const mockCharacterMessage2: GroupMessage = {
  id: 'msg-char-2',
  role: 'assistant',
  content: 'I agree with Hegel, but would add that dialectics involves thesis, antithesis, and synthesis.',
  created_at: '2025-01-01T10:00:10Z',
  character_id: 'char-2',
  character_name: 'Marx',
  avatar_url: '/api/characters/char-2/avatar',
};

const mockGroupMessages: GroupMessage[] = [
  mockUserMessage1,
  mockCharacterMessage1,
  mockCharacterMessage2,
];

const mockCharacterResponses: CharacterResponse[] = [
  {
    character_id: 'char-1',
    character_name: 'Hegel',
    message: 'Dialectics is the art of investigating or discussing truth through logical argumentation.',
    emotions: { joy: 70, sadness: 10, fear: 5, anger: 5, surprise: 10 },
  },
  {
    character_id: 'char-2',
    character_name: 'Marx',
    message: 'I agree with Hegel, but would add that dialectics involves thesis, antithesis, and synthesis.',
    emotions: { joy: 60, sadness: 10, fear: 10, anger: 10, surprise: 10 },
  },
];

const mockGroupMessageResponse: GroupMessageResponse = {
  responses: mockCharacterResponses,
  statistics: {
    total_time_ms: 1500,
    successful_count: 2,
    failed_count: 0,
  },
};

describe('GroupMessageStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useGroupMessageStore.getState();
    store.messages = {};
    store.isLoading = {};
    store.isSending = {};
    store.error = {};

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      // Arrange & Act
      const store = useGroupMessageStore.getState();

      // Assert
      expect(store.messages).toEqual({});
      expect(store.isLoading).toEqual({});
      expect(store.isSending).toEqual({});
      expect(store.error).toEqual({});
    });
  });

  describe('fetchGroupMessages', () => {
    it('should fetch messages for a group with default pagination', async () => {
      // Arrange
      const messagesResponse = { messages: mockGroupMessages, total: 3 };
      mockedApiService.getGroupMessages = vi.fn().mockResolvedValue(messagesResponse);

      // Act
      await useGroupMessageStore.getState().fetchGroupMessages('group-1');

      // Assert
      expect(mockedApiService.getGroupMessages).toHaveBeenCalledWith('group-1', 50, 0);
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-1']).toEqual(mockGroupMessages);
      expect(store.messages['group-1']).toHaveLength(3);
      expect(store.isLoading['group-1']).toBe(false);
      expect(store.error['group-1']).toBeNull();
    });

    it('should fetch messages with custom pagination', async () => {
      // Arrange
      const messagesResponse = { messages: mockGroupMessages, total: 3 };
      mockedApiService.getGroupMessages = vi.fn().mockResolvedValue(messagesResponse);

      // Act
      await useGroupMessageStore.getState().fetchGroupMessages('group-1', 100, 50);

      // Assert
      expect(mockedApiService.getGroupMessages).toHaveBeenCalledWith('group-1', 100, 50);
    });

    it('should set loading state while fetching messages', async () => {
      // Arrange
      let resolveFetch: any;
      const promise = new Promise<any>((resolve) => {
        resolveFetch = resolve;
      });
      mockedApiService.getGroupMessages = vi.fn().mockReturnValue(promise);

      // Act
      const fetchPromise = useGroupMessageStore.getState().fetchGroupMessages('group-1');

      // Assert - loading should be true during fetch
      expect(useGroupMessageStore.getState().isLoading['group-1']).toBe(true);

      // Resolve the promise
      resolveFetch({ messages: mockGroupMessages, total: 3 });
      await fetchPromise;

      // Assert - loading should be false after fetch
      expect(useGroupMessageStore.getState().isLoading['group-1']).toBe(false);
    });

    it('should handle empty messages response', async () => {
      // Arrange
      const emptyResponse = { messages: [], total: 0 };
      mockedApiService.getGroupMessages = vi.fn().mockResolvedValue(emptyResponse);

      // Act
      await useGroupMessageStore.getState().fetchGroupMessages('group-1');

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-1']).toEqual([]);
      expect(store.messages['group-1']).toHaveLength(0);
      expect(store.error['group-1']).toBeNull();
    });

    it('should handle network error when fetching messages', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedApiService.getGroupMessages = vi.fn().mockRejectedValue(networkError);

      // Act
      await useGroupMessageStore.getState().fetchGroupMessages('group-1');

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-1']).toBeUndefined();
      expect(store.error['group-1']).toBe('Network Error');
      expect(store.isLoading['group-1']).toBe(false);
    });

    it('should handle fetching messages for multiple groups independently', async () => {
      // Arrange
      const messagesGroup1 = { messages: [mockUserMessage1], total: 1 };
      const messagesGroup2 = { messages: [mockCharacterMessage1], total: 1 };
      mockedApiService.getGroupMessages = vi
        .fn()
        .mockResolvedValueOnce(messagesGroup1)
        .mockResolvedValueOnce(messagesGroup2);

      // Act
      await useGroupMessageStore.getState().fetchGroupMessages('group-1');
      await useGroupMessageStore.getState().fetchGroupMessages('group-2');

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-1']).toEqual([mockUserMessage1]);
      expect(store.messages['group-2']).toEqual([mockCharacterMessage1]);
      expect(Object.keys(store.messages)).toHaveLength(2);
    });

    it('should clear previous error on successful fetch', async () => {
      // Arrange
      useGroupMessageStore.getState().error['group-1'] = 'Previous error';
      const messagesResponse = { messages: mockGroupMessages, total: 3 };
      mockedApiService.getGroupMessages = vi.fn().mockResolvedValue(messagesResponse);

      // Act
      await useGroupMessageStore.getState().fetchGroupMessages('group-1');

      // Assert
      expect(useGroupMessageStore.getState().error['group-1']).toBeNull();
    });
  });

  describe('sendGroupMessage', () => {
    it('should send message to group and receive all character responses', async () => {
      // Arrange
      useGroupMessageStore.getState().messages['group-1'] = [];
      mockedApiService.sendGroupMessage = vi.fn().mockResolvedValue(mockGroupMessageResponse);

      // Act
      await useGroupMessageStore.getState().sendGroupMessage(
        'group-1',
        'What is dialectics?',
        ['char-1', 'char-2']
      );

      // Assert
      expect(mockedApiService.sendGroupMessage).toHaveBeenCalledWith({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: 'What is dialectics?',
          }),
        ]),
        character_ids: ['char-1', 'char-2'],
      });

      const store = useGroupMessageStore.getState();
      const messages = store.messages['group-1'];

      // Should have user message + 2 character responses
      expect(messages).toHaveLength(3);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('What is dialectics?');
      expect(messages[1].role).toBe('assistant');
      expect(messages[1].character_id).toBe('char-1');
      expect(messages[2].role).toBe('assistant');
      expect(messages[2].character_id).toBe('char-2');
      expect(store.isSending['group-1']).toBe(false);
      expect(store.error['group-1']).toBeNull();
    });

    it('should send last 5 messages as context', async () => {
      // Arrange - setup conversation with 10 messages
      const existingMessages: GroupMessage[] = [];
      for (let i = 0; i < 10; i++) {
        existingMessages.push({
          id: `msg-${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          created_at: new Date(2025, 0, 1, 10, i).toISOString(),
        });
      }
      useGroupMessageStore.getState().messages['group-1'] = existingMessages;
      mockedApiService.sendGroupMessage = vi.fn().mockResolvedValue(mockGroupMessageResponse);

      // Act
      await useGroupMessageStore.getState().sendGroupMessage(
        'group-1',
        'New message',
        ['char-1', 'char-2'],
        5 // messageLimit
      );

      // Assert
      const callArgs = mockedApiService.sendGroupMessage.mock.calls[0][0];
      // Should send last 5 messages + new user message = 6 total
      expect(callArgs.messages).toHaveLength(6);
      // Verify last 5 are the most recent from existing messages
      expect(callArgs.messages[0].id).toBe('msg-5');
      expect(callArgs.messages[4].id).toBe('msg-9');
      // Last one should be the new user message
      expect(callArgs.messages[5].content).toBe('New message');
    });

    it('should use default message limit of 5', async () => {
      // Arrange - setup conversation with 10 messages
      const existingMessages: GroupMessage[] = [];
      for (let i = 0; i < 10; i++) {
        existingMessages.push({
          id: `msg-${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          created_at: new Date(2025, 0, 1, 10, i).toISOString(),
        });
      }
      useGroupMessageStore.getState().messages['group-1'] = existingMessages;
      mockedApiService.sendGroupMessage = vi.fn().mockResolvedValue(mockGroupMessageResponse);

      // Act - don't specify messageLimit
      await useGroupMessageStore.getState().sendGroupMessage(
        'group-1',
        'New message',
        ['char-1', 'char-2']
      );

      // Assert
      const callArgs = mockedApiService.sendGroupMessage.mock.calls[0][0];
      expect(callArgs.messages).toHaveLength(6); // 5 + 1 new
    });

    it('should handle conversation with fewer than 5 messages', async () => {
      // Arrange - only 2 existing messages
      const existingMessages: GroupMessage[] = [
        { ...mockUserMessage1, id: 'msg-1' },
        { ...mockCharacterMessage1, id: 'msg-2' },
      ];
      useGroupMessageStore.getState().messages['group-1'] = existingMessages;
      mockedApiService.sendGroupMessage = vi.fn().mockResolvedValue(mockGroupMessageResponse);

      // Act
      await useGroupMessageStore.getState().sendGroupMessage(
        'group-1',
        'New message',
        ['char-1', 'char-2'],
        5
      );

      // Assert
      const callArgs = mockedApiService.sendGroupMessage.mock.calls[0][0];
      // Should send all 2 existing + 1 new = 3 total
      expect(callArgs.messages).toHaveLength(3);
      expect(callArgs.messages[0].id).toBe('msg-1');
      expect(callArgs.messages[1].id).toBe('msg-2');
      expect(callArgs.messages[2].content).toBe('New message');
    });

    it('should optimistically add user message before sending', async () => {
      // Arrange
      useGroupMessageStore.getState().messages['group-1'] = [];
      let resolveSend: any;
      const promise = new Promise<GroupMessageResponse>((resolve) => {
        resolveSend = resolve;
      });
      mockedApiService.sendGroupMessage = vi.fn().mockReturnValue(promise);

      // Act
      const sendPromise = useGroupMessageStore.getState().sendGroupMessage(
        'group-1',
        'Test message',
        ['char-1', 'char-2']
      );

      // Assert - user message should be added immediately
      const storeDuringSend = useGroupMessageStore.getState();
      expect(storeDuringSend.messages['group-1']).toHaveLength(1);
      expect(storeDuringSend.messages['group-1'][0].role).toBe('user');
      expect(storeDuringSend.messages['group-1'][0].content).toBe('Test message');

      // Resolve the promise
      resolveSend(mockGroupMessageResponse);
      await sendPromise;

      // Assert - should now have user message + character responses
      const storeAfterSend = useGroupMessageStore.getState();
      expect(storeAfterSend.messages['group-1']).toHaveLength(3);
    });

    it('should set sending state while sending message', async () => {
      // Arrange
      useGroupMessageStore.getState().messages['group-1'] = [];
      let resolveSend: any;
      const promise = new Promise<GroupMessageResponse>((resolve) => {
        resolveSend = resolve;
      });
      mockedApiService.sendGroupMessage = vi.fn().mockReturnValue(promise);

      // Act
      const sendPromise = useGroupMessageStore.getState().sendGroupMessage(
        'group-1',
        'Test',
        ['char-1', 'char-2']
      );

      // Assert - sending should be true during send
      expect(useGroupMessageStore.getState().isSending['group-1']).toBe(true);

      // Resolve the promise
      resolveSend(mockGroupMessageResponse);
      await sendPromise;

      // Assert - sending should be false after send
      expect(useGroupMessageStore.getState().isSending['group-1']).toBe(false);
    });

    it('should initialize messages array if not exists for group', async () => {
      // Arrange
      mockedApiService.sendGroupMessage = vi.fn().mockResolvedValue(mockGroupMessageResponse);

      // Act
      await useGroupMessageStore.getState().sendGroupMessage(
        'group-new',
        'First message',
        ['char-1', 'char-2']
      );

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-new']).toBeDefined();
      expect(store.messages['group-new']).toHaveLength(3); // user + 2 characters
    });

    it('should handle partial character responses (one character fails)', async () => {
      // Arrange
      useGroupMessageStore.getState().messages['group-1'] = [];
      const partialResponse: GroupMessageResponse = {
        responses: [
          mockCharacterResponses[0],
          {
            character_id: 'char-2',
            character_name: 'Marx',
            message: '',
            error: 'LLM service unavailable',
          },
        ],
        statistics: {
          total_time_ms: 1000,
          successful_count: 1,
          failed_count: 1,
        },
      };
      mockedApiService.sendGroupMessage = vi.fn().mockResolvedValue(partialResponse);

      // Act
      await useGroupMessageStore.getState().sendGroupMessage(
        'group-1',
        'Test',
        ['char-1', 'char-2']
      );

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-1']).toHaveLength(3); // user + 2 responses (one with error)
      expect(store.messages['group-1'][2]).toHaveProperty('error');
    });

    it('should handle network error when sending message', async () => {
      // Arrange
      useGroupMessageStore.getState().messages['group-1'] = [];
      const networkError = new Error('Network Error');
      mockedApiService.sendGroupMessage = vi.fn().mockRejectedValue(networkError);

      // Act
      await useGroupMessageStore.getState().sendGroupMessage(
        'group-1',
        'Test',
        ['char-1', 'char-2']
      );

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.error['group-1']).toBe('Network Error');
      // User message should still be there from optimistic update
      expect(store.messages['group-1']).toHaveLength(1);
      expect(store.isSending['group-1']).toBe(false);
    });

    it('should handle empty character_ids array', async () => {
      // Arrange
      useGroupMessageStore.getState().messages['group-1'] = [];
      const emptyResponse: GroupMessageResponse = {
        responses: [],
        statistics: {
          total_time_ms: 0,
          successful_count: 0,
          failed_count: 0,
        },
      };
      mockedApiService.sendGroupMessage = vi.fn().mockResolvedValue(emptyResponse);

      // Act
      await useGroupMessageStore.getState().sendGroupMessage('group-1', 'Test', []);

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-1']).toHaveLength(1); // only user message
    });

    it('should handle special characters in message content', async () => {
      // Arrange
      useGroupMessageStore.getState().messages['group-1'] = [];
      const specialContent = 'Hello! @#$%^&*() <script>alert("xss")</script>';
      mockedApiService.sendGroupMessage = vi.fn().mockResolvedValue(mockGroupMessageResponse);

      // Act
      await useGroupMessageStore.getState().sendGroupMessage(
        'group-1',
        specialContent,
        ['char-1', 'char-2']
      );

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-1'][0].content).toBe(specialContent);
    });

    it('should handle extremely long message content', async () => {
      // Arrange
      useGroupMessageStore.getState().messages['group-1'] = [];
      const longContent = 'a'.repeat(100000);
      mockedApiService.sendGroupMessage = vi.fn().mockResolvedValue(mockGroupMessageResponse);

      // Act
      await useGroupMessageStore.getState().sendGroupMessage(
        'group-1',
        longContent,
        ['char-1', 'char-2']
      );

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-1'][0].content).toBe(longContent);
    });

    it('should append messages to existing conversation', async () => {
      // Arrange
      useGroupMessageStore.getState().messages['group-1'] = [mockUserMessage1, mockCharacterMessage1];
      mockedApiService.sendGroupMessage = vi.fn().mockResolvedValue(mockGroupMessageResponse);

      // Act
      await useGroupMessageStore.getState().sendGroupMessage(
        'group-1',
        'Another question',
        ['char-1', 'char-2']
      );

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-1']).toHaveLength(5); // 2 existing + 1 new user + 2 responses
      expect(store.messages['group-1'][0]).toEqual(mockUserMessage1);
      expect(store.messages['group-1'][1]).toEqual(mockCharacterMessage1);
    });

    it('should clear previous error on successful send', async () => {
      // Arrange
      useGroupMessageStore.getState().error['group-1'] = 'Previous error';
      useGroupMessageStore.getState().messages['group-1'] = [];
      mockedApiService.sendGroupMessage = vi.fn().mockResolvedValue(mockGroupMessageResponse);

      // Act
      await useGroupMessageStore.getState().sendGroupMessage(
        'group-1',
        'Test',
        ['char-1', 'char-2']
      );

      // Assert
      expect(useGroupMessageStore.getState().error['group-1']).toBeNull();
    });

    it('should handle responses with emotions', async () => {
      // Arrange
      useGroupMessageStore.getState().messages['group-1'] = [];
      mockedApiService.sendGroupMessage = vi.fn().mockResolvedValue(mockGroupMessageResponse);

      // Act
      await useGroupMessageStore.getState().sendGroupMessage(
        'group-1',
        'Test',
        ['char-1', 'char-2']
      );

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-1'][1]).toHaveProperty('emotions');
      expect(store.messages['group-1'][1].emotions).toEqual({
        joy: 70,
        sadness: 10,
        fear: 5,
        anger: 5,
        surprise: 10,
      });
    });

    it('should handle timeout error when LLM takes too long', async () => {
      // Arrange
      useGroupMessageStore.getState().messages['group-1'] = [];
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 60000ms exceeded',
      };
      mockedApiService.sendGroupMessage = vi.fn().mockRejectedValue(timeoutError);

      // Act
      await useGroupMessageStore.getState().sendGroupMessage(
        'group-1',
        'Complex question',
        ['char-1', 'char-2']
      );

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.error['group-1']).toBeDefined();
      expect(store.isSending['group-1']).toBe(false);
    });
  });

  describe('clearGroupMessages', () => {
    it('should clear messages for a specific group', () => {
      // Arrange
      useGroupMessageStore.getState().messages = {
        'group-1': mockGroupMessages,
        'group-2': [mockUserMessage1],
      };

      // Act
      useGroupMessageStore.getState().clearGroupMessages('group-1');

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-1']).toEqual([]);
      expect(store.messages['group-2']).toEqual([mockUserMessage1]);
    });

    it('should handle clearing messages for group with no messages', () => {
      // Arrange
      useGroupMessageStore.getState().messages = {
        'group-1': mockGroupMessages,
      };

      // Act
      useGroupMessageStore.getState().clearGroupMessages('group-2');

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-2']).toEqual([]);
      expect(store.messages['group-1']).toEqual(mockGroupMessages);
    });

    it('should not affect other group messages when clearing', () => {
      // Arrange
      useGroupMessageStore.getState().messages = {
        'group-1': mockGroupMessages,
        'group-2': [mockUserMessage1],
        'group-3': [mockCharacterMessage1],
      };

      // Act
      useGroupMessageStore.getState().clearGroupMessages('group-2');

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-1']).toEqual(mockGroupMessages);
      expect(store.messages['group-2']).toEqual([]);
      expect(store.messages['group-3']).toEqual([mockCharacterMessage1]);
    });

    it('should allow fetching messages after clearing', async () => {
      // Arrange
      useGroupMessageStore.getState().messages = {
        'group-1': mockGroupMessages,
      };
      useGroupMessageStore.getState().clearGroupMessages('group-1');
      const messagesResponse = { messages: mockGroupMessages, total: 3 };
      mockedApiService.getGroupMessages = vi.fn().mockResolvedValue(messagesResponse);

      // Act
      await useGroupMessageStore.getState().fetchGroupMessages('group-1');

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-1']).toEqual(mockGroupMessages);
    });
  });

  describe('addCharacterResponses', () => {
    it('should add character responses to group messages', () => {
      // Arrange
      useGroupMessageStore.getState().messages['group-1'] = [mockUserMessage1];

      // Act
      useGroupMessageStore.getState().addCharacterResponses('group-1', mockCharacterResponses);

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-1']).toHaveLength(3);
      expect(store.messages['group-1'][1].role).toBe('assistant');
      expect(store.messages['group-1'][1].character_id).toBe('char-1');
      expect(store.messages['group-1'][2].role).toBe('assistant');
      expect(store.messages['group-1'][2].character_id).toBe('char-2');
    });

    it('should initialize messages array if not exists', () => {
      // Act
      useGroupMessageStore.getState().addCharacterResponses('group-new', mockCharacterResponses);

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-new']).toBeDefined();
      expect(store.messages['group-new']).toHaveLength(2);
    });

    it('should handle empty responses array', () => {
      // Arrange
      useGroupMessageStore.getState().messages['group-1'] = [mockUserMessage1];

      // Act
      useGroupMessageStore.getState().addCharacterResponses('group-1', []);

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-1']).toHaveLength(1); // unchanged
    });

    it('should append responses to existing messages', () => {
      // Arrange
      useGroupMessageStore.getState().messages['group-1'] = mockGroupMessages;

      // Act
      useGroupMessageStore.getState().addCharacterResponses('group-1', mockCharacterResponses);

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-1']).toHaveLength(5); // 3 existing + 2 new
    });

    it('should preserve character response metadata', () => {
      // Arrange
      useGroupMessageStore.getState().messages['group-1'] = [];

      // Act
      useGroupMessageStore.getState().addCharacterResponses('group-1', mockCharacterResponses);

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.messages['group-1'][0]).toHaveProperty('character_id', 'char-1');
      expect(store.messages['group-1'][0]).toHaveProperty('character_name', 'Hegel');
      expect(store.messages['group-1'][0]).toHaveProperty('emotions');
    });
  });

  describe('Per-Group State Management', () => {
    it('should maintain separate loading states for different groups', async () => {
      // Arrange
      let resolveFetch1: any;
      let resolveFetch2: any;
      const promise1 = new Promise<any>((resolve) => { resolveFetch1 = resolve; });
      const promise2 = new Promise<any>((resolve) => { resolveFetch2 = resolve; });
      mockedApiService.getGroupMessages = vi
        .fn()
        .mockReturnValueOnce(promise1)
        .mockReturnValueOnce(promise2);

      // Act
      const fetch1 = useGroupMessageStore.getState().fetchGroupMessages('group-1');
      const fetch2 = useGroupMessageStore.getState().fetchGroupMessages('group-2');

      // Assert - both should be loading
      expect(useGroupMessageStore.getState().isLoading['group-1']).toBe(true);
      expect(useGroupMessageStore.getState().isLoading['group-2']).toBe(true);

      // Resolve first group
      resolveFetch1({ messages: [], total: 0 });
      await fetch1;

      // Assert - group-1 done, group-2 still loading
      expect(useGroupMessageStore.getState().isLoading['group-1']).toBe(false);
      expect(useGroupMessageStore.getState().isLoading['group-2']).toBe(true);

      // Resolve second group
      resolveFetch2({ messages: [], total: 0 });
      await fetch2;

      // Assert - both done
      expect(useGroupMessageStore.getState().isLoading['group-2']).toBe(false);
    });

    it('should maintain separate sending states for different groups', async () => {
      // Arrange
      useGroupMessageStore.getState().messages = { 'group-1': [], 'group-2': [] };
      let resolveSend1: any;
      let resolveSend2: any;
      const promise1 = new Promise<GroupMessageResponse>((resolve) => { resolveSend1 = resolve; });
      const promise2 = new Promise<GroupMessageResponse>((resolve) => { resolveSend2 = resolve; });
      mockedApiService.sendGroupMessage = vi
        .fn()
        .mockReturnValueOnce(promise1)
        .mockReturnValueOnce(promise2);

      // Act
      const send1 = useGroupMessageStore.getState().sendGroupMessage('group-1', 'Test', ['char-1']);
      const send2 = useGroupMessageStore.getState().sendGroupMessage('group-2', 'Test', ['char-2']);

      // Assert - both should be sending
      expect(useGroupMessageStore.getState().isSending['group-1']).toBe(true);
      expect(useGroupMessageStore.getState().isSending['group-2']).toBe(true);

      // Resolve first group
      resolveSend1(mockGroupMessageResponse);
      await send1;

      // Assert - group-1 done, group-2 still sending
      expect(useGroupMessageStore.getState().isSending['group-1']).toBe(false);
      expect(useGroupMessageStore.getState().isSending['group-2']).toBe(true);

      // Resolve second group
      resolveSend2(mockGroupMessageResponse);
      await send2;

      // Assert - both done
      expect(useGroupMessageStore.getState().isSending['group-2']).toBe(false);
    });

    it('should maintain separate error states for different groups', async () => {
      // Arrange
      mockedApiService.getGroupMessages = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error for group-1'))
        .mockResolvedValueOnce({ messages: [], total: 0 });

      // Act
      await useGroupMessageStore.getState().fetchGroupMessages('group-1');
      await useGroupMessageStore.getState().fetchGroupMessages('group-2');

      // Assert
      const store = useGroupMessageStore.getState();
      expect(store.error['group-1']).toBe('Error for group-1');
      expect(store.error['group-2']).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle message with custom limit of 0', async () => {
      // Arrange
      useGroupMessageStore.getState().messages['group-1'] = mockGroupMessages;
      mockedApiService.sendGroupMessage = vi.fn().mockResolvedValue(mockGroupMessageResponse);

      // Act
      await useGroupMessageStore.getState().sendGroupMessage(
        'group-1',
        'New message',
        ['char-1'],
        0 // no previous messages
      );

      // Assert
      const callArgs = mockedApiService.sendGroupMessage.mock.calls[0][0];
      // Should only send the new user message
      expect(callArgs.messages).toHaveLength(1);
      expect(callArgs.messages[0].content).toBe('New message');
    });

    it('should handle message with very large limit', async () => {
      // Arrange
      const messages: GroupMessage[] = [];
      for (let i = 0; i < 100; i++) {
        messages.push({
          id: `msg-${i}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          created_at: new Date().toISOString(),
        });
      }
      useGroupMessageStore.getState().messages['group-1'] = messages;
      mockedApiService.sendGroupMessage = vi.fn().mockResolvedValue(mockGroupMessageResponse);

      // Act
      await useGroupMessageStore.getState().sendGroupMessage(
        'group-1',
        'New message',
        ['char-1'],
        1000 // limit larger than existing messages
      );

      // Assert
      const callArgs = mockedApiService.sendGroupMessage.mock.calls[0][0];
      // Should send all 100 existing messages + new one
      expect(callArgs.messages).toHaveLength(101);
    });

    it('should handle concurrent sends to same group', async () => {
      // Arrange
      useGroupMessageStore.getState().messages['group-1'] = [];
      mockedApiService.sendGroupMessage = vi.fn().mockResolvedValue(mockGroupMessageResponse);

      // Act - send two messages concurrently
      await Promise.all([
        useGroupMessageStore.getState().sendGroupMessage('group-1', 'Message 1', ['char-1']),
        useGroupMessageStore.getState().sendGroupMessage('group-1', 'Message 2', ['char-1']),
      ]);

      // Assert
      const store = useGroupMessageStore.getState();
      // Should have both user messages + responses
      expect(store.messages['group-1'].length).toBeGreaterThanOrEqual(4);
    });
  });
});
