/**
 * API Service Tests for clearGroupMessages method.
 *
 * Comprehensive TDD tests for the clearGroupMessages API method covering:
 * - Successful message clearing (204 No Content)
 * - Correct HTTP method (DELETE)
 * - Correct endpoint path
 * - Error handling for network failures
 * - Error handling for 404 (group not found)
 * - Error handling for 500 (server error)
 * - Edge cases (special characters in group ID, empty responses)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios, { AxiosError } from 'axios';
import { apiService } from '../api';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('ApiService - clearGroupMessages', () => {
  let mockClient: any;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup mock axios client
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      defaults: {
        baseURL: '/api',
      },
    };

    mockedAxios.create.mockReturnValue(mockClient as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Happy Path', () => {
    it('should successfully clear group messages with 204 response', async () => {
      // Arrange
      const groupId = 'group-123';
      mockClient.delete.mockResolvedValue({
        status: 204,
        data: '', // 204 No Content has empty body
      });

      const service = new (apiService.constructor as any)();

      // Act
      await service.clearGroupMessages(groupId);

      // Assert
      expect(mockClient.delete).toHaveBeenCalledTimes(1);
      expect(mockClient.delete).toHaveBeenCalledWith(`/groups/${groupId}/messages`);
    });

    it('should use DELETE HTTP method', async () => {
      // Arrange
      const groupId = 'test-group-456';
      mockClient.delete.mockResolvedValue({ status: 204, data: '' });

      const service = new (apiService.constructor as any)();

      // Act
      await service.clearGroupMessages(groupId);

      // Assert
      // Verify DELETE method was called, not GET/POST/PUT
      expect(mockClient.delete).toHaveBeenCalled();
      expect(mockClient.get).not.toHaveBeenCalled();
      expect(mockClient.post).not.toHaveBeenCalled();
      expect(mockClient.put).not.toHaveBeenCalled();
    });

    it('should construct correct endpoint path with group ID', async () => {
      // Arrange
      const groupId = '550e8400-e29b-41d4-a716-446655440000'; // UUID format
      mockClient.delete.mockResolvedValue({ status: 204, data: '' });

      const service = new (apiService.constructor as any)();

      // Act
      await service.clearGroupMessages(groupId);

      // Assert
      const expectedPath = `/groups/${groupId}/messages`;
      expect(mockClient.delete).toHaveBeenCalledWith(expectedPath);
    });

    it('should handle 204 No Content response without throwing error', async () => {
      // Arrange
      const groupId = 'group-789';
      mockClient.delete.mockResolvedValue({
        status: 204,
        statusText: 'No Content',
        data: '',
      });

      const service = new (apiService.constructor as any)();

      // Act & Assert - Should not throw
      await expect(service.clearGroupMessages(groupId)).resolves.toBeUndefined();
    });
  });

  describe('Error Handling - Group Not Found', () => {
    it('should throw error when group does not exist (404)', async () => {
      // Arrange
      const groupId = 'non-existent-group';
      const error404 = {
        response: {
          status: 404,
          data: { detail: 'Group not found' },
        },
        isAxiosError: true,
      };

      mockClient.delete.mockRejectedValue(error404);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.clearGroupMessages(groupId)).rejects.toMatchObject(error404);
    });

    it('should preserve 404 error detail message', async () => {
      // Arrange
      const groupId = 'missing-group';
      const errorDetail = 'Group not found';
      const error404 = {
        response: {
          status: 404,
          data: { detail: errorDetail },
        },
      };

      mockClient.delete.mockRejectedValue(error404);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      try {
        await service.clearGroupMessages(groupId);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.detail).toBe(errorDetail);
      }
    });
  });

  describe('Error Handling - Server Errors', () => {
    it('should throw error on 500 Internal Server Error', async () => {
      // Arrange
      const groupId = 'group-500';
      const error500 = {
        response: {
          status: 500,
          data: { detail: 'Failed to clear group messages: Database error' },
        },
      };

      mockClient.delete.mockRejectedValue(error500);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.clearGroupMessages(groupId)).rejects.toMatchObject(error500);
    });

    it('should handle 500 error with detailed message', async () => {
      // Arrange
      const groupId = 'error-group';
      const errorMessage = 'Failed to clear group messages: Connection timeout';
      const error500 = {
        response: {
          status: 500,
          data: { detail: errorMessage },
        },
      };

      mockClient.delete.mockRejectedValue(error500);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      try {
        await service.clearGroupMessages(groupId);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(500);
        expect(error.response.data.detail).toContain('Failed to clear group messages');
      }
    });

    it('should throw error on 503 Service Unavailable', async () => {
      // Arrange
      const groupId = 'group-503';
      const error503 = {
        response: {
          status: 503,
          data: { detail: 'Service temporarily unavailable' },
        },
      };

      mockClient.delete.mockRejectedValue(error503);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.clearGroupMessages(groupId)).rejects.toMatchObject(error503);
    });
  });

  describe('Error Handling - Network Failures', () => {
    it('should throw error on network timeout', async () => {
      // Arrange
      const groupId = 'timeout-group';
      const networkError = new Error('Network timeout');
      (networkError as any).code = 'ECONNABORTED';

      mockClient.delete.mockRejectedValue(networkError);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.clearGroupMessages(groupId)).rejects.toThrow('Network timeout');
    });

    it('should throw error on connection refused', async () => {
      // Arrange
      const groupId = 'connection-error-group';
      const connectionError = new Error('Connection refused');
      (connectionError as any).code = 'ECONNREFUSED';

      mockClient.delete.mockRejectedValue(connectionError);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.clearGroupMessages(groupId)).rejects.toThrow('Connection refused');
    });

    it('should throw error on network error without response', async () => {
      // Arrange
      const groupId = 'network-error-group';
      const networkError = {
        message: 'Network Error',
        isAxiosError: true,
        response: undefined, // No response from server
      };

      mockClient.delete.mockRejectedValue(networkError);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.clearGroupMessages(groupId)).rejects.toMatchObject(networkError);
    });

    it('should handle request cancellation', async () => {
      // Arrange
      const groupId = 'cancelled-group';
      const cancelError = new Error('Request cancelled');
      (cancelError as any).code = 'ERR_CANCELED';

      mockClient.delete.mockRejectedValue(cancelError);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      await expect(service.clearGroupMessages(groupId)).rejects.toThrow('Request cancelled');
    });
  });

  describe('Edge Cases', () => {
    it('should handle group ID with special characters', async () => {
      // Arrange
      const groupId = 'group-with-dashes-123-456';
      mockClient.delete.mockResolvedValue({ status: 204, data: '' });

      const service = new (apiService.constructor as any)();

      // Act
      await service.clearGroupMessages(groupId);

      // Assert
      expect(mockClient.delete).toHaveBeenCalledWith(`/groups/${groupId}/messages`);
    });

    it('should handle UUID format group ID', async () => {
      // Arrange
      const groupId = '123e4567-e89b-12d3-a456-426614174000';
      mockClient.delete.mockResolvedValue({ status: 204, data: '' });

      const service = new (apiService.constructor as any)();

      // Act
      await service.clearGroupMessages(groupId);

      // Assert
      expect(mockClient.delete).toHaveBeenCalledWith(`/groups/${groupId}/messages`);
    });

    it('should handle empty string group ID', async () => {
      // Arrange
      const groupId = '';
      mockClient.delete.mockResolvedValue({ status: 204, data: '' });

      const service = new (apiService.constructor as any)();

      // Act
      await service.clearGroupMessages(groupId);

      // Assert
      // Should still make the call (validation is backend's responsibility)
      expect(mockClient.delete).toHaveBeenCalledWith('/groups//messages');
    });

    it('should handle very long group ID', async () => {
      // Arrange
      const groupId = 'a'.repeat(500); // Very long ID
      mockClient.delete.mockResolvedValue({ status: 204, data: '' });

      const service = new (apiService.constructor as any)();

      // Act
      await service.clearGroupMessages(groupId);

      // Assert
      expect(mockClient.delete).toHaveBeenCalledWith(`/groups/${groupId}/messages`);
    });

    it('should handle response with unexpected success status (200 instead of 204)', async () => {
      // Arrange
      const groupId = 'unexpected-200-group';
      mockClient.delete.mockResolvedValue({
        status: 200,
        data: { message: 'Messages cleared' },
      });

      const service = new (apiService.constructor as any)();

      // Act & Assert - Should not throw even with unexpected status
      await expect(service.clearGroupMessages(groupId)).resolves.toBeUndefined();
    });
  });

  describe('Request Validation', () => {
    it('should make exactly one DELETE request', async () => {
      // Arrange
      const groupId = 'single-request-group';
      mockClient.delete.mockResolvedValue({ status: 204, data: '' });

      const service = new (apiService.constructor as any)();

      // Act
      await service.clearGroupMessages(groupId);

      // Assert
      expect(mockClient.delete).toHaveBeenCalledTimes(1);
    });

    it('should not send request body with DELETE', async () => {
      // Arrange
      const groupId = 'no-body-group';
      mockClient.delete.mockResolvedValue({ status: 204, data: '' });

      const service = new (apiService.constructor as any)();

      // Act
      await service.clearGroupMessages(groupId);

      // Assert
      const callArgs = mockClient.delete.mock.calls[0];
      // DELETE should only have path parameter, no body
      expect(callArgs.length).toBe(1);
      expect(callArgs[0]).toBe(`/groups/${groupId}/messages`);
    });

    it('should handle concurrent calls to different groups', async () => {
      // Arrange
      const groupIds = ['group-1', 'group-2', 'group-3'];
      mockClient.delete.mockResolvedValue({ status: 204, data: '' });

      const service = new (apiService.constructor as any)();

      // Act - Call concurrently
      await Promise.all(
        groupIds.map((id) => service.clearGroupMessages(id))
      );

      // Assert
      expect(mockClient.delete).toHaveBeenCalledTimes(3);
      groupIds.forEach((id) => {
        expect(mockClient.delete).toHaveBeenCalledWith(`/groups/${id}/messages`);
      });
    });

    it('should handle sequential calls to same group', async () => {
      // Arrange
      const groupId = 'sequential-group';
      mockClient.delete.mockResolvedValue({ status: 204, data: '' });

      const service = new (apiService.constructor as any)();

      // Act - Call twice sequentially
      await service.clearGroupMessages(groupId);
      await service.clearGroupMessages(groupId);

      // Assert - Both calls should succeed (idempotent)
      expect(mockClient.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe('Type Safety', () => {
    it('should accept string group ID parameter', async () => {
      // Arrange
      const groupId: string = 'typed-group-123';
      mockClient.delete.mockResolvedValue({ status: 204, data: '' });

      const service = new (apiService.constructor as any)();

      // Act & Assert - Should compile and run without type errors
      await expect(service.clearGroupMessages(groupId)).resolves.toBeUndefined();
    });

    it('should return Promise<void>', async () => {
      // Arrange
      const groupId = 'void-return-group';
      mockClient.delete.mockResolvedValue({ status: 204, data: '' });

      const service = new (apiService.constructor as any)();

      // Act
      const result = await service.clearGroupMessages(groupId);

      // Assert - Should be void/undefined
      expect(result).toBeUndefined();
    });
  });

  describe('Error Object Structure', () => {
    it('should preserve axios error structure', async () => {
      // Arrange
      const groupId = 'error-structure-group';
      const axiosError = {
        message: 'Request failed with status code 404',
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { detail: 'Group not found' },
          headers: {},
        },
        config: {},
        isAxiosError: true,
      };

      mockClient.delete.mockRejectedValue(axiosError);

      const service = new (apiService.constructor as any)();

      // Act & Assert
      try {
        await service.clearGroupMessages(groupId);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toHaveProperty('response');
        expect(error).toHaveProperty('isAxiosError');
        expect(error.response).toHaveProperty('status');
        expect(error.response).toHaveProperty('data');
      }
    });
  });
});
