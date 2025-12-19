/**
 * Mock data for testing.
 *
 * This module provides realistic test data for all entity types.
 */

import type { Character, Book } from '../types/character';
import type { Message, MessageResponse, MessagesResponse, Emotions } from '../types/message';
import type { IndexingStatusResponse, BookIndexingStatus } from '../types/indexing';

// Mock Books
export const mockBook1: Book = {
  id: 'book-1',
  filename: 'philosophy-of-right.txt',
  file_size: 1024000,
  uploaded_at: '2025-01-01T10:00:00Z',
  indexed: true,
};

export const mockBook2: Book = {
  id: 'book-2',
  filename: 'phenomenology-of-spirit.txt',
  file_size: 2048000,
  uploaded_at: '2025-01-02T10:00:00Z',
  indexed: false,
};

export const mockBook3: Book = {
  id: 'book-3',
  filename: 'science-of-logic.txt',
  file_size: 3072000,
  uploaded_at: '2025-01-03T10:00:00Z',
  indexed: true,
};

// Mock Characters
export const mockCharacter1: Character = {
  id: 'char-1',
  name: 'Hegel',
  avatar_url: '/api/characters/char-1/avatar',
  created_at: '2025-01-01T09:00:00Z',
  books: [mockBook1, mockBook2],
};

export const mockCharacter2: Character = {
  id: 'char-2',
  name: 'Kant',
  avatar_url: null,
  created_at: '2025-01-02T09:00:00Z',
  books: [],
};

export const mockCharacter3: Character = {
  id: 'char-3',
  name: 'Nietzsche',
  avatar_url: '/api/characters/char-3/avatar',
  created_at: '2025-01-03T09:00:00Z',
  books: [mockBook3],
};

export const mockCharacters: Character[] = [
  mockCharacter1,
  mockCharacter2,
  mockCharacter3,
];

// Mock Emotions
export const mockEmotionsLow: Emotions = {
  fear: 10,
  anger: 20,
  sadness: 15,
  disgust: 5,
  joy: 25,
};

export const mockEmotionsMedium: Emotions = {
  fear: 40,
  anger: 50,
  sadness: 45,
  disgust: 55,
  joy: 60,
};

export const mockEmotionsHigh: Emotions = {
  fear: 70,
  anger: 80,
  sadness: 85,
  disgust: 90,
  joy: 95,
};

export const mockEmotionsMixed: Emotions = {
  fear: 15,
  anger: 45,
  sadness: 10,
  disgust: 5,
  joy: 75,
};

export const mockEmotionsBoundaryLow: Emotions = {
  fear: 33,
  anger: 33,
  sadness: 33,
  disgust: 33,
  joy: 33,
};

export const mockEmotionsBoundaryMedium: Emotions = {
  fear: 34,
  anger: 34,
  sadness: 66,
  disgust: 66,
  joy: 66,
};

export const mockEmotionsBoundaryHigh: Emotions = {
  fear: 67,
  anger: 67,
  sadness: 67,
  disgust: 67,
  joy: 67,
};

export const mockEmotionsZero: Emotions = {
  fear: 0,
  anger: 0,
  sadness: 0,
  disgust: 0,
  joy: 0,
};

export const mockEmotionsMax: Emotions = {
  fear: 100,
  anger: 100,
  sadness: 100,
  disgust: 100,
  joy: 100,
};

// Mock Messages
export const mockUserMessage1: Message = {
  id: 'msg-1',
  role: 'user',
  content: 'What is dialectics?',
  created_at: '2025-01-10T10:00:00Z',
};

export const mockAssistantMessage1: Message = {
  id: 'msg-2',
  role: 'assistant',
  content: 'Dialectics is the method of reasoning which combines oppositions into a higher unity.',
  created_at: '2025-01-10T10:00:05Z',
  emotions: mockEmotionsMixed,
};

export const mockUserMessage2: Message = {
  id: 'msg-3',
  role: 'user',
  content: 'Can you explain thesis-antithesis-synthesis?',
  created_at: '2025-01-10T10:01:00Z',
};

export const mockAssistantMessage2: Message = {
  id: 'msg-4',
  role: 'assistant',
  content: 'The dialectical process moves through thesis, antithesis, and synthesis stages.',
  created_at: '2025-01-10T10:01:10Z',
  emotions: mockEmotionsLow,
};

