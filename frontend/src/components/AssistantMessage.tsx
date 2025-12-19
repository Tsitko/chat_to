/**
 * AssistantMessage component - displays an assistant/character message on the left side.
 *
 * This component renders character messages with left-aligned styling,
 * character name, avatar, Markdown rendering, timestamp, and optional emotions display.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Emotions } from '../types/message';
import { EmotionDisplay } from './EmotionDisplay';
import TTSButton from './TTSButton';
import './AssistantMessage.css';

export interface AssistantMessageProps {
  content: string;
  timestamp: string;
  characterName: string;
  avatarUrl?: string | null;
  messageId?: string;
  /** Optional emotions data to display character's emotional state */
  emotions?: Emotions;
}

// Context to track if we're in an ordered list
const ListContext = React.createContext<{ isOrdered: boolean } | null>(null);

export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  content,
  timestamp,
  characterName,
  avatarUrl,
  messageId,
  emotions
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

  // Custom ordered list component
  const CustomOrderedList = ({ children, ...props }: any) => {
    // Filter and map only valid React elements, counting actual list items
    let itemIndex = 0;
    const childrenWithIndex = React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        itemIndex++;
        return React.cloneElement(child, { 'data-index': itemIndex } as any);
      }
      return null; // Skip non-element children like text nodes
    });

    return (
      <ListContext.Provider value={{ isOrdered: true }}>
        <div className="custom-ordered-list" {...props}>
          {childrenWithIndex}
        </div>
      </ListContext.Provider>
    );
  };

  // Custom unordered list component
  const CustomUnorderedList = ({ children, ...props }: any) => {
    return (
      <ListContext.Provider value={{ isOrdered: false }}>
        <div className="custom-unordered-list" {...props}>
          {children}
        </div>
      </ListContext.Provider>
    );
  };

  // Custom list item component
  const CustomListItem = ({ children, ...props }: any) => {
    const listContext = React.useContext(ListContext);
    const itemNumber = props['data-index'];

    // Flatten children to remove <p> wrappers and trim text nodes
    const flattenChildren = (children: any, trimNext: boolean = true): any => {
      const result: any[] = [];
      let shouldTrimNext = trimNext;

      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === 'p') {
          const flattened = flattenChildren(child.props.children, shouldTrimNext);
          result.push(...(Array.isArray(flattened) ? flattened : [flattened]));
          shouldTrimNext = false;
        } else if (typeof child === 'string') {
          const processed = shouldTrimNext ? child.trimStart() : child;
          if (processed) {
            result.push(processed);
            shouldTrimNext = false;
          }
        } else if (child !== null && child !== undefined) {
          result.push(child);
          shouldTrimNext = false;
        }
      });

      return result;
    };

    const unwrappedChildren = flattenChildren(children);

    return (
      <div className="custom-list-item" {...props}>
        {listContext?.isOrdered && itemNumber && (
          <span className="custom-list-item-number">{itemNumber}.</span>
        )}
        {!listContext?.isOrdered && (
          <span className="custom-list-item-bullet">•</span>
        )}
        <span className="custom-list-item-content">{unwrappedChildren}</span>
      </div>
    );
  };

  // Custom components to replace default list rendering
  const components = {
    ol: CustomOrderedList,
    ul: CustomUnorderedList,
    li: CustomListItem
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
        {emotions && <EmotionDisplay emotions={emotions} />}
        <div className="assistant-message-content message-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
          >
            {content}
          </ReactMarkdown>
        </div>
        <div className="assistant-message-footer">
          <span className="assistant-message-timestamp message-time">
            {formatTime(timestamp)}
          </span>
          <TTSButton text={content} />
        </div>
      </div>
    </div>
  );
};
