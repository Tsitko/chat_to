/**
 * CharacterList component - displays list of characters in sidebar.
 *
 * This component shows all available characters and handles character selection.
 */

import React, { useEffect } from 'react';
import { useCharacterStoreEnhanced } from '../store/characterStoreEnhanced';
import { Loader } from './Loader';

interface CharacterListProps {
  onCharacterSelect?: (characterId: string) => void;
}

export const CharacterList: React.FC<CharacterListProps> = ({ onCharacterSelect }) => {
  const {
    characters,
    selectedCharacterId,
    fetchCharacters,
    selectCharacter,
    loadingStates,
    isOperationLoading
  } = useCharacterStoreEnhanced();

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  const handleCharacterClick = (characterId: string) => {
    selectCharacter(characterId);
    if (onCharacterSelect) {
      onCharacterSelect(characterId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, characterId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCharacterClick(characterId);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const currentIndex = characters.findIndex((c) => c.id === characterId);
      let nextIndex: number;

      if (e.key === 'ArrowDown') {
        nextIndex = currentIndex < characters.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : characters.length - 1;
      }

      const nextCharacter = characters[nextIndex];
      if (nextCharacter) {
        handleCharacterClick(nextCharacter.id);
        const element = document.querySelector(`[data-character-id="${nextCharacter.id}"]`) as HTMLElement;
        element?.focus();
      }
    }
  };

  const isLoading = isOperationLoading('fetchAll');
  const error = loadingStates.fetchAll.error;

  if (isLoading) {
    return (
      <div className="character-list" data-testid="character-list">
        <Loader variant="spinner" size="md" text="Loading characters..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="character-list" data-testid="character-list">
        <div className="error-state">
          Failed to load characters: {error}
          <button onClick={fetchCharacters} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="character-list" data-testid="character-list">
        <div className="empty-state">No characters yet. Create one to get started!</div>
      </div>
    );
  }

  const filteredCharacters = characters.filter((char) => char !== null && char !== undefined);

  return (
    <div className="character-list" role="list" data-testid="character-list">
      {filteredCharacters.map((character) => (
        <div
          key={character.id}
          className={`character-item ${selectedCharacterId === character.id ? 'selected' : ''}`}
          role="listitem"
          tabIndex={0}
          aria-selected={selectedCharacterId === character.id}
          data-character-id={character.id}
          onClick={() => handleCharacterClick(character.id)}
          onKeyDown={(e) => handleKeyDown(e, character.id)}
        >
          {character.avatar_url && (
            <img
              src={character.avatar_url}
              alt={character.name}
              className="character-avatar"
            />
          )}
          <div className="character-name">{character.name}</div>
        </div>
      ))}
    </div>
  );
};
