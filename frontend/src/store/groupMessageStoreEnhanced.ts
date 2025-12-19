/**
 * Enhanced Zustand store for managing group message state with deduplication.
 *
 * This enhanced version adds:
 * - Message deduplication based on message IDs
 * - Tracking of persisted vs in-memory messages
 * - Smarter merge logic when loading from backend
 * - Prevention of sending already-persisted messages back to backend
 *
 * Dependencies: apiService (for backend communication)
 */

import { create } from 'zustand';
import type { GroupMessage, CharacterResponse } from '../types/group';
import type { Message } from '../types/message';

/**
 * Extended GroupMessage with persistence tracking.
 */
interface TrackedGroupMessage extends GroupMessage {
  /**
   * Whether this message has been persisted to the database.
   * True = loaded from backend or confirmed saved
   * False/undefined = optimistic local message
   */
  isPersisted?: boolean;
}

/**
 * Shape of the enhanced group message store state and actions.
 */
interface GroupMessageStoreEnhanced {
  // State
  /** Messages keyed by group ID */
  messages: Record<string, TrackedGroupMessage[]>;
  /** Loading state for fetch operations, keyed by group ID */
  isLoading: Record<string, boolean>;
  /** Loading state for send operations, keyed by group ID */
  isSending: Record<string, boolean>;
  /** Error messages keyed by group ID */
  error: Record<string, string | null>;

  // Actions
  /**
   * Fetch message history for a group.
   * Merges loaded messages with existing messages, avoiding duplicates.
   *
   * @param groupId - ID of the group
   * @param limit - Maximum number of messages to fetch (default: 50)
   * @param offset - Offset for pagination (default: 0)
   */
  fetchGroupMessages: (groupId: string, limit?: number, offset?: number) => Promise<void>;

  /**
   * Send a message to a group.
   * Only sends non-persisted messages as context to avoid redundancy.
   *
   * Process:
   * 1. Get last N persisted messages from messages[groupId]
   * 2. Add user message to the array optimistically (isPersisted: false)
   * 3. Send request to backend with messages and character_ids
   * 4. Receive array of character responses
   * 5. Mark user message as persisted
   * 6. Add character responses as persisted messages
   *
   * @param groupId - ID of the group
   * @param content - User's message content
   * @param characterIds - IDs of characters in the group
   * @param messageLimit - Number of recent messages to send as context (default: 5)
   */
  sendGroupMessage: (
    groupId: string,
    content: string,
    characterIds: string[],
    messageLimit?: number
  ) => Promise<void>;

  /**
   * Clear all messages for a group.
   * Resets messages[groupId] to empty array.
   *
   * @param groupId - ID of the group
   */
  clearGroupMessages: (groupId: string) => void;

  /**
   * Merge loaded messages with existing messages.
   * Helper method for deduplication logic.
   *
   * @param groupId - ID of the group
   * @param loadedMessages - Messages loaded from backend
   */
  mergeMessages: (groupId: string, loadedMessages: GroupMessage[]) => void;

  /**
   * Mark a message as persisted.
   * Updates the isPersisted flag for a specific message.
   *
   * @param groupId - ID of the group
   * @param messageId - ID of the message to mark
   */
  markMessageAsPersisted: (groupId: string, messageId: string) => void;
}

/**
 * Helper function to deduplicate messages by ID.
 * Preserves order (chronological) and prefers persisted messages over local ones.
 *
 * @param messages - Array of messages to deduplicate
 * @returns Deduplicated array of messages
 */
