/**
 * GroupTTSButton component - TTS button for individual messages in group chat.
 *
 * This component is similar to TTSButton but designed for group chat messages.
 * It allows playing individual character responses in a group conversation.
 *
 * Responsibilities:
 * - Render play/stop button for a single message
 * - Indicate when this message is playing
 * - Integrate with useGroupTTS hook for sequential playback
 * - Show loading state during synthesis
 * - Handle errors gracefully
 */

import React from 'react';
import { useGroupTTS } from '../hooks/useGroupTTS';

/**
 * Props for GroupTTSButton component.
 */
export interface GroupTTSButtonProps {
  /**
   * Message ID to play.
   */
  messageId: string;

  /**
   * Text content to synthesize.
   */
  text: string;

  /**
   * Character name for display (optional).
   */
  characterName?: string;

  /**
   * Additional CSS classes.
   */
  className?: string;
}

/**
 * GroupTTSButton component.
 *
 * Renders a play/stop button for TTS playback of a single message.
 * Integrates with group TTS state for sequential playback support.
 */
export const GroupTTSButton: React.FC<GroupTTSButtonProps> = ({
  messageId,
  text,
  characterName,
  className = '',
}) => {
  const { state, currentMessageId, playMessage, stopPlayback } = useGroupTTS();

  const isCurrentMessage = currentMessageId === messageId;
  const isPlaying = isCurrentMessage && state === 'playing';
  const isLoading = isCurrentMessage && state === 'loading';
  const hasError = isCurrentMessage && state === 'error';

  const handleClick = async () => {
    if (isPlaying || isLoading) {
      // Stop playback if this message is currently playing
      stopPlayback();
    } else {
      // Start playback
      await playMessage(messageId, text, characterName);
    }
  };

  const getButtonLabel = (): string => {
    if (isLoading) return 'Loading...';
    if (isPlaying) return 'Stop';
    if (hasError) return 'Error';
    return 'Play';
  };

  const getIcon = (): string => {
    if (isLoading) return '⏳';
    if (isPlaying) return '⏸';
    if (hasError) return '⚠';
    return '▶';
  };

  return (
    <button
      className={`tts-button group-tts-button ${className} ${isPlaying ? 'playing' : ''} ${
        hasError ? 'error' : ''
      }`}
      onClick={handleClick}
      disabled={isLoading}
      aria-label={`${getButtonLabel()} audio for ${characterName || 'message'}`}
      data-testid={`group-tts-button-${messageId}`}
      title={getButtonLabel()}
    >
      <span className="tts-icon">{getIcon()}</span>
      <span className="tts-label sr-only">{getButtonLabel()}</span>
    </button>
  );
};

export default GroupTTSButton;
