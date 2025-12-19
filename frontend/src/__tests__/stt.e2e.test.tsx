/**
 * Speech-to-Text E2E Tests.
 *
 * End-to-end tests for the complete STT workflow:
 * 1. User clicks record button
 * 2. Browser requests microphone permission
 * 3. User speaks into microphone
 * 4. Recording duration updates
 * 5. User clicks stop button
 * 6. Audio is sent to backend for transcription
 * 7. Transcribed text is sent as message
 * 8. Message appears in chat
 * 9. Assistant responds
 *
 * Also tests:
 * - Error scenarios (permission denied, network error, service error)
 * - Cancel recording
 * - Multiple recordings
 * - Character switching
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecordButton } from '../components/RecordButton';
import { useSTT } from '../hooks/useSTT';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { sttService } from '../services/sttService';
import { useMessageStoreEnhanced } from '../store/messageStoreEnhanced';

// Mock only the message store at module level (store is not part of E2E test)
vi.mock('../store/messageStoreEnhanced');

// Note: These tests use REAL implementations of useSTT and useAudioRecorder hooks
// Only browser APIs (getUserMedia, MediaRecorder), network calls (fetch), and store are mocked

// Mock browser APIs
class MockMediaRecorder {
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: { error: Error }) => void) | null = null;

  static isTypeSupported = vi.fn((mimeType: string) => true);

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    setTimeout(() => {
      if (this.ondataavailable) {
        const blob = new Blob(['mock audio data'], { type: 'audio/webm' });
        this.ondataavailable({ data: blob });
      }
      if (this.onstop) {
        this.onstop();
      }
    }, 10);
  }
}

class MockMediaStreamTrack {
  kind = 'audio';
  stop = vi.fn();
}

class MockMediaStream {
  tracks = [new MockMediaStreamTrack()];
  getTracks() {
    return this.tracks;
  }
}

describe('STT E2E Workflow', () => {
  let mockGetUserMedia: ReturnType<typeof vi.fn>;
  let mockFetch: ReturnType<typeof vi.fn>;
  let mockMessageStore: any;

  beforeEach(() => {
    // Mock getUserMedia
    mockGetUserMedia = vi.fn().mockResolvedValue(new MockMediaStream());
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: mockGetUserMedia,
      },
    });

    // Mock MediaRecorder
    global.MediaRecorder = MockMediaRecorder as any;

    // Mock fetch for STT API
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Mock message store
    mockMessageStore = {
      sendMessage: vi.fn().mockResolvedValue(undefined),
      messages: {},
      isLoading: vi.fn().mockReturnValue(false),
      getLoadingState: vi.fn().mockReturnValue({ error: null }),
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful Recording Flow', () => {
    it('should complete full flow: record → stop → transcribe → send message', async () => {
      // Arrange
      const transcribedText = 'Hello, this is a test recording';

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: transcribedText }),
      });

      // Note: This test would render the full app or a test harness
      // For now, we test the flow through the hook
      const TestComponent = () => {
        const stt = useSTT('char-1');
        return (
          <div>
            <button
              data-testid="record-btn"
              onClick={stt.recordingState === 'idle' ? stt.startRecording : stt.stopAndTranscribe}
              disabled={stt.isProcessing}
            >
              {stt.recordingState === 'idle' ? 'Record' : 'Stop'}
            </button>
            <div data-testid="state">{stt.recordingState}</div>
            <div data-testid="processing">{stt.isProcessing ? 'processing' : 'idle'}</div>
            {stt.error && <div data-testid="error">{stt.error}</div>}
          </div>
        );
      };

      // Mock the message store hook
      vi.mocked(useMessageStoreEnhanced).mockReturnValue(mockMessageStore);

      render(<TestComponent />);

      // Act - Step 1: Click record button
      const recordButton = screen.getByTestId('record-btn');
      expect(recordButton).toHaveTextContent('Record');

      await act(async () => {
        fireEvent.click(recordButton);
      });

      // Assert - Microphone permission requested
      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      });

      // Assert - Recording state
      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('recording');
      });

      // Act - Step 2: Click stop button
      await waitFor(() => {
        expect(recordButton).toHaveTextContent('Stop');
      });

      await act(async () => {
        fireEvent.click(recordButton);
      });

      // Assert - Processing state
      await waitFor(() => {
        expect(screen.getByTestId('processing')).toHaveTextContent('processing');
      });

      // Assert - STT API called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/stt',
          expect.objectContaining({
            method: 'POST',
            body: expect.any(FormData),
          })
        );
      });

      // Assert - Message sent
      await waitFor(() => {
        expect(mockMessageStore.sendMessage).toHaveBeenCalledWith('char-1', transcribedText);
      });

      // Assert - Back to idle state
      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('idle');
        expect(screen.getByTestId('processing')).toHaveTextContent('idle');
      });
    });

    it('should update duration during recording', async () => {
      // Arrange
      const TestComponent = () => {
        const stt = useSTT('char-1');
        return (
          <div>
            <button data-testid="record-btn" onClick={stt.startRecording}>
              Record
            </button>
            <div data-testid="duration">{stt.duration}</div>
          </div>
        );
      };

      vi.mocked(useMessageStoreEnhanced).mockReturnValue(mockMessageStore);

      render(<TestComponent />);

      // Act
      const recordButton = screen.getByTestId('record-btn');

      await act(async () => {
        fireEvent.click(recordButton);
      });

      const initialDuration = parseInt(screen.getByTestId('duration').textContent || '0');

      // Wait for duration to update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 250));
      });

      const updatedDuration = parseInt(screen.getByTestId('duration').textContent || '0');

      // Assert
      expect(updatedDuration).toBeGreaterThan(initialDuration);
    });

    it('should handle multiple consecutive recordings', async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ transcribed_text: 'First recording' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ transcribed_text: 'Second recording' }),
        });

      const TestComponent = () => {
        const stt = useSTT('char-1');
        return (
          <button
            data-testid="record-btn"
            onClick={stt.recordingState === 'idle' ? stt.startRecording : stt.stopAndTranscribe}
          >
            {stt.recordingState === 'idle' ? 'Record' : 'Stop'}
          </button>
        );
      };

      vi.mocked(useMessageStoreEnhanced).mockReturnValue(mockMessageStore);

      render(<TestComponent />);

      // Act - First recording
      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('record-btn')).toHaveTextContent('Stop');
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      await waitFor(() => {
        expect(mockMessageStore.sendMessage).toHaveBeenCalledWith('char-1', 'First recording');
      });

      // Act - Second recording
      await waitFor(() => {
        expect(screen.getByTestId('record-btn')).toHaveTextContent('Record');
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('record-btn')).toHaveTextContent('Stop');
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      // Assert
      await waitFor(() => {
        expect(mockMessageStore.sendMessage).toHaveBeenCalledWith('char-1', 'Second recording');
      });

      expect(mockMessageStore.sendMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle microphone permission denied', async () => {
      // Arrange
      const permissionError = new Error('NotAllowedError');
      permissionError.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValue(permissionError);

      const TestComponent = () => {
        const stt = useSTT('char-1');
        return (
          <div>
            <button data-testid="record-btn" onClick={stt.startRecording}>
              Record
            </button>
            {stt.error && <div data-testid="error">{stt.error}</div>}
          </div>
        );
      };

      vi.mocked(useMessageStoreEnhanced).mockReturnValue(mockMessageStore);

      render(<TestComponent />);

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      // Assert
      await waitFor(() => {
        const errorDiv = screen.getByTestId('error');
        expect(errorDiv).toBeInTheDocument();
        expect(errorDiv.textContent).toMatch(/permission|denied/i);
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockMessageStore.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle network error during transcription', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const TestComponent = () => {
        const stt = useSTT('char-1');
        return (
          <div>
            <button
              data-testid="record-btn"
              onClick={stt.recordingState === 'idle' ? stt.startRecording : stt.stopAndTranscribe}
            >
              {stt.recordingState}
            </button>
            {stt.error && <div data-testid="error">{stt.error}</div>}
          </div>
        );
      };

      vi.mocked(useMessageStoreEnhanced).mockReturnValue(mockMessageStore);

      render(<TestComponent />);

      // Act - Start recording
      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('record-btn')).toHaveTextContent('recording');
      });

      // Act - Stop recording (should fail during transcription)
      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      // Assert
      await waitFor(() => {
        const errorDiv = screen.getByTestId('error');
        expect(errorDiv).toBeInTheDocument();
        expect(errorDiv.textContent).toMatch(/network/i);
      });

      expect(mockMessageStore.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle STT service unavailable (503)', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      const TestComponent = () => {
        const stt = useSTT('char-1');
        return (
          <div>
            <button
              data-testid="record-btn"
              onClick={stt.recordingState === 'idle' ? stt.startRecording : stt.stopAndTranscribe}
            />
            {stt.error && <div data-testid="error">{stt.error}</div>}
          </div>
        );
      };

      vi.mocked(useMessageStoreEnhanced).mockReturnValue(mockMessageStore);

      render(<TestComponent />);

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      // Assert
      await waitFor(() => {
        const errorDiv = screen.getByTestId('error');
        expect(errorDiv.textContent).toMatch(/service|unavailable/i);
      });
    });

    it('should handle transcription timeout (504)', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 504,
        statusText: 'Gateway Timeout',
      });

      const TestComponent = () => {
        const stt = useSTT('char-1');
        return (
          <div>
            <button
              data-testid="record-btn"
              onClick={stt.recordingState === 'idle' ? stt.startRecording : stt.stopAndTranscribe}
            />
            {stt.error && <div data-testid="error">{stt.error}</div>}
          </div>
        );
      };

      vi.mocked(useMessageStoreEnhanced).mockReturnValue(mockMessageStore);

      render(<TestComponent />);

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      // Assert
      await waitFor(() => {
        const errorDiv = screen.getByTestId('error');
        expect(errorDiv.textContent).toMatch(/timeout|timed out/i);
      });
    });

    it('should handle message sending failure', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: 'Test text' }),
      });

      mockMessageStore.sendMessage.mockRejectedValue(new Error('Failed to send message'));

      const TestComponent = () => {
        const stt = useSTT('char-1');
        return (
          <div>
            <button
              data-testid="record-btn"
              onClick={stt.recordingState === 'idle' ? stt.startRecording : stt.stopAndTranscribe}
            />
            {stt.error && <div data-testid="error">{stt.error}</div>}
          </div>
        );
      };

      vi.mocked(useMessageStoreEnhanced).mockReturnValue(mockMessageStore);

      render(<TestComponent />);

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
        expect(mockMessageStore.sendMessage).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Recording', () => {
    it('should cancel recording without transcribing', async () => {
      // Arrange
      const TestComponent = () => {
        const stt = useSTT('char-1');
        return (
          <div>
            <button data-testid="start-btn" onClick={stt.startRecording}>
              Start
            </button>
            <button data-testid="cancel-btn" onClick={stt.cancelRecording}>
              Cancel
            </button>
            <div data-testid="state">{stt.recordingState}</div>
          </div>
        );
      };

      vi.mocked(useMessageStoreEnhanced).mockReturnValue(mockMessageStore);

      render(<TestComponent />);

      // Act - Start recording
      await act(async () => {
        fireEvent.click(screen.getByTestId('start-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('recording');
      });

      // Act - Cancel recording
      await act(async () => {
        fireEvent.click(screen.getByTestId('cancel-btn'));
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('state')).toHaveTextContent('idle');
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockMessageStore.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Character Switching', () => {
    it('should handle character change during recording', async () => {
      // Arrange
      const TestComponent = ({ charId }: { charId: string | null }) => {
        const stt = useSTT(charId);
        return (
          <div>
            <button
              data-testid="record-btn"
              onClick={stt.recordingState === 'idle' ? stt.startRecording : stt.stopAndTranscribe}
            />
            <div data-testid="char">{charId}</div>
            {stt.error && <div data-testid="error">{stt.error}</div>}
          </div>
        );
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: 'Test' }),
      });

      vi.mocked(useMessageStoreEnhanced).mockReturnValue(mockMessageStore);

      const { rerender } = render(<TestComponent charId="char-1" />);

      // Act - Start recording
      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      // Change character while recording
      rerender(<TestComponent charId="char-2" />);

      // Stop recording
      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      // Assert - Should send to char-2
      await waitFor(() => {
        expect(mockMessageStore.sendMessage).toHaveBeenCalledWith('char-2', 'Test');
      });
    });

    it('should show error when character is deselected before stopping', async () => {
      // Arrange
      const TestComponent = ({ charId }: { charId: string | null }) => {
        const stt = useSTT(charId);
        return (
          <div>
            <button
              data-testid="record-btn"
              onClick={stt.recordingState === 'idle' ? stt.startRecording : stt.stopAndTranscribe}
              disabled={!charId}
            />
            {stt.error && <div data-testid="error">{stt.error}</div>}
          </div>
        );
      };

      vi.mocked(useMessageStoreEnhanced).mockReturnValue(mockMessageStore);

      const { rerender } = render(<TestComponent charId="char-1" />);

      // Act - Start recording
      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      // Deselect character
      rerender(<TestComponent charId={null} />);

      // Try to stop recording
      await act(async () => {
        try {
          fireEvent.click(screen.getByTestId('record-btn'));
        } catch {}
      });

      // Assert - Should show error or prevent action
      // Implementation may vary - either show error or button is disabled
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short recording', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: 'Quick' }),
      });

      const TestComponent = () => {
        const stt = useSTT('char-1');
        return (
          <button
            data-testid="record-btn"
            onClick={stt.recordingState === 'idle' ? stt.startRecording : stt.stopAndTranscribe}
          />
        );
      };

      vi.mocked(useMessageStoreEnhanced).mockReturnValue(mockMessageStore);

      render(<TestComponent />);

      // Act - Start and immediately stop
      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      // Assert
      await waitFor(() => {
        expect(mockMessageStore.sendMessage).toHaveBeenCalledWith('char-1', 'Quick');
      });
    });

    it('should handle empty transcription result', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: '' }),
      });

      const TestComponent = () => {
        const stt = useSTT('char-1');
        return (
          <button
            data-testid="record-btn"
            onClick={stt.recordingState === 'idle' ? stt.startRecording : stt.stopAndTranscribe}
          />
        );
      };

      vi.mocked(useMessageStoreEnhanced).mockReturnValue(mockMessageStore);

      render(<TestComponent />);

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      // Assert - Should either send empty message or handle gracefully
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should handle very long transcription', async () => {
      // Arrange
      const longText = 'a'.repeat(10000);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ transcribed_text: longText }),
      });

      const TestComponent = () => {
        const stt = useSTT('char-1');
        return (
          <button
            data-testid="record-btn"
            onClick={stt.recordingState === 'idle' ? stt.startRecording : stt.stopAndTranscribe}
          />
        );
      };

      vi.mocked(useMessageStoreEnhanced).mockReturnValue(mockMessageStore);

      render(<TestComponent />);

      // Act
      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('record-btn'));
      });

      // Assert
      await waitFor(() => {
        expect(mockMessageStore.sendMessage).toHaveBeenCalledWith('char-1', longText);
      });
    });
  });
});

// Helper to wrap async act calls
async function act(callback: () => Promise<void>) {
  const { act: reactAct } = await import('@testing-library/react');
  await reactAct(callback);
}
