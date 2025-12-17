/**
 * ChatWindow component - displays chat messages with a character.
 *
 * This component shows the conversation history and handles scrolling.
 */

import React, { useEffect, useRef } from 'react';
import { useMessageStoreEnhanced } from '../store/messageStoreEnhanced';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import type { Message } from '../types/message';
import type { Character } from '../types/character';

interface ChatWindowProps {
  characterId: string;
  character?: Character;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ characterId, character }) => {
  const { messages, fetchMessages, isLoading } = useMessageStoreEnhanced();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  const characterMessages = messages[characterId] || [];
  const isSending = isLoading(characterId, 'send');

  useEffect(() => {
    if (characterId) {
      fetchMessages(characterId);
    }
  }, [characterId, fetchMessages]);

  useEffect(() => {
    scrollToLatestMessage();
  }, [characterMessages]);

  const scrollToLatestMessage = () => {
    // Scroll to the start of the last message so users can read from the beginning
    if (messagesEndRef.current?.previousElementSibling) {
      messagesEndRef.current.previousElementSibling.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div
      className="chat-window"
      data-testid="chat-window"
      role="region"
      aria-label="Chat messages"
    >
      {isLoading(characterId, 'fetch') ? (
        <div className="loading-state" data-testid="loading-state">
          {/* Loading indicator without technical text */}
        </div>
      ) : characterMessages.length === 0 ? (
        <div className="empty-state" data-testid="empty-state">
          No messages yet. Start a conversation!
        </div>
      ) : (
        characterMessages.map((message: Message) => (
          message.role === 'user' ? (
            <UserMessage
              key={message.id}
              content={message.content}
              timestamp={message.created_at}
              messageId={message.id}
            />
          ) : (
            <AssistantMessage
              key={message.id}
              content={message.content}
              timestamp={message.created_at}
              characterName={character?.name || 'Assistant'}
              avatarUrl={character?.avatar_url}
              messageId={message.id}
            />
          )
        ))
      )}
      {isSending && (
        <div className="typing-indicator" data-testid="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
      <div ref={messagesEndRef} />
      <div
        ref={announcementRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {/* Screen reader announcement for new messages */}
        {characterMessages.length > 0 && isSending && 'Message sent'}
      </div>
    </div>
  );
};
