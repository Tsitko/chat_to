/**
 * Unit tests for useIndexingStatus hook
 *
 * Test Coverage:
 * - Initial state (loading, no status)
 * - Successful status fetch
 * - Error handling on fetch
 * - Polling behavior (automatic at specified interval)
 * - Polling stops when all books completed/failed
 * - Polling cleanup on unmount
 * - Manual refetch function
 * - Enabled/disabled state
 * - Character ID changes
 * - Edge cases (network errors, rapid character switches, malformed data)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useIndexingStatus } from '../../../hooks/useIndexingStatus';
import { apiService } from '../../../services/api';

// Mock the API service
vi.mock('../../../services/api', () => ({
  apiService: {
    getIndexingStatus: vi.fn(),
  },
}));

describe('useIndexingStatus Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should return initial state with loading=true', () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      expect(result.current.status).toBeNull();
      expect(result.current.isIndexing).toBe(false);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should provide refetch function', () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      expect(result.current.refetch).toBeInstanceOf(Function);
    });
  });

  describe('Successful Fetch', () => {
    it('should fetch status on mount', async () => {
      const mockStatus = {
        books_indexing: [
          { book_id: 'book-1', status: 'indexing' as const, progress: 50 },
        ],
        overall_status: 'indexing' as const,
      };

      vi.mocked(apiService.getIndexingStatus).mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.status).toEqual(mockStatus);
      expect(result.current.isIndexing).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should call API with correct character ID', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      renderHook(() => useIndexingStatus('char-123'));

      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledWith('char-123');
      });
    });

    it('should set isIndexing=true when books are being indexed', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 30 },
        ],
        overall_status: 'indexing',
      });

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.isIndexing).toBe(true);
      });
    });

    it('should set isIndexing=false when no books are indexing', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'completed', progress: 100 },
        ],
        overall_status: 'completed',
      });

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.isIndexing).toBe(false);
      });
    });

    it('should set isIndexing=true for pending status', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'pending', progress: 0 },
        ],
        overall_status: 'pending',
      });

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.isIndexing).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const error = new Error('Network error');
      vi.mocked(apiService.getIndexingStatus).mockRejectedValue(error);

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      expect(result.current.status).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle error without message', async () => {
      vi.mocked(apiService.getIndexingStatus).mockRejectedValue(new Error());

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch indexing status');
      });
    });

    it('should handle non-Error rejections', async () => {
      vi.mocked(apiService.getIndexingStatus).mockRejectedValue('String error');

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should clear error on successful refetch', async () => {
      vi.mocked(apiService.getIndexingStatus).mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.status).not.toBeNull();
      });
    });
  });

  describe('Polling Behavior', () => {
    it('should poll at default interval of 2000ms', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 50 },
        ],
        overall_status: 'indexing',
      });

      renderHook(() => useIndexingStatus('char-1'));

      // Initial call
      expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(1);

      // Advance time by 2 seconds
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(2);
      });

      // Advance another 2 seconds
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(3);
      });
    });

    it('should poll at custom interval', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 50 },
        ],
        overall_status: 'indexing',
      });

      renderHook(() => useIndexingStatus('char-1', 5000));

      expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(1);

      // Advance by custom interval
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(2);
      });
    });

    it('should stop polling when all books are completed', async () => {
      let callCount = 0;
      vi.mocked(apiService.getIndexingStatus).mockImplementation(async () => {
        callCount++;
        if (callCount <= 2) {
          return {
            books_indexing: [
              { book_id: 'book-1', status: 'indexing', progress: 50 * callCount },
            ],
            overall_status: 'indexing',
          };
        }
        return {
          books_indexing: [
            { book_id: 'book-1', status: 'completed', progress: 100 },
          ],
          overall_status: 'completed',
        };
      });

      renderHook(() => useIndexingStatus('char-1', 1000));

      // Initial call
      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(1);
      });

      // First poll
      vi.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(2);
      });

      // Second poll - returns completed
      vi.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(3);
      });

      // Should stop polling now
      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();

      expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(3);
    });

    it('should stop polling when all books are failed', async () => {
      let callCount = 0;
      vi.mocked(apiService.getIndexingStatus).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            books_indexing: [
              { book_id: 'book-1', status: 'indexing', progress: 50 },
            ],
            overall_status: 'indexing',
          };
        }
        return {
          books_indexing: [
            { book_id: 'book-1', status: 'failed', progress: 50 },
          ],
          overall_status: 'failed',
        };
      });

      renderHook(() => useIndexingStatus('char-1', 1000));

      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(1);
      });

      vi.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(2);
      });

      // Should stop after failed status
      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();

      expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(2);
    });

    it('should continue polling if at least one book is indexing', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'completed', progress: 100 },
          { book_id: 'book-2', status: 'indexing', progress: 50 },
          { book_id: 'book-3', status: 'failed', progress: 30 },
        ],
        overall_status: 'indexing',
      });

      renderHook(() => useIndexingStatus('char-1', 1000));

      expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(2);
      });

      vi.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup polling interval on unmount', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 50 },
        ],
        overall_status: 'indexing',
      });

      const { unmount } = renderHook(() => useIndexingStatus('char-1', 1000));

      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(1);
      });

      unmount();

      // After unmount, polling should stop
      vi.advanceTimersByTime(5000);
      await vi.runAllTimersAsync();

      expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(1);
    });

    it('should not fetch after unmount', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      const { unmount } = renderHook(() => useIndexingStatus('char-1'));

      unmount();

      vi.advanceTimersByTime(10000);
      await vi.runAllTimersAsync();

      // Only initial fetch, no polling after unmount
      expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Manual Refetch', () => {
    it('should refetch status when refetch is called', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 50 },
        ],
        overall_status: 'indexing',
      });

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(1);

      // Manually refetch
      await result.current.refetch();

      expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(2);
    });

    it('should update status after manual refetch', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValueOnce({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 30 },
        ],
        overall_status: 'indexing',
      });

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.status?.books_indexing[0].progress).toBe(30);
      });

      vi.mocked(apiService.getIndexingStatus).mockResolvedValueOnce({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 80 },
        ],
        overall_status: 'indexing',
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.status?.books_indexing[0].progress).toBe(80);
      });
    });

    it('should handle refetch errors', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValueOnce({
        books_indexing: [],
        overall_status: 'completed',
      });

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });

      vi.mocked(apiService.getIndexingStatus).mockRejectedValueOnce(new Error('Refetch error'));

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBe('Refetch error');
      });
    });
  });

  describe('Enabled/Disabled State', () => {
    it('should not fetch when enabled=false', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      renderHook(() => useIndexingStatus('char-1', 2000, false));

      await vi.runAllTimersAsync();

      expect(apiService.getIndexingStatus).not.toHaveBeenCalled();
    });

    it('should not poll when enabled=false', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      renderHook(() => useIndexingStatus('char-1', 1000, false));

      vi.advanceTimersByTime(10000);
      await vi.runAllTimersAsync();

      expect(apiService.getIndexingStatus).not.toHaveBeenCalled();
    });

    it('should fetch when enabled changes from false to true', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      const { rerender } = renderHook(
        ({ enabled }) => useIndexingStatus('char-1', 2000, enabled),
        { initialProps: { enabled: false } }
      );

      expect(apiService.getIndexingStatus).not.toHaveBeenCalled();

      rerender({ enabled: true });

      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(1);
      });
    });

    it('should stop polling when enabled changes from true to false', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 50 },
        ],
        overall_status: 'indexing',
      });

      const { rerender } = renderHook(
        ({ enabled }) => useIndexingStatus('char-1', 1000, enabled),
        { initialProps: { enabled: true } }
      );

      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(1);
      });

      rerender({ enabled: false });

      vi.advanceTimersByTime(5000);
      await vi.runAllTimersAsync();

      // Should not poll after disabled
      expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Character ID Changes', () => {
    it('should refetch when characterId changes', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      const { rerender } = renderHook(
        ({ charId }) => useIndexingStatus(charId),
        { initialProps: { charId: 'char-1' } }
      );

      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledWith('char-1');
      });

      rerender({ charId: 'char-2' });

      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledWith('char-2');
      });
    });

    it('should reset polling when characterId changes', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 50 },
        ],
        overall_status: 'indexing',
      });

      const { rerender } = renderHook(
        ({ charId }) => useIndexingStatus(charId, 1000),
        { initialProps: { charId: 'char-1' } }
      );

      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(1);
      });

      vi.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(2);
      });

      // Change character
      rerender({ charId: 'char-2' });

      // Should reset and fetch immediately for new character
      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledWith('char-2');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty books_indexing array', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.isIndexing).toBe(false);
        expect(result.current.status?.books_indexing).toHaveLength(0);
      });
    });

    it('should handle rapid refetch calls', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call refetch multiple times rapidly
      await Promise.all([
        result.current.refetch(),
        result.current.refetch(),
        result.current.refetch(),
      ]);

      // Should handle gracefully
      expect(result.current.error).toBeNull();
    });

    it('should handle very short polling intervals', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 50 },
        ],
        overall_status: 'indexing',
      });

      renderHook(() => useIndexingStatus('char-1', 100));

      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(1);
      });

      vi.advanceTimersByTime(100);
      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle malformed API response', async () => {
      // @ts-expect-error Testing malformed response
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: null,
        overall_status: undefined,
      });

      const { result } = renderHook(() => useIndexingStatus('char-1'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should handle gracefully without crashing
      expect(result.current.status).toBeTruthy();
    });
  });
});
