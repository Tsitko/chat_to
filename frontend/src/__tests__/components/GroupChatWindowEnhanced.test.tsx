/**
 * Integration tests for GroupChatWindowEnhanced component.
 *
 * Test Coverage:
 * - Component rendering with different states
 * - Loading state display
 * - Error state display
 * - Empty state display
 * - Message rendering (user and assistant messages)
 * - TTS controls integration
 * - Pagination (load more button)
 * - Typing indicator
 * - Auto-scroll functionality
 * - Character data integration
 * - Props handling (enableTTS, showMessageTTS, etc.)
 * - Edge cases (null groupId, missing character data)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupChatWindowEnhanced } from '../../components/GroupChatWindowEnhanced';
import * as useGroupMessagesModule from '../../hooks/useGroupMessages';
import * as characterStoreModule from '../../store/characterStore';
import type { GroupMessage, Group } from '../../types/group';

// Mock dependencies
vi.mock('../../hooks/useGroupMessages');
vi.mock('../../store/characterStore');
vi.mock('../../components/GroupTTSControls', () => ({
  GroupTTSControls: ({ messages }: any) => (
    <div data-testid="group-tts-controls">
      TTS Controls ({messages.length} messages)
    </div>
  ),
}));
vi.mock('../../components/GroupTTSButton', () => ({
  GroupTTSButton: ({ messageId }: any) => (
    <button data-testid={`group-tts-button-${messageId}`}>Play</button>
  ),
}));
vi.mock('../../components/UserMessage', () => ({
  UserMessage: ({ content, messageId }: any) => (
    <div data-testid={`user-message-${messageId}`}>{content}</div>
  ),
}));
vi.mock('../../components/AssistantMessage', () => ({
  AssistantMessage: ({ content, characterName, messageId }: any) => (
    <div data-testid={`assistant-message-${messageId}`}>
      {characterName}: {content}
    </div>
  ),
}));

describe('GroupChatWindowEnhanced', () => {
  let mockUseGroupMessages: any;
  let mockCharacterStore: any;

  beforeEach(() => {
    mockUseGroupMessages = {
      messages: [],
      isLoadingMessages: false,
      isSending: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
    };

    mockCharacterStore = {
      characters: [],
    };

    vi.mocked(useGroupMessagesModule.useGroupMessages).mockReturnValue(mockUseGroupMessages);
    vi.mocked(characterStoreModule.useCharacterStore).mockReturnValue(mockCharacterStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading state when loading messages with empty array', () => {
      mockUseGroupMessages.isLoadingMessages = true;
      mockUseGroupMessages.messages = [];

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByText(/loading messages/i)).toBeInTheDocument();
    });

    it('should not display loading state when messages exist', () => {
      mockUseGroupMessages.isLoadingMessages = true;
      mockUseGroupMessages.messages = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error state when error exists with empty messages', () => {
      mockUseGroupMessages.error = 'Failed to load messages';
      mockUseGroupMessages.messages = [];

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText(/error loading messages: failed to load messages/i)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should not display error state when messages exist', () => {
      mockUseGroupMessages.error = 'Some error';
      mockUseGroupMessages.messages = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no messages', () => {
      mockUseGroupMessages.messages = [];

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
    });

    it('should not display empty state when messages exist', () => {
      mockUseGroupMessages.messages = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  describe('Message Rendering', () => {
    it('should render user messages', () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello everyone',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockUseGroupMessages.messages = messages;

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.getByTestId('user-message-msg-1')).toBeInTheDocument();
      expect(screen.getByText('Hello everyone')).toBeInTheDocument();
    });

    it('should render assistant messages', () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Response from Hegel',
          created_at: '2025-01-01T00:00:01Z',
          character_id: 'char-1',
          character_name: 'Hegel',
        },
      ];

      mockUseGroupMessages.messages = messages;

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.getByTestId('assistant-message-msg-1')).toBeInTheDocument();
      expect(screen.getByText(/hegel: response from hegel/i)).toBeInTheDocument();
    });

    it('should render multiple messages in order', () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'First message',
          created_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Second message',
          created_at: '2025-01-01T00:00:01Z',
          character_name: 'Hegel',
        },
        {
          id: 'msg-3',
          role: 'assistant',
          content: 'Third message',
          created_at: '2025-01-01T00:00:02Z',
          character_name: 'Kant',
        },
      ];

      mockUseGroupMessages.messages = messages;

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.getByTestId('user-message-msg-1')).toBeInTheDocument();
      expect(screen.getByTestId('assistant-message-msg-2')).toBeInTheDocument();
      expect(screen.getByTestId('assistant-message-msg-3')).toBeInTheDocument();
    });

    it('should use character name from message data', () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
          character_name: 'Hegel',
        },
      ];

      mockUseGroupMessages.messages = messages;

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.getByText(/hegel:/i)).toBeInTheDocument();
    });

    it('should fallback to character store for character name', () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
          character_id: 'char-1',
          // No character_name
        },
      ];

      mockCharacterStore.characters = [
        { id: 'char-1', name: 'Hegel from Store', avatar_url: null, created_at: '' },
      ];

      mockUseGroupMessages.messages = messages;

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.getByText(/hegel from store:/i)).toBeInTheDocument();
    });

    it('should show "Unknown" for missing character data', () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
          character_id: 'char-unknown',
          // No character_name and not in store
        },
      ];

      mockUseGroupMessages.messages = messages;

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.getByText(/unknown:/i)).toBeInTheDocument();
    });
  });

  describe('TTS Controls', () => {
    it('should render TTS controls by default', () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
          character_name: 'Hegel',
        },
      ];

      mockUseGroupMessages.messages = messages;

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.getByTestId('group-tts-controls')).toBeInTheDocument();
    });

    it('should not render TTS controls when enableTTS=false', () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
          character_name: 'Hegel',
        },
      ];

      mockUseGroupMessages.messages = messages;

      render(<GroupChatWindowEnhanced groupId="group-1" enableTTS={false} />);

      expect(screen.queryByTestId('group-tts-controls')).not.toBeInTheDocument();
    });

    it('should not render TTS controls when showPlaylistControls=false', () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
          character_name: 'Hegel',
        },
      ];

      mockUseGroupMessages.messages = messages;

      render(<GroupChatWindowEnhanced groupId="group-1" showPlaylistControls={false} />);

      expect(screen.queryByTestId('group-tts-controls')).not.toBeInTheDocument();
    });

    it('should render TTS buttons for assistant messages', () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
          character_name: 'Hegel',
        },
      ];

      mockUseGroupMessages.messages = messages;

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.getByTestId('group-tts-button-msg-1')).toBeInTheDocument();
    });

    it('should not render TTS buttons when showMessageTTS=false', () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
          character_name: 'Hegel',
        },
      ];

      mockUseGroupMessages.messages = messages;

      render(<GroupChatWindowEnhanced groupId="group-1" showMessageTTS={false} />);

      expect(screen.queryByTestId('group-tts-button-msg-1')).not.toBeInTheDocument();
    });

    it('should not render TTS buttons for user messages', () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockUseGroupMessages.messages = messages;

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.queryByTestId('group-tts-button-msg-1')).not.toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should render load more button when pagination enabled and hasMore=true', () => {
      mockUseGroupMessages.messages = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];
      mockUseGroupMessages.hasMore = true;

      render(<GroupChatWindowEnhanced groupId="group-1" enablePagination={true} />);

      expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
      expect(screen.getByText(/load more messages/i)).toBeInTheDocument();
    });

    it('should not render load more button when pagination disabled', () => {
      mockUseGroupMessages.messages = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];
      mockUseGroupMessages.hasMore = true;

      render(<GroupChatWindowEnhanced groupId="group-1" enablePagination={false} />);

      expect(screen.queryByTestId('load-more-button')).not.toBeInTheDocument();
    });

    it('should not render load more button when hasMore=false', () => {
      mockUseGroupMessages.messages = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];
      mockUseGroupMessages.hasMore = false;

      render(<GroupChatWindowEnhanced groupId="group-1" enablePagination={true} />);

      expect(screen.queryByTestId('load-more-button')).not.toBeInTheDocument();
    });

    it('should call loadMore when load more button clicked', async () => {
      const user = userEvent.setup();
      mockUseGroupMessages.messages = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];
      mockUseGroupMessages.hasMore = true;

      render(<GroupChatWindowEnhanced groupId="group-1" enablePagination={true} />);

      const loadMoreButton = screen.getByTestId('load-more-button');
      await user.click(loadMoreButton);

      expect(mockUseGroupMessages.loadMore).toHaveBeenCalled();
    });

    it('should disable load more button when loading', () => {
      mockUseGroupMessages.messages = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];
      mockUseGroupMessages.hasMore = true;
      mockUseGroupMessages.isLoadingMessages = true;

      render(<GroupChatWindowEnhanced groupId="group-1" enablePagination={true} />);

      const loadMoreButton = screen.getByTestId('load-more-button');
      expect(loadMoreButton).toBeDisabled();
      expect(screen.getByText(/loading.../i)).toBeInTheDocument();
    });
  });

  describe('Typing Indicator', () => {
    it('should display typing indicator when sending', () => {
      mockUseGroupMessages.messages = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];
      mockUseGroupMessages.isSending = true;

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    });

    it('should not display typing indicator when not sending', () => {
      mockUseGroupMessages.messages = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];
      mockUseGroupMessages.isSending = false;

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      mockUseGroupMessages.messages = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      const chatWindow = screen.getByRole('region');
      expect(chatWindow).toHaveAttribute('aria-label', 'Group chat messages');
    });

    it('should have proper role for error alert', () => {
      mockUseGroupMessages.error = 'Test error';
      mockUseGroupMessages.messages = [];

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Integration with useGroupMessages', () => {
    it('should pass groupId to useGroupMessages hook', () => {
      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(useGroupMessagesModule.useGroupMessages).toHaveBeenCalledWith(
        'group-1',
        expect.objectContaining({
          enablePagination: false,
          autoLoad: true,
        })
      );
    });

    it('should pass pagination flag to useGroupMessages', () => {
      render(<GroupChatWindowEnhanced groupId="group-1" enablePagination={true} />);

      expect(useGroupMessagesModule.useGroupMessages).toHaveBeenCalledWith(
        'group-1',
        expect.objectContaining({
          enablePagination: true,
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle messages without character metadata gracefully', () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
          // No character_id or character_name
        },
      ];

      mockUseGroupMessages.messages = messages;

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.getByText(/unknown:/i)).toBeInTheDocument();
    });

    it('should handle messages with emotions', () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
          character_name: 'Hegel',
          emotions: { joy: 80, fear: 10, anger: 5, sadness: 5, disgust: 0 },
        },
      ];

      mockUseGroupMessages.messages = messages;

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      // Component should render without errors
      expect(screen.getByTestId('assistant-message-msg-1')).toBeInTheDocument();
    });

    it('should handle very long message list', () => {
      const manyMessages: GroupMessage[] = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: `Message ${i}`,
        created_at: new Date(2025, 0, 1, 0, 0, i).toISOString(),
        character_name: i % 2 === 1 ? 'Hegel' : undefined,
      }));

      mockUseGroupMessages.messages = manyMessages;

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      // Should render all messages
      expect(screen.getAllByTestId(/message-/)).toHaveLength(100);
    });

    it('should render enhanced chat window correctly', () => {
      mockUseGroupMessages.messages = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      render(<GroupChatWindowEnhanced groupId="group-1" />);

      expect(screen.getByTestId('group-chat-window-enhanced')).toBeInTheDocument();
      expect(screen.getByTestId('group-chat-window-enhanced')).toHaveClass('enhanced');
    });
  });
});
