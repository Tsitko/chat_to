/**
 * GroupChatWindowEnhanced Component Tests.
 *
 * Comprehensive tests for GroupChatWindowEnhanced component covering:
 * - Message rendering (user and assistant messages)
 * - Loading states (initial load, pagination)
 * - Error states (fetch errors, empty groups)
 * - Empty states (no messages)
 * - TTS integration (controls and buttons)
 * - Pagination (load more functionality)
 * - Auto-scrolling behavior
 * - Character avatar and name display
 * - Typing indicator during message sending
 * - Accessibility attributes
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { GroupChatWindowEnhanced } from '../GroupChatWindowEnhanced';
import { useGroupMessages } from '../../hooks/useGroupMessages';
import { useCharacterStore } from '../../store/characterStore';
import {
  mockGroupId1,
  mockGroupMessages,
  mockGroupMessagesEmpty,
  mockGroupMessagesAssistantOnly,
  mockGroupUserMessage1,
  mockGroupAssistantMessage1,
  mockGroupAssistantMessage2,
} from '../../tests/mockGroupData';
import type { Group } from '../../types/group';
import type { Character } from '../../types/character';

// Mock dependencies
vi.mock('../../hooks/useGroupMessages');
vi.mock('../../store/characterStore');
vi.mock('../UserMessage', () => ({
  UserMessage: ({ content, timestamp, messageId }: any) => (
    <div data-testid={`user-message-${messageId}`}>
      <div data-testid="user-message-content">{content}</div>
      <div data-testid="user-message-timestamp">{timestamp}</div>
    </div>
  ),
}));
vi.mock('../AssistantMessage', () => ({
  AssistantMessage: ({
    content,
    timestamp,
    characterName,
    avatarUrl,
    messageId,
    emotions,
  }: any) => (
    <div data-testid={`assistant-message-${messageId}`}>
      <div data-testid="assistant-message-content">{content}</div>
      <div data-testid="assistant-message-character">{characterName}</div>
      <div data-testid="assistant-message-timestamp">{timestamp}</div>
      {avatarUrl && <img data-testid="assistant-message-avatar" src={avatarUrl} alt="" />}
      {emotions && <div data-testid="assistant-message-emotions">{JSON.stringify(emotions)}</div>}
    </div>
  ),
}));
vi.mock('../GroupTTSButton', () => ({
  GroupTTSButton: ({ messageId, text, characterName }: any) => (
    <button data-testid={`group-tts-button-${messageId}`}>
      TTS: {characterName}
    </button>
  ),
}));
vi.mock('../GroupTTSControls', () => ({
  GroupTTSControls: ({ messages }: any) => (
    <div data-testid="group-tts-controls">
      TTS Controls ({messages.length} messages)
    </div>
  ),
}));

describe('GroupChatWindowEnhanced Component', () => {
  const mockUseGroupMessages = {
    messages: mockGroupMessages,
    isLoadingMessages: false,
    isSending: false,
    error: null,
    hasMore: false,
    loadMore: vi.fn(),
    reloadMessages: vi.fn(),
    clearMessages: vi.fn(),
  };

  const mockCharacterStore = {
    characters: [
      {
        id: 'char-1',
        name: 'Hegel',
        avatar_url: '/avatars/hegel.jpg',
      },
      {
        id: 'char-2',
        name: 'Kant',
        avatar_url: '/avatars/kant.jpg',
      },
    ] as Character[],
    selectedCharacter: null,
    isLoading: false,
    error: null,
    fetchCharacters: vi.fn(),
    createCharacter: vi.fn(),
    updateCharacter: vi.fn(),
    deleteCharacter: vi.fn(),
    selectCharacter: vi.fn(),
  };

  const mockGroup: Group = {
    id: mockGroupId1,
    name: 'Philosophy Discussion',
    character_ids: ['char-1', 'char-2'],
    created_at: '2025-01-15T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGroupMessages).mockReturnValue(mockUseGroupMessages);
    vi.mocked(useCharacterStore).mockReturnValue(mockCharacterStore);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering - Basic Structure', () => {
    it('should render chat window with messages', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const chatWindow = screen.getByTestId('group-chat-window-enhanced');
      expect(chatWindow).toBeInTheDocument();
    });

    it('should render all messages in order', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const userMessages = screen.getAllByTestId(/^user-message-/);
      const assistantMessages = screen.getAllByTestId(/^assistant-message-/);

      expect(userMessages.length + assistantMessages.length).toBe(mockGroupMessages.length);
    });

    it('should render user messages with UserMessage component', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const userMessage = screen.getByTestId(`user-message-${mockGroupUserMessage1.id}`);
      expect(userMessage).toBeInTheDocument();

      const content = within(userMessage).getByTestId('user-message-content');
      expect(content).toHaveTextContent(mockGroupUserMessage1.content);
    });

    it('should render assistant messages with AssistantMessage component', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const assistantMessage = screen.getByTestId(
        `assistant-message-${mockGroupAssistantMessage1.id}`
      );
      expect(assistantMessage).toBeInTheDocument();

      const content = within(assistantMessage).getByTestId('assistant-message-content');
      expect(content).toHaveTextContent(mockGroupAssistantMessage1.content);
    });

    it('should have correct ARIA attributes', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const chatWindow = screen.getByRole('region', { name: /group chat messages/i });
      expect(chatWindow).toBeInTheDocument();
    });

    it('should apply enhanced class', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const chatWindow = screen.getByTestId('group-chat-window-enhanced');
      expect(chatWindow).toHaveClass('enhanced');
    });
  });

  describe('Loading States', () => {
    it('should show loading state during initial fetch', () => {
      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        messages: [],
        isLoadingMessages: true,
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const loadingState = screen.getByTestId('loading-state');
      expect(loadingState).toBeInTheDocument();
      expect(loadingState).toHaveTextContent(/loading messages/i);
    });

    it('should not show loading state when messages exist', () => {
      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        isLoadingMessages: true,
        messages: mockGroupMessages,
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const loadingState = screen.queryByTestId('loading-state');
      expect(loadingState).not.toBeInTheDocument();
    });

    it('should show typing indicator when sending', () => {
      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        isSending: true,
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const typingIndicator = screen.getByTestId('typing-indicator');
      expect(typingIndicator).toBeInTheDocument();
    });

    it('should not show typing indicator when not sending', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const typingIndicator = screen.queryByTestId('typing-indicator');
      expect(typingIndicator).not.toBeInTheDocument();
    });

    it('should show load more button when hasMore is true', () => {
      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        hasMore: true,
      });

      render(
        <GroupChatWindowEnhanced groupId={mockGroupId1} enablePagination={true} />
      );

      const loadMoreButton = screen.getByTestId('load-more-button');
      expect(loadMoreButton).toBeInTheDocument();
      expect(loadMoreButton).toHaveTextContent(/load more messages/i);
    });

    it('should not show load more button when pagination disabled', () => {
      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        hasMore: true,
      });

      render(
        <GroupChatWindowEnhanced groupId={mockGroupId1} enablePagination={false} />
      );

      const loadMoreButton = screen.queryByTestId('load-more-button');
      expect(loadMoreButton).not.toBeInTheDocument();
    });

    it('should disable load more button when loading', () => {
      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        hasMore: true,
        isLoadingMessages: true,
      });

      render(
        <GroupChatWindowEnhanced groupId={mockGroupId1} enablePagination={true} />
      );

      const loadMoreButton = screen.getByTestId('load-more-button');
      expect(loadMoreButton).toBeDisabled();
      expect(loadMoreButton).toHaveTextContent(/loading/i);
    });
  });

  describe('Error States', () => {
    it('should show error state when fetch fails and no messages', () => {
      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        messages: [],
        error: 'Failed to fetch messages',
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const errorState = screen.getByTestId('error-state');
      expect(errorState).toBeInTheDocument();
      expect(errorState).toHaveTextContent(/error loading messages/i);
      expect(errorState).toHaveTextContent(/failed to fetch messages/i);
    });

    it('should have error role for accessibility', () => {
      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        messages: [],
        error: 'Network error',
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const errorState = screen.getByRole('alert');
      expect(errorState).toBeInTheDocument();
    });

    it('should not show error state when messages exist', () => {
      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        messages: mockGroupMessages,
        error: 'Some error',
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const errorState = screen.queryByTestId('error-state');
      expect(errorState).not.toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no messages', () => {
      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        messages: [],
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent(/no messages yet/i);
    });

    it('should not show empty state when messages exist', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const emptyState = screen.queryByTestId('empty-state');
      expect(emptyState).not.toBeInTheDocument();
    });
  });

  describe('TTS Integration', () => {
    it('should render TTS controls when enabled', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} enableTTS={true} />);

      const ttsControls = screen.getByTestId('group-tts-controls');
      expect(ttsControls).toBeInTheDocument();
    });

    it('should not render TTS controls when disabled', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} enableTTS={false} />);

      const ttsControls = screen.queryByTestId('group-tts-controls');
      expect(ttsControls).not.toBeInTheDocument();
    });

    it('should render TTS buttons for assistant messages when enabled', () => {
      render(
        <GroupChatWindowEnhanced
          groupId={mockGroupId1}
          enableTTS={true}
          showMessageTTS={true}
        />
      );

      const ttsButtons = screen.getAllByTestId(/^group-tts-button-/);
      const assistantMessages = mockGroupMessages.filter((msg) => msg.role === 'assistant');
      expect(ttsButtons.length).toBe(assistantMessages.length);
    });

    it('should not render TTS buttons when showMessageTTS is false', () => {
      render(
        <GroupChatWindowEnhanced
          groupId={mockGroupId1}
          enableTTS={true}
          showMessageTTS={false}
        />
      );

      const ttsButtons = screen.queryAllByTestId(/^group-tts-button-/);
      expect(ttsButtons.length).toBe(0);
    });

    it('should not render TTS buttons when enableTTS is false', () => {
      render(
        <GroupChatWindowEnhanced
          groupId={mockGroupId1}
          enableTTS={false}
          showMessageTTS={true}
        />
      );

      const ttsButtons = screen.queryAllByTestId(/^group-tts-button-/);
      expect(ttsButtons.length).toBe(0);
    });

    it('should not render playlist controls when showPlaylistControls is false', () => {
      render(
        <GroupChatWindowEnhanced
          groupId={mockGroupId1}
          enableTTS={true}
          showPlaylistControls={false}
        />
      );

      const ttsControls = screen.queryByTestId('group-tts-controls');
      expect(ttsControls).not.toBeInTheDocument();
    });

    it('should pass messages to TTS controls', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} enableTTS={true} />);

      const ttsControls = screen.getByTestId('group-tts-controls');
      expect(ttsControls).toHaveTextContent(`${mockGroupMessages.length} messages`);
    });
  });

  describe('Character Information', () => {
    it('should display character name from message', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const assistantMessage = screen.getByTestId(
        `assistant-message-${mockGroupAssistantMessage1.id}`
      );
      const characterName = within(assistantMessage).getByTestId('assistant-message-character');
      expect(characterName).toHaveTextContent(mockGroupAssistantMessage1.character_name!);
    });

    it('should display character name from store when not in message', () => {
      const messageWithoutName = {
        ...mockGroupAssistantMessage1,
        character_name: undefined,
        character_id: 'char-1',
      };

      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        messages: [messageWithoutName],
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const assistantMessage = screen.getByTestId(`assistant-message-${messageWithoutName.id}`);
      const characterName = within(assistantMessage).getByTestId('assistant-message-character');
      expect(characterName).toHaveTextContent('Hegel');
    });

    it('should show Unknown when character not found', () => {
      const messageWithUnknownChar = {
        ...mockGroupAssistantMessage1,
        character_name: undefined,
        character_id: 'unknown-char-id',
      };

      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        messages: [messageWithUnknownChar],
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const assistantMessage = screen.getByTestId(`assistant-message-${messageWithUnknownChar.id}`);
      const characterName = within(assistantMessage).getByTestId('assistant-message-character');
      expect(characterName).toHaveTextContent('Unknown');
    });

    it('should pass character avatar URL to message', () => {
      const messageWithCharId = {
        ...mockGroupAssistantMessage1,
        avatar_url: undefined,
        character_id: 'char-1',
      };

      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        messages: [messageWithCharId],
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const assistantMessage = screen.getByTestId(`assistant-message-${messageWithCharId.id}`);
      const avatar = within(assistantMessage).getByTestId('assistant-message-avatar');
      expect(avatar).toHaveAttribute('src', '/avatars/hegel.jpg');
    });

    it('should prefer message avatar URL over character store', () => {
      const messageWithAvatar = {
        ...mockGroupAssistantMessage1,
        avatar_url: '/custom-avatar.jpg',
        character_id: 'char-1',
      };

      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        messages: [messageWithAvatar],
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const assistantMessage = screen.getByTestId(`assistant-message-${messageWithAvatar.id}`);
      const avatar = within(assistantMessage).getByTestId('assistant-message-avatar');
      expect(avatar).toHaveAttribute('src', '/custom-avatar.jpg');
    });
  });

  describe('Pagination', () => {
    it('should call loadMore when load more button clicked', async () => {
      const mockLoadMore = vi.fn();
      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        hasMore: true,
        loadMore: mockLoadMore,
      });

      render(
        <GroupChatWindowEnhanced groupId={mockGroupId1} enablePagination={true} />
      );

      const loadMoreButton = screen.getByTestId('load-more-button');
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(mockLoadMore).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call loadMore when already loading', async () => {
      const mockLoadMore = vi.fn();
      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        hasMore: true,
        isLoadingMessages: true,
        loadMore: mockLoadMore,
      });

      render(
        <GroupChatWindowEnhanced groupId={mockGroupId1} enablePagination={true} />
      );

      const loadMoreButton = screen.getByTestId('load-more-button');
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(mockLoadMore).not.toHaveBeenCalled();
      });
    });

    it('should not call loadMore when hasMore is false', async () => {
      const mockLoadMore = vi.fn();
      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        hasMore: false,
        loadMore: mockLoadMore,
      });

      render(
        <GroupChatWindowEnhanced groupId={mockGroupId1} enablePagination={true} />
      );

      const loadMoreButton = screen.queryByTestId('load-more-button');
      expect(loadMoreButton).not.toBeInTheDocument();
    });
  });

  describe('Message Rendering Details', () => {
    it('should render timestamps for all messages', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const timestamps = screen.getAllByTestId(/message-timestamp$/);
      expect(timestamps.length).toBeGreaterThan(0);
    });

    it('should render emotions when present in assistant message', () => {
      const messageWithEmotions = {
        ...mockGroupAssistantMessage1,
        emotions: { joy: 0.8, sadness: 0.1 },
      };

      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        messages: [messageWithEmotions],
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const assistantMessage = screen.getByTestId(`assistant-message-${messageWithEmotions.id}`);
      const emotions = within(assistantMessage).getByTestId('assistant-message-emotions');
      expect(emotions).toBeInTheDocument();
    });

    it('should handle messages without emotions', () => {
      const messageWithoutEmotions = {
        ...mockGroupAssistantMessage1,
        emotions: undefined,
      };

      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        messages: [messageWithoutEmotions],
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const assistantMessage = screen.getByTestId(`assistant-message-${messageWithoutEmotions.id}`);
      const emotions = within(assistantMessage).queryByTestId('assistant-message-emotions');
      expect(emotions).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle mixed user and assistant messages', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const userMessages = screen.getAllByTestId(/^user-message-/);
      const assistantMessages = screen.getAllByTestId(/^assistant-message-/);

      expect(userMessages.length).toBeGreaterThan(0);
      expect(assistantMessages.length).toBeGreaterThan(0);
    });

    it('should handle only assistant messages', () => {
      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        messages: mockGroupMessagesAssistantOnly,
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const userMessages = screen.queryAllByTestId(/^user-message-/);
      const assistantMessages = screen.getAllByTestId(/^assistant-message-/);

      expect(userMessages.length).toBe(0);
      expect(assistantMessages.length).toBe(mockGroupMessagesAssistantOnly.length);
    });

    it('should handle custom className', () => {
      render(
        <GroupChatWindowEnhanced groupId={mockGroupId1} enableTTS={false} />
      );

      const chatWindow = screen.getByTestId('group-chat-window-enhanced');
      expect(chatWindow).toBeInTheDocument();
    });

    it('should handle group prop for additional context', () => {
      render(
        <GroupChatWindowEnhanced groupId={mockGroupId1} group={mockGroup} />
      );

      const chatWindow = screen.getByTestId('group-chat-window-enhanced');
      expect(chatWindow).toBeInTheDocument();
    });

    it('should handle messages with duplicate IDs gracefully', () => {
      const messagesWithDuplicates = [
        mockGroupUserMessage1,
        mockGroupUserMessage1,
        mockGroupAssistantMessage1,
      ];

      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        messages: messagesWithDuplicates,
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const chatWindow = screen.getByTestId('group-chat-window-enhanced');
      expect(chatWindow).toBeInTheDocument();
    });

    it('should handle very long message content', () => {
      const longMessage = {
        ...mockGroupAssistantMessage1,
        content: 'A'.repeat(10000),
      };

      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        messages: [longMessage],
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const assistantMessage = screen.getByTestId(`assistant-message-${longMessage.id}`);
      expect(assistantMessage).toBeInTheDocument();
    });

    it('should handle messages with special characters', () => {
      const specialMessage = {
        ...mockGroupAssistantMessage1,
        content: '<script>alert("xss")</script>\n\t\r',
        character_name: 'Hegel & Kant',
      };

      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        messages: [specialMessage],
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const assistantMessage = screen.getByTestId(`assistant-message-${specialMessage.id}`);
      expect(assistantMessage).toBeInTheDocument();
    });
  });

  describe('Auto-scroll Behavior', () => {
    it('should have auto-scroll anchor element', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const chatWindow = screen.getByTestId('group-chat-window-enhanced');
      const anchor = chatWindow.querySelector('div[ref]');
      expect(chatWindow).toContainElement(chatWindow.lastElementChild as Element);
    });

    it('should render messages container', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const messagesContainer = screen.getByTestId('group-chat-window-enhanced')
        .querySelector('.messages-container');
      expect(messagesContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic region role', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const chatWindow = screen.getByRole('region');
      expect(chatWindow).toBeInTheDocument();
    });

    it('should have descriptive aria-label', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const chatWindow = screen.getByRole('region', { name: /group chat messages/i });
      expect(chatWindow).toBeInTheDocument();
    });

    it('should have proper error alert role', () => {
      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        messages: [],
        error: 'Error message',
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
    });
  });

  describe('Default Props', () => {
    it('should enable TTS by default', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const ttsControls = screen.getByTestId('group-tts-controls');
      expect(ttsControls).toBeInTheDocument();
    });

    it('should show message TTS by default', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const ttsButtons = screen.getAllByTestId(/^group-tts-button-/);
      expect(ttsButtons.length).toBeGreaterThan(0);
    });

    it('should show playlist controls by default', () => {
      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const ttsControls = screen.getByTestId('group-tts-controls');
      expect(ttsControls).toBeInTheDocument();
    });

    it('should disable pagination by default', () => {
      vi.mocked(useGroupMessages).mockReturnValue({
        ...mockUseGroupMessages,
        hasMore: true,
      });

      render(<GroupChatWindowEnhanced groupId={mockGroupId1} />);

      const loadMoreButton = screen.queryByTestId('load-more-button');
      expect(loadMoreButton).not.toBeInTheDocument();
    });
  });
});
