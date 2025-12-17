/**
 * Enhanced Zustand store for managing message state with granular loading states.
 *
 * This is an enhanced version of messageStore that provides:
 * - Separate loading states for fetch and send operations
 * - Per-character loading states
 * - Better error handling
 * - Optimistic updates for sending messages
 */

import { create } from 'zustand';
import type { Message } from '../types/message';
import type { MessageLoadingStates, LoadingStatus } from '../types/loading';
import { apiService } from '../services/api';

interface MessageStoreEnhanced {
  messages: Record<string, Message[]>; // Keyed by characterId
  loadingStates: Record<string, MessageLoadingStates>; // Per-character loading states

  // Actions
  fetchMessages: (characterId: string, limit?: number, offset?: number) => Promise<void>;
  sendMessage: (characterId: string, content: string) => Promise<boolean>;
  clearMessages: (characterId: string) => void;

  // Helper methods
  getLoadingState: (characterId: string, operation: 'fetch' | 'send') => LoadingStatus;
  isLoading: (characterId: string, operation: 'fetch' | 'send') => boolean;
  clearError: (characterId: string, operation: 'fetch' | 'send') => void;
}

/**
 * Creates initial loading status
 */
const createInitialLoadingStatus = (): LoadingStatus => ({
  state: 'idle',
  error: undefined,
});

/**
 * Creates initial loading states for a character
 */
const createInitialMessageLoadingStates = (): MessageLoadingStates => ({
  fetch: createInitialLoadingStatus(),
  send: createInitialLoadingStatus(),
});

/**
 * Enhanced message store with granular loading states
 */
export const useMessageStoreEnhanced = create<MessageStoreEnhanced>((set, get) => ({
  messages: {},
  loadingStates: {},

  /**
   * Fetches messages for a character
   */
  fetchMessages: async (characterId: string, limit = 10, offset = 0) => {
    set((state) => {
      const loadingState = state.loadingStates[characterId] || createInitialMessageLoadingStates();
      return {
        loadingStates: {
          ...state.loadingStates,
          [characterId]: {
            ...loadingState,
            fetch: { state: 'loading' },
          },
        },
      };
    });

    try {
      const response = await apiService.getMessages(characterId, limit, offset);
      set((state) => ({
        messages: {
          ...state.messages,
          [characterId]: response.messages,
        },
        loadingStates: {
          ...state.loadingStates,
          [characterId]: {
            ...state.loadingStates[characterId],
            fetch: { state: 'success' },
          },
        },
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch messages';
      set((state) => ({
        messages: {
          ...state.messages,
          [characterId]: [],
        },
        loadingStates: {
          ...state.loadingStates,
          [characterId]: {
            ...state.loadingStates[characterId],
            fetch: { state: 'error', error: errorMessage },
          },
        },
      }));
    }
  },

  /**
   * Sends a message to a character
   *
   * @returns true on success, false on error
   */
  sendMessage: async (characterId: string, content: string) => {
    set((state) => {
      const loadingState = state.loadingStates[characterId] || createInitialMessageLoadingStates();
      return {
        loadingStates: {
          ...state.loadingStates,
          [characterId]: {
            ...loadingState,
            send: { state: 'loading' },
          },
        },
      };
    });

    try {
      const response = await apiService.sendMessage(characterId, { content });
      set((state) => {
        const currentMessages = state.messages[characterId] || [];
        return {
          messages: {
            ...state.messages,
            [characterId]: [
              ...currentMessages,
              response.user_message,
              response.assistant_message,
            ],
          },
          loadingStates: {
            ...state.loadingStates,
            [characterId]: {
              ...state.loadingStates[characterId],
              send: { state: 'success' },
            },
          },
        };
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      set((state) => ({
        loadingStates: {
          ...state.loadingStates,
          [characterId]: {
            ...state.loadingStates[characterId],
            send: { state: 'error', error: errorMessage },
          },
        },
      }));
      return false;
    }
  },

  /**
   * Clears messages for a character
   */
  clearMessages: (characterId: string) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [characterId]: [],
      },
    }));
  },

  /**
   * Gets loading state for a specific operation
   */
  getLoadingState: (characterId: string, operation: 'fetch' | 'send') => {
    const state = get();
    const loadingState = state.loadingStates[characterId];
    if (!loadingState) {
      return createInitialLoadingStatus();
    }
    return loadingState[operation];
  },

  /**
   * Checks if an operation is currently loading
   */
  isLoading: (characterId: string, operation: 'fetch' | 'send') => {
    const state = get();
    const loadingState = state.loadingStates[characterId];
    if (!loadingState) {
      return false;
    }
    return loadingState[operation].state === 'loading';
  },

  /**
   * Clears error for a specific operation
   */
  clearError: (characterId: string, operation: 'fetch' | 'send') => {
    set((state) => {
      const loadingState = state.loadingStates[characterId];
      if (!loadingState) {
        return state;
      }
      return {
        loadingStates: {
          ...state.loadingStates,
          [characterId]: {
            ...loadingState,
            [operation]: {
              ...loadingState[operation],
              error: undefined,
            },
          },
        },
      };
    });
  },
}));
