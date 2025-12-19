/**
 * TTSService Unit Tests.
 *
 * Comprehensive tests for TTS API service covering:
 * - Successful TTS synthesis
 * - Empty text validation
 * - HTTP error handling (503, 504, 500)
 * - Network error handling
 * - Response parsing
 * - Error type mapping
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TTSService } from '../ttsService';
import { TTSError } from '../../types/tts';

describe('TTSService', () => {
  let service: TTSService;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new TTSService();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful Synthesis', () => {
    it('should synthesize speech successfully and return audio path', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/abc123.ogg' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.synthesizeSpeech('Hello world');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello world' }),
      });
      expect(result).toBe('/audio/abc123.ogg');
    });

    it('should handle text with special characters', async () => {
      // Arrange
      const textWithSpecialChars = 'Hello! @#$%^&*() <script>alert("xss")</script>';
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/special123.ogg' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.synthesizeSpeech(textWithSpecialChars);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textWithSpecialChars }),
      });
      expect(result).toBe('/audio/special123.ogg');
    });

    it('should handle text with unicode characters', async () => {
      // Arrange
      const unicodeText = 'Привет мир! 你好世界';
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/unicode123.ogg' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.synthesizeSpeech(unicodeText);

      // Assert
      expect(result).toBe('/audio/unicode123.ogg');
    });

    it('should handle very long text', async () => {
      // Arrange
      const longText = 'Lorem ipsum dolor sit amet. '.repeat(500);
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/long123.ogg' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.synthesizeSpeech(longText);

      // Assert
      expect(result).toBe('/audio/long123.ogg');
      expect(mockFetch).toHaveBeenCalledWith('/api/tts', expect.objectContaining({
        body: JSON.stringify({ text: longText }),
      }));
    });

    it('should handle text with newlines and tabs', async () => {
      // Arrange
      const formattedText = 'Line 1\nLine 2\n\tIndented line';
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/formatted123.ogg' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.synthesizeSpeech(formattedText);

      // Assert
      expect(result).toBe('/audio/formatted123.ogg');
    });
  });

  describe('Empty Text Validation', () => {
    it('should handle empty string text', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Text cannot be empty' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.synthesizeSpeech('')).rejects.toThrow(TTSError);
      await expect(service.synthesizeSpeech('')).rejects.toThrow('TTS request failed');
    });

    it('should handle whitespace-only text', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Text cannot be empty' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.synthesizeSpeech('   ')).rejects.toThrow(TTSError);
    });

    it('should send request even with single character', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/single.ogg' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.synthesizeSpeech('a');

      // Assert
      expect(result).toBe('/audio/single.ogg');
      expect(mockFetch).toHaveBeenCalledWith('/api/tts', expect.objectContaining({
        body: JSON.stringify({ text: 'a' }),
      }));
    });
  });

  describe('Service Unavailable (503) Error', () => {
    it('should throw TTSError with service type on 503 error', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 503,
        json: async () => ({ detail: 'Service unavailable' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.synthesizeSpeech('Hello')).rejects.toThrow(TTSError);

      try {
        await service.synthesizeSpeech('Hello');
      } catch (error) {
        expect(error).toBeInstanceOf(TTSError);
        expect((error as TTSError).type).toBe('service');
        expect((error as TTSError).message).toBe('TTS service is offline');
      }
    });

    it('should handle 503 with different error messages', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 503,
        json: async () => ({ detail: 'Ollama service not responding' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      try {
        await service.synthesizeSpeech('Test');
      } catch (error) {
        expect(error).toBeInstanceOf(TTSError);
        expect((error as TTSError).type).toBe('service');
      }
    });

    it('should handle 503 without response body', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 503,
        json: async () => ({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.synthesizeSpeech('Hello')).rejects.toThrow(TTSError);
    });
  });

  describe('Timeout (504) Error', () => {
    it('should throw TTSError with timeout type on 504 error', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 504,
        json: async () => ({ detail: 'Gateway timeout' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.synthesizeSpeech('Long text')).rejects.toThrow(TTSError);

      try {
        await service.synthesizeSpeech('Long text');
      } catch (error) {
        expect(error).toBeInstanceOf(TTSError);
        expect((error as TTSError).type).toBe('timeout');
        expect((error as TTSError).message).toBe('TTS request timed out (5 minute limit)');
      }
    });

    it('should handle 504 with custom error message', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 504,
        json: async () => ({ detail: 'Request exceeded 300 second timeout' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      try {
        await service.synthesizeSpeech('Very long text');
      } catch (error) {
        expect(error).toBeInstanceOf(TTSError);
        expect((error as TTSError).type).toBe('timeout');
      }
    });
  });

  describe('Generic Server Error (500)', () => {
    it('should throw TTSError with unknown type on 500 error', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal server error' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.synthesizeSpeech('Test')).rejects.toThrow(TTSError);

      try {
        await service.synthesizeSpeech('Test');
      } catch (error) {
        expect(error).toBeInstanceOf(TTSError);
        expect((error as TTSError).type).toBe('unknown');
        expect((error as TTSError).message).toBe('TTS processing failed');
      }
    });

    it('should handle 500 with detailed error message', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 500,
        json: async () => ({ detail: 'TTS model failed to load' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      try {
        await service.synthesizeSpeech('Test');
      } catch (error) {
        expect(error).toBeInstanceOf(TTSError);
        expect((error as TTSError).type).toBe('unknown');
      }
    });
  });

  describe('Network Errors', () => {
    it('should throw TTSError with network type on fetch failure', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      // Act & Assert
      await expect(service.synthesizeSpeech('Hello')).rejects.toThrow(TTSError);

      try {
        await service.synthesizeSpeech('Hello');
      } catch (error) {
        expect(error).toBeInstanceOf(TTSError);
        expect((error as TTSError).type).toBe('network');
        expect((error as TTSError).message).toBe('Network error occurred');
      }
    });

    it('should handle network timeout (AbortError)', async () => {
      // Arrange
      const abortError = new Error('The user aborted a request');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      // Act & Assert
      await expect(service.synthesizeSpeech('Hello')).rejects.toThrow(TTSError);
    });

    it('should handle connection refused', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new TypeError('Network request failed'));

      // Act & Assert
      try {
        await service.synthesizeSpeech('Hello');
      } catch (error) {
        expect(error).toBeInstanceOf(TTSError);
        expect((error as TTSError).type).toBe('network');
      }
    });

    it('should handle DNS resolution failure', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new TypeError('getaddrinfo ENOTFOUND'));

      // Act & Assert
      try {
        await service.synthesizeSpeech('Hello');
      } catch (error) {
        expect(error).toBeInstanceOf(TTSError);
        expect((error as TTSError).type).toBe('network');
      }
    });
  });

  describe('Response Parsing Errors', () => {
    it('should handle invalid JSON response', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.synthesizeSpeech('Hello')).rejects.toThrow(TTSError);
    });

    it('should handle missing audio_path in response', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.synthesizeSpeech('Hello');

      // Assert - should return undefined but not throw
      expect(result).toBeUndefined();
    });

    it('should handle malformed audio_path in response', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ audio_path: null }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.synthesizeSpeech('Hello');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle response with extra fields', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          audio_path: '/audio/test.ogg',
          duration: 5.2,
          format: 'ogg',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.synthesizeSpeech('Hello');

      // Assert
      expect(result).toBe('/audio/test.ogg');
    });
  });

  describe('HTTP Status Code Edge Cases', () => {
    it('should handle 400 bad request', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Invalid request' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.synthesizeSpeech('Test')).rejects.toThrow(TTSError);
    });

    it('should handle 401 unauthorized', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.synthesizeSpeech('Test')).rejects.toThrow(TTSError);
    });

    it('should handle 403 forbidden', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Forbidden' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.synthesizeSpeech('Test')).rejects.toThrow(TTSError);
    });

    it('should handle 404 not found', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Endpoint not found' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.synthesizeSpeech('Test')).rejects.toThrow(TTSError);
    });

    it('should handle 429 too many requests', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 429,
        json: async () => ({ detail: 'Rate limit exceeded' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.synthesizeSpeech('Test')).rejects.toThrow(TTSError);
    });

    it('should handle 502 bad gateway', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 502,
        json: async () => ({ detail: 'Bad gateway' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.synthesizeSpeech('Test')).rejects.toThrow(TTSError);
    });

    it('should handle unexpected 2xx status codes', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 201,
        json: async () => ({ audio_path: '/audio/created.ogg' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.synthesizeSpeech('Test');

      // Assert - should still work with 201 Created
      expect(result).toBe('/audio/created.ogg');
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple simultaneous requests', async () => {
      // Arrange
      const mockResponse1 = {
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/req1.ogg' }),
      };
      const mockResponse2 = {
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/req2.ogg' }),
      };
      const mockResponse3 = {
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/req3.ogg' }),
      };
      mockFetch
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2)
        .mockResolvedValueOnce(mockResponse3);

      // Act
      const results = await Promise.all([
        service.synthesizeSpeech('Text 1'),
        service.synthesizeSpeech('Text 2'),
        service.synthesizeSpeech('Text 3'),
      ]);

      // Assert
      expect(results).toEqual(['/audio/req1.ogg', '/audio/req2.ogg', '/audio/req3.ogg']);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure in concurrent requests', async () => {
      // Arrange
      const mockSuccess = {
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/success.ogg' }),
      };
      const mockError = {
        ok: false,
        status: 503,
        json: async () => ({ detail: 'Service unavailable' }),
      };
      mockFetch.mockResolvedValueOnce(mockSuccess).mockResolvedValueOnce(mockError);

      // Act & Assert
      const results = await Promise.allSettled([
        service.synthesizeSpeech('Text 1'),
        service.synthesizeSpeech('Text 2'),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });
  });

  describe('Custom Base URL', () => {
    it('should use custom base URL when provided', async () => {
      // Arrange
      const customService = new TTSService('https://custom-api.com');
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/test.ogg' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      await customService.synthesizeSpeech('Hello');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('https://custom-api.com/api/tts', expect.any(Object));
    });

    it('should use default base URL when not provided', async () => {
      // Arrange
      const defaultService = new TTSService();
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/test.ogg' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      await defaultService.synthesizeSpeech('Hello');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/tts', expect.any(Object));
    });
  });

  describe('Error Propagation', () => {
    it('should preserve TTSError when caught and re-thrown', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 503,
        json: async () => ({ detail: 'Service unavailable' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      try {
        await service.synthesizeSpeech('Test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(TTSError);
        expect((error as TTSError).type).toBe('service');
        expect((error as TTSError).message).toBe('TTS service is offline');
      }
    });

    it('should wrap non-TTSError exceptions in TTSError', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Unknown error'));

      // Act & Assert
      try {
        await service.synthesizeSpeech('Test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(TTSError);
        expect((error as TTSError).type).toBe('unknown');
      }
    });
  });
});
