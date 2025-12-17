/**
 * Type definitions for loading states across the application.
 *
 * This module defines loading state types and interfaces used
 * for tracking async operations throughout the UI.
 */

/**
 * Generic loading state for async operations
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Loading state with optional error message
 */
export interface LoadingStatus {
  state: LoadingState;
  error?: string;
}

/**
 * Character operation loading states
 * Tracks individual operations on character entities
 */
export interface CharacterLoadingStates {
  fetchAll: LoadingStatus;
  create: LoadingStatus;
  update: LoadingStatus;
  delete: LoadingStatus;
}

/**
 * Message operation loading states
 * Tracks individual operations on message entities
 */
export interface MessageLoadingStates {
  fetch: LoadingStatus;
  send: LoadingStatus;
}

/**
 * Book indexing progress tracking
 * Used for displaying progress bars during book indexing
 */
export interface BookIndexingProgress {
  bookId: string;
  filename: string;
  status: 'pending' | 'indexing' | 'completed' | 'failed';
  progress: number; // 0-100
  error?: string;
}

/**
 * Overall indexing status for a character
 */
export interface CharacterIndexingStatus {
  characterId: string;
  books: BookIndexingProgress[];
  isIndexing: boolean;
  overallProgress: number; // 0-100
}
