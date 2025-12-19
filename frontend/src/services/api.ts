/**
 * API service for communicating with the backend.
 *
 * This module provides methods for all API endpoints.
 */

import axios, { AxiosInstance } from 'axios';
import type { Character, CharacterCreate, CharacterUpdate } from '../types/character';
import type { MessagesResponse, MessageCreate, MessageResponse } from '../types/message';
import type { IndexingStatusResponse } from '../types/indexing';
import type { Group, GroupCreate, GroupUpdate, GroupMessageRequest, GroupMessageResponse } from '../types/group';

class ApiService {
  private client: AxiosInstance;

  constructor(baseURL: string = '/api') {
    this.initializeClient(baseURL);
  }

  private initializeClient(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Method to reinitialize client (useful for testing)
  public setClient(client: AxiosInstance) {
    this.client = client;
  }

  // Method to get current client (useful for testing)
  public getClient(): AxiosInstance {
    return this.client;
  }

  // Method to reinitialize with new baseURL (useful for testing)
  public reinitialize(baseURL: string = '/api') {
    this.initializeClient(baseURL);
  }

  /**
   * Get all characters.
   */
  async getCharacters(): Promise<Character[]> {
    const response = await this.client.get<Character[]>('/characters/');
    return response.data;
  }

  /**
   * Get a specific character by ID.
   */
  async getCharacter(characterId: string): Promise<Character> {
    const response = await this.client.get<Character>(`/characters/${characterId}`);
    return response.data;
  }

  /**
   * Create a new character.
   */
  async createCharacter(data: CharacterCreate): Promise<Character> {
    const formData = new FormData();
    formData.append('name', data.name);

    if (data.avatar) {
      formData.append('avatar', data.avatar);
    }

    if (data.books && data.books.length > 0) {
      data.books.forEach((book) => {
        formData.append('books', book);
      });
    }

    const response = await this.client.post<Character>('/characters/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Update a character.
   */
  async updateCharacter(characterId: string, data: CharacterUpdate): Promise<Character> {
    const formData = new FormData();

    if (data.name) {
      formData.append('name', data.name);
    }

    if (data.avatar) {
      formData.append('avatar', data.avatar);
    }

    if (data.books && data.books.length > 0) {
      data.books.forEach((book) => {
        formData.append('books', book);
      });
    }

    const response = await this.client.put<Character>(`/characters/${characterId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Delete a character.
   */
  async deleteCharacter(characterId: string): Promise<void> {
    await this.client.delete(`/characters/${characterId}`);
  }

  /**
   * Get character avatar URL.
   */
  getAvatarUrl(characterId: string): string {
    return `${this.client.defaults.baseURL}/characters/${characterId}/avatar`;
  }

  /**
   * Add a book to a character.
   */
  async addBook(characterId: string, book: File): Promise<void> {
    const formData = new FormData();
    formData.append('book', book);

    await this.client.post(`/characters/${characterId}/books/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Delete a book from a character.
   */
  async deleteBook(characterId: string, bookId: string): Promise<void> {
    await this.client.delete(`/characters/${characterId}/books/${bookId}`);
  }

  /**
   * Get messages for a character.
   */
  async getMessages(
    characterId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<MessagesResponse> {
    const response = await this.client.get<MessagesResponse>(
      `/characters/${characterId}/messages/`,
      {
        params: { limit, offset },
      }
    );
    return response.data;
  }

  /**
   * Send a message to a character.
   */
  async sendMessage(characterId: string, message: MessageCreate): Promise<MessageResponse> {
    const response = await this.client.post<MessageResponse>(
      `/characters/${characterId}/messages/`,
      message
    );
    return response.data;
  }

  /**
   * Get indexing status for a character.
   */
  async getIndexingStatus(characterId: string): Promise<IndexingStatusResponse> {
    const response = await this.client.get<IndexingStatusResponse>(
      `/characters/${characterId}/indexing-status/`
    );
    return response.data;
  }

  // ========== Group API Methods ==========

  /**
   * Get all groups.
   *
   * @returns Promise resolving to array of groups
   */
  async getGroups(): Promise<Group[]> {
    const response = await this.client.get<Group[]>('/groups/');
    return response.data;
  }

  /**
   * Get a specific group by ID.
   *
   * @param groupId - ID of the group to retrieve
   * @returns Promise resolving to the group object
   */
  async getGroup(groupId: string): Promise<Group> {
    const response = await this.client.get<Group>(`/groups/${groupId}`);
    return response.data;
  }

  /**
   * Create a new group.
   *
   * @param data - Group creation data (name, character_ids, optional avatar)
   * @returns Promise resolving to the created group
   */
  async createGroup(data: GroupCreate): Promise<Group> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('character_ids', JSON.stringify(data.character_ids));

    if (data.avatar) {
      formData.append('avatar', data.avatar);
    }

    const response = await this.client.post<Group>('/groups/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Update an existing group.
   *
   * @param groupId - ID of the group to update
   * @param data - Group update data (name, character_ids, or avatar)
   * @returns Promise resolving to the updated group
   */
  async updateGroup(groupId: string, data: GroupUpdate): Promise<Group> {
    const formData = new FormData();

    if (data.name) {
      formData.append('name', data.name);
    }

    if (data.character_ids) {
      formData.append('character_ids', JSON.stringify(data.character_ids));
    }

    if (data.avatar) {
      formData.append('avatar', data.avatar);
    }

    const response = await this.client.put<Group>(`/groups/${groupId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Delete a group.
   *
   * @param groupId - ID of the group to delete
   * @returns Promise resolving when deletion is complete
   */
  async deleteGroup(groupId: string): Promise<void> {
    await this.client.delete(`/groups/${groupId}`);
  }

  /**
   * Get group avatar URL.
   *
   * @param groupId - ID of the group
   * @returns URL string for the group's avatar
   */
  getGroupAvatarUrl(groupId: string): string {
    return `${this.client.defaults.baseURL}/groups/${groupId}/avatar`;
  }

  /**
   * Get messages for a group.
   *
   * @param groupId - ID of the group
   * @param limit - Maximum number of messages to retrieve
   * @param offset - Offset for pagination
   * @returns Promise resolving to messages response
   */
  async getGroupMessages(
    groupId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MessagesResponse> {
    const response = await this.client.get<MessagesResponse>(
      `/groups/${groupId}/messages/`,
      {
        params: { limit, offset },
      }
    );
    return response.data;
  }

  /**
   * Send a message to a group.
   * This triggers responses from all characters in the group.
   *
   * Backend API: POST /api/groups/messages
   * Request body: { messages: Message[], character_ids: string[] }
   * Response: { responses: CharacterResponse[], statistics: {...} }
   *
   * @param request - Group message request containing messages and character IDs
   * @returns Promise resolving to group message response with character responses
   */
  async sendGroupMessage(request: GroupMessageRequest): Promise<GroupMessageResponse> {
    const response = await this.client.post<GroupMessageResponse>(
      '/groups/messages/',
      request
    );
    return response.data;
  }
}

export const apiService = new ApiService();
