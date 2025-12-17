/**
 * E2E Test - UC5: Delete Book
 *
 * Tests deleting a book from a character:
 * 1. User selects a character with books
 * 2. Opens book list
 * 3. Selects a book to delete
 * 4. Confirms deletion
 * 5. Book is removed from list
 * 6. Knowledge base is updated
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../../App';
import { apiService } from '../../services/api';
import { useCharacterStore } from '../../store/characterStore';
import { mockCharacters, mockCharacter1 } from '../../tests/mockData';

describe('UC5: Delete Book - E2E', () => {
  let mockClient: any;

  beforeEach(() => {
    // Reset stores
    useCharacterStore.setState({
      characters: [],
      selectedCharacterId: null,
      selectedCharacter: undefined,
      isLoading: false,
      error: null,
    });

    // Create and set mock client
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      defaults: { baseURL: '/api' },
    };

    apiService.setClient(mockClient);
    vi.clearAllMocks();

    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('should complete book deletion flow', async () => {
    // Arrange
    const characterAfterDeletion = {
      ...mockCharacter1,
      books: mockCharacter1.books.slice(1), // Remove first book
    };

    mockClient.get
      .mockResolvedValueOnce({ data: mockCharacters })
      .mockResolvedValueOnce({ data: { messages: [], total: 0 } });

    mockClient.delete.mockResolvedValue({});
    mockClient.get.mockResolvedValueOnce({ data: characterAfterDeletion });

    // Act
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Hegel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Hegel'));

    await waitFor(() => {
      expect(screen.getByText(/philosophy-of-right/i)).toBeInTheDocument();
    });

    const deleteBookButton = screen.getAllByRole('button', { name: /delete book|remove book/i })[0];
    fireEvent.click(deleteBookButton);

    await waitFor(() => {
      expect(screen.getByText(/confirm|are you sure/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirm|yes/i }));

    await waitFor(() => {
      expect(mockClient.delete).toHaveBeenCalledWith('/characters/char-1/books/book-1');
    });

    await waitFor(() => {
      expect(screen.queryByText(/philosophy-of-right/i)).not.toBeInTheDocument();
      expect(screen.getByText(/phenomenology-of-spirit/i)).toBeInTheDocument();
    });
  });
});
