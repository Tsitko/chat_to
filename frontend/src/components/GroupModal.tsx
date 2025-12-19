/**
 * GroupModal component - modal dialog for creating/editing groups.
 *
 * This component provides a form interface for:
 * - Creating new groups
 * - Editing existing groups
 * - Selecting group members (characters)
 * - Uploading group avatars
 *
 * Similar to CharacterModal but for groups.
 *
 * Responsibilities:
 * - Display modal form with group name, avatar, and member selection
 * - Validate form inputs (group name required, at least 2 members)
 * - Handle form submission (create or update)
 * - Show loading states during submission
 * - Close modal on success or cancel
 */

import React, { useState, useEffect } from 'react';
import { useGroupStore } from '../store/groupStore';
import { useCharacterStore } from '../store/characterStore';
import { Modal } from './Modal';
import { Loader } from './Loader';
import type { Group } from '../types/group';
import type { Character } from '../types/character';

/**
 * Props for GroupModal component.
 */
interface GroupModalProps {
  /**
   * Controls modal visibility.
   */
  isOpen: boolean;

  /**
   * Callback fired when modal should close.
   */
  onClose: () => void;

  /**
   * ID of group to edit. If undefined, modal is in "create" mode.
   */
  groupId?: string;
}

/**
 * GroupModal component.
 *
 * Telegram-style modal for creating or editing groups.
 * Allows selecting multiple characters as group members.
 */
export const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  groupId,
}) => {
  const { groups, createGroup, updateGroup, isLoading } = useGroupStore();
  const { characters, fetchCharacters } = useCharacterStore();

  const [groupName, setGroupName] = useState('');
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; members?: string }>({});

  const isEditMode = groupId !== undefined;
  const currentGroup = isEditMode ? groups.find((g) => g.id === groupId) : undefined;

  // Load characters when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCharacters();
    }
  }, [isOpen, fetchCharacters]);

  useEffect(() => {
    if (isEditMode && currentGroup) {
      setGroupName(currentGroup.name);
      setSelectedCharacterIds(currentGroup.character_ids);
      setPreviewUrl(currentGroup.avatar_url);
    } else {
      setGroupName('');
      setSelectedCharacterIds([]);
      setAvatarFile(undefined);
      setPreviewUrl(null);
    }
    setErrors({});
  }, [isEditMode, currentGroup, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: { name?: string; members?: string } = {};

    if (!groupName.trim()) {
      newErrors.name = 'Group name is required';
    }

    if (selectedCharacterIds.length < 2) {
      newErrors.members = 'Select at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isEditMode && groupId) {
      await updateGroup(groupId, groupName, selectedCharacterIds, avatarFile);
    } else {
      await createGroup(groupName, selectedCharacterIds, avatarFile);
    }

    onClose();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const toggleCharacter = (characterId: string) => {
    if (selectedCharacterIds.includes(characterId)) {
      setSelectedCharacterIds(selectedCharacterIds.filter((id) => id !== characterId));
    } else {
      setSelectedCharacterIds([...selectedCharacterIds, characterId]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Group' : 'Create Group'}
      closeOnOverlayClick={false}
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} data-testid="group-form">
        <div className="form-group">
          <label htmlFor="group-avatar">Group Avatar</label>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Group avatar preview"
              className="avatar-preview"
              data-testid="avatar-preview"
            />
          )}
          <input
            id="group-avatar"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            data-testid="avatar-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="group-name">Group Name *</label>
          <input
            id="group-name"
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            required
            data-testid="group-name-input"
          />
          {errors.name && (
            <span className="error" data-testid="name-error">
              {errors.name}
            </span>
          )}
        </div>

        <div className="form-group">
          <label>Select Members (at least 2) *</label>
          <div className="character-selection" data-testid="character-selection">
            {characters.map((character) => (
              <div key={character.id} className="character-checkbox">
                <input
                  type="checkbox"
                  id={`char-${character.id}`}
                  checked={selectedCharacterIds.includes(character.id)}
                  onChange={() => toggleCharacter(character.id)}
                  data-testid={`character-checkbox-${character.id}`}
                />
                <label htmlFor={`char-${character.id}`}>
                  {character.avatar_url && (
                    <img src={character.avatar_url} alt="" className="character-avatar-small" />
                  )}
                  {character.name}
                </label>
              </div>
            ))}
          </div>
          {errors.members && (
            <span className="error" data-testid="members-error">
              {errors.members}
            </span>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} disabled={isLoading} data-testid="cancel-button">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} data-testid="submit-button">
            {isLoading ? <Loader variant="inline" size="sm" /> : isEditMode ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
