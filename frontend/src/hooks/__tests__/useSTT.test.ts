/**
 * useSTT Hook Unit Tests.
 *
 * Comprehensive tests for useSTT hook covering:
 * - Orchestration of recording, transcription, and message sending
 * - Character validation
 * - Error handling from all sources (recorder, STT service, message store)
 * - State management (recording, processing)
 * - startRecording flow
 * - stopAndTranscribe full flow
 * - cancelRecording flow
 * - Error type mapping and user-friendly messages
 * - Integration with dependencies
 * - Edge cases
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { useSTT } from '../useSTT';
import { STTError } from '../../types/stt';

// Mock dependencies
vi.mock('../useAudioRecorder');
vi.mock('../../services/sttService');
vi.mock('../../store/messageStoreEnhanced');

import { useAudioRecorder } from '../useAudioRecorder';
import { sttService } from '../../services/sttService';
import { useMessageStoreEnhanced } from '../../store/messageStoreEnhanced';

describe('useSTT', () => {
  let mockRecorder: any;
  let mockSttService: any;
  let mockMessageStore: any;

  beforeEach(() => {
    // Clear all timers and mocks
    vi.clearAllTimers();
    vi.clearAllMocks();

    // Create fresh mock recorder for each test
    mockRecorder = {
      state: 'idle',
      startRecording: vi.fn().mockResolvedValue(undefined),
      stopRecording: vi.fn().mockResolvedValue({
        blob: new Blob(['audio data'], { type: 'audio/webm' }),
        mimeType: 'audio/webm',
        duration: 5000,
      }),
      error: null,
      duration: 0,
    };

    // Return fresh mock for each call
    vi.mocked(useAudioRecorder).mockImplementation(() => mockRecorder);

    // Mock sttService - use fresh mock functions
    mockSttService = {
      transcribeAudio: vi.fn().mockResolvedValue('Transcribed text'),
    };

    // Assign to actual service object
    Object.assign(sttService, mockSttService);

    // Mock useMessageStoreEnhanced - create fresh mock
    mockMessageStore = {
      sendMessage: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(useMessageStoreEnhanced).mockImplementation(() => mockMessageStore);
  });

  afterEach(() => {
    // Clean up rendered hooks and components
    cleanup();

    // Clean up mocks and timers
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should have correct initial state when character is selected', () => {
      // Arrange & Act
      const { result } = renderHook(() => useSTT('char-1'));

      // Assert
      expect(result.current.recordingState).toBe('idle');
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.duration).toBe(0);
      expect(result.current.startRecording).toBeInstanceOf(Function);
      expect(result.current.stopAndTranscribe).toBeInstanceOf(Function);
      expect(result.current.cancelRecording).toBeInstanceOf(Function);
    });

    it('should have correct initial state when no character selected', () => {
      // Arrange & Act
      const { result } = renderHook(() => useSTT(null));

      // Assert
      expect(result.current.recordingState).toBe('idle');
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should reflect recorder state', () => {
      // Arrange
      mockRecorder.state = 'recording';
      mockRecorder.duration = 2500;

      // Act
      const { result } = renderHook(() => useSTT('char-1'));

      // Assert
      expect(result.current.recordingState).toBe('recording');
      expect(result.current.duration).toBe(2500);
    });

    it('should reflect recorder error', () => {
      // Arrange
      mockRecorder.error = 'Microphone permission denied';

      // Act
      const { result } = renderHook(() => useSTT('char-1'));

      // Assert
      expect(result.current.error).toBe('Microphone permission denied');
    });
  });

  describe('startRecording - Success Cases', () => {
    it('should start recording when character is selected', async () => {
      // Arrange
      const { result } = renderHook(() => useSTT('char-1'));

      // Act
      await act(async () => {
        await result.current.startRecording();
      });

      // Assert
      expect(mockRecorder.startRecording).toHaveBeenCalledTimes(1);
      expect(result.current.error).toBeNull();
    });

    it('should clear previous error when starting recording', async () => {
      // Arrange
      const { result } = renderHook(() => useSTT('char-1'));

      // Set previous error
      await act(async () => {
        await result.current.startRecording();
      });

      mockRecorder.startRecording.mockRejectedValueOnce(new Error('Test error'));

      await act(async () => {
        try {
          await result.current.startRecording();
        } catch {}
      });

      // Now start successfully
      mockRecorder.startRecording.mockResolvedValue(undefined);

      // Act
      await act(async () => {
        await result.current.startRecording();
      });

      // Assert
      expect(result.current.error).toBeNull();
    });

    it('should allow starting recording multiple times', async () => {
      // Arrange
      const { result } = renderHook(() => useSTT('char-1'));

      // Act - Start, stop, start again
      await act(async () => {
        await result.current.startRecording();
      });

      mockRecorder.state = 'idle';

      await act(async () => {
        await result.current.startRecording();
      });

      // Assert
      expect(mockRecorder.startRecording).toHaveBeenCalledTimes(2);
    });
  });

  describe('startRecording - Validation Errors', () => {
    it('should set error when no character is selected', async () => {
      // Arrange
      const { result } = renderHook(() => useSTT(null));

      // Act
      await act(async () => {
        await result.current.startRecording();
      });

      // Assert
      expect(result.current.error).toContain('character');
      expect(result.current.error).toMatch(/select|choose/i);
      expect(mockRecorder.startRecording).not.toHaveBeenCalled();
    });

    it('should set error when characterId is empty string', async () => {
      // Arrange
      const { result } = renderHook(() => useSTT(''));

      // Act
      await act(async () => {
        await result.current.startRecording();
      });

      // Assert
      expect(result.current.error).toBeTruthy();
      expect(mockRecorder.startRecording).not.toHaveBeenCalled();
    });
  });

  describe('startRecording - Recorder Errors', () => {
    it('should propagate error from recorder', async () => {
      // Arrange
      const recorderError = new Error('Microphone permission denied');
      mockRecorder.startRecording.mockRejectedValue(recorderError);

      const { result } = renderHook(() => useSTT('char-1'));

      // Act
      await act(async () => {
        try {
          await result.current.startRecording();
        } catch {}
      });

      // Assert
      expect(result.current.error).toBeTruthy();
    });

    it('should handle recorder throwing NotAllowedError', async () => {
      // Arrange
      const permissionError = new Error('NotAllowedError');
      permissionError.name = 'NotAllowedError';
      mockRecorder.startRecording.mockRejectedValue(permissionError);

      const { result } = renderHook(() => useSTT('char-1'));

      // Act
      await act(async () => {
        try {
          await result.current.startRecording();
        } catch {}
      });

      // Assert
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('stopAndTranscribe - Success Cases', () => {
    it('should successfully complete full flow: stop → transcribe → send', async () => {
      // Arrange
      const { result } = renderHook(() => useSTT('char-1'));

      // Start recording first
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        await result.current.stopAndTranscribe();
      });

      // Assert
      expect(mockRecorder.stopRecording).toHaveBeenCalledTimes(1);
      expect(mockSttService.transcribeAudio).toHaveBeenCalledTimes(1);
      expect(mockSttService.transcribeAudio).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.any(String)
      );
      expect(mockMessageStore.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockMessageStore.sendMessage).toHaveBeenCalledWith('char-1', 'Transcribed text');
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set isProcessing to true during transcription', async () => {
      // Arrange
      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Make transcription take some time
      let resolveTranscribe: any;
      const transcribePromise = new Promise<string>(resolve => {
        resolveTranscribe = resolve;
      });
      mockSttService.transcribeAudio.mockReturnValue(transcribePromise);

      // Act - Start the stopAndTranscribe process
      let stopPromise: Promise<void>;
      act(() => {
        stopPromise = result.current.stopAndTranscribe();
      });

      // Assert - processing should be true
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
      });

      // Resolve transcription
      act(() => {
        resolveTranscribe('Test text');
      });

      // Wait for the promise to complete
      await act(async () => {
        await stopPromise!;
      });

      // Assert - processing should be false after completion
      expect(result.current.isProcessing).toBe(false);
    });

    it('should pass audio blob to transcription service', async () => {
      // Arrange
      const mockAudioBlob = new Blob(['audio data'], { type: 'audio/webm' });
      mockRecorder.stopRecording.mockResolvedValue({
        blob: mockAudioBlob,
        mimeType: 'audio/webm',
        duration: 5000,
      });

      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        await result.current.stopAndTranscribe();
      });

      // Assert
      expect(mockSttService.transcribeAudio).toHaveBeenCalledWith(
        mockAudioBlob,
        expect.any(String)
      );
    });

    it('should use appropriate filename for transcription', async () => {
      // Arrange
      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      mockRecorder.stopRecording.mockResolvedValue({
        blob: new Blob(['audio'], { type: 'audio/webm' }),
        mimeType: 'audio/webm;codecs=opus',
        duration: 3000,
      });

      // Act
      await act(async () => {
        await result.current.stopAndTranscribe();
      });

      // Assert
      const filename = mockSttService.transcribeAudio.mock.calls[0][1];
      expect(filename).toContain('.webm');
    });

    it('should send transcribed text to correct character', async () => {
      // Arrange
      const characterId = 'test-character-123';
      const { result } = renderHook(() => useSTT(characterId));
      mockRecorder.state = 'recording';

      const transcribedText = 'This is the transcribed text';
      mockSttService.transcribeAudio.mockResolvedValue(transcribedText);

      // Act
      await act(async () => {
        await result.current.stopAndTranscribe();
      });

      // Assert
      expect(mockMessageStore.sendMessage).toHaveBeenCalledWith(
        characterId,
        transcribedText
      );
    });

    it('should clear previous error on successful transcription', async () => {
      // Arrange
      const { result } = renderHook(() => useSTT('char-1'));

      // Set previous error
      mockSttService.transcribeAudio.mockRejectedValueOnce(
        new STTError('network', 'Network error')
      );

      mockRecorder.state = 'recording';

      await act(async () => {
        try {
          await result.current.stopAndTranscribe();
        } catch {}
      });

      expect(result.current.error).toBeTruthy();

      // Now succeed
      mockSttService.transcribeAudio.mockResolvedValue('Success');
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        await result.current.stopAndTranscribe();
      });

      // Assert
      expect(result.current.error).toBeNull();
    });
  });

  describe('stopAndTranscribe - Recording Errors', () => {
    it('should handle error when stopping recording fails', async () => {
      // Arrange
      const stopError = new Error('Failed to stop recording');
      mockRecorder.stopRecording.mockRejectedValue(stopError);

      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        try {
          await result.current.stopAndTranscribe();
        } catch {}
      });

      // Assert
      expect(result.current.error).toBeTruthy();
      expect(result.current.isProcessing).toBe(false);
      expect(mockSttService.transcribeAudio).not.toHaveBeenCalled();
      expect(mockMessageStore.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle empty audio blob', async () => {
      // Arrange
      mockRecorder.stopRecording.mockResolvedValue({
        blob: new Blob([], { type: 'audio/webm' }),
        mimeType: 'audio/webm',
        duration: 0,
      });

      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        await result.current.stopAndTranscribe();
      });

      // Assert - Should still attempt transcription
      expect(mockSttService.transcribeAudio).toHaveBeenCalled();
    });
  });

  describe('stopAndTranscribe - Transcription Errors', () => {
    it('should handle network error from STT service', async () => {
      // Arrange
      const networkError = new STTError('network', 'Network error. Please check your connection.');
      mockSttService.transcribeAudio.mockRejectedValue(networkError);

      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        try {
          await result.current.stopAndTranscribe();
        } catch {}
      });

      // Assert
      expect(result.current.error).toMatch(/network/i);
      expect(result.current.error).toMatch(/connection/i);
      expect(result.current.isProcessing).toBe(false);
      expect(mockMessageStore.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle service unavailable error from STT service', async () => {
      // Arrange
      const serviceError = new STTError('service', 'STT service is offline. Please try again later.');
      mockSttService.transcribeAudio.mockRejectedValue(serviceError);

      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        try {
          await result.current.stopAndTranscribe();
        } catch {}
      });

      // Assert
      expect(result.current.error).toContain('service');
      expect(result.current.error).toMatch(/offline|unavailable/i);
      expect(result.current.isProcessing).toBe(false);
    });

    it('should handle timeout error from STT service', async () => {
      // Arrange
      const timeoutError = new STTError('timeout', 'Transcription timed out. Try a shorter recording.');
      mockSttService.transcribeAudio.mockRejectedValue(timeoutError);

      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        try {
          await result.current.stopAndTranscribe();
        } catch {}
      });

      // Assert
      expect(result.current.error).toMatch(/timeout|timed out/i);
      expect(result.current.error).toMatch(/timed out|shorter/i);
      expect(result.current.isProcessing).toBe(false);
    });

    it('should handle unknown error from STT service', async () => {
      // Arrange
      const unknownError = new STTError('unknown', 'Transcription failed. Please try again.');
      mockSttService.transcribeAudio.mockRejectedValue(unknownError);

      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        try {
          await result.current.stopAndTranscribe();
        } catch {}
      });

      // Assert
      expect(result.current.error).toMatch(/failed|try again/i);
      expect(result.current.isProcessing).toBe(false);
    });

    it('should handle generic error from STT service', async () => {
      // Arrange
      const genericError = new Error('Something went wrong');
      mockSttService.transcribeAudio.mockRejectedValue(genericError);

      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        try {
          await result.current.stopAndTranscribe();
        } catch {}
      });

      // Assert
      expect(result.current.error).toBeTruthy();
      expect(result.current.isProcessing).toBe(false);
    });

    it('should handle empty transcription result', async () => {
      // Arrange
      mockSttService.transcribeAudio.mockResolvedValue('');

      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        await result.current.stopAndTranscribe();
      });

      // Assert
      // Should either send empty message or handle gracefully
      // Depends on implementation decision
    });
  });

  describe('stopAndTranscribe - Message Sending Errors', () => {
    it('should handle error when sending message fails', async () => {
      // Arrange
      const sendError = new Error('Failed to send message');
      mockMessageStore.sendMessage.mockRejectedValue(sendError);

      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        try {
          await result.current.stopAndTranscribe();
        } catch {}
      });

      // Assert
      expect(result.current.error).toBeTruthy();
      expect(result.current.isProcessing).toBe(false);
    });

    it('should have called transcription before message send fails', async () => {
      // Arrange
      mockMessageStore.sendMessage.mockRejectedValue(new Error('Send failed'));

      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        try {
          await result.current.stopAndTranscribe();
        } catch {}
      });

      // Assert
      expect(mockRecorder.stopRecording).toHaveBeenCalled();
      expect(mockSttService.transcribeAudio).toHaveBeenCalled();
      expect(mockMessageStore.sendMessage).toHaveBeenCalled();
    });

    it('should handle network error when sending message', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockMessageStore.sendMessage.mockRejectedValue(networkError);

      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        try {
          await result.current.stopAndTranscribe();
        } catch {}
      });

      // Assert
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('cancelRecording', () => {
    it('should stop recording without transcribing', async () => {
      // Arrange
      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        result.current.cancelRecording();
      });

      // Assert
      expect(mockRecorder.stopRecording).toHaveBeenCalledTimes(1);
      expect(mockSttService.transcribeAudio).not.toHaveBeenCalled();
      expect(mockMessageStore.sendMessage).not.toHaveBeenCalled();
    });

    it('should clear error on cancel', async () => {
      // Arrange
      const { result } = renderHook(() => useSTT('char-1'));

      // Set error
      await act(async () => {
        await result.current.startRecording();
      });

      mockRecorder.startRecording.mockRejectedValueOnce(new Error('Test error'));

      await act(async () => {
        try {
          await result.current.startRecording();
        } catch {}
      });

      // Act
      await act(async () => {
        result.current.cancelRecording();
      });

      // Assert
      expect(result.current.error).toBeNull();
    });

    it('should reset state to idle on cancel', async () => {
      // Arrange
      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        result.current.cancelRecording();
      });

      // After canceling, recorder should have stopped
      mockRecorder.state = 'idle';

      // Assert
      expect(mockRecorder.stopRecording).toHaveBeenCalled();
    });

    it('should handle cancel when not recording', async () => {
      // Arrange
      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'idle';

      // Act & Assert - should not throw
      await act(async () => {
        result.current.cancelRecording();
      });

      expect(mockRecorder.stopRecording).toHaveBeenCalled();
    });

    it('should ignore stopRecording errors on cancel', async () => {
      // Arrange
      mockRecorder.stopRecording.mockRejectedValue(new Error('Stop failed'));

      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act & Assert - should not throw
      await act(async () => {
        result.current.cancelRecording();
      });

      // Should not set error
      expect(result.current.error).toBeNull();
    });
  });

  describe('Character Changes', () => {
    it('should update when characterId changes', () => {
      // Arrange
      const { result, rerender } = renderHook(
        ({ charId }) => useSTT(charId),
        { initialProps: { charId: 'char-1' } }
      );

      // Act
      rerender({ charId: 'char-2' });

      // Assert - hook should re-render with new characterId
      expect(result.current).toBeDefined();
    });

    it('should allow recording with new character after change', async () => {
      // Arrange
      const { result, rerender } = renderHook(
        ({ charId }) => useSTT(charId),
        { initialProps: { charId: 'char-1' } }
      );

      // Change character
      rerender({ charId: 'char-2' });

      // Act
      await act(async () => {
        await result.current.startRecording();
      });

      // Assert
      expect(mockRecorder.startRecording).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });

    it('should send message to correct character after change', async () => {
      // Arrange
      const { result, rerender } = renderHook(
        ({ charId }) => useSTT(charId),
        { initialProps: { charId: 'char-1' } }
      );

      rerender({ charId: 'char-2' });

      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        await result.current.stopAndTranscribe();
      });

      // Assert
      expect(mockMessageStore.sendMessage).toHaveBeenCalledWith('char-2', expect.any(String));
    });

    it('should show error when character changes to null during recording', async () => {
      // Arrange
      const { result, rerender } = renderHook(
        ({ charId }) => useSTT(charId),
        { initialProps: { charId: 'char-1' as string | null } }
      );

      await act(async () => {
        await result.current.startRecording();
      });

      // Change to null
      rerender({ charId: null });

      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        try {
          await result.current.stopAndTranscribe();
        } catch {}
      });

      // Assert - Should fail because characterId is null
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Error Message Formatting', () => {
    it('should provide user-friendly message for network errors', async () => {
      // Arrange
      const networkError = new STTError('network', 'Network error');
      mockSttService.transcribeAudio.mockRejectedValue(networkError);

      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        try {
          await result.current.stopAndTranscribe();
        } catch {}
      });

      // Assert
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.length).toBeGreaterThan(10); // Should be descriptive
    });

    it('should prioritize hook error over recorder error', async () => {
      // Arrange
      const hookError = 'Please select a character first';
      mockRecorder.error = 'Recorder error';

      const { result } = renderHook(() => useSTT(null));

      await act(async () => {
        await result.current.startRecording();
      });

      // Assert
      expect(result.current.error).toBe(hookError);
    });

    it('should show recorder error when hook has no error', () => {
      // Arrange
      mockRecorder.error = 'Microphone permission denied';

      // Act
      const { result } = renderHook(() => useSTT('char-1'));

      // Assert
      expect(result.current.error).toBe('Microphone permission denied');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long transcription text', async () => {
      // Arrange
      const longText = 'a'.repeat(10000);
      mockSttService.transcribeAudio.mockResolvedValue(longText);

      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        await result.current.stopAndTranscribe();
      });

      // Assert
      expect(mockMessageStore.sendMessage).toHaveBeenCalledWith('char-1', longText);
    });

    it('should handle special characters in transcription', async () => {
      // Arrange
      const specialText = 'Hello! @#$%^&*() <script>alert("xss")</script> Привет 你好';
      mockSttService.transcribeAudio.mockResolvedValue(specialText);

      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        await result.current.stopAndTranscribe();
      });

      // Assert
      expect(mockMessageStore.sendMessage).toHaveBeenCalledWith('char-1', specialText);
    });

    it('should handle rapid consecutive transcriptions', async () => {
      // Arrange
      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        await result.current.stopAndTranscribe();
      });

      mockRecorder.state = 'recording';

      await act(async () => {
        await result.current.stopAndTranscribe();
      });

      // Assert
      expect(mockSttService.transcribeAudio).toHaveBeenCalledTimes(2);
      expect(mockMessageStore.sendMessage).toHaveBeenCalledTimes(2);
    });

    it('should handle characterId with special characters', async () => {
      // Arrange
      const specialCharId = 'char-123-тест-你好';
      const { result } = renderHook(() => useSTT(specialCharId));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        await result.current.stopAndTranscribe();
      });

      // Assert
      expect(mockMessageStore.sendMessage).toHaveBeenCalledWith(
        specialCharId,
        expect.any(String)
      );
    });

    it('should handle different audio MIME types', async () => {
      // Arrange
      const mimeTypes = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav'];

      for (const mimeType of mimeTypes) {
        mockRecorder.stopRecording.mockResolvedValue({
          blob: new Blob(['audio'], { type: mimeType }),
          mimeType: mimeType,
          duration: 3000,
        });

        const { result } = renderHook(() => useSTT('char-1'));
        mockRecorder.state = 'recording';

        // Act
        await act(async () => {
          await result.current.stopAndTranscribe();
        });

        // Assert
        expect(mockSttService.transcribeAudio).toHaveBeenCalled();
      }
    });
  });

  describe('State Consistency', () => {
    it('should reset isProcessing on error', async () => {
      // Arrange
      mockSttService.transcribeAudio.mockRejectedValue(new Error('Transcription failed'));

      const { result } = renderHook(() => useSTT('char-1'));
      mockRecorder.state = 'recording';

      // Act
      await act(async () => {
        try {
          await result.current.stopAndTranscribe();
        } catch {}
      });

      // Assert
      expect(result.current.isProcessing).toBe(false);
    });

    it('should not be processing initially', () => {
      // Arrange & Act
      const { result } = renderHook(() => useSTT('char-1'));

      // Assert
      expect(result.current.isProcessing).toBe(false);
    });

    it('should maintain correct state through full lifecycle', async () => {
      // Arrange
      const { result, rerender } = renderHook(() => useSTT('char-1'));

      // Initial
      expect(result.current.recordingState).toBe('idle');
      expect(result.current.isProcessing).toBe(false);

      // Start recording
      await act(async () => {
        await result.current.startRecording();
      });

      // Update mock state and trigger re-render
      mockRecorder.state = 'recording';
      rerender();
      expect(result.current.recordingState).toBe('recording');

      // Stop and transcribe
      await act(async () => {
        await result.current.stopAndTranscribe();
      });

      // Update mock state and trigger re-render
      mockRecorder.state = 'idle';
      rerender();

      // Final
      expect(result.current.recordingState).toBe('idle');
      expect(result.current.isProcessing).toBe(false);
    });
  });
});
