/**
 * API and Store Integration Tests.
 *
 * Tests the integration between API service and Zustand stores.
 * These tests verify that data flows correctly from API to stores
 * and state updates happen as expected.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCharacterStore } from '../../store/characterStore';
import { useMessageStore } from '../../store/messageStore';
import { apiService } from '../../services/api';
import {
  mockCharacters,
  mockCharacter1,
  mockMessagesResponse,
  mockMessageResponse,
} from '../../tests/mockData';

describe('API and Store Integration', () => {
  let mockClient: any;

  beforeEach(() => {
    // Reset stores
    useCharacterStore.setState({
      characters: [],
      selectedCharacterId: null,
      selectedCharacter: null,
      isLoading: false,
      error: null,
    });

    useMessageStore.setState({
      messages: {},
      isLoading: false,
      isSending: false,
      error: null,
    });

    // Create mock axios client
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      defaults: { baseURL: '/api' },
    };

    // Set the mock client on apiService
    apiService.setClient(mockClient);

    vi.clearAllMocks();
  });

  describe('Character Store and API Integration', () => {
    it('should fetch characters from API and update store', async () => {
      // Arrange
      mockClient.get.mockResolvedValue({ data: mockCharacters });

      // Act
      await useCharacterStore.getState().fetchCharacters();

      // Assert
      expect(mockClient.get).toHaveBeenCalledWith('/characters');
      expect(useCharacterStore.getState().characters).toEqual(mockCharacters);
      expect(useCharacterStore.getState().error).toBeNull();
    });

    it('should handle API errors and update store error state', async () => {
      // Arrange
      mockClient.get.mockRejectedValue(new Error('Network Error'));

      // Act
      await useCharacterStore.getState().fetchCharacters();

      // Assert
      expect(useCharacterStore.getState().characters).toEqual([]);
      expect(useCharacterStore.getState().error).toBe('Network Error');
    });

    it('should create character via API and refresh store', async () => {
      // Arrange
      mockClient.post.mockResolvedValue({ data: mockCharacter1 });

      // Act
      await useCharacterStore.getState().createCharacter('Hegel');

      // Assert
      expect(mockClient.post).toHaveBeenCalled();
      expect(useCharacterStore.getState().characters).toContainEqual(mockCharacter1);
    });

    it('should select character and update selectedCharacter', () => {
      // Arrange
      useCharacterStore.setState({ characters: mockCharacters });

      // Act
      useCharacterStore.getState().selectCharacter('char-1');

      // Assert
      const state = useCharacterStore.getState();
      expect(state.selectedCharacterId).toBe('char-1');
      expect(state.selectedCharacter).toEqual(mockCharacter1);
    });

    it('should delete character and update both selected and list', async () => {
      // Arrange
      useCharacterStore.setState({
        characters: mockCharacters,
        selectedCharacterId: 'char-1',
        selectedCharacter: mockCharacter1,
      });

      mockClient.delete.mockResolvedValue({});

      // Act
      await useCharacterStore.getState().deleteCharacter('char-1');

      // Assert
      const state = useCharacterStore.getState();
      expect(state.selectedCharacterId).toBeNull();
      expect(state.selectedCharacter).toBeNull();
      expect(state.characters).not.toContainEqual(mockCharacter1);
    });
  });

  describe('Message Store and API Integration', () => {
    it('should fetch messages from API and update store', async () => {
      // Arrange
      mockClient.get.mockResolvedValue({ data: mockMessagesResponse });

      // Act
      await useMessageStore.getState().fetchMessages('char-1');

      // Assert
      expect(mockClient.get).toHaveBeenCalledWith('/characters/char-1/messages/', {
        params: { limit: 10, offset: 0 },
      });
      expect(useMessageStore.getState().messages['char-1']).toEqual(mockMessagesResponse.messages);
    });

    it('should send message via API and append to store', async () => {
      // Arrange
      useMessageStore.setState({ messages: { 'char-1': [] } });

      mockClient.post.mockResolvedValue({ data: mockMessageResponse });

      // Act
      await useMessageStore.getState().sendMessage('char-1', 'What is dialectics?');

      // Assert
      expect(mockClient.post).toHaveBeenCalledWith('/characters/char-1/messages/', {
        content: 'What is dialectics?',
      });
      const messages = useMessageStore.getState().messages['char-1'];
      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual(mockMessageResponse.user_message);
      expect(messages[1]).toEqual(mockMessageResponse.assistant_message);
    });

    it('should clear messages for specific character', () => {
      // Arrange
      useMessageStore.setState({
        messages: {
          'char-1': mockMessagesResponse.messages,
          'char-2': mockMessagesResponse.messages,
        },
      });

      // Act
      useMessageStore.getState().clearMessages('char-1');

      // Assert
      const state = useMessageStore.getState();
      expect(state.messages['char-1']).toEqual([]);
      expect(state.messages['char-2']).toEqual(mockMessagesResponse.messages);
    });
  });

  describe('Cross-Store Interactions', () => {
    it('should clear messages when character is deleted', async () => {
      // Arrange
      useCharacterStore.setState({
        characters: mockCharacters,
        selectedCharacterId: 'char-1',
        selectedCharacter: mockCharacter1,
      });
      useMessageStore.setState({
        messages: { 'char-1': mockMessagesResponse.messages },
      });

      mockClient.delete.mockResolvedValue({});

      // Act
      await useCharacterStore.getState().deleteCharacter('char-1');
      useMessageStore.getState().clearMessages('char-1');

      // Assert
      expect(useMessageStore.getState().messages['char-1']).toEqual([]);
      expect(useCharacterStore.getState().selectedCharacter).toBeNull();
    });

    it('should handle switching characters with message fetching', async () => {
      // Arrange
      useCharacterStore.setState({ characters: mockCharacters });

      mockClient.get.mockResolvedValue({ data: mockMessagesResponse });

      // Act
      useCharacterStore.getState().selectCharacter('char-1');
      await useMessageStore.getState().fetchMessages('char-1');

      useCharacterStore.getState().selectCharacter('char-2');
      await useMessageStore.getState().fetchMessages('char-2');

      // Assert
      expect(useCharacterStore.getState().selectedCharacterId).toBe('char-2');
      expect(useMessageStore.getState().messages['char-1']).toBeDefined();
      expect(useMessageStore.getState().messages['char-2']).toBeDefined();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from character fetch error', async () => {
      // Arrange
      mockClient.get
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({ data: mockCharacters });

      // Act - First attempt fails
      await useCharacterStore.getState().fetchCharacters();
      expect(useCharacterStore.getState().error).toBe('Network Error');

      // Act - Retry succeeds
      await useCharacterStore.getState().fetchCharacters();

      // Assert
      expect(useCharacterStore.getState().error).toBeNull();
      expect(useCharacterStore.getState().characters).toEqual(mockCharacters);
    });

    it('should recover from message send error', async () => {
      // Arrange
      useMessageStore.setState({ messages: { 'char-1': [] } });

      mockClient.post
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({ data: mockMessageResponse });

      // Act - First attempt fails
      await useMessageStore.getState().sendMessage('char-1', 'Hello');
      expect(useMessageStore.getState().error).toBe('Network Error');
      expect(useMessageStore.getState().messages['char-1']).toHaveLength(0);

      // Act - Retry succeeds
      await useMessageStore.getState().sendMessage('char-1', 'Hello');

      // Assert
      expect(useMessageStore.getState().error).toBeNull();
      expect(useMessageStore.getState().messages['char-1']).toHaveLength(2);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent character fetches', async () => {
      // Arrange
      mockClient.get.mockResolvedValue({ data: mockCharacters });

      // Act - Trigger multiple fetches concurrently
      await Promise.all([
        useCharacterStore.getState().fetchCharacters(),
        useCharacterStore.getState().fetchCharacters(),
        useCharacterStore.getState().fetchCharacters(),
      ]);

      // Assert - Should have made 3 requests but state should be consistent
      expect(mockClient.get).toHaveBeenCalledTimes(3);
      expect(useCharacterStore.getState().characters).toEqual(mockCharacters);
    });

    it('should handle concurrent message sends', async () => {
      // Arrange
      useMessageStore.setState({ messages: { 'char-1': [] } });

      mockClient.post.mockResolvedValue({ data: mockMessageResponse });

      // Act - Send multiple messages concurrently
      await Promise.all([
        useMessageStore.getState().sendMessage('char-1', 'Message 1'),
        useMessageStore.getState().sendMessage('char-1', 'Message 2'),
      ]);

      // Assert - Messages should be in store
      expect(mockClient.post).toHaveBeenCalledTimes(2);
      expect(useMessageStore.getState().messages['char-1'].length).toBeGreaterThan(0);
    });
  });
});
