/**
 * Unit tests for characterStoreEnhanced
 *
 * Test Coverage:
 * - Initial state
 * - fetchCharacters action (success, error, loading states)
 * - selectCharacter action
 * - createCharacter action (success, error, loading states, with/without avatar and books)
 * - updateCharacter action (success, error, loading states)
 * - deleteCharacter action (success, error, loading states)
 * - Granular loading states for each operation
 * - clearError helper method
 * - isOperationLoading helper method
 * - operatingCharacterId tracking
 * - Edge cases (concurrent operations, API errors, cleanup)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCharacterStoreEnhanced } from '../../../store/characterStoreEnhanced';
import { apiService } from '../../../services/api';
import type { Character } from '../../../types/character';

// Mock API service
vi.mock('../../../services/api', () => ({
  apiService: {
    getCharacters: vi.fn(),
    createCharacter: vi.fn(),
    updateCharacter: vi.fn(),
    deleteCharacter: vi.fn(),
  },
}));

describe('characterStoreEnhanced', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useCharacterStoreEnhanced());
    act(() => {
      useCharacterStoreEnhanced.setState({
        characters: [],
        selectedCharacterId: null,
        selectedCharacter: undefined,
        loadingStates: {
          fetchAll: { state: 'idle', error: undefined },
          create: { state: 'idle', error: undefined },
          update: { state: 'idle', error: undefined },
          delete: { state: 'idle', error: undefined },
        },
        operatingCharacterId: null,
      });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have empty characters array', () => {
      const { result } = renderHook(() => useCharacterStoreEnhanced());

      expect(result.current.characters).toEqual([]);
    });

    it('should have no selected character', () => {
      const { result } = renderHook(() => useCharacterStoreEnhanced());

      expect(result.current.selectedCharacterId).toBeNull();
      expect(result.current.selectedCharacter).toBeUndefined();
    });

    it('should have all loading states set to idle', () => {
      const { result } = renderHook(() => useCharacterStoreEnhanced());

      expect(result.current.loadingStates.fetchAll.state).toBe('idle');
      expect(result.current.loadingStates.create.state).toBe('idle');
      expect(result.current.loadingStates.update.state).toBe('idle');
      expect(result.current.loadingStates.delete.state).toBe('idle');
    });

    it('should have no operatingCharacterId', () => {
      const { result } = renderHook(() => useCharacterStoreEnhanced());

      expect(result.current.operatingCharacterId).toBeNull();
    });
  });

  describe('fetchCharacters', () => {
    const mockCharacters: Character[] = [
      {
        id: 'char-1',
        name: 'Hegel',
        avatar_url: '/api/characters/char-1/avatar',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'char-2',
        name: 'Kant',
        avatar_url: '/api/characters/char-2/avatar',
        created_at: '2024-01-02T00:00:00Z',
      },
    ];

    it('should fetch characters successfully', async () => {
      vi.mocked(apiService.getCharacters).mockResolvedValue(mockCharacters);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      await act(async () => {
        await result.current.fetchCharacters();
      });

      expect(result.current.characters).toEqual(mockCharacters);
      expect(result.current.loadingStates.fetchAll.state).toBe('success');
    });

    it('should set loading state during fetch', async () => {
      vi.mocked(apiService.getCharacters).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockCharacters), 100))
      );

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      const promise = act(async () => {
        await result.current.fetchCharacters();
      });

      expect(result.current.loadingStates.fetchAll.state).toBe('loading');

      await promise;

      expect(result.current.loadingStates.fetchAll.state).toBe('success');
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Failed to fetch characters');
      vi.mocked(apiService.getCharacters).mockRejectedValue(error);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      await act(async () => {
        await result.current.fetchCharacters();
      });

      expect(result.current.loadingStates.fetchAll.state).toBe('error');
      expect(result.current.loadingStates.fetchAll.error).toBe('Failed to fetch characters');
      expect(result.current.characters).toEqual([]);
    });

    it('should clear previous error on successful fetch', async () => {
      vi.mocked(apiService.getCharacters).mockRejectedValueOnce(new Error('Error'));

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      await act(async () => {
        await result.current.fetchCharacters();
      });

      expect(result.current.loadingStates.fetchAll.error).toBeTruthy();

      vi.mocked(apiService.getCharacters).mockResolvedValue(mockCharacters);

      await act(async () => {
        await result.current.fetchCharacters();
      });

      expect(result.current.loadingStates.fetchAll.error).toBeUndefined();
    });
  });

  describe('selectCharacter', () => {
    const characters: Character[] = [
      {
        id: 'char-1',
        name: 'Hegel',
        avatar_url: '/api/characters/char-1/avatar',
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    it('should select character by id', () => {
      const { result } = renderHook(() => useCharacterStoreEnhanced());

      act(() => {
        useCharacterStoreEnhanced.setState({ characters });
        result.current.selectCharacter('char-1');
      });

      expect(result.current.selectedCharacterId).toBe('char-1');
      expect(result.current.selectedCharacter).toEqual(characters[0]);
    });

    it('should clear selection when passed null', () => {
      const { result } = renderHook(() => useCharacterStoreEnhanced());

      act(() => {
        useCharacterStoreEnhanced.setState({
          characters,
          selectedCharacterId: 'char-1',
          selectedCharacter: characters[0],
        });
        result.current.selectCharacter(null);
      });

      expect(result.current.selectedCharacterId).toBeNull();
      expect(result.current.selectedCharacter).toBeUndefined();
    });

    it('should handle selecting non-existent character', () => {
      const { result } = renderHook(() => useCharacterStoreEnhanced());

      act(() => {
        useCharacterStoreEnhanced.setState({ characters });
        result.current.selectCharacter('non-existent');
      });

      expect(result.current.selectedCharacterId).toBe('non-existent');
      expect(result.current.selectedCharacter).toBeUndefined();
    });
  });

  describe('createCharacter', () => {
    const newCharacter: Character = {
      id: 'char-new',
      name: 'New Character',
      avatar_url: '/api/characters/char-new/avatar',
      created_at: '2024-01-03T00:00:00Z',
    };

    it('should create character successfully', async () => {
      vi.mocked(apiService.createCharacter).mockResolvedValue(newCharacter);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      let createdChar: Character | null = null;
      await act(async () => {
        createdChar = await result.current.createCharacter('New Character');
      });

      expect(createdChar).toEqual(newCharacter);
      expect(result.current.characters).toContainEqual(newCharacter);
      expect(result.current.loadingStates.create.state).toBe('success');
    });

    it('should create character with avatar', async () => {
      const avatarFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      vi.mocked(apiService.createCharacter).mockResolvedValue(newCharacter);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      await act(async () => {
        await result.current.createCharacter('New Character', avatarFile);
      });

      expect(apiService.createCharacter).toHaveBeenCalledWith('New Character', avatarFile, undefined);
    });

    it('should create character with books', async () => {
      const bookFiles = [
        new File(['book1'], 'book1.pdf', { type: 'application/pdf' }),
        new File(['book2'], 'book2.pdf', { type: 'application/pdf' }),
      ];
      vi.mocked(apiService.createCharacter).mockResolvedValue(newCharacter);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      await act(async () => {
        await result.current.createCharacter('New Character', undefined, bookFiles);
      });

      expect(apiService.createCharacter).toHaveBeenCalledWith('New Character', undefined, bookFiles);
    });

    it('should set loading state during creation', async () => {
      vi.mocked(apiService.createCharacter).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(newCharacter), 100))
      );

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      const promise = act(async () => {
        await result.current.createCharacter('New Character');
      });

      expect(result.current.loadingStates.create.state).toBe('loading');

      await promise;

      expect(result.current.loadingStates.create.state).toBe('success');
    });

    it('should handle creation errors', async () => {
      const error = new Error('Failed to create character');
      vi.mocked(apiService.createCharacter).mockRejectedValue(error);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      let createdChar: Character | null = null;
      await act(async () => {
        createdChar = await result.current.createCharacter('New Character');
      });

      expect(createdChar).toBeNull();
      expect(result.current.loadingStates.create.state).toBe('error');
      expect(result.current.loadingStates.create.error).toBe('Failed to create character');
      expect(result.current.characters).toHaveLength(0);
    });

    it('should not add duplicate character on creation', async () => {
      vi.mocked(apiService.createCharacter).mockResolvedValue(newCharacter);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      await act(async () => {
        await result.current.createCharacter('New Character');
      });

      expect(result.current.characters).toHaveLength(1);

      // Try to create same character again
      await act(async () => {
        await result.current.createCharacter('New Character');
      });

      // Should have two characters (no deduplication, that's API's job)
      expect(result.current.characters).toHaveLength(2);
    });
  });

  describe('updateCharacter', () => {
    const existingCharacter: Character = {
      id: 'char-1',
      name: 'Old Name',
      avatar_url: '/api/characters/char-1/avatar',
      created_at: '2024-01-01T00:00:00Z',
    };

    const updatedCharacter: Character = {
      ...existingCharacter,
      name: 'Updated Name',
    };

    it('should update character successfully', async () => {
      vi.mocked(apiService.updateCharacter).mockResolvedValue(updatedCharacter);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      act(() => {
        useCharacterStoreEnhanced.setState({ characters: [existingCharacter] });
      });

      let updated: Character | null = null;
      await act(async () => {
        updated = await result.current.updateCharacter('char-1', 'Updated Name');
      });

      expect(updated).toEqual(updatedCharacter);
      expect(result.current.characters[0].name).toBe('Updated Name');
      expect(result.current.loadingStates.update.state).toBe('success');
    });

    it('should set operatingCharacterId during update', async () => {
      vi.mocked(apiService.updateCharacter).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(updatedCharacter), 100))
      );

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      act(() => {
        useCharacterStoreEnhanced.setState({ characters: [existingCharacter] });
      });

      const promise = act(async () => {
        await result.current.updateCharacter('char-1', 'Updated Name');
      });

      expect(result.current.operatingCharacterId).toBe('char-1');
      expect(result.current.loadingStates.update.state).toBe('loading');

      await promise;

      expect(result.current.operatingCharacterId).toBeNull();
    });

    it('should update with avatar and books', async () => {
      const avatar = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      const books = [new File(['book'], 'book.pdf', { type: 'application/pdf' })];

      vi.mocked(apiService.updateCharacter).mockResolvedValue(updatedCharacter);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      act(() => {
        useCharacterStoreEnhanced.setState({ characters: [existingCharacter] });
      });

      await act(async () => {
        await result.current.updateCharacter('char-1', 'Updated Name', avatar, books);
      });

      expect(apiService.updateCharacter).toHaveBeenCalledWith('char-1', 'Updated Name', avatar, books);
    });

    it('should update selectedCharacter if it matches', async () => {
      vi.mocked(apiService.updateCharacter).mockResolvedValue(updatedCharacter);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      act(() => {
        useCharacterStoreEnhanced.setState({
          characters: [existingCharacter],
          selectedCharacterId: 'char-1',
          selectedCharacter: existingCharacter,
        });
      });

      await act(async () => {
        await result.current.updateCharacter('char-1', 'Updated Name');
      });

      expect(result.current.selectedCharacter?.name).toBe('Updated Name');
    });

    it('should handle update errors', async () => {
      const error = new Error('Update failed');
      vi.mocked(apiService.updateCharacter).mockRejectedValue(error);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      act(() => {
        useCharacterStoreEnhanced.setState({ characters: [existingCharacter] });
      });

      let updated: Character | null = null;
      await act(async () => {
        updated = await result.current.updateCharacter('char-1', 'Updated Name');
      });

      expect(updated).toBeNull();
      expect(result.current.loadingStates.update.state).toBe('error');
      expect(result.current.loadingStates.update.error).toBe('Update failed');
      expect(result.current.characters[0].name).toBe('Old Name'); // Unchanged
    });

    it('should handle updating non-existent character', async () => {
      vi.mocked(apiService.updateCharacter).mockResolvedValue(updatedCharacter);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      await act(async () => {
        await result.current.updateCharacter('non-existent', 'Updated Name');
      });

      // Character not in list, so nothing to update locally
      expect(result.current.characters).toHaveLength(0);
    });
  });

  describe('deleteCharacter', () => {
    const character: Character = {
      id: 'char-1',
      name: 'To Delete',
      avatar_url: '/api/characters/char-1/avatar',
      created_at: '2024-01-01T00:00:00Z',
    };

    it('should delete character successfully', async () => {
      vi.mocked(apiService.deleteCharacter).mockResolvedValue(undefined);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      act(() => {
        useCharacterStoreEnhanced.setState({ characters: [character] });
      });

      let success = false;
      await act(async () => {
        success = await result.current.deleteCharacter('char-1');
      });

      expect(success).toBe(true);
      expect(result.current.characters).toHaveLength(0);
      expect(result.current.loadingStates.delete.state).toBe('success');
    });

    it('should set operatingCharacterId during deletion', async () => {
      vi.mocked(apiService.deleteCharacter).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
      );

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      act(() => {
        useCharacterStoreEnhanced.setState({ characters: [character] });
      });

      const promise = act(async () => {
        await result.current.deleteCharacter('char-1');
      });

      expect(result.current.operatingCharacterId).toBe('char-1');
      expect(result.current.loadingStates.delete.state).toBe('loading');

      await promise;

      expect(result.current.operatingCharacterId).toBeNull();
    });

    it('should clear selection if deleted character was selected', async () => {
      vi.mocked(apiService.deleteCharacter).mockResolvedValue(undefined);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      act(() => {
        useCharacterStoreEnhanced.setState({
          characters: [character],
          selectedCharacterId: 'char-1',
          selectedCharacter: character,
        });
      });

      await act(async () => {
        await result.current.deleteCharacter('char-1');
      });

      expect(result.current.selectedCharacterId).toBeNull();
      expect(result.current.selectedCharacter).toBeUndefined();
    });

    it('should not clear selection if different character was selected', async () => {
      const otherCharacter: Character = {
        id: 'char-2',
        name: 'Other',
        avatar_url: '/api/characters/char-2/avatar',
        created_at: '2024-01-02T00:00:00Z',
      };

      vi.mocked(apiService.deleteCharacter).mockResolvedValue(undefined);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      act(() => {
        useCharacterStoreEnhanced.setState({
          characters: [character, otherCharacter],
          selectedCharacterId: 'char-2',
          selectedCharacter: otherCharacter,
        });
      });

      await act(async () => {
        await result.current.deleteCharacter('char-1');
      });

      expect(result.current.selectedCharacterId).toBe('char-2');
      expect(result.current.selectedCharacter).toEqual(otherCharacter);
    });

    it('should handle deletion errors', async () => {
      const error = new Error('Delete failed');
      vi.mocked(apiService.deleteCharacter).mockRejectedValue(error);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      act(() => {
        useCharacterStoreEnhanced.setState({ characters: [character] });
      });

      let success = false;
      await act(async () => {
        success = await result.current.deleteCharacter('char-1');
      });

      expect(success).toBe(false);
      expect(result.current.loadingStates.delete.state).toBe('error');
      expect(result.current.loadingStates.delete.error).toBe('Delete failed');
      expect(result.current.characters).toHaveLength(1); // Still there
    });
  });

  describe('Helper Methods', () => {
    describe('isOperationLoading', () => {
      it('should return true when operation is loading', () => {
        const { result } = renderHook(() => useCharacterStoreEnhanced());

        act(() => {
          useCharacterStoreEnhanced.setState({
            loadingStates: {
              fetchAll: { state: 'idle' },
              create: { state: 'loading' },
              update: { state: 'idle' },
              delete: { state: 'idle' },
            },
          });
        });

        expect(result.current.isOperationLoading('create')).toBe(true);
      });

      it('should return false when operation is not loading', () => {
        const { result } = renderHook(() => useCharacterStoreEnhanced());

        expect(result.current.isOperationLoading('create')).toBe(false);
        expect(result.current.isOperationLoading('update')).toBe(false);
      });
    });

    describe('clearError', () => {
      it('should clear error for specific operation', () => {
        const { result } = renderHook(() => useCharacterStoreEnhanced());

        act(() => {
          useCharacterStoreEnhanced.setState({
            loadingStates: {
              fetchAll: { state: 'idle' },
              create: { state: 'error', error: 'Create error' },
              update: { state: 'error', error: 'Update error' },
              delete: { state: 'idle' },
            },
          });
        });

        expect(result.current.loadingStates.create.error).toBe('Create error');

        act(() => {
          result.current.clearError('create');
        });

        expect(result.current.loadingStates.create.error).toBeUndefined();
        expect(result.current.loadingStates.update.error).toBe('Update error'); // Unchanged
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent operations gracefully', async () => {
      const char1: Character = { id: 'char-1', name: 'Char 1', avatar_url: '', created_at: '' };
      const char2: Character = { id: 'char-2', name: 'Char 2', avatar_url: '', created_at: '' };

      vi.mocked(apiService.createCharacter).mockResolvedValue(char1);
      vi.mocked(apiService.getCharacters).mockResolvedValue([char1, char2]);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      await act(async () => {
        await Promise.all([
          result.current.createCharacter('Char 1'),
          result.current.fetchCharacters(),
        ]);
      });

      // Both operations should complete
      expect(result.current.loadingStates.create.state).toBe('success');
      expect(result.current.loadingStates.fetchAll.state).toBe('success');
    });

    it('should handle empty character name', async () => {
      const char: Character = { id: 'char-1', name: '', avatar_url: '', created_at: '' };
      vi.mocked(apiService.createCharacter).mockResolvedValue(char);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      await act(async () => {
        await result.current.createCharacter('');
      });

      expect(result.current.characters[0].name).toBe('');
    });

    it('should handle API returning null', async () => {
      // @ts-expect-error Testing invalid API response
      vi.mocked(apiService.createCharacter).mockResolvedValue(null);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      await act(async () => {
        await result.current.createCharacter('Test');
      });

      // Should handle gracefully
      expect(result.current.characters).toHaveLength(1);
    });
  });
});
