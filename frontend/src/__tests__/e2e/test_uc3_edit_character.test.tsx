/**
 * E2E Test - UC3: Edit Character
 *
 * Tests editing an existing character:
 * 1. User selects a character
 * 2. Clicks edit button
 * 3. Modal opens with current data
 * 4. User modifies name/avatar/books
 * 5. Submits changes
 * 6. Character is updated in the list
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../../App';
import { apiService } from '../../services/api';
import { useCharacterStore } from '../../store/characterStore';
import {
  mockCharacters,
  mockCharacter1,
  mockAvatarFile,
  mockBookFile1,
} from '../../tests/mockData';

describe('UC3: Edit Character - E2E', () => {
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

  it('should complete character edit flow', async () => {
    // Arrange
    const updatedCharacter = { ...mockCharacter1, name: 'Georg Hegel' };
    mockClient.get
      .mockResolvedValueOnce({ data: mockCharacters })
      .mockResolvedValueOnce({ data: { messages: [], total: 0 } })
      .mockResolvedValueOnce({ data: [updatedCharacter] });

    mockClient.put.mockResolvedValue({ data: updatedCharacter });

    // Act
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Hegel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Hegel'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/edit character/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    expect(nameInput.value).toBe('Hegel');

    fireEvent.change(nameInput, { target: { value: 'Georg Hegel' } });

    fireEvent.click(screen.getByRole('button', { name: /save|update/i }));

    await waitFor(() => {
      expect(mockClient.put).toHaveBeenCalled();
      const callArgs = mockClient.put.mock.calls[0];
      expect(callArgs[0]).toBe('/characters/char-1');
      expect(callArgs[1]).toBeInstanceOf(FormData);
    });

    await waitFor(() => {
      const elements = screen.getAllByText('Georg Hegel');
      expect(elements.length).toBeGreaterThan(0);
    });
  });
});
