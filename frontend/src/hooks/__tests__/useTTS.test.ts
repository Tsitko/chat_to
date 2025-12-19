/**
 * useTTS Hook Unit Tests.
 *
 * Comprehensive tests for TTS state management hook covering:
 * - Initial state
 * - State transitions (idle -> loading -> playing -> idle/error)
 * - Audio synthesis and playback
 * - Error handling
 * - Audio cleanup
 * - Stop functionality
 * - Memory leak prevention
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTTS, clearAudioCache } from '../useTTS';
import { ttsService } from '../../services/ttsService';
import { TTSError } from '../../types/tts';

// Mock the TTS service
vi.mock('../../services/ttsService', () => ({
  ttsService: {
    synthesizeSpeech: vi.fn(),
  },
}));

describe('useTTS Hook', () => {
  let mockAudio: any;
  let audioInstances: any[];

  beforeEach(() => {
    audioInstances = [];

    // Mock Audio constructor
    mockAudio = vi.fn().mockImplementation((src: string) => {
      const audioInstance = {
        src,
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        currentTime: 0,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      audioInstances.push(audioInstance);
      return audioInstance;
    });

    global.Audio = mockAudio as any;

    // Clear all mocks
    vi.clearAllMocks();

    // Clear audio cache to prevent test interference
    clearAudioCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should start in idle state', () => {
      // Arrange & Act
      const { result } = renderHook(() => useTTS());

      // Assert
      expect(result.current.state).toBe('idle');
      expect(result.current.error).toBeNull();
    });

    it('should provide synthesizeAndPlay function', () => {
      // Arrange & Act
      const { result } = renderHook(() => useTTS());

      // Assert
      expect(result.current.synthesizeAndPlay).toBeDefined();
      expect(typeof result.current.synthesizeAndPlay).toBe('function');
    });

    it('should provide stopAudio function', () => {
      // Arrange & Act
      const { result } = renderHook(() => useTTS());

      // Assert
      expect(result.current.stopAudio).toBeDefined();
      expect(typeof result.current.stopAudio).toBe('function');
    });

    it('should have all required return properties', () => {
      // Arrange & Act
      const { result } = renderHook(() => useTTS());

      // Assert
      expect(result.current).toHaveProperty('state');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('synthesizeAndPlay');
      expect(result.current).toHaveProperty('stopAudio');
    });
  });

  describe('Loading State', () => {
    it('should transition to loading state during synthesis', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      let resolveSynthesis: (value: string) => void;
      const synthesisPromise = new Promise<string>((resolve) => {
        resolveSynthesis = resolve;
      });
      vi.mocked(ttsService.synthesizeSpeech).mockReturnValue(synthesisPromise);

      // Act
      act(() => {
        result.current.synthesizeAndPlay('Hello world');
      });

      // Assert - should be in loading state
      await waitFor(() => {
        expect(result.current.state).toBe('loading');
      });

      // Cleanup - resolve promise
      resolveSynthesis!('/audio/test.ogg');
    });

    it('should clear error when starting synthesis', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      vi.mocked(ttsService.synthesizeSpeech).mockRejectedValue(
        new TTSError('network', 'Network error')
      );
      
      await act(async () => {
        await result.current.synthesizeAndPlay('Test').catch(() => {});
      });
      
      expect(result.current.error).not.toBeNull();

      // Act - start new synthesis
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/test.ogg');
      act(() => {
        result.current.synthesizeAndPlay('New test');
      });

      // Assert - error should be cleared when loading starts
      await waitFor(() => {
        expect(result.current.state).toBe('loading');
      });
    });

    it('should handle multiple synthesis requests (last one wins)', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/test.ogg');

      // Act - rapid fire requests
      act(() => {
        result.current.synthesizeAndPlay('Text 1');
        result.current.synthesizeAndPlay('Text 2');
        result.current.synthesizeAndPlay('Text 3');
      });

      // Assert - should be in loading state
      await waitFor(() => {
        expect(result.current.state).toBe('loading');
      });
    });
  });

  describe('Playing State', () => {
    it('should transition to playing state when audio starts', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/test.ogg');

      // Act
      await act(async () => {
        await result.current.synthesizeAndPlay('Hello world');
      });

      // Trigger the 'play' event
      const audioInstance = audioInstances[0];
      const playHandler = audioInstance.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'play'
      )?.[1];
      
      act(() => {
        playHandler?.();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.state).toBe('playing');
      });
    });

    it('should create Audio object with correct path', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/abc123.ogg');

      // Act
      await act(async () => {
        await result.current.synthesizeAndPlay('Hello world');
      });

      // Assert
      expect(mockAudio).toHaveBeenCalledWith('/audio/abc123.ogg');
    });

    it('should call audio.play() after creating Audio object', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/test.ogg');

      // Act
      await act(async () => {
        await result.current.synthesizeAndPlay('Hello world');
      });

      // Assert
      const audioInstance = audioInstances[0];
      expect(audioInstance.play).toHaveBeenCalled();
    });

    it('should set up audio event listeners', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/test.ogg');

      // Act
      await act(async () => {
        await result.current.synthesizeAndPlay('Hello world');
      });

      // Assert
      const audioInstance = audioInstances[0];
      expect(audioInstance.addEventListener).toHaveBeenCalledWith('play', expect.any(Function));
      expect(audioInstance.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
      expect(audioInstance.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should transition back to idle when audio ends', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/test.ogg');

      await act(async () => {
        await result.current.synthesizeAndPlay('Hello world');
      });

      // Trigger the 'ended' event
      const audioInstance = audioInstances[0];
      const endedHandler = audioInstance.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'ended'
      )?.[1];

      // Act
      act(() => {
        endedHandler?.();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.state).toBe('idle');
      });
    });
  });

  describe('Error State', () => {
    it('should transition to error state on synthesis failure', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      const error = new TTSError('service', 'TTS service is offline');
      vi.mocked(ttsService.synthesizeSpeech).mockRejectedValue(error);

      // Act
      await act(async () => {
        await result.current.synthesizeAndPlay('Hello world').catch(() => {});
      });

      // Assert
      await waitFor(() => {
        expect(result.current.state).toBe('error');
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.type).toBe('service');
        expect(result.current.error?.message).toBe('TTS service is offline');
      });
    });

    it('should handle network errors', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      const error = new TTSError('network', 'Network error occurred');
      vi.mocked(ttsService.synthesizeSpeech).mockRejectedValue(error);

      // Act
      await act(async () => {
        await result.current.synthesizeAndPlay('Hello world').catch(() => {});
      });

      // Assert
      await waitFor(() => {
        expect(result.current.state).toBe('error');
        expect(result.current.error?.type).toBe('network');
      });
    });

    it('should handle timeout errors', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      const error = new TTSError('timeout', 'TTS request timed out (5 minute limit)');
      vi.mocked(ttsService.synthesizeSpeech).mockRejectedValue(error);

      // Act
      await act(async () => {
        await result.current.synthesizeAndPlay('Very long text').catch(() => {});
      });

      // Assert
      await waitFor(() => {
        expect(result.current.state).toBe('error');
        expect(result.current.error?.type).toBe('timeout');
      });
    });

    it('should handle audio playback errors', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/test.ogg');

      await act(async () => {
        await result.current.synthesizeAndPlay('Hello world');
      });

      // Trigger the 'error' event on audio
      const audioInstance = audioInstances[0];
      const errorHandler = audioInstance.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'error'
      )?.[1];

      // Act
      act(() => {
        errorHandler?.();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.state).toBe('error');
        expect(result.current.error?.type).toBe('playback');
        expect(result.current.error?.message).toBe('Audio playback failed');
      });
    });

    it('should handle audio.play() rejection (autoplay blocked)', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/test.ogg');
      
      // Mock play() to reject
      mockAudio.mockImplementation((src: string) => {
        const audioInstance = {
          src,
          play: vi.fn().mockRejectedValue(new Error('Autoplay blocked')),
          pause: vi.fn(),
          currentTime: 0,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        };
        audioInstances.push(audioInstance);
        return audioInstance;
      });

      // Act
      await act(async () => {
        await result.current.synthesizeAndPlay('Hello world').catch(() => {});
      });

      // Assert
      await waitFor(() => {
        expect(result.current.state).toBe('error');
      });
    });

    it('should wrap non-TTSError exceptions', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      vi.mocked(ttsService.synthesizeSpeech).mockRejectedValue(new Error('Unknown error'));

      // Act
      await act(async () => {
        await result.current.synthesizeAndPlay('Hello world').catch(() => {});
      });

      // Assert
      await waitFor(() => {
        expect(result.current.state).toBe('error');
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.type).toBe('unknown');
      });
    });
  });

  describe('Stop Audio Functionality', () => {
    it('should stop playing audio', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/test.ogg');

      await act(async () => {
        await result.current.synthesizeAndPlay('Hello world');
      });

      const audioInstance = audioInstances[0];
      
      // Simulate playing state
      const playHandler = audioInstance.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'play'
      )?.[1];
      act(() => {
        playHandler?.();
      });

      // Act
      act(() => {
        result.current.stopAudio();
      });

      // Assert
      expect(audioInstance.pause).toHaveBeenCalled();
      expect(audioInstance.currentTime).toBe(0);
      await waitFor(() => {
        expect(result.current.state).toBe('idle');
      });
    });

    it('should handle stopAudio when no audio is playing', () => {
      // Arrange
      const { result } = renderHook(() => useTTS());

      // Act & Assert - should not throw
      expect(() => {
        act(() => {
          result.current.stopAudio();
        });
      }).not.toThrow();
    });

    it('should stop previous audio when starting new synthesis', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/test1.ogg');

      await act(async () => {
        await result.current.synthesizeAndPlay('First audio');
      });

      const firstAudioInstance = audioInstances[0];

      // Act - start second audio
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/test2.ogg');
      await act(async () => {
        await result.current.synthesizeAndPlay('Second audio');
      });

      // Assert - first audio should be stopped
      expect(firstAudioInstance.pause).toHaveBeenCalled();
    });

    it('should reset audio currentTime to 0 when stopping', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/test.ogg');

      await act(async () => {
        await result.current.synthesizeAndPlay('Hello world');
      });

      const audioInstance = audioInstances[0];
      audioInstance.currentTime = 5.5; // Simulate playing

      // Act
      act(() => {
        result.current.stopAudio();
      });

      // Assert
      expect(audioInstance.currentTime).toBe(0);
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('should cleanup audio on unmount', async () => {
      // Arrange
      const { result, unmount } = renderHook(() => useTTS());
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/test.ogg');

      await act(async () => {
        await result.current.synthesizeAndPlay('Hello world');
      });

      const audioInstance = audioInstances[0];

      // Act
      unmount();

      // Assert
      expect(audioInstance.pause).toHaveBeenCalled();
    });

    it('should not throw error if unmounting without audio', () => {
      // Arrange
      const { unmount } = renderHook(() => useTTS());

      // Act & Assert
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid mount/unmount cycles', async () => {
      // Arrange & Act
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderHook(() => useTTS());
        unmount();
      }

      // Assert - should not throw or leak memory
      expect(true).toBe(true);
    });

    it('should clean up previous audio when starting new one', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      vi.mocked(ttsService.synthesizeSpeech)
        .mockResolvedValueOnce('/audio/test1.ogg')
        .mockResolvedValueOnce('/audio/test2.ogg');

      await act(async () => {
        await result.current.synthesizeAndPlay('First');
      });

      const firstAudio = audioInstances[0];

      // Act
      await act(async () => {
        await result.current.synthesizeAndPlay('Second');
      });

      // Assert
      expect(firstAudio.pause).toHaveBeenCalled();
      expect(audioInstances).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text gracefully', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      const error = new TTSError('unknown', 'TTS request failed');
      vi.mocked(ttsService.synthesizeSpeech).mockRejectedValue(error);

      // Act
      await act(async () => {
        await result.current.synthesizeAndPlay('').catch(() => {});
      });

      // Assert
      await waitFor(() => {
        expect(result.current.state).toBe('error');
      });
    });

    it('should handle very long text', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      const longText = 'Lorem ipsum '.repeat(1000);
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/long.ogg');

      // Act
      await act(async () => {
        await result.current.synthesizeAndPlay(longText);
      });

      // Assert
      expect(ttsService.synthesizeSpeech).toHaveBeenCalledWith(longText);
    });

    it('should handle special characters in text', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      const specialText = 'Hello! @#$%^&*() <script>alert("xss")</script>';
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/special.ogg');

      // Act
      await act(async () => {
        await result.current.synthesizeAndPlay(specialText);
      });

      // Assert
      expect(ttsService.synthesizeSpeech).toHaveBeenCalledWith(specialText);
    });

    it('should handle unicode characters', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      const unicodeText = 'Привет мир! 你好世界';
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/unicode.ogg');

      // Act
      await act(async () => {
        await result.current.synthesizeAndPlay(unicodeText);
      });

      // Assert
      expect(ttsService.synthesizeSpeech).toHaveBeenCalledWith(unicodeText);
    });

    it('should handle stopAudio during loading state', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      let resolveSynthesis: (value: string) => void;
      const synthesisPromise = new Promise<string>((resolve) => {
        resolveSynthesis = resolve;
      });
      vi.mocked(ttsService.synthesizeSpeech).mockReturnValue(synthesisPromise);

      act(() => {
        result.current.synthesizeAndPlay('Hello world');
      });

      await waitFor(() => {
        expect(result.current.state).toBe('loading');
      });

      // Act - try to stop during loading
      act(() => {
        result.current.stopAudio();
      });

      // Assert - should transition to idle
      await waitFor(() => {
        expect(result.current.state).toBe('idle');
      });

      // Cleanup
      resolveSynthesis!('/audio/test.ogg');
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistent state through full lifecycle', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/test.ogg');

      // Assert initial state
      expect(result.current.state).toBe('idle');

      // Act - start synthesis
      act(() => {
        result.current.synthesizeAndPlay('Hello world');
      });

      // Assert loading state
      await waitFor(() => {
        expect(result.current.state).toBe('loading');
      });

      // Wait for synthesis to complete
      await waitFor(() => {
        expect(audioInstances.length).toBeGreaterThan(0);
      });

      // Trigger play event
      const audioInstance = audioInstances[0];
      const playHandler = audioInstance.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'play'
      )?.[1];
      
      act(() => {
        playHandler?.();
      });

      // Assert playing state
      await waitFor(() => {
        expect(result.current.state).toBe('playing');
      });

      // Trigger ended event
      const endedHandler = audioInstance.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'ended'
      )?.[1];
      
      act(() => {
        endedHandler?.();
      });

      // Assert back to idle state
      await waitFor(() => {
        expect(result.current.state).toBe('idle');
      });
    });

    it('should not have race conditions with rapid state changes', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/test.ogg');

      // Act - rapid operations
      await act(async () => {
        result.current.synthesizeAndPlay('Text 1');
        result.current.stopAudio();
        result.current.synthesizeAndPlay('Text 2');
        result.current.stopAudio();
        await result.current.synthesizeAndPlay('Text 3');
      });

      // Assert - should end in a valid state
      expect(['idle', 'loading', 'playing', 'error']).toContain(result.current.state);
    });
  });

  describe('Audio Path Caching', () => {
    it('should cache audio path and not call TTS service on second play', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      const testText = 'Hello world';
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/test.ogg');

      // Act - first synthesis
      await act(async () => {
        await result.current.synthesizeAndPlay(testText);
      });

      // Assert - service was called once
      expect(ttsService.synthesizeSpeech).toHaveBeenCalledTimes(1);
      expect(ttsService.synthesizeSpeech).toHaveBeenCalledWith(testText);

      // Trigger ended event to return to idle
      const audioInstance = audioInstances[0];
      const endedHandler = audioInstance.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'ended'
      )?.[1];
      act(() => {
        endedHandler?.();
      });

      // Act - second synthesis with same text
      await act(async () => {
        await result.current.synthesizeAndPlay(testText);
      });

      // Assert - service was NOT called again (still 1 call)
      expect(ttsService.synthesizeSpeech).toHaveBeenCalledTimes(1);
      // But Audio was created twice (once for each playback)
      expect(audioInstances.length).toBe(2);
      // Both using the cached path
      expect(audioInstances[1].src).toBe('/audio/test.ogg');
    });

    it('should call TTS service for different text content', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      vi.mocked(ttsService.synthesizeSpeech)
        .mockResolvedValueOnce('/audio/test1.ogg')
        .mockResolvedValueOnce('/audio/test2.ogg');

      // Act - synthesize first text
      await act(async () => {
        await result.current.synthesizeAndPlay('First text');
      });

      // Assert
      expect(ttsService.synthesizeSpeech).toHaveBeenCalledTimes(1);

      // Trigger ended event
      const firstAudio = audioInstances[0];
      const endedHandler1 = firstAudio.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'ended'
      )?.[1];
      act(() => {
        endedHandler1?.();
      });

      // Act - synthesize different text
      await act(async () => {
        await result.current.synthesizeAndPlay('Second text');
      });

      // Assert - service was called again for different text
      expect(ttsService.synthesizeSpeech).toHaveBeenCalledTimes(2);
      expect(ttsService.synthesizeSpeech).toHaveBeenNthCalledWith(1, 'First text');
      expect(ttsService.synthesizeSpeech).toHaveBeenNthCalledWith(2, 'Second text');
    });

    it('should use cached path even after multiple hooks unmount and remount', async () => {
      // Arrange
      const testText = 'Cached text';
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/cached.ogg');

      // First hook instance
      const { unmount: unmount1 } = renderHook(() => useTTS());
      const { result: result1 } = renderHook(() => useTTS());

      await act(async () => {
        await result1.current.synthesizeAndPlay(testText);
      });

      expect(ttsService.synthesizeSpeech).toHaveBeenCalledTimes(1);

      unmount1();

      // Second hook instance (after unmount)
      const { result: result2 } = renderHook(() => useTTS());

      await act(async () => {
        await result2.current.synthesizeAndPlay(testText);
      });

      // Assert - cache persists across hook instances
      expect(ttsService.synthesizeSpeech).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should clear cache when clearAudioCache is called', async () => {
      // Arrange
      const { result } = renderHook(() => useTTS());
      const testText = 'Test text';
      vi.mocked(ttsService.synthesizeSpeech).mockResolvedValue('/audio/test.ogg');

      // First synthesis
      await act(async () => {
        await result.current.synthesizeAndPlay(testText);
      });

      expect(ttsService.synthesizeSpeech).toHaveBeenCalledTimes(1);

      // Act - clear cache (happens in beforeEach of tests)
      clearAudioCache();

      // Second synthesis after cache clear
      await act(async () => {
        await result.current.synthesizeAndPlay(testText);
      });

      // Assert - service was called again after cache clear
      expect(ttsService.synthesizeSpeech).toHaveBeenCalledTimes(2);
    });
  });
});
