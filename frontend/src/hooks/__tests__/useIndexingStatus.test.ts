/**
 * Unit tests for useIndexingStatus hook.
 *
 * Test Coverage:
 * - Initial state
 * - Successful data fetching
 * - Polling behavior
 * - Stop polling when completed
 * - Stop polling when failed
 * - Error handling
 * - Cleanup on unmount
 * - Manual refetch
 * - Enabled/disabled state
 * - Custom polling interval
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useIndexingStatus } from '../useIndexingStatus';
import { apiService } from '../../services/api';
import type { IndexingStatusResponse } from '../../types/indexing';

// Mock API service
vi.mock('../../services/api', () => ({
  apiService: {
    getIndexingStatus: vi.fn(),
  },
}));

describe('useIndexingStatus Hook', () => {
  const mockApiService = vi.mocked(apiService);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should return initial state with null status', () => {
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      expect(result.current.status).toBeNull();
      expect(result.current.isIndexing).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.refetch).toBeInstanceOf(Function);
    });

    it('should start loading immediately', async () => {
      mockApiService.getIndexingStatus.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  books_indexing: [],
                  overall_status: 'completed',
                }),
              100
            )
          )
      );

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Successful Data Fetching', () => {
    it('should fetch and set status data', async () => {
      const mockStatus: IndexingStatusResponse = {
        books_indexing: [
          {
            book_id: 'book-1',
            status: 'indexing',
            progress: 50,
          },
        ],
        overall_status: 'indexing',
      };

      mockApiService.getIndexingStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.status).toEqual(mockStatus);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockApiService.getIndexingStatus).toHaveBeenCalledWith('char-1');
    });

    it('should set isIndexing to true when books are being indexed', async () => {
      const mockStatus: IndexingStatusResponse = {
        books_indexing: [
          {
            book_id: 'book-1',
            status: 'indexing',
            progress: 50,
          },
        ],
        overall_status: 'indexing',
      };

      mockApiService.getIndexingStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.isIndexing).toBe(true);
      });
    });

    it('should set isIndexing to false when all books are completed', async () => {
      const mockStatus: IndexingStatusResponse = {
        books_indexing: [
          {
            book_id: 'book-1',
            status: 'completed',
            progress: 100,
          },
        ],
        overall_status: 'completed',
      };

      mockApiService.getIndexingStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.isIndexing).toBe(false);
      });
    });

    it('should update status on subsequent fetches', async () => {
      const mockStatus1: IndexingStatusResponse = {
        books_indexing: [
          {
            book_id: 'book-1',
            status: 'indexing',
            progress: 30,
          },
        ],
        overall_status: 'indexing',
      };

      const mockStatus2: IndexingStatusResponse = {
        books_indexing: [
          {
            book_id: 'book-1',
            status: 'indexing',
            progress: 70,
          },
        ],
        overall_status: 'indexing',
      };

      mockApiService.getIndexingStatus.mockResolvedValueOnce(mockStatus1);

      const { result } = renderHook(() => useIndexingStatus('char-1', 1000));

      await waitFor(() => {
        expect(result.current.status).toEqual(mockStatus1);
      });

      // Setup next fetch
      mockApiService.getIndexingStatus.mockResolvedValueOnce(mockStatus2);

      // Advance timer to trigger polling
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.status).toEqual(mockStatus2);
      });
    });
  });

  describe('Polling Behavior', () => {
    it('should poll at default interval (2000ms)', async () => {
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [
          {
            book_id: 'book-1',
            status: 'indexing',
            progress: 50,
          },
        ],
        overall_status: 'indexing',
      });

      renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(mockApiService.getIndexingStatus).toHaveBeenCalledTimes(1);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockApiService.getIndexingStatus).toHaveBeenCalledTimes(2);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockApiService.getIndexingStatus).toHaveBeenCalledTimes(3);
      });
    });

    it('should poll at custom interval', async () => {
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [
          {
            book_id: 'book-1',
            status: 'indexing',
            progress: 50,
          },
        ],
        overall_status: 'indexing',
      });

      renderHook(() => useIndexingStatus('char-1', 5000));

      await waitFor(() => {
        expect(mockApiService.getIndexingStatus).toHaveBeenCalledTimes(1);
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(mockApiService.getIndexingStatus).toHaveBeenCalledTimes(2);
      });
    });

    it('should stop polling when all books are completed', async () => {
      let callCount = 0;
      mockApiService.getIndexingStatus.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            books_indexing: [{ book_id: 'book-1', status: 'indexing', progress: 50 }],
            overall_status: 'indexing',
          });
        }
        return Promise.resolve({
          books_indexing: [{ book_id: 'book-1', status: 'completed', progress: 100 }],
          overall_status: 'completed',
        });
      });

      const { result } = renderHook(() => useIndexingStatus('char-1', 1000));

      // First fetch
      await waitFor(() => {
        expect(result.current.isIndexing).toBe(true);
      });

      // Second fetch - completed
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.isIndexing).toBe(false);
      });

      const callCountBeforeExtraTime = mockApiService.getIndexingStatus.mock.calls.length;

      // Should not poll anymore
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockApiService.getIndexingStatus.mock.calls.length).toBe(callCountBeforeExtraTime);
    });

    it('should stop polling when a book fails', async () => {
      let callCount = 0;
      mockApiService.getIndexingStatus.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            books_indexing: [{ book_id: 'book-1', status: 'indexing', progress: 50 }],
            overall_status: 'indexing',
          });
        }
        return Promise.resolve({
          books_indexing: [{ book_id: 'book-1', status: 'failed', progress: 50 }],
          overall_status: 'failed',
        });
      });

      const { result } = renderHook(() => useIndexingStatus('char-1', 1000));

      await waitFor(() => {
        expect(result.current.isIndexing).toBe(true);
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.isIndexing).toBe(false);
      });

      const callCountBeforeExtraTime = mockApiService.getIndexingStatus.mock.calls.length;

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockApiService.getIndexingStatus.mock.calls.length).toBe(callCountBeforeExtraTime);
    });

    it('should continue polling when at least one book is still indexing', async () => {
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'completed', progress: 100 },
          { book_id: 'book-2', status: 'indexing', progress: 50 },
        ],
        overall_status: 'indexing',
      });

      renderHook(() => useIndexingStatus('char-1', 1000));

      await waitFor(() => {
        expect(mockApiService.getIndexingStatus).toHaveBeenCalledTimes(1);
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockApiService.getIndexingStatus).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should set error when API call fails', async () => {
      mockApiService.getIndexingStatus.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.status).toBeNull();
    });

    it('should handle error with custom message', async () => {
      mockApiService.getIndexingStatus.mockRejectedValue(new Error('Failed to fetch'));

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch');
      });
    });

    it('should continue polling after error', async () => {
      let callCount = 0;
      mockApiService.getIndexingStatus.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve({
          books_indexing: [{ book_id: 'book-1', status: 'indexing', progress: 50 }],
          overall_status: 'indexing',
        });
      });

      const { result } = renderHook(() => useIndexingStatus('char-1', 1000));

      await waitFor(() => {
        expect(result.current.error).toBe('Temporary error');
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.status).not.toBeNull();
      });
    });

    it('should handle error without message', async () => {
      mockApiService.getIndexingStatus.mockRejectedValue({});

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.error).toBe('Unknown error');
      });
    });
  });

  describe('Cleanup', () => {
    it('should clear interval on unmount', async () => {
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [{ book_id: 'book-1', status: 'indexing', progress: 50 }],
        overall_status: 'indexing',
      });

      const { unmount } = renderHook(() => useIndexingStatus('char-1', 1000));

      await waitFor(() => {
        expect(mockApiService.getIndexingStatus).toHaveBeenCalledTimes(1);
      });

      unmount();

      const callCountBeforeUnmount = mockApiService.getIndexingStatus.mock.calls.length;

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockApiService.getIndexingStatus.mock.calls.length).toBe(callCountBeforeUnmount);
    });

    it('should not fetch after unmount', async () => {
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      const { unmount } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(mockApiService.getIndexingStatus).toHaveBeenCalled();
      });

      const callCount = mockApiService.getIndexingStatus.mock.calls.length;
      unmount();

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockApiService.getIndexingStatus.mock.calls.length).toBe(callCount);
    });
  });

  describe('Manual Refetch', () => {
    it('should provide refetch function', async () => {
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.refetch).toBeInstanceOf(Function);
      });
    });

    it('should refetch when refetch is called', async () => {
      const mockStatus1: IndexingStatusResponse = {
        books_indexing: [{ book_id: 'book-1', status: 'indexing', progress: 30 }],
        overall_status: 'indexing',
      };

      const mockStatus2: IndexingStatusResponse = {
        books_indexing: [{ book_id: 'book-1', status: 'indexing', progress: 80 }],
        overall_status: 'indexing',
      };

      mockApiService.getIndexingStatus.mockResolvedValueOnce(mockStatus1);

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.status).toEqual(mockStatus1);
      });

      mockApiService.getIndexingStatus.mockResolvedValueOnce(mockStatus2);

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.status).toEqual(mockStatus2);
    });

    it('should handle errors in manual refetch', async () => {
      mockApiService.getIndexingStatus.mockResolvedValueOnce({
        books_indexing: [],
        overall_status: 'completed',
      });

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.status).not.toBeNull();
      });

      mockApiService.getIndexingStatus.mockRejectedValueOnce(new Error('Refetch error'));

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBe('Refetch error');
    });
  });

  describe('Enabled/Disabled State', () => {
    it('should not fetch when enabled is false', async () => {
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      renderHook(() => useIndexingStatus('char-1', 2000, false));

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockApiService.getIndexingStatus).not.toHaveBeenCalled();
    });

    it('should fetch when enabled is true', async () => {
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      renderHook(() => useIndexingStatus('char-1', 2000, true));

      await waitFor(() => {
        expect(mockApiService.getIndexingStatus).toHaveBeenCalled();
      });
    });

    it('should start fetching when enabled changes from false to true', async () => {
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      const { rerender } = renderHook(
        ({ enabled }) => useIndexingStatus('char-1', 2000, enabled),
        {
          initialProps: { enabled: false },
        }
      );

      expect(mockApiService.getIndexingStatus).not.toHaveBeenCalled();

      rerender({ enabled: true });

      await waitFor(() => {
        expect(mockApiService.getIndexingStatus).toHaveBeenCalled();
      });
    });

    it('should stop fetching when enabled changes from true to false', async () => {
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [{ book_id: 'book-1', status: 'indexing', progress: 50 }],
        overall_status: 'indexing',
      });

      const { rerender } = renderHook(
        ({ enabled }) => useIndexingStatus('char-1', 1000, enabled),
        {
          initialProps: { enabled: true },
        }
      );

      await waitFor(() => {
        expect(mockApiService.getIndexingStatus).toHaveBeenCalledTimes(1);
      });

      rerender({ enabled: false });

      const callCount = mockApiService.getIndexingStatus.mock.calls.length;

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockApiService.getIndexingStatus.mock.calls.length).toBe(callCount);
    });
  });

  describe('Character ID Changes', () => {
    it('should fetch new status when characterId changes', async () => {
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      const { rerender } = renderHook(({ id }) => useIndexingStatus(id), {
        initialProps: { id: 'char-1' },
      });

      await waitFor(() => {
        expect(mockApiService.getIndexingStatus).toHaveBeenCalledWith('char-1');
      });

      rerender({ id: 'char-2' });

      await waitFor(() => {
        expect(mockApiService.getIndexingStatus).toHaveBeenCalledWith('char-2');
      });
    });

    it('should reset state when characterId changes', async () => {
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [{ book_id: 'book-1', status: 'indexing', progress: 50 }],
        overall_status: 'indexing',
      });

      const { result, rerender } = renderHook(({ id }) => useIndexingStatus(id), {
        initialProps: { id: 'char-1' },
      });

      await waitFor(() => {
        expect(result.current.status).not.toBeNull();
      });

      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      rerender({ id: 'char-2' });

      await waitFor(() => {
        expect(result.current.status?.overall_status).toBe('completed');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty books_indexing array', async () => {
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.isIndexing).toBe(false);
      });
    });

    it('should handle null response gracefully', async () => {
      mockApiService.getIndexingStatus.mockResolvedValue(null as any);

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.status).toBeNull();
      });
    });

    it('should handle very short polling interval', async () => {
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [{ book_id: 'book-1', status: 'indexing', progress: 50 }],
        overall_status: 'indexing',
      });

      renderHook(() => useIndexingStatus('char-1', 100));

      await waitFor(() => {
        expect(mockApiService.getIndexingStatus).toHaveBeenCalledTimes(1);
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(mockApiService.getIndexingStatus).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle very long polling interval', async () => {
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [{ book_id: 'book-1', status: 'indexing', progress: 50 }],
        overall_status: 'indexing',
      });

      renderHook(() => useIndexingStatus('char-1', 60000));

      await waitFor(() => {
        expect(mockApiService.getIndexingStatus).toHaveBeenCalledTimes(1);
      });

      act(() => {
        vi.advanceTimersByTime(30000);
      });

      // Should not have polled yet
      expect(mockApiService.getIndexingStatus).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockApiService.getIndexingStatus).toHaveBeenCalledTimes(2);
      });
    });
  });
});
