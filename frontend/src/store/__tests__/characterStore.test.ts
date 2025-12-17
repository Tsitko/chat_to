/**
 * Character Store Unit Tests.
 *
 * Comprehensive tests for Zustand character store covering:
 * - State initialization
 * - Fetching characters
 * - Character selection
 * - Creating characters
 * - Updating characters
 * - Deleting characters
 * - Loading states
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useCharacterStore } from '../characterStore';
import { apiService } from '../../services/api';
import {
  mockCharacters,
  mockCharacter1,
  mockCharacter2,
  mockCharacter3,
  mockAvatarFile,
  mockBookFile1,
  mockBookFile2,
} from '../../tests/mockData';

// Mock the API service
vi.mock('../../services/api');
const mockedApiService = vi.mocked(apiService, true);

describe('CharacterStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useCharacterStore.getState();
    store.characters = [];
    store.selectedCharacterId = null;
    store.selectedCharacter = null;
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
      const store = useCharacterStore.getState();

      // Assert
      expect(store.characters).toEqual([]);
      expect(store.selectedCharacterId).toBeNull();
      expect(store.selectedCharacter).toBeNull();
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe('fetchCharacters', () => {
    it('should fetch all characters successfully', async () => {
      // Arrange
      mockedApiService.getCharacters = vi.fn().mockResolvedValue(mockCharacters);

      // Act
      await useCharacterStore.getState().fetchCharacters();

      // Assert
      const store = useCharacterStore.getState();
      expect(mockedApiService.getCharacters).toHaveBeenCalledTimes(1);
      expect(store.characters).toEqual(mockCharacters);
      expect(store.characters).toHaveLength(3);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should set loading state while fetching characters', async () => {
      // Arrange
      let resolveGetCharacters: any;
      const promise = new Promise<typeof mockCharacters>((resolve) => {
        resolveGetCharacters = resolve;
      });
      mockedApiService.getCharacters = vi.fn().mockReturnValue(promise);

      // Act
      const fetchPromise = useCharacterStore.getState().fetchCharacters();

      // Assert - loading should be true during fetch
      expect(useCharacterStore.getState().isLoading).toBe(true);

      // Resolve the promise
      resolveGetCharacters(mockCharacters);
      await fetchPromise;

      // Assert - loading should be false after fetch
      expect(useCharacterStore.getState().isLoading).toBe(false);
    });

    it('should handle empty characters list', async () => {
      // Arrange
      mockedApiService.getCharacters = vi.fn().mockResolvedValue([]);

      // Act
      await useCharacterStore.getState().fetchCharacters();

      // Assert
      const store = useCharacterStore.getState();
      expect(store.characters).toEqual([]);
      expect(store.characters).toHaveLength(0);
      expect(store.error).toBeNull();
    });

    it('should handle network error when fetching characters', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedApiService.getCharacters = vi.fn().mockRejectedValue(networkError);

      // Act
      await useCharacterStore.getState().fetchCharacters();

      // Assert
      const store = useCharacterStore.getState();
      expect(store.characters).toEqual([]);
      expect(store.error).toBe('Network Error');
      expect(store.isLoading).toBe(false);
    });

    it('should handle server error when fetching characters', async () => {
      // Arrange
      const serverError = {
        response: {
          status: 500,
          data: { detail: 'Internal Server Error' },
        },
      };
      mockedApiService.getCharacters = vi.fn().mockRejectedValue(serverError);

      // Act
      await useCharacterStore.getState().fetchCharacters();

      // Assert
      const store = useCharacterStore.getState();
      expect(store.error).toBeDefined();
      expect(store.isLoading).toBe(false);
    });

    it('should clear previous error on successful fetch', async () => {
      // Arrange
      const store = useCharacterStore.getState();
      store.error = 'Previous error';
      mockedApiService.getCharacters = vi.fn().mockResolvedValue(mockCharacters);

      // Act
      await store.fetchCharacters();

      // Assert
      expect(useCharacterStore.getState().error).toBeNull();
    });
  });

  describe('selectCharacter', () => {
    beforeEach(() => {
      // Set up characters in store
      useCharacterStore.getState().characters = mockCharacters;
    });

    it('should select a character by ID', () => {
      // Act
      useCharacterStore.getState().selectCharacter('char-1');

      // Assert
      const store = useCharacterStore.getState();
      expect(store.selectedCharacterId).toBe('char-1');
      expect(store.selectedCharacter).toEqual(mockCharacter1);
      expect(store.selectedCharacter?.name).toBe('Hegel');
    });

    it('should change selected character when selecting different character', () => {
      // Arrange
      useCharacterStore.getState().selectCharacter('char-1');

      // Act
      useCharacterStore.getState().selectCharacter('char-2');

      // Assert
      const store = useCharacterStore.getState();
      expect(store.selectedCharacterId).toBe('char-2');
      expect(store.selectedCharacter).toEqual(mockCharacter2);
      expect(store.selectedCharacter?.name).toBe('Kant');
    });

    it('should handle selecting nonexistent character', () => {
      // Act
      useCharacterStore.getState().selectCharacter('nonexistent');

      // Assert
      const store = useCharacterStore.getState();
      expect(store.selectedCharacterId).toBe('nonexistent');
      expect(store.selectedCharacter).toBeUndefined();
    });

    it('should handle selecting with empty string ID', () => {
      // Act
      useCharacterStore.getState().selectCharacter('');

      // Assert
      const store = useCharacterStore.getState();
      expect(store.selectedCharacterId).toBe('');
      expect(store.selectedCharacter).toBeUndefined();
    });

    it('should deselect when selecting null', () => {
      // Arrange
      useCharacterStore.getState().selectCharacter('char-1');

      // Act
      useCharacterStore.getState().selectCharacter(null as any);

      // Assert
      const store = useCharacterStore.getState();
      expect(store.selectedCharacterId).toBeNull();
      expect(store.selectedCharacter).toBeUndefined();
    });
  });

  describe('createCharacter', () => {
    it('should create a character with name only', async () => {
      // Arrange
      const newCharacter = { ...mockCharacter2, id: 'new-char-1' };
      mockedApiService.createCharacter = vi.fn().mockResolvedValue(newCharacter);
      mockedApiService.getCharacters = vi.fn().mockResolvedValue([newCharacter]);

      // Act
      await useCharacterStore.getState().createCharacter('Kant');

      // Assert
      expect(mockedApiService.createCharacter).toHaveBeenCalledWith({
        name: 'Kant',
        avatar: undefined,
        books: undefined,
      });
      const store = useCharacterStore.getState();
      expect(store.characters).toContainEqual(newCharacter);
      expect(store.error).toBeNull();
    });

    it('should create a character with name and avatar', async () => {
      // Arrange
      const newCharacter = mockCharacter1;
      mockedApiService.createCharacter = vi.fn().mockResolvedValue(newCharacter);
      mockedApiService.getCharacters = vi.fn().mockResolvedValue([newCharacter]);

      // Act
      await useCharacterStore.getState().createCharacter('Hegel', mockAvatarFile);

      // Assert
      expect(mockedApiService.createCharacter).toHaveBeenCalledWith({
        name: 'Hegel',
        avatar: mockAvatarFile,
        books: undefined,
      });
    });

    it('should create a character with name, avatar, and books', async () => {
      // Arrange
      const newCharacter = mockCharacter1;
      const books = [mockBookFile1, mockBookFile2];
      mockedApiService.createCharacter = vi.fn().mockResolvedValue(newCharacter);
      mockedApiService.getCharacters = vi.fn().mockResolvedValue([newCharacter]);

      // Act
      await useCharacterStore.getState().createCharacter('Hegel', mockAvatarFile, books);

      // Assert
      expect(mockedApiService.createCharacter).toHaveBeenCalledWith({
        name: 'Hegel',
        avatar: mockAvatarFile,
        books: books,
      });
    });

    it('should set loading state while creating character', async () => {
      // Arrange
      let resolveCreateCharacter: any;
      const promise = new Promise<typeof mockCharacter1>((resolve) => {
        resolveCreateCharacter = resolve;
      });
      mockedApiService.createCharacter = vi.fn().mockReturnValue(promise);
      mockedApiService.getCharacters = vi.fn().mockResolvedValue([]);

      // Act
      const createPromise = useCharacterStore.getState().createCharacter('Test');

      // Assert - loading should be true during create
      expect(useCharacterStore.getState().isLoading).toBe(true);

      // Resolve the promise
      resolveCreateCharacter(mockCharacter1);
      await createPromise;

      // Assert - loading should be false after create
      expect(useCharacterStore.getState().isLoading).toBe(false);
    });

    it('should handle validation error when creating character with empty name', async () => {
      // Arrange
      const validationError = {
        response: {
          status: 400,
          data: { detail: 'Name is required' },
        },
      };
      mockedApiService.createCharacter = vi.fn().mockRejectedValue(validationError);

      // Act
      await useCharacterStore.getState().createCharacter('');

      // Assert
      const store = useCharacterStore.getState();
      expect(store.error).toBeDefined();
      expect(store.isLoading).toBe(false);
      expect(mockedApiService.getCharacters).not.toHaveBeenCalled();
    });

    it('should handle network error when creating character', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedApiService.createCharacter = vi.fn().mockRejectedValue(networkError);

      // Act
      await useCharacterStore.getState().createCharacter('Test');

      // Assert
      const store = useCharacterStore.getState();
      expect(store.error).toBe('Network Error');
      expect(mockedApiService.getCharacters).not.toHaveBeenCalled();
    });

    it('should handle extremely long name', async () => {
      // Arrange
      const longName = 'a'.repeat(1000);
      const newCharacter = { ...mockCharacter1, name: longName };
      mockedApiService.createCharacter = vi.fn().mockResolvedValue(newCharacter);
      mockedApiService.getCharacters = vi.fn().mockResolvedValue([newCharacter]);

      // Act
      await useCharacterStore.getState().createCharacter(longName);

      // Assert
      expect(mockedApiService.createCharacter).toHaveBeenCalledWith({
        name: longName,
        avatar: undefined,
        books: undefined,
      });
    });
  });

  describe('updateCharacter', () => {
    beforeEach(() => {
      // Set up characters in store
      useCharacterStore.getState().characters = mockCharacters;
    });

    it('should update character name only', async () => {
      // Arrange
      const updatedCharacter = { ...mockCharacter1, name: 'Georg Hegel' };
      mockedApiService.updateCharacter = vi.fn().mockResolvedValue(updatedCharacter);
      mockedApiService.getCharacters = vi.fn().mockResolvedValue([
        updatedCharacter,
        mockCharacter2,
        mockCharacter3,
      ]);

      // Act
      await useCharacterStore.getState().updateCharacter('char-1', 'Georg Hegel');

      // Assert
      expect(mockedApiService.updateCharacter).toHaveBeenCalledWith('char-1', {
        name: 'Georg Hegel',
        avatar: undefined,
        books: undefined,
      });
    });

    it('should update character avatar only', async () => {
      // Arrange
      const updatedCharacter = mockCharacter1;
      mockedApiService.updateCharacter = vi.fn().mockResolvedValue(updatedCharacter);
      mockedApiService.getCharacters = vi.fn().mockResolvedValue([
        updatedCharacter,
        mockCharacter2,
        mockCharacter3,
      ]);

      // Act
      await useCharacterStore.getState().updateCharacter('char-1', undefined, mockAvatarFile);

      // Assert
      expect(mockedApiService.updateCharacter).toHaveBeenCalledWith('char-1', {
        name: undefined,
        avatar: mockAvatarFile,
        books: undefined,
      });
    });

    it('should update character with name, avatar, and books', async () => {
      // Arrange
      const updatedCharacter = mockCharacter1;
      const books = [mockBookFile1];
      mockedApiService.updateCharacter = vi.fn().mockResolvedValue(updatedCharacter);
      mockedApiService.getCharacters = vi.fn().mockResolvedValue([
        updatedCharacter,
        mockCharacter2,
        mockCharacter3,
      ]);

      // Act
      await useCharacterStore.getState().updateCharacter('char-1', 'New Name', mockAvatarFile, books);

      // Assert
      expect(mockedApiService.updateCharacter).toHaveBeenCalledWith('char-1', {
        name: 'New Name',
        avatar: mockAvatarFile,
        books: books,
      });
    });

    it('should set loading state while updating character', async () => {
      // Arrange
      let resolveUpdateCharacter: any;
      const promise = new Promise<typeof mockCharacter1>((resolve) => {
        resolveUpdateCharacter = resolve;
      });
      mockedApiService.updateCharacter = vi.fn().mockReturnValue(promise);
      mockedApiService.getCharacters = vi.fn().mockResolvedValue(mockCharacters);

      // Act
      const updatePromise = useCharacterStore.getState().updateCharacter('char-1', 'New Name');

      // Assert - loading should be true during update
      expect(useCharacterStore.getState().isLoading).toBe(true);

      // Resolve the promise
      resolveUpdateCharacter(mockCharacter1);
      await updatePromise;

      // Assert - loading should be false after update
      expect(useCharacterStore.getState().isLoading).toBe(false);
    });

    it('should handle 404 error when updating nonexistent character', async () => {
      // Arrange
      const notFoundError = {
        response: {
          status: 404,
          data: { detail: 'Character not found' },
        },
      };
      mockedApiService.updateCharacter = vi.fn().mockRejectedValue(notFoundError);

      // Act
      await useCharacterStore.getState().updateCharacter('nonexistent', 'New Name');

      // Assert
      const store = useCharacterStore.getState();
      expect(store.error).toBeDefined();
      expect(mockedApiService.getCharacters).not.toHaveBeenCalled();
    });

    it('should handle network error when updating character', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedApiService.updateCharacter = vi.fn().mockRejectedValue(networkError);

      // Act
      await useCharacterStore.getState().updateCharacter('char-1', 'New Name');

      // Assert
      const store = useCharacterStore.getState();
      expect(store.error).toBe('Network Error');
    });

    it('should update selected character if it was the one updated', async () => {
      // Arrange
      useCharacterStore.getState().selectedCharacterId = 'char-1';
      useCharacterStore.getState().selectedCharacter = mockCharacter1;
      const updatedCharacter = { ...mockCharacter1, name: 'Updated Hegel' };
      mockedApiService.updateCharacter = vi.fn().mockResolvedValue(updatedCharacter);
      mockedApiService.getCharacters = vi.fn().mockResolvedValue([
        updatedCharacter,
        mockCharacter2,
        mockCharacter3,
      ]);

      // Act
      await useCharacterStore.getState().updateCharacter('char-1', 'Updated Hegel');

      // Assert
      const store = useCharacterStore.getState();
      expect(store.selectedCharacter?.name).toBe('Updated Hegel');
    });
  });

  describe('deleteCharacter', () => {
    beforeEach(() => {
      // Set up characters in store
      useCharacterStore.getState().characters = mockCharacters;
    });

    it('should delete a character successfully', async () => {
      // Arrange
      mockedApiService.deleteCharacter = vi.fn().mockResolvedValue(undefined);
      mockedApiService.getCharacters = vi.fn().mockResolvedValue([mockCharacter2, mockCharacter3]);

      // Act
      await useCharacterStore.getState().deleteCharacter('char-1');

      // Assert
      expect(mockedApiService.deleteCharacter).toHaveBeenCalledWith('char-1');
      const store = useCharacterStore.getState();
      expect(store.characters).toHaveLength(2);
      expect(store.characters).not.toContainEqual(mockCharacter1);
    });

    it('should set loading state while deleting character', async () => {
      // Arrange
      let resolveDeleteCharacter: any;
      const promise = new Promise<void>((resolve) => {
        resolveDeleteCharacter = resolve;
      });
      mockedApiService.deleteCharacter = vi.fn().mockReturnValue(promise);
      mockedApiService.getCharacters = vi.fn().mockResolvedValue([]);

      // Act
      const deletePromise = useCharacterStore.getState().deleteCharacter('char-1');

      // Assert - loading should be true during delete
      expect(useCharacterStore.getState().isLoading).toBe(true);

      // Resolve the promise
      resolveDeleteCharacter();
      await deletePromise;

      // Assert - loading should be false after delete
      expect(useCharacterStore.getState().isLoading).toBe(false);
    });

    it('should handle 404 error when deleting nonexistent character', async () => {
      // Arrange
      const notFoundError = {
        response: {
          status: 404,
          data: { detail: 'Character not found' },
        },
      };
      mockedApiService.deleteCharacter = vi.fn().mockRejectedValue(notFoundError);

      // Act
      await useCharacterStore.getState().deleteCharacter('nonexistent');

      // Assert
      const store = useCharacterStore.getState();
      expect(store.error).toBeDefined();
      expect(mockedApiService.getCharacters).not.toHaveBeenCalled();
    });

    it('should handle network error when deleting character', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedApiService.deleteCharacter = vi.fn().mockRejectedValue(networkError);

      // Act
      await useCharacterStore.getState().deleteCharacter('char-1');

      // Assert
      const store = useCharacterStore.getState();
      expect(store.error).toBe('Network Error');
    });

    it('should clear selected character if it was the one deleted', async () => {
      // Arrange
      useCharacterStore.getState().selectedCharacterId = 'char-1';
      useCharacterStore.getState().selectedCharacter = mockCharacter1;
      mockedApiService.deleteCharacter = vi.fn().mockResolvedValue(undefined);
      mockedApiService.getCharacters = vi.fn().mockResolvedValue([mockCharacter2, mockCharacter3]);

      // Act
      await useCharacterStore.getState().deleteCharacter('char-1');

      // Assert
      const store = useCharacterStore.getState();
      expect(store.selectedCharacterId).toBeNull();
      expect(store.selectedCharacter).toBeNull();
    });

    it('should not clear selected character if a different character was deleted', async () => {
      // Arrange
      useCharacterStore.getState().selectedCharacterId = 'char-1';
      useCharacterStore.getState().selectedCharacter = mockCharacter1;
      mockedApiService.deleteCharacter = vi.fn().mockResolvedValue(undefined);
      mockedApiService.getCharacters = vi.fn().mockResolvedValue([mockCharacter1, mockCharacter3]);

      // Act
      await useCharacterStore.getState().deleteCharacter('char-2');

      // Assert
      const store = useCharacterStore.getState();
      expect(store.selectedCharacterId).toBe('char-1');
      expect(store.selectedCharacter).toEqual(mockCharacter1);
    });

    it('should handle deleting last character in list', async () => {
      // Arrange
      useCharacterStore.getState().characters = [mockCharacter1];
      mockedApiService.deleteCharacter = vi.fn().mockResolvedValue(undefined);
      mockedApiService.getCharacters = vi.fn().mockResolvedValue([]);

      // Act
      await useCharacterStore.getState().deleteCharacter('char-1');

      // Assert
      const store = useCharacterStore.getState();
      expect(store.characters).toHaveLength(0);
    });
  });

  describe('Error State Management', () => {
    it('should persist error state across operations', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      mockedApiService.getCharacters = vi.fn().mockRejectedValue(networkError);

      // Act
      await useCharacterStore.getState().fetchCharacters();

      // Assert
      let store = useCharacterStore.getState();
      expect(store.error).toBe('Network Error');

      // Try another operation
      mockedApiService.createCharacter = vi.fn().mockRejectedValue(new Error('Another error'));
      await useCharacterStore.getState().createCharacter('Test');

      // Error should be updated
      store = useCharacterStore.getState();
      expect(store.error).toBe('Another error');
    });

    it('should clear error on successful operation after previous error', async () => {
      // Arrange
      useCharacterStore.getState().error = 'Previous error';
      mockedApiService.getCharacters = vi.fn().mockResolvedValue(mockCharacters);

      // Act
      await useCharacterStore.getState().fetchCharacters();

      // Assert
      expect(useCharacterStore.getState().error).toBeNull();
    });
  });
});
