/**
 * GroupMessageInput component - input field for sending messages in groups.
 *
 * This component handles message composition and submission for group chats.
 * Similar to MessageInput but sends messages to groups (multiple characters).
 *
 * Responsibilities:
 * - Provide textarea for message composition
 * - Handle message submission (sends to all group members)
 * - Integrate STT (speech-to-text) via RecordButton
 * - Show loading state while sending
 * - Display errors
 * - Disable input when no group selected, while sending, or while clearing
 */

import React, { useState } from 'react';
import { useGroupMessageStore } from '../store/groupMessageStore';
import { useGroupStore } from '../store/groupStore';
import { Loader } from './Loader';
import { RecordButton } from './RecordButton';
import type { Group } from '../types/group';

/**
 * Props for GroupMessageInput component.
 */
interface GroupMessageInputProps {
  /**
   * ID of the selected group (null if none selected).
   */
  groupId: string | null;
}

/**
 * GroupMessageInput component.
 *
 * Provides input interface for sending messages to group chats.
 * Supports both text input and voice recording (STT).
 */
export const GroupMessageInput: React.FC<GroupMessageInputProps> = ({ groupId }) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { sendGroupMessage, isSending, isClearing } = useGroupMessageStore();
  const { selectedGroup } = useGroupStore();

  const isSendingMessage = groupId ? isSending[groupId] : false;
  const isClearingMessages = groupId ? isClearing[groupId] : false;
  const isDisabled = isSendingMessage || isClearingMessages;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupId) {
      setError('Please select a group first');
      return;
    }

    if (!selectedGroup) {
      setError('Group not found');
      return;
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSendingMessage) {
      return;
    }

    setError(null);

    try {
      await sendGroupMessage(groupId, trimmedMessage, selectedGroup.character_ids);
      setMessage('');
    } catch (err) {
      setError('Failed to send message');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleTranscription = async (transcript: string) => {
    if (!groupId || !selectedGroup) {
      setError('Group not found');
      return;
    }

    const trimmedMessage = transcript.trim();
    if (!trimmedMessage) {
      return;
    }

    setError(null);

    try {
      await sendGroupMessage(groupId, trimmedMessage, selectedGroup.character_ids);
    } catch (err) {
      setError('Failed to send message');
    }
  };

  return (
    <div className="message-input group-message-input" data-testid="group-message-input">
      <form onSubmit={handleSubmit}>
        <label htmlFor="group-message-textarea" className="sr-only">
          Group message input
        </label>
        <textarea
          id="group-message-textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            !groupId
              ? 'Select a group to start chatting'
              : isClearingMessages
              ? 'Clearing messages...'
              : 'Type a message...'
          }
          disabled={!groupId || isDisabled}
          className="message-textarea"
          aria-label="Group message input"
          aria-invalid={!!error}
          aria-describedby={error ? 'group-message-error' : undefined}
          data-testid="group-message-textarea"
        />
        <div className="button-group">
          <RecordButton
            characterId={groupId || undefined}
            disabled={!groupId || isDisabled}
            onTranscription={handleTranscription}
          />
          <button
            type="submit"
            disabled={!message.trim() || !groupId || isDisabled}
            className="send-button"
            aria-label="Send message to group"
            data-testid="group-send-button"
          >
            {isSendingMessage ? (
              <Loader variant="inline" size="sm" text="Sending..." />
            ) : isClearingMessages ? (
              <Loader variant="inline" size="sm" text="Clearing..." />
            ) : (
              'Send'
            )}
          </button>
        </div>
      </form>
      {error && (
        <div
          id="group-message-error"
          className="error-message"
          role="alert"
          aria-live="polite"
          data-testid="group-message-error"
        >
          {error}
        </div>
      )}
    </div>
  );
};
