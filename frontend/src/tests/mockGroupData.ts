/**
 * Mock data for group message and TTS testing.
 *
 * This module provides realistic test data for group chat functionality,
 * including messages, responses, and various edge cases.
 */

import type { GroupMessage, CharacterResponse, GroupMessageResponse } from '../types/group';
import type { Emotions } from '../types/message';
import { mockCharacter1, mockCharacter2, mockCharacter3, mockEmotionsMixed, mockEmotionsLow } from './mockData';

// Mock Emotions for group messages
export const mockGroupEmotionsNeutral: Emotions = {
  fear: 20,
  anger: 15,
  sadness: 10,
  disgust: 5,
  joy: 50,
};

export const mockGroupEmotionsExcited: Emotions = {
  fear: 5,
  anger: 10,
  sadness: 5,
  disgust: 5,
  joy: 85,
};

// Mock Group Messages
export const mockGroupUserMessage1: GroupMessage = {
  id: 'group-msg-1',
  role: 'user',
  content: 'What do you all think about dialectics?',
  created_at: '2025-01-15T10:00:00Z',
};

export const mockGroupAssistantMessage1: GroupMessage = {
  id: 'group-msg-2',
  role: 'assistant',
  content: 'Dialectics is the fundamental method of understanding reality through contradictions.',
  created_at: '2025-01-15T10:00:05Z',
  character_id: 'char-1',
  character_name: 'Hegel',
  avatar_url: '/api/characters/char-1/avatar',
  emotions: mockEmotionsMixed,
};

export const mockGroupAssistantMessage2: GroupMessage = {
  id: 'group-msg-3',
  role: 'assistant',
  content: 'I prefer to approach this through categorical analysis rather than dialectics.',
  created_at: '2025-01-15T10:00:08Z',
  character_id: 'char-2',
  character_name: 'Kant',
  emotions: mockEmotionsLow,
};

export const mockGroupUserMessage2: GroupMessage = {
  id: 'group-msg-4',
  role: 'user',
  content: 'Can you explain the differences in your approaches?',
  created_at: '2025-01-15T10:01:00Z',
};

export const mockGroupAssistantMessage3: GroupMessage = {
  id: 'group-msg-5',
  role: 'assistant',
  content: 'My dialectical method synthesizes opposites into higher unity.',
  created_at: '2025-01-15T10:01:05Z',
  character_id: 'char-1',
  character_name: 'Hegel',
  avatar_url: '/api/characters/char-1/avatar',
  emotions: mockGroupEmotionsNeutral,
};

export const mockGroupAssistantMessage4: GroupMessage = {
  id: 'group-msg-6',
  role: 'assistant',
  content: 'I focus on the transcendental conditions of knowledge.',
  created_at: '2025-01-15T10:01:08Z',
  character_id: 'char-2',
  character_name: 'Kant',
  emotions: mockGroupEmotionsNeutral,
};

export const mockGroupAssistantMessage5: GroupMessage = {
  id: 'group-msg-7',
  role: 'assistant',
  content: 'Both of you are trapped in your systems! Philosophy needs a hammer.',
  created_at: '2025-01-15T10:01:11Z',
  character_id: 'char-3',
  character_name: 'Nietzsche',
  avatar_url: '/api/characters/char-3/avatar',
  emotions: mockGroupEmotionsExcited,
};

// Collections of messages
export const mockGroupMessages: GroupMessage[] = [
  mockGroupUserMessage1,
  mockGroupAssistantMessage1,
  mockGroupAssistantMessage2,
  mockGroupUserMessage2,
  mockGroupAssistantMessage3,
  mockGroupAssistantMessage4,
  mockGroupAssistantMessage5,
];

export const mockGroupMessagesEmpty: GroupMessage[] = [];

export const mockGroupMessagesUserOnly: GroupMessage[] = [
  mockGroupUserMessage1,
  mockGroupUserMessage2,
];

export const mockGroupMessagesAssistantOnly: GroupMessage[] = [
  mockGroupAssistantMessage1,
  mockGroupAssistantMessage2,
  mockGroupAssistantMessage3,
  mockGroupAssistantMessage4,
  mockGroupAssistantMessage5,
];

// Mock Character Responses
export const mockCharacterResponse1: CharacterResponse = {
  character_id: 'char-1',
  character_name: 'Hegel',
  message: 'Dialectics is the fundamental method of understanding reality through contradictions.',
  emotions: mockEmotionsMixed,
};

export const mockCharacterResponse2: CharacterResponse = {
  character_id: 'char-2',
  character_name: 'Kant',
  message: 'I prefer to approach this through categorical analysis rather than dialectics.',
  emotions: mockEmotionsLow,
};

