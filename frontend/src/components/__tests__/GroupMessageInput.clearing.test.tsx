/**
 * Comprehensive tests for GroupMessageInput disabled state during message clearing.
 *
 * This test suite covers the input component's behavior when messages are being
 * cleared, ensuring users cannot send messages during the clear operation.
 *
 * Test Coverage:
 * - Input disabled when isClearing is true
 * - Textarea disabled state
 * - Send button disabled state
 * - Record button disabled state
 * - Placeholder text during clearing
 * - Re-enabling after clearing completes
 * - Multi-group isolation
 * - Error states don't disable input
 * - Sending state combined with clearing state
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupMessageInput } from '../GroupMessageInput';
import { useGroupMessageStore } from '../../store/groupMessageStore';
import { useGroupStore } from '../../store/groupStore';

// Mock the stores
vi.mock('../../store/groupMessageStore');
vi.mock('../../store/groupStore');
const mockedGroupMessageStore = vi.mocked(useGroupMessageStore);
const mockedGroupStore = vi.mocked(useGroupStore);

// Mock group data
const mockGroup = {
  id: 'group-123',
  name: 'Test Group',
  character_ids: ['char-1', 'char-2'],
  created_at: '2025-01-01T10:00:00Z',
};

describe('GroupMessageInput - Clearing State', () => {
  let mockSendGroupMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup default mock implementation
    mockSendGroupMessage = vi.fn().mockResolvedValue(undefined);

    mockedGroupMessageStore.mockReturnValue({
      isClearing: {},
      isSending: {},
      error: {},
      sendGroupMessage: mockSendGroupMessage,
      clearGroupMessagesWithAPI: vi.fn(),
      messages: {},
      isLoading: {},
      fetchGroupMessages: vi.fn(),
      clearGroupMessages: vi.fn(),
      addCharacterResponses: vi.fn(),
    } as any);

    mockedGroupStore.mockReturnValue({
      selectedGroup: mockGroup,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Disabled During Clearing', () => {
    it('should disable textarea when isClearing is true', () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: true },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      // Act
      render(<GroupMessageInput groupId={mockGroup.id} />);

      // Assert
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('should disable send button when isClearing is true', () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: true },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      // Act
      render(<GroupMessageInput groupId={mockGroup.id} />);

      // Assert
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it('should disable record button when isClearing is true', () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: true },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      // Act
      render(<GroupMessageInput groupId={mockGroup.id} />);

      // Assert
      const recordButton = screen.getByRole('button', { name: /record/i });
      expect(recordButton).toBeDisabled();
    });

    it('should prevent user from typing in textarea when clearing', async () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: true },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      const user = userEvent.setup();
      render(<GroupMessageInput groupId={mockGroup.id} />);

      // Act
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test message');

      // Assert - Text should not be entered
      expect(textarea).toHaveValue('');
    });

    it('should prevent form submission when clearing', async () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: true },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      render(<GroupMessageInput groupId={mockGroup.id} />);

      // Act
      const form = screen.getByRole('form') || screen.getByTestId('message-form');
      fireEvent.submit(form);

      // Assert - Send should not be called
      expect(mockSendGroupMessage).not.toHaveBeenCalled();
    });
  });

  describe('Placeholder Text During Clearing', () => {
    it('should show "Clearing messages..." placeholder when clearing', () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: true },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      // Act
      render(<GroupMessageInput groupId={mockGroup.id} />);

      // Assert
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', expect.stringMatching(/clearing/i));
    });

    it('should show normal placeholder when not clearing', () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: false },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      // Act
      render(<GroupMessageInput groupId={mockGroup.id} />);

      // Assert
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', expect.not.stringMatching(/clearing/i));
    });
  });

  describe('Send Button Loading State', () => {
    it('should show "Clearing..." text on send button when clearing', () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: true },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      // Act
      render(<GroupMessageInput groupId={mockGroup.id} />);

      // Assert
      expect(screen.getByText(/clearing/i)).toBeInTheDocument();
    });

    it('should show loading spinner on send button when clearing', () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: true },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      // Act
      render(<GroupMessageInput groupId={mockGroup.id} />);

      // Assert
      const sendButton = screen.getByRole('button', { name: /send|clearing/i });
      const spinner = sendButton.querySelector('.spinner') || sendButton.querySelector('[data-spinner]');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Re-enabling After Clearing', () => {
    it('should re-enable input after clearing completes', () => {
      // Arrange
      const { rerender } = render(<GroupMessageInput groupId={mockGroup.id} />);

      // Initially clearing
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: true },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      rerender(<GroupMessageInput groupId={mockGroup.id} />);

      // Assert - disabled during clearing
      let textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();

      // Act - Clearing completes
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: false },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      rerender(<GroupMessageInput groupId={mockGroup.id} />);

      // Assert - enabled after clearing
      textarea = screen.getByRole('textbox');
      expect(textarea).not.toBeDisabled();
    });

    it('should allow typing after clearing completes', async () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: false },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      const user = userEvent.setup();
      render(<GroupMessageInput groupId={mockGroup.id} />);

      // Act
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'New message after clearing');

      // Assert
      expect(textarea).toHaveValue('New message after clearing');
    });

    it('should allow sending messages after clearing completes', async () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: false },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      const user = userEvent.setup();
      render(<GroupMessageInput groupId={mockGroup.id} />);

      // Act
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test message');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      // Assert
      expect(mockSendGroupMessage).toHaveBeenCalled();
    });
  });

  describe('Multi-Group Isolation', () => {
    it('should only disable input for clearing group', () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { 'group-1': true, 'group-2': false },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      // Act - Render input for group-1 (clearing)
      const { rerender } = render(<GroupMessageInput group={{ ...mockGroup, id: 'group-1' }} />);

      // Assert - Input should be disabled
      let textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();

      // Act - Switch to group-2 (not clearing)
      rerender(<GroupMessageInput group={{ ...mockGroup, id: 'group-2' }} />);

      // Assert - Input should be enabled
      textarea = screen.getByRole('textbox');
      expect(textarea).not.toBeDisabled();
    });

    it('should handle undefined isClearing for new group', () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: {}, // No entry for this group
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      // Act
      render(<GroupMessageInput groupId={mockGroup.id} />);

      // Assert - Input should be enabled (undefined treated as false)
      const textarea = screen.getByRole('textbox');
      expect(textarea).not.toBeDisabled();
    });
  });

  describe('Combined States', () => {
    it('should disable input when both isSending and isClearing are true', () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: true },
        isSending: { [mockGroup.id]: true },
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      // Act
      render(<GroupMessageInput groupId={mockGroup.id} />);

      // Assert
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('should disable input when isSending is true but isClearing is false', () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: false },
        isSending: { [mockGroup.id]: true },
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      // Act
      render(<GroupMessageInput groupId={mockGroup.id} />);

      // Assert
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('should enable input when both isSending and isClearing are false', () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: false },
        isSending: { [mockGroup.id]: false },
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      // Act
      render(<GroupMessageInput groupId={mockGroup.id} />);

      // Assert
      const textarea = screen.getByRole('textbox');
      expect(textarea).not.toBeDisabled();
    });

    it('should not disable input when error exists but not clearing', () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: false },
        isSending: {},
        error: { [mockGroup.id]: 'Some error' },
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      // Act
      render(<GroupMessageInput groupId={mockGroup.id} />);

      // Assert - Input should still be enabled (allow retry)
      const textarea = screen.getByRole('textbox');
      expect(textarea).not.toBeDisabled();
    });
  });

  describe('Visual Feedback', () => {
    it('should apply disabled styling when clearing', () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: true },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      // Act
      render(<GroupMessageInput groupId={mockGroup.id} />);

      // Assert
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass(/disabled|opacity/); // Adjust based on actual CSS
    });

    it('should show clearing indicator in input area', () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: true },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      // Act
      render(<GroupMessageInput groupId={mockGroup.id} />);

      // Assert
      expect(screen.getByText(/clearing/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid state changes', () => {
      // Arrange
      const { rerender } = render(<GroupMessageInput groupId={mockGroup.id} />);

      // Act - Rapidly toggle clearing state
      for (let i = 0; i < 10; i++) {
        mockedGroupMessageStore.mockReturnValue({
          isClearing: { [mockGroup.id]: i % 2 === 0 },
          isSending: {},
          error: {},
          sendGroupMessage: mockSendGroupMessage,
          clearGroupMessagesWithAPI: vi.fn(),
          messages: {},
          isLoading: {},
          fetchGroupMessages: vi.fn(),
          clearGroupMessages: vi.fn(),
          addCharacterResponses: vi.fn(),
        } as any);

        rerender(<GroupMessageInput groupId={mockGroup.id} />);
      }

      // Assert - Should not crash
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should handle switching groups during clearing', () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { 'group-1': true, 'group-2': false },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      const { rerender } = render(<GroupMessageInput group={{ ...mockGroup, id: 'group-1' }} />);

      // Assert - Input disabled for group-1
      let textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();

      // Act - Switch to group-2
      rerender(<GroupMessageInput group={{ ...mockGroup, id: 'group-2' }} />);

      // Assert - Input enabled for group-2
      textarea = screen.getByRole('textbox');
      expect(textarea).not.toBeDisabled();
    });

    it('should preserve input value when clearing state changes', async () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: false },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      const user = userEvent.setup();
      const { rerender } = render(<GroupMessageInput groupId={mockGroup.id} />);

      // Act - Type message
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Test message');

      // Change to clearing state
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: true },
        isSending: {},
        error: {},
        sendGroupMessage: mockSendGroupMessage,
        clearGroupMessagesWithAPI: vi.fn(),
        messages: {},
        isLoading: {},
        fetchGroupMessages: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      rerender(<GroupMessageInput groupId={mockGroup.id} />);

      // Assert - Value should be preserved (though input is disabled)
      expect(textarea).toHaveValue('Test message');
    });
  });
});