export const mockMessages: Message[] = [
  mockUserMessage1,
  mockAssistantMessage1,
  mockUserMessage2,
  mockAssistantMessage2,
];

// Additional message mocks for emotion testing
export const mockAssistantMessageWithEmotions: Message = {
  id: 'msg-emotion-1',
  role: 'assistant',
  content: 'This message has emotions attached.',
  created_at: '2025-01-10T10:02:00Z',
  character_id: 'char-1',
  emotions: mockEmotionsMixed,
};

export const mockAssistantMessageWithoutEmotions: Message = {
  id: 'msg-no-emotion-1',
  role: 'assistant',
  content: 'This message has no emotions.',
  created_at: '2025-01-10T10:03:00Z',
  character_id: 'char-1',
};

export const mockAssistantMessageHighEmotions: Message = {
  id: 'msg-high-emotion-1',
  role: 'assistant',
  content: 'This message has high intensity emotions.',
  created_at: '2025-01-10T10:04:00Z',
  character_id: 'char-1',
  emotions: mockEmotionsHigh,
};

export const mockAssistantMessageZeroEmotions: Message = {
  id: 'msg-zero-emotion-1',
  role: 'assistant',
  content: 'This message has all zero emotions.',
  created_at: '2025-01-10T10:05:00Z',
  character_id: 'char-1',
  emotions: mockEmotionsZero,
};

export const mockMessagesResponse: MessagesResponse = {
  messages: mockMessages,
  total: 4,
};

export const mockMessageResponse: MessageResponse = {
  user_message: mockUserMessage1,
  assistant_message: mockAssistantMessage1,
};

export const mockMessageResponseWithEmotions: MessageResponse = {
  user_message: {
    id: 'msg-user-emotion-1',
    role: 'user',
    content: 'Tell me about emotions',
    created_at: '2025-01-10T10:06:00Z',
  },
  assistant_message: mockAssistantMessageWithEmotions,
};

export const mockMessageResponseWithoutEmotions: MessageResponse = {
  user_message: {
    id: 'msg-user-no-emotion-1',
    role: 'user',
    content: 'Simple question',
    created_at: '2025-01-10T10:07:00Z',
  },
  assistant_message: mockAssistantMessageWithoutEmotions,
};

export const mockMessageResponseHighEmotions: MessageResponse = {
  user_message: {
    id: 'msg-user-high-emotion-1',
    role: 'user',
    content: 'Controversial topic',
    created_at: '2025-01-10T10:08:00Z',
  },
  assistant_message: mockAssistantMessageHighEmotions,
};

// Mock Indexing Status
export const mockBookIndexingStatus1: BookIndexingStatus = {
  book_id: 'book-1',
  status: 'completed',
  progress: 100,
};

export const mockBookIndexingStatus2: BookIndexingStatus = {
  book_id: 'book-2',
  status: 'indexing',
  progress: 45,
};

export const mockBookIndexingStatus3: BookIndexingStatus = {
  book_id: 'book-3',
  status: 'pending',
  progress: 0,
};

export const mockIndexingStatusResponse: IndexingStatusResponse = {
  books_indexing: [mockBookIndexingStatus1, mockBookIndexingStatus2],
  overall_status: 'indexing',
};

export const mockIndexingStatusCompleted: IndexingStatusResponse = {
  books_indexing: [mockBookIndexingStatus1],
  overall_status: 'completed',
};

export const mockIndexingStatusFailed: IndexingStatusResponse = {
  books_indexing: [
    {
      book_id: 'book-4',
      status: 'failed',
      progress: 30,
    },
  ],
  overall_status: 'failed',
};

// Mock Files for uploads
export const createMockFile = (
  name: string,
  size: number,
  type: string
): File => {
  const blob = new Blob(['mock content'], { type });
  const file = new File([blob], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

export const mockAvatarFile = createMockFile('avatar.jpg', 50000, 'image/jpeg');
export const mockBookFile1 = createMockFile('book1.txt', 1000000, 'text/plain');
export const mockBookFile2 = createMockFile('book2.pdf', 2000000, 'application/pdf');
export const mockLargeFile = createMockFile('huge.txt', 100000000, 'text/plain');
export const mockInvalidFile = createMockFile('invalid.exe', 5000, 'application/x-executable');
