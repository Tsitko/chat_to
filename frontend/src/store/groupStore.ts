/**
 * Zustand store for managing group chat state.
 *
 * This store handles:
 * - CRUD operations for groups
 * - Group selection state
 * - Group member management
 * - Loading and error states
 *
 * Dependencies: apiService (for backend communication)
 */

import { create } from 'zustand';
import type { Group, GroupCreate, GroupUpdate } from '../types/group';

/**
 * Shape of the group store state and actions.
 */
interface GroupStore {
  // State
  /** All groups available to the user */
  groups: Group[];
  /** Currently selected group ID (null if none selected) */
  selectedGroupId: string | null;
  /** Currently selected group object (undefined if none selected) */
  selectedGroup: Group | undefined;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error message from last failed operation */
  error: string | null;

  // Actions
  /**
   * Fetch all groups from the backend.
   * Updates groups array on success.
   */
  fetchGroups: () => Promise<void>;

  /**
   * Select a group by ID.
   * Sets selectedGroupId and selectedGroup.
   *
   * @param groupId - ID of group to select, or null to deselect
   */
  selectGroup: (groupId: string | null) => void;

  /**
   * Create a new group.
   * Adds the new group to the groups array on success.
   *
   * @param name - Name for the new group
   * @param characterIds - Array of character IDs to add as members
   * @param avatar - Optional avatar file for the group
   */
  createGroup: (name: string, characterIds: string[], avatar?: File) => Promise<void>;

  /**
   * Update an existing group.
   * Updates the group in the groups array on success.
   *
   * @param groupId - ID of the group to update
   * @param name - New name (optional)
   * @param characterIds - Updated member list (optional)
   * @param avatar - New avatar file (optional)
   */
  updateGroup: (
    groupId: string,
    name?: string,
    characterIds?: string[],
    avatar?: File
  ) => Promise<void>;

  /**
   * Delete a group.
   * Removes the group from the groups array and deselects if selected.
   *
   * @param groupId - ID of the group to delete
   */
  deleteGroup: (groupId: string) => Promise<void>;

  /**
   * Add a character to a group.
   * Updates the group's character_ids array.
   *
   * @param groupId - ID of the group
   * @param characterId - ID of the character to add
   */
  addCharacterToGroup: (groupId: string, characterId: string) => Promise<void>;

  /**
   * Remove a character from a group.
   * Updates the group's character_ids array.
   *
   * @param groupId - ID of the group
   * @param characterId - ID of the character to remove
   */
  removeCharacterFromGroup: (groupId: string, characterId: string) => Promise<void>;
}

/**
 * Zustand store instance for group management.
 */
export const useGroupStore = create<GroupStore>((set, get) => ({
  // Initial state
  groups: [],
  selectedGroupId: null,
  selectedGroup: undefined,
  isLoading: false,
  error: null,

  // Actions implementation
  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const { apiService } = await import('../services/api');
      const groups = await apiService.getGroups();
      set({ groups, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch groups';
      set({ error: errorMessage, isLoading: false });
    }
  },

  selectGroup: (groupId: string | null) => {
    if (groupId === null) {
      set({
        selectedGroupId: null,
        selectedGroup: undefined,
      });
      return;
    }

    const { groups } = get();
    const group = groups.find((g) => g.id === groupId);
    set({
      selectedGroupId: groupId,
      selectedGroup: group,
    });
  },

  createGroup: async (name: string, characterIds: string[], avatar?: File) => {
    set({ isLoading: true, error: null });
    try {
      const { apiService } = await import('../services/api');
      const newGroup = await apiService.createGroup({ name, character_ids: characterIds, avatar });
      const { groups } = get();
      set({
        groups: [...groups, newGroup],
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create group';
      set({ error: errorMessage, isLoading: false });
    }
  },

  updateGroup: async (
    groupId: string,
    name?: string,
    characterIds?: string[],
    avatar?: File
  ) => {
    set({ isLoading: true, error: null });
    try {
      const { apiService } = await import('../services/api');
      const updatedGroup = await apiService.updateGroup(groupId, {
        name,
        character_ids: characterIds,
        avatar
      });
      const { groups, selectedGroupId } = get();
      const updatedGroups = groups.map((g) => (g.id === groupId ? updatedGroup : g));
      set({
        groups: updatedGroups,
        selectedGroup: selectedGroupId === groupId ? updatedGroup : get().selectedGroup,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update group';
      set({ error: errorMessage, isLoading: false });
    }
  },

  deleteGroup: async (groupId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { apiService } = await import('../services/api');
      await apiService.deleteGroup(groupId);
      const { groups, selectedGroupId } = get();
      const updatedGroups = groups.filter((g) => g.id !== groupId);
      set({
        groups: updatedGroups,
        selectedGroupId: selectedGroupId === groupId ? null : selectedGroupId,
        selectedGroup: selectedGroupId === groupId ? undefined : get().selectedGroup,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete group';
      set({ error: errorMessage, isLoading: false });
    }
  },

  addCharacterToGroup: async (groupId: string, characterId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { groups } = get();
      const group = groups.find((g) => g.id === groupId);
      if (!group) throw new Error('Group not found');
      const updatedCharacterIds = [...group.character_ids, characterId];
      await get().updateGroup(groupId, undefined, updatedCharacterIds);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add character';
      set({ error: errorMessage, isLoading: false });
    }
  },

  removeCharacterFromGroup: async (groupId: string, characterId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { groups } = get();
      const group = groups.find((g) => g.id === groupId);
      if (!group) throw new Error('Group not found');
      const updatedCharacterIds = group.character_ids.filter((id) => id !== characterId);
      await get().updateGroup(groupId, undefined, updatedCharacterIds);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove character';
      set({ error: errorMessage, isLoading: false });
    }
  },
}));
