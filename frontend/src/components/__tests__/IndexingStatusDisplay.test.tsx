/**
 * Unit tests for IndexingStatusDisplay component.
 *
 * Test Coverage:
 * - Component rendering with hook data
 * - Display of multiple book progress bars
 * - Loading state handling
 * - Error state handling
 * - Hide when no indexing in progress
 * - Overall status display
 * - Integration with useIndexingStatus hook
 * - Empty state handling
 * - Multiple books indexing simultaneously
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { IndexingStatusDisplay } from '../IndexingStatusDisplay';
import * as useIndexingStatusModule from '../../hooks/useIndexingStatus';
import type { IndexingStatusResponse } from '../../types/indexing';

// Mock the hook
vi.mock('../../hooks/useIndexingStatus');

describe('IndexingStatusDisplay Component', () => {
  const mockUseIndexingStatus = vi.mocked(useIndexingStatusModule.useIndexingStatus);

  beforeEach(() => {
    mockUseIndexingStatus.mockClear();
  });

  describe('No Indexing State', () => {
    it('should not render when no books are being indexed', () => {
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

    it('should not render when overall status is completed and no active books', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'completed',
              progress: 100,
            },
          ],
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
  });

  describe('Loading State', () => {
    it('should show loader when isLoading is true', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: null,
        isIndexing: false,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should not show status when loading', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: null,
        isIndexing: false,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);
      expect(screen.queryByTestId('indexing-status')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error occurs', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: null,
        isIndexing: false,
        isLoading: false,
        error: 'Failed to fetch indexing status',
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);
      expect(screen.getByText(/Failed to fetch indexing status/i)).toBeInTheDocument();
    });

    it('should show error with proper styling', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: null,
        isIndexing: false,
        isLoading: false,
        error: 'Network error',
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);
      const error = screen.getByText(/Network error/i);
      expect(error).toHaveClass('indexing-status-error');
    });

    it('should handle error and isLoading both true', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: null,
        isIndexing: false,
        isLoading: true,
        error: 'Error occurred',
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);
      // Should show loader, not error
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.queryByText(/Error occurred/i)).not.toBeInTheDocument();
    });
  });

  describe('Single Book Indexing', () => {
    it('should display progress bar for a single book being indexed', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'indexing',
              progress: 50,
            },
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
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });

    it('should display book ID or filename for single book', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'indexing',
              progress: 50,
            },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);
      expect(screen.getByText(/book-1/i)).toBeInTheDocument();
    });

    it('should pass correct progress to ProgressBar', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'indexing',
              progress: 75,
            },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });

    it('should pass correct status to ProgressBar', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'indexing',
              progress: 50,
            },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-indexing');
    });
  });

  describe('Multiple Books Indexing', () => {
    it('should display progress bars for multiple books', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'indexing',
              progress: 50,
            },
            {
              book_id: 'book-2',
              status: 'pending',
              progress: 0,
            },
            {
              book_id: 'book-3',
              status: 'indexing',
              progress: 25,
            },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);
      const progressBars = screen.getAllByTestId('progress-bar');
      expect(progressBars).toHaveLength(3);
    });

    it('should display book identifiers for each book', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'indexing',
              progress: 50,
            },
            {
              book_id: 'book-2',
              status: 'pending',
              progress: 0,
            },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);
      expect(screen.getByText(/book-1/i)).toBeInTheDocument();
      expect(screen.getByText(/book-2/i)).toBeInTheDocument();
    });

    it('should handle different statuses for different books', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'completed',
              progress: 100,
            },
            {
              book_id: 'book-2',
              status: 'indexing',
              progress: 50,
            },
            {
              book_id: 'book-3',
              status: 'failed',
              progress: 30,
            },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);
      const progressBars = screen.getAllByTestId('progress-bar');
      expect(progressBars[0]).toHaveClass('progress-bar-completed');
      expect(progressBars[1]).toHaveClass('progress-bar-indexing');
      expect(progressBars[2]).toHaveClass('progress-bar-failed');
    });
  });

  describe('Overall Status Display', () => {
    it('should display overall status message when indexing', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'indexing',
              progress: 50,
            },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);
      expect(screen.getByText(/Indexing books/i)).toBeInTheDocument();
    });

    it('should display count of books being indexed', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'indexing',
              progress: 50,
            },
            {
              book_id: 'book-2',
              status: 'indexing',
              progress: 25,
            },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);
      expect(screen.getByText(/2 book/i)).toBeInTheDocument();
    });

    it('should use singular form for one book', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'indexing',
              progress: 50,
            },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);
      expect(screen.getByText(/1 book/i)).toBeInTheDocument();
    });
  });

  describe('Status Updates', () => {
    it('should update when hook returns new data', async () => {
      const { rerender } = render(<IndexingStatusDisplay characterId="char-1" />);

      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'indexing',
              progress: 30,
            },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      rerender(<IndexingStatusDisplay characterId="char-1" />);
      let progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '30');

      // Progress increases
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'indexing',
              progress: 70,
            },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      rerender(<IndexingStatusDisplay characterId="char-1" />);
      progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '70');
    });

    it('should hide when indexing completes', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'indexing',
              progress: 50,
            },
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

      // Indexing completes
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'completed',
              progress: 100,
            },
          ],
          overall_status: 'completed',
        },
        isIndexing: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      rerender(<IndexingStatusDisplay characterId="char-1" />);
      expect(screen.queryByTestId('indexing-status')).not.toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    it('should pass characterId to useIndexingStatus hook', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: null,
        isIndexing: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="test-char-123" />);
      expect(mockUseIndexingStatus).toHaveBeenCalledWith('test-char-123', 2000, true);
    });

    it('should use default polling interval', () => {
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
      expect(mockUseIndexingStatus).toHaveBeenCalledWith('char-1', 2000, true);
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'indexing',
              progress: 50,
            },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" className="custom-indexing" />);
      const status = screen.getByTestId('indexing-status');
      expect(status).toHaveClass('custom-indexing');
    });

    it('should use custom testId', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'indexing',
              progress: 50,
            },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" testId="my-indexing-status" />);
      expect(screen.getByTestId('my-indexing-status')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty books_indexing array', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [],
          overall_status: 'indexing',
        },
        isIndexing: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);
      expect(screen.queryByTestId('indexing-status')).not.toBeInTheDocument();
    });

    it('should handle books with 0 progress', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'pending',
              progress: 0,
            },
          ],
          overall_status: 'pending',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should handle books with 100 progress', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'completed',
              progress: 100,
            },
          ],
          overall_status: 'indexing',
        },
        isIndexing: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<IndexingStatusDisplay characterId="char-1" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });

    it('should handle very long book IDs', () => {
      const longBookId = 'book-'.repeat(50) + '1';
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: longBookId,
              status: 'indexing',
              progress: 50,
            },
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
  });

  describe('Accessibility', () => {
    it('should have proper aria attributes for status container', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'indexing',
              progress: 50,
            },
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
      expect(status).toHaveAttribute('role', 'status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-busy when indexing', () => {
      mockUseIndexingStatus.mockReturnValue({
        status: {
          books_indexing: [
            {
              book_id: 'book-1',
              status: 'indexing',
              progress: 50,
            },
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
      expect(status).toHaveAttribute('aria-busy', 'true');
    });
  });
});
