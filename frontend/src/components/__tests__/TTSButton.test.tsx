/**
 * TTSButton Component Tests.
 *
 * Comprehensive tests for TTSButton component covering:
 * - Rendering in different states (idle, loading, playing, error)
 * - Button interactions
 * - Icon display
 * - Disabled states
 * - Error message display
 * - Accessibility attributes
 * - Edge cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TTSButton } from '../TTSButton';
import { useTTS } from '../../hooks/useTTS';
import type { TTSError } from '../../types/tts';

// Mock the useTTS hook
vi.mock('../../hooks/useTTS');

describe('TTSButton Component', () => {
  const mockUseTTS = {
    state: 'idle' as const,
    error: null as TTSError | null,
    synthesizeAndPlay: vi.fn(),
    stopAudio: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTTS).mockReturnValue(mockUseTTS);
  });

  describe('Rendering - Idle State', () => {
    it('should render button in idle state', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).toBeInTheDocument();
    });

    it('should not be disabled in idle state', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).not.toBeDisabled();
    });

    it('should have idle CSS class', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).toHaveClass('tts-button--idle');
    });

    it('should have base tts-button CSS class', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).toHaveClass('tts-button');
    });

    it('should have correct aria-label in idle state', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).toHaveAttribute('aria-label', 'Play text-to-speech');
    });

    it('should not have aria-busy in idle state', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).toHaveAttribute('aria-busy', 'false');
    });

    it('should not show error message in idle state', () => {
      render(<TTSButton text="Hello world" />);
      
      const errorElement = screen.queryByRole('alert');
      expect(errorElement).not.toBeInTheDocument();
    });
  });

  describe('Rendering - Loading State', () => {
    beforeEach(() => {
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'loading',
      });
    });

    it('should be disabled in loading state', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).toBeDisabled();
    });

    it('should have loading CSS class', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).toHaveClass('tts-button--loading');
    });

    it('should have aria-busy=true in loading state', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should have correct aria-label in loading state', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).toHaveAttribute('aria-label', 'Synthesizing speech...');
    });

    it('should show spinner icon in loading state', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Rendering - Playing State', () => {
    beforeEach(() => {
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'playing',
      });
    });

    it('should not be disabled in playing state', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).not.toBeDisabled();
    });

    it('should have playing CSS class', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).toHaveClass('tts-button--playing');
    });

    it('should have correct aria-label in playing state', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).toHaveAttribute('aria-label', 'Stop audio playback');
    });

    it('should show pause/stop icon in playing state', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Rendering - Error State', () => {
    const mockError: TTSError = {
      type: 'service',
      message: 'TTS service is offline',
    };

    beforeEach(() => {
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'error',
        error: mockError,
      });
    });

    it('should not be disabled in error state', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).not.toBeDisabled();
    });

    it('should have error CSS class', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).toHaveClass('tts-button--error');
    });

    it('should show error message', () => {
      render(<TTSButton text="Hello world" />);
      
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent('TTS service is offline');
    });

    it('should have error icon', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('should have aria-live on error message', () => {
      render(<TTSButton text="Hello world" />);
      
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should show different error messages based on error type', () => {
      const networkError: TTSError = {
        type: 'network',
        message: 'Network error occurred',
      };
      
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'error',
        error: networkError,
      });

      render(<TTSButton text="Hello world" />);
      
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveTextContent('Network error occurred');
    });
  });

  describe('Button Interactions - Idle State', () => {
    it('should call synthesizeAndPlay when clicked in idle state', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      fireEvent.click(button);
      
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith('Hello world');
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledTimes(1);
    });

    it('should pass correct text to synthesizeAndPlay', () => {
      const testText = 'This is a test message with special characters @#$%';
      render(<TTSButton text={testText} />);
      
      const button = screen.getByTestId('tts-button');
      fireEvent.click(button);
      
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith(testText);
    });

    it('should handle multiple clicks', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledTimes(3);
    });

    it('should be keyboard accessible', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      fireEvent.keyDown(button, { key: 'Enter' });
      
      // Button should handle Enter key by default HTML behavior
      expect(button).toBeInTheDocument();
    });
  });

  describe('Button Interactions - Playing State', () => {
    beforeEach(() => {
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'playing',
      });
    });

    it('should call stopAudio when clicked in playing state', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      fireEvent.click(button);
      
      expect(mockUseTTS.stopAudio).toHaveBeenCalled();
      expect(mockUseTTS.synthesizeAndPlay).not.toHaveBeenCalled();
    });

    it('should toggle between play and stop', () => {
      // Reset mock to idle state for this test
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'idle',
      });

      const { rerender } = render(<TTSButton text="Hello world" />);

      // Start in idle, click to play
      const button = screen.getByTestId('tts-button');
      fireEvent.click(button);
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalled();

      // Now in playing state, click to stop
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'playing',
      });
      rerender(<TTSButton text="Hello world" />);
      fireEvent.click(button);
      expect(mockUseTTS.stopAudio).toHaveBeenCalled();
    });
  });

  describe('Button Interactions - Loading State', () => {
    beforeEach(() => {
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'loading',
      });
    });

    it('should not call synthesizeAndPlay when clicked in loading state', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      fireEvent.click(button);
      
      expect(mockUseTTS.synthesizeAndPlay).not.toHaveBeenCalled();
    });

    it('should not call stopAudio when clicked in loading state', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      fireEvent.click(button);
      
      expect(mockUseTTS.stopAudio).not.toHaveBeenCalled();
    });
  });

  describe('Button Interactions - Error State', () => {
    const mockError: TTSError = {
      type: 'service',
      message: 'TTS service is offline',
    };

    beforeEach(() => {
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'error',
        error: mockError,
      });
    });

    it('should retry synthesis when clicked in error state', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      fireEvent.click(button);
      
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith('Hello world');
    });

    it('should allow retrying after error', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledTimes(2);
    });
  });

  describe('Disabled Prop', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<TTSButton text="Hello world" disabled={true} />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).toBeDisabled();
    });

    it('should not call synthesizeAndPlay when disabled', () => {
      render(<TTSButton text="Hello world" disabled={true} />);
      
      const button = screen.getByTestId('tts-button');
      fireEvent.click(button);
      
      expect(mockUseTTS.synthesizeAndPlay).not.toHaveBeenCalled();
    });

    it('should be disabled when both loading and disabled prop', () => {
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'loading',
      });

      render(<TTSButton text="Hello world" disabled={true} />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).toBeDisabled();
    });

    it('should not be disabled when disabled prop is false', () => {
      render(<TTSButton text="Hello world" disabled={false} />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).not.toBeDisabled();
    });

    it('should work normally when disabled prop is undefined', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).not.toBeDisabled();
    });
  });

  describe('Text Prop Variations', () => {
    it('should handle empty text', () => {
      render(<TTSButton text="" />);
      
      const button = screen.getByTestId('tts-button');
      fireEvent.click(button);
      
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith('');
    });

    it('should handle very long text', () => {
      const longText = 'Lorem ipsum '.repeat(1000);
      render(<TTSButton text={longText} />);
      
      const button = screen.getByTestId('tts-button');
      fireEvent.click(button);
      
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith(longText);
    });

    it('should handle text with special characters', () => {
      const specialText = 'Hello! @#$%^&*() <script>alert("xss")</script>';
      render(<TTSButton text={specialText} />);
      
      const button = screen.getByTestId('tts-button');
      fireEvent.click(button);
      
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith(specialText);
    });

    it('should handle text with unicode characters', () => {
      const unicodeText = 'Привет мир! 你好世界';
      render(<TTSButton text={unicodeText} />);
      
      const button = screen.getByTestId('tts-button');
      fireEvent.click(button);
      
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith(unicodeText);
    });

    it('should handle text with newlines', () => {
      const multilineText = 'Line 1\nLine 2\nLine 3';
      render(<TTSButton text={multilineText} />);
      
      const button = screen.getByTestId('tts-button');
      fireEvent.click(button);
      
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith(multilineText);
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have appropriate aria-label for screen readers', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button).toHaveAttribute('aria-label');
      expect(button.getAttribute('aria-label')).toBeTruthy();
    });

    it('should update aria-label based on state', () => {
      const { rerender } = render(<TTSButton text="Hello world" />);
      
      let button = screen.getByTestId('tts-button');
      expect(button).toHaveAttribute('aria-label', 'Play text-to-speech');
      
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'loading',
      });
      rerender(<TTSButton text="Hello world" />);
      button = screen.getByTestId('tts-button');
      expect(button).toHaveAttribute('aria-label', 'Synthesizing speech...');
      
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'playing',
      });
      rerender(<TTSButton text="Hello world" />);
      button = screen.getByTestId('tts-button');
      expect(button).toHaveAttribute('aria-label', 'Stop audio playback');
    });

    it('should be keyboard navigable', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('should have visible focus indicator', () => {
      render(<TTSButton text="Hello world" />);
      
      const button = screen.getByTestId('tts-button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should announce errors to screen readers', () => {
      const mockError: TTSError = {
        type: 'service',
        message: 'TTS service is offline',
      };
      
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'error',
        error: mockError,
      });

      render(<TTSButton text="Hello world" />);
      
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid re-renders', () => {
      const { rerender } = render(<TTSButton text="Text 1" />);
      
      for (let i = 2; i <= 10; i++) {
        rerender(<TTSButton text={`Text ${i}`} />);
      }
      
      expect(screen.getByTestId('tts-button')).toBeInTheDocument();
    });

    it('should handle text prop changes', () => {
      const { rerender } = render(<TTSButton text="Original text" />);
      
      const button = screen.getByTestId('tts-button');
      fireEvent.click(button);
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith('Original text');
      
      rerender(<TTSButton text="New text" />);
      fireEvent.click(button);
      expect(mockUseTTS.synthesizeAndPlay).toHaveBeenCalledWith('New text');
    });

    it('should handle state transitions correctly', () => {
      const { rerender } = render(<TTSButton text="Hello" />);
      
      // Idle -> Loading
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'loading',
      });
      rerender(<TTSButton text="Hello" />);
      expect(screen.getByTestId('tts-button')).toHaveClass('tts-button--loading');
      
      // Loading -> Playing
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'playing',
      });
      rerender(<TTSButton text="Hello" />);
      expect(screen.getByTestId('tts-button')).toHaveClass('tts-button--playing');
      
      // Playing -> Idle
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'idle',
      });
      rerender(<TTSButton text="Hello" />);
      expect(screen.getByTestId('tts-button')).toHaveClass('tts-button--idle');
    });

    it('should handle error clearing on retry', () => {
      const mockError: TTSError = {
        type: 'service',
        message: 'TTS service is offline',
      };
      
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'error',
        error: mockError,
      });

      const { rerender } = render(<TTSButton text="Hello" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      // Retry clears error
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'loading',
        error: null,
      });
      rerender(<TTSButton text="Hello" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should not crash when error object is null', () => {
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'error',
        error: null,
      });

      expect(() => render(<TTSButton text="Hello" />)).not.toThrow();
    });
  });

  describe('Component Container', () => {
    it('should render tts-button-container', () => {
      const { container } = render(<TTSButton text="Hello world" />);
      
      const containerElement = container.querySelector('.tts-button-container');
      expect(containerElement).toBeInTheDocument();
    });

    it('should contain button and optionally error message', () => {
      const mockError: TTSError = {
        type: 'service',
        message: 'TTS service is offline',
      };
      
      vi.mocked(useTTS).mockReturnValue({
        ...mockUseTTS,
        state: 'error',
        error: mockError,
      });

      const { container } = render(<TTSButton text="Hello world" />);
      
      const containerElement = container.querySelector('.tts-button-container');
      expect(containerElement?.children.length).toBeGreaterThanOrEqual(1);
    });
  });
});
