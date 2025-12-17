/**
 * E2E Test - UC1: Create Character
 *
 * Tests the complete user journey for creating a new character:
 * 1. User opens the application
 * 2. Clicks create character button
 * 3. Fills in character name
 * 4. Uploads avatar (optional)
 * 5. Uploads books (optional)
 * 6. Submits the form
 * 7. Character appears in the list
 * 8. Books are indexed
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../../App';
import { apiService } from '../../services/api';
import { useCharacterStore } from '../../store/characterStore';
import {
  mockCharacter1,
  mockAvatarFile,
  mockBookFile1,
  mockIndexingStatusResponse,
} from '../../tests/mockData';

describe('UC1: Create Character - E2E', () => {
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

    // Mock FileReader for avatar preview
    global.FileReader = class FileReader {
      readAsDataURL() {
        this.onloadend?.({ target: { result: 'data:image/jpeg;base64,mockdata' } } as any);
      }
    } as any;
  });

  it('should complete full character creation flow with name only', async () => {
    // Arrange
    mockClient.get.mockResolvedValue({ data: [] }); // Default for fetchCharacters
    mockClient.post.mockResolvedValue({ data: mockCharacter1 });

    // Act - Render app
    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Step 1: Click create character button
    const createButton = screen.getByRole('button', { name: /new character|create/i });
    fireEvent.click(createButton);

    // Assert: Modal opens
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/create character/i)).toBeInTheDocument();
    });

    // Step 2: Fill in character name
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Hegel' } });

    // Step 3: Submit form
    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);

    // Assert: API called with correct data
    await waitFor(() => {
      expect(mockClient.post).toHaveBeenCalled();
      const callArgs = mockClient.post.mock.calls[0];
      expect(callArgs[0]).toBe('/characters/');
      expect(callArgs[1]).toBeInstanceOf(FormData);
    });

    // Assert: Modal closes
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Assert: Character appears in list
    await waitFor(() => {
      expect(screen.getByText('Hegel')).toBeInTheDocument();
    });
  });

  it('should complete character creation with avatar', async () => {
    // Arrange
    mockClient.get.mockResolvedValue({ data: [] });
    mockClient.post.mockResolvedValue({ data: mockCharacter1 });
    mockClient.get.mockResolvedValueOnce({ data: [] });
    mockClient.get.mockResolvedValueOnce({ data: [mockCharacter1] });

    // Act
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /new character|create/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Fill name
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Hegel' } });

    // Upload avatar
    const avatarInput = screen.getByLabelText(/avatar/i);
    Object.defineProperty(avatarInput, 'files', {
      value: [mockAvatarFile],
    });
    fireEvent.change(avatarInput);

    // Wait for avatar preview
    await waitFor(() => {
      expect(screen.getByText(/avatar\.jpg/i)).toBeInTheDocument();
    });

    // Submit
    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      const postCalls = mockClient.post.mock.calls;
      expect(postCalls.length).toBeGreaterThan(0);
      const formData = postCalls[0][1];
      expect(formData).toBeInstanceOf(FormData);
    });
  });

  it('should complete character creation with books and show indexing status', async () => {
    // Arrange
    const characterWithBooks = { ...mockCharacter1 };
    mockClient.get
      .mockResolvedValueOnce({ data: [] }) // Initial fetch
      .mockResolvedValueOnce({ data: [characterWithBooks] }); // After creation
    mockClient.post.mockResolvedValue({ data: characterWithBooks });

    // Act
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /new character|create/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Fill form with name and books
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Hegel' } });

    const booksInput = screen.getByLabelText(/books/i);
    Object.defineProperty(booksInput, 'files', {
      value: [mockBookFile1],
    });
    fireEvent.change(booksInput);

    await waitFor(() => {
      expect(screen.getByText(/book1\.txt/i)).toBeInTheDocument();
    });

    // Submit
    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);

    // Assert: Modal closes
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Assert: Character created and appears in list with books
    await waitFor(() => {
      expect(screen.getByText('Hegel')).toBeInTheDocument();
    });

    // Select character to see book count in header
    fireEvent.click(screen.getByText('Hegel'));

    // Assert: Can check book count
    await waitFor(() => {
      expect(screen.getByText(/2 books/i)).toBeInTheDocument();
    });
  });

  it('should handle validation errors during creation', async () => {
    // Arrange
    mockClient.get.mockResolvedValue({ data: [] });

    // Act
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /new character|create/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Try to submit without name
    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);

    // Assert: Validation error shown
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    // Assert: Modal still open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Assert: No API call made
    expect(mockClient.post).not.toHaveBeenCalled();
  });

  it('should handle network errors during creation', async () => {
    // Arrange
    mockClient.get.mockResolvedValue({ data: [] });
    mockClient.post.mockRejectedValue(new Error('Network Error'));

    // Act
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /new character|create/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Fill and submit
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Hegel' } });

    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);

    // Assert: Error message shown in character list (since modal closes on error)
    await waitFor(() => {
      expect(screen.getByText(/network error|failed/i)).toBeInTheDocument();
    });
  });

  it('should allow canceling character creation', async () => {
    // Arrange
    mockClient.get.mockResolvedValue({ data: [] });

    // Act
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /new character|create/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Fill some data
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Hegel' } });

    // Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel|close/i });
    fireEvent.click(cancelButton);

    // Assert: Modal closes
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Assert: No API call made
    expect(mockClient.post).not.toHaveBeenCalled();
  });
});
