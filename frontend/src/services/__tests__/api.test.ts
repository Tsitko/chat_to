/**
 * API Service Unit Tests.
 *
 * Comprehensive tests for all API service methods covering:
 * - Successful responses
 * - Error handling
 * - Network failures
 * - Edge cases
 * - Request formatting
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import { apiService } from '../api';
import {
  mockCharacters,
  mockCharacter1,
  mockCharacter2,
  mockMessagesResponse,
  mockMessageResponse,
  mockIndexingStatusResponse,
  mockAvatarFile,
  mockBookFile1,
} from '../../tests/mockData';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('ApiService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup default axios.create mock
    mockedAxios.create.mockReturnValue({
      defaults: {
        baseURL: '/api',
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as any);
  });

  describe('getCharacters', () => {
    it('should fetch all characters successfully', async () => {
      // Arrange
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: mockCharacters }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.getCharacters();

      // Assert
      expect(mockClient.get).toHaveBeenCalledWith('/characters');
      expect(result).toEqual(mockCharacters);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no characters exist', async () => {
      // Arrange
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: [] }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.getCharacters();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle network error when fetching characters', async () => {
      // Arrange
      const networkError = new Error('Network Error');
      const mockClient = {
        get: vi.fn().mockRejectedValue(networkError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.getCharacters()).rejects.toThrow('Network Error');
    });

    it('should handle 500 server error when fetching characters', async () => {
      // Arrange
      const serverError = {
        response: {
          status: 500,
          data: { error: 'Internal Server Error' },
        },
      };
      const mockClient = {
        get: vi.fn().mockRejectedValue(serverError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.getCharacters()).rejects.toMatchObject(serverError);
    });
  });

  describe('getCharacter', () => {
    it('should fetch a specific character by ID successfully', async () => {
      // Arrange
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: mockCharacter1 }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.getCharacter('char-1');

      // Assert
      expect(mockClient.get).toHaveBeenCalledWith('/characters/char-1');
      expect(result).toEqual(mockCharacter1);
      expect(result.id).toBe('char-1');
    });

    it('should handle 404 error when character not found', async () => {
      // Arrange
      const notFoundError = {
        response: {
          status: 404,
          data: { error: 'Character not found' },
        },
      };
      const mockClient = {
        get: vi.fn().mockRejectedValue(notFoundError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.getCharacter('nonexistent')).rejects.toMatchObject(notFoundError);
    });

    it('should handle empty string character ID', async () => {
      // Arrange
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: null }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      await service.getCharacter('');

      // Assert
      expect(mockClient.get).toHaveBeenCalledWith('/characters/');
    });

    it('should handle special characters in character ID', async () => {
      // Arrange
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: mockCharacter1 }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();
      const specialId = 'char-with-special!@#$%';

      // Act
      await service.getCharacter(specialId);

      // Assert
      expect(mockClient.get).toHaveBeenCalledWith(`/characters/${specialId}`);
    });
  });

  describe('createCharacter', () => {
    it('should create a character with name only', async () => {
      // Arrange
      const newCharacter = { ...mockCharacter2, id: 'new-char-1' };
      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: newCharacter }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.createCharacter({ name: 'Kant' });

      // Assert
      expect(mockClient.post).toHaveBeenCalled();
      const callArgs = mockClient.post.mock.calls[0];
      expect(callArgs[0]).toBe('/characters/');
      expect(callArgs[1]).toBeInstanceOf(FormData);
      expect(result).toEqual(newCharacter);
      expect(result.name).toBe('Kant');
    });

    it('should create a character with name and avatar', async () => {
      // Arrange
      const newCharacter = { ...mockCharacter1, id: 'new-char-2' };
      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: newCharacter }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.createCharacter({
        name: 'Hegel',
        avatar: mockAvatarFile,
      });

      // Assert
      expect(mockClient.post).toHaveBeenCalled();
      const callArgs = mockClient.post.mock.calls[0];
      expect(callArgs[0]).toBe('/characters/');
      expect(callArgs[1]).toBeInstanceOf(FormData);
      expect(result).toEqual(newCharacter);
    });

    it('should create a character with name, avatar, and books', async () => {
      // Arrange
      const newCharacter = mockCharacter1;
      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: newCharacter }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.createCharacter({
        name: 'Hegel',
        avatar: mockAvatarFile,
        books: [mockBookFile1],
      });

      // Assert
      expect(mockClient.post).toHaveBeenCalled();
      const callArgs = mockClient.post.mock.calls[0];
      expect(callArgs[0]).toBe('/characters/');
      expect(callArgs[1]).toBeInstanceOf(FormData);
      expect(result).toEqual(newCharacter);
    });

    it('should handle validation error when creating character with empty name', async () => {
      // Arrange
      const validationError = {
        response: {
          status: 400,
          data: { error: 'Name is required' },
        },
      };
      const mockClient = {
        post: vi.fn().mockRejectedValue(validationError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.createCharacter({ name: '' })).rejects.toMatchObject(validationError);
    });

    it('should handle error when creating character with extremely long name', async () => {
      // Arrange
      const longName = 'a'.repeat(1000);
      const validationError = {
        response: {
          status: 400,
          data: { error: 'Name too long' },
        },
      };
      const mockClient = {
        post: vi.fn().mockRejectedValue(validationError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.createCharacter({ name: longName })).rejects.toMatchObject(validationError);
    });
  });

  describe('updateCharacter', () => {
    it('should update character name only', async () => {
      // Arrange
      const updatedCharacter = { ...mockCharacter1, name: 'Georg Wilhelm Friedrich Hegel' };
      const mockClient = {
        put: vi.fn().mockResolvedValue({ data: updatedCharacter }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.updateCharacter('char-1', {
        name: 'Georg Wilhelm Friedrich Hegel',
      });

      // Assert
      expect(mockClient.put).toHaveBeenCalled();
      const callArgs = mockClient.put.mock.calls[0];
      expect(callArgs[0]).toBe('/characters/char-1');
      expect(callArgs[1]).toBeInstanceOf(FormData);
      expect(result).toEqual(updatedCharacter);
    });

    it('should update character avatar only', async () => {
      // Arrange
      const updatedCharacter = mockCharacter1;
      const mockClient = {
        put: vi.fn().mockResolvedValue({ data: updatedCharacter }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.updateCharacter('char-1', {
        avatar: mockAvatarFile,
      });

      // Assert
      expect(mockClient.put).toHaveBeenCalled();
      const callArgs = mockClient.put.mock.calls[0];
      expect(callArgs[0]).toBe('/characters/char-1');
      expect(callArgs[1]).toBeInstanceOf(FormData);
      expect(result).toEqual(updatedCharacter);
    });

    it('should update character with empty data object', async () => {
      // Arrange
      const updatedCharacter = mockCharacter1;
      const mockClient = {
        put: vi.fn().mockResolvedValue({ data: updatedCharacter }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.updateCharacter('char-1', {});

      // Assert
      expect(mockClient.put).toHaveBeenCalled();
      const callArgs = mockClient.put.mock.calls[0];
      expect(callArgs[0]).toBe('/characters/char-1');
      expect(callArgs[1]).toBeInstanceOf(FormData);
      expect(result).toEqual(updatedCharacter);
    });

    it('should handle 404 error when updating nonexistent character', async () => {
      // Arrange
      const notFoundError = {
        response: {
          status: 404,
          data: { error: 'Character not found' },
        },
      };
      const mockClient = {
        put: vi.fn().mockRejectedValue(notFoundError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(
        service.updateCharacter('nonexistent', { name: 'New Name' })
      ).rejects.toMatchObject(notFoundError);
    });
  });

  describe('deleteCharacter', () => {
    it('should delete a character successfully', async () => {
      // Arrange
      const mockClient = {
        delete: vi.fn().mockResolvedValue({ data: null }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      await service.deleteCharacter('char-1');

      // Assert
      expect(mockClient.delete).toHaveBeenCalledWith('/characters/char-1');
    });

    it('should handle 404 error when deleting nonexistent character', async () => {
      // Arrange
      const notFoundError = {
        response: {
          status: 404,
          data: { error: 'Character not found' },
        },
      };
      const mockClient = {
        delete: vi.fn().mockRejectedValue(notFoundError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.deleteCharacter('nonexistent')).rejects.toMatchObject(notFoundError);
    });

    it('should handle error when deleting character with active conversations', async () => {
      // Arrange
      const conflictError = {
        response: {
          status: 409,
          data: { error: 'Character has active conversations' },
        },
      };
      const mockClient = {
        delete: vi.fn().mockRejectedValue(conflictError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.deleteCharacter('char-1')).rejects.toMatchObject(conflictError);
    });

    it('should handle empty character ID when deleting', async () => {
      // Arrange
      const mockClient = {
        delete: vi.fn().mockResolvedValue({ data: null }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      await service.deleteCharacter('');

      // Assert
      expect(mockClient.delete).toHaveBeenCalledWith('/characters/');
    });
  });

  describe('getAvatarUrl', () => {
    it('should return correct avatar URL for character', () => {
      // Arrange
      const service = new (apiService.constructor as any)('/api');

      // Act
      const url = service.getAvatarUrl('char-1');

      // Assert
      expect(url).toBe('/api/characters/char-1/avatar');
    });

    it('should handle empty character ID', () => {
      // Arrange
      const service = new (apiService.constructor as any)('/api');

      // Act
      const url = service.getAvatarUrl('');

      // Assert
      expect(url).toBe('/api/characters//avatar');
    });

    it('should handle special characters in character ID', () => {
      // Arrange
      const service = new (apiService.constructor as any)('/api');
      const specialId = 'char-123!@#';

      // Act
      const url = service.getAvatarUrl(specialId);

      // Assert
      expect(url).toBe(`/api/characters/${specialId}/avatar`);
    });

    it('should work with custom base URL', () => {
      // Arrange
      const mockClient = {
        get: vi.fn(),
        defaults: { baseURL: 'http://localhost:1310/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)('http://localhost:1310/api');

      // Act
      const url = service.getAvatarUrl('char-1');

      // Assert
      expect(url).toBe('http://localhost:1310/api/characters/char-1/avatar');
    });
  });

  describe('addBook', () => {
    it('should add a book to a character successfully', async () => {
      // Arrange
      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: null }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      await service.addBook('char-1', mockBookFile1);

      // Assert
      expect(mockClient.post).toHaveBeenCalled();
      const callArgs = mockClient.post.mock.calls[0];
      expect(callArgs[0]).toBe('/characters/char-1/books/');
      expect(callArgs[1]).toBeInstanceOf(FormData);
    });

    it('should handle error when adding invalid file type', async () => {
      // Arrange
      const validationError = {
        response: {
          status: 400,
          data: { error: 'Invalid file type' },
        },
      };
      const mockClient = {
        post: vi.fn().mockRejectedValue(validationError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();
      const invalidFile = new File(['content'], 'invalid.exe', { type: 'application/x-executable' });

      // Act & Assert
      await expect(service.addBook('char-1', invalidFile)).rejects.toMatchObject(validationError);
    });

    it('should handle error when adding book to nonexistent character', async () => {
      // Arrange
      const notFoundError = {
        response: {
          status: 404,
          data: { error: 'Character not found' },
        },
      };
      const mockClient = {
        post: vi.fn().mockRejectedValue(notFoundError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.addBook('nonexistent', mockBookFile1)).rejects.toMatchObject(notFoundError);
    });

    it('should handle error when adding extremely large file', async () => {
      // Arrange
      const fileSizeError = {
        response: {
          status: 413,
          data: { error: 'File too large' },
        },
      };
      const mockClient = {
        post: vi.fn().mockRejectedValue(fileSizeError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();
      const largeFile = new File(['x'.repeat(100000000)], 'huge.txt', { type: 'text/plain' });

      // Act & Assert
      await expect(service.addBook('char-1', largeFile)).rejects.toMatchObject(fileSizeError);
    });

    it('should handle network timeout when uploading book', async () => {
      // Arrange
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      };
      const mockClient = {
        post: vi.fn().mockRejectedValue(timeoutError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.addBook('char-1', mockBookFile1)).rejects.toMatchObject(timeoutError);
    });
  });

  describe('deleteBook', () => {
    it('should delete a book from a character successfully', async () => {
      // Arrange
      const mockClient = {
        delete: vi.fn().mockResolvedValue({ data: null }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      await service.deleteBook('char-1', 'book-1');

      // Assert
      expect(mockClient.delete).toHaveBeenCalledWith('/characters/char-1/books/book-1');
    });

    it('should handle 404 error when deleting nonexistent book', async () => {
      // Arrange
      const notFoundError = {
        response: {
          status: 404,
          data: { error: 'Book not found' },
        },
      };
      const mockClient = {
        delete: vi.fn().mockRejectedValue(notFoundError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.deleteBook('char-1', 'nonexistent')).rejects.toMatchObject(notFoundError);
    });

    it('should handle empty book ID', async () => {
      // Arrange
      const mockClient = {
        delete: vi.fn().mockResolvedValue({ data: null }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      await service.deleteBook('char-1', '');

      // Assert
      expect(mockClient.delete).toHaveBeenCalledWith('/characters/char-1/books/');
    });

    it('should handle error when deleting last book of character', async () => {
      // Arrange
      const conflictError = {
        response: {
          status: 409,
          data: { error: 'Cannot delete last book' },
        },
      };
      const mockClient = {
        delete: vi.fn().mockRejectedValue(conflictError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.deleteBook('char-1', 'book-1')).rejects.toMatchObject(conflictError);
    });
  });

  describe('getMessages', () => {
    it('should fetch messages with default pagination', async () => {
      // Arrange
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: mockMessagesResponse }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.getMessages('char-1');

      // Assert
      expect(mockClient.get).toHaveBeenCalledWith('/characters/char-1/messages/', {
        params: { limit: 10, offset: 0 },
      });
      expect(result).toEqual(mockMessagesResponse);
      expect(result.messages).toHaveLength(4);
    });

    it('should fetch messages with custom pagination', async () => {
      // Arrange
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: mockMessagesResponse }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.getMessages('char-1', 50, 100);

      // Assert
      expect(mockClient.get).toHaveBeenCalledWith('/characters/char-1/messages/', {
        params: { limit: 50, offset: 100 },
      });
      expect(result).toEqual(mockMessagesResponse);
    });

    it('should return empty messages array when no messages exist', async () => {
      // Arrange
      const emptyResponse = { messages: [], total: 0 };
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: emptyResponse }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.getMessages('char-1');

      // Assert
      expect(result.messages).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle negative limit and offset', async () => {
      // Arrange
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: mockMessagesResponse }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      await service.getMessages('char-1', -10, -5);

      // Assert
      expect(mockClient.get).toHaveBeenCalledWith('/characters/char-1/messages/', {
        params: { limit: -10, offset: -5 },
      });
    });

    it('should handle 404 error when fetching messages for nonexistent character', async () => {
      // Arrange
      const notFoundError = {
        response: {
          status: 404,
          data: { error: 'Character not found' },
        },
      };
      const mockClient = {
        get: vi.fn().mockRejectedValue(notFoundError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.getMessages('nonexistent')).rejects.toMatchObject(notFoundError);
    });

    it('should handle extremely large limit value', async () => {
      // Arrange
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: mockMessagesResponse }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      await service.getMessages('char-1', 999999, 0);

      // Assert
      expect(mockClient.get).toHaveBeenCalledWith('/characters/char-1/messages/', {
        params: { limit: 999999, offset: 0 },
      });
    });
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      // Arrange
      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: mockMessageResponse }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();
      const messageContent = 'What is dialectics?';

      // Act
      const result = await service.sendMessage('char-1', { content: messageContent });

      // Assert
      expect(mockClient.post).toHaveBeenCalledWith('/characters/char-1/messages/', {
        content: messageContent,
      });
      expect(result).toEqual(mockMessageResponse);
      expect(result.user_message.content).toBe(messageContent);
      expect(result.assistant_message.role).toBe('assistant');
    });

    it('should handle empty message content', async () => {
      // Arrange
      const validationError = {
        response: {
          status: 400,
          data: { error: 'Message content cannot be empty' },
        },
      };
      const mockClient = {
        post: vi.fn().mockRejectedValue(validationError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.sendMessage('char-1', { content: '' })).rejects.toMatchObject(validationError);
    });

    it('should handle extremely long message content', async () => {
      // Arrange
      const longContent = 'a'.repeat(100000);
      const mockResponse = {
        user_message: { id: 'msg-1', role: 'user', content: longContent, created_at: '2025-01-10T10:00:00Z' },
        assistant_message: { id: 'msg-2', role: 'assistant', content: 'Response', created_at: '2025-01-10T10:00:05Z' },
      };
      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: mockResponse }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.sendMessage('char-1', { content: longContent });

      // Assert
      expect(mockClient.post).toHaveBeenCalledWith('/characters/char-1/messages/', {
        content: longContent,
      });
      expect(result.user_message.content).toBe(longContent);
    });

    it('should handle special characters in message content', async () => {
      // Arrange
      const specialContent = 'Hello! @#$%^&*() <script>alert("xss")</script>';
      const mockResponse = {
        user_message: { id: 'msg-1', role: 'user', content: specialContent, created_at: '2025-01-10T10:00:00Z' },
        assistant_message: { id: 'msg-2', role: 'assistant', content: 'Response', created_at: '2025-01-10T10:00:05Z' },
      };
      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: mockResponse }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.sendMessage('char-1', { content: specialContent });

      // Assert
      expect(result.user_message.content).toBe(specialContent);
    });

    it('should handle 404 error when sending message to nonexistent character', async () => {
      // Arrange
      const notFoundError = {
        response: {
          status: 404,
          data: { error: 'Character not found' },
        },
      };
      const mockClient = {
        post: vi.fn().mockRejectedValue(notFoundError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(
        service.sendMessage('nonexistent', { content: 'Hello' })
      ).rejects.toMatchObject(notFoundError);
    });

    it('should handle timeout error when LLM takes too long', async () => {
      // Arrange
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 60000ms exceeded',
      };
      const mockClient = {
        post: vi.fn().mockRejectedValue(timeoutError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(
        service.sendMessage('char-1', { content: 'Complex question' })
      ).rejects.toMatchObject(timeoutError);
    });

    it('should handle 503 error when LLM service is unavailable', async () => {
      // Arrange
      const serviceUnavailableError = {
        response: {
          status: 503,
          data: { error: 'LLM service unavailable' },
        },
      };
      const mockClient = {
        post: vi.fn().mockRejectedValue(serviceUnavailableError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(
        service.sendMessage('char-1', { content: 'Hello' })
      ).rejects.toMatchObject(serviceUnavailableError);
    });
  });

  describe('getIndexingStatus', () => {
    it('should fetch indexing status successfully', async () => {
      // Arrange
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: mockIndexingStatusResponse }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.getIndexingStatus('char-1');

      // Assert
      expect(mockClient.get).toHaveBeenCalledWith('/characters/char-1/indexing-status/');
      expect(result).toEqual(mockIndexingStatusResponse);
      expect(result.overall_status).toBe('indexing');
    });

    it('should handle completed indexing status', async () => {
      // Arrange
      const completedResponse = {
        books_indexing: [{ book_id: 'book-1', status: 'completed', progress: 100 }],
        overall_status: 'completed',
      };
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: completedResponse }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.getIndexingStatus('char-1');

      // Assert
      expect(result.overall_status).toBe('completed');
      expect(result.books_indexing[0].progress).toBe(100);
    });

    it('should handle failed indexing status', async () => {
      // Arrange
      const failedResponse = {
        books_indexing: [{ book_id: 'book-1', status: 'failed', progress: 50 }],
        overall_status: 'failed',
      };
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: failedResponse }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.getIndexingStatus('char-1');

      // Assert
      expect(result.overall_status).toBe('failed');
    });

    it('should handle empty books_indexing array', async () => {
      // Arrange
      const emptyResponse = {
        books_indexing: [],
        overall_status: 'pending',
      };
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: emptyResponse }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.getIndexingStatus('char-1');

      // Assert
      expect(result.books_indexing).toEqual([]);
      expect(result.overall_status).toBe('pending');
    });

    it('should handle 404 error when fetching status for nonexistent character', async () => {
      // Arrange
      const notFoundError = {
        response: {
          status: 404,
          data: { error: 'Character not found' },
        },
      };
      const mockClient = {
        get: vi.fn().mockRejectedValue(notFoundError),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.getIndexingStatus('nonexistent')).rejects.toMatchObject(notFoundError);
    });

    it('should handle multiple books with different statuses', async () => {
      // Arrange
      const multipleBookResponse = {
        books_indexing: [
          { book_id: 'book-1', status: 'completed', progress: 100 },
          { book_id: 'book-2', status: 'indexing', progress: 50 },
          { book_id: 'book-3', status: 'pending', progress: 0 },
        ],
        overall_status: 'indexing',
      };
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: multipleBookResponse }),
        defaults: { baseURL: '/api' },
      };
      mockedAxios.create.mockReturnValue(mockClient as any);

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.getIndexingStatus('char-1');

      // Assert
      expect(result.books_indexing).toHaveLength(3);
      expect(result.books_indexing[0].status).toBe('completed');
      expect(result.books_indexing[1].status).toBe('indexing');
      expect(result.books_indexing[2].status).toBe('pending');
    });
  });
});
