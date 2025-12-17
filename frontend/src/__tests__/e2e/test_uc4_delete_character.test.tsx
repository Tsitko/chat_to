/**
 * E2E Test - UC4: Delete Character
 *
 * Tests deleting a character:
 * 1. User selects a character
 * 2. Triggers delete action
 * 3. Confirmation dialog appears
 * 4. User confirms deletion
 * 5. Character is removed from list
 * 6. All associated data is deleted
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../../App';
import { apiService } from '../../services/api';
import { useCharacterStore } from '../../store/characterStore';
import { mockCharacters, mockCharacter2, mockCharacter3 } from '../../tests/mockData';

describe('UC4: Delete Character - E2E', () => {
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

  it('should complete character deletion flow', async () => {
    // Arrange
    mockClient.get
      .mockResolvedValueOnce({ data: mockCharacters })
      .mockResolvedValueOnce({ data: { messages: [], total: 0 } })
      .mockResolvedValueOnce({ data: [mockCharacter2, mockCharacter3] });

    mockClient.delete.mockResolvedValue({});

    // Act
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Hegel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Hegel'));

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/confirm deletion|are you sure/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirm|yes|delete/i }));

    await waitFor(() => {
      expect(mockClient.delete).toHaveBeenCalledWith('/characters/char-1');
    });

    await waitFor(() => {
      expect(screen.queryByText('Hegel')).not.toBeInTheDocument();
    });
  });
});
