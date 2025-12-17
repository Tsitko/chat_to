/**
 * Integration tests for IndexingStatusDisplay + useIndexingStatus + ProgressBar
 *
 * Test Coverage:
 * - Full indexing flow from pending to completed
 * - Progress bar updates with real polling
 * - Error handling across all components
 * - Multiple books being indexed simultaneously
 * - Hook cleanup and component lifecycle
 * - Real-time status updates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { IndexingStatusDisplay } from '../../components/IndexingStatusDisplay';
import { apiService } from '../../services/api';
import type { IndexingStatusResponse } from '../../types/indexing';

// Mock API service
vi.mock('../../services/api', () => ({
  apiService: {
    getIndexingStatus: vi.fn(),
  },
}));

describe('IndexingStatusDisplay + useIndexingStatus + ProgressBar Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Complete Indexing Flow', () => {
    it('should show pending status, then indexing, then completed', async () => {
      const statuses: IndexingStatusResponse[] = [
        {
          books_indexing: [
            { book_id: 'book-1', status: 'pending', progress: 0 },
          ],
          overall_status: 'pending',
        },
        {
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 50 },
          ],
          overall_status: 'indexing',
        },
        {
          books_indexing: [
            { book_id: 'book-1', status: 'completed', progress: 100 },
          ],
          overall_status: 'completed',
        },
      ];

      let callCount = 0;
      vi.mocked(apiService.getIndexingStatus).mockImplementation(async () => {
        return statuses[Math.min(callCount++, statuses.length - 1)];
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      // Initial load - pending
      await waitFor(() => {
        expect(screen.getByTestId('indexing-status')).toBeInTheDocument();
      });

      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-pending');

      // First poll - indexing
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        const progressBar = screen.getByTestId('progress-bar');
        expect(progressBar).toHaveClass('progress-bar-indexing');
      });

      // Second poll - completed (should hide)
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.queryByTestId('indexing-status')).not.toBeInTheDocument();
      });
    });

    it('should update progress bar percentage in real-time', async () => {
      const progressValues = [0, 25, 50, 75, 100];
      let callCount = 0;

      vi.mocked(apiService.getIndexingStatus).mockImplementation(async () => {
        const progress = progressValues[Math.min(callCount++, progressValues.length - 1)];
        return {
          books_indexing: [
            { book_id: 'book-1', status: progress === 100 ? 'completed' : 'indexing', progress },
          ],
          overall_status: progress === 100 ? 'completed' : 'indexing',
        };
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      // Check each progress update
      for (let i = 0; i < progressValues.length - 1; i++) {
        if (i > 0) {
          vi.advanceTimersByTime(2000);
        }

        await waitFor(() => {
          expect(screen.getByText(`${progressValues[i]}%`)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Multiple Books Indexing', () => {
    it('should display progress bars for all books', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 30 },
          { book_id: 'book-2', status: 'indexing', progress: 60 },
          { book_id: 'book-3', status: 'pending', progress: 0 },
        ],
        overall_status: 'indexing',
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        const progressBars = screen.getAllByTestId(/progress-bar/);
        expect(progressBars.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should show different statuses for different books', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'completed', progress: 100 },
          { book_id: 'book-2', status: 'indexing', progress: 50 },
          { book_id: 'book-3', status: 'failed', progress: 25 },
          { book_id: 'book-4', status: 'pending', progress: 0 },
        ],
        overall_status: 'indexing',
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        const progressBars = screen.getAllByTestId(/progress-bar/);
        expect(progressBars.length).toBeGreaterThanOrEqual(4);
      });

      // Check for different status classes
      const bars = screen.getAllByTestId(/progress-bar/);
      expect(bars.some(bar => bar.classList.contains('progress-bar-completed'))).toBe(true);
      expect(bars.some(bar => bar.classList.contains('progress-bar-indexing'))).toBe(true);
      expect(bars.some(bar => bar.classList.contains('progress-bar-failed'))).toBe(true);
      expect(bars.some(bar => bar.classList.contains('progress-bar-pending'))).toBe(true);
    });

    it('should update only changed books', async () => {
      vi.mocked(apiService.getIndexingStatus)
        .mockResolvedValueOnce({
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 30 },
            { book_id: 'book-2', status: 'indexing', progress: 40 },
          ],
          overall_status: 'indexing',
        })
        .mockResolvedValueOnce({
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 60 }, // Updated
            { book_id: 'book-2', status: 'indexing', progress: 40 }, // Unchanged
          ],
          overall_status: 'indexing',
        });

      render(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        expect(screen.getByText('30%')).toBeInTheDocument();
        expect(screen.getByText('40%')).toBeInTheDocument();
      });

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('60%')).toBeInTheDocument();
        expect(screen.getAllByText('40%')).toHaveLength(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message from hook', async () => {
      vi.mocked(apiService.getIndexingStatus).mockRejectedValue(
        new Error('Failed to fetch indexing status')
      );

      render(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      vi.mocked(apiService.getIndexingStatus).mockRejectedValue(
        new Error('Network error')
      );

      render(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should retry and recover from error', async () => {
      vi.mocked(apiService.getIndexingStatus)
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 50 },
          ],
          overall_status: 'indexing',
        });

      render(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        expect(screen.getByText(/first error/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      retryButton.click();

      await waitFor(() => {
        expect(screen.queryByText(/first error/i)).not.toBeInTheDocument();
        expect(screen.getByTestId('indexing-status')).toBeInTheDocument();
      });
    });

    it('should handle failed book status', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'failed', progress: 50 },
        ],
        overall_status: 'failed',
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        const progressBar = screen.getByTestId('progress-bar');
        expect(progressBar).toHaveClass('progress-bar-failed');
        expect(progressBar).toHaveClass('progress-bar-error');
      });
    });
  });

  describe('Polling Behavior', () => {
    it('should poll at 2 second intervals while indexing', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 50 },
        ],
        overall_status: 'indexing',
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      // Initial fetch
      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(1);
      });

      // First poll after 2 seconds
      vi.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(2);
      });

      // Second poll after another 2 seconds
      vi.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(3);
      });
    });

    it('should stop polling when all books completed', async () => {
      vi.mocked(apiService.getIndexingStatus)
        .mockResolvedValueOnce({
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 90 },
          ],
          overall_status: 'indexing',
        })
        .mockResolvedValueOnce({
          books_indexing: [
            { book_id: 'book-1', status: 'completed', progress: 100 },
          ],
          overall_status: 'completed',
        });

      render(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(1);
      });

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(2);
      });

      // Should stop polling after completion
      vi.advanceTimersByTime(10000);
      await vi.runAllTimersAsync();

      expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(2);
    });

    it('should stop polling when component unmounts', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 50 },
        ],
        overall_status: 'indexing',
      });

      const { unmount } = render(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(1);
      });

      unmount();

      vi.advanceTimersByTime(10000);
      await vi.runAllTimersAsync();

      // Should not poll after unmount
      expect(apiService.getIndexingStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Progress Bar Animation', () => {
    it('should animate progress bar during indexing', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 50 },
        ],
        overall_status: 'indexing',
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        const fill = screen.getByTestId('progress-bar-fill');
        expect(fill).toHaveClass('progress-bar-animated');
      });
    });

    it('should not animate when status is pending', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'pending', progress: 0 },
        ],
        overall_status: 'pending',
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        const fill = screen.getByTestId('progress-bar-fill');
        expect(fill).not.toHaveClass('progress-bar-animated');
      });
    });

    it('should not animate when status is completed', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'completed', progress: 100 },
        ],
        overall_status: 'completed',
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      // Component should not render when completed
      await waitFor(() => {
        expect(screen.queryByTestId('indexing-status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible status region', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 50 },
        ],
        overall_status: 'indexing',
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        const status = screen.getByTestId('indexing-status');
        expect(status).toHaveAttribute('role', 'status');
        expect(status).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should have accessible progress bars', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 75 },
        ],
        overall_status: 'indexing',
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        const progressBar = screen.getByTestId('progress-bar');
        expect(progressBar).toHaveAttribute('role', 'progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '75');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty books array', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [],
        overall_status: 'completed',
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        expect(screen.queryByTestId('indexing-status')).not.toBeInTheDocument();
      });
    });

    it('should handle very fast indexing (0 to 100 in one poll)', async () => {
      vi.mocked(apiService.getIndexingStatus)
        .mockResolvedValueOnce({
          books_indexing: [
            { book_id: 'book-1', status: 'pending', progress: 0 },
          ],
          overall_status: 'pending',
        })
        .mockResolvedValueOnce({
          books_indexing: [
            { book_id: 'book-1', status: 'completed', progress: 100 },
          ],
          overall_status: 'completed',
        });

      render(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('indexing-status')).toBeInTheDocument();
      });

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.queryByTestId('indexing-status')).not.toBeInTheDocument();
      });
    });

    it('should handle character change mid-indexing', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 50 },
        ],
        overall_status: 'indexing',
      });

      const { rerender } = render(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('indexing-status')).toBeInTheDocument();
      });

      rerender(<IndexingStatusDisplay characterId="char-2" />);

      await waitFor(() => {
        expect(apiService.getIndexingStatus).toHaveBeenCalledWith('char-2');
      });
    });
  });
});
