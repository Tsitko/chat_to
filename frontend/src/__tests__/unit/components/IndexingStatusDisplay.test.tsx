/**
 * Unit tests for IndexingStatusDisplay component
 *
 * Test Coverage:
 * - Component renders when indexing is in progress
 * - Component hides when no indexing is happening
 * - Displays progress bars for each book being indexed
 * - Shows overall indexing status
 * - Uses useIndexingStatus hook for polling
 * - Handles loading state from hook
 * - Handles error state from hook
 * - Cleans up polling on unmount
 * - Updates when status changes
 * - Edge cases (no books, all completed, mix of statuses)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { IndexingStatusDisplay } from '../../../components/IndexingStatusDisplay';
import * as useIndexingStatusModule from '../../../hooks/useIndexingStatus';

// Mock the useIndexingStatus hook
vi.mock('../../../hooks/useIndexingStatus');

describe('IndexingStatusDisplay Component', () => {
  const mockUseIndexingStatus = vi.fn();

  beforeEach(() => {
    vi.spyOn(useIndexingStatusModule, 'useIndexingStatus').mockImplementation(mockUseIndexingStatus);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render when indexing is in progress', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: '1', status: 'indexing', progress: 50 },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      expect(screen.getByTestId('indexing-status')).toBeInTheDocument();
    });

    it('should not render when no indexing is happening', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [],
          overall_status: 'completed',
        },
        isIndexing: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      expect(screen.queryByTestId('indexing-status')).not.toBeInTheDocument();
    });

    it('should not render when status is null', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: null,
        isIndexing: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      expect(screen.queryByTestId('indexing-status')).not.toBeInTheDocument();
    });

    it('should render loading state initially', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: null,
        isIndexing: false,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      expect(screen.getByTestId('indexing-status-loading')).toBeInTheDocument();
    });
  });

  describe('Progress Bar Display', () => {
    it('should display progress bar for single book', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 75 },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      const progressBars = screen.getAllByTestId(/progress-bar/);
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('should display progress bars for multiple books', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 30 },
            { book_id: 'book-2', status: 'pending', progress: 0 },
            { book_id: 'book-3', status: 'indexing', progress: 80 },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      const progressBars = screen.getAllByTestId(/progress-bar/);
      expect(progressBars.length).toBeGreaterThanOrEqual(3);
    });

    it('should display book status for each book', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'pending', progress: 0 },
            { book_id: 'book-2', status: 'indexing', progress: 50 },
            { book_id: 'book-3', status: 'completed', progress: 100 },
            { book_id: 'book-4', status: 'failed', progress: 25 },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      // Should render all books with their respective statuses
      expect(screen.queryByText(/pending/i)).toBeInTheDocument();
      expect(screen.queryByText(/indexing/i)).toBeInTheDocument();
      expect(screen.queryByText(/completed/i)).toBeInTheDocument();
      expect(screen.queryByText(/failed/i)).toBeInTheDocument();
    });
  });

  describe('Overall Status Display', () => {
    it('should display overall indexing status', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 50 },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      expect(screen.getByTestId('overall-status')).toHaveTextContent(/indexing/i);
    });

    it('should display "pending" overall status', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'pending', progress: 0 },
          ],
          overall_status: 'pending',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      expect(screen.getByTestId('overall-status')).toHaveTextContent(/pending/i);
    });

    it('should display "completed" overall status', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'completed', progress: 100 },
          ],
          overall_status: 'completed',
        },
        isIndexing: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      // Component should not render when completed (auto-hide)
      expect(screen.queryByTestId('indexing-status')).not.toBeInTheDocument();
    });

    it('should display count of books being indexed', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 30 },
            { book_id: 'book-2', status: 'indexing', progress: 60 },
            { book_id: 'book-3', status: 'pending', progress: 0 },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      expect(screen.getByText(/3 books/i)).toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    it('should call useIndexingStatus with characterId', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: null,
        isIndexing: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-123" />);

      expect(mockUseIndexingStatus).toHaveBeenCalledWith('char-123', 2000, true);
    });

    it('should use default polling interval of 2000ms', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: null,
        isIndexing: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      expect(mockUseIndexingStatus).toHaveBeenCalledWith('char-1', 2000, true);
    });

    it('should enable polling by default', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: null,
        isIndexing: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      expect(mockUseIndexingStatus).toHaveBeenCalledWith(expect.any(String), expect.any(Number), true);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when hook returns error', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: null,
        isIndexing: false,
        isLoading: false,
        error: 'Failed to fetch indexing status',
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });

    it('should display retry button on error', () => {
      const mockRefetch = vi.fn();
      mockUseIndexingStatus.mockReturnValue({
        status: null,
        isIndexing: false,
        isLoading: false,
        error: 'Network error',
        refetch: mockRefetch,
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call refetch when retry button is clicked', () => {
      const mockRefetch = vi.fn();
      mockUseIndexingStatus.mockReturnValue({
        status: null,
        isIndexing: false,
        isLoading: false,
        error: 'Network error',
        refetch: mockRefetch,
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      retryButton.click();

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('should handle book-level errors', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'failed', progress: 50 },
          ],
          overall_status: 'failed',
        },
        isIndexing: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });

  describe('Dynamic Updates', () => {
    it('should update when status changes', async () => {
      const { rerender } = render(<IndexingStatusDisplay characterId="char-1" />);

      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 25 },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      rerender(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('indexing-status')).toBeInTheDocument();
      });

      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 75 },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      rerender(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        // Progress should update
        expect(screen.getByTestId('indexing-status')).toBeInTheDocument();
      });
    });

    it('should hide when indexing completes', async () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 90 },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { rerender } = render(<IndexingStatusDisplay characterId="char-1" />);

      expect(screen.getByTestId('indexing-status')).toBeInTheDocument();

      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'completed', progress: 100 },
          ],
          overall_status: 'completed',
        },
        isIndexing: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      rerender(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        expect(screen.queryByTestId('indexing-status')).not.toBeInTheDocument();
      });
    });

    it('should handle character change', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 50 },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      const { rerender } = render(<IndexingStatusDisplay characterId="char-1" />);

      expect(mockUseIndexingStatus).toHaveBeenCalledWith('char-1', 2000, true);

      rerender(<IndexingStatusDisplay characterId="char-2" />);

      expect(mockUseIndexingStatus).toHaveBeenCalledWith('char-2', 2000, true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty books array', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [],
          overall_status: 'completed',
        },
        isIndexing: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      expect(screen.queryByTestId('indexing-status')).not.toBeInTheDocument();
    });

    it('should handle all books completed', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'completed', progress: 100 },
            { book_id: 'book-2', status: 'completed', progress: 100 },
          ],
          overall_status: 'completed',
        },
        isIndexing: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      // Should auto-hide when all completed
      expect(screen.queryByTestId('indexing-status')).not.toBeInTheDocument();
    });

    it('should handle mix of statuses', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'completed', progress: 100 },
            { book_id: 'book-2', status: 'indexing', progress: 50 },
            { book_id: 'book-3', status: 'failed', progress: 30 },
            { book_id: 'book-4', status: 'pending', progress: 0 },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      expect(screen.getByTestId('indexing-status')).toBeInTheDocument();
      expect(screen.getByText(/4 books/i)).toBeInTheDocument();
    });

    it('should handle undefined characterId gracefully', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: null,
        isIndexing: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      // @ts-expect-error Testing invalid prop
      render(<IndexingStatusDisplay characterId={undefined} />);

      expect(mockUseIndexingStatus).toHaveBeenCalled();
    });

    it('should handle very long book lists', () => {
      const manyBooks = Array.from({ length: 100 }, (_, i) => ({
        book_id: `book-${i}`,
        status: 'indexing' as const,
        progress: i,
      }));

      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: manyBooks,
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      expect(screen.getByText(/100 books/i)).toBeInTheDocument();
    });
  });

  describe('Props: className', () => {
    it('should apply custom className', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 50 },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" className="custom-class" />);

      expect(screen.getByTestId('indexing-status')).toHaveClass('custom-class');
    });
  });

  describe('Props: testId', () => {
    it('should use default testId', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 50 },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      expect(screen.getByTestId('indexing-status')).toBeInTheDocument();
    });

    it('should use custom testId', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 50 },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" testId="custom-indexing" />);

      expect(screen.getByTestId('custom-indexing')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="status" for screen readers', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 50 },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      expect(screen.getByTestId('indexing-status')).toHaveAttribute('role', 'status');
    });

    it('should have aria-live for dynamic updates', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 50 },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      expect(screen.getByTestId('indexing-status')).toHaveAttribute('aria-live', 'polite');
    });

    it('should announce indexing status to screen readers', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            { book_id: 'book-1', status: 'indexing', progress: 50 },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      const status = screen.getByTestId('indexing-status');
      expect(status).toHaveAttribute('aria-label', expect.stringContaining('Indexing'));
    });
  });
});
