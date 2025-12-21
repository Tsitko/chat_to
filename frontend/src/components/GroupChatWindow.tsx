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
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hasScrolledToFirstResponse = useRef<boolean>(false);
  const userHasScrolled = useRef<boolean>(false);
  const lastMessageCount = useRef<number>(0);

  const groupMessages = messages[groupId] || [];
  const isLoadingMessages = isLoading[groupId] || false;
  const isSendingMessage = isSending[groupId] || false;

  useEffect(() => {
    if (groupId) {
      fetchGroupMessages(groupId);
    }
  }, [groupId, fetchGroupMessages]);

  // Track manual user scrolling
  useEffect(() => {
    const chatWindow = messagesEndRef.current?.parentElement;
    if (!chatWindow) return;

    const handleScroll = () => {
      userHasScrolled.current = true;
    };

    chatWindow.addEventListener('scroll', handleScroll);
    return () => chatWindow.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to first assistant response after user message
  useEffect(() => {
    if (groupMessages.length === 0) return;

    // Reset scroll flag when new user message is detected
    if (groupMessages.length > lastMessageCount.current) {
      const lastMessage = groupMessages[groupMessages.length - 1];
      if (lastMessage.role === 'user') {
        hasScrolledToFirstResponse.current = false;
        userHasScrolled.current = false;
      }
    }
    lastMessageCount.current = groupMessages.length;

    // Don't scroll if user manually scrolled or already scrolled to first response
    if (userHasScrolled.current || hasScrolledToFirstResponse.current) {
      return;
    }

    // Find last user message (using reverse search for ES2020 compatibility)
    let lastUserMessageIndex = -1;
    for (let i = groupMessages.length - 1; i >= 0; i--) {
      if (groupMessages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }
    if (lastUserMessageIndex === -1) return;

    // Find first assistant message after it
    const firstResponseIndex = groupMessages.findIndex(
      (m, idx) => idx > lastUserMessageIndex && m.role === 'assistant'
    );

    if (firstResponseIndex !== -1) {
      const firstResponseElement = messageRefs.current[firstResponseIndex];
      if (firstResponseElement) {
        // Use setTimeout to ensure DOM is fully updated
        setTimeout(() => {
          firstResponseElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
          hasScrolledToFirstResponse.current = true;
        }, 100);
      }
    }
  }, [groupMessages]);

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
      {groupMessages.map((message: GroupMessage, index: number) => {
        if (message.role === 'user') {
          return (
            <div key={message.id} ref={(el) => (messageRefs.current[index] = el)}>
              <UserMessage
                content={message.content}
                timestamp={message.created_at}
                messageId={message.id}
              />
            </div>
          );
        } else {
          const character = message.character_id ? getCharacterById(message.character_id) : null;
          return (
            <div key={message.id} ref={(el) => (messageRefs.current[index] = el)}>
              <AssistantMessage
                content={message.content}
                timestamp={message.created_at}
                characterName={message.character_name || character?.name || 'Unknown'}
                avatarUrl={message.avatar_url || character?.avatar_url}
                messageId={message.id}
                emotions={message.emotions}
              />
            </div>
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
