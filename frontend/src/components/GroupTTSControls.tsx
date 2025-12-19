/**
 * GroupTTSControls component - playlist controls for group chat TTS.
 *
 * This component provides controls for sequential playback of all character
 * responses in a group chat. Similar to a media player with playlist support.
 *
 * Responsibilities:
 * - Render play all / stop all buttons
 * - Show current playback position (e.g., "2 of 5")
 * - Provide next/previous controls
 * - Display current character name being played
 * - Show loading/error states
 * - Integrate with useGroupTTS hook
 */

import React from 'react';
import { useGroupTTS } from '../hooks/useGroupTTS';
import type { GroupMessage } from '../types/group';

/**
 * Props for GroupTTSControls component.
 */
export interface GroupTTSControlsProps {
  /**
   * Array of group messages to play.
   * Only assistant messages will be played.
   */
  messages: GroupMessage[];

  /**
   * Additional CSS classes.
   */
  className?: string;
}

/**
 * GroupTTSControls component.
 *
 * Renders playlist-style controls for playing all character responses
 * in a group chat sequentially.
 */
export const GroupTTSControls: React.FC<GroupTTSControlsProps> = ({
  messages,
  className = '',
}) => {
  const {
    state,
    error,
    currentMessageId,
    currentIndex,
    totalMessages,
    hasNext,
    hasPrevious,
    playAllResponses,
    stopPlayback,
    playNext,
    playPrevious,
  } = useGroupTTS();

  // Filter only assistant messages
  const assistantMessages = messages.filter((msg) => msg.role === 'assistant');

  const isPlaying = state === 'playing';
  const isLoading = state === 'loading';
  const hasError = state === 'error';
  const isIdle = state === 'idle';

  // Find current message details
  const currentMessage = currentMessageId
    ? assistantMessages.find((msg) => msg.id === currentMessageId)
    : null;

  const handlePlayAll = async () => {
    if (isPlaying || isLoading) {
      // Stop if already playing
      stopPlayback();
    } else {
      // Play all assistant messages
      await playAllResponses(messages);
    }
  };

  const handleNext = async () => {
    if (hasNext) {
      await playNext();
    }
  };

  const handlePrevious = async () => {
    if (hasPrevious) {
      await playPrevious();
    }
  };

  // Don't render if no assistant messages
  if (assistantMessages.length === 0) {
    return null;
  }

  return (
    <div
      className={`group-tts-controls ${className}`}
      data-testid="group-tts-controls"
      role="group"
      aria-label="Group TTS playback controls"
    >
      <div className="group-tts-controls-main">
        {/* Play/Stop All Button */}
        <button
          className={`tts-control-button play-all-button ${isPlaying ? 'playing' : ''}`}
          onClick={handlePlayAll}
          disabled={isLoading}
          aria-label={isPlaying ? 'Stop all responses' : 'Play all responses'}
          data-testid="group-tts-play-all"
          title={isPlaying ? 'Stop All' : 'Play All Responses'}
        >
          <span className="tts-icon">{isPlaying || isLoading ? '⏸' : '▶'}</span>
          <span className="tts-label">
            {isLoading ? 'Loading...' : isPlaying ? 'Stop All' : 'Play All'}
          </span>
        </button>

        {/* Previous Button */}
        <button
          className="tts-control-button previous-button"
          onClick={handlePrevious}
          disabled={!hasPrevious || isLoading}
          aria-label="Previous response"
          data-testid="group-tts-previous"
          title="Previous"
        >
          <span className="tts-icon">⏮</span>
        </button>

        {/* Next Button */}
        <button
          className="tts-control-button next-button"
          onClick={handleNext}
          disabled={!hasNext || isLoading}
          aria-label="Next response"
          data-testid="group-tts-next"
          title="Next"
        >
          <span className="tts-icon">⏭</span>
        </button>
      </div>

      {/* Playback Status */}
      <div className="group-tts-status" data-testid="group-tts-status">
        {isPlaying && currentMessage && (
          <div className="tts-now-playing">
            <span className="tts-status-label">Now playing:</span>
            <span className="tts-character-name">{currentMessage.character_name}</span>
            <span className="tts-position">
              ({currentIndex + 1} of {totalMessages})
            </span>
          </div>
        )}

        {hasError && error && (
          <div className="tts-error" role="alert" data-testid="group-tts-error">
            Error: {error.message}
          </div>
        )}

        {isIdle && totalMessages > 0 && (
          <div className="tts-idle-status">
            <span className="tts-status-label">
              {totalMessages} response{totalMessages > 1 ? 's' : ''} available
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupTTSControls;
