/**
 * GroupHeader component - header section for group chat view.
 *
 * This component displays group information and action buttons.
 * Similar to CharacterHeader but for groups.
 *
 * Responsibilities:
 * - Display group avatar, name, and member count
 * - Show list of member names
 * - Provide "New Chat", edit, and delete buttons
 * - Handle button clicks (delegates to parent for edit/delete)
 * - Manage "New Chat" confirmation dialog and clearing
 */

import React, { useState } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { useGroupMessageStore } from '../store/groupMessageStore';
import type { Group } from '../types/group';

/**
 * Props for GroupHeader component.
 */
interface GroupHeaderProps {
  /**
   * Group object to display.
   */
  group: Group;

  /**
   * Callback fired when edit button is clicked.
   */
  onEditClick: () => void;

  /**
   * Callback fired when delete button is clicked.
   */
  onDeleteClick: () => void;
}

/**
 * GroupHeader component.
 *
 * Displays group information in the header section of group chat view.
 * Includes edit and delete actions.
 */
export const GroupHeader: React.FC<GroupHeaderProps> = ({
  group,
  onEditClick,
  onDeleteClick,
}) => {
  const { characters } = useCharacterStore();
  const { clearGroupMessagesWithAPI } = useGroupMessageStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  const getMemberNames = (): string => {
    return group.character_ids
      .map((id) => characters.find((c) => c.id === id)?.name)
      .filter((name) => name !== undefined)
      .join(', ');
  };

  const handleNewChatClick = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClear = async () => {
    setClearError(null);
    setShowClearConfirm(false);

    try {
      await clearGroupMessagesWithAPI(group.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear messages';
      setClearError(errorMessage);
    }
  };

  const handleCancelClear = () => {
    setShowClearConfirm(false);
    setClearError(null);
  };

  const handleNewChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNewChatClick();
    }
  };

  return (
    <div className="character-header group-header" data-testid="group-header">
      <div className="header-content">
        {group.avatar_url && (
          <img
            src={group.avatar_url}
            alt={group.name}
            className="header-avatar"
            data-testid="group-avatar"
          />
        )}
        <div className="header-info">
          <h2 className="header-name" data-testid="group-name">
            {group.name}
          </h2>
          <p className="header-subtitle" data-testid="group-members">
            {group.character_ids.length} members: {getMemberNames()}
          </p>
        </div>
      </div>

      {!showClearConfirm && (
        <div className="header-actions">
          <button
            onClick={handleNewChatClick}
            onKeyDown={handleNewChatKeyDown}
            className="new-chat-button"
            aria-label="Start new chat"
            data-testid="new-chat-button"
            tabIndex={0}
          >
            New Chat
          </button>
          <button
            onClick={onEditClick}
            className="action-button edit-button"
            aria-label="Edit group"
            data-testid="edit-group-button"
          >
            Edit
          </button>
          <button
            onClick={onDeleteClick}
            className="action-button delete-button"
            aria-label="Delete group"
            data-testid="delete-group-button"
          >
            Delete
          </button>
        </div>
      )}

      {showClearConfirm && (
        <div className="confirmation-dialog" role="dialog" aria-labelledby="clear-confirm-title">
          <div className="confirmation-content">
            <h3 id="clear-confirm-title">Clear all messages?</h3>
            <p>
              This will delete all message history for {group.name}. This action cannot be undone.
            </p>
            <div className="confirmation-actions">
              <button
                onClick={handleConfirmClear}
                className="confirm-button"
                aria-label="Yes"
                data-testid="confirm-clear-button"
              >
                Yes
              </button>
              <button
                onClick={handleCancelClear}
                className="cancel-button"
                aria-label="Cancel"
                data-testid="cancel-clear-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {clearError && (
        <div className="error-message" role="alert" data-testid="clear-error">
          {clearError}
        </div>
      )}
    </div>
  );
};
