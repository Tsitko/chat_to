/**
 * CharacterModal component - modal for creating/editing characters.
 *
 * This component provides a form for character creation and editing
 * with file upload support for avatars and books.
 */

import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useCharacterStoreEnhanced } from '../store/characterStoreEnhanced';
import { apiService } from '../services/api';
import { Modal } from './Modal';
import { Loader } from './Loader';
import { IndexingStatusDisplay } from './IndexingStatusDisplay';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId?: string;
}

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const MAX_BOOK_SIZE = 50 * 1024 * 1024;
const MAX_BOOKS = 10;

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  characterId,
}) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [books, setBooks] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);

  const {
    createCharacter,
    updateCharacter,
    fetchCharacters,
    characters,
    loadingStates,
    isOperationLoading
  } = useCharacterStoreEnhanced();

  const isLoading = isOperationLoading('create') || isOperationLoading('update');
  const storeError = loadingStates.create.error || loadingStates.update.error;

  const isEditMode = !!characterId;
  const existingCharacter = characters.find((c) => c.id === characterId);

  useEffect(() => {
    if (isEditMode && existingCharacter) {
      setName(existingCharacter.name);
    } else {
      setName('');
      setAvatar(null);
      setAvatarPreview(null);
      setBooks([]);
      setErrors({});
    }
  }, [isEditMode, existingCharacter, isOpen]);

  const validateName = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return 'Name is required';
    if (trimmed.length < 2) return 'Name must be at least 2 characters';
    if (trimmed.length > 50) return 'Name must be at most 50 characters';
    return null;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    const error = validateName(value);
    if (error) {
      setErrors((prev) => ({ ...prev, name: error }));
    } else {
      setErrors((prev) => {
        const { name, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameError = validateName(name);
    if (nameError) {
      setErrors((prev) => ({ ...prev, name: nameError }));
      return;
    }

    setIsSubmitting(true);
    try {
      const trimmedName = name.trim();
      let result;
      if (isEditMode && characterId) {
        result = await updateCharacter(characterId, trimmedName, avatar || undefined, books.length > 0 ? books : undefined);
      } else {
        result = await createCharacter(trimmedName, avatar || undefined, books.length > 0 ? books : undefined);
      }

      // Only close modal if operation was successful
      if (result) {
        onClose();
        setName('');
        setAvatar(null);
        setAvatarPreview(null);
        setBooks([]);
        setErrors({});
      }
    } catch (error) {
      console.error('Failed to save character:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAvatarDrop = (acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      setErrors((prev) => ({ ...prev, avatar: 'Invalid file type. Please use PNG or JPEG.' }));
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > MAX_AVATAR_SIZE) {
        setErrors((prev) => ({ ...prev, avatar: 'Avatar file size must be less than 5MB' }));
        return;
      }

      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setErrors((prev) => {
        const { avatar, ...rest } = prev;
        return rest;
      });
    }
  };

  const onBooksDrop = (acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      setErrors((prev) => ({ ...prev, books: 'Invalid file type. Please use PDF, DOCX, or TXT.' }));
      return;
    }

    if (books.length + acceptedFiles.length > MAX_BOOKS) {
      setErrors((prev) => ({ ...prev, books: `Maximum ${MAX_BOOKS} books allowed` }));
      return;
    }

    const oversizedFiles = acceptedFiles.filter((file) => file.size > MAX_BOOK_SIZE);
    if (oversizedFiles.length > 0) {
      setErrors((prev) => ({ ...prev, books: 'Book file size must be less than 50MB' }));
      return;
    }

    setBooks((prevBooks) => [...prevBooks, ...acceptedFiles]);
    setErrors((prev) => {
      const { books, ...rest } = prev;
      return rest;
    });
  };

  const removeBook = (index: number) => {
    setBooks((prevBooks) => prevBooks.filter((_, i) => i !== index));
  };

  const removeAvatar = () => {
    setAvatar(null);
    setAvatarPreview(null);
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!characterId) return;

    try {
      await apiService.deleteBook(characterId, bookId);
      await fetchCharacters();
      setBookToDelete(null);
    } catch (error) {
      console.error('Failed to delete book:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const {
    getRootProps: getAvatarRootProps,
    getInputProps: getAvatarInputProps,
    isDragActive: isAvatarDragActive,
  } = useDropzone({
    onDrop: onAvatarDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 1,
    disabled: isSubmitting,
  });

  const {
    getRootProps: getBooksRootProps,
    getInputProps: getBooksInputProps,
    isDragActive: isBooksDragActive,
  } = useDropzone({
    onDrop: onBooksDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    multiple: true,
    disabled: isSubmitting || books.length >= MAX_BOOKS,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Character' : 'Create Character'}
      closeOnOverlayClick={false}
      preventCloseWhileLoading={isLoading || isSubmitting}
    >
      <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" aria-required="true">
              Name:
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Character name"
              disabled={isSubmitting}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <div
                id="name-error"
                className="error-message"
                role="alert"
                aria-live="polite"
              >
                {errors.name}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="avatar-input">Avatar:</label>
            <div
              {...getAvatarRootProps()}
              className={`dropzone ${isAvatarDragActive ? 'active' : ''}`}
              data-testid="avatar-dropzone"
            >
              <input {...getAvatarInputProps()} id="avatar-input" />
              {avatarPreview ? (
                <div className="avatar-preview">
                  <img src={avatarPreview} alt="Avatar preview" />
                  <button type="button" onClick={removeAvatar}>
                    Remove
                  </button>
                </div>
              ) : avatar ? (
                <div>
                  <p>{avatar.name}</p>
                  <button type="button" onClick={removeAvatar}>
                    Remove
                  </button>
                </div>
              ) : (
                <p>Drag & drop an avatar image, or click to browse (PNG, JPG, JPEG)</p>
              )}
            </div>
            {errors.avatar && (
              <div className="error-message" role="alert">
                {errors.avatar}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="books-input">Books:</label>
            <div
              {...getBooksRootProps()}
              className={`dropzone ${isBooksDragActive ? 'active' : ''}`}
              data-testid="books-dropzone"
            >
              <input {...getBooksInputProps()} id="books-input" />
              <p>Drag & drop books, or click to browse (PDF, DOCX, TXT)</p>
            </div>
            {errors.books && (
              <div className="error-message" role="alert">
                {errors.books}
              </div>
            )}
            {isEditMode && existingCharacter?.books && existingCharacter.books.length > 0 && (
              <div className="existing-books">
                <h3>Existing Books:</h3>
                <ul>
                  {existingCharacter.books.map((book, index) => (
                    <li key={index} className="book-item">
                      <span className="book-name">{book.filename || book.name}</span>
                      <button
                        type="button"
                        onClick={() => setBookToDelete(book.id)}
                        className="delete-book-button"
                        aria-label="Delete book"
                      >
                        Delete Book
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {books.length > 0 && (
              <ul className="books-list">
                {books.map((book, index) => (
                  <li key={index} className="book-item">
                    <span className="book-name">{book.name}</span>
                    <span className="book-size">{formatFileSize(book.size)}</span>
                    <button type="button" onClick={() => removeBook(index)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {storeError && (
            <div className="error-message" role="alert" data-testid="form-error">
              {storeError}
            </div>
          )}

          {/* Show indexing status for books */}
          {isEditMode && characterId && (
            <IndexingStatusDisplay characterId={characterId} />
          )}

          <div className="modal-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting || isLoading || !!errors.name}
            >
              {isSubmitting || isLoading ? (
                <Loader variant="inline" size="sm" text="Saving..." />
              ) : (
                isEditMode ? 'Update' : 'Create'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
        {bookToDelete && (
          <div className="confirmation-overlay" onClick={() => setBookToDelete(null)}>
            <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>Are you sure?</h3>
              <p>Do you want to delete this book? This action cannot be undone.</p>
              <div className="confirmation-actions">
                <button
                  onClick={() => handleDeleteBook(bookToDelete)}
                  className="confirm-button"
                  aria-label="Yes"
                >
                  Yes
                </button>
                <button
                  onClick={() => setBookToDelete(null)}
                  className="cancel-button"
                  aria-label="Cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
    </Modal>
  );
};
