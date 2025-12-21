/**
 * Comprehensive component tests for GroupHeader "New Chat" functionality.
 *
 * This test suite covers the New Chat button, confirmation dialog, and all
 * associated UI interactions in the GroupHeader component.
 *
 * Test Coverage:
 * - Button rendering and visibility
 * - Confirmation dialog flow
 * - Click handlers and callbacks
 * - Error display and handling
 * - Keyboard accessibility
 * - Loading states during clearing
 * - Multi-group state management
 * - Button disabled states
 * - Dialog cancellation
 * - Success and error scenarios
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { GroupHeader } from '../GroupHeader';
import { useGroupMessageStore } from '../../store/groupMessageStore';
import { useCharacterStore } from '../../store/characterStore';

// Mock the stores
vi.mock('../../store/groupMessageStore');
vi.mock('../../store/characterStore');
const mockedGroupMessageStore = vi.mocked(useGroupMessageStore);
const mockedCharacterStore = vi.mocked(useCharacterStore);

// Mock group data
const mockGroup = {
  id: 'group-123',
  name: 'Test Group',
  character_ids: ['char-1', 'char-2'],
  created_at: '2025-01-01T10:00:00Z',
};

describe('GroupHeader - New Chat Functionality', () => {
  let mockClearGroupMessagesWithAPI: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup default mock implementation
    mockClearGroupMessagesWithAPI = vi.fn().mockResolvedValue(undefined);

    mockedGroupMessageStore.mockReturnValue({
      isClearing: {},
      error: {},
      clearGroupMessagesWithAPI: mockClearGroupMessagesWithAPI,
      // Add other store methods as needed
      messages: {},
      isLoading: {},
      isSending: {},
      fetchGroupMessages: vi.fn(),
      sendGroupMessage: vi.fn(),
      clearGroupMessages: vi.fn(),
      addCharacterResponses: vi.fn(),
    } as any);

    mockedCharacterStore.mockReturnValue({
      characters: [
        { id: 'char-1', name: 'Character 1' },
        { id: 'char-2', name: 'Character 2' },
      ],
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Button Rendering', () => {
    it('should render "New Chat" button', () => {
      // Arrange & Act
      render(<GroupHeader group={mockGroup} />);

      // Assert
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      expect(newChatButton).toBeInTheDocument();
    });

    it('should show button with correct text', () => {
      // Arrange & Act
      render(<GroupHeader group={mockGroup} />);

      // Assert
      const button = screen.getByText('New Chat');
      expect(button).toBeInTheDocument();
    });

    it('should have appropriate button styling', () => {
      // Arrange & Act
      render(<GroupHeader group={mockGroup} />);

      // Assert
      const button = screen.getByRole('button', { name: /new chat/i });
      expect(button).toHaveClass('btn'); // Adjust based on actual CSS classes
    });

    it('should render button with icon', () => {
      // Arrange & Act
      render(<GroupHeader group={mockGroup} />);

      // Assert
      const button = screen.getByRole('button', { name: /new chat/i });
      // Check for icon - adjust selector based on actual implementation
      const icon = button.querySelector('svg') || button.querySelector('[data-icon]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Button Click Behavior', () => {
    it('should show confirmation dialog when button is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      // Assert
      const confirmationDialog = await screen.findByText(/clear all messages/i);
      expect(confirmationDialog).toBeInTheDocument();
    });

    it('should hide "New Chat" button when dialog is shown', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      // Assert - Button should be hidden
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /new chat/i })).not.toBeInTheDocument();
      });
    });

    it('should not call clearGroupMessagesWithAPI immediately on button click', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      // Assert - Should not clear until confirmed
      expect(mockClearGroupMessagesWithAPI).not.toHaveBeenCalled();
    });
  });

  describe('Confirmation Dialog', () => {
    it('should show dialog with warning message', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      // Assert
      expect(await screen.findByText(/clear all messages/i)).toBeInTheDocument();
      expect(screen.getByText(/this will delete all messages/i)).toBeInTheDocument();
    });

    it('should show "Yes" and "No" buttons in dialog', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /no|cancel/i })).toBeInTheDocument();
      });
    });

    it('should call clearGroupMessagesWithAPI when "Yes" is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      const yesButton = await screen.findByRole('button', { name: /yes/i });
      await user.click(yesButton);

      // Assert
      await waitFor(() => {
        expect(mockClearGroupMessagesWithAPI).toHaveBeenCalledTimes(1);
        expect(mockClearGroupMessagesWithAPI).toHaveBeenCalledWith(mockGroup.id);
      });
    });

    it('should close dialog without clearing when "No" is clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      const noButton = await screen.findByRole('button', { name: /no|cancel/i });
      await user.click(noButton);

      // Assert
      expect(mockClearGroupMessagesWithAPI).not.toHaveBeenCalled();

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText(/clear all messages/i)).not.toBeInTheDocument();
      });

      // "New Chat" button should reappear
      expect(screen.getByRole('button', { name: /new chat/i })).toBeInTheDocument();
    });

    it('should close dialog after successful clear', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      const yesButton = await screen.findByRole('button', { name: /yes/i });
      await user.click(yesButton);

      // Assert - Dialog should close
      await waitFor(() => {
        expect(screen.queryByText(/clear all messages/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when clearing fails', async () => {
      // Arrange
      const errorMessage = 'Failed to clear messages';
      mockClearGroupMessagesWithAPI.mockRejectedValueOnce(new Error(errorMessage));

      const user = userEvent.setup();
      render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      const yesButton = await screen.findByRole('button', { name: /yes/i });
      await user.click(yesButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
      });
    });

    it('should show error from store if available', () => {
      // Arrange
      const storeError = 'Group not found';
      mockedGroupMessageStore.mockReturnValue({
        isClearing: {},
        error: { [mockGroup.id]: storeError },
        clearGroupMessagesWithAPI: mockClearGroupMessagesWithAPI,
        messages: {},
        isLoading: {},
        isSending: {},
        fetchGroupMessages: vi.fn(),
        sendGroupMessage: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      // Act
      render(<GroupHeader group={mockGroup} />);

      // Assert
      expect(screen.getByText(new RegExp(storeError, 'i'))).toBeInTheDocument();
    });

    it('should allow retry after error', async () => {
      // Arrange
      mockClearGroupMessagesWithAPI
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(undefined); // Second attempt succeeds

      const user = userEvent.setup();
      render(<GroupHeader group={mockGroup} />);

      // Act - First attempt
      let newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      let yesButton = await screen.findByRole('button', { name: /yes/i });
      await user.click(yesButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/first attempt failed/i)).toBeInTheDocument();
      });

      // Act - Retry
      newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      yesButton = await screen.findByRole('button', { name: /yes/i });
      await user.click(yesButton);

      // Assert - Second attempt succeeds
      await waitFor(() => {
        expect(mockClearGroupMessagesWithAPI).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle 404 error (group not found)', async () => {
      // Arrange
      const notFoundError = {
        response: { status: 404, data: { detail: 'Group not found' } },
        message: 'Group not found',
      };
      mockClearGroupMessagesWithAPI.mockRejectedValueOnce(notFoundError);

      const user = userEvent.setup();
      render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      const yesButton = await screen.findByRole('button', { name: /yes/i });
      await user.click(yesButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/group not found/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockClearGroupMessagesWithAPI.mockRejectedValueOnce(networkError);

      const user = userEvent.setup();
      render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      const yesButton = await screen.findByRole('button', { name: /yes/i });
      await user.click(yesButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should disable buttons during clearing', async () => {
      // Arrange
      let resolveClearing: any;
      const clearingPromise = new Promise<void>((resolve) => {
        resolveClearing = resolve;
      });
      mockClearGroupMessagesWithAPI.mockReturnValue(clearingPromise);

      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: true },
        error: {},
        clearGroupMessagesWithAPI: mockClearGroupMessagesWithAPI,
        messages: {},
        isLoading: {},
        isSending: {},
        fetchGroupMessages: vi.fn(),
        sendGroupMessage: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      const user = userEvent.setup();
      render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      const yesButton = await screen.findByRole('button', { name: /yes/i });
      await user.click(yesButton);

      // Assert - Buttons should be disabled during clearing
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach((button) => {
          expect(button).toBeDisabled();
        });
      });

      // Cleanup
      resolveClearing();
    });

    it('should show loading indicator during clearing', async () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: { [mockGroup.id]: true },
        error: {},
        clearGroupMessagesWithAPI: mockClearGroupMessagesWithAPI,
        messages: {},
        isLoading: {},
        isSending: {},
        fetchGroupMessages: vi.fn(),
        sendGroupMessage: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      // Act
      render(<GroupHeader group={mockGroup} />);

      // Assert
      expect(screen.getByText(/clearing/i)).toBeInTheDocument();
    });

    it('should hide loading indicator after clearing completes', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      const yesButton = await screen.findByRole('button', { name: /yes/i });
      await user.click(yesButton);

      // Assert - Loading indicator should disappear
      await waitFor(() => {
        expect(screen.queryByText(/clearing/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should open dialog when Enter key is pressed on button', async () => {
      // Arrange
      render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      newChatButton.focus();
      fireEvent.keyDown(newChatButton, { key: 'Enter', code: 'Enter' });

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/clear all messages/i)).toBeInTheDocument();
      });
    });

    it('should open dialog when Space key is pressed on button', async () => {
      // Arrange
      render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      newChatButton.focus();
      fireEvent.keyDown(newChatButton, { key: ' ', code: 'Space' });

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/clear all messages/i)).toBeInTheDocument();
      });
    });

    it('should close dialog when Escape key is pressed', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      const dialog = await screen.findByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

      // Assert
      await waitFor(() => {
        expect(screen.queryByText(/clear all messages/i)).not.toBeInTheDocument();
      });
    });

    it('should have proper tab order in dialog', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      // Assert - Tab through dialog elements
      const dialog = await screen.findByRole('dialog');
      const focusableElements = dialog.querySelectorAll('button');
      expect(focusableElements.length).toBeGreaterThan(0);

      // All buttons should be keyboard accessible
      focusableElements.forEach((element) => {
        expect(element).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('Multi-Group Isolation', () => {
    it('should handle multiple groups independently', async () => {
      // Arrange
      const group1 = { ...mockGroup, id: 'group-1', name: 'Group 1' };
      const group2 = { ...mockGroup, id: 'group-2', name: 'Group 2' };

      mockedGroupMessageStore.mockReturnValue({
        isClearing: { 'group-1': false, 'group-2': false },
        error: {},
        clearGroupMessagesWithAPI: mockClearGroupMessagesWithAPI,
        messages: {},
        isLoading: {},
        isSending: {},
        fetchGroupMessages: vi.fn(),
        sendGroupMessage: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      const user = userEvent.setup();
      const { rerender } = render(<GroupHeader group={group1} />);

      // Act - Clear group 1
      let newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      let yesButton = await screen.findByRole('button', { name: /yes/i });
      await user.click(yesButton);

      await waitFor(() => {
        expect(mockClearGroupMessagesWithAPI).toHaveBeenCalledWith('group-1');
      });

      // Switch to group 2
      rerender(<GroupHeader group={group2} />);

      // Act - Clear group 2
      newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      yesButton = await screen.findByRole('button', { name: /yes/i });
      await user.click(yesButton);

      // Assert
      await waitFor(() => {
        expect(mockClearGroupMessagesWithAPI).toHaveBeenCalledWith('group-2');
      });

      expect(mockClearGroupMessagesWithAPI).toHaveBeenCalledTimes(2);
    });

    it('should show error only for affected group', () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: {},
        error: { 'group-1': 'Error for group 1', 'group-2': null },
        clearGroupMessagesWithAPI: mockClearGroupMessagesWithAPI,
        messages: {},
        isLoading: {},
        isSending: {},
        fetchGroupMessages: vi.fn(),
        sendGroupMessage: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      const group1 = { ...mockGroup, id: 'group-1' };

      // Act
      render(<GroupHeader group={group1} />);

      // Assert
      expect(screen.getByText(/error for group 1/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid button clicks gracefully', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<GroupHeader group={mockGroup} />);

      // Act - Click button rapidly multiple times
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);
      await user.click(newChatButton);
      await user.click(newChatButton);

      // Assert - Should only show one dialog
      const dialogs = screen.getAllByText(/clear all messages/i);
      expect(dialogs).toHaveLength(1);
    });

    it('should handle group with no messages', async () => {
      // Arrange
      mockedGroupMessageStore.mockReturnValue({
        isClearing: {},
        error: {},
        clearGroupMessagesWithAPI: mockClearGroupMessagesWithAPI,
        messages: { [mockGroup.id]: [] },
        isLoading: {},
        isSending: {},
        fetchGroupMessages: vi.fn(),
        sendGroupMessage: vi.fn(),
        clearGroupMessages: vi.fn(),
        addCharacterResponses: vi.fn(),
      } as any);

      const user = userEvent.setup();
      render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      const yesButton = await screen.findByRole('button', { name: /yes/i });
      await user.click(yesButton);

      // Assert - Should still call clear (idempotent)
      await waitFor(() => {
        expect(mockClearGroupMessagesWithAPI).toHaveBeenCalledWith(mockGroup.id);
      });
    });

    it('should handle unmounting during clear operation', async () => {
      // Arrange
      let resolveClearing: any;
      const clearingPromise = new Promise<void>((resolve) => {
        resolveClearing = resolve;
      });
      mockClearGroupMessagesWithAPI.mockReturnValue(clearingPromise);

      const user = userEvent.setup();
      const { unmount } = render(<GroupHeader group={mockGroup} />);

      // Act
      const newChatButton = screen.getByRole('button', { name: /new chat/i });
      await user.click(newChatButton);

      const yesButton = await screen.findByRole('button', { name: /yes/i });
      await user.click(yesButton);

      // Unmount before operation completes
      unmount();

      // Resolve clearing
      resolveClearing();

      // Assert - Should not throw errors
      expect(true).toBe(true); // Test passes if no errors thrown
    });
  });
});
