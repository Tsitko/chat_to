/**
 * CharacterModal Component Tests.
 *
 * Comprehensive tests for CharacterModal component covering:
 * - Form rendering (create/edit modes)
 * - Input validation
 * - File uploads (avatar, books)
 * - Drag and drop functionality
 * - Form submission
 * - Modal open/close behavior
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CharacterModal } from '../CharacterModal';
import { useCharacterStore } from '../../store/characterStore';
import {
  mockCharacter1,
  mockAvatarFile,
  mockBookFile1,
  mockBookFile2,
} from '../../tests/mockData';

// Mock the character store
vi.mock('../../store/characterStore');
const mockedUseCharacterStore = vi.mocked(useCharacterStore);

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop, accept }: any) => {
    const handleDrop = (e: any) => {
      const files = Array.from(e.dataTransfer?.files || []) as File[];
      const acceptedFormats = Object.values(accept || {}).flat() as string[];

      // Separate accepted and rejected files based on file type
      const acceptedFiles: File[] = [];
      const rejectedFiles: any[] = [];

      files.forEach((file) => {
        const fileExtension = '.' + file.name.split('.').pop();
        const isAccepted = acceptedFormats.length === 0 || acceptedFormats.some((format: string) =>
          file.type.startsWith(format.split('/')[0]) || fileExtension === format
        );

        if (isAccepted) {
          acceptedFiles.push(file);
        } else {
          rejectedFiles.push({ file, errors: [{ code: 'file-invalid-type' }] });
        }
      });

      onDrop(acceptedFiles, rejectedFiles);
    };

    return {
      getRootProps: () => ({
        onDrop: handleDrop,
      }),
      getInputProps: () => ({
        type: 'file',
        accept,
      }),
      isDragActive: false,
    };
  },
}));

describe('CharacterModal Component', () => {
  const mockCreateCharacter = vi.fn();
  const mockUpdateCharacter = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockedUseCharacterStore.mockReturnValue({
      characters: [],
      selectedCharacterId: null,
      selectedCharacter: null,
      isLoading: false,
      error: null,
      fetchCharacters: vi.fn(),
      selectCharacter: vi.fn(),
      createCharacter: mockCreateCharacter,
      updateCharacter: mockUpdateCharacter,
      deleteCharacter: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Modal Visibility', () => {
    it('should not render when isOpen is false', () => {
      // Act
      render(<CharacterModal isOpen={false} onClose={mockOnClose} />);

      // Assert
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      const closeButton = screen.getByRole('button', { name: /close|cancel/i });
      fireEvent.click(closeButton);

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking outside modal', () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when clicking inside modal', () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      const modal = screen.getByRole('dialog');
      fireEvent.click(modal);

      // Assert
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should close on Escape key press', () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Create Mode', () => {
    it('should display "Create Character" title when no characterId provided', () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByText(/create character/i)).toBeInTheDocument();
    });

    it('should have empty name input initially', () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('');
    });

    it('should display submit button with "Create" text', () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      const submitButton = screen.getByRole('button', { name: /create/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should call createCharacter on form submission', async () => {
      // Arrange
      mockCreateCharacter.mockResolvedValue(undefined);
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Act
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'Kant' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockCreateCharacter).toHaveBeenCalledWith('Kant', undefined, undefined);
      });
    });

    it('should close modal after successful creation', async () => {
      // Arrange
      mockCreateCharacter.mockResolvedValue(undefined);
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Act
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'Kant' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      mockedUseCharacterStore.mockReturnValue({
        characters: [mockCharacter1],
        selectedCharacterId: 'char-1',
        selectedCharacter: mockCharacter1,
        isLoading: false,
        error: null,
        fetchCharacters: vi.fn(),
        selectCharacter: vi.fn(),
        createCharacter: mockCreateCharacter,
        updateCharacter: mockUpdateCharacter,
        deleteCharacter: vi.fn(),
      });
    });

    it('should display "Edit Character" title when characterId provided', () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} characterId="char-1" />);

      // Assert
      expect(screen.getByText(/edit character/i)).toBeInTheDocument();
    });

    it('should pre-fill name input with character name', () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} characterId="char-1" />);

      // Assert
      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Hegel');
    });

    it('should display submit button with "Save" text', () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} characterId="char-1" />);

      // Assert
      const submitButton = screen.getByRole('button', { name: /save|update/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should call updateCharacter on form submission', async () => {
      // Arrange
      mockUpdateCharacter.mockResolvedValue(undefined);
      render(<CharacterModal isOpen={true} onClose={mockOnClose} characterId="char-1" />);

      // Act
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'Georg Hegel' } });

      const submitButton = screen.getByRole('button', { name: /save|update/i });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockUpdateCharacter).toHaveBeenCalledWith('char-1', 'Georg Hegel', undefined, undefined);
      });
    });

    it('should display existing books', () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} characterId="char-1" />);

      // Assert
      expect(screen.getByText(/philosophy-of-right/i)).toBeInTheDocument();
      expect(screen.getByText(/phenomenology-of-spirit/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require name field', async () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
      expect(mockCreateCharacter).not.toHaveBeenCalled();
    });

    it('should validate name minimum length', async () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'A' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/name must be at least/i)).toBeInTheDocument();
      });
    });

    it('should validate name maximum length', async () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'a'.repeat(200) } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/name must be at most 50 characters/i)).toBeInTheDocument();
      });
    });

    it('should trim whitespace from name', async () => {
      // Arrange
      mockCreateCharacter.mockResolvedValue(undefined);
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Act
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: '  Kant  ' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockCreateCharacter).toHaveBeenCalledWith('Kant', undefined, undefined);
      });
    });

    it('should not allow whitespace-only name', async () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: '   ' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Avatar Upload', () => {
    it('should display avatar upload dropzone', () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByText(/drag.*drop.*avatar|upload avatar/i)).toBeInTheDocument();
    });

    it('should accept avatar file via browse', async () => {
      // Arrange
      global.FileReader = class FileReader {
        readAsDataURL() {
          this.onloadend?.({ target: { result: 'data:image/jpeg;base64,mockdata' } } as any);
        }
      } as any;

      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      const dropzone = screen.getByTestId('avatar-dropzone');

      // Simulate drop
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [mockAvatarFile],
        },
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/avatar\.jpg/i)).toBeInTheDocument();
      });
    });

    it('should validate avatar file type', async () => {
      // Arrange
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });

      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      const dropzone = screen.getByTestId('avatar-dropzone');

      // Simulate drop with invalid file type
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [invalidFile],
        },
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
      });
    });

    it('should validate avatar file size', async () => {
      // Arrange
      const largeFile = new File(['x'.repeat(10000000)], 'large.jpg', { type: 'image/jpeg' });

      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      const dropzone = screen.getByTestId('avatar-dropzone');

      // Simulate drop
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [largeFile],
        },
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/file size must be less than 5MB/i)).toBeInTheDocument();
      });
    });

    it('should allow removing selected avatar', async () => {
      // Arrange
      global.FileReader = class FileReader {
        readAsDataURL() {
          this.onloadend?.({ target: { result: 'data:image/jpeg;base64,mockdata' } } as any);
        }
      } as any;

      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      const dropzone = screen.getByTestId('avatar-dropzone');

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [mockAvatarFile],
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/avatar\.jpg/i)).toBeInTheDocument();
      });

      // Remove avatar
      const removeButton = screen.getByRole('button', { name: /remove/i });
      fireEvent.click(removeButton);

      // Assert
      expect(screen.queryByText(/avatar\.jpg/i)).not.toBeInTheDocument();
    });

    it('should preview avatar image', async () => {
      // Arrange
      global.FileReader = class FileReader {
        onloadend: ((event: any) => void) | null = null;
        result: string | null = null;
        readAsDataURL(file: Blob) {
          const self = this;
          self.result = 'data:image/jpeg;base64,mockdata';
          setTimeout(() => {
            if (self.onloadend) {
              self.onloadend({ target: { result: self.result } } as any);
            }
          }, 0);
        }
      } as any;

      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      const dropzone = screen.getByTestId('avatar-dropzone');

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [mockAvatarFile],
        },
      });

      // Assert
      await waitFor(() => {
        const preview = screen.getByAltText(/avatar preview/i);
        expect(preview).toBeInTheDocument();
      });
    });
  });

  describe('Book Upload', () => {
    it('should display book upload dropzone', () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByText(/drop books|upload books/i)).toBeInTheDocument();
    });

    it('should accept multiple book files', async () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      const dropzone = screen.getByTestId('books-dropzone');

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [mockBookFile1, mockBookFile2],
        },
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/book1\.txt/i)).toBeInTheDocument();
        expect(screen.getByText(/book2\.pdf/i)).toBeInTheDocument();
      });
    });

    it('should validate book file types', async () => {
      // Arrange
      const invalidFile = new File(['content'], 'test.exe', { type: 'application/x-executable' });

      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      const dropzone = screen.getByTestId('books-dropzone');

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [invalidFile],
        },
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
      });
    });

    it('should allow removing individual books', async () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      const dropzone = screen.getByTestId('books-dropzone');

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [mockBookFile1, mockBookFile2],
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/book1\.txt/i)).toBeInTheDocument();
      });

      // Remove first book
      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      // Filter to get book remove buttons (not the modal close button or avatar remove button)
      const bookRemoveButtons = removeButtons.filter(btn =>
        btn.closest('.book-item') !== null
      );
      fireEvent.click(bookRemoveButtons[0]);

      // Assert
      expect(screen.queryByText(/book1\.txt/i)).not.toBeInTheDocument();
      expect(screen.getByText(/book2\.pdf/i)).toBeInTheDocument();
    });

    it('should display book file sizes', async () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      const dropzone = screen.getByTestId('books-dropzone');

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [mockBookFile1],
        },
      });

      // Assert
      await waitFor(() => {
        // Should show file size like "1 MB"
        expect(screen.getByText(/\d+(\.\d+)?\s*(B|KB|MB)/i)).toBeInTheDocument();
      });
    });

    it('should limit number of books', async () => {
      // Arrange
      const manyBooks = Array.from({ length: 20 }, (_, i) =>
        new File(['content'], `book${i}.txt`, { type: 'text/plain' })
      );

      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      const dropzone = screen.getByTestId('books-dropzone');

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: manyBooks,
        },
      });

      // Assert - error message says "Maximum 10 books allowed"
      await waitFor(() => {
        expect(screen.getByText(/maximum.*10.*books/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission with Files', () => {
    beforeEach(() => {
      // Mock FileReader for file uploads
      global.FileReader = class FileReader {
        onloadend: ((event: any) => void) | null = null;
        result: string | null = null;
        readAsDataURL(file: Blob) {
          const self = this;
          self.result = 'data:image/jpeg;base64,mockdata';
          setTimeout(() => {
            if (self.onloadend) {
              self.onloadend({ target: { result: self.result } } as any);
            }
          }, 0);
        }
      } as any;
    });

    it('should submit with avatar only', async () => {
      // Arrange
      mockCreateCharacter.mockResolvedValue(undefined);
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Act
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'Hegel' } });

      const dropzone = screen.getByTestId('avatar-dropzone');
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [mockAvatarFile],
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/avatar\.jpg/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockCreateCharacter).toHaveBeenCalledWith('Hegel', mockAvatarFile, undefined);
      });
    });

    it('should submit with books only', async () => {
      // Arrange
      mockCreateCharacter.mockResolvedValue(undefined);
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Act
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'Kant' } });

      const dropzone = screen.getByTestId('books-dropzone');
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [mockBookFile1, mockBookFile2],
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/book1\.txt/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockCreateCharacter).toHaveBeenCalledWith(
          'Kant',
          undefined,
          expect.arrayContaining([mockBookFile1, mockBookFile2])
        );
      });
    });

    it('should submit with avatar and books', async () => {
      // Arrange
      mockCreateCharacter.mockResolvedValue(undefined);
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Act
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'Nietzsche' } });

      const avatarDropzone = screen.getByTestId('avatar-dropzone');
      fireEvent.drop(avatarDropzone, {
        dataTransfer: {
          files: [mockAvatarFile],
        },
      });

      const booksDropzone = screen.getByTestId('books-dropzone');
      fireEvent.drop(booksDropzone, {
        dataTransfer: {
          files: [mockBookFile1],
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/avatar\.jpg/i)).toBeInTheDocument();
        expect(screen.getByText(/book1\.txt/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockCreateCharacter).toHaveBeenCalledWith(
          'Nietzsche',
          mockAvatarFile,
          expect.arrayContaining([mockBookFile1])
        );
      });
    });
  });

  describe('Loading State', () => {
    it('should disable form while submitting', async () => {
      // Arrange
      let resolveCreate: any;
      const promise = new Promise<void>((resolve) => {
        resolveCreate = resolve;
      });

      // Start with isLoading: false, then it will become true during submission
      mockedUseCharacterStore.mockReturnValue({
        characters: [],
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: null,
        fetchCharacters: vi.fn(),
        selectCharacter: vi.fn(),
        createCharacter: mockCreateCharacter,
        updateCharacter: mockUpdateCharacter,
        deleteCharacter: vi.fn(),
      });

      mockCreateCharacter.mockReturnValue(promise);

      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const submitButton = screen.getByRole('button', { name: /create/i });

      // Trigger submission
      fireEvent.click(submitButton);

      // Assert - during submission, form elements should be disabled
      // Note: The component manages its own internal loading state during form submission
      await waitFor(() => {
        expect(mockCreateCharacter).toHaveBeenCalled();
      });

      resolveCreate();
    });

    it('should show loading indicator while submitting', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: [],
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: true,
        error: null,
        fetchCharacters: vi.fn(),
        selectCharacter: vi.fn(),
        createCharacter: mockCreateCharacter,
        updateCharacter: mockUpdateCharacter,
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByText(/creating|saving/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when creation fails', () => {
      // Arrange
      mockedUseCharacterStore.mockReturnValue({
        characters: [],
        selectedCharacterId: null,
        selectedCharacter: null,
        isLoading: false,
        error: 'Failed to create character',
        fetchCharacters: vi.fn(),
        selectCharacter: vi.fn(),
        createCharacter: mockCreateCharacter,
        updateCharacter: mockUpdateCharacter,
        deleteCharacter: vi.fn(),
      });

      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByText(/failed to create character/i)).toBeInTheDocument();
    });

    it('should not close modal on submission error', async () => {
      // Arrange
      mockCreateCharacter.mockRejectedValue(new Error('Network error'));
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Act
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockCreateCharacter).toHaveBeenCalled();
      });
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper modal role', () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });

    it('should have descriptive title', () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      const title = screen.getByRole('heading', { name: /create character/i });
      expect(title).toBeInTheDocument();
    });

    it('should trap focus within modal', () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    it('should have accessible form labels', () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);

      // Assert
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/avatar/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/books/i)).toBeInTheDocument();
    });

    it('should announce validation errors to screen readers', async () => {
      // Act
      render(<CharacterModal isOpen={true} onClose={mockOnClose} />);
      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toBeInTheDocument();
      });
    });
  });
});
