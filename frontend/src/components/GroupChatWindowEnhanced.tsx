/**
 * GroupChatWindowEnhanced component - displays group chat with TTS support.
 *
 * This enhanced version adds:
 * - Persistent message loading from backend
 * - TTS playback for individual messages
 * - Sequential TTS controls for all responses
 * - Better loading and error states
 *
 * Responsibilities:
 * - Load message history on mount using useGroupMessages
 * - Render user and character messages with TTS buttons
 * - Show GroupTTSControls for playlist playback
 * - Handle pagination (if enabled)
 * - Auto-scroll to latest message
 * - Display typing indicator when sending
 */

import React, { useEffect, useRef } from 'react';
import { useGroupMessages } from '../hooks/useGroupMessages';
import { useCharacterStore } from '../store/characterStore';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { GroupTTSButton } from './GroupTTSButton';
import { GroupTTSControls } from './GroupTTSControls';
import type { GroupMessage } from '../types/group';
import type { Group } from '../types/group';

/**
 * Props for GroupChatWindowEnhanced component.
 */
interface GroupChatWindowEnhancedProps {
  /**
   * ID of the group whose messages to display.
   */
  groupId: string;

  /**
   * Group object for additional context (members, name, etc.).
   */
  group?: Group;

  /**
   * Whether to enable TTS controls (default: true).
   */
  enableTTS?: boolean;

  /**
   * Whether to show individual TTS buttons on messages (default: true).
   */
  showMessageTTS?: boolean;

  /**
   * Whether to show playlist controls (default: true).
   */
  showPlaylistControls?: boolean;

  /**
   * Whether to enable pagination (default: false).
   */
  enablePagination?: boolean;
}

/**
 * GroupChatWindowEnhanced component.
 *
 * Displays messages from a group chat with TTS support and persistent storage.
 */
export const GroupChatWindowEnhanced: React.FC<GroupChatWindowEnhancedProps> = ({
  groupId,
  group,
  enableTTS = true,
  showMessageTTS = true,
  showPlaylistControls = true,
  enablePagination = false,
}) => {
  const {
    messages,
    isLoadingMessages,
    isSending,
    error,
    hasMore,
    loadMore,
  } = useGroupMessages(groupId, {
    enablePagination,
    autoLoad: true,
  });

  const { characters } = useCharacterStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToLatestMessage();
  }, [messages]);

  const scrollToLatestMessage = () => {
    if (messagesEndRef.current?.previousElementSibling) {
      messagesEndRef.current.previousElementSibling.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const getCharacterById = (characterId: string) => {
    return characters.find((c) => c.id === characterId);
  };

  const handleLoadMore = async () => {
    if (!isLoadingMessages && hasMore) {
      await loadMore();
    }
  };

  // Render loading state
  if (isLoadingMessages && messages.length === 0) {
    return (
      <div className="chat-window group-chat-window" data-testid="group-chat-window">
        <div className="loading-state" data-testid="loading-state">
          Loading messages...
        </div>
      </div>
    );
  }

  // Render error state
  if (error && messages.length === 0) {
    return (
      <div className="chat-window group-chat-window" data-testid="group-chat-window">
        <div className="error-state" data-testid="error-state" role="alert">
          Error loading messages: {error}
        </div>
      </div>
    );
  }

  // Render empty state
  if (messages.length === 0) {
    return (
      <div className="chat-window group-chat-window" data-testid="group-chat-window">
        <div className="empty-state" data-testid="empty-state">
          No messages yet. Start a conversation!
        </div>
      </div>
    );
  }

  return (
    <div
      className="chat-window group-chat-window enhanced"
      data-testid="group-chat-window-enhanced"
      role="region"
      aria-label="Group chat messages"
    >
      {/* TTS Playlist Controls */}
      {enableTTS && showPlaylistControls && (
        <div className="group-tts-controls-container">
          <GroupTTSControls messages={messages} />
        </div>
      )}

      {/* Load More Button (if pagination enabled) */}
      {enablePagination && hasMore && (
        <div className="load-more-container">
          <button
            className="load-more-button"
            onClick={handleLoadMore}
            disabled={isLoadingMessages}
            data-testid="load-more-button"
          >
            {isLoadingMessages ? 'Loading...' : 'Load More Messages'}
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="messages-container">
        {messages.map((message: GroupMessage) => {
          if (message.role === 'user') {
            return (
              <UserMessage
                key={message.id}
                content={message.content}
                timestamp={message.created_at}
                messageId={message.id}
              />
            );
          } else {
            const character = message.character_id
              ? getCharacterById(message.character_id)
              : null;

            return (
              <div key={message.id} className="assistant-message-wrapper">
                <AssistantMessage
                  content={message.content}
                  timestamp={message.created_at}
                  characterName={message.character_name || character?.name || 'Unknown'}
                  avatarUrl={message.avatar_url || character?.avatar_url}
                  messageId={message.id}
                  emotions={message.emotions}
                />
                {/* Individual TTS Button */}
                {enableTTS && showMessageTTS && (
                  <div className="message-tts-button-container">
                    <GroupTTSButton
                      messageId={message.id}
                      text={message.content}
                      characterName={message.character_name || character?.name}
                    />
                  </div>
                )}
              </div>
            );
          }
        })}
      </div>

      {/* Typing Indicator */}
      {isSending && (
        <div className="typing-indicator" data-testid="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}

      {/* Auto-scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default GroupChatWindowEnhanced;
