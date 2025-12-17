/**
 * Zustand store for managing character state.
 */

import { create } from 'zustand';
import type { Character } from '../types/character';
import { apiService } from '../services/api';

interface CharacterStore {
  characters: Character[];
  selectedCharacterId: string | null;
  selectedCharacter: Character | undefined;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCharacters: () => Promise<void>;
  selectCharacter: (characterId: string | null) => void;
  createCharacter: (name: string, avatar?: File, books?: File[]) => Promise<void>;
  updateCharacter: (characterId: string, name?: string, avatar?: File, books?: File[]) => Promise<void>;
  deleteCharacter: (characterId: string) => Promise<void>;
}

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  characters: [],
  selectedCharacterId: null,
  selectedCharacter: undefined,
  isLoading: false,
  error: null,

  fetchCharacters: async () => {
    set({ isLoading: true, error: null });
    try {
      const characters = await apiService.getCharacters();
      set({ characters, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch characters';
      set({ error: errorMessage, isLoading: false });
    }
  },

  selectCharacter: (characterId: string | null) => {
    if (characterId === null) {
      set({
        selectedCharacterId: null,
        selectedCharacter: undefined,
      });
      return;
    }
    const { characters } = get();
    const character = characters.find((c) => c.id === characterId);
    set({
      selectedCharacterId: characterId,
      selectedCharacter: character,
    });
  },

  createCharacter: async (name: string, avatar?: File, books?: File[]) => {
    set({ isLoading: true, error: null });
    try {
      const newCharacter = await apiService.createCharacter({ name, avatar, books });
      const { characters } = get();
      set({
        characters: [...characters, newCharacter],
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create character';
      set({ error: errorMessage, isLoading: false });
    }
  },

  updateCharacter: async (characterId: string, name?: string, avatar?: File, books?: File[]) => {
    set({ isLoading: true, error: null });
    try {
      const updatedCharacter = await apiService.updateCharacter(characterId, { name, avatar, books });
      const { characters, selectedCharacterId } = get();
      const updatedCharacters = characters.map((c) =>
        c.id === characterId ? updatedCharacter : c
      );
      set({
        characters: updatedCharacters,
        selectedCharacter: selectedCharacterId === characterId ? updatedCharacter : get().selectedCharacter,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update character';
      set({ error: errorMessage, isLoading: false });
    }
  },

  deleteCharacter: async (characterId: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.deleteCharacter(characterId);
      const { characters, selectedCharacterId } = get();
      const updatedCharacters = characters.filter((c) => c.id !== characterId);
      set({
        characters: updatedCharacters,
        selectedCharacterId: selectedCharacterId === characterId ? null : selectedCharacterId,
        selectedCharacter: selectedCharacterId === characterId ? null as any : get().selectedCharacter,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete character';
      set({ error: errorMessage, isLoading: false });
    }
  },
}));
