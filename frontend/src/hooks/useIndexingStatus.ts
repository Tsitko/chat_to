/**
 * Custom hook for polling book indexing status.
 *
 * This hook periodically fetches the indexing status for a character's books
 * and provides the current status, progress, and helper methods.
 *
 * @example
 * const { status, isIndexing, progress, error, refetch } = useIndexingStatus(characterId);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import type { IndexingStatusResponse } from '../types/indexing';

export interface UseIndexingStatusOptions {
  characterId: string;
  pollingInterval?: number; // milliseconds, default 2000
  enabled?: boolean; // whether to enable polling, default true
}

export interface UseIndexingStatusReturn {
  status: IndexingStatusResponse | null;
  isIndexing: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for polling indexing status of character books
 *
 * @param characterId - ID of character to monitor
 * @param pollingInterval - How often to poll in ms (default: 2000)
 * @param enabled - Whether polling is enabled (default: true)
 * @returns Object containing status, loading state, and refetch function
 */
export const useIndexingStatus = (
  characterId: string,
  pollingInterval = 2000,
  enabled = true
): UseIndexingStatusReturn => {
  const [status, setStatus] = useState<IndexingStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Determine if indexing is in progress
  const isIndexing = status
    ? status.overall_status === 'indexing' || status.overall_status === 'pending'
    : false;

  // Fetch status function
  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getIndexingStatus(characterId);
      setStatus(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch indexing status';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [characterId]);

  // Refetch function for manual refresh
  const refetch = useCallback(async () => {
    await fetchStatus();
  }, [fetchStatus]);

  // Set up polling
  useEffect(() => {
    if (!enabled) {
      // Clear interval if disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchStatus();

    // Set up interval only if indexing
    if (status && (status.overall_status === 'indexing' || status.overall_status === 'pending')) {
      intervalRef.current = setInterval(fetchStatus, pollingInterval);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, characterId, pollingInterval, fetchStatus, status?.overall_status]);

  // Stop polling when all books are completed or failed
  useEffect(() => {
    if (status && status.overall_status !== 'indexing' && status.overall_status !== 'pending') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [status]);

  return {
    status,
    isIndexing,
    isLoading,
    error,
    refetch,
  };
};
