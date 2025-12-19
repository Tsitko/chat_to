/**
 * Type definitions for Text-to-Speech (TTS) functionality.
 */

/**
 * Request payload for TTS API.
 */
export interface TTSRequest {
  text: string;
}

/**
 * Response from TTS API.
 */
export interface TTSResponse {
  audio_path: string;
}

/**
 * TTS state machine states.
 */
export type TTSState = 'idle' | 'loading' | 'playing' | 'error';

/**
 * Custom error class for TTS operations.
 */
export class TTSError extends Error {
  constructor(
    public type: 'network' | 'service' | 'timeout' | 'playback' | 'unknown',
    message: string
  ) {
    super(message);
    this.name = 'TTSError';
  }
}
