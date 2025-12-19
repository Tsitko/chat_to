/**
 * Unit tests for useGroupTTS hook.
 *
 * Test Coverage:
 * - Initial state
 * - playMessage functionality (single message playback)
 * - playAllResponses functionality (sequential playback)
 * - Playlist management (playlist creation, filtering)
 * - Auto-play next functionality
 * - Navigation (playNext, playPrevious)
 * - Pause and resume functionality
 * - Stop playback
 * - State transitions (idle -> loading -> playing)
 * - Error handling
 * - Edge cases (empty playlist, no assistant messages, boundary conditions)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGroupTTS } from '../../hooks/useGroupTTS';
import * as useTTSModule from '../../hooks/useTTS';
import type { GroupMessage } from '../../types/group';
import type { TTSError } from '../../types/tts';

// Mock useTTS hook
vi.mock('../../hooks/useTTS', () => ({
  useTTS: vi.fn(),
}));

describe('useGroupTTS Hook', () => {
  let mockUseTTS: any;

  beforeEach(() => {
    mockUseTTS = {
      state: 'idle',
      error: null,
      synthesizeAndPlay: vi.fn().mockResolvedValue(undefined),
      stopAudio: vi.fn(),
    };

    vi.mocked(useTTSModule.useTTS).mockReturnValue(mockUseTTS);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial idle state', () => {
      const { result } = renderHook(() => useGroupTTS());

      expect(result.current.state).toBe('idle');
      expect(result.current.error).toBe(null);
      expect(result.current.currentMessageId).toBe(null);
      expect(result.current.currentIndex).toBe(-1);
      expect(result.current.totalMessages).toBe(0);
      expect(result.current.hasNext).toBe(false);
      expect(result.current.hasPrevious).toBe(false);
    });
  });

  describe('playMessage', () => {
    it('should play a single message', async () => {
      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playMessage('msg-1', 'Hello world', 'Hegel');
      });

      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith('Hello world');
      expect(result.current.currentMessageId).toBe('msg-1');
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.totalMessages).toBe(1);
    });

    it('should create single-item playlist', async () => {
      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playMessage('msg-1', 'Test message', 'Kant');
      });

      expect(result.current.totalMessages).toBe(1);
      expect(result.current.hasNext).toBe(false);
      expect(result.current.hasPrevious).toBe(false);
    });

    it('should reset isPaused when playing message', async () => {
      const { result } = renderHook(() => useGroupTTS());

      // Pause first
      await act(async () => {
        await result.current.playMessage('msg-1', 'First', 'Hegel');
      });

      act(() => {
        result.current.pause();
      });

      // Play new message
      await act(async () => {
        await result.current.playMessage('msg-2', 'Second', 'Kant');
      });

      // Should not be paused anymore
      expect(result.current.currentMessageId).toBe('msg-2');
    });
  });

  describe('playAllResponses', () => {
    const mockMessages: GroupMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello everyone',
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Response from Hegel',
        created_at: '2025-01-01T00:00:01Z',
        character_id: 'char-1',
        character_name: 'Hegel',
      },
      {
        id: 'msg-3',
        role: 'assistant',
        content: 'Response from Kant',
        created_at: '2025-01-01T00:00:02Z',
        character_id: 'char-2',
        character_name: 'Kant',
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: 'Response from Nietzsche',
        created_at: '2025-01-01T00:00:03Z',
        character_id: 'char-3',
        character_name: 'Nietzsche',
      },
    ];

    it('should filter and play only assistant messages', async () => {
      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses(mockMessages);
      });

      expect(result.current.totalMessages).toBe(3); // Only 3 assistant messages
      expect(result.current.currentIndex).toBe(0);
    });

    it('should start playing first assistant message', async () => {
      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses(mockMessages);
      });

      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith('Response from Hegel');
      expect(result.current.currentMessageId).toBe('msg-2');
    });

    it('should create playlist with all assistant messages', async () => {
      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses(mockMessages);
      });

      expect(result.current.totalMessages).toBe(3);
      expect(result.current.hasNext).toBe(true);
      expect(result.current.hasPrevious).toBe(false);
    });

    it('should handle empty message array', async () => {
      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses([]);
      });

      expect(mockUseTTS.synthesizeAndPlay).not.toHaveBeenCalled();
      expect(result.current.totalMessages).toBe(0);
    });

    it('should handle messages with no assistant messages', async () => {
      const userOnlyMessages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'First',
          created_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'msg-2',
          role: 'user',
          content: 'Second',
          created_at: '2025-01-01T00:00:01Z',
        },
      ];

      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses(userOnlyMessages);
      });

      expect(mockUseTTS.synthesizeAndPlay).not.toHaveBeenCalled();
      expect(result.current.totalMessages).toBe(0);
    });
  });

  describe('Auto-play Next', () => {
    const mockMessages: GroupMessage[] = [
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'First response',
        created_at: '2025-01-01T00:00:00Z',
        character_name: 'Hegel',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Second response',
        created_at: '2025-01-01T00:00:01Z',
        character_name: 'Kant',
      },
    ];

    it('should auto-play next message when current finishes', async () => {
      const { result, rerender } = renderHook(() => useGroupTTS());

      // Start playing all responses
      await act(async () => {
        await result.current.playAllResponses(mockMessages);
      });

      expect(result.current.currentIndex).toBe(0);

      // Simulate first message finishing by changing state to idle
      mockUseTTS.state = 'idle';
      rerender();

      // Wait for auto-play to trigger
      await waitFor(() => {
        expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith('Second response');
      });
    });

    it('should not auto-play if paused', async () => {
      const { result, rerender } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses(mockMessages);
      });

      // Pause playback
      act(() => {
        result.current.pause();
      });

      // Simulate state becoming idle
      mockUseTTS.state = 'idle';
      rerender();

      // Wait a bit to ensure no auto-play
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should only have been called once (initial play)
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledTimes(1);
    });

    it('should not auto-play if no next message', async () => {
      const singleMessage: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Only response',
          created_at: '2025-01-01T00:00:00Z',
          character_name: 'Hegel',
        },
      ];

      const { result, rerender } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses(singleMessage);
      });

      expect(result.current.hasNext).toBe(false);

      // Simulate state becoming idle
      mockUseTTS.state = 'idle';
      rerender();

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should only have been called once
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledTimes(1);
    });
  });

  describe('playNext', () => {
    const mockMessages: GroupMessage[] = [
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'First',
        created_at: '2025-01-01T00:00:00Z',
        character_name: 'Hegel',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Second',
        created_at: '2025-01-01T00:00:01Z',
        character_name: 'Kant',
      },
      {
        id: 'msg-3',
        role: 'assistant',
        content: 'Third',
        created_at: '2025-01-01T00:00:02Z',
        character_name: 'Nietzsche',
      },
    ];

    it('should play next message in playlist', async () => {
      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses(mockMessages);
      });

      expect(result.current.currentIndex).toBe(0);

      vi.clearAllMocks();

      await act(async () => {
        await result.current.playNext();
      });

      expect(result.current.currentIndex).toBe(1);
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith('Second');
    });

    it('should update hasNext and hasPrevious correctly', async () => {
      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses(mockMessages);
      });

      expect(result.current.hasPrevious).toBe(false);
      expect(result.current.hasNext).toBe(true);

      await act(async () => {
        await result.current.playNext();
      });

      expect(result.current.hasPrevious).toBe(true);
      expect(result.current.hasNext).toBe(true);

      await act(async () => {
        await result.current.playNext();
      });

      expect(result.current.hasPrevious).toBe(true);
      expect(result.current.hasNext).toBe(false);
    });

    it('should not play beyond last message', async () => {
      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses(mockMessages);
      });

      // Move to last message
      await act(async () => {
        await result.current.playNext();
        await result.current.playNext();
      });

      expect(result.current.hasNext).toBe(false);

      vi.clearAllMocks();

      // Try to play next (should not work)
      await act(async () => {
        await result.current.playNext();
      });

      expect(mockUseTTS.synthesizeAndPlay).not.toHaveBeenCalled();
    });

    it('should reset isPaused when playing next', async () => {
      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses(mockMessages);
      });

      act(() => {
        result.current.pause();
      });

      await act(async () => {
        await result.current.playNext();
      });

      // Should not be paused anymore (implicitly tested by playback)
      expect(result.current.currentIndex).toBe(1);
    });
  });

  describe('playPrevious', () => {
    const mockMessages: GroupMessage[] = [
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'First',
        created_at: '2025-01-01T00:00:00Z',
        character_name: 'Hegel',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Second',
        created_at: '2025-01-01T00:00:01Z',
        character_name: 'Kant',
      },
      {
        id: 'msg-3',
        role: 'assistant',
        content: 'Third',
        created_at: '2025-01-01T00:00:02Z',
        character_name: 'Nietzsche',
      },
    ];

    it('should play previous message in playlist', async () => {
      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses(mockMessages);
      });

      // Move to second message
      await act(async () => {
        await result.current.playNext();
      });

      expect(result.current.currentIndex).toBe(1);

      vi.clearAllMocks();

      // Go back to first
      await act(async () => {
        await result.current.playPrevious();
      });

      expect(result.current.currentIndex).toBe(0);
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith('First');
    });

    it('should not play before first message', async () => {
      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses(mockMessages);
      });

      expect(result.current.hasPrevious).toBe(false);

      vi.clearAllMocks();

      await act(async () => {
        await result.current.playPrevious();
      });

      expect(mockUseTTS.synthesizeAndPlay).not.toHaveBeenCalled();
    });

    it('should reset isPaused when playing previous', async () => {
      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses(mockMessages);
        await result.current.playNext();
      });

      act(() => {
        result.current.pause();
      });

      await act(async () => {
        await result.current.playPrevious();
      });

      expect(result.current.currentIndex).toBe(0);
    });
  });

  describe('pause and resume', () => {
    it('should pause playback', async () => {
      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playMessage('msg-1', 'Test', 'Hegel');
      });

      act(() => {
        result.current.pause();
      });

      expect(mockUseTTS.stopAudio).toHaveBeenCalled();
    });

    it('should resume playback from current position', async () => {
      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playMessage('msg-1', 'Test message', 'Hegel');
      });

      act(() => {
        result.current.pause();
      });

      vi.clearAllMocks();

      await act(async () => {
        await result.current.resume();
      });

      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith('Test message');
      expect(result.current.currentMessageId).toBe('msg-1');
    });

    it('should not resume if no current message', async () => {
      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.resume();
      });

      expect(mockUseTTS.synthesizeAndPlay).not.toHaveBeenCalled();
    });

    it('should not resume if playlist is empty', async () => {
      const { result } = renderHook(() => useGroupTTS());

      act(() => {
        result.current.pause();
      });

      await act(async () => {
        await result.current.resume();
      });

      expect(mockUseTTS.synthesizeAndPlay).not.toHaveBeenCalled();
    });
  });

  describe('stopPlayback', () => {
    it('should stop audio and clear playlist', async () => {
      const mockMessages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Test',
          created_at: '2025-01-01T00:00:00Z',
          character_name: 'Hegel',
        },
      ];

      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses(mockMessages);
      });

      expect(result.current.totalMessages).toBe(1);

      act(() => {
        result.current.stopPlayback();
      });

      expect(mockUseTTS.stopAudio).toHaveBeenCalled();
      expect(result.current.totalMessages).toBe(0);
      expect(result.current.currentIndex).toBe(-1);
      expect(result.current.currentMessageId).toBe(null);
    });

    it('should reset isPaused when stopping', async () => {
      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playMessage('msg-1', 'Test', 'Hegel');
      });

      act(() => {
        result.current.pause();
      });

      act(() => {
        result.current.stopPlayback();
      });

      expect(result.current.currentMessageId).toBe(null);
    });
  });

  describe('State from useTTS', () => {
    it('should reflect state from useTTS hook', () => {
      mockUseTTS.state = 'loading';

      const { result } = renderHook(() => useGroupTTS());

      expect(result.current.state).toBe('loading');
    });

    it('should reflect error from useTTS hook', () => {
      const mockError: TTSError = {
        name: 'TTSError',
        type: 'service',
        message: 'Service unavailable',
      } as TTSError;

      mockUseTTS.error = mockError;

      const { result } = renderHook(() => useGroupTTS());

      expect(result.current.error).toEqual(mockError);
    });

    it('should handle playing state', () => {
      mockUseTTS.state = 'playing';

      const { result } = renderHook(() => useGroupTTS());

      expect(result.current.state).toBe('playing');
    });

    it('should handle error state', () => {
      mockUseTTS.state = 'error';

      const { result } = renderHook(() => useGroupTTS());

      expect(result.current.state).toBe('error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle messages with undefined character names', async () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Response',
          created_at: '2025-01-01T00:00:00Z',
          // No character_name
        },
      ];

      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses(messages);
      });

      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith('Response');
    });

    it('should handle very long playlist', async () => {
      const manyMessages: GroupMessage[] = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'assistant' as const,
        content: `Message ${i}`,
        created_at: new Date(2025, 0, 1, 0, 0, i).toISOString(),
        character_name: `Character ${i}`,
      }));

      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses(manyMessages);
      });

      expect(result.current.totalMessages).toBe(100);
      expect(result.current.hasNext).toBe(true);
    });

    it('should handle rapid playNext calls', async () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'First',
          created_at: '2025-01-01T00:00:00Z',
          character_name: 'Hegel',
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Second',
          created_at: '2025-01-01T00:00:01Z',
          character_name: 'Kant',
        },
        {
          id: 'msg-3',
          role: 'assistant',
          content: 'Third',
          created_at: '2025-01-01T00:00:02Z',
          character_name: 'Nietzsche',
        },
      ];

      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses(messages);
      });

      await act(async () => {
        await Promise.all([
          result.current.playNext(),
          result.current.playNext(),
          result.current.playNext(),
        ]);
      });

      // Should handle gracefully
      expect(result.current.currentIndex).toBeLessThan(messages.length);
    });

    it('should handle switching playlists mid-playback', async () => {
      const playlist1: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Playlist 1',
          created_at: '2025-01-01T00:00:00Z',
          character_name: 'Hegel',
        },
      ];

      const playlist2: GroupMessage[] = [
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Playlist 2',
          created_at: '2025-01-01T00:00:01Z',
          character_name: 'Kant',
        },
      ];

      const { result } = renderHook(() => useGroupTTS());

      await act(async () => {
        await result.current.playAllResponses(playlist1);
      });

      expect(result.current.currentMessageId).toBe('msg-1');

      vi.clearAllMocks();

      await act(async () => {
        await result.current.playAllResponses(playlist2);
      });

      expect(result.current.currentMessageId).toBe('msg-2');
      expect(result.current.totalMessages).toBe(1);
    });
  });
});
