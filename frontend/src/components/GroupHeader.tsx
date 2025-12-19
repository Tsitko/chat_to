/**
 * GroupHeader component - header section for group chat view.
 *
 * This component displays group information and action buttons.
 * Similar to CharacterHeader but for groups.
 *
 * Responsibilities:
 * - Display group avatar, name, and member count
 * - Show list of member names
 * - Provide edit and delete buttons
 * - Handle button clicks (delegates to parent)
 */

import React from 'react';
import { useCharacterStore } from '../store/characterStore';
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

  const getMemberNames = (): string => {
    return group.character_ids
      .map((id) => characters.find((c) => c.id === id)?.name)
      .filter((name) => name !== undefined)
      .join(', ');
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
      <div className="header-actions">
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
    </div>
  );
};
