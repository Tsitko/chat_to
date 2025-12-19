/**
 * Group Store Unit Tests.
 *
 * Comprehensive tests for Zustand group store covering:
 * - State initialization
 * - Fetching groups
 * - Creating groups (with 2+ member validation)
 * - Updating groups
 * - Deleting groups
 * - Adding/removing members
 * - Loading states
 * - Error handling
 * - Selection state management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useGroupStore } from '../groupStore';
import { apiService } from '../../services/api';
import type { Group } from '../../types/group';

// Mock the API service
vi.mock('../../services/api');
const mockedApiService = vi.mocked(apiService, true);

// Mock data
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
  character_ids: ['char-1', 'char-4'],
};

const mockGroups: Group[] = [mockGroup1, mockGroup2];

const mockAvatarFile = new File(['avatar'], 'group-avatar.jpg', { type: 'image/jpeg' });

describe('GroupStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useGroupStore.getState();
    store.groups = [];
    store.selectedGroupId = null;
    store.selectedGroup = undefined;
    store.isLoading = false;
    store.error = null;

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      // Arrange & Act
      const store = useGroupStore.getState();

      // Assert
      expect(store.groups).toEqual([]);
      expect(store.selectedGroupId).toBeNull();
      expect(store.selectedGroup).toBeUndefined();
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe('fetchGroups', () => {
    it('should fetch all groups successfully', async () => {
      // Arrange
      mockedApiService.getGroups = vi.fn().mockResolvedValue(mockGroups);

      // Act
      await useGroupStore.getState().fetchGroups();

      // Assert
      expect(mockedApiService.getGroups).toHaveBeenCalledTimes(1);
      const store = useGroupStore.getState();
      expect(store.groups).toEqual(mockGroups);
      expect(store.groups).toHaveLength(2);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should set loading state while fetching groups', async () => {
      // Arrange
      let resolveFetch: any;
      const promise = new Promise<Group[]>((resolve) => {
        resolveFetch = resolve;
      });
      mockedApiService.getGroups = vi.fn().mockReturnValue(promise);

      // Act
      const fetchPromise = useGroupStore.getState().fetchGroups();

      // Assert - loading should be true during fetch
      expect(useGroupStore.getState().isLoading).toBe(true);

      // Resolve the promise
      resolveFetch(mockGroups);
      await fetchPromise;

      // Assert - loading should be false after fetch
      expect(useGroupStore.getState().isLoading).toBe(false);
    });

    it('should handle empty groups response', async () => {
      // Arrange
      mockedApiService.getGroups = vi.fn().mockResolvedValue([]);

      // Act
      await useGroupStore.getState().fetchGroups();

      // Assert
      const store = useGroupStore.getState();
      expect(store.groups).toEqual([]);
      expect(store.groups).toHaveLength(0);
      expect(store.error).toBeNull();
    });

    it('should handle network error when fetching groups', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedApiService.getGroups = vi.fn().mockRejectedValue(networkError);

      // Act
      await useGroupStore.getState().fetchGroups();

      // Assert
      const store = useGroupStore.getState();
      expect(store.groups).toEqual([]);
      expect(store.error).toBe('Network Error');
      expect(store.isLoading).toBe(false);
    });

    it('should clear previous error on successful fetch', async () => {
      // Arrange
      useGroupStore.getState().error = 'Previous error';
      mockedApiService.getGroups = vi.fn().mockResolvedValue(mockGroups);

      // Act
      await useGroupStore.getState().fetchGroups();

      // Assert
      expect(useGroupStore.getState().error).toBeNull();
    });

    it('should handle 500 server error when fetching groups', async () => {
      // Arrange
      const serverError = {
        response: {
          status: 500,
          data: { detail: 'Internal Server Error' },
        },
      };
      mockedApiService.getGroups = vi.fn().mockRejectedValue(serverError);

      // Act
      await useGroupStore.getState().fetchGroups();

      // Assert
      const store = useGroupStore.getState();
      expect(store.error).toBeDefined();
      expect(store.isLoading).toBe(false);
    });
  });

  describe('selectGroup', () => {
    beforeEach(() => {
      // Setup groups in store
      useGroupStore.getState().groups = mockGroups;
    });

    it('should select a group by ID', () => {
      // Act
      useGroupStore.getState().selectGroup('group-1');

      // Assert
      const store = useGroupStore.getState();
      expect(store.selectedGroupId).toBe('group-1');
      expect(store.selectedGroup).toEqual(mockGroup1);
    });

    it('should deselect when passing null', () => {
      // Arrange
      useGroupStore.getState().selectedGroupId = 'group-1';
      useGroupStore.getState().selectedGroup = mockGroup1;

      // Act
      useGroupStore.getState().selectGroup(null);

      // Assert
      const store = useGroupStore.getState();
      expect(store.selectedGroupId).toBeNull();
      expect(store.selectedGroup).toBeUndefined();
    });

    it('should update selection when switching between groups', () => {
      // Arrange
      useGroupStore.getState().selectGroup('group-1');

      // Act
      useGroupStore.getState().selectGroup('group-2');

      // Assert
      const store = useGroupStore.getState();
      expect(store.selectedGroupId).toBe('group-2');
      expect(store.selectedGroup).toEqual(mockGroup2);
    });

    it('should handle selecting nonexistent group', () => {
      // Act
      useGroupStore.getState().selectGroup('nonexistent');

      // Assert
      const store = useGroupStore.getState();
      expect(store.selectedGroupId).toBe('nonexistent');
      expect(store.selectedGroup).toBeUndefined();
    });

    it('should handle selecting same group twice', () => {
      // Arrange
      useGroupStore.getState().selectGroup('group-1');

      // Act
      useGroupStore.getState().selectGroup('group-1');

      // Assert
      const store = useGroupStore.getState();
      expect(store.selectedGroupId).toBe('group-1');
      expect(store.selectedGroup).toEqual(mockGroup1);
    });
  });

  describe('createGroup', () => {
    it('should create a new group successfully', async () => {
      // Arrange
      const newGroup: Group = {
        id: 'group-new',
        name: 'New Group',
        avatar_url: '/api/groups/group-new/avatar',
        created_at: '2025-01-03T14:00:00Z',
        character_ids: ['char-1', 'char-2'],
      };
      mockedApiService.createGroup = vi.fn().mockResolvedValue(newGroup);
      useGroupStore.getState().groups = mockGroups;

      // Act
      await useGroupStore.getState().createGroup('New Group', ['char-1', 'char-2'], mockAvatarFile);

      // Assert
      expect(mockedApiService.createGroup).toHaveBeenCalledWith({
        name: 'New Group',
        character_ids: ['char-1', 'char-2'],
        avatar: mockAvatarFile,
      });
      const store = useGroupStore.getState();
      expect(store.groups).toHaveLength(3);
      expect(store.groups[2]).toEqual(newGroup);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should create group without avatar', async () => {
      // Arrange
      const newGroup: Group = {
        id: 'group-new',
        name: 'New Group',
        avatar_url: null,
        created_at: '2025-01-03T14:00:00Z',
        character_ids: ['char-1', 'char-2'],
      };
      mockedApiService.createGroup = vi.fn().mockResolvedValue(newGroup);

      // Act
      await useGroupStore.getState().createGroup('New Group', ['char-1', 'char-2']);

      // Assert
      expect(mockedApiService.createGroup).toHaveBeenCalledWith({
        name: 'New Group',
        character_ids: ['char-1', 'char-2'],
        avatar: undefined,
      });
      const store = useGroupStore.getState();
      expect(store.groups).toHaveLength(1);
    });

    it('should set loading state while creating group', async () => {
      // Arrange
      let resolveCreate: any;
      const promise = new Promise<Group>((resolve) => {
        resolveCreate = resolve;
      });
      mockedApiService.createGroup = vi.fn().mockReturnValue(promise);

      // Act
      const createPromise = useGroupStore.getState().createGroup('New Group', ['char-1', 'char-2']);

      // Assert - loading should be true during creation
      expect(useGroupStore.getState().isLoading).toBe(true);

      // Resolve the promise
      resolveCreate(mockGroup1);
      await createPromise;

      // Assert - loading should be false after creation
      expect(useGroupStore.getState().isLoading).toBe(false);
    });

    it('should handle validation error when creating group with less than 2 members', async () => {
      // Arrange
      const validationError = {
        response: {
          status: 400,
          data: { detail: 'Group must have at least 2 members' },
        },
      };
      mockedApiService.createGroup = vi.fn().mockRejectedValue(validationError);

      // Act
      await useGroupStore.getState().createGroup('New Group', ['char-1']);

      // Assert
      const store = useGroupStore.getState();
      expect(store.error).toBeDefined();
      expect(store.groups).toHaveLength(0);
      expect(store.isLoading).toBe(false);
    });

    it('should handle validation error for empty group name', async () => {
      // Arrange
      const validationError = {
        response: {
          status: 400,
          data: { detail: 'Group name is required' },
        },
      };
      mockedApiService.createGroup = vi.fn().mockRejectedValue(validationError);

      // Act
      await useGroupStore.getState().createGroup('', ['char-1', 'char-2']);

      // Assert
      const store = useGroupStore.getState();
      expect(store.error).toBeDefined();
      expect(store.isLoading).toBe(false);
    });

    it('should handle network error when creating group', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedApiService.createGroup = vi.fn().mockRejectedValue(networkError);

      // Act
      await useGroupStore.getState().createGroup('New Group', ['char-1', 'char-2']);

      // Assert
      const store = useGroupStore.getState();
      expect(store.error).toBe('Network Error');
      expect(store.groups).toHaveLength(0);
      expect(store.isLoading).toBe(false);
    });

    it('should handle creating group with many members', async () => {
      // Arrange
      const newGroup: Group = {
        id: 'group-new',
        name: 'Large Group',
        avatar_url: null,
        created_at: '2025-01-03T14:00:00Z',
        character_ids: ['char-1', 'char-2', 'char-3', 'char-4', 'char-5', 'char-6'],
      };
      mockedApiService.createGroup = vi.fn().mockResolvedValue(newGroup);

      // Act
      await useGroupStore.getState().createGroup('Large Group', ['char-1', 'char-2', 'char-3', 'char-4', 'char-5', 'char-6']);

      // Assert
      const store = useGroupStore.getState();
      expect(store.groups[0].character_ids).toHaveLength(6);
    });

    it('should clear previous error on successful create', async () => {
      // Arrange
      useGroupStore.getState().error = 'Previous error';
      const newGroup: Group = { ...mockGroup1, id: 'group-new' };
      mockedApiService.createGroup = vi.fn().mockResolvedValue(newGroup);

      // Act
      await useGroupStore.getState().createGroup('New Group', ['char-1', 'char-2']);

      // Assert
      expect(useGroupStore.getState().error).toBeNull();
    });
  });

  describe('updateGroup', () => {
    beforeEach(() => {
      useGroupStore.getState().groups = mockGroups;
    });

    it('should update group name', async () => {
      // Arrange
      const updatedGroup: Group = { ...mockGroup1, name: 'Updated Name' };
      mockedApiService.updateGroup = vi.fn().mockResolvedValue(updatedGroup);

      // Act
      await useGroupStore.getState().updateGroup('group-1', 'Updated Name');

      // Assert
      expect(mockedApiService.updateGroup).toHaveBeenCalledWith('group-1', {
        name: 'Updated Name',
        character_ids: undefined,
        avatar: undefined,
      });
      const store = useGroupStore.getState();
      expect(store.groups[0].name).toBe('Updated Name');
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should update group members', async () => {
      // Arrange
      const updatedGroup: Group = { ...mockGroup1, character_ids: ['char-1', 'char-2', 'char-4'] };
      mockedApiService.updateGroup = vi.fn().mockResolvedValue(updatedGroup);

      // Act
      await useGroupStore.getState().updateGroup('group-1', undefined, ['char-1', 'char-2', 'char-4']);

      // Assert
      expect(mockedApiService.updateGroup).toHaveBeenCalledWith('group-1', {
        name: undefined,
        character_ids: ['char-1', 'char-2', 'char-4'],
        avatar: undefined,
      });
      const store = useGroupStore.getState();
      expect(store.groups[0].character_ids).toEqual(['char-1', 'char-2', 'char-4']);
    });

    it('should update group avatar', async () => {
      // Arrange
      const updatedGroup: Group = { ...mockGroup1, avatar_url: '/api/groups/group-1/new-avatar' };
      mockedApiService.updateGroup = vi.fn().mockResolvedValue(updatedGroup);

      // Act
      await useGroupStore.getState().updateGroup('group-1', undefined, undefined, mockAvatarFile);

      // Assert
      expect(mockedApiService.updateGroup).toHaveBeenCalledWith('group-1', {
        name: undefined,
        character_ids: undefined,
        avatar: mockAvatarFile,
      });
    });

    it('should update multiple fields at once', async () => {
      // Arrange
      const updatedGroup: Group = {
        ...mockGroup1,
        name: 'New Name',
        character_ids: ['char-1', 'char-3'],
        avatar_url: '/api/groups/group-1/new-avatar',
      };
      mockedApiService.updateGroup = vi.fn().mockResolvedValue(updatedGroup);

      // Act
      await useGroupStore.getState().updateGroup('group-1', 'New Name', ['char-1', 'char-3'], mockAvatarFile);

      // Assert
      expect(mockedApiService.updateGroup).toHaveBeenCalledWith('group-1', {
        name: 'New Name',
        character_ids: ['char-1', 'char-3'],
        avatar: mockAvatarFile,
      });
    });

    it('should update selectedGroup if it is the updated group', async () => {
      // Arrange
      useGroupStore.getState().selectGroup('group-1');
      const updatedGroup: Group = { ...mockGroup1, name: 'Updated Name' };
      mockedApiService.updateGroup = vi.fn().mockResolvedValue(updatedGroup);

      // Act
      await useGroupStore.getState().updateGroup('group-1', 'Updated Name');

      // Assert
      const store = useGroupStore.getState();
      expect(store.selectedGroup?.name).toBe('Updated Name');
    });

    it('should not update selectedGroup if it is a different group', async () => {
      // Arrange
      useGroupStore.getState().selectGroup('group-2');
      const updatedGroup: Group = { ...mockGroup1, name: 'Updated Name' };
      mockedApiService.updateGroup = vi.fn().mockResolvedValue(updatedGroup);

      // Act
      await useGroupStore.getState().updateGroup('group-1', 'Updated Name');

      // Assert
      const store = useGroupStore.getState();
      expect(store.selectedGroup).toEqual(mockGroup2);
    });

    it('should handle network error when updating group', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedApiService.updateGroup = vi.fn().mockRejectedValue(networkError);

      // Act
      await useGroupStore.getState().updateGroup('group-1', 'New Name');

      // Assert
      const store = useGroupStore.getState();
      expect(store.error).toBe('Network Error');
      expect(store.groups[0].name).toBe('Philosophy Circle'); // unchanged
      expect(store.isLoading).toBe(false);
    });

    it('should handle updating nonexistent group', async () => {
      // Arrange
      const notFoundError = {
        response: {
          status: 404,
          data: { detail: 'Group not found' },
        },
      };
      mockedApiService.updateGroup = vi.fn().mockRejectedValue(notFoundError);

      // Act
      await useGroupStore.getState().updateGroup('nonexistent', 'New Name');

      // Assert
      const store = useGroupStore.getState();
      expect(store.error).toBeDefined();
      expect(store.isLoading).toBe(false);
    });

    it('should set loading state while updating group', async () => {
      // Arrange
      let resolveUpdate: any;
      const promise = new Promise<Group>((resolve) => {
        resolveUpdate = resolve;
      });
      mockedApiService.updateGroup = vi.fn().mockReturnValue(promise);

      // Act
      const updatePromise = useGroupStore.getState().updateGroup('group-1', 'New Name');

      // Assert - loading should be true during update
      expect(useGroupStore.getState().isLoading).toBe(true);

      // Resolve the promise
      resolveUpdate(mockGroup1);
      await updatePromise;

      // Assert - loading should be false after update
      expect(useGroupStore.getState().isLoading).toBe(false);
    });
  });

  describe('deleteGroup', () => {
    beforeEach(() => {
      useGroupStore.getState().groups = mockGroups;
    });

    it('should delete a group successfully', async () => {
      // Arrange
      mockedApiService.deleteGroup = vi.fn().mockResolvedValue(undefined);

      // Act
      await useGroupStore.getState().deleteGroup('group-1');

      // Assert
      expect(mockedApiService.deleteGroup).toHaveBeenCalledWith('group-1');
      const store = useGroupStore.getState();
      expect(store.groups).toHaveLength(1);
      expect(store.groups[0]).toEqual(mockGroup2);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should deselect group if deleted group was selected', async () => {
      // Arrange
      useGroupStore.getState().selectGroup('group-1');
      mockedApiService.deleteGroup = vi.fn().mockResolvedValue(undefined);

      // Act
      await useGroupStore.getState().deleteGroup('group-1');

      // Assert
      const store = useGroupStore.getState();
      expect(store.selectedGroupId).toBeNull();
      expect(store.selectedGroup).toBeUndefined();
    });

    it('should not deselect if deleted group was not selected', async () => {
      // Arrange
      useGroupStore.getState().selectGroup('group-2');
      mockedApiService.deleteGroup = vi.fn().mockResolvedValue(undefined);

      // Act
      await useGroupStore.getState().deleteGroup('group-1');

      // Assert
      const store = useGroupStore.getState();
      expect(store.selectedGroupId).toBe('group-2');
      expect(store.selectedGroup).toEqual(mockGroup2);
    });

    it('should handle network error when deleting group', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedApiService.deleteGroup = vi.fn().mockRejectedValue(networkError);

      // Act
      await useGroupStore.getState().deleteGroup('group-1');

      // Assert
      const store = useGroupStore.getState();
      expect(store.error).toBe('Network Error');
      expect(store.groups).toHaveLength(2); // unchanged
      expect(store.isLoading).toBe(false);
    });

    it('should handle deleting nonexistent group', async () => {
      // Arrange
      const notFoundError = {
        response: {
          status: 404,
          data: { detail: 'Group not found' },
        },
      };
      mockedApiService.deleteGroup = vi.fn().mockRejectedValue(notFoundError);

      // Act
      await useGroupStore.getState().deleteGroup('nonexistent');

      // Assert
      const store = useGroupStore.getState();
      expect(store.error).toBeDefined();
      expect(store.groups).toHaveLength(2);
      expect(store.isLoading).toBe(false);
    });

    it('should set loading state while deleting group', async () => {
      // Arrange
      let resolveDelete: any;
      const promise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      mockedApiService.deleteGroup = vi.fn().mockReturnValue(promise);

      // Act
      const deletePromise = useGroupStore.getState().deleteGroup('group-1');

      // Assert - loading should be true during delete
      expect(useGroupStore.getState().isLoading).toBe(true);

      // Resolve the promise
      resolveDelete();
      await deletePromise;

      // Assert - loading should be false after delete
      expect(useGroupStore.getState().isLoading).toBe(false);
    });

    it('should handle deleting all groups', async () => {
      // Arrange
      mockedApiService.deleteGroup = vi.fn().mockResolvedValue(undefined);

      // Act
      await useGroupStore.getState().deleteGroup('group-1');
      await useGroupStore.getState().deleteGroup('group-2');

      // Assert
      const store = useGroupStore.getState();
      expect(store.groups).toHaveLength(0);
      expect(store.selectedGroupId).toBeNull();
    });
  });

  describe('addCharacterToGroup', () => {
    beforeEach(() => {
      useGroupStore.getState().groups = mockGroups;
    });

    it('should add character to group successfully', async () => {
      // Arrange
      const updatedGroup: Group = {
        ...mockGroup1,
        character_ids: [...mockGroup1.character_ids, 'char-5'],
      };
      mockedApiService.updateGroup = vi.fn().mockResolvedValue(updatedGroup);

      // Act
      await useGroupStore.getState().addCharacterToGroup('group-1', 'char-5');

      // Assert
      const store = useGroupStore.getState();
      expect(store.groups[0].character_ids).toContain('char-5');
      expect(store.groups[0].character_ids).toHaveLength(4);
    });

    it('should handle adding character to nonexistent group', async () => {
      // Arrange
      const notFoundError = {
        response: {
          status: 404,
          data: { detail: 'Group not found' },
        },
      };
      mockedApiService.updateGroup = vi.fn().mockRejectedValue(notFoundError);

      // Act
      await useGroupStore.getState().addCharacterToGroup('nonexistent', 'char-5');

      // Assert
      const store = useGroupStore.getState();
      expect(store.error).toBeDefined();
      expect(store.isLoading).toBe(false);
    });

    it('should handle network error when adding character', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedApiService.updateGroup = vi.fn().mockRejectedValue(networkError);

      // Act
      await useGroupStore.getState().addCharacterToGroup('group-1', 'char-5');

      // Assert
      const store = useGroupStore.getState();
      expect(store.error).toBe('Network Error');
      expect(store.groups[0].character_ids).toHaveLength(3); // unchanged
    });
  });

  describe('removeCharacterFromGroup', () => {
    beforeEach(() => {
      useGroupStore.getState().groups = mockGroups;
    });

    it('should remove character from group successfully', async () => {
      // Arrange
      const updatedGroup: Group = {
        ...mockGroup1,
        character_ids: ['char-1', 'char-2'], // char-3 removed
      };
      mockedApiService.updateGroup = vi.fn().mockResolvedValue(updatedGroup);

      // Act
      await useGroupStore.getState().removeCharacterFromGroup('group-1', 'char-3');

      // Assert
      const store = useGroupStore.getState();
      expect(store.groups[0].character_ids).not.toContain('char-3');
      expect(store.groups[0].character_ids).toHaveLength(2);
    });

    it('should handle removing last character from group', async () => {
      // Arrange
      const updatedGroup: Group = {
        ...mockGroup2,
        character_ids: ['char-1'], // char-4 removed, only 1 left
      };
      mockedApiService.updateGroup = vi.fn().mockResolvedValue(updatedGroup);

      // Act
      await useGroupStore.getState().removeCharacterFromGroup('group-2', 'char-4');

      // Assert
      const store = useGroupStore.getState();
      expect(store.groups[1].character_ids).toHaveLength(1);
    });

    it('should handle removing nonexistent character from group', async () => {
      // Arrange
      const updatedGroup: Group = { ...mockGroup1 };
      mockedApiService.updateGroup = vi.fn().mockResolvedValue(updatedGroup);

      // Act
      await useGroupStore.getState().removeCharacterFromGroup('group-1', 'char-nonexistent');

      // Assert
      const store = useGroupStore.getState();
      expect(store.groups[0].character_ids).toHaveLength(3); // unchanged
    });

    it('should handle network error when removing character', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedApiService.updateGroup = vi.fn().mockRejectedValue(networkError);

      // Act
      await useGroupStore.getState().removeCharacterFromGroup('group-1', 'char-3');

      // Assert
      const store = useGroupStore.getState();
      expect(store.error).toBe('Network Error');
      expect(store.groups[0].character_ids).toHaveLength(3); // unchanged
    });
  });

  describe('Error State Management', () => {
    it('should persist error state across operations', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedApiService.getGroups = vi.fn().mockRejectedValue(networkError);

      // Act
      await useGroupStore.getState().fetchGroups();

      // Assert
      expect(useGroupStore.getState().error).toBe('Network Error');

      // Try another operation
      mockedApiService.createGroup = vi.fn().mockRejectedValue(new Error('Another error'));
      await useGroupStore.getState().createGroup('Test', ['char-1', 'char-2']);

      // Error should be updated
      expect(useGroupStore.getState().error).toBe('Another error');
    });

    it('should clear error on successful operation after error', async () => {
      // Arrange
      useGroupStore.getState().error = 'Previous error';
      mockedApiService.getGroups = vi.fn().mockResolvedValue(mockGroups);

      // Act
      await useGroupStore.getState().fetchGroups();

      // Assert
      expect(useGroupStore.getState().error).toBeNull();
    });
  });

  describe('Multiple Groups Context', () => {
    it('should handle operations on multiple groups independently', async () => {
      // Arrange
      useGroupStore.getState().groups = mockGroups;
      const updatedGroup1: Group = { ...mockGroup1, name: 'Updated 1' };
      const updatedGroup2: Group = { ...mockGroup2, name: 'Updated 2' };
      mockedApiService.updateGroup = vi
        .fn()
        .mockResolvedValueOnce(updatedGroup1)
        .mockResolvedValueOnce(updatedGroup2);

      // Act
      await useGroupStore.getState().updateGroup('group-1', 'Updated 1');
      await useGroupStore.getState().updateGroup('group-2', 'Updated 2');

      // Assert
      const store = useGroupStore.getState();
      expect(store.groups[0].name).toBe('Updated 1');
      expect(store.groups[1].name).toBe('Updated 2');
    });

    it('should maintain group order after updates', async () => {
      // Arrange
      useGroupStore.getState().groups = mockGroups;
      const updatedGroup: Group = { ...mockGroup2, name: 'Updated' };
      mockedApiService.updateGroup = vi.fn().mockResolvedValue(updatedGroup);

      // Act
      await useGroupStore.getState().updateGroup('group-2', 'Updated');

      // Assert
      const store = useGroupStore.getState();
      expect(store.groups[0].id).toBe('group-1');
      expect(store.groups[1].id).toBe('group-2');
      expect(store.groups[1].name).toBe('Updated');
    });
  });
});
