/**
 * RecordButton component - UI component for recording button with visual states.
 *
 * Responsibilities:
 * - Display recording button with appropriate state (idle/recording/processing)
 * - Handle click events to start/stop recording
 * - Show duration counter during recording
 * - Display error messages
 * - Provide accessibility support (ARIA labels, keyboard support)
 */

import React from 'react';
import { useSTT } from '../hooks/useSTT';
import { Loader } from './Loader';
import './RecordButton.css';

interface RecordButtonProps {
  characterId: string | null;
  disabled?: boolean;
  onTranscription?: (text: string) => void;
}

/**
 * Format milliseconds to MM:SS display.
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string (e.g., "01:23")
 */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * RecordButton component.
 *
 * Displays a button for recording audio that changes state based on
 * recording status (idle/recording/processing).
 *
 * @param props - Component props
 * @returns RecordButton component
 */
export const RecordButton: React.FC<RecordButtonProps> = ({ characterId, disabled = false, onTranscription }) => {
  const { recordingState, isProcessing, error, startRecording, stopAndTranscribe, duration } =
    useSTT(characterId, onTranscription);

  /**
   * Handle button click based on current state.
   */
  const handleClick = async () => {
    if (recordingState === 'idle' && !isProcessing) {
      await startRecording();
    } else if (recordingState === 'recording') {
      await stopAndTranscribe();
    }
    // If processing: do nothing (button is disabled)
  };

  // Calculate button properties based on state
  const isIdle = recordingState === 'idle' && !isProcessing;
  const isRecording = recordingState === 'recording';
  const isProcessingState = recordingState === 'processing' || isProcessing;
  const isDisabled = !characterId || disabled || isProcessingState;

  // Button label based on state (check processing first)
  let buttonLabel = 'Record';
  if (isProcessingState) {
    buttonLabel = 'Processing...';
  } else if (isRecording) {
    buttonLabel = `Stop (${formatDuration(duration)})`;
  }

  // Button class based on state
  const buttonClass = [
    'record-button',
    isRecording && 'recording',
    isProcessingState && 'processing',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="record-button-container">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={buttonClass}
        aria-label={buttonLabel}
        aria-disabled={isDisabled}
        data-testid="record-button"
      >
        {isProcessingState ? (
          <Loader variant="inline" size="sm" text="Processing..." />
        ) : (
          buttonLabel
        )}
      </button>
      {error && (
        <div
          className="error-message"
          role="alert"
          aria-live="polite"
          data-testid="record-error"
        >
          {error}
        </div>
      )}
    </div>
  );
};
