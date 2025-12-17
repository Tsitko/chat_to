/**
 * UserMessage component - displays a user message on the right side.
 *
 * This component renders user messages with right-aligned styling,
 * timestamp, and user-specific visual design.
 */

import React from 'react';
import './UserMessage.css';

export interface UserMessageProps {
  content: string;
  timestamp: string;
  messageId?: string;
}

export const UserMessage: React.FC<UserMessageProps> = ({
  content,
  timestamp,
  messageId
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className="message user-message user-message-container"
      data-testid={messageId ? `message-user-${messageId}` : 'user-message'}
      data-role="user"
    >
      <div className="user-message-bubble">
        <div className="user-message-content message-content">
          {content}
        </div>
        <div className="user-message-timestamp message-time">
          {formatTime(timestamp)}
        </div>
      </div>
    </div>
  );
};
