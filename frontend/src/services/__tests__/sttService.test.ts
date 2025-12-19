/**
 * STTService Unit Tests.
 *
 * Comprehensive tests for STTService class covering:
 * - Successful transcription
 * - Network errors (fetch failures)
 * - Service unavailable (503)
 * - Timeout errors (504)
 * - Unknown errors (500, other status codes)
 * - Response parsing
 * - Error type mapping
 * - FormData creation
 * - Edge cases (empty blob, large blob, invalid responses)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { STTService } from '../sttService';
import { STTError } from '../../types/stt';

// Mock global fetch
global.fetch = vi.fn();

describe('STTService', () => {
  let service: STTService;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new STTService();
    mockFetch = vi.mocked(fetch);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with default baseUrl', () => {
      // Arrange & Act
      const svc = new STTService();

      // Assert
      expect(svc).toBeInstanceOf(STTService);
    });

    it('should create instance with custom baseUrl', () => {
      // Arrange & Act
      const svc = new STTService('http://localhost:1310');

      // Assert
      expect(svc).toBeInstanceOf(STTService);
    });
  });

  describe('transcribeAudio - Success Cases', () => {
    it('should successfully transcribe audio and return text', async () => {
      // Arrange
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const expectedText = 'Hello world, this is a test transcription';

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: expectedText }),
      } as Response);

      // Act
      const result = await service.transcribeAudio(mockBlob);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/stt/',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );

      // Verify FormData contains audio file
      const callArgs = mockFetch.mock.calls[0];
      const formData = callArgs[1]?.body as FormData;
      expect(formData.has('file')).toBe(true);

      expect(result).toBe(expectedText);
    });

    it('should use default filename when not provided', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: 'test' }),
      } as Response);

      // Act
      await service.transcribeAudio(mockBlob);

      // Assert
      const callArgs = mockFetch.mock.calls[0];
      const formData = callArgs[1]?.body as FormData;
      const audioFile = formData.get('file') as File;
      expect(audioFile.name).toBe('recording.webm');
    });

    it('should use custom filename when provided', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      const customFilename = 'my-recording.webm';
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: 'test' }),
      } as Response);

      // Act
      await service.transcribeAudio(mockBlob, customFilename);

      // Assert
      const callArgs = mockFetch.mock.calls[0];
      const formData = callArgs[1]?.body as FormData;
      const audioFile = formData.get('file') as File;
      expect(audioFile.name).toBe(customFilename);
    });

    it('should handle empty transcription response', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: '' }),
      } as Response);

      // Act
      const result = await service.transcribeAudio(mockBlob);

      // Assert
      expect(result).toBe('');
    });

    it('should handle very long transcription text', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      const longText = 'a'.repeat(10000);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: longText }),
      } as Response);

      // Act
      const result = await service.transcribeAudio(mockBlob);

      // Assert
      expect(result).toBe(longText);
      expect(result.length).toBe(10000);
    });

    it('should handle transcription with special characters', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      const specialText = 'Hello! @#$%^&*() <script>alert("xss")</script> Привет 你好';
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: specialText }),
      } as Response);

      // Act
      const result = await service.transcribeAudio(mockBlob);

      // Assert
      expect(result).toBe(specialText);
    });

    it('should use baseUrl when provided in constructor', async () => {
      // Arrange
      const customService = new STTService('http://localhost:1310');
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: 'test' }),
      } as Response);

      // Act
      await customService.transcribeAudio(mockBlob);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:1310/api/stt/',
        expect.any(Object)
      );
    });
  });

  describe('transcribeAudio - Network Errors', () => {
    it('should throw STTError with network type on fetch failure', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      const networkError = new TypeError('Failed to fetch');
      mockFetch.mockRejectedValue(networkError);

      // Act & Assert
      await expect(service.transcribeAudio(mockBlob)).rejects.toThrow(STTError);

      try {
        await service.transcribeAudio(mockBlob);
      } catch (error) {
        expect(error).toBeInstanceOf(STTError);
        expect((error as STTError).type).toBe('network');
        expect((error as STTError).message).toContain('network');
      }
    });

    it('should throw STTError on network timeout', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      const timeoutError = new Error('Network request failed');
      mockFetch.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(service.transcribeAudio(mockBlob)).rejects.toThrow(STTError);
    });

    it('should handle DNS resolution failure', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      const dnsError = new TypeError('NetworkError when attempting to fetch resource');
      mockFetch.mockRejectedValue(dnsError);

      // Act & Assert
      try {
        await service.transcribeAudio(mockBlob);
      } catch (error) {
        expect(error).toBeInstanceOf(STTError);
        expect((error as STTError).type).toBe('network');
      }
    });
  });

  describe('transcribeAudio - HTTP Error Codes', () => {
    it('should throw STTError with service type on 503 response', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      } as Response);

      // Act & Assert
      try {
        await service.transcribeAudio(mockBlob);
        expect.fail('Should have thrown STTError');
      } catch (error) {
        expect(error).toBeInstanceOf(STTError);
        expect((error as STTError).type).toBe('service');
        expect((error as STTError).message).toMatch(/service|unavailable/i);
      }
    });

    it('should throw STTError with timeout type on 504 response', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: false,
        status: 504,
        statusText: 'Gateway Timeout',
      } as Response);

      // Act & Assert
      try {
        await service.transcribeAudio(mockBlob);
        expect.fail('Should have thrown STTError');
      } catch (error) {
        expect(error).toBeInstanceOf(STTError);
        expect((error as STTError).type).toBe('timeout');
        expect((error as STTError).message).toMatch(/timeout|timed out/i);
      }
    });

    it('should throw STTError with unknown type on 500 response', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      // Act & Assert
      try {
        await service.transcribeAudio(mockBlob);
        expect.fail('Should have thrown STTError');
      } catch (error) {
        expect(error).toBeInstanceOf(STTError);
        expect((error as STTError).type).toBe('unknown');
      }
    });

    it('should throw STTError with unknown type on 400 response', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response);

      // Act & Assert
      try {
        await service.transcribeAudio(mockBlob);
      } catch (error) {
        expect(error).toBeInstanceOf(STTError);
        expect((error as STTError).type).toBe('unknown');
      }
    });

    it('should throw STTError with unknown type on 404 response', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      // Act & Assert
      try {
        await service.transcribeAudio(mockBlob);
      } catch (error) {
        expect(error).toBeInstanceOf(STTError);
        expect((error as STTError).type).toBe('unknown');
      }
    });

    it('should throw STTError with unknown type on 413 response (payload too large)', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: false,
        status: 413,
        statusText: 'Payload Too Large',
      } as Response);

      // Act & Assert
      try {
        await service.transcribeAudio(mockBlob);
      } catch (error) {
        expect(error).toBeInstanceOf(STTError);
        expect((error as STTError).type).toBe('unknown');
      }
    });

    it('should throw STTError with unknown type on 415 response (unsupported media type)', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: false,
        status: 415,
        statusText: 'Unsupported Media Type',
      } as Response);

      // Act & Assert
      try {
        await service.transcribeAudio(mockBlob);
      } catch (error) {
        expect(error).toBeInstanceOf(STTError);
        expect((error as STTError).type).toBe('unknown');
      }
    });
  });

  describe('transcribeAudio - Response Parsing Errors', () => {
    it('should throw STTError when response is not valid JSON', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token in JSON');
        },
      } as Response);

      // Act & Assert
      await expect(service.transcribeAudio(mockBlob)).rejects.toThrow(STTError);
    });

    it('should throw STTError when response missing transcribed_text field', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ wrong_field: 'test' }),
      } as Response);

      // Act & Assert
      await expect(service.transcribeAudio(mockBlob)).rejects.toThrow();
    });

    it('should handle null transcribed_text field', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: null }),
      } as Response);

      // Act & Assert
      // Should either throw or handle gracefully
      await expect(service.transcribeAudio(mockBlob)).rejects.toThrow();
    });

    it('should handle undefined transcribed_text field', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: undefined }),
      } as Response);

      // Act & Assert
      await expect(service.transcribeAudio(mockBlob)).rejects.toThrow();
    });

    it('should handle number as transcribed_text (type error)', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: 12345 }),
      } as Response);

      // Act & Assert
      // Should either throw or coerce to string
      await expect(service.transcribeAudio(mockBlob)).rejects.toThrow();
    });

    it('should handle array as transcribed_text (type error)', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: ['test', 'array'] }),
      } as Response);

      // Act & Assert
      await expect(service.transcribeAudio(mockBlob)).rejects.toThrow();
    });
  });

  describe('transcribeAudio - Edge Cases', () => {
    it('should handle empty Blob', async () => {
      // Arrange
      const emptyBlob = new Blob([], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: '' }),
      } as Response);

      // Act
      const result = await service.transcribeAudio(emptyBlob);

      // Assert
      expect(result).toBe('');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle very large Blob (10MB)', async () => {
      // Arrange
      const largeData = new Uint8Array(10 * 1024 * 1024); // 10MB
      const largeBlob = new Blob([largeData], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: 'transcribed large file' }),
      } as Response);

      // Act
      const result = await service.transcribeAudio(largeBlob);

      // Assert
      expect(result).toBe('transcribed large file');
    });

    it('should handle Blob with different MIME types', async () => {
      // Arrange
      const mimeTypes = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav'];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: 'test' }),
      } as Response);

      // Act & Assert
      for (const mimeType of mimeTypes) {
        const blob = new Blob(['audio'], { type: mimeType });
        const result = await service.transcribeAudio(blob);
        expect(result).toBe('test');
      }
    });

    it('should handle Blob without MIME type', async () => {
      // Arrange
      const blob = new Blob(['audio']);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: 'test' }),
      } as Response);

      // Act
      const result = await service.transcribeAudio(blob);

      // Assert
      expect(result).toBe('test');
    });

    it('should handle rapid consecutive calls', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: 'test' }),
      } as Response);

      // Act
      const promises = [
        service.transcribeAudio(mockBlob),
        service.transcribeAudio(mockBlob),
        service.transcribeAudio(mockBlob),
      ];

      // Assert
      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      expect(results.every(r => r === 'test')).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle filename with special characters', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      const specialFilename = 'my recording (1) [test].webm';
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: 'test' }),
      } as Response);

      // Act
      await service.transcribeAudio(mockBlob, specialFilename);

      // Assert
      const callArgs = mockFetch.mock.calls[0];
      const formData = callArgs[1]?.body as FormData;
      const audioFile = formData.get('file') as File;
      expect(audioFile.name).toBe(specialFilename);
    });

    it('should handle filename with unicode characters', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      const unicodeFilename = 'запись-аудио-你好.webm';
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: 'test' }),
      } as Response);

      // Act
      await service.transcribeAudio(mockBlob, unicodeFilename);

      // Assert
      const callArgs = mockFetch.mock.calls[0];
      const formData = callArgs[1]?.body as FormData;
      const audioFile = formData.get('file') as File;
      expect(audioFile.name).toBe(unicodeFilename);
    });
  });

  describe('Error Type Mapping', () => {
    it('should map 503 to service error type', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
      } as Response);

      // Act & Assert
      try {
        await service.transcribeAudio(mockBlob);
      } catch (error) {
        expect((error as STTError).type).toBe('service');
      }
    });

    it('should map 504 to timeout error type', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockFetch.mockResolvedValue({
        ok: false,
        status: 504,
      } as Response);

      // Act & Assert
      try {
        await service.transcribeAudio(mockBlob);
      } catch (error) {
        expect((error as STTError).type).toBe('timeout');
      }
    });

    it('should map all other status codes to unknown error type', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
      const statusCodes = [400, 401, 403, 404, 413, 415, 500, 502];

      // Act & Assert
      for (const status of statusCodes) {
        mockFetch.mockResolvedValue({
          ok: false,
          status,
        } as Response);

        try {
          await service.transcribeAudio(mockBlob);
        } catch (error) {
          expect((error as STTError).type).toBe('unknown');
        }
      }
    });

    it('should provide user-friendly error messages', async () => {
      // Arrange
      const mockBlob = new Blob(['audio'], { type: 'audio/webm' });

      // Test service error message
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
      } as Response);

      try {
        await service.transcribeAudio(mockBlob);
      } catch (error) {
        expect((error as STTError).message).toBeTruthy();
        expect((error as STTError).message.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Singleton Export', () => {
    it('should export singleton instance', async () => {
      // Arrange
      const { sttService } = await import('../sttService');

      // Assert
      expect(sttService).toBeInstanceOf(STTService);
    });

    it('should use same instance across imports', async () => {
      // Arrange
      const { sttService: instance1 } = await import('../sttService');
      const { sttService: instance2 } = await import('../sttService');

      // Assert
      expect(instance1).toBe(instance2);
    });
  });
});
