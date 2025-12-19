/**
 * GroupList Component Tests.
 *
 * Comprehensive tests for GroupList component covering:
 * - Rendering groups from store
 * - Group selection
 * - Click and keyboard interactions
 * - Loading states
 * - Error states
 * - Empty states
 * - Member display
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GroupList } from '../GroupList';
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
  character_ids: ['char-1', 'char-2', 'char-3'],
};

const mockGroup2: Group = {
  id: 'group-2',
  name: 'Debate Club',
  avatar_url: null,
  created_at: '2025-01-02T12:00:00Z',
  character_ids: ['char-1', 'char-2'],
};

const mockGroups: Group[] = [mockGroup1, mockGroup2];

describe('GroupList Component', () => {
  const mockFetchGroups = vi.fn();
  const mockSelectGroup = vi.fn();
  const mockOnGroupSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockedUseGroupStore.mockReturnValue({
      groups: mockGroups,
      selectedGroupId: null,
      selectedGroup: undefined,
      isLoading: false,
      error: null,
      fetchGroups: mockFetchGroups,
      selectGroup: mockSelectGroup,
      createGroup: vi.fn(),
      updateGroup: vi.fn(),
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

  describe('Rendering', () => {
    it('should render list of groups', () => {
      // Act
      render(<GroupList />);

      // Assert
      expect(screen.getByTestId('group-list')).toBeInTheDocument();
      expect(screen.getByText('Philosophy Circle')).toBeInTheDocument();
      expect(screen.getByText('Debate Club')).toBeInTheDocument();
    });

    it('should render group avatars', () => {
      // Act
      render(<GroupList />);

      // Assert
      const avatars = screen.getAllByRole('img');
      expect(avatars).toHaveLength(1); // Only group-1 has avatar
      expect(avatars[0]).toHaveAttribute('src', '/api/groups/group-1/avatar');
      expect(avatars[0]).toHaveAttribute('alt', 'Philosophy Circle');
    });

    it('should render groups without avatars', () => {
      // Act
      render(<GroupList />);

      // Assert
      const group2Element = screen.getByText('Debate Club').closest('[role="listitem"]');
      expect(group2Element).toBeInTheDocument();
      // Should not have an img element for group-2
      const group2Img = group2Element?.querySelector('img');
      expect(group2Img).toBeNull();
    });

    it('should display member count for each group', () => {
      // Act
      render(<GroupList />);

      // Assert
      expect(screen.getByText(/3 members/i)).toBeInTheDocument();
      expect(screen.getByText(/2 members/i)).toBeInTheDocument();
    });

    it('should display member names for each group', () => {
      // Act
      render(<GroupList />);

      // Assert
      expect(screen.getByText(/Hegel, Marx, Kant/i)).toBeInTheDocument();
      expect(screen.getByText(/Hegel, Marx/i)).toBeInTheDocument();
    });

    it('should limit member names display to first 3 members', () => {
      // Arrange
      const largeGroup: Group = {
        id: 'group-large',
        name: 'Large Group',
        avatar_url: null,
        created_at: '2025-01-03T10:00:00Z',
        character_ids: ['char-1', 'char-2', 'char-3', 'char-4', 'char-5'],
      };
      mockedUseGroupStore.mockReturnValue({
        groups: [largeGroup],
        selectedGroupId: null,
        selectedGroup: undefined,
        isLoading: false,
        error: null,
        fetchGroups: mockFetchGroups,
        selectGroup: mockSelectGroup,
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
        addCharacterToGroup: vi.fn(),
        removeCharacterFromGroup: vi.fn(),
      });

      // Act
      render(<GroupList />);

      // Assert
      const memberText = screen.getByText(/Hegel, Marx, Kant/i);
      expect(memberText).toBeInTheDocument();
      // Should not show char-4 and char-5
      expect(screen.queryByText(/char-4/i)).not.toBeInTheDocument();
    });

    it('should handle groups with unknown character members', () => {
      // Arrange
      const groupWithUnknown: Group = {
        id: 'group-unknown',
        name: 'Unknown Members',
        avatar_url: null,
        created_at: '2025-01-03T10:00:00Z',
        character_ids: ['char-1', 'char-nonexistent'],
      };
      mockedUseGroupStore.mockReturnValue({
        groups: [groupWithUnknown],
        selectedGroupId: null,
        selectedGroup: undefined,
        isLoading: false,
        error: null,
        fetchGroups: mockFetchGroups,
        selectGroup: mockSelectGroup,
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
        addCharacterToGroup: vi.fn(),
        removeCharacterFromGroup: vi.fn(),
      });

      // Act
      render(<GroupList />);

      // Assert
      // Should only show known character name
      expect(screen.getByText(/Hegel/i)).toBeInTheDocument();
      expect(screen.queryByText(/char-nonexistent/i)).not.toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch groups on mount', () => {
      // Act
      render(<GroupList />);

      // Assert
      expect(mockFetchGroups).toHaveBeenCalledTimes(1);
    });

    it('should not fetch groups multiple times on re-renders', () => {
      // Act
      const { rerender } = render(<GroupList />);
      rerender(<GroupList />);

      // Assert
      // Should only fetch once due to useEffect dependency
      expect(mockFetchGroups).toHaveBeenCalledTimes(1);
    });
  });

  describe('Group Selection', () => {
    it('should highlight selected group', () => {
      // Arrange
      mockedUseGroupStore.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: 'group-1',
        selectedGroup: mockGroup1,
        isLoading: false,
        error: null,
        fetchGroups: mockFetchGroups,
        selectGroup: mockSelectGroup,
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
        addCharacterToGroup: vi.fn(),
        removeCharacterFromGroup: vi.fn(),
      });

      // Act
      render(<GroupList />);

      // Assert
      const group1Element = screen.getByText('Philosophy Circle').closest('[role="listitem"]');
      expect(group1Element).toHaveClass('selected');
    });

    it('should call selectGroup when group is clicked', () => {
      // Act
      render(<GroupList />);
      const group1 = screen.getByText('Philosophy Circle');
      fireEvent.click(group1);

      // Assert
      expect(mockSelectGroup).toHaveBeenCalledWith('group-1');
    });

    it('should call onGroupSelect callback when group is clicked', () => {
      // Act
      render(<GroupList onGroupSelect={mockOnGroupSelect} />);
      const group2 = screen.getByText('Debate Club');
      fireEvent.click(group2);

      // Assert
      expect(mockOnGroupSelect).toHaveBeenCalledWith('group-2');
    });

    it('should handle clicking on same group twice', () => {
      // Act
      render(<GroupList />);
      const group1 = screen.getByText('Philosophy Circle');
      fireEvent.click(group1);
      fireEvent.click(group1);

      // Assert
      expect(mockSelectGroup).toHaveBeenCalledTimes(2);
      expect(mockSelectGroup).toHaveBeenCalledWith('group-1');
    });

    it('should handle switching between groups', () => {
      // Act
      render(<GroupList />);
      const group1 = screen.getByText('Philosophy Circle');
      const group2 = screen.getByText('Debate Club');
      fireEvent.click(group1);
      fireEvent.click(group2);

      // Assert
      expect(mockSelectGroup).toHaveBeenCalledWith('group-1');
      expect(mockSelectGroup).toHaveBeenCalledWith('group-2');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should select group on Enter key', () => {
      // Act
      render(<GroupList />);
      const group1 = screen.getByText('Philosophy Circle').closest('[role="listitem"]');
      fireEvent.keyDown(group1!, { key: 'Enter', code: 'Enter' });

      // Assert
      expect(mockSelectGroup).toHaveBeenCalledWith('group-1');
    });

    it('should select group on Space key', () => {
      // Act
      render(<GroupList />);
      const group1 = screen.getByText('Philosophy Circle').closest('[role="listitem"]');
      fireEvent.keyDown(group1!, { key: ' ', code: 'Space' });

      // Assert
      expect(mockSelectGroup).toHaveBeenCalledWith('group-1');
    });

    it('should be focusable with tabIndex', () => {
      // Act
      render(<GroupList />);

      // Assert
      const groupItems = screen.getAllByRole('listitem');
      groupItems.forEach((item) => {
        expect(item).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should not trigger selection on other keys', () => {
      // Act
      render(<GroupList />);
      const group1 = screen.getByText('Philosophy Circle').closest('[role="listitem"]');
      fireEvent.keyDown(group1!, { key: 'a', code: 'KeyA' });

      // Assert
      expect(mockSelectGroup).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator when loading', () => {
      // Arrange
      mockedUseGroupStore.mockReturnValue({
        groups: [],
        selectedGroupId: null,
        selectedGroup: undefined,
        isLoading: true,
        error: null,
        fetchGroups: mockFetchGroups,
        selectGroup: mockSelectGroup,
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
        addCharacterToGroup: vi.fn(),
        removeCharacterFromGroup: vi.fn(),
      });

      // Act
      render(<GroupList />);

      // Assert
      expect(screen.getByText(/loading groups/i)).toBeInTheDocument();
      expect(screen.queryByTestId('group-list')).not.toBeInTheDocument();
    });

    it('should not display groups while loading', () => {
      // Arrange
      mockedUseGroupStore.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: null,
        selectedGroup: undefined,
        isLoading: true,
        error: null,
        fetchGroups: mockFetchGroups,
        selectGroup: mockSelectGroup,
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
        addCharacterToGroup: vi.fn(),
        removeCharacterFromGroup: vi.fn(),
      });

      // Act
      render(<GroupList />);

      // Assert
      expect(screen.queryByText('Philosophy Circle')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when there is an error', () => {
      // Arrange
      mockedUseGroupStore.mockReturnValue({
        groups: [],
        selectedGroupId: null,
        selectedGroup: undefined,
        isLoading: false,
        error: 'Failed to load groups',
        fetchGroups: mockFetchGroups,
        selectGroup: mockSelectGroup,
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
        addCharacterToGroup: vi.fn(),
        removeCharacterFromGroup: vi.fn(),
      });

      // Act
      render(<GroupList />);

      // Assert
      expect(screen.getByText('Failed to load groups')).toBeInTheDocument();
      expect(screen.queryByTestId('group-list')).not.toBeInTheDocument();
    });

    it('should display retry button on error', () => {
      // Arrange
      mockedUseGroupStore.mockReturnValue({
        groups: [],
        selectedGroupId: null,
        selectedGroup: undefined,
        isLoading: false,
        error: 'Network Error',
        fetchGroups: mockFetchGroups,
        selectGroup: mockSelectGroup,
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
        addCharacterToGroup: vi.fn(),
        removeCharacterFromGroup: vi.fn(),
      });

      // Act
      render(<GroupList />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call fetchGroups when retry button is clicked', () => {
      // Arrange
      mockedUseGroupStore.mockReturnValue({
        groups: [],
        selectedGroupId: null,
        selectedGroup: undefined,
        isLoading: false,
        error: 'Network Error',
        fetchGroups: mockFetchGroups,
        selectGroup: mockSelectGroup,
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
        addCharacterToGroup: vi.fn(),
        removeCharacterFromGroup: vi.fn(),
      });

      // Act
      render(<GroupList />);
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Assert
      expect(mockFetchGroups).toHaveBeenCalledTimes(2); // once on mount, once on retry
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no groups exist', () => {
      // Arrange
      mockedUseGroupStore.mockReturnValue({
        groups: [],
        selectedGroupId: null,
        selectedGroup: undefined,
        isLoading: false,
        error: null,
        fetchGroups: mockFetchGroups,
        selectGroup: mockSelectGroup,
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
        addCharacterToGroup: vi.fn(),
        removeCharacterFromGroup: vi.fn(),
      });

      // Act
      render(<GroupList />);

      // Assert
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText(/no groups yet/i)).toBeInTheDocument();
    });

    it('should not display empty state when groups exist', () => {
      // Act
      render(<GroupList />);

      // Assert
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('should display helpful message in empty state', () => {
      // Arrange
      mockedUseGroupStore.mockReturnValue({
        groups: [],
        selectedGroupId: null,
        selectedGroup: undefined,
        isLoading: false,
        error: null,
        fetchGroups: mockFetchGroups,
        selectGroup: mockSelectGroup,
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
        addCharacterToGroup: vi.fn(),
        removeCharacterFromGroup: vi.fn(),
      });

      // Act
      render(<GroupList />);

      // Assert
      expect(screen.getByText(/create one to get started/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role for list', () => {
      // Act
      render(<GroupList />);

      // Assert
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should have proper ARIA role for list items', () => {
      // Act
      render(<GroupList />);

      // Assert
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);
    });

    it('should be keyboard navigable', () => {
      // Act
      render(<GroupList />);

      // Assert
      const items = screen.getAllByRole('listitem');
      items.forEach((item) => {
        expect(item).toHaveAttribute('tabIndex');
      });
    });

    it('should have accessible group names', () => {
      // Act
      render(<GroupList />);

      // Assert
      expect(screen.getByText('Philosophy Circle')).toBeInTheDocument();
      expect(screen.getByText('Debate Club')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle group with no members', () => {
      // Arrange
      const emptyGroup: Group = {
        id: 'group-empty',
        name: 'Empty Group',
        avatar_url: null,
        created_at: '2025-01-03T10:00:00Z',
        character_ids: [],
      };
      mockedUseGroupStore.mockReturnValue({
        groups: [emptyGroup],
        selectedGroupId: null,
        selectedGroup: undefined,
        isLoading: false,
        error: null,
        fetchGroups: mockFetchGroups,
        selectGroup: mockSelectGroup,
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
        addCharacterToGroup: vi.fn(),
        removeCharacterFromGroup: vi.fn(),
      });

      // Act
      render(<GroupList />);

      // Assert
      expect(screen.getByText('Empty Group')).toBeInTheDocument();
      expect(screen.getByText(/0 members/i)).toBeInTheDocument();
    });

    it('should handle very long group names', () => {
      // Arrange
      const longNameGroup: Group = {
        id: 'group-long',
        name: 'A'.repeat(100),
        avatar_url: null,
        created_at: '2025-01-03T10:00:00Z',
        character_ids: ['char-1'],
      };
      mockedUseGroupStore.mockReturnValue({
        groups: [longNameGroup],
        selectedGroupId: null,
        selectedGroup: undefined,
        isLoading: false,
        error: null,
        fetchGroups: mockFetchGroups,
        selectGroup: mockSelectGroup,
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
        addCharacterToGroup: vi.fn(),
        removeCharacterFromGroup: vi.fn(),
      });

      // Act
      render(<GroupList />);

      // Assert
      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
    });

    it('should handle rapid group selection changes', () => {
      // Act
      render(<GroupList />);
      const group1 = screen.getByText('Philosophy Circle');
      const group2 = screen.getByText('Debate Club');

      // Rapidly click between groups
      fireEvent.click(group1);
      fireEvent.click(group2);
      fireEvent.click(group1);
      fireEvent.click(group2);

      // Assert
      expect(mockSelectGroup).toHaveBeenCalledTimes(4);
    });

    it('should handle missing character store data gracefully', () => {
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
      render(<GroupList />);

      // Assert
      expect(screen.getByText('Philosophy Circle')).toBeInTheDocument();
      // Should not crash even though character data is missing
    });
  });

  describe('Visual States', () => {
    it('should apply selected class only to selected group', () => {
      // Arrange
      mockedUseGroupStore.mockReturnValue({
        groups: mockGroups,
        selectedGroupId: 'group-1',
        selectedGroup: mockGroup1,
        isLoading: false,
        error: null,
        fetchGroups: mockFetchGroups,
        selectGroup: mockSelectGroup,
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
        deleteGroup: vi.fn(),
        addCharacterToGroup: vi.fn(),
        removeCharacterFromGroup: vi.fn(),
      });

      // Act
      render(<GroupList />);

      // Assert
      const group1Element = screen.getByText('Philosophy Circle').closest('[role="listitem"]');
      const group2Element = screen.getByText('Debate Club').closest('[role="listitem"]');
      expect(group1Element).toHaveClass('selected');
      expect(group2Element).not.toHaveClass('selected');
    });

    it('should not have selected class when no group is selected', () => {
      // Act
      render(<GroupList />);

      // Assert
      const groupElements = screen.getAllByRole('listitem');
      groupElements.forEach((element) => {
        expect(element).not.toHaveClass('selected');
      });
    });
  });
});
