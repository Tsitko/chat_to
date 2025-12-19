/**
 * Type definitions for Message-related data structures.
 */

/**
 * Emotions interface representing character's emotional state.
 * All values are in range 0-100.
 */
export interface Emotions {
  /** Fear level (0-100) */
  fear: number;
  /** Anger level (0-100) */
  anger: number;
  /** Sadness level (0-100) */
  sadness: number;
  /** Disgust level (0-100) */
  disgust: number;
  /** Joy level (0-100) */
  joy: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  character_id?: string;
  /** Optional character name for group chat display */
  character_name?: string;
  /** Optional emotions data, only present in assistant messages */
  emotions?: Emotions;
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
