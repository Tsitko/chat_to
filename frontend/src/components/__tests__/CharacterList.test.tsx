/**
 * CharacterList Component Tests.
 *
 * Comprehensive tests for CharacterList component covering:
 * - Rendering character list
 * - Character selection
 * - Empty state
 * - Loading state
 * - Error state
 * - Character creation button
 * - User interactions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CharacterList } from '../CharacterList';
import { useCharacterStore } from '../../store/characterStore';
import {
  mockCharacters,
  mockCharacter1,
  mockCharacter2,
  mockCharacter3,
} from '../../tests/mockData';

// Mock the character store
vi.mock('../../store/characterStore');
const mockedUseCharacterStore = vi.mocked(useCharacterStore);

describe('CharacterList Component', () => {
  const mockFetchCharacters = vi.fn();
  const mockSelectCharacter = vi.fn();

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementation
    mockedUseCharacterStore.mockReturnValue({
      characters: [],
      selectedCharacterId: null,
      selectedCharacter: null,
      isLoading: false,
      error: null,
      fetchCharacters: mockFetchCharacters,
      selectCharacter: mockSelectCharacter,
      createCharacter: vi.fn(),
      updateCharacter: vi.fn(),
      deleteCharacter: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render character list container', () => {
      // Act
      render(<CharacterList />);

      // Assert
      const container = screen.getByTestId('character-list');
      expect(container).toBeInTheDocument();
    });

    it('should render all characters when provided', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: mockCharacters,
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);

      // Assert
      expect(screen.getByText('Hegel')).toBeInTheDocument();
      expect(screen.getByText('Kant')).toBeInTheDocument();
      expect(screen.getByText('Nietzsche')).toBeInTheDocument();
    });

    it('should display character avatars when available', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: mockCharacters,
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);

      // Assert
      const avatars = screen.getAllByRole('img');
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('should handle characters without avatars gracefully', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: [mockCharacter2], // Kant has no avatar
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);

      // Assert
      expect(screen.getByText('Kant')).toBeInTheDocument();
      // Should render placeholder or default avatar
    });

    it('should highlight selected character', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: mockCharacters,
        selectedCharacterId: 'char-1',
        selectedCharacter: mockCharacter1,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);

      // Assert
      const hegelElement = screen.getByText('Hegel').closest('.character-item');
      expect(hegelElement).toHaveClass('selected');
    });

    it('should not highlight any character when none selected', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: mockCharacters,
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);

      // Assert
      const listitems = screen.getAllByRole('listitem');
      const selectedElements = listitems.filter((item) => item.className.includes('selected'));
      expect(selectedElements.length).toBe(0);
    });
  });

  describe('Empty State', () => {
    it('should display empty state message when no characters exist', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: [],
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);

      // Assert
      expect(screen.getByText(/no characters/i)).toBeInTheDocument();
    });

    it('should not display character items when list is empty', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: [],
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);

      // Assert
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator when fetching characters', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: [],
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: true,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);

      // Assert
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should not display characters while loading', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: mockCharacters,
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: true,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);

      // Assert
      expect(screen.queryByText('Hegel')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when fetch fails', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: [],
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: 'Failed to load characters',
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);

      // Assert
      expect(screen.getByText(/failed to load characters/i)).toBeInTheDocument();
    });

    it('should not display characters when error occurs', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: mockCharacters,
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: 'Network error',
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);

      // Assert
      expect(screen.queryByText('Hegel')).not.toBeInTheDocument();
    });

    it('should provide retry button on error', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: [],
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: 'Network error',
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);

      // Assert
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call selectCharacter when character is clicked', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: mockCharacters,
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);
      const hegelElement = screen.getByText('Hegel');
      fireEvent.click(hegelElement);

      // Assert
      expect(mockSelectCharacter).toHaveBeenCalledWith('char-1');
      expect(mockSelectCharacter).toHaveBeenCalledTimes(1);
    });

    it('should call onCharacterSelect callback when provided', () => {
      // Arrange
      const mockOnSelect = vi.fn();
      mockedUseCharacterStore.mockReturnValue({
        characters: mockCharacters,
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList onCharacterSelect={mockOnSelect} />);
      const hegelElement = screen.getByText('Hegel');
      fireEvent.click(hegelElement);

      // Assert
      expect(mockOnSelect).toHaveBeenCalledWith('char-1');
    });

    it('should allow selecting different characters sequentially', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: mockCharacters,
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);
      fireEvent.click(screen.getByText('Hegel'));
      fireEvent.click(screen.getByText('Kant'));

      // Assert
      expect(mockSelectCharacter).toHaveBeenCalledWith('char-1');
      expect(mockSelectCharacter).toHaveBeenCalledWith('char-2');
      expect(mockSelectCharacter).toHaveBeenCalledTimes(2);
    });

    it('should handle double-click on same character', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: mockCharacters,
        selectedCharacterId: 'char-1',
        selectedCharacter: mockCharacter1,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);
      const hegelElement = screen.getByText('Hegel');
      fireEvent.click(hegelElement);
      fireEvent.click(hegelElement);

      // Assert
      expect(mockSelectCharacter).toHaveBeenCalledTimes(2);
    });

    it('should fetch characters on mount', () => {
      // Arrange & Act
      render(<CharacterList />);

      // Assert
      expect(mockFetchCharacters).toHaveBeenCalledTimes(1);
    });

    it('should retry fetching characters when retry button clicked', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: [],
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: 'Network error',
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Assert
      expect(mockFetchCharacters).toHaveBeenCalledTimes(2); // Once on mount, once on retry
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation through characters', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: mockCharacters,
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);
      const hegelElement = screen.getByText('Hegel').closest('div');
      if (hegelElement) {
        fireEvent.keyDown(hegelElement, { key: 'Enter', code: 'Enter' });
      }

      // Assert
      expect(mockSelectCharacter).toHaveBeenCalledWith('char-1');
    });

    it('should handle Space key to select character', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: mockCharacters,
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);
      const kantElement = screen.getByText('Kant').closest('div');
      if (kantElement) {
        fireEvent.keyDown(kantElement, { key: ' ', code: 'Space' });
      }

      // Assert
      expect(mockSelectCharacter).toHaveBeenCalledWith('char-2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle character with extremely long name', () => {
      // Arrange
      const longNameCharacter = {
        ...mockCharacter1,
        name: 'a'.repeat(100),
      };
      mockedUseCharacterStore.mockReturnValue({
        characters: [longNameCharacter],
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);

      // Assert
      expect(screen.getByText(longNameCharacter.name)).toBeInTheDocument();
    });

    it('should handle character with special characters in name', () => {
      // Arrange
      const specialCharacter = {
        ...mockCharacter1,
        name: 'Test & <Character>',
      };
      mockedUseCharacterStore.mockReturnValue({
        characters: [specialCharacter],
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);

      // Assert
      expect(screen.getByText('Test & <Character>')).toBeInTheDocument();
    });

    it('should handle null or undefined in characters array gracefully', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: [mockCharacter1, null as any, mockCharacter2, undefined as any],
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act & Assert - should not crash
      expect(() => render(<CharacterList />)).not.toThrow();
    });

    it('should handle very large character list', () => {
      // Arrange
      const manyCharacters = Array.from({ length: 1000 }, (_, i) => ({
        id: `char-${i}`,
        name: `Character ${i}`,
        avatar_url: null,
        created_at: '2025-01-01T00:00:00Z',
        books: [],
      }));
      mockedUseCharacterStore.mockReturnValue({
        characters: manyCharacters,
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act & Assert - should render without crashing
      expect(() => render(<CharacterList />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: mockCharacters,
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);

      // Assert
      const list = screen.getByRole('list') || screen.getByTestId('character-list');
      expect(list).toBeInTheDocument();
    });

    it('should mark selected character with aria-selected', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: mockCharacters,
        selectedCharacterId: 'char-1',
        selectedCharacter: mockCharacter1,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);

      // Assert
      const hegelElement = screen.getByText('Hegel').closest('[role="listitem"]');
      expect(hegelElement).toHaveAttribute('aria-selected', 'true');
    });

    it('should have proper role for character items', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: mockCharacters,
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: mockFetchCharacters,
        selectCharacter: mockSelectCharacter,
        createCharacter: vi.fn(),
        updateCharacter: vi.fn(),
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterList />);

      // Assert
      const items = screen.getAllByRole('listitem');
      expect(items.length).toBe(3);
    });
  });
});
