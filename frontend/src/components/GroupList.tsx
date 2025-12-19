/**
 * GroupList component - displays list of groups in sidebar.
 *
 * This component shows all available groups and handles group selection.
 * Similar to CharacterList but for groups.
 *
 * Responsibilities:
 * - Fetch and display all groups on mount
 * - Handle group selection (clicking on a group)
 * - Show loading/error states
 * - Support keyboard navigation
 */

import React, { useEffect } from 'react';
import { useGroupStore } from '../store/groupStore';
import { useCharacterStore } from '../store/characterStore';
import { Loader } from './Loader';
import type { Group } from '../types/group';

/**
 * Props for GroupList component.
 */
interface GroupListProps {
  /**
   * Callback fired when a group is selected.
   * @param groupId - ID of the selected group
   */
  onGroupSelect?: (groupId: string) => void;
}

/**
 * GroupList component.
 *
 * Displays a list of chat groups with avatars and member counts.
 * Supports selection and keyboard navigation.
 */
export const GroupList: React.FC<GroupListProps> = ({ onGroupSelect }) => {
  const {
    groups,
    selectedGroupId,
    fetchGroups,
    selectGroup,
    isLoading,
    error,
  } = useGroupStore();

  const { characters } = useCharacterStore();

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleGroupClick = (groupId: string) => {
    selectGroup(groupId);
    if (onGroupSelect) {
      onGroupSelect(groupId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, groupId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleGroupClick(groupId);
    }
  };

  const getGroupMemberCount = (group: Group): number => {
    return group.character_ids.length;
  };

  const getGroupMemberNames = (group: Group): string => {
    const memberNames = group.character_ids
      .map((id) => characters.find((c) => c.id === id)?.name)
      .filter((name) => name !== undefined)
      .slice(0, 3);
    return memberNames.join(', ');
  };

  if (isLoading) {
    return <Loader variant="spinner" size="md" text="Loading groups..." />;
  }

  if (error) {
    return (
      <div className="error-state" data-testid="error-state">
        <p>{error}</p>
        <button onClick={fetchGroups}>Retry</button>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="empty-state" data-testid="empty-state">
        No groups yet. Create one to get started!
      </div>
    );
  }

  return (
    <div className="group-list" role="list" data-testid="group-list">
      {groups.map((group) => (
        <div
          key={group.id}
          className={`group-item ${selectedGroupId === group.id ? 'selected' : ''}`}
          role="listitem"
          tabIndex={0}
          onClick={() => handleGroupClick(group.id)}
          onKeyDown={(e) => handleKeyDown(e, group.id)}
          data-testid={`group-item-${group.id}`}
        >
          {group.avatar_url && (
            <img
              src={group.avatar_url}
              alt={group.name}
              className="group-avatar"
            />
          )}
          <div className="group-info">
            <div className="group-name">{group.name}</div>
            <div className="group-members">
              {getGroupMemberCount(group)} members: {getGroupMemberNames(group)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
