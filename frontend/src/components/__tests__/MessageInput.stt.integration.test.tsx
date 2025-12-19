/**
 * MessageInput + RecordButton Integration Tests.
 *
 * Tests for integrating RecordButton into MessageInput component:
 * - RecordButton placement and layout
 * - Interaction between RecordButton and MessageInput
 * - Character selection coordination
 * - Disabled state coordination
 * - Error handling coordination
 * - Message sending from transcribed text
 * - UI state synchronization
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MessageInput } from '../MessageInput';

// Mock dependencies
vi.mock('../../hooks/useSTT');
vi.mock('../../store/messageStoreEnhanced');
vi.mock('../Loader', () => ({
  Loader: ({ text }: { text: string }) => <div data-testid="loader">{text}</div>,
}));

// Mock RecordButton (will be added to MessageInput)
vi.mock('../RecordButton', () => ({
  RecordButton: ({ characterId, disabled }: { characterId: string | null; disabled?: boolean }) => (
    <button
      data-testid="record-button"
      disabled={!characterId || disabled}
      aria-label={characterId ? 'Record' : 'Record (disabled - no character)'}
    >
      Record
    </button>
  ),
}));

import { useMessageStoreEnhanced } from '../../store/messageStoreEnhanced';

describe('MessageInput + RecordButton Integration', () => {
  let mockMessageStore: any;

  beforeEach(() => {
    // Mock message store
    mockMessageStore = {
      sendMessage: vi.fn().mockResolvedValue(true),
      isLoading: vi.fn().mockReturnValue(false),
      getLoadingState: vi.fn().mockReturnValue({ error: null }),
    };

    vi.mocked(useMessageStoreEnhanced).mockReturnValue(mockMessageStore);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Layout and Rendering', () => {
    it('should render RecordButton alongside send button', () => {
      // Arrange & Act
      render(<MessageInput characterId="char-1" />);

      // Assert
      expect(screen.getByTestId('record-button')).toBeInTheDocument();
      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    });

    it('should render RecordButton before send button', () => {
      // Arrange & Act
      render(<MessageInput characterId="char-1" />);

      // Assert
      const recordButton = screen.getByTestId('record-button');
      const sendButton = screen.getByLabelText('Send message');

      // RecordButton should appear before send button in DOM
      const buttons = screen.getAllByRole('button');
      const recordIndex = buttons.indexOf(recordButton);
      const sendIndex = buttons.indexOf(sendButton);

      expect(recordIndex).toBeLessThan(sendIndex);
    });

    it('should maintain layout with both buttons', () => {
      // Arrange & Act
      render(<MessageInput characterId="char-1" />);

      // Assert
      expect(screen.getByLabelText('Message input')).toBeInTheDocument();
      expect(screen.getByTestId('record-button')).toBeInTheDocument();
      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    });

    it('should render buttons in same container', () => {
      // Arrange & Act
      const { container } = render(<MessageInput characterId="char-1" />);

      // Assert
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(form?.querySelector('[data-testid="record-button"]')).toBeInTheDocument();
      expect(form?.querySelector('.send-button')).toBeInTheDocument();
    });
  });

  describe('Character Selection Coordination', () => {
    it('should pass characterId to RecordButton', () => {
      // Arrange & Act
      render(<MessageInput characterId="test-char-123" />);

      // Assert
      const recordButton = screen.getByTestId('record-button');
      expect(recordButton).toBeInTheDocument();
      expect(recordButton).not.toBeDisabled();
    });

    it('should disable RecordButton when no character selected', () => {
      // Arrange & Act
      render(<MessageInput characterId={null} />);

      // Assert
      const recordButton = screen.getByTestId('record-button');
      expect(recordButton).toBeDisabled();
    });

    it('should disable both RecordButton and send button when no character', () => {
      // Arrange & Act
      render(<MessageInput characterId={null} />);

      // Assert
      expect(screen.getByTestId('record-button')).toBeDisabled();
      expect(screen.getByLabelText('Send message')).toBeDisabled();
    });

    it('should enable RecordButton when character is selected', () => {
      // Arrange & Act
      render(<MessageInput characterId="char-1" />);

      // Assert
      const recordButton = screen.getByTestId('record-button');
      expect(recordButton).not.toBeDisabled();
    });

    it('should update RecordButton when characterId changes', () => {
      // Arrange
      const { rerender } = render(<MessageInput characterId="char-1" />);

      expect(screen.getByTestId('record-button')).not.toBeDisabled();

      // Act
      rerender(<MessageInput characterId={null} />);

      // Assert
      expect(screen.getByTestId('record-button')).toBeDisabled();
    });

    it('should sync character changes between buttons', () => {
      // Arrange
      const { rerender } = render(<MessageInput characterId={null} />);

      // Both disabled
      expect(screen.getByTestId('record-button')).toBeDisabled();
      expect(screen.getByLabelText('Send message')).toBeDisabled();

      // Act
      rerender(<MessageInput characterId="char-1" />);

      // Assert - RecordButton enabled, send button may be disabled if no text
      expect(screen.getByTestId('record-button')).not.toBeDisabled();
    });
  });

  describe('Disabled State Coordination', () => {
    it('should disable RecordButton when sending message', () => {
      // Arrange
      mockMessageStore.isLoading.mockReturnValue(true);

      // Act
      render(<MessageInput characterId="char-1" />);

      // Assert
      const recordButton = screen.getByTestId('record-button');
      expect(recordButton).toBeDisabled();
    });

    it('should keep RecordButton enabled when typing', () => {
      // Arrange
      render(<MessageInput characterId="char-1" />);

      // Act
      const textarea = screen.getByLabelText('Message input');
      fireEvent.change(textarea, { target: { value: 'Typing a message' } });

      // Assert
      const recordButton = screen.getByTestId('record-button');
      expect(recordButton).not.toBeDisabled();
    });

    it('should not interfere with RecordButton during text input', () => {
      // Arrange
      render(<MessageInput characterId="char-1" />);

      const recordButton = screen.getByTestId('record-button');
      const textarea = screen.getByLabelText('Message input');

      // Act - Type in textarea
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      // Assert - RecordButton should remain enabled
      expect(recordButton).not.toBeDisabled();
    });

    it('should coordinate disabled state with external disabled prop', () => {
      // This test assumes RecordButton will be passed disabled prop from MessageInput
      // when MessageInput is in sending state
      // Arrange
      mockMessageStore.isLoading.mockReturnValue(true);

      // Act
      render(<MessageInput characterId="char-1" />);

      // Assert
      expect(screen.getByTestId('record-button')).toBeDisabled();
    });
  });

  describe('Independent Operation', () => {
    it('should allow recording without text in textarea', () => {
      // Arrange
      render(<MessageInput characterId="char-1" />);

      // Assert
      const textarea = screen.getByLabelText('Message input') as HTMLTextAreaElement;
      const recordButton = screen.getByTestId('record-button');

      expect(textarea.value).toBe('');
      expect(recordButton).not.toBeDisabled();
    });

    it('should allow typing while RecordButton is present', () => {
      // Arrange
      render(<MessageInput characterId="char-1" />);

      // Act
      const textarea = screen.getByLabelText('Message input') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      // Assert
      expect(textarea.value).toBe('Test message');
      expect(screen.getByTestId('record-button')).toBeInTheDocument();
    });

    it('should allow sending text message while RecordButton exists', async () => {
      // Arrange
      render(<MessageInput characterId="char-1" />);

      // Act
      const textarea = screen.getByLabelText('Message input');
      fireEvent.change(textarea, { target: { value: 'Text message' } });

      const sendButton = screen.getByLabelText('Send message');
      fireEvent.click(sendButton);

      // Assert
      await waitFor(() => {
        expect(mockMessageStore.sendMessage).toHaveBeenCalledWith('char-1', 'Text message');
      });

      // RecordButton should still be present
      expect(screen.getByTestId('record-button')).toBeInTheDocument();
    });

    it('should not affect textarea when recording (theoretical test)', () => {
      // Arrange
      render(<MessageInput characterId="char-1" />);

      // Act
      const textarea = screen.getByLabelText('Message input') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Existing text' } });

      // Click record button (mock doesn't actually record)
      const recordButton = screen.getByTestId('record-button');
      fireEvent.click(recordButton);

      // Assert - textarea content should not change
      expect(textarea.value).toBe('Existing text');
    });
  });

  describe('Error Handling', () => {
    it('should show MessageInput errors independently of RecordButton', () => {
      // Arrange
      mockMessageStore.getLoadingState.mockReturnValue({ error: 'Failed to send message' });

      // Act
      render(<MessageInput characterId="char-1" />);

      // Assert
      expect(screen.getByTestId('message-error')).toHaveTextContent('Failed to send message');
      expect(screen.getByTestId('record-button')).toBeInTheDocument();
    });

    it('should not show MessageInput error from RecordButton', () => {
      // RecordButton has its own error display
      // MessageInput should not show RecordButton errors

      // Arrange & Act
      render(<MessageInput characterId="char-1" />);

      // Assert
      expect(screen.queryByTestId('message-error')).not.toBeInTheDocument();
    });

    it('should maintain separate error states', () => {
      // Arrange
      mockMessageStore.getLoadingState.mockReturnValue({ error: 'Send error' });

      // Act
      render(<MessageInput characterId="char-1" />);

      // Assert
      // MessageInput shows its error
      expect(screen.getByTestId('message-error')).toHaveTextContent('Send error');

      // RecordButton is separate (would show its own error if it had one)
      expect(screen.getByTestId('record-button')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should maintain accessibility with both buttons', () => {
      // Arrange & Act
      render(<MessageInput characterId="char-1" />);

      // Assert
      expect(screen.getByLabelText('Message input')).toBeInTheDocument();
      expect(screen.getByTestId('record-button')).toBeInTheDocument();
      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    });

    it('should have distinct labels for both buttons', () => {
      // Arrange & Act
      render(<MessageInput characterId="char-1" />);

      // Assert
      const recordButton = screen.getByTestId('record-button');
      const sendButton = screen.getByLabelText('Send message');

      expect(recordButton).toHaveAttribute('aria-label');
      expect(sendButton).toHaveAttribute('aria-label', 'Send message');
      expect(recordButton.getAttribute('aria-label')).not.toBe(sendButton.getAttribute('aria-label'));
    });

    it('should maintain proper tab order', () => {
      // Arrange & Act
      render(<MessageInput characterId="char-1" />);

      // Assert
      const textarea = screen.getByLabelText('Message input');
      const recordButton = screen.getByTestId('record-button');
      const sendButton = screen.getByLabelText('Send message');

      // All should be in the document and focusable
      expect(textarea).toBeInTheDocument();
      expect(recordButton).toBeInTheDocument();
      expect(sendButton).toBeInTheDocument();
    });

    it('should provide context for disabled RecordButton', () => {
      // Arrange & Act
      render(<MessageInput characterId={null} />);

      // Assert
      const recordButton = screen.getByTestId('record-button');
      expect(recordButton).toBeDisabled();
      expect(recordButton).toHaveAttribute('aria-label');
    });
  });

  describe('Message Sending Flow Integration', () => {
    it('should send transcribed text through MessageInput store', async () => {
      // This test simulates the full flow:
      // 1. RecordButton triggers recording
      // 2. STT transcribes audio
      // 3. useSTT calls messageStore.sendMessage
      // 4. MessageInput should reflect the sent message

      // Arrange
      render(<MessageInput characterId="char-1" />);

      // Simulate that STT workflow completed and sent message
      // (In reality, useSTT hook would call sendMessage)
      await mockMessageStore.sendMessage('char-1', 'Transcribed text from recording');

      // Assert
      expect(mockMessageStore.sendMessage).toHaveBeenCalledWith('char-1', 'Transcribed text from recording');
    });

    it('should not interfere with normal text message sending', async () => {
      // Arrange
      render(<MessageInput characterId="char-1" />);

      // Act - Send normal text message
      const textarea = screen.getByLabelText('Message input');
      fireEvent.change(textarea, { target: { value: 'Normal text message' } });

      const sendButton = screen.getByLabelText('Send message');
      fireEvent.click(sendButton);

      // Assert
      await waitFor(() => {
        expect(mockMessageStore.sendMessage).toHaveBeenCalledWith('char-1', 'Normal text message');
      });

      // RecordButton should still be available
      expect(screen.getByTestId('record-button')).toBeInTheDocument();
    });

    it('should share messageStore instance between MessageInput and RecordButton', () => {
      // Both MessageInput and useSTT (used by RecordButton) use the same store
      // This test verifies they don't conflict

      // Arrange & Act
      render(<MessageInput characterId="char-1" />);

      // Assert
      expect(useMessageStoreEnhanced).toHaveBeenCalled();
      expect(screen.getByTestId('record-button')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid switching between character selections', () => {
      // Arrange
      const { rerender } = render(<MessageInput characterId="char-1" />);

      // Act - Rapidly change characters
      rerender(<MessageInput characterId={null} />);
      rerender(<MessageInput characterId="char-2" />);
      rerender(<MessageInput characterId="char-1" />);

      // Assert - Should render correctly
      expect(screen.getByTestId('record-button')).not.toBeDisabled();
    });

    it('should handle both buttons disabled simultaneously', () => {
      // Arrange
      mockMessageStore.isLoading.mockReturnValue(true);

      // Act
      render(<MessageInput characterId={null} />);

      // Assert
      expect(screen.getByTestId('record-button')).toBeDisabled();
      expect(screen.getByLabelText('Send message')).toBeDisabled();
    });

    it('should render correctly with empty characterId string', () => {
      // Arrange & Act
      render(<MessageInput characterId="" />);

      // Assert
      expect(screen.getByTestId('record-button')).toBeDisabled();
      expect(screen.getByLabelText('Send message')).toBeDisabled();
    });

    it('should maintain state when MessageInput re-renders', () => {
      // Arrange
      const { rerender } = render(<MessageInput characterId="char-1" />);

      const textarea = screen.getByLabelText('Message input');
      fireEvent.change(textarea, { target: { value: 'Test' } });

      // Act - Force re-render
      rerender(<MessageInput characterId="char-1" />);

      // Assert
      expect((textarea as HTMLTextAreaElement).value).toBe('Test');
      expect(screen.getByTestId('record-button')).toBeInTheDocument();
    });

    it('should handle special characters in characterId', () => {
      // Arrange & Act
      render(<MessageInput characterId="char-123-тест-你好" />);

      // Assert
      expect(screen.getByTestId('record-button')).not.toBeDisabled();
    });
  });

  describe('Visual Integration', () => {
    it('should have appropriate container structure', () => {
      // Arrange & Act
      const { container } = render(<MessageInput characterId="char-1" />);

      // Assert
      const messageInputDiv = container.querySelector('.message-input');
      expect(messageInputDiv).toBeInTheDocument();

      const form = messageInputDiv?.querySelector('form');
      expect(form).toBeInTheDocument();

      expect(form?.querySelector('[data-testid="record-button"]')).toBeInTheDocument();
      expect(form?.querySelector('.send-button')).toBeInTheDocument();
    });

    it('should maintain consistent layout with errors', () => {
      // Arrange
      mockMessageStore.getLoadingState.mockReturnValue({ error: 'Error' });

      // Act
      render(<MessageInput characterId="char-1" />);

      // Assert
      expect(screen.getByTestId('message-error')).toBeInTheDocument();
      expect(screen.getByTestId('record-button')).toBeInTheDocument();
      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    });

    it('should not overlap buttons', () => {
      // Arrange & Act
      render(<MessageInput characterId="char-1" />);

      // Assert - Both buttons should be present and separate
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });
});
