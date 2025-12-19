/**
 * EmotionDisplay Integration Tests.
 *
 * Comprehensive integration tests for emotion display feature covering:
 * - API to UI data flow with emotions
 * - Store integration with emotion data
 * - Complete message flow including emotions
 * - AssistantMessage and EmotionDisplay component integration
 * - Real-world usage scenarios
 * - Error handling with emotion data
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useMessageStore } from '../../store/messageStore';
import { apiService } from '../../services/api';
import { AssistantMessage } from '../../components/AssistantMessage';
import type { Emotions, MessageResponse, Message } from '../../types/message';

describe('EmotionDisplay Integration Tests', () => {
  let mockClient: any;

  beforeEach(() => {
    // Reset message store
    useMessageStore.setState({
      messages: {},
      isLoading: false,
      isSending: false,
      error: null,
    });

    // Create mock axios client
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      defaults: { baseURL: '/api' },
    };

    // Set the mock client on apiService
    apiService.setClient(mockClient);

    vi.clearAllMocks();
  });

  describe('API to UI Data Flow', () => {
    it('should receive emotions from API and display in UI', async () => {
      const mockEmotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };

      const mockMessageResponse: MessageResponse = {
        user_message: {
          id: 'msg-1',
          role: 'user',
          content: 'What is dialectics?',
          created_at: '2025-01-10T10:00:00Z',
        },
        assistant_message: {
          id: 'msg-2',
          role: 'assistant',
          content: 'Dialectics is the method of reasoning.',
          created_at: '2025-01-10T10:00:05Z',
          emotions: mockEmotions,
        },
      };

      mockClient.post.mockResolvedValue({ data: mockMessageResponse });

      // Act - Send message through store
      await useMessageStore.getState().sendMessage('char-1', 'What is dialectics?');

      // Assert - Verify message in store has emotions
      const messages = useMessageStore.getState().messages['char-1'];
      expect(messages).toHaveLength(2);

      const assistantMessage = messages[1];
      expect(assistantMessage.role).toBe('assistant');
      expect(assistantMessage.emotions).toEqual(mockEmotions);
    });

    it('should render emotions from API response in AssistantMessage component', async () => {
      const mockEmotions: Emotions = {
        fear: 15,
        anger: 45,
        sadness: 10,
        disgust: 5,
        joy: 75,
      };

      const mockMessageResponse: MessageResponse = {
        user_message: {
          id: 'msg-1',
          role: 'user',
          content: 'Tell me about philosophy',
          created_at: '2025-01-10T10:00:00Z',
        },
        assistant_message: {
          id: 'msg-2',
          role: 'assistant',
          content: 'Philosophy is the study of wisdom.',
          created_at: '2025-01-10T10:00:05Z',
          emotions: mockEmotions,
        },
      };

      mockClient.post.mockResolvedValue({ data: mockMessageResponse });

      // Act - Send message and get response
      await useMessageStore.getState().sendMessage('char-1', 'Tell me about philosophy');

      const messages = useMessageStore.getState().messages['char-1'];
      const assistantMessage = messages[1];

      // Render AssistantMessage with the message data
      render(
        <AssistantMessage
          content={assistantMessage.content}
          timestamp={assistantMessage.created_at}
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId={assistantMessage.id}
          emotions={assistantMessage.emotions}
        />
      );

      // Assert - Verify emotions are displayed
      expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('should handle API response without emotions gracefully', async () => {
      const mockMessageResponse: MessageResponse = {
        user_message: {
          id: 'msg-1',
          role: 'user',
          content: 'Hello',
          created_at: '2025-01-10T10:00:00Z',
        },
        assistant_message: {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hello, how can I help?',
          created_at: '2025-01-10T10:00:05Z',
          // No emotions property
        },
      };

      mockClient.post.mockResolvedValue({ data: mockMessageResponse });

      // Act
      await useMessageStore.getState().sendMessage('char-1', 'Hello');

      const messages = useMessageStore.getState().messages['char-1'];
      const assistantMessage = messages[1];

      // Render without emotions
      render(
        <AssistantMessage
          content={assistantMessage.content}
          timestamp={assistantMessage.created_at}
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId={assistantMessage.id}
          emotions={assistantMessage.emotions}
        />
      );

      // Assert - No emotion display should be present
      expect(screen.queryByTestId('emotion-display')).not.toBeInTheDocument();
      expect(screen.getByText('Hello, how can I help?')).toBeInTheDocument();
    });

    it('should parse emotions correctly from MessageResponse', async () => {
      const mockEmotions: Emotions = {
        fear: 0,
        anger: 33,
        sadness: 34,
        disgust: 66,
        joy: 67,
      };

      const mockMessageResponse: MessageResponse = {
        user_message: {
          id: 'msg-1',
          role: 'user',
          content: 'Test message',
          created_at: '2025-01-10T10:00:00Z',
        },
        assistant_message: {
          id: 'msg-2',
          role: 'assistant',
          content: 'Test response',
          created_at: '2025-01-10T10:00:05Z',
          emotions: mockEmotions,
        },
      };

      mockClient.post.mockResolvedValue({ data: mockMessageResponse });

      // Act
      await useMessageStore.getState().sendMessage('char-1', 'Test message');

      // Assert - Check each emotion value is correctly parsed
      const messages = useMessageStore.getState().messages['char-1'];
      const assistantMessage = messages[1];

      expect(assistantMessage.emotions?.fear).toBe(0);
      expect(assistantMessage.emotions?.anger).toBe(33);
      expect(assistantMessage.emotions?.sadness).toBe(34);
      expect(assistantMessage.emotions?.disgust).toBe(66);
      expect(assistantMessage.emotions?.joy).toBe(67);
    });

    it('should handle emotions with all maximum values (100)', async () => {
      const mockEmotions: Emotions = {
        fear: 100,
        anger: 100,
        sadness: 100,
        disgust: 100,
        joy: 100,
      };

      const mockMessageResponse: MessageResponse = {
        user_message: {
          id: 'msg-1',
          role: 'user',
          content: 'Extreme test',
          created_at: '2025-01-10T10:00:00Z',
        },
        assistant_message: {
          id: 'msg-2',
          role: 'assistant',
          content: 'Extreme response',
          created_at: '2025-01-10T10:00:05Z',
          emotions: mockEmotions,
        },
      };

      mockClient.post.mockResolvedValue({ data: mockMessageResponse });

      await useMessageStore.getState().sendMessage('char-1', 'Extreme test');

      const messages = useMessageStore.getState().messages['char-1'];
      const assistantMessage = messages[1];

      render(
        <AssistantMessage
          content={assistantMessage.content}
          timestamp={assistantMessage.created_at}
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId={assistantMessage.id}
          emotions={assistantMessage.emotions}
        />
      );

      expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
      expect(screen.getAllByText('100')).toHaveLength(5);
    });
  });

  describe('Store Integration', () => {
    it('should store emotions correctly in message store', async () => {
      const mockEmotions: Emotions = {
        fear: 20,
        anger: 40,
        sadness: 60,
        disgust: 80,
        joy: 100,
      };

      const mockMessageResponse: MessageResponse = {
        user_message: {
          id: 'msg-1',
          role: 'user',
          content: 'Store test',
          created_at: '2025-01-10T10:00:00Z',
        },
        assistant_message: {
          id: 'msg-2',
          role: 'assistant',
          content: 'Store response',
          created_at: '2025-01-10T10:00:05Z',
          emotions: mockEmotions,
        },
      };

      mockClient.post.mockResolvedValue({ data: mockMessageResponse });

      // Act
      await useMessageStore.getState().sendMessage('char-1', 'Store test');

      // Assert - Verify store has correct emotion data
      const state = useMessageStore.getState();
      const messages = state.messages['char-1'];
      const assistantMessage = messages.find((m) => m.role === 'assistant');

      expect(assistantMessage).toBeDefined();
      expect(assistantMessage?.emotions).toEqual(mockEmotions);
    });

    it('should handle multiple messages with different emotions', async () => {
      const emotions1: Emotions = {
        fear: 10,
        anger: 20,
        sadness: 30,
        disgust: 40,
        joy: 50,
      };

      const emotions2: Emotions = {
        fear: 60,
        anger: 70,
        sadness: 80,
        disgust: 90,
        joy: 100,
      };

      const response1: MessageResponse = {
        user_message: {
          id: 'msg-1',
          role: 'user',
          content: 'First message',
          created_at: '2025-01-10T10:00:00Z',
        },
        assistant_message: {
          id: 'msg-2',
          role: 'assistant',
          content: 'First response',
          created_at: '2025-01-10T10:00:05Z',
          emotions: emotions1,
        },
      };

      const response2: MessageResponse = {
        user_message: {
          id: 'msg-3',
          role: 'user',
          content: 'Second message',
          created_at: '2025-01-10T10:01:00Z',
        },
        assistant_message: {
          id: 'msg-4',
          role: 'assistant',
          content: 'Second response',
          created_at: '2025-01-10T10:01:05Z',
          emotions: emotions2,
        },
      };

      mockClient.post
        .mockResolvedValueOnce({ data: response1 })
        .mockResolvedValueOnce({ data: response2 });

      // Act - Send two messages
      await useMessageStore.getState().sendMessage('char-1', 'First message');
      await useMessageStore.getState().sendMessage('char-1', 'Second message');

      // Assert
      const messages = useMessageStore.getState().messages['char-1'];
      expect(messages).toHaveLength(4);

      const firstAssistantMessage = messages[1];
      const secondAssistantMessage = messages[3];

      expect(firstAssistantMessage.emotions).toEqual(emotions1);
      expect(secondAssistantMessage.emotions).toEqual(emotions2);
    });

    it('should persist emotions through store operations', async () => {
      const mockEmotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };

      const mockMessageResponse: MessageResponse = {
        user_message: {
          id: 'msg-1',
          role: 'user',
          content: 'Persistence test',
          created_at: '2025-01-10T10:00:00Z',
        },
        assistant_message: {
          id: 'msg-2',
          role: 'assistant',
          content: 'Persistence response',
          created_at: '2025-01-10T10:00:05Z',
          emotions: mockEmotions,
        },
      };

      mockClient.post.mockResolvedValue({ data: mockMessageResponse });

      // Act - Send message
      await useMessageStore.getState().sendMessage('char-1', 'Persistence test');

      // Get initial state
      let messages = useMessageStore.getState().messages['char-1'];
      const initialEmotions = messages[1].emotions;

      // Trigger state access multiple times
      messages = useMessageStore.getState().messages['char-1'];
      const laterEmotions = messages[1].emotions;

      // Assert - Emotions should persist
      expect(initialEmotions).toEqual(mockEmotions);
      expect(laterEmotions).toEqual(mockEmotions);
      expect(initialEmotions).toBe(laterEmotions);
    });

    it('should handle mixed messages (some with emotions, some without)', async () => {
      const emotionsPresent: Emotions = {
        fear: 30,
        anger: 40,
        sadness: 50,
        disgust: 60,
        joy: 70,
      };

      const response1: MessageResponse = {
        user_message: {
          id: 'msg-1',
          role: 'user',
          content: 'With emotions',
          created_at: '2025-01-10T10:00:00Z',
        },
        assistant_message: {
          id: 'msg-2',
          role: 'assistant',
          content: 'Response with emotions',
          created_at: '2025-01-10T10:00:05Z',
          emotions: emotionsPresent,
        },
      };

      const response2: MessageResponse = {
        user_message: {
          id: 'msg-3',
          role: 'user',
          content: 'Without emotions',
          created_at: '2025-01-10T10:01:00Z',
        },
        assistant_message: {
          id: 'msg-4',
          role: 'assistant',
          content: 'Response without emotions',
          created_at: '2025-01-10T10:01:05Z',
          // No emotions
        },
      };

      mockClient.post
        .mockResolvedValueOnce({ data: response1 })
        .mockResolvedValueOnce({ data: response2 });

      // Act
      await useMessageStore.getState().sendMessage('char-1', 'With emotions');
      await useMessageStore.getState().sendMessage('char-1', 'Without emotions');

      // Assert
      const messages = useMessageStore.getState().messages['char-1'];
      expect(messages[1].emotions).toEqual(emotionsPresent);
      expect(messages[3].emotions).toBeUndefined();
    });
  });

  describe('Complete Message Flow', () => {
    it('should complete full flow: send message -> receive emotions -> display emotions', async () => {
      const mockEmotions: Emotions = {
        fear: 15,
        anger: 45,
        sadness: 10,
        disgust: 5,
        joy: 75,
      };

      const mockMessageResponse: MessageResponse = {
        user_message: {
          id: 'msg-1',
          role: 'user',
          content: 'Full flow test',
          created_at: '2025-01-10T10:00:00Z',
        },
        assistant_message: {
          id: 'msg-2',
          role: 'assistant',
          content: 'This is a complete response with emotions.',
          created_at: '2025-01-10T10:00:05Z',
          character_id: 'char-1',
          emotions: mockEmotions,
        },
      };

      mockClient.post.mockResolvedValue({ data: mockMessageResponse });

      // Step 1: Send message
      await useMessageStore.getState().sendMessage('char-1', 'Full flow test');

      // Step 2: Get message from store
      const messages = useMessageStore.getState().messages['char-1'];
      const assistantMessage = messages[1];

      // Step 3: Render component with message
      render(
        <AssistantMessage
          content={assistantMessage.content}
          timestamp={assistantMessage.created_at}
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId={assistantMessage.id}
          emotions={assistantMessage.emotions}
        />
      );

      // Step 4: Verify complete UI
      expect(screen.getByText('Hegel')).toBeInTheDocument();
      expect(screen.getByText('This is a complete response with emotions.')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
      expect(screen.getByText(/Страх/)).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('should handle emotion display in conversation context', async () => {
      const emotions1: Emotions = {
        fear: 20,
        anger: 30,
        sadness: 40,
        disgust: 50,
        joy: 60,
      };

      const emotions2: Emotions = {
        fear: 70,
        anger: 80,
        sadness: 10,
        disgust: 5,
        joy: 90,
      };

      const response1: MessageResponse = {
        user_message: {
          id: 'msg-1',
          role: 'user',
          content: 'First question',
          created_at: '2025-01-10T10:00:00Z',
        },
        assistant_message: {
          id: 'msg-2',
          role: 'assistant',
          content: 'First answer',
          created_at: '2025-01-10T10:00:05Z',
          emotions: emotions1,
        },
      };

      const response2: MessageResponse = {
        user_message: {
          id: 'msg-3',
          role: 'user',
          content: 'Second question',
          created_at: '2025-01-10T10:01:00Z',
        },
        assistant_message: {
          id: 'msg-4',
          role: 'assistant',
          content: 'Second answer',
          created_at: '2025-01-10T10:01:05Z',
          emotions: emotions2,
        },
      };

      mockClient.post
        .mockResolvedValueOnce({ data: response1 })
        .mockResolvedValueOnce({ data: response2 });

      // Send two messages in conversation
      await useMessageStore.getState().sendMessage('char-1', 'First question');
      await useMessageStore.getState().sendMessage('char-1', 'Second question');

      const messages = useMessageStore.getState().messages['char-1'];

      // Render first assistant message
      const { unmount } = render(
        <AssistantMessage
          content={messages[1].content}
          timestamp={messages[1].created_at}
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId={messages[1].id}
          emotions={messages[1].emotions}
        />
      );

      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('60')).toBeInTheDocument();

      unmount();

      // Render second assistant message
      render(
        <AssistantMessage
          content={messages[3].content}
          timestamp={messages[3].created_at}
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId={messages[3].id}
          emotions={messages[3].emotions}
        />
      );

      expect(screen.getByText('70')).toBeInTheDocument();
      expect(screen.getByText('90')).toBeInTheDocument();
    });

    it('should verify emotions appear between header and content in DOM', async () => {
      const mockEmotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };

      const mockMessageResponse: MessageResponse = {
        user_message: {
          id: 'msg-1',
          role: 'user',
          content: 'DOM order test',
          created_at: '2025-01-10T10:00:00Z',
        },
        assistant_message: {
          id: 'msg-2',
          role: 'assistant',
          content: 'DOM order response',
          created_at: '2025-01-10T10:00:05Z',
          emotions: mockEmotions,
        },
      };

      mockClient.post.mockResolvedValue({ data: mockMessageResponse });

      await useMessageStore.getState().sendMessage('char-1', 'DOM order test');

      const messages = useMessageStore.getState().messages['char-1'];
      const assistantMessage = messages[1];

      const { container } = render(
        <AssistantMessage
          content={assistantMessage.content}
          timestamp={assistantMessage.created_at}
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId={assistantMessage.id}
          emotions={assistantMessage.emotions}
        />
      );

      const messageContainer = screen.getByTestId('message-assistant-msg-2');
      const bubble = messageContainer.querySelector('.assistant-message-bubble');
      const children = Array.from(bubble?.children || []);

      const headerIndex = children.findIndex((child) =>
        child.classList.contains('assistant-message-header')
      );
      const emotionIndex = children.findIndex((child) => child.classList.contains('emotion-display'));
      const contentIndex = children.findIndex((child) =>
        child.classList.contains('assistant-message-content')
      );

      expect(headerIndex).toBeGreaterThanOrEqual(0);
      expect(emotionIndex).toBeGreaterThan(headerIndex);
      expect(contentIndex).toBeGreaterThan(emotionIndex);
    });
  });

  describe('Error Handling', () => {
    it('should handle API error and not crash when emotions expected', async () => {
      mockClient.post.mockRejectedValue(new Error('Network Error'));

      // Act
      await useMessageStore.getState().sendMessage('char-1', 'Error test');

      // Assert - Store should have error, but no crash
      const state = useMessageStore.getState();
      expect(state.error).toBe('Network Error');
      expect(state.messages['char-1'] || []).toHaveLength(0);
    });

    it('should handle malformed emotion data gracefully', async () => {
      const mockMessageResponse = {
        user_message: {
          id: 'msg-1',
          role: 'user',
          content: 'Malformed test',
          created_at: '2025-01-10T10:00:00Z',
        },
        assistant_message: {
          id: 'msg-2',
          role: 'assistant',
          content: 'Malformed response',
          created_at: '2025-01-10T10:00:05Z',
          emotions: null, // Invalid emotions
        },
      };

      mockClient.post.mockResolvedValue({ data: mockMessageResponse });

      await useMessageStore.getState().sendMessage('char-1', 'Malformed test');

      const messages = useMessageStore.getState().messages['char-1'];
      const assistantMessage = messages[1];

      // Render should not crash with null emotions
      render(
        <AssistantMessage
          content={assistantMessage.content}
          timestamp={assistantMessage.created_at}
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId={assistantMessage.id}
          emotions={assistantMessage.emotions as any}
        />
      );

      // Should render message without emotions
      expect(screen.getByText('Malformed response')).toBeInTheDocument();
      expect(screen.queryByTestId('emotion-display')).not.toBeInTheDocument();
    });

    it('should recover from error and display emotions on retry', async () => {
      const mockEmotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };

      const mockMessageResponse: MessageResponse = {
        user_message: {
          id: 'msg-1',
          role: 'user',
          content: 'Retry test',
          created_at: '2025-01-10T10:00:00Z',
        },
        assistant_message: {
          id: 'msg-2',
          role: 'assistant',
          content: 'Retry response',
          created_at: '2025-01-10T10:00:05Z',
          emotions: mockEmotions,
        },
      };

      // First call fails
      mockClient.post.mockRejectedValueOnce(new Error('Network Error'));
      // Second call succeeds
      mockClient.post.mockResolvedValueOnce({ data: mockMessageResponse });

      // First attempt fails
      await useMessageStore.getState().sendMessage('char-1', 'Retry test');
      expect(useMessageStore.getState().error).toBe('Network Error');

      // Second attempt succeeds
      await useMessageStore.getState().sendMessage('char-1', 'Retry test');

      const messages = useMessageStore.getState().messages['char-1'];
      const assistantMessage = messages[1];

      expect(assistantMessage.emotions).toEqual(mockEmotions);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle example from task documentation', async () => {
      // Example emotions from task.md
      const taskExampleEmotions: Emotions = {
        fear: 15,
        anger: 45,
        sadness: 10,
        disgust: 5,
        joy: 75,
      };

      const mockMessageResponse: MessageResponse = {
        user_message: {
          id: 'msg-1',
          role: 'user',
          content: 'What is your opinion on modern philosophy?',
          created_at: '2025-01-10T10:00:00Z',
        },
        assistant_message: {
          id: 'msg-2',
          role: 'assistant',
          content: 'Modern philosophy has many interesting perspectives...',
          created_at: '2025-01-10T10:00:05Z',
          emotions: taskExampleEmotions,
        },
      };

      mockClient.post.mockResolvedValue({ data: mockMessageResponse });

      await useMessageStore.getState().sendMessage('char-1', 'What is your opinion on modern philosophy?');

      const messages = useMessageStore.getState().messages['char-1'];
      const assistantMessage = messages[1];

      render(
        <AssistantMessage
          content={assistantMessage.content}
          timestamp={assistantMessage.created_at}
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId={assistantMessage.id}
          emotions={assistantMessage.emotions}
        />
      );

      // Verify all emotions displayed correctly
      expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument(); // fear - should be green
      expect(screen.getByText('45')).toBeInTheDocument(); // anger - should be orange
      expect(screen.getByText('10')).toBeInTheDocument(); // sadness - should be green
      expect(screen.getByText('5')).toBeInTheDocument(); // disgust - should be green
      expect(screen.getByText('75')).toBeInTheDocument(); // joy - should be red
    });

    it('should handle multiple characters with different emotions', async () => {
      const hegelEmotions: Emotions = {
        fear: 20,
        anger: 30,
        sadness: 40,
        disgust: 50,
        joy: 60,
      };

      const kantEmotions: Emotions = {
        fear: 80,
        anger: 70,
        sadness: 60,
        disgust: 50,
        joy: 40,
      };

      const hegelResponse: MessageResponse = {
        user_message: {
          id: 'msg-1',
          role: 'user',
          content: 'Hegel message',
          created_at: '2025-01-10T10:00:00Z',
        },
        assistant_message: {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hegel response',
          created_at: '2025-01-10T10:00:05Z',
          character_id: 'char-1',
          emotions: hegelEmotions,
        },
      };

      const kantResponse: MessageResponse = {
        user_message: {
          id: 'msg-3',
          role: 'user',
          content: 'Kant message',
          created_at: '2025-01-10T10:01:00Z',
        },
        assistant_message: {
          id: 'msg-4',
          role: 'assistant',
          content: 'Kant response',
          created_at: '2025-01-10T10:01:05Z',
          character_id: 'char-2',
          emotions: kantEmotions,
        },
      };

      mockClient.post
        .mockResolvedValueOnce({ data: hegelResponse })
        .mockResolvedValueOnce({ data: kantResponse });

      // Send messages to different characters
      await useMessageStore.getState().sendMessage('char-1', 'Hegel message');
      await useMessageStore.getState().sendMessage('char-2', 'Kant message');

      // Verify both have different emotions
      const hegelMessages = useMessageStore.getState().messages['char-1'];
      const kantMessages = useMessageStore.getState().messages['char-2'];

      expect(hegelMessages[1].emotions).toEqual(hegelEmotions);
      expect(kantMessages[1].emotions).toEqual(kantEmotions);
    });
  });
});
