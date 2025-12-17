/**
 * AssistantMessage component - displays an assistant/character message on the left side.
 *
 * This component renders character messages with left-aligned styling,
 * character name, avatar, Markdown rendering, and timestamp.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './AssistantMessage.css';

export interface AssistantMessageProps {
  content: string;
  timestamp: string;
  characterName: string;
  avatarUrl?: string | null;
  messageId?: string;
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  content,
  timestamp,
  characterName,
  avatarUrl,
  messageId
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  // Custom components to remove <p> wrapping in list items
  const components = {
    li: ({ children, ...props }: any) => {
      // Remove <p> wrapper from list items to prevent line breaks after numbers
      const unwrappedChildren = React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === 'p') {
          return child.props.children;
        }
        return child;
      });
      return <li {...props}>{unwrappedChildren}</li>;
    }
  };

  return (
    <div
      className="message assistant-message assistant-message-container"
      data-testid={messageId ? `message-assistant-${messageId}` : 'assistant-message'}
      data-role="assistant"
    >
      <div className="assistant-avatar">
        {avatarUrl ? (
          <img src={avatarUrl} alt={characterName} className="assistant-avatar-image" />
        ) : (
          <div className="assistant-avatar-initials">
            {getInitials(characterName)}
          </div>
        )}
      </div>
      <div className="assistant-message-bubble">
        <div className="assistant-message-header">
          <span className="assistant-message-name">{characterName}</span>
        </div>
        <div className="assistant-message-content message-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
          >
            {content}
          </ReactMarkdown>
        </div>
        <div className="assistant-message-timestamp message-time">
          {formatTime(timestamp)}
        </div>
      </div>
    </div>
  );
};
