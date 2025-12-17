/**
 * Mock data for testing.
 *
 * This module provides realistic test data for all entity types.
 */

import type { Character, Book } from '../types/character';
import type { Message, MessageResponse, MessagesResponse } from '../types/message';
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
};

export const mockMessages: Message[] = [
  mockUserMessage1,
  mockAssistantMessage1,
  mockUserMessage2,
  mockAssistantMessage2,
];

export const mockMessagesResponse: MessagesResponse = {
  messages: mockMessages,
  total: 4,
};

export const mockMessageResponse: MessageResponse = {
  user_message: mockUserMessage1,
  assistant_message: mockAssistantMessage1,
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
