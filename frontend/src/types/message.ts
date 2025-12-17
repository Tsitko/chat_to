/**
 * Type definitions for Message-related data structures.
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface MessageCreate {
  content: string;
}

export interface MessageResponse {
  user_message: Message;
  assistant_message: Message;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
}
