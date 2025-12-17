/**
 * CharacterHeader component - displays character info and edit button.
 *
 * This component shows character name, avatar, and provides edit functionality.
 */

import React, { useState } from 'react';
import type { Character } from '../types/character';
import { useMessageStoreEnhanced } from '../store/messageStoreEnhanced';

interface CharacterHeaderProps {
  character: Character;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export const CharacterHeader: React.FC<CharacterHeaderProps> = ({
  character,
  onEditClick,
  onDeleteClick,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { clearMessages } = useMessageStoreEnhanced();

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEditClick();
    }
  };

  const handleDeleteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setShowDeleteConfirm(true);
    }
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDeleteClick();
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleNewChatClick = () => {
    clearMessages(character.id);
  };

  const handleNewChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNewChatClick();
    }
  };

  const bookCount = character.books?.length || 0;

  return (
    <div
      className="character-header"
      data-testid="character-header"
      role="banner"
      aria-label="Character information"
    >
      <div className="header-info">
        {character.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={`${character.name} avatar`}
            className="header-avatar"
          />
        ) : (
          <div
            className="avatar-placeholder"
            data-testid="avatar-placeholder"
            aria-label={`${character.name} initials`}
          >
            {getInitials(character.name)}
          </div>
        )}
        <div className="header-details">
          <h2 className="header-name">{character.name}</h2>
          <p className="header-books" aria-label={`${bookCount} ${bookCount === 1 ? 'book' : 'books'}`}>
            {bookCount} {bookCount === 1 ? 'book' : 'books'}
          </p>
          {character.created_at && (
            <p className="header-date" data-testid="created-date">
              Created: {formatDate(character.created_at)}
            </p>
          )}
        </div>
      </div>
      {!showDeleteConfirm && (
        <div className="header-actions">
          <button
            onClick={handleNewChatClick}
            onKeyDown={handleNewChatKeyDown}
            className="new-chat-button"
            aria-label="Start new chat"
            tabIndex={0}
          >
            New Chat
          </button>
          <button
            onClick={onEditClick}
            onKeyDown={handleEditKeyDown}
            className="edit-button"
            aria-label="Edit character"
            tabIndex={0}
          >
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            onKeyDown={handleDeleteKeyDown}
            className="delete-button"
            aria-label="Delete"
            tabIndex={0}
          >
            Delete
          </button>
        </div>
      )}
      {showDeleteConfirm && (
        <div className="confirmation-dialog" role="dialog" aria-labelledby="confirm-title">
          <div className="confirmation-content">
            <h3 id="confirm-title">Are you sure?</h3>
            <p>Do you want to delete {character.name}? This action cannot be undone.</p>
            <div className="confirmation-actions">
              <button
                onClick={handleConfirmDelete}
                className="confirm-button"
                aria-label="Yes"
              >
                Yes
              </button>
              <button
                onClick={handleCancelDelete}
                className="cancel-button"
                aria-label="Cancel deletion"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
