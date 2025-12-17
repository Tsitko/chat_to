/**
 * Type definitions for Indexing status data structures.
 */

export type IndexingStatus = 'pending' | 'indexing' | 'completed' | 'failed';

export interface BookIndexingStatus {
  book_id: string;
  status: IndexingStatus;
  progress: number;
}

export interface IndexingStatusResponse {
  books_indexing: BookIndexingStatus[];
  overall_status: IndexingStatus;
}
