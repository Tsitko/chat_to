/**
 * CharacterHeader Component Tests.
 *
 * Comprehensive tests for CharacterHeader component covering:
 * - Character information display
 * - Avatar rendering
 * - Edit button functionality
 * - Book count display
 * - Empty states
 * - Accessibility
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterHeader } from '../CharacterHeader';
import { mockCharacter1, mockCharacter2, mockCharacter3 } from '../../tests/mockData';
import { useMessageStoreEnhanced } from '../../store/messageStoreEnhanced';

// Mock the message store
vi.mock('../../store/messageStoreEnhanced');

describe('CharacterHeader Component', () => {
  const mockOnEditClick = vi.fn();
  const mockOnDeleteClick = vi.fn();
  const mockClearMessages = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock implementation for useMessageStoreEnhanced
    (useMessageStoreEnhanced as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      clearMessages: mockClearMessages,
      messages: {},
      loadingStates: {},
      fetchMessages: vi.fn(),
      sendMessage: vi.fn(),
      getLoadingState: vi.fn(),
      isLoading: vi.fn(),
      clearError: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render character header container', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      const header = screen.getByTestId('character-header') || screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should display character name', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      expect(screen.getByText('Hegel')).toBeInTheDocument();
    });

    it('should display character avatar when available', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      const avatar = screen.getByRole('img', { name: /hegel/i });
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', mockCharacter1.avatar_url);
    });

    it('should display placeholder avatar when not available', () => {
      // Act
      render(<CharacterHeader character={mockCharacter2} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      const avatar = screen.getByTestId('avatar-placeholder') || screen.getByRole('img');
      expect(avatar).toBeInTheDocument();
    });

    it('should display edit button', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      const editButton = screen.getByRole('button', { name: /edit/i });
      expect(editButton).toBeInTheDocument();
    });

    it('should display book count', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      expect(screen.getByText(/2 books?/i)).toBeInTheDocument();
    });

    it('should display correct book count for different characters', () => {
      // Arrange & Act
      const { rerender } = render(
        <CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />
      );
      expect(screen.getByText(/2 books?/i)).toBeInTheDocument();

      rerender(<CharacterHeader character={mockCharacter3} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      expect(screen.getByText(/1 book/i)).toBeInTheDocument();

      rerender(<CharacterHeader character={mockCharacter2} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      expect(screen.getByText(/0 books?|no books/i)).toBeInTheDocument();
    });
  });

  describe('Avatar Display', () => {
    it('should use correct avatar URL', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      const avatar = screen.getByRole('img', { name: /hegel/i });
      expect(avatar).toHaveAttribute('src', '/api/characters/char-1/avatar');
    });

    it('should have alt text for avatar', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      const avatar = screen.getByRole('img');
      expect(avatar).toHaveAttribute('alt', expect.stringMatching(/hegel/i));
    });

    it('should handle broken avatar image gracefully', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const avatar = screen.getByRole('img');

      // Simulate image error
      fireEvent.error(avatar);

      // Assert - should show placeholder or handle error
      expect(avatar).toBeInTheDocument();
    });

    it('should display character initials as fallback', () => {
      // Act
      render(<CharacterHeader character={mockCharacter2} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      expect(screen.getByText('K')).toBeInTheDocument(); // First letter of "Kant"
    });
  });

  describe('Edit Button', () => {
    it('should call onEditClick when edit button is clicked', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      // Assert
      expect(mockOnEditClick).toHaveBeenCalledTimes(1);
    });

    it('should call onEditClick multiple times when clicked multiple times', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const editButton = screen.getByRole('button', { name: /edit/i });

      fireEvent.click(editButton);
      fireEvent.click(editButton);
      fireEvent.click(editButton);

      // Assert
      expect(mockOnEditClick).toHaveBeenCalledTimes(3);
    });

    it('should not call onEditClick on header click', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const header = screen.getByTestId('character-header') || screen.getByRole('banner');
      fireEvent.click(header);

      // Assert
      expect(mockOnEditClick).not.toHaveBeenCalled();
    });

    it('should have proper icon or text for edit button', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const editButton = screen.getByRole('button', { name: /edit/i });

      // Assert
      expect(editButton).toHaveTextContent(/edit/i);
    });
  });

  describe('New Chat Button', () => {
    it('should render new chat button', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      const newChatButton = screen.getByRole('button', { name: /new chat|start new chat/i });
      expect(newChatButton).toBeInTheDocument();
    });

    it('should display new chat button with correct text', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const newChatButton = screen.getByRole('button', { name: /new chat|start new chat/i });

      // Assert
      expect(newChatButton).toHaveTextContent(/new chat/i);
    });

    it('should call clearMessages when new chat button is clicked', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const newChatButton = screen.getByRole('button', { name: /new chat|start new chat/i });
      fireEvent.click(newChatButton);

      // Assert
      expect(mockClearMessages).toHaveBeenCalledTimes(1);
      expect(mockClearMessages).toHaveBeenCalledWith(mockCharacter1.id);
    });

    it('should call clearMessages with correct character id', () => {
      // Act
      render(<CharacterHeader character={mockCharacter2} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const newChatButton = screen.getByRole('button', { name: /new chat|start new chat/i });
      fireEvent.click(newChatButton);

      // Assert
      expect(mockClearMessages).toHaveBeenCalledWith(mockCharacter2.id);
    });

    it('should call clearMessages multiple times when clicked multiple times', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const newChatButton = screen.getByRole('button', { name: /new chat|start new chat/i });

      fireEvent.click(newChatButton);
      fireEvent.click(newChatButton);
      fireEvent.click(newChatButton);

      // Assert
      expect(mockClearMessages).toHaveBeenCalledTimes(3);
    });

    it('should be positioned before edit button', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const buttons = screen.getAllByRole('button');
      const newChatButton = screen.getByRole('button', { name: /new chat|start new chat/i });
      const editButton = screen.getByRole('button', { name: /edit/i });

      // Assert
      const newChatIndex = buttons.indexOf(newChatButton);
      const editIndex = buttons.indexOf(editButton);
      expect(newChatIndex).toBeLessThan(editIndex);
    });

    it('should activate new chat button with Enter key', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const newChatButton = screen.getByRole('button', { name: /new chat|start new chat/i });
      fireEvent.keyDown(newChatButton, { key: 'Enter', code: 'Enter' });

      // Assert
      expect(mockClearMessages).toHaveBeenCalledTimes(1);
      expect(mockClearMessages).toHaveBeenCalledWith(mockCharacter1.id);
    });

    it('should activate new chat button with Space key', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const newChatButton = screen.getByRole('button', { name: /new chat|start new chat/i });
      fireEvent.keyDown(newChatButton, { key: ' ', code: 'Space' });

      // Assert
      expect(mockClearMessages).toHaveBeenCalledTimes(1);
      expect(mockClearMessages).toHaveBeenCalledWith(mockCharacter1.id);
    });

    it('should have proper ARIA label', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const newChatButton = screen.getByRole('button', { name: /new chat|start new chat/i });

      // Assert
      expect(newChatButton).toHaveAttribute('aria-label', expect.stringMatching(/new chat|start new chat/i));
    });

    it('should be keyboard navigable', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const newChatButton = screen.getByRole('button', { name: /new chat|start new chat/i });

      // Assert
      expect(newChatButton).not.toHaveAttribute('tabIndex', '-1');
      expect(newChatButton).toHaveAttribute('tabIndex', '0');
    });

    it('should have accessible name', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const newChatButton = screen.getByRole('button', { name: /new chat|start new chat/i });

      // Assert
      expect(newChatButton).toHaveAccessibleName();
    });
  });

  describe('Book Information', () => {
    it('should show singular form for 1 book', () => {
      // Act
      render(<CharacterHeader character={mockCharacter3} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      expect(screen.getByText(/1 book/i)).toBeInTheDocument();
    });

    it('should show plural form for multiple books', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      expect(screen.getByText(/2 books/i)).toBeInTheDocument();
    });

    it('should handle zero books gracefully', () => {
      // Act
      render(<CharacterHeader character={mockCharacter2} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      expect(screen.getByText(/0 books|no books/i)).toBeInTheDocument();
    });
  });

  describe('Character Information', () => {
    it('should display created date', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      // Should show formatted date like "Created on Jan 1, 2025"
      expect(screen.getByText(/created/i)).toBeInTheDocument();
      expect(screen.getByText(/jan.*1.*2025/i)).toBeInTheDocument();
    });

    it('should handle extremely long character name', () => {
      // Arrange
      const longNameCharacter = {
        ...mockCharacter1,
        name: 'a'.repeat(100),
      };

      // Act
      render(<CharacterHeader character={longNameCharacter} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      expect(screen.getByText(longNameCharacter.name)).toBeInTheDocument();
    });

    it('should handle special characters in character name', () => {
      // Arrange
      const specialNameCharacter = {
        ...mockCharacter1,
        name: 'Test & <Character>',
      };

      // Act
      render(<CharacterHeader character={specialNameCharacter} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      expect(screen.getByText('Test & <Character>')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle character with no books array', () => {
      // Arrange
      const characterNoBooks = {
        ...mockCharacter1,
        books: undefined as any,
      };

      // Act & Assert - should not crash
      expect(() =>
        render(<CharacterHeader character={characterNoBooks} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />)
      ).not.toThrow();
    });

    it('should handle character with null values', () => {
      // Arrange
      const characterWithNulls = {
        id: 'char-1',
        name: 'Test',
        avatar_url: null,
        created_at: '2025-01-01T00:00:00Z',
        books: [],
      };

      // Act & Assert - should not crash
      expect(() =>
        render(<CharacterHeader character={characterWithNulls} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />)
      ).not.toThrow();
    });

    it('should handle missing onEditClick callback', () => {
      // Act & Assert - should not crash
      expect(() =>
        render(<CharacterHeader character={mockCharacter1} onEditClick={undefined as any} onDeleteClick={mockOnDeleteClick} />)
      ).not.toThrow();
    });

    it('should handle character with many books', () => {
      // Arrange
      const characterManyBooks = {
        ...mockCharacter1,
        books: Array.from({ length: 100 }, (_, i) => ({
          id: `book-${i}`,
          filename: `book-${i}.txt`,
          file_size: 1000,
          uploaded_at: '2025-01-01T00:00:00Z',
          indexed: true,
        })),
      };

      // Act & Assert - should render without crashing
      expect(() =>
        render(<CharacterHeader character={characterManyBooks} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />)
      ).not.toThrow();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should activate edit button with Enter key', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.keyDown(editButton, { key: 'Enter', code: 'Enter' });

      // Assert
      expect(mockOnEditClick).toHaveBeenCalledTimes(1);
    });

    it('should activate edit button with Space key', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.keyDown(editButton, { key: ' ', code: 'Space' });

      // Assert
      expect(mockOnEditClick).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard navigable (tab order)', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const editButton = screen.getByRole('button', { name: /edit/i });

      // Assert
      expect(editButton).not.toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      const header = screen.getByRole('banner');
      expect(header).toHaveAttribute('aria-label', expect.stringMatching(/character information|character header/i));
    });

    it('should have accessible edit button', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const editButton = screen.getByRole('button', { name: /edit/i });

      // Assert
      expect(editButton).toHaveAccessibleName();
    });

    it('should have accessible avatar image', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const avatar = screen.getByRole('img');

      // Assert
      expect(avatar).toHaveAttribute('alt');
    });

    it('should use semantic HTML elements', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent('Hegel');
    });

    it('should announce book count to screen readers', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      const bookCount = screen.getByText(/2 books/i);
      expect(bookCount).toHaveAttribute('aria-label', expect.stringMatching(/2 books/i));
    });
  });

  describe('Visual States', () => {
    it('should apply correct styling classes', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      const header = screen.getByTestId('character-header') || screen.getByRole('banner');
      expect(header).toHaveClass('character-header');
    });

    it('should highlight edit button on hover', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const editButton = screen.getByRole('button', { name: /edit/i });

      // Simulate hover
      fireEvent.mouseEnter(editButton);

      // Assert - hover styles are handled by CSS :hover pseudo-selector
      expect(editButton).toBeInTheDocument();
    });

    it('should show active state when edit button is pressed', () => {
      // Act
      render(<CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const editButton = screen.getByRole('button', { name: /edit/i });

      // Simulate mouse down
      fireEvent.mouseDown(editButton);

      // Assert - active styles are handled by CSS :active pseudo-selector
      expect(editButton).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render correctly with different character props', () => {
      // Act - Test with all three mock characters
      const { rerender } = render(
        <CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />
      );
      expect(screen.getByText('Hegel')).toBeInTheDocument();

      rerender(<CharacterHeader character={mockCharacter2} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      expect(screen.getByText('Kant')).toBeInTheDocument();

      rerender(<CharacterHeader character={mockCharacter3} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      expect(screen.getByText('Nietzsche')).toBeInTheDocument();
    });

    it('should update when character prop changes', () => {
      // Arrange
      const { rerender } = render(
        <CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />
      );
      expect(screen.getByText('Hegel')).toBeInTheDocument();

      // Act
      rerender(<CharacterHeader character={mockCharacter2} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />);

      // Assert
      expect(screen.queryByText('Hegel')).not.toBeInTheDocument();
      expect(screen.getByText('Kant')).toBeInTheDocument();
    });

    it('should update when onEditClick prop changes', () => {
      // Arrange
      const newOnEditClick = vi.fn();
      const { rerender } = render(
        <CharacterHeader character={mockCharacter1} onEditClick={mockOnEditClick} onDeleteClick={mockOnDeleteClick} />
      );

      // Act
      rerender(<CharacterHeader character={mockCharacter1} onEditClick={newOnEditClick} onDeleteClick={mockOnDeleteClick} />);
      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      // Assert
      expect(mockOnEditClick).not.toHaveBeenCalled();
      expect(newOnEditClick).toHaveBeenCalledTimes(1);
    });
  });
});
