/**
 * STTService - HTTP client for Speech-to-Text API communication.
 *
 * Responsibilities:
 * - Send POST requests to /api/stt endpoint with audio files
 * - Parse responses and extract transcribed text
 * - Handle HTTP errors with specific error types
 * - Throw typed STTError for different failure modes
 */

import { STTResponse, STTError, STTErrorType } from '../types/stt';

export class STTService {
  private readonly baseUrl: string;

  /**
   * Create a new STTService instance.
   *
   * @param baseUrl - Base URL for API requests (default: empty string for relative URLs)
   */
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Send audio file to backend and get transcribed text.
   *
   * @param audioBlob - Recorded audio as Blob
   * @param filename - Optional filename for content disposition (default: 'recording.webm')
   * @returns Promise resolving to transcribed text string
   * @throws STTError with specific type and message for different failure modes
   */
  async transcribeAudio(audioBlob: Blob, filename: string = 'recording.webm'): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, filename);

    try {
      const response = await fetch(`${this.baseUrl}/api/stt/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorType = this.mapStatusToErrorType(response.status);
        const errorMessage = this.getErrorMessage(response.status);
        throw new STTError(errorType, errorMessage);
      }

      const data: STTResponse = await response.json();

      // Validate transcribed_text field
      if (typeof data.transcribed_text !== 'string') {
        throw new STTError('unknown', 'Invalid response format from STT service');
      }

      return data.transcribed_text;
    } catch (error) {
      if (error instanceof STTError) {
        throw error;
      }

      // Network error (TypeError from fetch)
      if (error instanceof TypeError) {
        throw new STTError('network', 'network error. Please check your connection.');
      }

      // Unknown error
      throw new STTError('unknown', 'Transcription failed. Please try again.');
    }
  }

  /**
   * Map HTTP status code to STTError type.
   *
   * @param status - HTTP status code
   * @returns Error type for the given status
   */
  private mapStatusToErrorType(status: number): STTErrorType {
    if (status === 503) {
      return 'service';
    }
    if (status === 504) {
      return 'timeout';
    }
    return 'unknown';
  }

  /**
   * Get user-friendly error message for HTTP status code.
   *
   * @param status - HTTP status code
   * @returns User-friendly error message
   */
  private getErrorMessage(status: number): string {
    switch (status) {
      case 503:
        return 'STT service is offline. Please try again later.';
      case 504:
        return 'Transcription timed out. Try a shorter recording.';
      case 400:
        return 'Invalid audio format. Please try again.';
      case 422:
        return 'Audio file could not be processed. Please try again.';
      default:
        return 'Transcription failed. Please try again.';
    }
  }
}

/**
 * Singleton instance of STTService for use throughout the application.
 */
export const sttService = new STTService();