export const mockCharacterResponse3: CharacterResponse = {
  character_id: 'char-3',
  character_name: 'Nietzsche',
  message: 'Both of you are trapped in your systems! Philosophy needs a hammer.',
  emotions: mockGroupEmotionsExcited,
};

export const mockCharacterResponseWithError: CharacterResponse = {
  character_id: 'char-1',
  character_name: 'Hegel',
  message: '',
  error: 'LLM service temporarily unavailable',
};

// Mock Group Message Responses
export const mockGroupMessageResponse: GroupMessageResponse = {
  responses: [mockCharacterResponse1, mockCharacterResponse2],
  statistics: {
    total_time_ms: 2500,
    successful_count: 2,
    failed_count: 0,
  },
};

export const mockGroupMessageResponseSingle: GroupMessageResponse = {
  responses: [mockCharacterResponse1],
  statistics: {
    total_time_ms: 1200,
    successful_count: 1,
    failed_count: 0,
  },
};

export const mockGroupMessageResponseThree: GroupMessageResponse = {
  responses: [mockCharacterResponse1, mockCharacterResponse2, mockCharacterResponse3],
  statistics: {
    total_time_ms: 3500,
    successful_count: 3,
    failed_count: 0,
  },
};

export const mockGroupMessageResponseWithError: GroupMessageResponse = {
  responses: [mockCharacterResponse1, mockCharacterResponseWithError],
  statistics: {
    total_time_ms: 1800,
    successful_count: 1,
    failed_count: 1,
  },
};

export const mockGroupMessageResponseEmpty: GroupMessageResponse = {
  responses: [],
  statistics: {
    total_time_ms: 0,
    successful_count: 0,
    failed_count: 0,
  },
};

// Mock Messages Response (for fetchGroupMessages)
export interface GroupMessagesResponse {
  messages: GroupMessage[];
  total?: number;
}

export const mockGroupMessagesResponse: GroupMessagesResponse = {
  messages: mockGroupMessages,
  total: 7,
};

export const mockGroupMessagesResponseEmpty: GroupMessagesResponse = {
  messages: [],
  total: 0,
};

export const mockGroupMessagesResponsePaginated1: GroupMessagesResponse = {
  messages: mockGroupMessages.slice(0, 3),
  total: 7,
};

export const mockGroupMessagesResponsePaginated2: GroupMessagesResponse = {
  messages: mockGroupMessages.slice(3, 6),
  total: 7,
};

export const mockGroupMessagesResponsePaginated3: GroupMessagesResponse = {
  messages: mockGroupMessages.slice(6),
  total: 7,
};

// Extended message types with isPersisted flag (for enhanced store)
export interface TrackedGroupMessage extends GroupMessage {
  isPersisted?: boolean;
}

export const mockTrackedGroupUserMessage1: TrackedGroupMessage = {
  ...mockGroupUserMessage1,
  isPersisted: true,
};

export const mockTrackedGroupAssistantMessage1: TrackedGroupMessage = {
  ...mockGroupAssistantMessage1,
  isPersisted: true,
};

export const mockTrackedGroupUserMessage2Optimistic: TrackedGroupMessage = {
  ...mockGroupUserMessage2,
  isPersisted: false,
};

export const mockTrackedGroupUserMessage2Persisted: TrackedGroupMessage = {
  ...mockGroupUserMessage2,
  isPersisted: true,
};

// Edge Cases
export const mockGroupMessageVeryLong: GroupMessage = {
  id: 'group-msg-long',
  role: 'assistant',
  content: 'A'.repeat(10000),
  created_at: '2025-01-15T10:02:00Z',
  character_id: 'char-1',
  character_name: 'Hegel',
};

export const mockGroupMessageWithSpecialChars: GroupMessage = {
  id: 'group-msg-special',
  role: 'user',
  content: 'Hello! @#$%^&*() <script>alert("xss")</script> \n\t\r',
  created_at: '2025-01-15T10:03:00Z',
};

export const mockGroupMessageEmptyContent: GroupMessage = {
  id: 'group-msg-empty',
  role: 'user',
  content: '',
  created_at: '2025-01-15T10:04:00Z',
};

// Group IDs for testing
export const mockGroupId1 = 'group-1';
export const mockGroupId2 = 'group-2';
export const mockGroupId3 = 'group-3';
export const mockNonexistentGroupId = 'group-nonexistent';

// Character IDs for testing
export const mockCharacterIds = ['char-1', 'char-2'];
export const mockCharacterIdsThree = ['char-1', 'char-2', 'char-3'];
export const mockCharacterIdsSingle = ['char-1'];
export const mockCharacterIdsEmpty: string[] = [];
