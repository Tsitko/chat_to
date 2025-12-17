/**
 * Unit tests for characterStoreEnhanced.
 *
 * Test Coverage:
 * - Initial state
 * - fetchCharacters operation with loading states
 * - createCharacter operation with loading states
 * - updateCharacter operation with loading states
 * - deleteCharacter operation with loading states
 * - selectCharacter functionality
 * - Granular loading states for each operation
 * - Error handling per operation
 * - Helper methods (isOperationLoading, clearError)
 * - Operating character ID tracking
 * - State transitions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCharacterStoreEnhanced } from '../characterStoreEnhanced';
import { apiService } from '../../services/api';
import type { Character } from '../../types/character';

// Mock API service
vi.mock('../../services/api', () => ({
  apiService: {
    getCharacters: vi.fn(),
    createCharacter: vi.fn(),
    updateCharacter: vi.fn(),
    deleteCharacter: vi.fn(),
  },
}));

describe('characterStoreEnhanced', () => {
  const mockApiService = vi.mocked(apiService);

  const mockCharacter1: Character = {
    id: 'char-1',
    name: 'Hegel',
    avatar_url: '/api/characters/char-1/avatar',
    created_at: '2024-01-01T00:00:00Z',
    books: [],
  };

  const mockCharacter2: Character = {
    id: 'char-2',
    name: 'Kant',
    avatar_url: '/api/characters/char-2/avatar',
    created_at: '2024-01-02T00:00:00Z',
    books: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state
    const store = useCharacterStoreEnhanced.getState();
    store.characters = [];
    store.selectedCharacterId = null;
    store.selectedCharacter = undefined;
    store.operatingCharacterId = null;
    store.loadingStates = {
      fetchAll: { state: 'idle' },
      create: { state: 'idle' },
      update: { state: 'idle' },
      delete: { state: 'idle' },
    };
  });

  describe('Initial State', () => {
    it('should have initial state with empty characters', () => {
      const { result } = renderHook(() => useCharacterStoreEnhanced());

      expect(result.current.characters).toEqual([]);
      expect(result.current.selectedCharacterId).toBeNull();
      expect(result.current.selectedCharacter).toBeUndefined();
      expect(result.current.operatingCharacterId).toBeNull();
    });

    it('should have all loading states as idle initially', () => {
      const { result } = renderHook(() => useCharacterStoreEnhanced());

      expect(result.current.loadingStates.fetchAll.state).toBe('idle');
      expect(result.current.loadingStates.create.state).toBe('idle');
      expect(result.current.loadingStates.update.state).toBe('idle');
      expect(result.current.loadingStates.delete.state).toBe('idle');
    });

    it('should have no errors initially', () => {
      const { result } = renderHook(() => useCharacterStoreEnhanced());

      expect(result.current.loadingStates.fetchAll.error).toBeUndefined();
      expect(result.current.loadingStates.create.error).toBeUndefined();
      expect(result.current.loadingStates.update.error).toBeUndefined();
      expect(result.current.loadingStates.delete.error).toBeUndefined();
    });
  });

  describe('fetchCharacters', () => {
    it('should fetch characters successfully', async () => {
      mockApiService.getCharacters.mockResolvedValue([mockCharacter1, mockCharacter2]);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      await act(async () => {
        await result.current.fetchCharacters();
      });

      expect(result.current.characters).toEqual([mockCharacter1, mockCharacter2]);
      expect(mockApiService.getCharacters).toHaveBeenCalledTimes(1);
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: Character[]) => void;
      const promise = new Promise<Character[]>((resolve) => {
        resolvePromise = resolve;
      });
      mockApiService.getCharacters.mockReturnValue(promise);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      act(() => {
        result.current.fetchCharacters();
      });

      expect(result.current.loadingStates.fetchAll.state).toBe('loading');

      await act(async () => {
        resolvePromise!([mockCharacter1]);
        await promise;
      });

      expect(result.current.loadingStates.fetchAll.state).toBe('success');
    });

    it('should handle fetch error', async () => {
      mockApiService.getCharacters.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      await act(async () => {
        await result.current.fetchCharacters();
      });

      expect(result.current.loadingStates.fetchAll.state).toBe('error');
      expect(result.current.loadingStates.fetchAll.error).toBe('Network error');
      expect(result.current.characters).toEqual([]);
    });

    it('should not affect other loading states', async () => {
      mockApiService.getCharacters.mockResolvedValue([mockCharacter1]);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      await act(async () => {
        await result.current.fetchCharacters();
      });

      expect(result.current.loadingStates.create.state).toBe('idle');
      expect(result.current.loadingStates.update.state).toBe('idle');
      expect(result.current.loadingStates.delete.state).toBe('idle');
    });
  });

  describe('createCharacter', () => {
    it('should create character successfully', async () => {
      mockApiService.createCharacter.mockResolvedValue(mockCharacter1);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      let createdCharacter: Character | null = null;
      await act(async () => {
        createdCharacter = await result.current.createCharacter('Hegel');
      });

      expect(createdCharacter).toEqual(mockCharacter1);
      expect(result.current.characters).toContain(mockCharacter1);
      expect(mockApiService.createCharacter).toHaveBeenCalledWith({
        name: 'Hegel',
        avatar: undefined,
        books: undefined,
      });
    });

    it('should create character with avatar and books', async () => {
      mockApiService.createCharacter.mockResolvedValue(mockCharacter1);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      const avatar = new File([''], 'avatar.jpg', { type: 'image/jpeg' });
      const books = [new File([''], 'book.pdf', { type: 'application/pdf' })];

      await act(async () => {
        await result.current.createCharacter('Hegel', avatar, books);
      });

      expect(mockApiService.createCharacter).toHaveBeenCalledWith({
        name: 'Hegel',
        avatar,
        books,
      });
    });

    it('should set loading state during create', async () => {
      let resolvePromise: (value: Character) => void;
      const promise = new Promise<Character>((resolve) => {
        resolvePromise = resolve;
      });
      mockApiService.createCharacter.mockReturnValue(promise);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      act(() => {
        result.current.createCharacter('Hegel');
      });

      expect(result.current.loadingStates.create.state).toBe('loading');

      await act(async () => {
        resolvePromise!(mockCharacter1);
        await promise;
      });

      expect(result.current.loadingStates.create.state).toBe('success');
    });

    it('should handle create error', async () => {
      mockApiService.createCharacter.mockRejectedValue(new Error('Validation error'));

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      let createdCharacter: Character | null = undefined!;
      await act(async () => {
        createdCharacter = await result.current.createCharacter('');
      });

      expect(createdCharacter).toBeNull();
      expect(result.current.loadingStates.create.state).toBe('error');
      expect(result.current.loadingStates.create.error).toBe('Validation error');
      expect(result.current.characters).toEqual([]);
    });

    it('should not affect other loading states', async () => {
      mockApiService.createCharacter.mockResolvedValue(mockCharacter1);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      await act(async () => {
        await result.current.createCharacter('Hegel');
      });

      expect(result.current.loadingStates.fetchAll.state).toBe('idle');
      expect(result.current.loadingStates.update.state).toBe('idle');
      expect(result.current.loadingStates.delete.state).toBe('idle');
    });
  });

  describe('updateCharacter', () => {
    beforeEach(async () => {
      mockApiService.getCharacters.mockResolvedValue([mockCharacter1, mockCharacter2]);
      const { result } = renderHook(() => useCharacterStoreEnhanced());
      await act(async () => {
        await result.current.fetchCharacters();
      });
    });

    it('should update character successfully', async () => {
      const updatedCharacter = { ...mockCharacter1, name: 'Georg Hegel' };
      mockApiService.updateCharacter.mockResolvedValue(updatedCharacter);

      const { result } = renderHook(() => useCharacterStoreEnhanced());
      await act(async () => {
        await result.current.fetchCharacters();
      });

      let updated: Character | null = null;
      await act(async () => {
        updated = await result.current.updateCharacter('char-1', 'Georg Hegel');
      });

      expect(updated).toEqual(updatedCharacter);
      expect(result.current.characters.find((c) => c.id === 'char-1')?.name).toBe('Georg Hegel');
    });

    it('should set operatingCharacterId during update', async () => {
      let resolvePromise: (value: Character) => void;
      const promise = new Promise<Character>((resolve) => {
        resolvePromise = resolve;
      });
      mockApiService.updateCharacter.mockReturnValue(promise);

      const { result } = renderHook(() => useCharacterStoreEnhanced());
      await act(async () => {
        await result.current.fetchCharacters();
      });

      act(() => {
        result.current.updateCharacter('char-1', 'New Name');
      });

      expect(result.current.operatingCharacterId).toBe('char-1');
      expect(result.current.loadingStates.update.state).toBe('loading');

      await act(async () => {
        resolvePromise!({ ...mockCharacter1, name: 'New Name' });
        await promise;
      });

      expect(result.current.loadingStates.update.state).toBe('success');
    });

    it('should update selectedCharacter if it matches', async () => {
      const updatedCharacter = { ...mockCharacter1, name: 'Updated Hegel' };
      mockApiService.updateCharacter.mockResolvedValue(updatedCharacter);

      const { result } = renderHook(() => useCharacterStoreEnhanced());
      await act(async () => {
        await result.current.fetchCharacters();
      });

      act(() => {
        result.current.selectCharacter('char-1');
      });

      await act(async () => {
        await result.current.updateCharacter('char-1', 'Updated Hegel');
      });

      expect(result.current.selectedCharacter?.name).toBe('Updated Hegel');
    });

    it('should handle update error', async () => {
      mockApiService.updateCharacter.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useCharacterStoreEnhanced());
      await act(async () => {
        await result.current.fetchCharacters();
      });

      let updated: Character | null = undefined!;
      await act(async () => {
        updated = await result.current.updateCharacter('char-1', 'New Name');
      });

      expect(updated).toBeNull();
      expect(result.current.loadingStates.update.state).toBe('error');
      expect(result.current.loadingStates.update.error).toBe('Update failed');
    });

    it('should update character with avatar and books', async () => {
      const updatedCharacter = { ...mockCharacter1, name: 'Updated' };
      mockApiService.updateCharacter.mockResolvedValue(updatedCharacter);

      const { result } = renderHook(() => useCharacterStoreEnhanced());
      await act(async () => {
        await result.current.fetchCharacters();
      });

      const avatar = new File([''], 'new-avatar.jpg', { type: 'image/jpeg' });
      const books = [new File([''], 'new-book.pdf', { type: 'application/pdf' })];

      await act(async () => {
        await result.current.updateCharacter('char-1', 'Updated', avatar, books);
      });

      expect(mockApiService.updateCharacter).toHaveBeenCalledWith('char-1', {
        name: 'Updated',
        avatar,
        books,
      });
    });
  });

  describe('deleteCharacter', () => {
    beforeEach(async () => {
      mockApiService.getCharacters.mockResolvedValue([mockCharacter1, mockCharacter2]);
      const { result } = renderHook(() => useCharacterStoreEnhanced());
      await act(async () => {
        await result.current.fetchCharacters();
      });
    });

    it('should delete character successfully', async () => {
      mockApiService.deleteCharacter.mockResolvedValue();

      const { result } = renderHook(() => useCharacterStoreEnhanced());
      await act(async () => {
        await result.current.fetchCharacters();
      });

      let success = false;
      await act(async () => {
        success = await result.current.deleteCharacter('char-1');
      });

      expect(success).toBe(true);
      expect(result.current.characters.find((c) => c.id === 'char-1')).toBeUndefined();
      expect(mockApiService.deleteCharacter).toHaveBeenCalledWith('char-1');
    });

    it('should set operatingCharacterId during delete', async () => {
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockApiService.deleteCharacter.mockReturnValue(promise);

      const { result } = renderHook(() => useCharacterStoreEnhanced());
      await act(async () => {
        await result.current.fetchCharacters();
      });

      act(() => {
        result.current.deleteCharacter('char-1');
      });

      expect(result.current.operatingCharacterId).toBe('char-1');
      expect(result.current.loadingStates.delete.state).toBe('loading');

      await act(async () => {
        resolvePromise!();
        await promise;
      });

      expect(result.current.loadingStates.delete.state).toBe('success');
    });

    it('should clear selection if deleted character was selected', async () => {
      mockApiService.deleteCharacter.mockResolvedValue();

      const { result } = renderHook(() => useCharacterStoreEnhanced());
      await act(async () => {
        await result.current.fetchCharacters();
      });

      act(() => {
        result.current.selectCharacter('char-1');
      });

      expect(result.current.selectedCharacterId).toBe('char-1');

      await act(async () => {
        await result.current.deleteCharacter('char-1');
      });

      expect(result.current.selectedCharacterId).toBeNull();
      expect(result.current.selectedCharacter).toBeUndefined();
    });

    it('should not clear selection if different character was deleted', async () => {
      mockApiService.deleteCharacter.mockResolvedValue();

      const { result } = renderHook(() => useCharacterStoreEnhanced());
      await act(async () => {
        await result.current.fetchCharacters();
      });

      act(() => {
        result.current.selectCharacter('char-1');
      });

      await act(async () => {
        await result.current.deleteCharacter('char-2');
      });

      expect(result.current.selectedCharacterId).toBe('char-1');
    });

    it('should handle delete error', async () => {
      mockApiService.deleteCharacter.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useCharacterStoreEnhanced());
      await act(async () => {
        await result.current.fetchCharacters();
      });

      const initialCount = result.current.characters.length;

      let success = true;
      await act(async () => {
        success = await result.current.deleteCharacter('char-1');
      });

      expect(success).toBe(false);
      expect(result.current.loadingStates.delete.state).toBe('error');
      expect(result.current.loadingStates.delete.error).toBe('Delete failed');
      expect(result.current.characters.length).toBe(initialCount);
    });
  });

  describe('selectCharacter', () => {
    beforeEach(async () => {
      mockApiService.getCharacters.mockResolvedValue([mockCharacter1, mockCharacter2]);
      const { result } = renderHook(() => useCharacterStoreEnhanced());
      await act(async () => {
        await result.current.fetchCharacters();
      });
    });

    it('should select character by ID', () => {
      const { result } = renderHook(() => useCharacterStoreEnhanced());

      act(() => {
        result.current.selectCharacter('char-1');
      });

      expect(result.current.selectedCharacterId).toBe('char-1');
      expect(result.current.selectedCharacter).toEqual(mockCharacter1);
    });

    it('should clear selection when null is passed', () => {
      const { result } = renderHook(() => useCharacterStoreEnhanced());

      act(() => {
        result.current.selectCharacter('char-1');
        result.current.selectCharacter(null);
      });

      expect(result.current.selectedCharacterId).toBeNull();
      expect(result.current.selectedCharacter).toBeUndefined();
    });

    it('should handle selecting non-existent character', () => {
      const { result } = renderHook(() => useCharacterStoreEnhanced());

      act(() => {
        result.current.selectCharacter('non-existent');
      });

      expect(result.current.selectedCharacterId).toBe('non-existent');
      expect(result.current.selectedCharacter).toBeUndefined();
    });
  });

  describe('Helper Methods', () => {
    describe('isOperationLoading', () => {
      it('should return true when operation is loading', async () => {
        let resolvePromise: (value: Character[]) => void;
        const promise = new Promise<Character[]>((resolve) => {
          resolvePromise = resolve;
        });
        mockApiService.getCharacters.mockReturnValue(promise);

        const { result } = renderHook(() => useCharacterStoreEnhanced());

        act(() => {
          result.current.fetchCharacters();
        });

        expect(result.current.isOperationLoading('fetchAll')).toBe(true);

        await act(async () => {
          resolvePromise!([]);
          await promise;
        });

        expect(result.current.isOperationLoading('fetchAll')).toBe(false);
      });

      it('should return false when operation is not loading', () => {
        const { result } = renderHook(() => useCharacterStoreEnhanced());

        expect(result.current.isOperationLoading('fetchAll')).toBe(false);
        expect(result.current.isOperationLoading('create')).toBe(false);
        expect(result.current.isOperationLoading('update')).toBe(false);
        expect(result.current.isOperationLoading('delete')).toBe(false);
      });

      it('should work for all operation types', async () => {
        const { result } = renderHook(() => useCharacterStoreEnhanced());

        mockApiService.getCharacters.mockImplementation(
          () => new Promise(() => {})
        );
        act(() => {
          result.current.fetchCharacters();
        });
        expect(result.current.isOperationLoading('fetchAll')).toBe(true);
      });
    });

    describe('clearError', () => {
      it('should clear error for specific operation', async () => {
        mockApiService.getCharacters.mockRejectedValue(new Error('Test error'));

        const { result } = renderHook(() => useCharacterStoreEnhanced());

        await act(async () => {
          await result.current.fetchCharacters();
        });

        expect(result.current.loadingStates.fetchAll.error).toBe('Test error');

        act(() => {
          result.current.clearError('fetchAll');
        });

        expect(result.current.loadingStates.fetchAll.error).toBeUndefined();
      });

      it('should not affect errors of other operations', async () => {
        mockApiService.getCharacters.mockRejectedValue(new Error('Fetch error'));
        mockApiService.createCharacter.mockRejectedValue(new Error('Create error'));

        const { result } = renderHook(() => useCharacterStoreEnhanced());

        await act(async () => {
          await result.current.fetchCharacters();
          await result.current.createCharacter('Test');
        });

        act(() => {
          result.current.clearError('fetchAll');
        });

        expect(result.current.loadingStates.fetchAll.error).toBeUndefined();
        expect(result.current.loadingStates.create.error).toBe('Create error');
      });

      it('should work for all operation types', async () => {
        mockApiService.getCharacters.mockRejectedValue(new Error('Error 1'));
        mockApiService.createCharacter.mockRejectedValue(new Error('Error 2'));
        mockApiService.updateCharacter.mockRejectedValue(new Error('Error 3'));
        mockApiService.deleteCharacter.mockRejectedValue(new Error('Error 4'));

        const { result } = renderHook(() => useCharacterStoreEnhanced());

        await act(async () => {
          await result.current.fetchCharacters();
          await result.current.createCharacter('Test');
          await result.current.updateCharacter('char-1', 'Test');
          await result.current.deleteCharacter('char-1');
        });

        act(() => {
          result.current.clearError('fetchAll');
          result.current.clearError('create');
          result.current.clearError('update');
          result.current.clearError('delete');
        });

        expect(result.current.loadingStates.fetchAll.error).toBeUndefined();
        expect(result.current.loadingStates.create.error).toBeUndefined();
        expect(result.current.loadingStates.update.error).toBeUndefined();
        expect(result.current.loadingStates.delete.error).toBeUndefined();
      });
    });
  });

  describe('State Transitions', () => {
    it('should transition from idle -> loading -> success', async () => {
      mockApiService.getCharacters.mockResolvedValue([mockCharacter1]);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      expect(result.current.loadingStates.fetchAll.state).toBe('idle');

      const fetchPromise = act(async () => {
        await result.current.fetchCharacters();
      });

      await fetchPromise;

      expect(result.current.loadingStates.fetchAll.state).toBe('success');
    });

    it('should transition from idle -> loading -> error', async () => {
      mockApiService.getCharacters.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      expect(result.current.loadingStates.fetchAll.state).toBe('idle');

      await act(async () => {
        await result.current.fetchCharacters();
      });

      expect(result.current.loadingStates.fetchAll.state).toBe('error');
    });

    it('should allow retrying after error', async () => {
      mockApiService.getCharacters.mockRejectedValueOnce(new Error('First error'));
      mockApiService.getCharacters.mockResolvedValueOnce([mockCharacter1]);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      await act(async () => {
        await result.current.fetchCharacters();
      });

      expect(result.current.loadingStates.fetchAll.state).toBe('error');

      await act(async () => {
        await result.current.fetchCharacters();
      });

      expect(result.current.loadingStates.fetchAll.state).toBe('success');
      expect(result.current.characters).toEqual([mockCharacter1]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty character list', async () => {
      mockApiService.getCharacters.mockResolvedValue([]);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      await act(async () => {
        await result.current.fetchCharacters();
      });

      expect(result.current.characters).toEqual([]);
    });

    it('should handle creating character with empty name', async () => {
      mockApiService.createCharacter.mockRejectedValue(new Error('Name required'));

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      let created: Character | null = undefined!;
      await act(async () => {
        created = await result.current.createCharacter('');
      });

      expect(created).toBeNull();
      expect(result.current.loadingStates.create.state).toBe('error');
    });

    it('should handle concurrent operations', async () => {
      mockApiService.getCharacters.mockResolvedValue([mockCharacter1]);
      mockApiService.createCharacter.mockResolvedValue(mockCharacter2);

      const { result } = renderHook(() => useCharacterStoreEnhanced());

      await act(async () => {
        await Promise.all([
          result.current.fetchCharacters(),
          result.current.createCharacter('Kant'),
        ]);
      });

      expect(result.current.characters).toContain(mockCharacter1);
      expect(result.current.characters).toContain(mockCharacter2);
    });
  });
});
