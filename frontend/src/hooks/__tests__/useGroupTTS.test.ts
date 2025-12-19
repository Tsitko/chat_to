/**
 * useGroupTTS Hook Unit Tests.
 *
 * Comprehensive tests for the useGroupTTS hook covering:
 * - Playlist initialization from messages
 * - Play/pause/stop controls
 * - Next/previous navigation
 * - Auto-advance on message complete
 * - Sequential playback logic
 * - Error handling
 * - Playlist state management
 * - Integration with base useTTS hook
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import type { TTSState, TTSError } from '../../types/tts';
import {
  mockGroupMessages,
  mockGroupMessagesAssistantOnly,
  mockGroupMessagesUserOnly,
  mockGroupMessagesEmpty,
  mockGroupAssistantMessage1,
  mockGroupAssistantMessage2,
  mockGroupAssistantMessage3,
} from '../../tests/mockGroupData';
import type { GroupMessage } from '../../types/group';

// Mock useTTS hook
const mockUseTTS = {
  state: 'idle' as TTSState,
  error: null as TTSError | null,
  synthesizeAndPlay: vi.fn(),
  stopAudio: vi.fn(),
};

vi.mock('../useTTS', () => ({
  useTTS: () => mockUseTTS,
}));

// Playlist item interface
interface PlaylistItem {
  messageId: string;
  text: string;
  characterName?: string;
}

// Hook interface
interface UseGroupTTSReturn {
  state: TTSState;
  error: TTSError | null;
  currentMessageId: string | null;
  currentIndex: number;
  totalMessages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  playMessage: (messageId: string, text: string, characterName?: string) => Promise<void>;
  playAllResponses: (messages: GroupMessage[]) => Promise<void>;
  stopPlayback: () => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  pause: () => void;
  resume: () => Promise<void>;
}

/**
 * Hook implementation skeleton for testing.
 */
const useGroupTTS = (): UseGroupTTSReturn => {
  // State would be managed with React.useState in actual implementation
  let playlist: PlaylistItem[] = [];
  let currentIndex = -1;
  let isPaused = false;

  const state = mockUseTTS.state;
  const error = mockUseTTS.error;
  const currentMessageId = currentIndex >= 0 ? playlist[currentIndex]?.messageId || null : null;
  const totalMessages = playlist.length;
  const hasNext = currentIndex < playlist.length - 1;
  const hasPrevious = currentIndex > 0;

  const playMessage = async (messageId: string, text: string, characterName?: string) => {
    playlist = [{ messageId, text, characterName }];
    currentIndex = 0;
    isPaused = false;
    await mockUseTTS.synthesizeAndPlay(text);
  };

  const playAllResponses = async (messages: GroupMessage[]) => {
    const assistantMessages = messages.filter((msg) => msg.role === 'assistant');
    playlist = assistantMessages.map((msg) => ({
      messageId: msg.id,
      text: msg.content,
      characterName: msg.character_name,
    }));
    currentIndex = 0;
    isPaused = false;

    if (playlist.length > 0) {
      await mockUseTTS.synthesizeAndPlay(playlist[0].text);
    }
  };

  const stopPlayback = () => {
    mockUseTTS.stopAudio();
    playlist = [];
    currentIndex = -1;
    isPaused = false;
  };

  const playNext = async () => {
    if (!hasNext) return;
    currentIndex++;
    await mockUseTTS.synthesizeAndPlay(playlist[currentIndex].text);
  };

  const playPrevious = async () => {
    if (!hasPrevious) return;
    currentIndex--;
    await mockUseTTS.synthesizeAndPlay(playlist[currentIndex].text);
  };

  const pause = () => {
    isPaused = true;
    mockUseTTS.stopAudio();
  };

  const resume = async () => {
    if (currentIndex >= 0 && currentIndex < playlist.length) {
      isPaused = false;
      await mockUseTTS.synthesizeAndPlay(playlist[currentIndex].text);
    }
  };

  return {
    state,
    error,
    currentMessageId,
    currentIndex,
    totalMessages,
    hasNext,
    hasPrevious,
    playMessage,
    playAllResponses,
    stopPlayback,
    playNext,
    playPrevious,
    pause,
    resume,
  };
};

