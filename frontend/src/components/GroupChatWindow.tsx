/**
 * GroupChatWindow component - displays group chat messages.
 *
 * This component shows the conversation history in a group chat,
 * with messages from the user and multiple characters.
 *
 * Similar to ChatWindow but handles multiple character responses.
 *
 * Responsibilities:
 * - Fetch and display group messages on mount
 * - Render user messages and character messages
 * - Show character name and avatar for each assistant message
 * - Auto-scroll to latest message
 * - Display typing indicator when sending
 * - Handle loading and error states
 */

import React, { useEffect, useRef } from 'react';
import { useGroupMessageStore } from '../store/groupMessageStore';
import { useCharacterStore } from '../store/characterStore';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import type { GroupMessage } from '../types/group';
import type { Group } from '../types/group';

/**
 * Props for GroupChatWindow component.
 */
interface GroupChatWindowProps {
  /**
   * ID of the group whose messages to display.
   */
  groupId: string;

  /**
   * Group object for additional context (members, name, etc.).
   */
  group?: Group;
}

/**
 * GroupChatWindow component.
 *
 * Displays messages from a group chat with multiple characters.
 * Each character's message shows their avatar and name.
 */
export const GroupChatWindow: React.FC<GroupChatWindowProps> = ({
  groupId,
  group,
}) => {
  const {
    messages,
    fetchGroupMessages,
    isLoading,
    isSending,
  } = useGroupMessageStore();

  const { characters } = useCharacterStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const groupMessages = messages[groupId] || [];
  const isLoadingMessages = isLoading[groupId] || false;
  const isSendingMessage = isSending[groupId] || false;

  useEffect(() => {
    if (groupId) {
      fetchGroupMessages(groupId);
    }
  }, [groupId, fetchGroupMessages]);

  useEffect(() => {
    scrollToLatestMessage();
  }, [groupMessages]);

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

  if (isLoadingMessages) {
    return (
      <div className="chat-window" data-testid="group-chat-window">
        <div className="loading-state" data-testid="loading-state">
          Loading messages...
        </div>
      </div>
    );
  }

  if (groupMessages.length === 0) {
    return (
      <div className="chat-window" data-testid="group-chat-window">
        <div className="empty-state" data-testid="empty-state">
          No messages yet. Start a conversation!
        </div>
      </div>
    );
  }

  return (
    <div
      className="chat-window group-chat-window"
      data-testid="group-chat-window"
      role="region"
      aria-label="Group chat messages"
    >
      {groupMessages.map((message: GroupMessage) => {
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
          const character = message.character_id ? getCharacterById(message.character_id) : null;
          return (
            <AssistantMessage
              key={message.id}
              content={message.content}
              timestamp={message.created_at}
              characterName={message.character_name || character?.name || 'Unknown'}
              avatarUrl={message.avatar_url || character?.avatar_url}
              messageId={message.id}
              emotions={message.emotions}
            />
          );
        }
      })}
      {isSendingMessage && (
        <div className="typing-indicator" data-testid="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
