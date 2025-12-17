/**
 * Main App component - root component with layout.
 *
 * This component implements the Telegram-like layout with sidebar and chat area.
 */

import React, { useState } from 'react';
import { CharacterList } from './components/CharacterList';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import { CharacterHeader } from './components/CharacterHeader';
import { CharacterModal } from './components/CharacterModal';
import { useCharacterStoreEnhanced } from './store/characterStoreEnhanced';
import './App.css';
import './AppEnhanced.css';

export const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<string | undefined>(undefined);
  const { selectedCharacter, deleteCharacter } = useCharacterStoreEnhanced();

  const handleCreateCharacter = () => {
    setEditingCharacterId(undefined);
    setIsModalOpen(true);
  };

  const handleEditCharacter = () => {
    if (selectedCharacter) {
      setEditingCharacterId(selectedCharacter.id);
      setIsModalOpen(true);
    }
  };

  const handleDeleteCharacter = async () => {
    if (selectedCharacter) {
      await deleteCharacter(selectedCharacter.id);
    }
  };

  return (
    <div className="app">
      {/* Sidebar - 20% width */}
      <div className="sidebar">
        <button onClick={handleCreateCharacter} className="create-character-btn">
          New Character
        </button>
        <CharacterList />
      </div>

      {/* Main chat area - 80% width */}
      <div className="main-area">
        {selectedCharacter ? (
          <>
            {/* Character header - 10% height */}
            <div className="header-section">
              <CharacterHeader
                character={selectedCharacter}
                onEditClick={handleEditCharacter}
                onDeleteClick={handleDeleteCharacter}
              />
            </div>

            {/* Chat messages - 60% height */}
            <div className="chat-section">
              <ChatWindow characterId={selectedCharacter.id} character={selectedCharacter} />
            </div>

            {/* Message input - 30% height */}
            <div className="input-section">
              <MessageInput characterId={selectedCharacter.id} />
            </div>
          </>
        ) : (
          <div className="no-selection">
            Select a character to start chatting
          </div>
        )}
      </div>

      <CharacterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        characterId={editingCharacterId}
      />
    </div>
  );
};
