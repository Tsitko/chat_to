/**
 * Zustand store for managing group message state.
 *
 * This store handles:
 * - Fetching message history for groups
 * - Sending messages to groups (triggering all character responses)
 * - Managing per-group message arrays
 * - Loading and error states per group
 *
 * Dependencies: apiService (for backend communication)
 */

import { create } from 'zustand';
import type { GroupMessage, CharacterResponse } from '../types/group';
import type { Message } from '../types/message';

/**
 * Shape of the group message store state and actions.
 */
interface GroupMessageStore {
  // State
  /** Messages keyed by group ID */
  messages: Record<string, GroupMessage[]>;
  /** Loading state for fetch operations, keyed by group ID */
  isLoading: Record<string, boolean>;
  /** Loading state for send operations, keyed by group ID */
  isSending: Record<string, boolean>;
  /** Error messages keyed by group ID */
  error: Record<string, string | null>;

  // Actions
  /**
   * Fetch message history for a group.
   * Updates messages[groupId] on success.
   *
   * @param groupId - ID of the group
   * @param limit - Maximum number of messages to fetch (default: 50)
   * @param offset - Offset for pagination (default: 0)
   */
  fetchGroupMessages: (groupId: string, limit?: number, offset?: number) => Promise<void>;

  /**
   * Send a message to a group.
   * Triggers responses from all characters in the group.
   *
   * Process:
   * 1. Get last N messages from messages[groupId]
   * 2. Add user message to the array optimistically
   * 3. Send request to backend with messages and character_ids
   * 4. Receive array of character responses
   * 5. Add each character response as a separate GroupMessage
   * 6. Update messages[groupId] with all new messages
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
   * Add character responses to a group's message history.
   * Helper method for converting CharacterResponse[] to GroupMessage[].
   *
   * @param groupId - ID of the group
   * @param responses - Array of character responses from backend
   */
  addCharacterResponses: (groupId: string, responses: CharacterResponse[]) => void;
}

/**
 * Zustand store instance for group message management.
 */
export const useGroupMessageStore = create<GroupMessageStore>((set, get) => ({
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
      const { messages } = get();
      set({
        messages: {
          ...messages,
          [groupId]: response.messages as GroupMessage[],
        },
        isLoading: { ...get().isLoading, [groupId]: false },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch messages';
      set((state) => ({
        error: { ...state.error, [groupId]: errorMessage },
        isLoading: { ...state.isLoading, [groupId]: false },
      }));
    }
  },

  sendGroupMessage: async (
    groupId: string,
    content: string,
    characterIds: string[],
    messageLimit = 5
  ) => {
    console.log('[GroupMessageStore] sendGroupMessage called:', { groupId, content, characterIds, messageLimit });

    // Step 1: Get last N messages from current group history
    const { messages: currentMessages } = get();
    const groupMessages = currentMessages[groupId] || [];
    const recentMessages = messageLimit > 0 ? groupMessages.slice(-messageLimit) : [];

    // Step 2: Create user message object
    const userMessage: GroupMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
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

      console.log('[GroupMessageStore] Sending to backend:', {
        group_id: groupId,
        messages: [...recentMessages, userMessage],
        character_ids: characterIds,
      });

      // Step 4: Send to backend
      const response = await apiService.sendGroupMessage({
        group_id: groupId,
        messages: [...recentMessages, userMessage],
        character_ids: characterIds,
      });

      console.log('[GroupMessageStore] Received response:', response);

      // Step 5: Convert character responses to GroupMessages
      const characterMessages: GroupMessage[] = response.responses.map((resp, index) => ({
        id: `${resp.character_id}-${Date.now()}-${index}`,
        role: 'assistant' as const,
        content: resp.message,
        created_at: new Date().toISOString(),
        character_id: resp.character_id,
        character_name: resp.character_name,
        emotions: resp.emotions,
        error: resp.error,
      }));

      // Step 6: Update state with all messages
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
    }
  },

  clearGroupMessages: (groupId: string) => {
    const { messages } = get();
    set({
      messages: {
        ...messages,
        [groupId]: [],
      },
    });
  },

  addCharacterResponses: (groupId: string, responses: CharacterResponse[]) => {
    const characterMessages: GroupMessage[] = responses.map((resp, index) => ({
      id: `${resp.character_id}-${Date.now()}-${index}`,
      role: 'assistant' as const,
      content: resp.message,
      created_at: new Date().toISOString(),
      character_id: resp.character_id,
      character_name: resp.character_name,
      emotions: resp.emotions,
    }));

    const { messages } = get();
    const groupMessages = messages[groupId] || [];
    set({
      messages: {
        ...messages,
        [groupId]: [...groupMessages, ...characterMessages],
      },
    });
  },
}));
