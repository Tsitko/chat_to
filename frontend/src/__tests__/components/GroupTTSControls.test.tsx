/**
 * Unit tests for GroupTTSControls component.
 *
 * Test Coverage:
 * - Component rendering with different states
 * - Play All button functionality
 * - Stop All button functionality
 * - Previous/Next navigation buttons
 * - Now Playing display
 * - Status display (idle, playing, error)
 * - Button states (enabled, disabled)
 * - Empty message handling
 * - Integration with useGroupTTS hook
 * - Accessibility features
 * - Edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GroupTTSControls } from '../../components/GroupTTSControls';
import * as useGroupTTSModule from '../../hooks/useGroupTTS';
import type { GroupMessage } from '../../types/group';
import type { TTSError } from '../../types/tts';

// Mock useGroupTTS hook
vi.mock('../../hooks/useGroupTTS');

describe('GroupTTSControls Component', () => {
  let mockUseGroupTTS: any;

  beforeEach(() => {
    mockUseGroupTTS = {
      state: 'idle',
      error: null,
      currentMessageId: null,
      currentIndex: -1,
      totalMessages: 0,
      hasNext: false,
      hasPrevious: false,
      playAllResponses: vi.fn(),
      stopPlayback: vi.fn(),
      playNext: vi.fn(),
      playPrevious: vi.fn(),
    };

    vi.mocked(useGroupTTSModule.useGroupTTS).mockReturnValue(mockUseGroupTTS);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    const mockMessages: GroupMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Response 1',
        created_at: '2025-01-01T00:00:01Z',
        character_name: 'Hegel',
      },
      {
        id: 'msg-3',
        role: 'assistant',
        content: 'Response 2',
        created_at: '2025-01-01T00:00:02Z',
        character_name: 'Kant',
      },
    ];

    it('should render controls when assistant messages exist', () => {
      render(<GroupTTSControls messages={mockMessages} />);

      expect(screen.getByTestId('group-tts-controls')).toBeInTheDocument();
    });

    it('should not render when no assistant messages', () => {
      const userOnlyMessages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      const { container } = render(<GroupTTSControls messages={userOnlyMessages} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render when messages array is empty', () => {
      const { container } = render(<GroupTTSControls messages={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render all control buttons', () => {
      render(<GroupTTSControls messages={mockMessages} />);

      expect(screen.getByTestId('group-tts-play-all')).toBeInTheDocument();
      expect(screen.getByTestId('group-tts-previous')).toBeInTheDocument();
      expect(screen.getByTestId('group-tts-next')).toBeInTheDocument();
    });

    it('should render status display', () => {
      render(<GroupTTSControls messages={mockMessages} />);

      expect(screen.getByTestId('group-tts-status')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<GroupTTSControls messages={mockMessages} className="custom-class" />);

      expect(screen.getByTestId('group-tts-controls')).toHaveClass('custom-class');
    });
  });

  describe('Play All Button', () => {
    const mockMessages: GroupMessage[] = [
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'Response 1',
        created_at: '2025-01-01T00:00:00Z',
        character_name: 'Hegel',
      },
    ];

    it('should call playAllResponses when clicked in idle state', async () => {
      mockUseGroupTTS.state = 'idle';

      render(<GroupTTSControls messages={mockMessages} />);

      const playAllButton = screen.getByTestId('group-tts-play-all');
      fireEvent.click(playAllButton);

      await waitFor(() => {
        expect(mockUseGroupTTS.playAllResponses).toHaveBeenCalledWith(mockMessages);
      });
    });

    it('should call stopPlayback when clicked while playing', async () => {
      mockUseGroupTTS.state = 'playing';

      render(<GroupTTSControls messages={mockMessages} />);

      const playAllButton = screen.getByTestId('group-tts-play-all');
      fireEvent.click(playAllButton);

      await waitFor(() => {
        expect(mockUseGroupTTS.stopPlayback).toHaveBeenCalled();
      });
    });

    it('should show "Play All" text in idle state', () => {
      mockUseGroupTTS.state = 'idle';

      render(<GroupTTSControls messages={mockMessages} />);

      expect(screen.getByText(/play all/i)).toBeInTheDocument();
    });

    it('should show "Stop All" text while playing', () => {
      mockUseGroupTTS.state = 'playing';

      render(<GroupTTSControls messages={mockMessages} />);

      expect(screen.getByText(/stop all/i)).toBeInTheDocument();
    });

    it('should show "Loading..." text while loading', () => {
      mockUseGroupTTS.state = 'loading';

      render(<GroupTTSControls messages={mockMessages} />);

      expect(screen.getByText(/loading\.\.\./i)).toBeInTheDocument();
    });

    it('should be disabled while loading', () => {
      mockUseGroupTTS.state = 'loading';

      render(<GroupTTSControls messages={mockMessages} />);

      const playAllButton = screen.getByTestId('group-tts-play-all');
      expect(playAllButton).toBeDisabled();
    });

    it('should have playing class when playing', () => {
      mockUseGroupTTS.state = 'playing';

      render(<GroupTTSControls messages={mockMessages} />);

      const playAllButton = screen.getByTestId('group-tts-play-all');
      expect(playAllButton).toHaveClass('playing');
    });
  });

  describe('Navigation Buttons', () => {
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
    ];

    it('should call playPrevious when previous button clicked', async () => {
      mockUseGroupTTS.hasPrevious = true;

      render(<GroupTTSControls messages={mockMessages} />);

      const previousButton = screen.getByTestId('group-tts-previous');
      fireEvent.click(previousButton);

      await waitFor(() => {
        expect(mockUseGroupTTS.playPrevious).toHaveBeenCalled();
      });
    });

    it('should call playNext when next button clicked', async () => {
      mockUseGroupTTS.hasNext = true;

      render(<GroupTTSControls messages={mockMessages} />);

      const nextButton = screen.getByTestId('group-tts-next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(mockUseGroupTTS.playNext).toHaveBeenCalled();
      });
    });

    it('should disable previous button when hasPrevious is false', () => {
      mockUseGroupTTS.hasPrevious = false;

      render(<GroupTTSControls messages={mockMessages} />);

      const previousButton = screen.getByTestId('group-tts-previous');
      expect(previousButton).toBeDisabled();
    });

    it('should disable next button when hasNext is false', () => {
      mockUseGroupTTS.hasNext = false;

      render(<GroupTTSControls messages={mockMessages} />);

      const nextButton = screen.getByTestId('group-tts-next');
      expect(nextButton).toBeDisabled();
    });

    it('should enable previous button when hasPrevious is true', () => {
      mockUseGroupTTS.hasPrevious = true;

      render(<GroupTTSControls messages={mockMessages} />);

      const previousButton = screen.getByTestId('group-tts-previous');
      expect(previousButton).not.toBeDisabled();
    });

    it('should enable next button when hasNext is true', () => {
      mockUseGroupTTS.hasNext = true;

      render(<GroupTTSControls messages={mockMessages} />);

      const nextButton = screen.getByTestId('group-tts-next');
      expect(nextButton).not.toBeDisabled();
    });

    it('should disable navigation buttons while loading', () => {
      mockUseGroupTTS.state = 'loading';
      mockUseGroupTTS.hasNext = true;
      mockUseGroupTTS.hasPrevious = true;

      render(<GroupTTSControls messages={mockMessages} />);

      expect(screen.getByTestId('group-tts-previous')).toBeDisabled();
      expect(screen.getByTestId('group-tts-next')).toBeDisabled();
    });
  });

  describe('Status Display', () => {
    const mockMessages: GroupMessage[] = [
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'Response 1',
        created_at: '2025-01-01T00:00:00Z',
        character_name: 'Hegel',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Response 2',
        created_at: '2025-01-01T00:00:01Z',
        character_name: 'Kant',
      },
      {
        id: 'msg-3',
        role: 'assistant',
        content: 'Response 3',
        created_at: '2025-01-01T00:00:02Z',
        character_name: 'Nietzsche',
      },
    ];

    it('should show now playing info when playing', () => {
      mockUseGroupTTS.state = 'playing';
      mockUseGroupTTS.currentMessageId = 'msg-2';
      mockUseGroupTTS.currentIndex = 1;
      mockUseGroupTTS.totalMessages = 3;

      render(<GroupTTSControls messages={mockMessages} />);

      expect(screen.getByText(/now playing:/i)).toBeInTheDocument();
      expect(screen.getByText('Kant')).toBeInTheDocument();
      expect(screen.getByText('(2 of 3)')).toBeInTheDocument();
    });

    it('should not show now playing when idle', () => {
      mockUseGroupTTS.state = 'idle';

      render(<GroupTTSControls messages={mockMessages} />);

      expect(screen.queryByText(/now playing:/i)).not.toBeInTheDocument();
    });

    it('should show error message when error state', () => {
      mockUseGroupTTS.state = 'error';
      mockUseGroupTTS.error = {
        name: 'TTSError',
        type: 'service',
        message: 'Service unavailable',
      } as TTSError;

      render(<GroupTTSControls messages={mockMessages} />);

      expect(screen.getByTestId('group-tts-error')).toBeInTheDocument();
      expect(screen.getByText(/error: service unavailable/i)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should show idle status with response count', () => {
      mockUseGroupTTS.state = 'idle';
      mockUseGroupTTS.totalMessages = 3;

      render(<GroupTTSControls messages={mockMessages} />);

      expect(screen.getByText(/3 responses available/i)).toBeInTheDocument();
    });

    it('should show singular "response" for single message', () => {
      mockUseGroupTTS.state = 'idle';
      mockUseGroupTTS.totalMessages = 1;

      const singleMessage: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Response',
          created_at: '2025-01-01T00:00:00Z',
          character_name: 'Hegel',
        },
      ];

      render(<GroupTTSControls messages={singleMessage} />);

      expect(screen.getByText(/1 response available/i)).toBeInTheDocument();
    });

    it('should show plural "responses" for multiple messages', () => {
      mockUseGroupTTS.state = 'idle';
      mockUseGroupTTS.totalMessages = 2;

      render(<GroupTTSControls messages={mockMessages} />);

      expect(screen.getByText(/2 responses available/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    const mockMessages: GroupMessage[] = [
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'Response',
        created_at: '2025-01-01T00:00:00Z',
        character_name: 'Hegel',
      },
    ];

    it('should have proper ARIA labels for play/stop button', () => {
      mockUseGroupTTS.state = 'idle';

      render(<GroupTTSControls messages={mockMessages} />);

      const playAllButton = screen.getByTestId('group-tts-play-all');
      expect(playAllButton).toHaveAttribute('aria-label', 'Play all responses');
    });

    it('should update ARIA label when playing', () => {
      mockUseGroupTTS.state = 'playing';

      render(<GroupTTSControls messages={mockMessages} />);

      const playAllButton = screen.getByTestId('group-tts-play-all');
      expect(playAllButton).toHaveAttribute('aria-label', 'Stop all responses');
    });

    it('should have ARIA labels for navigation buttons', () => {
      render(<GroupTTSControls messages={mockMessages} />);

      expect(screen.getByTestId('group-tts-previous')).toHaveAttribute(
        'aria-label',
        'Previous response'
      );
      expect(screen.getByTestId('group-tts-next')).toHaveAttribute('aria-label', 'Next response');
    });

    it('should have role="group" on controls container', () => {
      render(<GroupTTSControls messages={mockMessages} />);

      const controls = screen.getByTestId('group-tts-controls');
      expect(controls).toHaveAttribute('role', 'group');
      expect(controls).toHaveAttribute('aria-label', 'Group TTS playback controls');
    });

    it('should have role="alert" on error message', () => {
      mockUseGroupTTS.state = 'error';
      mockUseGroupTTS.error = {
        name: 'TTSError',
        type: 'service',
        message: 'Error message',
      } as TTSError;

      render(<GroupTTSControls messages={mockMessages} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle messages without character_name', () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Response',
          created_at: '2025-01-01T00:00:00Z',
          // No character_name
        },
      ];

      mockUseGroupTTS.state = 'playing';
      mockUseGroupTTS.currentMessageId = 'msg-1';
      mockUseGroupTTS.currentIndex = 0;
      mockUseGroupTTS.totalMessages = 1;

      render(<GroupTTSControls messages={messages} />);

      // Should render without crashing
      expect(screen.getByTestId('group-tts-controls')).toBeInTheDocument();
    });

    it('should handle currentMessageId not found in messages', () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Response',
          created_at: '2025-01-01T00:00:00Z',
          character_name: 'Hegel',
        },
      ];

      mockUseGroupTTS.state = 'playing';
      mockUseGroupTTS.currentMessageId = 'non-existent';
      mockUseGroupTTS.currentIndex = 0;
      mockUseGroupTTS.totalMessages = 1;

      render(<GroupTTSControls messages={messages} />);

      // Should not show "now playing" if message not found
      expect(screen.queryByText(/now playing:/i)).not.toBeInTheDocument();
    });

    it('should handle mixed user and assistant messages', () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'User message',
          created_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Assistant response',
          created_at: '2025-01-01T00:00:01Z',
          character_name: 'Hegel',
        },
        {
          id: 'msg-3',
          role: 'user',
          content: 'Another user message',
          created_at: '2025-01-01T00:00:02Z',
        },
      ];

      render(<GroupTTSControls messages={messages} />);

      // Should render controls (only one assistant message)
      expect(screen.getByTestId('group-tts-controls')).toBeInTheDocument();
    });

    it('should handle rapid button clicks', async () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Response',
          created_at: '2025-01-01T00:00:00Z',
          character_name: 'Hegel',
        },
      ];

      mockUseGroupTTS.hasNext = true;

      render(<GroupTTSControls messages={messages} />);

      const nextButton = screen.getByTestId('group-tts-next');

      // Rapid clicks
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      // Should handle gracefully
      expect(mockUseGroupTTS.playNext).toHaveBeenCalled();
    });

    it('should handle very long character names', () => {
      const messages: GroupMessage[] = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Response',
          created_at: '2025-01-01T00:00:00Z',
          character_name: 'A'.repeat(100),
        },
      ];

      mockUseGroupTTS.state = 'playing';
      mockUseGroupTTS.currentMessageId = 'msg-1';
      mockUseGroupTTS.currentIndex = 0;
      mockUseGroupTTS.totalMessages = 1;

      render(<GroupTTSControls messages={messages} />);

      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
    });

    it('should handle large playlist', () => {
      const manyMessages: GroupMessage[] = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'assistant' as const,
        content: `Response ${i}`,
        created_at: new Date(2025, 0, 1, 0, 0, i).toISOString(),
        character_name: `Character ${i}`,
      }));

      mockUseGroupTTS.state = 'idle';
      mockUseGroupTTS.totalMessages = 100;

      render(<GroupTTSControls messages={manyMessages} />);

      expect(screen.getByText(/100 responses available/i)).toBeInTheDocument();
    });
  });
});
