/**
 * IndexingStatusDisplay component - shows indexing progress for character books.
 *
 * This component displays the indexing status of all books for a character,
 * showing individual progress bars for each book being indexed.
 *
 * @example
 * <IndexingStatusDisplay characterId={character.id} />
 */

import React from 'react';
import { ProgressBar } from './ProgressBar';
import { useIndexingStatus } from '../hooks/useIndexingStatus';

export interface IndexingStatusDisplayProps {
  characterId: string;
  className?: string;
  testId?: string;
}

/**
 * Component for displaying book indexing status
 *
 * @param characterId - ID of the character whose books are being indexed
 * @param className - Additional CSS classes
 * @param testId - Test identifier
 */
export const IndexingStatusDisplay: React.FC<IndexingStatusDisplayProps> = ({
  characterId,
  className = '',
  testId = 'indexing-status',
}) => {
  const { status, isIndexing, isLoading, error } = useIndexingStatus(characterId, 2000, true);

  // Don't render if no status or not indexing
  if (!status || (!isIndexing && !isLoading)) {
    return null;
  }

  // Don't render if no books are being indexed
  if (status.books_indexing.length === 0) {
    return null;
  }

  return (
    <div className={`indexing-status ${className}`} data-testid={testId}>
      <div className="indexing-status-header" data-testid={`${testId}-header`}>
        <h4>Book Indexing Progress</h4>
        <span className="indexing-status-badge" data-testid={`${testId}-badge`}>
          {status.overall_status}
        </span>
      </div>

      {error && (
        <div className="indexing-status-error" data-testid={`${testId}-error`}>
          {error}
        </div>
      )}

      <div className="indexing-status-books" data-testid={`${testId}-books`}>
        {status.books_indexing.map((book) => (
          <ProgressBar
            key={book.book_id}
            progress={book.progress}
            status={book.status}
            label={`Book ${book.book_id}`}
            showPercentage={true}
            testId={`${testId}-book-${book.book_id}`}
          />
        ))}
      </div>
    </div>
  );
};
