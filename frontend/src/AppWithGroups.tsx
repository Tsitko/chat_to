/**
 * AppWithGroups component - enhanced root component with group support.
 *
 * This component implements a Telegram-like layout with:
 * - Sidebar with tabs for Characters and Groups
 * - Main chat area that displays either character chat or group chat
 * - Unified message input that works for both contexts
 *
 * Responsibilities:
 * - Manage selection state (character vs. group)
 * - Render appropriate components based on selection
 * - Handle modals for creating/editing characters and groups
 * - Coordinate between character and group features
 */

import React, { useState } from 'react';
import './App.css';
import './AppEnhanced.css';
import { CharacterList } from './components/CharacterList';
import { GroupList } from './components/GroupList';
import { ChatWindow } from './components/ChatWindow';
import { GroupChatWindow } from './components/GroupChatWindow';
import { MessageInput } from './components/MessageInput';
import { GroupMessageInput } from './components/GroupMessageInput';
import { CharacterHeader } from './components/CharacterHeader';
import { GroupHeader } from './components/GroupHeader';
import { CharacterModal } from './components/CharacterModal';
import { GroupModal } from './components/GroupModal';
import { useCharacterStoreEnhanced } from './store/characterStoreEnhanced';
import { useGroupStore } from './store/groupStore';

/**
 * Selection type: either 'character' or 'group'.
 */
type SelectionType = 'character' | 'group' | null;

/**
 * Active sidebar tab: 'characters' or 'groups'.
 */
type SidebarTab = 'characters' | 'groups';

/**
 * AppWithGroups component.
 *
 * Enhanced app layout supporting both individual character chats and group chats.
 */
export const AppWithGroups: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('characters');
  const [selectionType, setSelectionType] = useState<SelectionType>(null);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<string | undefined>(undefined);
  const [editingGroupId, setEditingGroupId] = useState<string | undefined>(undefined);

  const {
    selectedCharacter,
    deleteCharacter,
    selectCharacter,
  } = useCharacterStoreEnhanced();

  const {
    selectedGroup,
    deleteGroup,
    selectGroup,
  } = useGroupStore();

  const handleCreateCharacter = () => {
    setEditingCharacterId(undefined);
    setIsCharacterModalOpen(true);
  };

  const handleCreateGroup = () => {
    setEditingGroupId(undefined);
    setIsGroupModalOpen(true);
  };

  const handleEditCharacter = () => {
    if (selectedCharacter) {
      setEditingCharacterId(selectedCharacter.id);
      setIsCharacterModalOpen(true);
    }
  };

  const handleEditGroup = () => {
    if (selectedGroup) {
      setEditingGroupId(selectedGroup.id);
      setIsGroupModalOpen(true);
    }
  };

  const handleDeleteCharacter = async () => {
    if (selectedCharacter && confirm(`Delete character "${selectedCharacter.name}"?`)) {
      await deleteCharacter(selectedCharacter.id);
    }
  };

  const handleDeleteGroup = async () => {
    if (selectedGroup && confirm(`Delete group "${selectedGroup.name}"?`)) {
      await deleteGroup(selectedGroup.id);
    }
  };

  const handleCharacterSelect = (characterId: string) => {
    selectGroup(null);
    selectCharacter(characterId);
    setSelectionType('character');
  };

  const handleGroupSelect = (groupId: string) => {
    selectCharacter(null);
    selectGroup(groupId);
    setSelectionType('group');
  };

  const handleTabChange = (tab: SidebarTab) => {
    setActiveTab(tab);
  };

  const renderHeader = () => {
    if (selectionType === 'character' && selectedCharacter) {
      return (
        <CharacterHeader
          character={selectedCharacter}
          onEditClick={handleEditCharacter}
          onDeleteClick={handleDeleteCharacter}
        />
      );
    }

    if (selectionType === 'group' && selectedGroup) {
      return (
        <GroupHeader
          group={selectedGroup}
          onEditClick={handleEditGroup}
          onDeleteClick={handleDeleteGroup}
        />
      );
    }

    return null;
  };

  const renderChatArea = () => {
    if (selectionType === 'character' && selectedCharacter) {
      return <ChatWindow characterId={selectedCharacter.id} character={selectedCharacter} />;
    }

    if (selectionType === 'group' && selectedGroup) {
      return <GroupChatWindow groupId={selectedGroup.id} group={selectedGroup} />;
    }

    return (
      <div className="empty-chat-state" data-testid="empty-chat-state">
        Select a {activeTab === 'characters' ? 'character' : 'group'} to start chatting
      </div>
    );
  };

  const renderMessageInput = () => {
    if (selectionType === 'character' && selectedCharacter) {
      return <MessageInput characterId={selectedCharacter.id} />;
    }

    if (selectionType === 'group' && selectedGroup) {
      return <GroupMessageInput groupId={selectedGroup.id} />;
    }

    return null;
  };

  return (
    <div className="app" data-testid="app-with-groups">
      <div className="sidebar" data-testid="sidebar">
        <div className="sidebar-tabs" data-testid="sidebar-tabs">
          <button
            className={`tab-button ${activeTab === 'characters' ? 'active' : ''}`}
            onClick={() => handleTabChange('characters')}
            data-testid="characters-tab"
          >
            Characters
          </button>
          <button
            className={`tab-button ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => handleTabChange('groups')}
            data-testid="groups-tab"
          >
            Groups
          </button>
        </div>

        <button
          onClick={activeTab === 'characters' ? handleCreateCharacter : handleCreateGroup}
          className="create-button"
          data-testid="create-button"
        >
          {activeTab === 'characters' ? 'New Character' : 'New Group'}
        </button>

        {activeTab === 'characters' ? (
          <CharacterList onCharacterSelect={handleCharacterSelect} />
        ) : (
          <GroupList onGroupSelect={handleGroupSelect} />
        )}
      </div>

      <div className="main-area" data-testid="main-area">
        {selectionType ? (
          <>
            <div className="header-section" data-testid="header-section">
              {renderHeader()}
            </div>

            <div className="chat-section" data-testid="chat-section">
              {renderChatArea()}
            </div>

            <div className="input-section" data-testid="input-section">
              {renderMessageInput()}
            </div>
          </>
        ) : (
          <div className="no-selection" data-testid="no-selection">
            Select a {activeTab === 'characters' ? 'character' : 'group'} to start chatting
          </div>
        )}
      </div>

      <CharacterModal
        isOpen={isCharacterModalOpen}
        onClose={() => setIsCharacterModalOpen(false)}
        characterId={editingCharacterId}
      />
      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        groupId={editingGroupId}
      />
    </div>
  );
};