const deduplicateMessages = (messages: TrackedGroupMessage[]): TrackedGroupMessage[] => {
  const messageMap = new Map<string, TrackedGroupMessage>();

  for (const message of messages) {
    const existing = messageMap.get(message.id);

    // If message doesn't exist, add it
    if (!existing) {
      messageMap.set(message.id, message);
      continue;
    }

    // If message exists, prefer the persisted version
    if (message.isPersisted && !existing.isPersisted) {
      messageMap.set(message.id, message);
    }
  }

  // Return messages in chronological order
  return Array.from(messageMap.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
};

/**
 * Zustand store instance for enhanced group message management.
 */
export const useGroupMessageStoreEnhanced = create<GroupMessageStoreEnhanced>((set, get) => ({
  // Initial state
  messages: {},
  isLoading: {},
  isSending: {},
  error: {},

  // Actions implementation
  fetchGroupMessages: async (groupId: string, limit = 50, offset = 0) => {
    set((state) => ({
      isLoading: { ...state.isLoading, [groupId]: true },
      error: { ...state.error, [groupId]: null },
    }));

    try {
      const { apiService } = await import('../services/api');
      const response = await apiService.getGroupMessages(groupId, limit, offset);

      // Mark all loaded messages as persisted
      const loadedMessages: TrackedGroupMessage[] = (response.messages as GroupMessage[]).map(
        (msg) => ({
          ...msg,
          isPersisted: true,
        })
      );

      // Merge with existing messages
      get().mergeMessages(groupId, loadedMessages);

      set((state) => ({
        isLoading: { ...state.isLoading, [groupId]: false },
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch messages';
      set((state) => ({
        error: { ...state.error, [groupId]: errorMessage },
        isLoading: { ...state.isLoading, [groupId]: false },
      }));
    }
  },

  mergeMessages: (groupId: string, loadedMessages: TrackedGroupMessage[]) => {
    const { messages: currentMessages } = get();
    const existingMessages = currentMessages[groupId] || [];

    // Combine existing and loaded messages, then deduplicate
    const combined = [...existingMessages, ...loadedMessages];
    const deduplicated = deduplicateMessages(combined);

    set((state) => ({
      messages: {
        ...state.messages,
        [groupId]: deduplicated,
      },
    }));
  },

  markMessageAsPersisted: (groupId: string, messageId: string) => {
    const { messages: currentMessages } = get();
    const groupMessages = currentMessages[groupId] || [];

    const updatedMessages = groupMessages.map((msg) =>
      msg.id === messageId ? { ...msg, isPersisted: true } : msg
    );

    set((state) => ({
      messages: {
        ...state.messages,
        [groupId]: updatedMessages,
      },
    }));
  },

  sendGroupMessage: async (
    groupId: string,
    content: string,
    characterIds: string[],
    messageLimit = 5
  ) => {
    console.log('[GroupMessageStoreEnhanced] sendGroupMessage called:', {
      groupId,
      content,
      characterIds,
      messageLimit,
    });

    // Step 1: Get last N persisted messages from current group history
    const { messages: currentMessages } = get();
    const groupMessages = currentMessages[groupId] || [];

    // Filter only persisted messages for context
    const persistedMessages = groupMessages.filter((msg) => msg.isPersisted);
    const recentMessages = messageLimit > 0 ? persistedMessages.slice(-messageLimit) : [];

    // Step 2: Create user message object (not yet persisted)
    const userMessage: TrackedGroupMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
      isPersisted: false,
    };

    // Step 3: Optimistically add user message and set loading state
    set((state) => ({
      messages: {
        ...state.messages,
        [groupId]: [...groupMessages, userMessage],
      },
      isSending: { ...state.isSending, [groupId]: true },
      error: { ...state.error, [groupId]: null },
    }));

    try {
      const { apiService } = await import('../services/api');

      console.log('[GroupMessageStoreEnhanced] Sending to backend:', {
        messages: [...recentMessages, userMessage],
        character_ids: characterIds,
      });

      // Step 4: Send to backend
      const response = await apiService.sendGroupMessage({
        messages: [...recentMessages, userMessage],
        character_ids: characterIds,
      });

      console.log('[GroupMessageStoreEnhanced] Received response:', response);

      // Step 5: Mark user message as persisted
      get().markMessageAsPersisted(groupId, userMessage.id);

      // Step 6: Convert character responses to persisted GroupMessages
      const characterMessages: TrackedGroupMessage[] = response.responses.map((resp, index) => ({
        id: `${resp.character_id}-${Date.now()}-${index}`,
        role: 'assistant' as const,
        content: resp.message,
        created_at: new Date().toISOString(),
        character_id: resp.character_id,
        character_name: resp.character_name,
        emotions: resp.emotions,
        error: resp.error,
        isPersisted: true,
      }));

      // Step 7: Add character messages to state
      const updatedMessages = get().messages;
      set({
        messages: {
          ...updatedMessages,
          [groupId]: [...updatedMessages[groupId], ...characterMessages],
        },
        isSending: { ...get().isSending, [groupId]: false },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      set((state) => ({
        error: { ...state.error, [groupId]: errorMessage },
        isSending: { ...state.isSending, [groupId]: false },
      }));

      // Remove optimistic user message on error
      const { messages: currentMessages } = get();
      const groupMessages = currentMessages[groupId] || [];
      const filteredMessages = groupMessages.filter((msg) => msg.id !== userMessage.id);
      set((state) => ({
        messages: {
          ...state.messages,
          [groupId]: filteredMessages,
        },
      }));
    }
  },

  clearGroupMessages: (groupId: string) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [groupId]: [],
      },
    }));
  },
}));
