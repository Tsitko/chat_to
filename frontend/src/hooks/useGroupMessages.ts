/**
 * useGroupMessages - React hook for managing group message lifecycle.
 *
 * Responsibilities:
 * - Load message history from backend when group is selected
 * - Merge loaded messages with new messages in the store
 * - Prevent duplicate messages (track persisted vs in-memory)
 * - Handle loading states and errors
 * - Provide pagination support for large message histories
 *
 * This hook acts as a bridge between GroupChatWindow and GroupMessageStore,
 * providing a clean interface for message management.
 */

import { useEffect, useState, useCallback } from 'react';
import { useGroupMessageStoreEnhanced } from '../store/groupMessageStoreEnhanced';

/**
 * Configuration for message loading behavior.
 */
export interface UseGroupMessagesOptions {
  /**
   * Number of messages to load per page.
   * Default: 50
   */
  pageSize?: number;

  /**
   * Whether to automatically load messages when groupId changes.
   * Default: true
   */
  autoLoad?: boolean;

  /**
   * Whether to load all messages at once or support pagination.
   * Default: false (load all)
   */
  enablePagination?: boolean;
}

/**
 * Return type for useGroupMessages hook.
 */
export interface UseGroupMessagesReturn {
  /**
   * Array of messages for the current group.
   * Sorted chronologically (oldest to newest).
   */
  messages: any[]; // TODO: Replace with proper GroupMessage type

  /**
   * Loading state for initial message fetch.
   */
  isLoadingMessages: boolean;

  /**
   * Loading state for sending new messages.
   */
  isSending: boolean;

  /**
   * Error state for message operations.
   */
  error: string | null;

  /**
   * Whether there are more messages to load.
   */
  hasMore: boolean;

  /**
   * Load next page of messages (if pagination enabled).
   */
  loadMore: () => Promise<void>;

  /**
   * Reload all messages from backend.
   * Useful for refreshing after external changes.
   */
  reloadMessages: () => Promise<void>;

  /**
   * Clear all messages for current group from store.
   */
  clearMessages: () => void;
}

/**
 * Custom hook for managing group messages with persistence.
 *
 * @param groupId - ID of the group to manage messages for
 * @param options - Configuration options
 * @returns Object with messages, loading states, and control functions
 */
export const useGroupMessages = (
  groupId: string | null,
  options: UseGroupMessagesOptions = {}
): UseGroupMessagesReturn => {
  const {
    pageSize = 50,
    autoLoad = true,
    enablePagination = false,
  } = options;

  const {
    messages: allMessages,
    fetchGroupMessages,
    clearGroupMessages,
    isLoading,
    isSending: sendingState,
    error: errorState,
  } = useGroupMessageStoreEnhanced();

  const [hasMore, setHasMore] = useState<boolean>(false);
  const [currentOffset, setCurrentOffset] = useState<number>(0);

  const messages = groupId ? allMessages[groupId] || [] : [];
  const isLoadingMessages = groupId ? isLoading[groupId] || false : false;
  const isSending = groupId ? sendingState[groupId] || false : false;
  const error = groupId ? errorState[groupId] || null : null;

  /**
   * Load messages from backend.
   * Handles both initial load and pagination.
   */
  const loadMessages = useCallback(
    async (offset: number = 0, append: boolean = false) => {
      if (!groupId) return;

      try {
        const currentCount = (allMessages[groupId] || []).length;

        // Fetch messages from backend
        await fetchGroupMessages(groupId, pageSize, offset);

        // Check if there are more messages to load
        // If we got a full page, there might be more
        const newCount = (allMessages[groupId] || []).length;
        const messagesAdded = newCount - currentCount;

        if (messagesAdded >= pageSize) {
          setHasMore(true);
        } else {
          setHasMore(false);
        }

        if (append) {
          setCurrentOffset(offset + pageSize);
        }
      } catch (err) {
        // Error handled by store
        console.error('[useGroupMessages] Failed to load messages:', err);
      }
    },
    [groupId, fetchGroupMessages, pageSize, allMessages]
  );

  /**
   * Load next page of messages.
   */
  const loadMore = useCallback(async () => {
    if (!enablePagination || !hasMore || isLoadingMessages) {
      return;
    }

    await loadMessages(currentOffset, true);
  }, [enablePagination, hasMore, isLoadingMessages, currentOffset, loadMessages]);

  /**
   * Reload all messages from scratch.
   */
  const reloadMessages = useCallback(async () => {
    setCurrentOffset(0);
    setHasMore(false);
    await loadMessages(0, false);
  }, [loadMessages]);

  /**
   * Clear messages for current group.
   */
  const clearMessages = useCallback(() => {
    if (groupId) {
      clearGroupMessages(groupId);
      setCurrentOffset(0);
      setHasMore(false);
    }
  }, [groupId, clearGroupMessages]);

  /**
   * Auto-load messages when groupId changes.
   */
  useEffect(() => {
    if (autoLoad && groupId) {
      reloadMessages();
    }
  }, [groupId, autoLoad, reloadMessages]);

  return {
    messages,
    isLoadingMessages,
    isSending,
    error,
    hasMore,
    loadMore,
    reloadMessages,
    clearMessages,
  };
};
