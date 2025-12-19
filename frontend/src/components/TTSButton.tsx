/**
 * TTSButton - UI button component for triggering TTS synthesis and playback.
 *
 * Purpose:
 * - Display speaker icon button for text-to-speech
 * - Show loading spinner while synthesizing speech
 * - Show playing state during audio playback
 * - Display error state if synthesis fails
 * - Handle user interactions (click to play/stop)
 */

import React from 'react';
import { useTTS } from '../hooks/useTTS';
import './TTSButton.css';

export interface TTSButtonProps {
  text: string;
  disabled?: boolean;
}

/**
 * Speaker icon component (idle state).
 */
const SpeakerIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

/**
 * Spinner icon component (loading state).
 */
const SpinnerIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="spinner-icon">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.25" />
    <path d="M12 2 A10 10 0 0 1 22 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * Pause/Playing icon component (playing state).
 */
const PauseIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

/**
 * Error icon component (error state).
 */
const ErrorIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
  </svg>
);

/**
 * TTSButton component.
 *
 * @param text - The message text to synthesize
 * @param disabled - Optional external disable flag
 */
export const TTSButton: React.FC<TTSButtonProps> = ({ text, disabled = false }) => {
  const { state, error, synthesizeAndPlay, stopAudio } = useTTS();

  /**
   * Handle button click - toggle between play and stop.
   */
  const handleClick = () => {
    if (state === 'playing') {
      stopAudio();
    } else {
      synthesizeAndPlay(text);
    }
  };

  /**
   * Get the appropriate icon based on current state.
   */
  const getButtonIcon = () => {
    switch (state) {
      case 'idle':
        return <SpeakerIcon />;
      case 'loading':
        return <SpinnerIcon />;
      case 'playing':
        return <PauseIcon />;
      case 'error':
        return <ErrorIcon />;
      default:
        return <SpeakerIcon />;
    }
  };

  /**
   * Get appropriate ARIA label based on current state.
   */
  const getAriaLabel = (): string => {
    switch (state) {
      case 'idle':
        return 'Play text-to-speech';
      case 'loading':
        return 'Synthesizing speech...';
      case 'playing':
        return 'Stop audio playback';
      case 'error':
        return 'Retry text-to-speech';
      default:
        return 'Text-to-speech';
    }
  };

  const isButtonDisabled = state === 'loading' || disabled;

  return (
    <div className="tts-button-container">
      <button
        onClick={handleClick}
        disabled={isButtonDisabled}
        aria-label={getAriaLabel()}
        aria-busy={state === 'loading'}
        className={`tts-button tts-button--${state}`}
        data-testid="tts-button"
      >
        {getButtonIcon()}
      </button>
      {error && (
        <span className="tts-error" role="alert" aria-live="polite">
          {error.message}
        </span>
      )}
    </div>
  );
};

export default TTSButton;