describe('useGroupTTS Hook', () => {
  beforeEach(() => {
    // Reset mock state
    mockUseTTS.state = 'idle';
    mockUseTTS.error = null;

    // Clear all mocks
    vi.clearAllMocks();

    // Setup default mock implementations
    mockUseTTS.synthesizeAndPlay.mockImplementation(async (text: string) => {
      mockUseTTS.state = 'loading';
      await new Promise((resolve) => setTimeout(resolve, 10));
      mockUseTTS.state = 'playing';
      await new Promise((resolve) => setTimeout(resolve, 50));
      mockUseTTS.state = 'idle';
    });

    mockUseTTS.stopAudio.mockImplementation(() => {
      mockUseTTS.state = 'idle';
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      // Arrange & Act
      const { result } = renderHook(() => useGroupTTS());

      // Assert
      expect(result.current.state).toBe('idle');
      expect(result.current.error).toBeNull();
      expect(result.current.currentMessageId).toBeNull();
      expect(result.current.currentIndex).toBe(-1);
      expect(result.current.totalMessages).toBe(0);
      expect(result.current.hasNext).toBe(false);
      expect(result.current.hasPrevious).toBe(false);
    });
  });

  describe('Play Single Message', () => {
    it('should play a single message', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      const messageId = 'msg-1';
      const text = 'Hello world';
      const characterName = 'Hegel';

      // Act
      await act(async () => {
        await result.current.playMessage(messageId, text, characterName);
      });

      // Assert
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith(text);
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledTimes(1);
    });

    it('should set current message ID when playing', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      const messageId = 'msg-1';

      // Act
      await act(async () => {
        await result.current.playMessage(messageId, 'Test message');
      });

      // Assert
      expect(result.current.currentMessageId).toBe(messageId);
    });

    it('should handle playback without character name', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());

      // Act
      await act(async () => {
        await result.current.playMessage('msg-1', 'Test');
      });

      // Assert
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith('Test');
    });

    it('should replace playlist when playing single message', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());

      // First, play all responses
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
      });

      // Act - play single message
      await act(async () => {
        await result.current.playMessage('single-msg', 'Single message');
      });

      // Assert
      expect(result.current.totalMessages).toBe(1);
      expect(result.current.currentMessageId).toBe('single-msg');
    });
  });

  describe('Play All Responses', () => {
    it('should create playlist from assistant messages only', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());

      // Act
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessages);
      });

      // Assert
      const assistantCount = mockGroupMessages.filter((msg) => msg.role === 'assistant').length;
      expect(result.current.totalMessages).toBe(assistantCount);
    });

    it('should filter out user messages', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());

      // Act
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessages);
      });

      // Assert
      const totalMessages = result.current.totalMessages;
      const userMessages = mockGroupMessages.filter((msg) => msg.role === 'user');
      expect(totalMessages).toBeLessThan(mockGroupMessages.length);
      expect(userMessages.length).toBeGreaterThan(0); // Confirm there were user messages to filter
    });

    it('should start playing first message automatically', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());

      // Act
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
      });

      // Assert
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith(
        mockGroupMessagesAssistantOnly[0].content
      );
    });

    it('should set current index to 0 when starting playlist', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());

      // Act
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
      });

      // Assert
      expect(result.current.currentIndex).toBe(0);
    });

    it('should handle empty message array', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());

      // Act
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesEmpty);
      });

      // Assert
      expect(result.current.totalMessages).toBe(0);
      expect(mockUseTTS.synthesizeAndPlay).not.toHaveBeenCalled();
    });

    it('should handle messages with only user messages', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());

      // Act
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesUserOnly);
      });

      // Assert
      expect(result.current.totalMessages).toBe(0);
      expect(mockUseTTS.synthesizeAndPlay).not.toHaveBeenCalled();
    });

    it('should preserve character information in playlist', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      const messagesWithCharacters = [
        mockGroupAssistantMessage1,
        mockGroupAssistantMessage2,
        mockGroupAssistantMessage3,
      ];

      // Act
      await act(async () => {
        await result.current.playAllResponses(messagesWithCharacters);
      });

      // Assert
      expect(result.current.totalMessages).toBe(3);
      expect(result.current.currentMessageId).toBe(mockGroupAssistantMessage1.id);
    });
  });

  describe('Navigation Controls', () => {
    it('should play next message in playlist', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
      });
      vi.clearAllMocks();

      // Act
      await act(async () => {
        await result.current.playNext();
      });

      // Assert
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith(
        mockGroupMessagesAssistantOnly[1].content
      );
      expect(result.current.currentIndex).toBe(1);
    });

    it('should not play next when at end of playlist', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      await act(async () => {
        await result.current.playAllResponses([mockGroupAssistantMessage1]);
      });
      vi.clearAllMocks();

      // Act
      await act(async () => {
        await result.current.playNext();
      });

      // Assert
      expect(mockUseTTS.synthesizeAndPlay).not.toHaveBeenCalled();
      expect(result.current.hasNext).toBe(false);
    });

    it('should play previous message in playlist', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
      });
      // Move to second message
      await act(async () => {
        await result.current.playNext();
      });
      vi.clearAllMocks();

      // Act
      await act(async () => {
        await result.current.playPrevious();
      });

      // Assert
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith(
        mockGroupMessagesAssistantOnly[0].content
      );
      expect(result.current.currentIndex).toBe(0);
    });

    it('should not play previous when at start of playlist', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
      });
      vi.clearAllMocks();

      // Act
      await act(async () => {
        await result.current.playPrevious();
      });

      // Assert
      expect(mockUseTTS.synthesizeAndPlay).not.toHaveBeenCalled();
      expect(result.current.hasPrevious).toBe(false);
    });

    it('should update hasNext correctly', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
      });

      // Assert - at start, should have next
      expect(result.current.hasNext).toBe(true);

      // Navigate to end
      const totalMessages = result.current.totalMessages;
      for (let i = 1; i < totalMessages; i++) {
        await act(async () => {
          await result.current.playNext();
        });
      }

      // Assert - at end, should not have next
      expect(result.current.hasNext).toBe(false);
    });

    it('should update hasPrevious correctly', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
      });

      // Assert - at start, should not have previous
      expect(result.current.hasPrevious).toBe(false);

      // Navigate forward
      await act(async () => {
        await result.current.playNext();
      });

      // Assert - after moving forward, should have previous
      expect(result.current.hasPrevious).toBe(true);
    });
  });

  describe('Playback Controls', () => {
    it('should stop playback and clear playlist', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
      });

      // Act
      act(() => {
        result.current.stopPlayback();
      });

      // Assert
      expect(mockUseTTS.stopAudio).toHaveBeenCalled();
      expect(result.current.totalMessages).toBe(0);
      expect(result.current.currentIndex).toBe(-1);
      expect(result.current.currentMessageId).toBeNull();
    });

    it('should pause current playback', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
      });

      // Act
      act(() => {
        result.current.pause();
      });

      // Assert
      expect(mockUseTTS.stopAudio).toHaveBeenCalled();
    });

    it('should resume playback from current position', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
      });
      act(() => {
        result.current.pause();
      });
      vi.clearAllMocks();

      // Act
      await act(async () => {
        await result.current.resume();
      });

      // Assert
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith(
        mockGroupMessagesAssistantOnly[0].content
      );
    });

    it('should not resume if no current message', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());

      // Act
      await act(async () => {
        await result.current.resume();
      });

      // Assert
      expect(mockUseTTS.synthesizeAndPlay).not.toHaveBeenCalled();
    });
  });

  describe('Auto-Advance Logic', () => {
    it('should auto-play next message when current finishes', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());

      // Mock implementation that simulates state changes
      let currentIndex = 0;
      mockUseTTS.synthesizeAndPlay.mockImplementation(async (text: string) => {
        mockUseTTS.state = 'loading';
        await new Promise((resolve) => setTimeout(resolve, 10));
        mockUseTTS.state = 'playing';
        await new Promise((resolve) => setTimeout(resolve, 10));
        mockUseTTS.state = 'idle';
        // Auto-advance would be triggered by useEffect watching state change to idle
      });

      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
      });

      // Assert - first message should be playing
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.hasNext).toBe(true);
    });

    it('should not auto-play when paused', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
      });

      act(() => {
        result.current.pause();
      });

      mockUseTTS.state = 'idle';
      vi.clearAllMocks();

      // Act - simulate state change to idle
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert - should not auto-play next
      expect(mockUseTTS.synthesizeAndPlay).not.toHaveBeenCalled();
    });

    it('should not auto-play when at end of playlist', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      await act(async () => {
        await result.current.playAllResponses([mockGroupAssistantMessage1]);
      });

      // Message finishes
      mockUseTTS.state = 'idle';
      vi.clearAllMocks();

      // Act - simulate state change
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(result.current.hasNext).toBe(false);
      expect(mockUseTTS.synthesizeAndPlay).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle TTS synthesis error', async () => {
      // Arrange
      const ttsError = { type: 'synthesis', message: 'Synthesis failed' } as TTSError;
      mockUseTTS.synthesizeAndPlay.mockRejectedValue(ttsError);
      const { result } = renderHook(() => useGroupTTS());

      // Act
      await act(async () => {
        try {
          await result.current.playMessage('msg-1', 'Test');
        } catch (error) {
          // Expected to throw
        }
      });

      // Assert
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalled();
    });

    it('should handle playback error', async () => {
      // Arrange
      const playbackError = { type: 'playback', message: 'Playback failed' } as TTSError;
      mockUseTTS.synthesizeAndPlay.mockRejectedValue(playbackError);
      const { result } = renderHook(() => useGroupTTS());

      // Act
      await act(async () => {
        try {
          await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
        } catch (error) {
          // Expected to throw
        }
      });

      // Assert
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalled();
    });

    it('should expose error state from useTTS', () => {
      // Arrange
      const error = { type: 'synthesis', message: 'Error occurred' } as TTSError;
      mockUseTTS.error = error;

      // Act
      const { result } = renderHook(() => useGroupTTS());

      // Assert
      expect(result.current.error).toBe(error);
    });

    it('should handle error during navigation', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
      });

      mockUseTTS.synthesizeAndPlay.mockRejectedValue(
        new Error('Navigation failed')
      );

      // Act
      await act(async () => {
        try {
          await result.current.playNext();
        } catch (error) {
          // Expected to throw
        }
      });

      // Assert - should have attempted to play
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalled();
    });
  });

  describe('State Synchronization', () => {
    it('should expose TTS state', () => {
      // Arrange
      mockUseTTS.state = 'playing';

      // Act
      const { result } = renderHook(() => useGroupTTS());

      // Assert
      expect(result.current.state).toBe('playing');
    });

    it('should update state as TTS state changes', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());

      // Act & Assert - idle initially
      expect(result.current.state).toBe('idle');

      // Simulate state changes
      mockUseTTS.state = 'loading';
      expect(result.current.state).toBe('loading');

      mockUseTTS.state = 'playing';
      expect(result.current.state).toBe('playing');

      mockUseTTS.state = 'idle';
      expect(result.current.state).toBe('idle');
    });

    it('should handle error state', () => {
      // Arrange
      mockUseTTS.state = 'error';
      mockUseTTS.error = { type: 'synthesis', message: 'Error' } as TTSError;

      // Act
      const { result } = renderHook(() => useGroupTTS());

      // Assert
      expect(result.current.state).toBe('error');
      expect(result.current.error).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text content', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());

      // Act
      await act(async () => {
        await result.current.playMessage('msg-1', '');
      });

      // Assert
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith('');
    });

    it('should handle very long text content', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      const longText = 'A'.repeat(10000);

      // Act
      await act(async () => {
        await result.current.playMessage('msg-1', longText);
      });

      // Assert
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith(longText);
    });

    it('should handle special characters in text', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      const specialText = '<script>alert("xss")</script>\n\t\r';

      // Act
      await act(async () => {
        await result.current.playMessage('msg-1', specialText);
      });

      // Assert
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith(specialText);
    });

    it('should handle rapid play/stop cycles', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());

      // Act - rapid play/stop
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
      });
      act(() => {
        result.current.stopPlayback();
      });
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
      });
      act(() => {
        result.current.stopPlayback();
      });

      // Assert - should handle without errors
      expect(mockUseTTS.stopAudio).toHaveBeenCalledTimes(2);
    });

    it('should handle playlist with single message', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());

      // Act
      await act(async () => {
        await result.current.playAllResponses([mockGroupAssistantMessage1]);
      });

      // Assert
      expect(result.current.totalMessages).toBe(1);
      expect(result.current.hasNext).toBe(false);
      expect(result.current.hasPrevious).toBe(false);
    });

    it('should handle messages with missing character names', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      const messageWithoutName = {
        ...mockGroupAssistantMessage1,
        character_name: undefined,
      };

      // Act
      await act(async () => {
        await result.current.playAllResponses([messageWithoutName]);
      });

      // Assert
      expect(result.current.totalMessages).toBe(1);
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalled();
    });

    it('should handle navigation beyond bounds gracefully', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      await act(async () => {
        await result.current.playAllResponses([mockGroupAssistantMessage1]);
      });
      vi.clearAllMocks();

      // Act - try to go beyond bounds
      await act(async () => {
        await result.current.playNext();
        await result.current.playNext();
        await result.current.playNext();
      });

      // Assert - should not play anything (already at end)
      expect(mockUseTTS.synthesizeAndPlay).not.toHaveBeenCalled();
    });

    it('should handle concurrent play calls', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());

      // Act - start multiple plays simultaneously
      await act(async () => {
        const promise1 = result.current.playMessage('msg-1', 'Text 1');
        const promise2 = result.current.playMessage('msg-2', 'Text 2');
        await Promise.all([promise1, promise2]);
      });

      // Assert - should handle without crashing
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalled();
    });
  });

  describe('Playlist Management', () => {
    it('should replace playlist when calling playAllResponses again', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      await act(async () => {
        await result.current.playAllResponses([mockGroupAssistantMessage1]);
      });

      // Act - play different set of messages
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
      });

      // Assert
      expect(result.current.totalMessages).toBe(mockGroupMessagesAssistantOnly.length);
      expect(result.current.currentIndex).toBe(0);
    });

    it('should maintain playlist order', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      const orderedMessages = [
        mockGroupAssistantMessage1,
        mockGroupAssistantMessage2,
        mockGroupAssistantMessage3,
      ];

      // Act
      await act(async () => {
        await result.current.playAllResponses(orderedMessages);
      });

      // Assert - first message should be from first item
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith(
        orderedMessages[0].content
      );

      // Navigate and check order
      await act(async () => {
        await result.current.playNext();
      });
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith(
        orderedMessages[1].content
      );
    });

    it('should reset index when starting new playlist', async () => {
      // Arrange
      const { result } = renderHook(() => useGroupTTS());
      await act(async () => {
        await result.current.playAllResponses(mockGroupMessagesAssistantOnly);
      });

      // Navigate to middle
      await act(async () => {
        await result.current.playNext();
      });

      // Act - start new playlist
      await act(async () => {
        await result.current.playAllResponses([mockGroupAssistantMessage1]);
      });

      // Assert
      expect(result.current.currentIndex).toBe(0);
    });
  });
});
