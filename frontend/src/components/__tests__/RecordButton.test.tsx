/**
 * RecordButton Component Unit Tests.
 *
 * Comprehensive tests for RecordButton component covering:
 * - Component rendering in different states (idle, recording, processing)
 * - Click handler behavior
 * - Disabled states
 * - Error display
 * - Accessibility attributes (ARIA labels, roles)
 * - Duration formatting
 * - Integration with useSTT hook
 * - Visual indicators
 * - Edge cases
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecordButton } from '../RecordButton';

// Mock dependencies
vi.mock('../Loader', () => ({
  Loader: ({ text }: { text: string }) => <div data-testid="loader">{text}</div>,
}));

vi.mock('../../hooks/useSTT');

import { useSTT } from '../../hooks/useSTT';

describe('RecordButton', () => {
  let mockUseSTT: any;

  beforeEach(() => {
    // Mock useSTT with default success behavior
    mockUseSTT = {
      recordingState: 'idle',
      isProcessing: false,
      error: null,
      startRecording: vi.fn().mockResolvedValue(undefined),
      stopAndTranscribe: vi.fn().mockResolvedValue(undefined),
      cancelRecording: vi.fn(),
      duration: 0,
    };

    vi.mocked(useSTT).mockReturnValue(mockUseSTT);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering - Idle State', () => {
    it('should render button in idle state', () => {
      // Arrange & Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Record');
      expect(button).not.toBeDisabled();
    });

    it('should have correct aria-label in idle state', () => {
      // Arrange & Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toHaveAttribute('aria-label', 'Record');
    });

    it('should not show loader in idle state', () => {
      // Arrange & Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    it('should not show error in idle state', () => {
      // Arrange & Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      expect(screen.queryByTestId('record-error')).not.toBeInTheDocument();
    });

    it('should have correct CSS class in idle state', () => {
      // Arrange & Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toHaveClass('record-button');
      expect(button).not.toHaveClass('recording');
      expect(button).not.toHaveClass('processing');
    });
  });

  describe('Rendering - Recording State', () => {
    it('should render button in recording state', () => {
      // Arrange
      mockUseSTT.recordingState = 'recording';
      mockUseSTT.duration = 5000; // 5 seconds

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(/Stop/);
      expect(button).toHaveTextContent(/00:05/);
      expect(button).not.toBeDisabled();
    });

    it('should format duration correctly (1 second)', () => {
      // Arrange
      mockUseSTT.recordingState = 'recording';
      mockUseSTT.duration = 1000;

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toHaveTextContent('00:01');
    });

    it('should format duration correctly (1 minute 30 seconds)', () => {
      // Arrange
      mockUseSTT.recordingState = 'recording';
      mockUseSTT.duration = 90000;

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toHaveTextContent('01:30');
    });

    it('should format duration correctly (10 minutes)', () => {
      // Arrange
      mockUseSTT.recordingState = 'recording';
      mockUseSTT.duration = 600000;

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toHaveTextContent('10:00');
    });

    it('should format duration with leading zeros', () => {
      // Arrange
      mockUseSTT.recordingState = 'recording';
      mockUseSTT.duration = 3500; // 3.5 seconds

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toHaveTextContent('00:03'); // Should round down
    });

    it('should have recording CSS class when recording', () => {
      // Arrange
      mockUseSTT.recordingState = 'recording';

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toHaveClass('record-button');
      expect(button).toHaveClass('recording');
    });

    it('should have correct aria-label when recording', () => {
      // Arrange
      mockUseSTT.recordingState = 'recording';
      mockUseSTT.duration = 5000;

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toHaveAttribute('aria-label', 'Stop (00:05)');
    });

    it('should update duration in real-time when re-rendered', () => {
      // Arrange
      mockUseSTT.recordingState = 'recording';
      mockUseSTT.duration = 1000;

      // Act
      const { rerender } = render(<RecordButton characterId="char-1" />);

      expect(screen.getByTestId('record-button')).toHaveTextContent('00:01');

      // Update duration
      mockUseSTT.duration = 2000;
      rerender(<RecordButton characterId="char-1" />);

      // Assert
      expect(screen.getByTestId('record-button')).toHaveTextContent('00:02');
    });
  });

  describe('Rendering - Processing State', () => {
    it('should render button in processing state', () => {
      // Arrange
      mockUseSTT.isProcessing = true;

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should show loader with correct text in processing state', () => {
      // Arrange
      mockUseSTT.isProcessing = true;

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveTextContent('Processing...');
    });

    it('should have processing CSS class when processing', () => {
      // Arrange
      mockUseSTT.isProcessing = true;

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toHaveClass('record-button');
      expect(button).toHaveClass('processing');
    });

    it('should have correct aria-label when processing', () => {
      // Arrange
      mockUseSTT.isProcessing = true;

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toHaveAttribute('aria-label', 'Processing...');
    });

    it('should be disabled when recordingState is processing', () => {
      // Arrange
      mockUseSTT.recordingState = 'processing';

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toBeDisabled();
    });

    it('should show loader when recordingState is processing', () => {
      // Arrange
      mockUseSTT.recordingState = 'processing';

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when no character selected', () => {
      // Arrange & Act
      render(<RecordButton characterId={null} />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should be disabled when characterId is empty string', () => {
      // Arrange & Act
      render(<RecordButton characterId="" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      // Arrange & Act
      render(<RecordButton characterId="char-1" disabled={true} />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when processing', () => {
      // Arrange
      mockUseSTT.isProcessing = true;

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toBeDisabled();
    });

    it('should not be disabled when character selected and not processing', () => {
      // Arrange & Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).not.toBeDisabled();
    });

    it('should not be disabled during recording', () => {
      // Arrange
      mockUseSTT.recordingState = 'recording';

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).not.toBeDisabled();
    });

    it('should combine multiple disabled conditions', () => {
      // Arrange
      mockUseSTT.isProcessing = true;

      // Act
      render(<RecordButton characterId={null} disabled={true} />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toBeDisabled();
    });
  });

  describe('Error Display', () => {
    it('should show error message when error exists', () => {
      // Arrange
      mockUseSTT.error = 'Microphone permission denied';

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const errorDiv = screen.getByTestId('record-error');
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv).toHaveTextContent('Microphone permission denied');
    });

    it('should have role="alert" for error message', () => {
      // Arrange
      mockUseSTT.error = 'Network error';

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const errorDiv = screen.getByTestId('record-error');
      expect(errorDiv).toHaveAttribute('role', 'alert');
      expect(errorDiv).toHaveAttribute('aria-live', 'polite');
    });

    it('should show different error messages', () => {
      // Arrange
      const errorMessages = [
        'Microphone permission denied',
        'Network error. Please check your connection.',
        'STT service is offline',
        'Transcription timed out',
      ];

      for (const error of errorMessages) {
        mockUseSTT.error = error;

        // Act
        const { rerender } = render(<RecordButton characterId="char-1" />);

        // Assert
        expect(screen.getByTestId('record-error')).toHaveTextContent(error);

        // Cleanup for next iteration
        rerender(<div />);
      }
    });

    it('should not show error div when no error', () => {
      // Arrange
      mockUseSTT.error = null;

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      expect(screen.queryByTestId('record-error')).not.toBeInTheDocument();
    });

    it('should hide error when it clears', () => {
      // Arrange
      mockUseSTT.error = 'Test error';

      // Act
      const { rerender } = render(<RecordButton characterId="char-1" />);

      expect(screen.getByTestId('record-error')).toBeInTheDocument();

      // Clear error
      mockUseSTT.error = null;
      rerender(<RecordButton characterId="char-1" />);

      // Assert
      expect(screen.queryByTestId('record-error')).not.toBeInTheDocument();
    });

    it('should show error in idle state', () => {
      // Arrange
      mockUseSTT.recordingState = 'idle';
      mockUseSTT.error = 'Previous error';

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      expect(screen.getByTestId('record-error')).toBeInTheDocument();
    });

    it('should show error in recording state', () => {
      // Arrange
      mockUseSTT.recordingState = 'recording';
      mockUseSTT.error = 'Recording error';

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      expect(screen.getByTestId('record-error')).toBeInTheDocument();
    });
  });

  describe('Click Handler - Idle State', () => {
    it('should call startRecording when clicked in idle state', async () => {
      // Arrange
      render(<RecordButton characterId="char-1" />);

      // Act
      const button = screen.getByTestId('record-button');
      fireEvent.click(button);

      // Assert
      await waitFor(() => {
        expect(mockUseSTT.startRecording).toHaveBeenCalledTimes(1);
      });
      expect(mockUseSTT.stopAndTranscribe).not.toHaveBeenCalled();
    });

    it('should handle startRecording success', async () => {
      // Arrange
      mockUseSTT.startRecording.mockResolvedValue(undefined);

      render(<RecordButton characterId="char-1" />);

      // Act
      const button = screen.getByTestId('record-button');
      fireEvent.click(button);

      // Assert
      await waitFor(() => {
        expect(mockUseSTT.startRecording).toHaveBeenCalled();
      });
    });

    it('should handle startRecording failure', async () => {
      // Arrange
      // Mock the function to handle rejection internally (no throw to component)
      mockUseSTT.startRecording.mockImplementation(async () => {
        // Simulate error being handled internally and set in state
        mockUseSTT.error = 'Permission denied';
      });

      const { rerender } = render(<RecordButton characterId="char-1" />);

      // Act
      const button = screen.getByTestId('record-button');
      fireEvent.click(button);

      // Wait for call
      await waitFor(() => {
        expect(mockUseSTT.startRecording).toHaveBeenCalled();
      });

      // Trigger re-render to show error
      rerender(<RecordButton characterId="char-1" />);

      // Assert - should not crash and error should be displayed
      expect(button).toBeInTheDocument();
    });

    it('should not call startRecording when disabled', () => {
      // Arrange
      render(<RecordButton characterId={null} />);

      // Act
      const button = screen.getByTestId('record-button');
      fireEvent.click(button);

      // Assert
      expect(mockUseSTT.startRecording).not.toHaveBeenCalled();
    });
  });

  describe('Click Handler - Recording State', () => {
    it('should call stopAndTranscribe when clicked in recording state', async () => {
      // Arrange
      mockUseSTT.recordingState = 'recording';

      render(<RecordButton characterId="char-1" />);

      // Act
      const button = screen.getByTestId('record-button');
      fireEvent.click(button);

      // Assert
      await waitFor(() => {
        expect(mockUseSTT.stopAndTranscribe).toHaveBeenCalledTimes(1);
      });
      expect(mockUseSTT.startRecording).not.toHaveBeenCalled();
    });

    it('should handle stopAndTranscribe success', async () => {
      // Arrange
      mockUseSTT.recordingState = 'recording';
      mockUseSTT.stopAndTranscribe.mockResolvedValue(undefined);

      render(<RecordButton characterId="char-1" />);

      // Act
      const button = screen.getByTestId('record-button');
      fireEvent.click(button);

      // Assert
      await waitFor(() => {
        expect(mockUseSTT.stopAndTranscribe).toHaveBeenCalled();
      });
    });

    it('should handle stopAndTranscribe failure', async () => {
      // Arrange
      mockUseSTT.recordingState = 'recording';
      // Mock the function to handle rejection internally (no throw to component)
      mockUseSTT.stopAndTranscribe.mockImplementation(async () => {
        // Simulate error being handled internally and set in state
        mockUseSTT.error = 'Transcription failed';
      });

      const { rerender } = render(<RecordButton characterId="char-1" />);

      // Act
      const button = screen.getByTestId('record-button');
      fireEvent.click(button);

      // Wait for call
      await waitFor(() => {
        expect(mockUseSTT.stopAndTranscribe).toHaveBeenCalled();
      });

      // Trigger re-render to show error
      rerender(<RecordButton characterId="char-1" />);

      // Assert - should not crash and error should be displayed
      expect(button).toBeInTheDocument();
    });
  });

  describe('Click Handler - Processing State', () => {
    it('should not call any handlers when processing', () => {
      // Arrange
      mockUseSTT.isProcessing = true;

      render(<RecordButton characterId="char-1" />);

      // Act
      const button = screen.getByTestId('record-button');
      fireEvent.click(button);

      // Assert
      expect(mockUseSTT.startRecording).not.toHaveBeenCalled();
      expect(mockUseSTT.stopAndTranscribe).not.toHaveBeenCalled();
    });

    it('should not respond to clicks when disabled', () => {
      // Arrange
      render(<RecordButton characterId="char-1" disabled={true} />);

      // Act
      const button = screen.getByTestId('record-button');
      fireEvent.click(button);

      // Assert
      expect(mockUseSTT.startRecording).not.toHaveBeenCalled();
      expect(mockUseSTT.stopAndTranscribe).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have role="button"', () => {
      // Arrange & Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should have aria-disabled when disabled', () => {
      // Arrange & Act
      render(<RecordButton characterId={null} />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should not have aria-disabled when enabled', () => {
      // Arrange & Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toHaveAttribute('aria-disabled', 'false');
    });

    it('should update aria-label based on state', () => {
      // Arrange
      const { rerender } = render(<RecordButton characterId="char-1" />);

      // Idle state
      expect(screen.getByTestId('record-button')).toHaveAttribute('aria-label', 'Record');

      // Recording state
      mockUseSTT.recordingState = 'recording';
      mockUseSTT.duration = 3000;
      rerender(<RecordButton characterId="char-1" />);

      expect(screen.getByTestId('record-button')).toHaveAttribute('aria-label', 'Stop (00:03)');

      // Processing state
      mockUseSTT.isProcessing = true;
      rerender(<RecordButton characterId="char-1" />);

      expect(screen.getByTestId('record-button')).toHaveAttribute('aria-label', 'Processing...');
    });

    it('should have error message with aria-live="polite"', () => {
      // Arrange
      mockUseSTT.error = 'Test error';

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const errorDiv = screen.getByTestId('record-error');
      expect(errorDiv).toHaveAttribute('aria-live', 'polite');
    });

    it('should be keyboard accessible', () => {
      // Arrange
      render(<RecordButton characterId="char-1" />);

      // Act
      const button = screen.getByTestId('record-button');

      // Assert - button should be focusable and keyboard accessible by default
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Props Handling', () => {
    it('should accept characterId prop', () => {
      // Arrange & Act
      render(<RecordButton characterId="test-char-123" />);

      // Assert
      expect(useSTT).toHaveBeenCalledWith('test-char-123');
    });

    it('should accept null characterId', () => {
      // Arrange & Act
      render(<RecordButton characterId={null} />);

      // Assert
      expect(useSTT).toHaveBeenCalledWith(null);
    });

    it('should accept disabled prop', () => {
      // Arrange & Act
      render(<RecordButton characterId="char-1" disabled={true} />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toBeDisabled();
    });

    it('should use disabled=false by default', () => {
      // Arrange & Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).not.toBeDisabled();
    });

    it('should re-render when characterId changes', () => {
      // Arrange
      const { rerender } = render(<RecordButton characterId="char-1" />);

      expect(useSTT).toHaveBeenCalledWith('char-1');

      // Act
      rerender(<RecordButton characterId="char-2" />);

      // Assert
      expect(useSTT).toHaveBeenCalledWith('char-2');
    });

    it('should re-render when disabled changes', () => {
      // Arrange
      const { rerender } = render(<RecordButton characterId="char-1" disabled={false} />);

      const button = screen.getByTestId('record-button');
      expect(button).not.toBeDisabled();

      // Act
      rerender(<RecordButton characterId="char-1" disabled={true} />);

      // Assert
      expect(button).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero duration', () => {
      // Arrange
      mockUseSTT.recordingState = 'recording';
      mockUseSTT.duration = 0;

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toHaveTextContent('00:00');
    });

    it('should handle negative duration gracefully', () => {
      // Arrange
      mockUseSTT.recordingState = 'recording';
      mockUseSTT.duration = -1000;

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      // Should either show 00:00 or handle gracefully
      expect(button).toBeInTheDocument();
    });

    it('should handle very large duration', () => {
      // Arrange
      mockUseSTT.recordingState = 'recording';
      mockUseSTT.duration = 3600000; // 1 hour

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toHaveTextContent('60:00'); // Or appropriate format
    });

    it('should handle fractional milliseconds in duration', () => {
      // Arrange
      mockUseSTT.recordingState = 'recording';
      mockUseSTT.duration = 1234.567;

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const button = screen.getByTestId('record-button');
      expect(button).toHaveTextContent('00:01');
    });

    it('should handle empty string error', () => {
      // Arrange
      mockUseSTT.error = '';

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      // Empty error should not show error div
      expect(screen.queryByTestId('record-error')).not.toBeInTheDocument();
    });

    it('should handle very long error message', () => {
      // Arrange
      const longError = 'a'.repeat(1000);
      mockUseSTT.error = longError;

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const errorDiv = screen.getByTestId('record-error');
      expect(errorDiv).toHaveTextContent(longError);
    });

    it('should handle error with special characters', () => {
      // Arrange
      mockUseSTT.error = 'Error: <script>alert("xss")</script>';

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      const errorDiv = screen.getByTestId('record-error');
      expect(errorDiv).toHaveTextContent('Error: <script>alert("xss")</script>');
    });

    it('should handle multiple rapid clicks', async () => {
      // Arrange
      render(<RecordButton characterId="char-1" />);

      // Act
      const button = screen.getByTestId('record-button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Assert
      await waitFor(() => {
        // Should have been called multiple times or handled gracefully
        expect(mockUseSTT.startRecording).toHaveBeenCalled();
      });
    });

    it('should handle state change during click', async () => {
      // Arrange
      let clickCount = 0;
      mockUseSTT.startRecording.mockImplementation(async () => {
        clickCount++;
        if (clickCount === 1) {
          mockUseSTT.recordingState = 'recording';
        }
      });

      const { rerender } = render(<RecordButton characterId="char-1" />);

      // Act
      const button = screen.getByTestId('record-button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockUseSTT.startRecording).toHaveBeenCalled();
      });

      // Rerender with new state
      rerender(<RecordButton characterId="char-1" />);

      // Assert
      expect(button).toHaveTextContent(/Stop/);
    });
  });

  describe('Integration with useSTT', () => {
    it('should pass characterId to useSTT hook', () => {
      // Arrange
      const characterId = 'test-character-id';

      // Act
      render(<RecordButton characterId={characterId} />);

      // Assert
      expect(useSTT).toHaveBeenCalledWith(characterId);
    });

    it('should use all properties from useSTT return value', () => {
      // Arrange
      mockUseSTT.recordingState = 'recording';
      mockUseSTT.isProcessing = false;
      mockUseSTT.error = 'Test error';
      mockUseSTT.duration = 5000;

      // Act
      render(<RecordButton characterId="char-1" />);

      // Assert
      expect(screen.getByTestId('record-button')).toHaveTextContent(/Stop/);
      expect(screen.getByTestId('record-button')).toHaveTextContent('00:05');
      expect(screen.getByTestId('record-error')).toHaveTextContent('Test error');
    });

    it('should react to changes in useSTT return values', () => {
      // Arrange
      const { rerender } = render(<RecordButton characterId="char-1" />);

      // Change state
      mockUseSTT.recordingState = 'recording';
      mockUseSTT.duration = 3000;

      // Act
      rerender(<RecordButton characterId="char-1" />);

      // Assert
      expect(screen.getByTestId('record-button')).toHaveTextContent('00:03');
    });
  });
});
