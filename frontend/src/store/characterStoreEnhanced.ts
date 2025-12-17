/**
 * Enhanced Zustand store for managing character state with granular loading states.
 *
 * This is an enhanced version of characterStore that provides:
 * - Separate loading states for each operation (fetch, create, update, delete)
 * - Better error handling with operation-specific errors
 * - Loading state tracking for individual characters
 */

import { create } from 'zustand';
import type { Character } from '../types/character';
import type { CharacterLoadingStates, LoadingStatus } from '../types/loading';
import { apiService } from '../services/api';

interface CharacterStoreEnhanced {
  characters: Character[];
  selectedCharacterId: string | null;
  selectedCharacter: Character | undefined;

  // Granular loading states for each operation
  loadingStates: CharacterLoadingStates;

  // Track which character is currently being operated on
  operatingCharacterId: string | null;

  // Actions
  fetchCharacters: () => Promise<void>;
  selectCharacter: (characterId: string | null) => void;
  createCharacter: (name: string, avatar?: File, books?: File[]) => Promise<Character | null>;
  updateCharacter: (characterId: string, name?: string, avatar?: File, books?: File[]) => Promise<Character | null>;
  deleteCharacter: (characterId: string) => Promise<boolean>;

  // Helper methods
  clearError: (operation: keyof CharacterLoadingStates) => void;
  isOperationLoading: (operation: keyof CharacterLoadingStates) => boolean;
}

/**
 * Creates initial loading status
 */
const createInitialLoadingStatus = (): LoadingStatus => ({
  state: 'idle',
  error: undefined,
});

/**
 * Creates initial loading states for all operations
 */
const createInitialLoadingStates = (): CharacterLoadingStates => ({
  fetchAll: createInitialLoadingStatus(),
  create: createInitialLoadingStatus(),
  update: createInitialLoadingStatus(),
  delete: createInitialLoadingStatus(),
});

/**
 * Enhanced character store with granular loading states
 */
export const useCharacterStoreEnhanced = create<CharacterStoreEnhanced>((set, get) => ({
  characters: [],
  selectedCharacterId: null,
  selectedCharacter: undefined,
  loadingStates: createInitialLoadingStates(),
  operatingCharacterId: null,

  /**
   * Fetches all characters from the API
   */
  fetchCharacters: async () => {
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        fetchAll: { state: 'loading' },
      },
    }));

    try {
      const characters = await apiService.getCharacters();
      set((state) => ({
        characters,
        loadingStates: {
          ...state.loadingStates,
          fetchAll: { state: 'success' },
        },
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch characters';
      set((state) => ({
        loadingStates: {
          ...state.loadingStates,
          fetchAll: { state: 'error', error: errorMessage },
        },
      }));
    }
  },

  /**
   * Selects a character by ID
   */
  selectCharacter: (characterId: string | null) => {
    set((state) => {
      const selectedCharacter = characterId
        ? state.characters.find((c) => c.id === characterId)
        : undefined;

      return {
        selectedCharacterId: characterId,
        selectedCharacter,
      };
    });
  },

  /**
   * Creates a new character
   *
   * @returns Created character or null on error
   */
  createCharacter: async (name: string, avatar?: File, books?: File[]) => {
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        create: { state: 'loading' },
      },
    }));

    try {
      const character = await apiService.createCharacter({ name, avatar, books });
      set((state) => ({
        characters: [...state.characters, character],
        loadingStates: {
          ...state.loadingStates,
          create: { state: 'success' },
        },
      }));
      return character;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create character';
      set((state) => ({
        loadingStates: {
          ...state.loadingStates,
          create: { state: 'error', error: errorMessage },
        },
      }));
      return null;
    }
  },

  /**
   * Updates an existing character
   *
   * @returns Updated character or null on error
   */
  updateCharacter: async (characterId: string, name?: string, avatar?: File, books?: File[]) => {
    set((state) => ({
      operatingCharacterId: characterId,
      loadingStates: {
        ...state.loadingStates,
        update: { state: 'loading' },
      },
    }));

    try {
      const updatedCharacter = await apiService.updateCharacter(characterId, {
        name,
        avatar,
        books,
      });

      set((state) => ({
        characters: state.characters.map((c) =>
          c.id === characterId ? updatedCharacter : c
        ),
        selectedCharacter:
          state.selectedCharacterId === characterId ? updatedCharacter : state.selectedCharacter,
        operatingCharacterId: null,
        loadingStates: {
          ...state.loadingStates,
          update: { state: 'success' },
        },
      }));

      return updatedCharacter;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update character';
      set((state) => ({
        operatingCharacterId: null,
        loadingStates: {
          ...state.loadingStates,
          update: { state: 'error', error: errorMessage },
        },
      }));
      return null;
    }
  },

  /**
   * Deletes a character
   *
   * @returns true on success, false on error
   */
  deleteCharacter: async (characterId: string) => {
    set((state) => ({
      operatingCharacterId: characterId,
      loadingStates: {
        ...state.loadingStates,
        delete: { state: 'loading' },
      },
    }));

    try {
      await apiService.deleteCharacter(characterId);

      set((state) => ({
        characters: state.characters.filter((c) => c.id !== characterId),
        selectedCharacterId:
          state.selectedCharacterId === characterId ? null : state.selectedCharacterId,
        selectedCharacter:
          state.selectedCharacterId === characterId ? undefined : state.selectedCharacter,
        operatingCharacterId: null,
        loadingStates: {
          ...state.loadingStates,
          delete: { state: 'success' },
        },
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete character';
      set((state) => ({
        operatingCharacterId: null,
        loadingStates: {
          ...state.loadingStates,
          delete: { state: 'error', error: errorMessage },
        },
      }));
      return false;
    }
  },

  /**
   * Clears error for a specific operation
   */
  clearError: (operation: keyof CharacterLoadingStates) => {
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [operation]: {
          ...state.loadingStates[operation],
          error: undefined,
        },
      },
    }));
  },

  /**
   * Checks if a specific operation is currently loading
   */
  isOperationLoading: (operation: keyof CharacterLoadingStates) => {
    return get().loadingStates[operation].state === 'loading';
  },
}));
