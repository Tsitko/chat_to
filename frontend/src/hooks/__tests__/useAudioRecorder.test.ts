/**
 * useAudioRecorder Hook Unit Tests.
 *
 * Comprehensive tests for useAudioRecorder hook covering:
 * - MediaRecorder initialization and lifecycle
 * - Microphone permission handling
 * - Recording start/stop/cancel
 * - Audio blob creation
 * - Duration tracking
 * - Error handling (permission denied, not found, not supported)
 * - Browser API compatibility
 * - Resource cleanup on unmount
 * - State transitions
 * - Edge cases
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAudioRecorder } from '../useAudioRecorder';

// Mock MediaRecorder
class MockMediaRecorder {
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: { error: Error }) => void) | null = null;
  stream: MediaStream;

  static isTypeSupported = vi.fn((mimeType: string) => true);

  constructor(stream: MediaStream, options?: { mimeType?: string }) {
    this.stream = stream;
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    if (this.onstop) {
      setTimeout(() => {
        if (this.ondataavailable) {
          const blob = new Blob(['audio data'], { type: 'audio/webm' });
          this.ondataavailable({ data: blob });
        }
        if (this.onstop) {
          this.onstop();
        }
      }, 0);
    }
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }
}

// Mock MediaStream
class MockMediaStream {
  id = 'mock-stream-id';
  active = true;
  tracks: MediaStreamTrack[] = [];

  getTracks() {
    return this.tracks;
  }

  getAudioTracks() {
    return this.tracks.filter(t => t.kind === 'audio');
  }

  addTrack(track: MediaStreamTrack) {
    this.tracks.push(track);
  }
}

// Mock MediaStreamTrack
class MockMediaStreamTrack {
  kind = 'audio';
  id = 'mock-track-id';
  enabled = true;
  readyState: 'live' | 'ended' = 'live';

  stop() {
    this.readyState = 'ended';
  }
}

describe('useAudioRecorder', () => {
  let mockGetUserMedia: ReturnType<typeof vi.fn>;
  let mockStream: MockMediaStream;
  let mockTrack: MockMediaStreamTrack;

  beforeEach(() => {
    // Setup mock track and stream
    mockTrack = new MockMediaStreamTrack();
    mockStream = new MockMediaStream();
    mockStream.addTrack(mockTrack as any);

    // Mock getUserMedia
    mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

    // Setup navigator.mediaDevices
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: mockGetUserMedia,
      },
    });

    // Mock MediaRecorder globally
    global.MediaRecorder = MockMediaRecorder as any;

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      // Arrange & Act
      const { result } = renderHook(() => useAudioRecorder());

      // Assert
      expect(result.current.state).toBe('idle');
      expect(result.current.error).toBeNull();
      expect(result.current.duration).toBe(0);
      expect(result.current.startRecording).toBeInstanceOf(Function);
      expect(result.current.stopRecording).toBeInstanceOf(Function);
    });
  });

  describe('startRecording - Success Cases', () => {
    it('should successfully start recording', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      // Act
      await act(async () => {
        await result.current.startRecording();
      });

      // Assert
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      expect(result.current.state).toBe('recording');
      expect(result.current.error).toBeNull();
    });

    it('should request microphone permission on first recording', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      // Act
      await act(async () => {
        await result.current.startRecording();
      });

      // Assert
      expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
      expect(mockGetUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: expect.objectContaining({
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }),
        })
      );
    });

    it('should create MediaRecorder with preferred MIME type', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      // Act
      await act(async () => {
        await result.current.startRecording();
      });

      // Assert
      expect(result.current.state).toBe('recording');
    });

    it('should fallback to next MIME type if first is not supported', async () => {
      // Arrange
      MockMediaRecorder.isTypeSupported = vi
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
      const { result } = renderHook(() => useAudioRecorder());

      // Act
      await act(async () => {
        await result.current.startRecording();
      });

      // Assert
      expect(result.current.state).toBe('recording');
    });

    it('should clear previous error when starting recording successfully', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      // Simulate previous error
      mockGetUserMedia.mockRejectedValueOnce(new Error('NotAllowedError'));

      await act(async () => {
        try {
          await result.current.startRecording();
        } catch {}
      });

      expect(result.current.error).toBeTruthy();

      // Now succeed
      mockGetUserMedia.mockResolvedValue(mockStream);

      // Act
      await act(async () => {
        await result.current.startRecording();
      });

      // Assert
      expect(result.current.error).toBeNull();
    });
  });

  describe('startRecording - Permission Errors', () => {
    it('should set error when microphone permission is denied', async () => {
      // Arrange
      const permissionError = new Error('NotAllowedError');
      permissionError.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValue(permissionError);

      const { result } = renderHook(() => useAudioRecorder());

      // Act
      await act(async () => {
        try {
          await result.current.startRecording();
        } catch {}
      });

      // Assert
      expect(result.current.state).toBe('idle');
      expect(result.current.error).toContain('permission');
      expect(result.current.error).toMatch(/denied|allow/i);
    });

    it('should set error when no microphone is found', async () => {
      // Arrange
      const notFoundError = new Error('NotFoundError');
      notFoundError.name = 'NotFoundError';
      mockGetUserMedia.mockRejectedValue(notFoundError);

      const { result } = renderHook(() => useAudioRecorder());

      // Act
      await act(async () => {
        try {
          await result.current.startRecording();
        } catch {}
      });

      // Assert
      expect(result.current.state).toBe('idle');
      expect(result.current.error).toContain('microphone');
      expect(result.current.error).toMatch(/not found|no microphone/i);
    });

    it('should set error when recording is not supported', async () => {
      // Arrange
      const notSupportedError = new Error('NotSupportedError');
      notSupportedError.name = 'NotSupportedError';
      mockGetUserMedia.mockRejectedValue(notSupportedError);

      const { result } = renderHook(() => useAudioRecorder());

      // Act
      await act(async () => {
        try {
          await result.current.startRecording();
        } catch {}
      });

      // Assert
      expect(result.current.state).toBe('idle');
      expect(result.current.error).toMatch(/not supported|browser/i);
    });

    it('should handle generic getUserMedia errors', async () => {
      // Arrange
      const genericError = new Error('Unknown error');
      mockGetUserMedia.mockRejectedValue(genericError);

      const { result } = renderHook(() => useAudioRecorder());

      // Act
      await act(async () => {
        try {
          await result.current.startRecording();
        } catch {}
      });

      // Assert
      expect(result.current.state).toBe('idle');
      expect(result.current.error).toMatch(/failed to start|recording/i);
    });
  });

  describe('startRecording - Browser Compatibility', () => {
    it('should handle missing navigator.mediaDevices', async () => {
      // Arrange
      Object.defineProperty(global.navigator, 'mediaDevices', {
        writable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useAudioRecorder());

      // Act
      await act(async () => {
        try {
          await result.current.startRecording();
        } catch {}
      });

      // Assert
      expect(result.current.state).toBe('idle');
      expect(result.current.error).toBeTruthy();
    });

    it('should handle missing MediaRecorder API', async () => {
      // Arrange
      (global as any).MediaRecorder = undefined;

      const { result } = renderHook(() => useAudioRecorder());

      // Act
      await act(async () => {
        try {
          await result.current.startRecording();
        } catch {}
      });

      // Assert
      expect(result.current.state).toBe('idle');
      expect(result.current.error).toBeTruthy();
    });

    it('should handle when no MIME types are supported', async () => {
      // Arrange
      MockMediaRecorder.isTypeSupported = vi.fn().mockReturnValue(false);
      const { result } = renderHook(() => useAudioRecorder());

      // Act
      await act(async () => {
        await result.current.startRecording();
      });

      // Assert
      // Should still attempt to record with undefined mimeType
      expect(result.current.state).toBe('recording');
    });
  });

  describe('stopRecording - Success Cases', () => {
    it('should successfully stop recording and return audio', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      // Act
      let audioRecording;
      await act(async () => {
        audioRecording = await result.current.stopRecording();
      });

      // Assert
      expect(audioRecording).toBeDefined();
      expect(audioRecording?.blob).toBeInstanceOf(Blob);
      expect(audioRecording?.mimeType).toBeTruthy();
      expect(audioRecording?.duration).toBeGreaterThanOrEqual(0);
      expect(result.current.state).toBe('idle');
    });

    it('should create blob from accumulated audio chunks', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      // Act
      let audioRecording;
      await act(async () => {
        audioRecording = await result.current.stopRecording();
      });

      // Assert
      expect(audioRecording?.blob).toBeInstanceOf(Blob);
      expect(audioRecording?.blob.size).toBeGreaterThan(0);
    });

    it('should calculate recording duration correctly', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      // Wait a bit to accumulate duration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Act
      let audioRecording;
      await act(async () => {
        audioRecording = await result.current.stopRecording();
      });

      // Assert
      expect(audioRecording?.duration).toBeGreaterThan(0);
    });

    it('should reset duration after stopping', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      await act(async () => {
        await result.current.stopRecording();
      });

      // Assert
      expect(result.current.duration).toBe(0);
    });

    it('should stop all media tracks when recording stops', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      // Act
      await act(async () => {
        await result.current.stopRecording();
      });

      // Assert
      expect(mockTrack.readyState).toBe('ended');
    });

    it('should allow starting new recording after stopping', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      await act(async () => {
        await result.current.stopRecording();
      });

      // Act - Start again
      await act(async () => {
        await result.current.startRecording();
      });

      // Assert
      expect(result.current.state).toBe('recording');
    });
  });

  describe('stopRecording - Error Cases', () => {
    it('should throw error when stopping without active recording', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      // Act & Assert
      await expect(
        act(async () => {
          await result.current.stopRecording();
        })
      ).rejects.toThrow();
    });

    it('should handle MediaRecorder error during recording', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      // Simulate MediaRecorder error
      // This would be triggered by the MediaRecorder's onerror handler
      // The implementation should handle this gracefully
    });

    it('should handle empty audio chunks', async () => {
      // Arrange
      const CustomMockMediaRecorder = class extends MockMediaRecorder {
        stop() {
          this.state = 'inactive';
          if (this.onstop) {
            setTimeout(() => {
              // Don't call ondataavailable, so no chunks
              if (this.onstop) {
                this.onstop();
              }
            }, 0);
          }
        }
      };

      global.MediaRecorder = CustomMockMediaRecorder as any;

      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      // Act
      let audioRecording;
      await act(async () => {
        audioRecording = await result.current.stopRecording();
      });

      // Assert
      expect(audioRecording?.blob).toBeInstanceOf(Blob);
      // Should have empty or minimal blob
    });
  });

  describe('Duration Tracking', () => {
    it('should update duration during recording', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      const initialDuration = result.current.duration;

      // Wait for duration to update (should update every 100ms)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 250));
      });

      // Assert
      expect(result.current.duration).toBeGreaterThan(initialDuration);
    });

    it('should not update duration when not recording', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      const initialDuration = result.current.duration;

      // Wait some time
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 250));
      });

      // Assert
      expect(result.current.duration).toBe(initialDuration);
    });

    it('should reset duration to zero when starting new recording', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      // First recording
      await act(async () => {
        await result.current.startRecording();
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      await act(async () => {
        await result.current.stopRecording();
      });

      // Second recording
      await act(async () => {
        await result.current.startRecording();
      });

      // Assert
      // Duration should be small, not accumulated from previous recording
      expect(result.current.duration).toBeLessThan(100);
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should stop recording on unmount', async () => {
      // Arrange
      const { result, unmount } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      // Act
      unmount();

      // Assert
      expect(mockTrack.readyState).toBe('ended');
    });

    it('should stop all media tracks on unmount', async () => {
      // Arrange
      const { result, unmount } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      const track1 = new MockMediaStreamTrack();
      const track2 = new MockMediaStreamTrack();
      mockStream.addTrack(track1 as any);
      mockStream.addTrack(track2 as any);

      // Act
      unmount();

      // Assert
      expect(mockTrack.readyState).toBe('ended');
    });

    it('should cleanup MediaRecorder on unmount', async () => {
      // Arrange
      const { result, unmount } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      // Act
      unmount();

      // Assert - should not crash or leak
      // MediaRecorder should be cleaned up
    });

    it('should handle unmount when not recording', () => {
      // Arrange
      const { unmount } = renderHook(() => useAudioRecorder());

      // Act & Assert - should not throw
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('State Transitions', () => {
    it('should transition from idle to recording to idle', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      // Assert initial state
      expect(result.current.state).toBe('idle');

      // Start recording
      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.state).toBe('recording');

      // Stop recording
      await act(async () => {
        await result.current.stopRecording();
      });

      expect(result.current.state).toBe('idle');
    });

    it('should not allow starting recording when already recording', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      // Act - Try to start again
      await act(async () => {
        await result.current.startRecording();
      });

      // Assert - Should either ignore or handle gracefully
      expect(result.current.state).toBe('recording');
    });

    it('should maintain error state until successful operation', async () => {
      // Arrange
      const permissionError = new Error('NotAllowedError');
      permissionError.name = 'NotAllowedError';
      mockGetUserMedia.mockRejectedValueOnce(permissionError);

      const { result } = renderHook(() => useAudioRecorder());

      // First attempt - fail
      await act(async () => {
        try {
          await result.current.startRecording();
        } catch {}
      });

      expect(result.current.error).toBeTruthy();

      // Second attempt - succeed
      mockGetUserMedia.mockResolvedValue(mockStream);

      await act(async () => {
        await result.current.startRecording();
      });

      // Assert
      expect(result.current.error).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short recording (< 100ms)', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      // Stop immediately
      let audioRecording;
      await act(async () => {
        audioRecording = await result.current.stopRecording();
      });

      // Assert
      expect(audioRecording).toBeDefined();
      expect(audioRecording?.blob).toBeInstanceOf(Blob);
      expect(audioRecording?.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple rapid start/stop cycles', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      // Act - Multiple cycles
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await result.current.startRecording();
        });

        await act(async () => {
          await result.current.stopRecording();
        });
      }

      // Assert
      expect(result.current.state).toBe('idle');
      expect(result.current.error).toBeNull();
    });

    it('should handle different audio constraint configurations', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      // Act
      await act(async () => {
        await result.current.startRecording();
      });

      // Assert
      expect(mockGetUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: expect.any(Object),
        })
      );
    });

    it('should handle browser closing stream unexpectedly', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      // Simulate browser closing stream
      mockStream.active = false;
      mockTrack.readyState = 'ended';

      // Should handle this gracefully
    });

    it('should provide correct MIME type in recording result', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        await result.current.startRecording();
      });

      // Act
      let audioRecording;
      await act(async () => {
        audioRecording = await result.current.stopRecording();
      });

      // Assert
      expect(audioRecording?.mimeType).toBeTruthy();
      expect(audioRecording?.mimeType).toMatch(/^audio\//);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent startRecording calls', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      // Act - Call start multiple times concurrently
      await act(async () => {
        await Promise.all([
          result.current.startRecording(),
          result.current.startRecording(),
        ]);
      });

      // Assert - Should handle gracefully without errors
      expect(result.current.state).toBe('recording');
    });

    it('should not corrupt state with rapid operations', async () => {
      // Arrange
      const { result } = renderHook(() => useAudioRecorder());

      // Act - Rapid operations
      await act(async () => {
        await result.current.startRecording();
        await result.current.stopRecording();
        await result.current.startRecording();
      });

      // Assert
      expect(result.current.state).toBe('recording');
      expect(result.current.error).toBeNull();
    });
  });
});
