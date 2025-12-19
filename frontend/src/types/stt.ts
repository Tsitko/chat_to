/**
 * STT types module.
 *
 * This module provides TypeScript type definitions for Speech-to-Text functionality.
 */

/**
 * Response from backend /api/stt endpoint.
 */
export interface STTResponse {
  transcribed_text: string;
}

/**
 * STT error types for specific failure modes.
 */
export type STTErrorType = 'network' | 'service' | 'timeout' | 'unknown';

/**
 * Custom error class for STT operations.
 */
export class STTError extends Error {
  public readonly type: STTErrorType;

  /**
   * Create a new STT error.
   *
   * @param type - Error type (network, service, timeout, unknown)
   * @param message - User-friendly error message
   */
  constructor(type: STTErrorType, message: string) {
    super(message);
    this.type = type;
    this.name = 'STTError';
  }
}

/**
 * Recording state machine states.
 */
export type RecordingState = 'idle' | 'recording' | 'processing';

/**
 * Audio recording result.
 */
export interface AudioRecording {
  blob: Blob;           // Audio data as Blob
  mimeType: string;     // MIME type (e.g., 'audio/webm')
  duration: number;     // Recording duration in milliseconds
}
