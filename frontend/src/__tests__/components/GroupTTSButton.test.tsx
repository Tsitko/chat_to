/**
 * Unit tests for GroupTTSButton component.
 *
 * Test Coverage:
 * - Component rendering with different states
 * - Play button functionality
 * - Stop button functionality
 * - State-based icon display (play, pause, loading, error)
 * - State-based label display
 * - Button enabled/disabled states
 * - Integration with useGroupTTS hook
 * - Accessibility features
 * - Edge cases (long text, special characters, missing props)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GroupTTSButton } from '../../components/GroupTTSButton';
import * as useGroupTTSModule from '../../hooks/useGroupTTS';

// Mock useGroupTTS hook
vi.mock('../../hooks/useGroupTTS');

describe('GroupTTSButton Component', () => {
  let mockUseGroupTTS: any;

  beforeEach(() => {
    mockUseGroupTTS = {
      state: 'idle',
      currentMessageId: null,
      playMessage: vi.fn(),
      stopPlayback: vi.fn(),
    };

    vi.mocked(useGroupTTSModule.useGroupTTS).mockReturnValue(mockUseGroupTTS);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render button with default props', () => {
      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByTestId('group-tts-button-msg-1')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <GroupTTSButton messageId="msg-1" text="Test message" className="custom-class" />
      );

      const button = screen.getByTestId('group-tts-button-msg-1');
      expect(button).toHaveClass('custom-class');
    });

    it('should always have base tts-button classes', () => {
      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      const button = screen.getByTestId('group-tts-button-msg-1');
      expect(button).toHaveClass('tts-button');
      expect(button).toHaveClass('group-tts-button');
    });
  });

  describe('Idle State', () => {
    it('should show play icon in idle state', () => {
      mockUseGroupTTS.state = 'idle';
      mockUseGroupTTS.currentMessageId = null;

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByText('▶')).toBeInTheDocument();
    });

    it('should show "Play" label in idle state', () => {
      mockUseGroupTTS.state = 'idle';
      mockUseGroupTTS.currentMessageId = null;

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByText('Play')).toBeInTheDocument();
    });

    it('should be enabled in idle state', () => {
      mockUseGroupTTS.state = 'idle';
      mockUseGroupTTS.currentMessageId = null;

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByTestId('group-tts-button-msg-1')).not.toBeDisabled();
    });

    it('should call playMessage when clicked in idle state', async () => {
      mockUseGroupTTS.state = 'idle';
      mockUseGroupTTS.currentMessageId = null;

      render(
        <GroupTTSButton messageId="msg-1" text="Test message" characterName="Hegel" />
      );

      const button = screen.getByTestId('group-tts-button-msg-1');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockUseGroupTTS.playMessage).toHaveBeenCalledWith(
          'msg-1',
          'Test message',
          'Hegel'
        );
      });
    });

    it('should call playMessage without characterName if not provided', async () => {
      mockUseGroupTTS.state = 'idle';
      mockUseGroupTTS.currentMessageId = null;

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      const button = screen.getByTestId('group-tts-button-msg-1');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockUseGroupTTS.playMessage).toHaveBeenCalledWith(
          'msg-1',
          'Test message',
          undefined
        );
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading icon when loading current message', () => {
      mockUseGroupTTS.state = 'loading';
      mockUseGroupTTS.currentMessageId = 'msg-1';

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByText('⏳')).toBeInTheDocument();
    });

    it('should show "Loading..." label when loading', () => {
      mockUseGroupTTS.state = 'loading';
      mockUseGroupTTS.currentMessageId = 'msg-1';

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should be disabled when loading', () => {
      mockUseGroupTTS.state = 'loading';
      mockUseGroupTTS.currentMessageId = 'msg-1';

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByTestId('group-tts-button-msg-1')).toBeDisabled();
    });

    it('should not show loading state for different message', () => {
      mockUseGroupTTS.state = 'loading';
      mockUseGroupTTS.currentMessageId = 'msg-2';

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.queryByText('⏳')).not.toBeInTheDocument();
      expect(screen.getByText('▶')).toBeInTheDocument();
    });
  });

  describe('Playing State', () => {
    it('should show pause icon when playing current message', () => {
      mockUseGroupTTS.state = 'playing';
      mockUseGroupTTS.currentMessageId = 'msg-1';

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByText('⏸')).toBeInTheDocument();
    });

    it('should show "Stop" label when playing', () => {
      mockUseGroupTTS.state = 'playing';
      mockUseGroupTTS.currentMessageId = 'msg-1';

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByText('Stop')).toBeInTheDocument();
    });

    it('should have playing class when playing', () => {
      mockUseGroupTTS.state = 'playing';
      mockUseGroupTTS.currentMessageId = 'msg-1';

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByTestId('group-tts-button-msg-1')).toHaveClass('playing');
    });

    it('should call stopPlayback when clicked while playing', async () => {
      mockUseGroupTTS.state = 'playing';
      mockUseGroupTTS.currentMessageId = 'msg-1';

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      const button = screen.getByTestId('group-tts-button-msg-1');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockUseGroupTTS.stopPlayback).toHaveBeenCalled();
      });
    });

    it('should not show playing state for different message', () => {
      mockUseGroupTTS.state = 'playing';
      mockUseGroupTTS.currentMessageId = 'msg-2';

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.queryByText('⏸')).not.toBeInTheDocument();
      expect(screen.getByText('▶')).toBeInTheDocument();
      expect(screen.getByTestId('group-tts-button-msg-1')).not.toHaveClass('playing');
    });
  });

  describe('Error State', () => {
    it('should show error icon when error on current message', () => {
      mockUseGroupTTS.state = 'error';
      mockUseGroupTTS.currentMessageId = 'msg-1';

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByText('⚠')).toBeInTheDocument();
    });

    it('should show "Error" label when error', () => {
      mockUseGroupTTS.state = 'error';
      mockUseGroupTTS.currentMessageId = 'msg-1';

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should have error class when error', () => {
      mockUseGroupTTS.state = 'error';
      mockUseGroupTTS.currentMessageId = 'msg-1';

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByTestId('group-tts-button-msg-1')).toHaveClass('error');
    });

    it('should allow retry by clicking when in error state', async () => {
      mockUseGroupTTS.state = 'error';
      mockUseGroupTTS.currentMessageId = 'msg-1';

      render(
        <GroupTTSButton messageId="msg-1" text="Test message" characterName="Hegel" />
      );

      const button = screen.getByTestId('group-tts-button-msg-1');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockUseGroupTTS.playMessage).toHaveBeenCalledWith(
          'msg-1',
          'Test message',
          'Hegel'
        );
      });
    });

    it('should not show error state for different message', () => {
      mockUseGroupTTS.state = 'error';
      mockUseGroupTTS.currentMessageId = 'msg-2';

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.queryByText('⚠')).not.toBeInTheDocument();
      expect(screen.getByText('▶')).toBeInTheDocument();
      expect(screen.getByTestId('group-tts-button-msg-1')).not.toHaveClass('error');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for idle state', () => {
      mockUseGroupTTS.state = 'idle';
      mockUseGroupTTS.currentMessageId = null;

      render(
        <GroupTTSButton messageId="msg-1" text="Test message" characterName="Hegel" />
      );

      const button = screen.getByTestId('group-tts-button-msg-1');
      expect(button).toHaveAttribute('aria-label', 'Play audio for Hegel');
    });

    it('should have proper aria-label without character name', () => {
      mockUseGroupTTS.state = 'idle';
      mockUseGroupTTS.currentMessageId = null;

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      const button = screen.getByTestId('group-tts-button-msg-1');
      expect(button).toHaveAttribute('aria-label', 'Play audio for message');
    });

    it('should have proper aria-label when playing', () => {
      mockUseGroupTTS.state = 'playing';
      mockUseGroupTTS.currentMessageId = 'msg-1';

      render(
        <GroupTTSButton messageId="msg-1" text="Test message" characterName="Hegel" />
      );

      const button = screen.getByTestId('group-tts-button-msg-1');
      expect(button).toHaveAttribute('aria-label', 'Stop audio for Hegel');
    });

    it('should have proper aria-label when loading', () => {
      mockUseGroupTTS.state = 'loading';
      mockUseGroupTTS.currentMessageId = 'msg-1';

      render(
        <GroupTTSButton messageId="msg-1" text="Test message" characterName="Hegel" />
      );

      const button = screen.getByTestId('group-tts-button-msg-1');
      expect(button).toHaveAttribute('aria-label', 'Loading... audio for Hegel');
    });

    it('should have title attribute with state description', () => {
      mockUseGroupTTS.state = 'idle';
      mockUseGroupTTS.currentMessageId = null;

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      const button = screen.getByTestId('group-tts-button-msg-1');
      expect(button).toHaveAttribute('title', 'Play');
    });

    it('should have sr-only label for screen readers', () => {
      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      const srLabel = screen.getByText('Play');
      expect(srLabel).toHaveClass('sr-only');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text', () => {
      const longText = 'Lorem ipsum dolor sit amet. '.repeat(100);

      render(<GroupTTSButton messageId="msg-1" text={longText} />);

      expect(screen.getByTestId('group-tts-button-msg-1')).toBeInTheDocument();
    });

    it('should handle text with special characters', () => {
      const specialText = 'Hello! @#$%^&*() Привет мир! 你好世界';

      render(<GroupTTSButton messageId="msg-1" text={specialText} />);

      expect(screen.getByTestId('group-tts-button-msg-1')).toBeInTheDocument();
    });

    it('should handle empty text', () => {
      render(<GroupTTSButton messageId="msg-1" text="" />);

      expect(screen.getByTestId('group-tts-button-msg-1')).toBeInTheDocument();
    });

    it('should handle very long character names', () => {
      const longName = 'A'.repeat(100);

      render(
        <GroupTTSButton messageId="msg-1" text="Test message" characterName={longName} />
      );

      const button = screen.getByTestId('group-tts-button-msg-1');
      expect(button).toHaveAttribute('aria-label', `Play audio for ${longName}`);
    });

    it('should handle rapid clicks', async () => {
      mockUseGroupTTS.state = 'idle';
      mockUseGroupTTS.currentMessageId = null;

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      const button = screen.getByTestId('group-tts-button-msg-1');

      // Rapid clicks
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Should have been called multiple times
      expect(mockUseGroupTTS.playMessage).toHaveBeenCalled();
    });

    it('should handle state changes during playback', () => {
      const { rerender } = render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      // Start playing
      mockUseGroupTTS.state = 'playing';
      mockUseGroupTTS.currentMessageId = 'msg-1';
      rerender(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByText('⏸')).toBeInTheDocument();

      // Finish playing
      mockUseGroupTTS.state = 'idle';
      mockUseGroupTTS.currentMessageId = null;
      rerender(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByText('▶')).toBeInTheDocument();
    });

    it('should handle messageId with special characters', () => {
      const specialId = 'msg-#@!$%^&*()';

      render(<GroupTTSButton messageId={specialId} text="Test message" />);

      expect(screen.getByTestId(`group-tts-button-${specialId}`)).toBeInTheDocument();
    });

    it('should maintain state when other messages are playing', () => {
      mockUseGroupTTS.state = 'playing';
      mockUseGroupTTS.currentMessageId = 'msg-2';

      render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      const button = screen.getByTestId('group-tts-button-msg-1');
      expect(button).not.toHaveClass('playing');
      expect(screen.getByText('▶')).toBeInTheDocument();
    });

    it('should handle transition from loading to playing', () => {
      mockUseGroupTTS.state = 'loading';
      mockUseGroupTTS.currentMessageId = 'msg-1';

      const { rerender } = render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByText('⏳')).toBeInTheDocument();
      expect(screen.getByTestId('group-tts-button-msg-1')).toBeDisabled();

      mockUseGroupTTS.state = 'playing';
      rerender(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByText('⏸')).toBeInTheDocument();
      expect(screen.getByTestId('group-tts-button-msg-1')).not.toBeDisabled();
    });

    it('should handle transition from playing to error', () => {
      mockUseGroupTTS.state = 'playing';
      mockUseGroupTTS.currentMessageId = 'msg-1';

      const { rerender } = render(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByText('⏸')).toBeInTheDocument();

      mockUseGroupTTS.state = 'error';
      rerender(<GroupTTSButton messageId="msg-1" text="Test message" />);

      expect(screen.getByText('⚠')).toBeInTheDocument();
      expect(screen.getByTestId('group-tts-button-msg-1')).toHaveClass('error');
    });
  });

  describe('Multiple Buttons', () => {
    it('should handle multiple buttons independently', () => {
      mockUseGroupTTS.state = 'playing';
      mockUseGroupTTS.currentMessageId = 'msg-2';

      render(
        <>
          <GroupTTSButton messageId="msg-1" text="First message" />
          <GroupTTSButton messageId="msg-2" text="Second message" />
          <GroupTTSButton messageId="msg-3" text="Third message" />
        </>
      );

      // Only msg-2 should show playing state
      expect(screen.getByTestId('group-tts-button-msg-1')).not.toHaveClass('playing');
      expect(screen.getByTestId('group-tts-button-msg-2')).toHaveClass('playing');
      expect(screen.getByTestId('group-tts-button-msg-3')).not.toHaveClass('playing');
    });
  });
});
