/**
 * MessageInput component - input field for sending messages.
 *
 * This component handles message composition and submission.
 */

import React, { useState } from 'react';
import { useMessageStoreEnhanced } from '../store/messageStoreEnhanced';
import { Loader } from './Loader';

interface MessageInputProps {
  characterId: string | null;
}

export const MessageInput: React.FC<MessageInputProps> = ({ characterId }) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { sendMessage, isLoading, getLoadingState } = useMessageStoreEnhanced();

  const isSending = characterId ? isLoading(characterId, 'send') : false;
  const storeError = characterId ? getLoadingState(characterId, 'send').error : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!characterId) {
      setError('Please select a character first');
      return;
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) {
      return;
    }

    setError(null);
    const success = await sendMessage(characterId, trimmedMessage);

    if (success) {
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const isDisabled = !characterId || isSending;
  const displayError = error || storeError;

  return (
    <div className="message-input">
      <form onSubmit={handleSubmit}>
        <label htmlFor="message-textarea" className="sr-only">
          Message input
        </label>
        <textarea
          id="message-textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={!characterId ? 'Select a character to start chatting' : 'Type a message...'}
          disabled={isDisabled}
          className="message-textarea"
          aria-label="Message input"
          aria-invalid={!!displayError}
          aria-describedby={displayError ? 'message-error' : undefined}
        />
        <button
          type="submit"
          disabled={!message.trim() || isDisabled}
          className="send-button"
          aria-label="Send message"
          aria-disabled={!message.trim() || isDisabled}
        >
          {isSending ? <Loader variant="inline" size="sm" text="Sending..." /> : 'Send'}
        </button>
      </form>
      {displayError && (
        <div
          id="message-error"
          className="error-message"
          role="alert"
          aria-live="polite"
          data-testid="message-error"
        >
          {displayError}
        </div>
      )}
    </div>
  );
};
