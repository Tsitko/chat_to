/**
 * TTSService - HTTP client for Text-to-Speech API communication.
 *
 * Responsibilities:
 * - Send POST requests to /api/tts endpoint
 * - Parse responses and extract audio file paths
 * - Handle HTTP errors with specific error types
 * - Throw typed TTSError for different failure modes
 */

import { TTSRequest, TTSResponse, TTSError } from '../types/tts';

export class TTSService {
  private readonly baseUrl: string;

  /**
   * Create a new TTSService instance.
   * @param baseUrl - Base URL for API requests (default: empty string for relative URLs)
   */
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Request speech synthesis for the given text.
   *
   * @param text - The message content to synthesize into speech
   * @returns Promise resolving to audio file path (e.g., '/audio/abc123.ogg')
   * @throws TTSError with specific type and message for different failure modes
   */
  async synthesizeSpeech(text: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      throw new TTSError('unknown', 'TTS request failed');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text } as TTSRequest),
      });

      if (!response.ok) {
        const errorType = this.mapStatusToErrorType(response.status);
        const message = this.getErrorMessage(response.status);
        throw new TTSError(errorType, message);
      }

      const data: TTSResponse = await response.json();
      return data.audio_path;
    } catch (error) {
      // Re-throw if it's already a TTSError
      if (error instanceof TTSError) {
        throw error;
      }
      // Handle network errors (e.g., no internet connection)
      if (error instanceof TypeError) {
        throw new TTSError('network', 'Network error occurred');
      }
      // Handle other unexpected errors
      throw new TTSError('unknown', 'An unexpected error occurred');
    }
  }

  /**
   * Map HTTP status code to TTSError type.
   *
   * @param status - HTTP status code
   * @returns Error type for the given status
   */
  private mapStatusToErrorType(status: number): TTSError['type'] {
    switch (status) {
      case 503:
        return 'service';
      case 504:
        return 'timeout';
      default:
        return 'unknown';
    }
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
        return 'TTS service is offline';
      case 504:
        return 'TTS request timed out (5 minute limit)';
      case 500:
        return 'TTS processing failed';
      default:
        return 'TTS request failed';
    }
  }
}

/**
 * Singleton instance of TTSService for use throughout the application.
 */
export const ttsService = new TTSService();
