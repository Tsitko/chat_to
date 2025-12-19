/**
 * GroupModal Component Tests.
 *
 * Comprehensive tests for GroupModal component covering:
 * - Modal visibility (create/edit modes)
 * - Form rendering and inputs
 * - Validation (name required, minimum 2 members)
 * - Avatar upload
 * - Character selection (checkboxes)
 * - Form submission (create/update)
 * - Loading states
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GroupModal } from '../GroupModal';
import { useGroupStore } from '../../store/groupStore';
import { useCharacterStore } from '../../store/characterStore';
import type { Group } from '../../types/group';
import type { Character } from '../../types/character';

// Mock the stores
vi.mock('../../store/groupStore');
vi.mock('../../store/characterStore');
const mockedUseGroupStore = vi.mocked(useGroupStore);
const mockedUseCharacterStore = vi.mocked(useCharacterStore);

// Mock data
const mockCharacter1: Character = {
  id: 'char-1',
  name: 'Hegel',
  avatar_url: '/api/characters/char-1/avatar',
  created_at: '2025-01-01T10:00:00Z',
};

const mockCharacter2: Character = {
  id: 'char-2',
  name: 'Marx',
  avatar_url: '/api/characters/char-2/avatar',
  created_at: '2025-01-01T11:00:00Z',
};

const mockCharacter3: Character = {
  id: 'char-3',
  name: 'Kant',
  avatar_url: '/api/characters/char-3/avatar',
  created_at: '2025-01-01T12:00:00Z',
};

const mockGroup1: Group = {
  id: 'group-1',
  name: 'Philosophy Circle',
  avatar_url: '/api/groups/group-1/avatar',
  created_at: '2025-01-01T10:00:00Z',
  character_ids: ['char-1', 'char-2'],
};

const mockAvatarFile = new File(['avatar'], 'group-avatar.jpg', { type: 'image/jpeg' });

describe('GroupModal Component', () => {
  const mockCreateGroup = vi.fn();
  const mockUpdateGroup = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockedUseGroupStore.mockReturnValue({
      groups: [mockGroup1],
      selectedGroupId: null,
      selectedGroup: undefined,
      isLoading: false,
      error: null,
      fetchGroups: vi.fn(),
      selectGroup: vi.fn(),
      createGroup: mockCreateGroup,
      updateGroup: mockUpdateGroup,
      deleteGroup: vi.fn(),
      addCharacterToGroup: vi.fn(),
      removeCharacterFromGroup: vi.fn(),
    });

    mockedUseCharacterStore.mockReturnValue({
      characters: [mockCharacter1, mockCharacter2, mockCharacter3],
      selectedCharacterId: null,
      selectedCharacter: null,
      isLoading: false,
      error: null,
      fetchCharacters: vi.fn(),
      selectCharacter: vi.fn(),
      createCharacter: vi.fn(),
      updateCharacter: vi.fn(),
      deleteCharacter: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Modal Visibility', () => {
    it('should not render when isOpen is false', () => {
      // Act
      render(<GroupModal isOpen={false} onClose={mockOnClose} />);

      // Assert
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const closeButton = screen.getByRole('button', { name: /close|cancel/i });
      fireEvent.click(closeButton);

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Create Mode', () => {
    it('should display "Create Group" title when groupId is undefined', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByText(/create group/i)).toBeInTheDocument();
    });

    it('should render empty form in create mode', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      const nameInput = screen.getByLabelText(/group name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('');
    });

    it('should render all available characters as checkboxes', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByLabelText(/hegel/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/marx/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/kant/i)).toBeInTheDocument();
    });

    it('should have all checkboxes unchecked initially in create mode', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('should display Create button in create mode', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should display "Edit Group" title when groupId is provided', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} groupId="group-1" />);

      // Assert
      expect(screen.getByText(/edit group/i)).toBeInTheDocument();
    });

    it('should pre-fill group name in edit mode', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} groupId="group-1" />);

      // Assert
      const nameInput = screen.getByLabelText(/group name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Philosophy Circle');
    });

    it('should pre-select group members in edit mode', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} groupId="group-1" />);

      // Assert
      const hegelCheckbox = screen.getByLabelText(/hegel/i) as HTMLInputElement;
      const marxCheckbox = screen.getByLabelText(/marx/i) as HTMLInputElement;
      const kantCheckbox = screen.getByLabelText(/kant/i) as HTMLInputElement;

      expect(hegelCheckbox).toBeChecked();
      expect(marxCheckbox).toBeChecked();
      expect(kantCheckbox).not.toBeChecked();
    });

    it('should display Update button in edit mode', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} groupId="group-1" />);

      // Assert
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('should display current avatar preview in edit mode', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} groupId="group-1" />);

      // Assert
      const avatarPreview = screen.getByAltText(/group avatar preview/i);
      expect(avatarPreview).toHaveAttribute('src', '/api/groups/group-1/avatar');
    });
  });

  describe('Form Inputs', () => {
    it('should update group name on input change', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const nameInput = screen.getByLabelText(/group name/i) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'New Group Name' } });

      // Assert
      expect(nameInput.value).toBe('New Group Name');
    });

    it('should toggle character selection on checkbox click', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const hegelCheckbox = screen.getByLabelText(/hegel/i) as HTMLInputElement;

      // Initially unchecked
      expect(hegelCheckbox).not.toBeChecked();

      // Click to check
      fireEvent.click(hegelCheckbox);
      expect(hegelCheckbox).toBeChecked();

      // Click again to uncheck
      fireEvent.click(hegelCheckbox);
      expect(hegelCheckbox).not.toBeChecked();
    });

    it('should allow selecting multiple characters', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const hegelCheckbox = screen.getByLabelText(/hegel/i);
      const marxCheckbox = screen.getByLabelText(/marx/i);
      const kantCheckbox = screen.getByLabelText(/kant/i);

      fireEvent.click(hegelCheckbox);
      fireEvent.click(marxCheckbox);
      fireEvent.click(kantCheckbox);

      // Assert
      expect(hegelCheckbox).toBeChecked();
      expect(marxCheckbox).toBeChecked();
      expect(kantCheckbox).toBeChecked();
    });

    it('should handle avatar file selection', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const fileInput = screen.getByLabelText(/group avatar/i) as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [mockAvatarFile] } });

      // Assert
      expect(fileInput.files).toHaveLength(1);
      expect(fileInput.files![0]).toBe(mockAvatarFile);
    });

    it('should display avatar preview after file selection', async () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const fileInput = screen.getByLabelText(/group avatar/i) as HTMLInputElement;

      // Mock URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

      fireEvent.change(fileInput, { target: { files: [mockAvatarFile] } });

      // Assert
      await waitFor(() => {
        const preview = screen.getByAltText(/group avatar preview/i);
        expect(preview).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show error when group name is empty on submit', async () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const submitButton = screen.getByRole('button', { name: /create/i });

      // Select 2 members but leave name empty
      fireEvent.click(screen.getByLabelText(/hegel/i));
      fireEvent.click(screen.getByLabelText(/marx/i));
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/group name is required/i)).toBeInTheDocument();
      });
      expect(mockCreateGroup).not.toHaveBeenCalled();
    });

    it('should show error when less than 2 members selected on submit', async () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      // Enter name but only select 1 member
      fireEvent.change(nameInput, { target: { value: 'Test Group' } });
      fireEvent.click(screen.getByLabelText(/hegel/i));
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/select at least 2 characters/i)).toBeInTheDocument();
      });
      expect(mockCreateGroup).not.toHaveBeenCalled();
    });

    it('should show error when no members selected on submit', async () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      fireEvent.change(nameInput, { target: { value: 'Test Group' } });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/select at least 2 characters/i)).toBeInTheDocument();
      });
      expect(mockCreateGroup).not.toHaveBeenCalled();
    });

    it('should not show validation errors initially', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      expect(screen.queryByText(/group name is required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/select at least 2 characters/i)).not.toBeInTheDocument();
    });

    it('should clear validation errors when fixing issues', async () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      // Trigger validation error
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText(/group name is required/i)).toBeInTheDocument();
      });

      // Fix the error
      fireEvent.change(nameInput, { target: { value: 'Test Group' } });
      fireEvent.click(screen.getByLabelText(/hegel/i));
      fireEvent.click(screen.getByLabelText(/marx/i));
      fireEvent.click(submitButton);

      // Assert - error should be gone
      await waitFor(() => {
        expect(screen.queryByText(/group name is required/i)).not.toBeInTheDocument();
      });
    });

    it('should trim whitespace from group name before validation', async () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      // Enter only whitespace
      fireEvent.change(nameInput, { target: { value: '   ' } });
      fireEvent.click(screen.getByLabelText(/hegel/i));
      fireEvent.click(screen.getByLabelText(/marx/i));
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/group name is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission - Create', () => {
    it('should call createGroup with correct data on valid submission', async () => {
      // Arrange
      mockCreateGroup.mockResolvedValue(undefined);

      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      fireEvent.change(nameInput, { target: { value: 'New Group' } });
      fireEvent.click(screen.getByLabelText(/hegel/i));
      fireEvent.click(screen.getByLabelText(/marx/i));
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockCreateGroup).toHaveBeenCalledWith(
          'New Group',
          expect.arrayContaining(['char-1', 'char-2']),
          undefined
        );
      });
    });

    it('should call createGroup with avatar when avatar is uploaded', async () => {
      // Arrange
      mockCreateGroup.mockResolvedValue(undefined);
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const nameInput = screen.getByLabelText(/group name/i);
      const fileInput = screen.getByLabelText(/group avatar/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /create/i });

      fireEvent.change(nameInput, { target: { value: 'New Group' } });
      fireEvent.change(fileInput, { target: { files: [mockAvatarFile] } });
      fireEvent.click(screen.getByLabelText(/hegel/i));
      fireEvent.click(screen.getByLabelText(/marx/i));
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockCreateGroup).toHaveBeenCalledWith(
          'New Group',
          expect.arrayContaining(['char-1', 'char-2']),
          mockAvatarFile
        );
      });
    });

    it('should close modal after successful create', async () => {
      // Arrange
      mockCreateGroup.mockResolvedValue(undefined);

      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      fireEvent.change(nameInput, { target: { value: 'New Group' } });
      fireEvent.click(screen.getByLabelText(/hegel/i));
      fireEvent.click(screen.getByLabelText(/marx/i));
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle creating group with all characters', async () => {
      // Arrange
      mockCreateGroup.mockResolvedValue(undefined);

      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      fireEvent.change(nameInput, { target: { value: 'All Philosophers' } });
      fireEvent.click(screen.getByLabelText(/hegel/i));
      fireEvent.click(screen.getByLabelText(/marx/i));
      fireEvent.click(screen.getByLabelText(/kant/i));
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockCreateGroup).toHaveBeenCalledWith(
          'All Philosophers',
          expect.arrayContaining(['char-1', 'char-2', 'char-3']),
          undefined
        );
      });
    });
  });

  describe('Form Submission - Update', () => {
    it('should call updateGroup with correct data on valid submission', async () => {
      // Arrange
      mockUpdateGroup.mockResolvedValue(undefined);

      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} groupId="group-1" />);
      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole('button', { name: /update/i });

      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockUpdateGroup).toHaveBeenCalledWith(
          'group-1',
          'Updated Name',
          expect.arrayContaining(['char-1', 'char-2']),
          undefined
        );
      });
    });

    it('should call updateGroup with updated member list', async () => {
      // Arrange
      mockUpdateGroup.mockResolvedValue(undefined);

      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} groupId="group-1" />);
      const submitButton = screen.getByRole('button', { name: /update/i });

      // Add Kant to the group
      fireEvent.click(screen.getByLabelText(/kant/i));
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockUpdateGroup).toHaveBeenCalledWith(
          'group-1',
          'Philosophy Circle',
          expect.arrayContaining(['char-1', 'char-2', 'char-3']),
          undefined
        );
      });
    });

    it('should close modal after successful update', async () => {
      // Arrange
      mockUpdateGroup.mockResolvedValue(undefined);

      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} groupId="group-1" />);
      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole('button', { name: /update/i });

      fireEvent.change(nameInput, { target: { value: 'Updated' } });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Loading State', () => {
    it('should disable submit button while loading', () => {
      // Arrange
      mockedUseGroupStore.mockReturnValue({
        groups: [mockGroup1],
        selectedGroupId: null,
        selectedGroup: undefined,
        isLoading: true,
        error: null,
        fetchGroups: vi.fn(),
        selectGroup: vi.fn(),
        createGroup: mockCreateGroup,
        updateGroup: mockUpdateGroup,
        deleteGroup: vi.fn(),
        addCharacterToGroup: vi.fn(),
        removeCharacterFromGroup: vi.fn(),
      });

      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const submitButton = screen.getByRole('button', { name: /create/i });

      // Assert
      expect(submitButton).toBeDisabled();
    });

    it('should disable cancel button while loading', () => {
      // Arrange
      mockedUseGroupStore.mockReturnValue({
        groups: [mockGroup1],
        selectedGroupId: null,
        selectedGroup: undefined,
        isLoading: true,
        error: null,
        fetchGroups: vi.fn(),
        selectGroup: vi.fn(),
        createGroup: mockCreateGroup,
        updateGroup: mockUpdateGroup,
        deleteGroup: vi.fn(),
        addCharacterToGroup: vi.fn(),
        removeCharacterFromGroup: vi.fn(),
      });

      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      // Assert
      expect(cancelButton).toBeDisabled();
    });

    it('should show loading indicator in submit button while loading', () => {
      // Arrange
      mockedUseGroupStore.mockReturnValue({
        groups: [mockGroup1],
        selectedGroupId: null,
        selectedGroup: undefined,
        isLoading: true,
        error: null,
        fetchGroups: vi.fn(),
        selectGroup: vi.fn(),
        createGroup: mockCreateGroup,
        updateGroup: mockUpdateGroup,
        deleteGroup: vi.fn(),
        addCharacterToGroup: vi.fn(),
        removeCharacterFromGroup: vi.fn(),
      });

      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Form Reset', () => {
    it('should reset form when modal is closed and reopened in create mode', async () => {
      // Act
      const { rerender } = render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const nameInput = screen.getByLabelText(/group name/i) as HTMLInputElement;

      // Fill form
      fireEvent.change(nameInput, { target: { value: 'Test Group' } });
      fireEvent.click(screen.getByLabelText(/hegel/i));

      // Close modal
      rerender(<GroupModal isOpen={false} onClose={mockOnClose} />);

      // Reopen modal
      rerender(<GroupModal isOpen={true} onClose={mockOnClose} />);

      // Assert - form should be reset
      const resetNameInput = screen.getByLabelText(/group name/i) as HTMLInputElement;
      const hegelCheckbox = screen.getByLabelText(/hegel/i) as HTMLInputElement;

      expect(resetNameInput.value).toBe('');
      expect(hegelCheckbox).not.toBeChecked();
    });

    it('should reload group data when switching from create to edit mode', () => {
      // Act
      const { rerender } = render(<GroupModal isOpen={true} onClose={mockOnClose} />);

      // Switch to edit mode
      rerender(<GroupModal isOpen={true} onClose={mockOnClose} groupId="group-1" />);

      // Assert
      const nameInput = screen.getByLabelText(/group name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Philosophy Circle');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for all form inputs', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByLabelText(/group name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/group avatar/i)).toBeInTheDocument();
      expect(screen.getByText(/select members/i)).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for required fields', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      const nameInput = screen.getByLabelText(/group name/i);
      expect(nameInput).toBeRequired();
    });

    it('should display error messages with proper ARIA attributes', async () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const submitButton = screen.getByRole('button', { name: /create/i });

      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        const errorMessage = screen.getByText(/group name is required/i);
        expect(errorMessage).toHaveClass('error');
      });
    });

    it('should have keyboard-accessible checkboxes', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const hegelCheckbox = screen.getByLabelText(/hegel/i);

      // Simulate keyboard navigation
      hegelCheckbox.focus();
      fireEvent.keyDown(hegelCheckbox, { key: ' ', code: 'Space' });

      // Assert
      expect(hegelCheckbox).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty character list gracefully', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: [],
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: vi.fn(),
        selectCharacter: vi.fn(),
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByText(/select members/i)).toBeInTheDocument();
      // Should not crash even with no characters available
    });

    it('should handle very long group names', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const nameInput = screen.getByLabelText(/group name/i) as HTMLInputElement;

      const longName = 'A'.repeat(200);
      fireEvent.change(nameInput, { target: { value: longName } });

      // Assert
      expect(nameInput.value).toBe(longName);
    });

    it('should handle special characters in group name', async () => {
      // Arrange
      mockCreateGroup.mockResolvedValue(undefined);

      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      const specialName = '!@#$%^&*()_+ <>"{}[]';
      fireEvent.change(nameInput, { target: { value: specialName } });
      fireEvent.click(screen.getByLabelText(/hegel/i));
      fireEvent.click(screen.getByLabelText(/marx/i));
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockCreateGroup).toHaveBeenCalledWith(
          specialName,
          expect.anything(),
          undefined
        );
      });
    });

    it('should handle editing nonexistent group gracefully', () => {
      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} groupId="nonexistent" />);

      // Assert
      // Should not crash, should show empty form or handle gracefully
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle rapid form submissions', async () => {
      // Arrange
      mockCreateGroup.mockResolvedValue(undefined);

      // Act
      render(<GroupModal isOpen={true} onClose={mockOnClose} />);
      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      fireEvent.change(nameInput, { target: { value: 'Test' } });
      fireEvent.click(screen.getByLabelText(/hegel/i));
      fireEvent.click(screen.getByLabelText(/marx/i));

      // Rapidly click submit
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);

      // Assert - should only call once or handle gracefully
      await waitFor(() => {
        expect(mockCreateGroup).toHaveBeenCalled();
      });
    });
  });
});
