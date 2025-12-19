/**
 * TTS Integration Tests.
 *
 * End-to-end tests for the complete TTS workflow covering:
 * - Full flow: button click -> API call -> audio playback
 * - Error handling flow: API error -> error display
 * - Multiple messages with independent TTS buttons
 * - Audio stopping when new audio starts
 * - Complete lifecycle testing
 * - Real component integration (no mocking internal components)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssistantMessage } from '../../components/AssistantMessage';
import { clearAudioCache } from '../../hooks/useTTS';
import type { Emotions } from '../../types/message';

describe('TTS Integration Tests', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let mockAudio: any;
  let audioInstances: any[];

  beforeEach(() => {
    audioInstances = [];

    // Mock fetch for API calls
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Mock Audio constructor
    mockAudio = vi.fn().mockImplementation((src: string) => {
      const audioInstance = {
        src,
        play: vi.fn(async () => {
          // Trigger 'play' event when play() is called
          if (audioInstance._handlers && audioInstance._handlers['play']) {
            // Use setTimeout to simulate async behavior
            setTimeout(() => {
              if (audioInstance._handlers['play']) {
                audioInstance._handlers['play']();
              }
            }, 0);
          }
          return Promise.resolve();
        }),
        pause: vi.fn(),
        get currentTime() {
          return this._currentTime || 0;
        },
        set currentTime(value: number) {
          this._currentTime = value;
        },
        _currentTime: 0,
        addEventListener: vi.fn((event: string, handler: Function) => {
          // Store handlers for manual triggering
          if (!audioInstance._handlers) {
            audioInstance._handlers = {};
          }
          audioInstance._handlers[event] = handler;
        }),
        removeEventListener: vi.fn(),
        _handlers: {} as Record<string, Function>,
      };
      audioInstances.push(audioInstance);
      return audioInstance;
    });

    global.Audio = mockAudio as any;

    vi.clearAllMocks();

    // Clear audio cache to prevent test interference
    clearAudioCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete TTS Flow - Happy Path', () => {
    it('should complete full TTS workflow from button click to audio playback', async () => {
      // Arrange
      const messageContent = 'Hello world, this is a test message';
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/test123.ogg' }),
      });

      render(
        <AssistantMessage
          content={messageContent}
          timestamp="2025-01-10T10:00:00Z"
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId="msg-1"
        />
      );

      // Act - Click TTS button
      const ttsButton = screen.getByTestId('tts-button');
      fireEvent.click(ttsButton);

      // Assert - API call made
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: messageContent }),
        });
      });

      // Assert - Audio object created
      await waitFor(() => {
        expect(mockAudio).toHaveBeenCalledWith('/audio/test123.ogg');
      });

      // Assert - Audio play() called
      await waitFor(() => {
        expect(audioInstances[0].play).toHaveBeenCalled();
      });

      // Assert - Button shows playing state
      await waitFor(() => {
        expect(ttsButton).toHaveClass('tts-button--playing');
      });
    });

    it('should show loading state during synthesis', async () => {
      // Arrange
      let resolveApi: (value: any) => void;
      const apiPromise = new Promise((resolve) => {
        resolveApi = resolve;
      });
      mockFetch.mockReturnValue(apiPromise);

      render(
        <AssistantMessage
          content="Test message"
          timestamp="2025-01-10T10:00:00Z"
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId="msg-1"
        />
      );

      // Act
      const ttsButton = screen.getByTestId('tts-button');
      fireEvent.click(ttsButton);

      // Assert - Loading state
      await waitFor(() => {
        expect(ttsButton).toHaveClass('tts-button--loading');
        expect(ttsButton).toBeDisabled();
      });

      // Cleanup - resolve API call
      resolveApi!({
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/test.ogg' }),
      });
    });

    it('should transition through all states: idle -> loading -> playing -> idle', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/test.ogg' }),
      });

      render(
        <AssistantMessage
          content="Test message"
          timestamp="2025-01-10T10:00:00Z"
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId="msg-1"
        />
      );

      const ttsButton = screen.getByTestId('tts-button');

      // Initial state: idle
      expect(ttsButton).toHaveClass('tts-button--idle');

      // Act - Click to start
      fireEvent.click(ttsButton);

      // State: loading
      await waitFor(() => {
        expect(ttsButton).toHaveClass('tts-button--loading');
      });

      // State: playing (after audio created and play() called)
      await waitFor(() => {
        expect(audioInstances.length).toBeGreaterThan(0);
      });

      // Trigger 'play' event
      const audioInstance = audioInstances[0];
      if (audioInstance._handlers['play']) {
        audioInstance._handlers['play']();
      }

      await waitFor(() => {
        expect(ttsButton).toHaveClass('tts-button--playing');
      });

      // Trigger 'ended' event
      if (audioInstance._handlers['ended']) {
        audioInstance._handlers['ended']();
      }

      // State: back to idle
      await waitFor(() => {
        expect(ttsButton).toHaveClass('tts-button--idle');
      });
    });

    it('should play audio with special characters in text', async () => {
      // Arrange
      const specialText = 'Hello! @#$%^&*() Привет мир! 你好世界';
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/special.ogg' }),
      });

      render(
        <AssistantMessage
          content={specialText}
          timestamp="2025-01-10T10:00:00Z"
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId="msg-1"
        />
      );

      // Act
      const ttsButton = screen.getByTestId('tts-button');
      fireEvent.click(ttsButton);

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: specialText }),
        });
      });
    });
  });

  describe('Error Handling Flow', () => {
    it('should display error when TTS service is unavailable (503)', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ detail: 'Service unavailable' }),
      });

      render(
        <AssistantMessage
          content="Test message"
          timestamp="2025-01-10T10:00:00Z"
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId="msg-1"
        />
      );

      // Act
      const ttsButton = screen.getByTestId('tts-button');
      fireEvent.click(ttsButton);

      // Assert - Error state
      await waitFor(() => {
        expect(ttsButton).toHaveClass('tts-button--error');
      });

      // Assert - Error message displayed
      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(/offline|unavailable/i);
      });
    });

    it('should display error when request times out (504)', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 504,
        json: async () => ({ detail: 'Gateway timeout' }),
      });

      render(
        <AssistantMessage
          content="Long message"
          timestamp="2025-01-10T10:00:00Z"
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId="msg-1"
        />
      );

      // Act
      const ttsButton = screen.getByTestId('tts-button');
      fireEvent.click(ttsButton);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent(/timeout|timed out/i);
      });
    });

    it('should display error on network failure', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      render(
        <AssistantMessage
          content="Test message"
          timestamp="2025-01-10T10:00:00Z"
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId="msg-1"
        />
      );

      // Act
      const ttsButton = screen.getByTestId('tts-button');
      fireEvent.click(ttsButton);

      // Assert
      await waitFor(() => {
        expect(ttsButton).toHaveClass('tts-button--error');
      });

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent(/network/i);
      });
    });

    it('should display error when audio playback fails', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/test.ogg' }),
      });

      // Mock audio play() to fail
      mockAudio.mockImplementation((src: string) => {
        const audioInstance = {
          src,
          play: vi.fn(() => Promise.reject(new Error('Playback failed'))),
          pause: vi.fn(),
          get currentTime() {
            return this._currentTime || 0;
          },
          set currentTime(value: number) {
            this._currentTime = value;
          },
          _currentTime: 0,
          addEventListener: vi.fn((event: string, handler: Function) => {
            if (!audioInstance._handlers) {
              audioInstance._handlers = {};
            }
            audioInstance._handlers[event] = handler;
          }),
          removeEventListener: vi.fn(),
          _handlers: {} as Record<string, Function>,
        };
        audioInstances.push(audioInstance);
        return audioInstance;
      });

      render(
        <AssistantMessage
          content="Test message"
          timestamp="2025-01-10T10:00:00Z"
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId="msg-1"
        />
      );

      // Act
      const ttsButton = screen.getByTestId('tts-button');
      fireEvent.click(ttsButton);

      // Assert
      await waitFor(() => {
        expect(ttsButton).toHaveClass('tts-button--error');
      });
    });

    it('should allow retry after error', async () => {
      // Arrange - First call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ detail: 'Service unavailable' }),
      });

      render(
        <AssistantMessage
          content="Test message"
          timestamp="2025-01-10T10:00:00Z"
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId="msg-1"
        />
      );

      const ttsButton = screen.getByTestId('tts-button');
      fireEvent.click(ttsButton);

      await waitFor(() => {
        expect(ttsButton).toHaveClass('tts-button--error');
      });

      // Act - Retry with successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/test.ogg' }),
      });

      fireEvent.click(ttsButton);

      // Assert - Should transition back to loading/playing
      await waitFor(() => {
        expect(ttsButton).toHaveClass('tts-button--loading');
      });
    });
  });

  describe('Multiple Messages - Independent TTS Buttons', () => {
    it('should render independent TTS button for each message', () => {
      // Arrange & Act
      const { container } = render(
        <>
          <AssistantMessage
            content="First message"
            timestamp="2025-01-10T10:00:00Z"
            characterName="Hegel"
            avatarUrl="/api/characters/char-1/avatar"
            messageId="msg-1"
          />
          <AssistantMessage
            content="Second message"
            timestamp="2025-01-10T10:01:00Z"
            characterName="Hegel"
            avatarUrl="/api/characters/char-1/avatar"
            messageId="msg-2"
          />
          <AssistantMessage
            content="Third message"
            timestamp="2025-01-10T10:02:00Z"
            characterName="Hegel"
            avatarUrl="/api/characters/char-1/avatar"
            messageId="msg-3"
          />
        </>
      );

      // Assert
      const ttsButtons = screen.getAllByTestId('tts-button');
      expect(ttsButtons).toHaveLength(3);
    });

    it('should handle TTS independently for each message', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/test.ogg' }),
      });

      render(
        <>
          <AssistantMessage
            content="First message"
            timestamp="2025-01-10T10:00:00Z"
            characterName="Hegel"
            avatarUrl="/api/characters/char-1/avatar"
            messageId="msg-1"
          />
          <AssistantMessage
            content="Second message"
            timestamp="2025-01-10T10:01:00Z"
            characterName="Hegel"
            avatarUrl="/api/characters/char-1/avatar"
            messageId="msg-2"
          />
        </>
      );

      // Act - Click first button
      const ttsButtons = screen.getAllByTestId('tts-button');
      fireEvent.click(ttsButtons[0]);

      // Assert - First button processes
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'First message' }),
        });
      });

      // Act - Click second button
      fireEvent.click(ttsButtons[1]);

      // Assert - Second button processes independently
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'Second message' }),
        });
      });
    });

    it('should show different states for different message TTS buttons', async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ audio_path: '/audio/test1.ogg' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ detail: 'Service unavailable' }),
        });

      render(
        <>
          <AssistantMessage
            content="First message"
            timestamp="2025-01-10T10:00:00Z"
            characterName="Hegel"
            avatarUrl="/api/characters/char-1/avatar"
            messageId="msg-1"
          />
          <AssistantMessage
            content="Second message"
            timestamp="2025-01-10T10:01:00Z"
            characterName="Hegel"
            avatarUrl="/api/characters/char-1/avatar"
            messageId="msg-2"
          />
        </>
      );

      const ttsButtons = screen.getAllByTestId('tts-button');

      // Act - Click first (success)
      fireEvent.click(ttsButtons[0]);
      await waitFor(() => {
        expect(ttsButtons[0]).toHaveClass('tts-button--loading');
      });

      // Act - Click second (error)
      fireEvent.click(ttsButtons[1]);
      await waitFor(() => {
        expect(ttsButtons[1]).toHaveClass('tts-button--error');
      });
    });
  });

  describe('Audio Stop Functionality', () => {
    it('should stop audio when stop button clicked', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/test.ogg' }),
      });

      render(
        <AssistantMessage
          content="Test message"
          timestamp="2025-01-10T10:00:00Z"
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId="msg-1"
        />
      );

      const ttsButton = screen.getByTestId('tts-button');
      
      // Start playback
      fireEvent.click(ttsButton);
      
      await waitFor(() => {
        expect(audioInstances.length).toBeGreaterThan(0);
      });

      const audioInstance = audioInstances[0];
      
      // Trigger play event to enter playing state
      if (audioInstance._handlers['play']) {
        audioInstance._handlers['play']();
      }

      await waitFor(() => {
        expect(ttsButton).toHaveClass('tts-button--playing');
      });

      // Act - Click to stop
      fireEvent.click(ttsButton);

      // Assert
      await waitFor(() => {
        expect(audioInstance.pause).toHaveBeenCalled();
        expect(audioInstance.currentTime).toBe(0);
      });
    });

    it('should allow multiple independent audio instances', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/test.ogg' }),
      });

      render(
        <>
          <AssistantMessage
            content="First message"
            timestamp="2025-01-10T10:00:00Z"
            characterName="Hegel"
            avatarUrl="/api/characters/char-1/avatar"
            messageId="msg-1"
          />
          <AssistantMessage
            content="Second message"
            timestamp="2025-01-10T10:01:00Z"
            characterName="Hegel"
            avatarUrl="/api/characters/char-1/avatar"
            messageId="msg-2"
          />
        </>
      );

      const ttsButtons = screen.getAllByTestId('tts-button');

      // Start first audio
      fireEvent.click(ttsButtons[0]);

      await waitFor(() => {
        expect(audioInstances.length).toBe(1);
      });

      // Act - Start second audio
      fireEvent.click(ttsButtons[1]);

      // Assert - Second audio created (both can exist independently)
      await waitFor(() => {
        expect(audioInstances.length).toBe(2);
      });

      // Each component manages its own audio independently
      expect(audioInstances[0]).toBeDefined();
      expect(audioInstances[1]).toBeDefined();
    });
  });

  describe('Integration with Emotions', () => {
    it('should work with emotion display', async () => {
      // Arrange
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/test.ogg' }),
      });

      render(
        <AssistantMessage
          content="Test message with emotions"
          timestamp="2025-01-10T10:00:00Z"
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId="msg-1"
          emotions={emotions}
        />
      );

      // Assert - Both elements present
      expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
      expect(screen.getByTestId('tts-button')).toBeInTheDocument();

      // Act
      const ttsButton = screen.getByTestId('tts-button');
      fireEvent.click(ttsButton);

      // Assert - TTS works with emotions
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Integration with Markdown Content', () => {
    it('should send raw markdown to TTS (not rendered HTML)', async () => {
      // Arrange
      const markdownContent = '# Heading\n\nThis is **bold** and *italic* text.\n\n- List item 1\n- List item 2';
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/test.ogg' }),
      });

      render(
        <AssistantMessage
          content={markdownContent}
          timestamp="2025-01-10T10:00:00Z"
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId="msg-1"
        />
      );

      // Act
      const ttsButton = screen.getByTestId('tts-button');
      fireEvent.click(ttsButton);

      // Assert - Raw markdown sent (not HTML)
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: markdownContent }),
        });
      });
    });
  });

  describe('Edge Cases and Stress Tests', () => {
    it('should handle rapid clicking on TTS button', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/test.ogg' }),
      });

      render(
        <AssistantMessage
          content="Test message"
          timestamp="2025-01-10T10:00:00Z"
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId="msg-1"
        />
      );

      // Act - Rapid clicking
      const ttsButton = screen.getByTestId('tts-button');
      fireEvent.click(ttsButton);
      fireEvent.click(ttsButton);
      fireEvent.click(ttsButton);
      fireEvent.click(ttsButton);
      fireEvent.click(ttsButton);

      // Assert - Should not crash
      expect(ttsButton).toBeInTheDocument();
    });

    it('should handle very long message content', async () => {
      // Arrange
      const longContent = 'Lorem ipsum dolor sit amet. '.repeat(500);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/long.ogg' }),
      });

      render(
        <AssistantMessage
          content={longContent}
          timestamp="2025-01-10T10:00:00Z"
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId="msg-1"
        />
      );

      // Act
      const ttsButton = screen.getByTestId('tts-button');
      fireEvent.click(ttsButton);

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/tts', expect.objectContaining({
          body: JSON.stringify({ text: longContent }),
        }));
      });
    });

    it('should handle empty message content', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Text cannot be empty' }),
      });

      render(
        <AssistantMessage
          content=""
          timestamp="2025-01-10T10:00:00Z"
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId="msg-1"
        />
      );

      // Act
      const ttsButton = screen.getByTestId('tts-button');
      fireEvent.click(ttsButton);

      // Assert - Should handle error gracefully
      await waitFor(() => {
        expect(ttsButton).toHaveClass('tts-button--error');
      });
    });

    it('should cleanup properly on component unmount', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/test.ogg' }),
      });

      const { unmount } = render(
        <AssistantMessage
          content="Test message"
          timestamp="2025-01-10T10:00:00Z"
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId="msg-1"
        />
      );

      const ttsButton = screen.getByTestId('tts-button');
      fireEvent.click(ttsButton);

      await waitFor(() => {
        expect(audioInstances.length).toBeGreaterThan(0);
      });

      // Act - Unmount during playback
      unmount();

      // Assert - Should cleanup audio
      const audioInstance = audioInstances[0];
      expect(audioInstance.pause).toHaveBeenCalled();
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility throughout TTS workflow', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ audio_path: '/audio/test.ogg' }),
      });

      render(
        <AssistantMessage
          content="Test message"
          timestamp="2025-01-10T10:00:00Z"
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId="msg-1"
        />
      );

      const ttsButton = screen.getByTestId('tts-button');

      // Initial state
      expect(ttsButton).toHaveAttribute('aria-label');
      expect(ttsButton).toHaveAttribute('aria-busy', 'false');

      // Act
      fireEvent.click(ttsButton);

      // Loading state
      await waitFor(() => {
        expect(ttsButton).toHaveAttribute('aria-busy', 'true');
      });
    });

    it('should announce errors to screen readers', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ detail: 'Service unavailable' }),
      });

      render(
        <AssistantMessage
          content="Test message"
          timestamp="2025-01-10T10:00:00Z"
          characterName="Hegel"
          avatarUrl="/api/characters/char-1/avatar"
          messageId="msg-1"
        />
      );

      // Act
      const ttsButton = screen.getByTestId('tts-button');
      fireEvent.click(ttsButton);

      // Assert
      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toHaveAttribute('aria-live', 'polite');
      });
    });
  });
});
