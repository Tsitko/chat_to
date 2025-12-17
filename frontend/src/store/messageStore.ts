/**
 * Zustand store for managing message state.
 */

import { create } from 'zustand';
import type { Message } from '../types/message';
import { apiService } from '../services/api';

interface MessageStore {
  messages: Record<string, Message[]>;  // Keyed by characterId
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  // Actions
  fetchMessages: (characterId: string, limit?: number, offset?: number) => Promise<void>;
  sendMessage: (characterId: string, content: string) => Promise<void>;
  clearMessages: (characterId: string) => void;
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: {},
  isLoading: false,
  isSending: false,
  error: null,

  fetchMessages: async (characterId: string, limit = 10, offset = 0) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getMessages(characterId, limit, offset);
      const { messages } = get();
      set({
        messages: {
          ...messages,
          [characterId]: response.messages,
        },
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch messages';
      set({ error: errorMessage, isLoading: false });
    }
  },

  sendMessage: async (characterId: string, content: string) => {
    set({ isSending: true, error: null });
    try {
      const response = await apiService.sendMessage(characterId, { content });
      const { messages } = get();
      const characterMessages = messages[characterId] || [];
      set({
        messages: {
          ...messages,
          [characterId]: [...characterMessages, response.user_message, response.assistant_message],
        },
        isSending: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      set({ error: errorMessage, isSending: false });
    }
  },

  clearMessages: (characterId: string) => {
    const { messages } = get();
    set({
      messages: {
        ...messages,
        [characterId]: [],
      },
    });
  },
}));
