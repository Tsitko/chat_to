/**
 * Type definitions for Group-related data structures.
 *
 * Groups allow multiple characters to participate in a single conversation.
 * Each group has members (characters) and maintains its own message history.
 */

import { Character } from './character';
import { Message, Emotions } from './message';

/**
 * Group interface representing a chat group with multiple characters.
 */
export interface Group {
  /** Unique identifier for the group */
  id: string;
  /** Display name of the group */
  name: string;
  /** Avatar/icon URL for the group (optional) */
  avatar_url: string | null;
  /** Timestamp when the group was created */
  created_at: string;
  /** Array of character IDs that are members of this group */
  character_ids: string[];
  /** Full character objects (populated from character store) */
  characters?: Character[];
}

/**
 * Data required to create a new group.
 */
export interface GroupCreate {
  /** Name for the new group */
  name: string;
  /** Optional avatar file for the group */
  avatar?: File;
  /** Array of character IDs to add as initial members */
  character_ids: string[];
}

/**
 * Data for updating an existing group.
 */
export interface GroupUpdate {
  /** New name for the group (optional) */
  name?: string;
  /** New avatar file (optional) */
  avatar?: File;
  /** Updated list of character IDs (optional) */
  character_ids?: string[];
}

/**
 * Request payload for sending a message to a group.
 * Sent to POST /api/groups/messages endpoint.
 */
export interface GroupMessageRequest {
  /** Group ID for message persistence */
  group_id: string;
  /** Last N messages from the group chat (user + character messages) */
  messages: Message[];
  /** IDs of characters in the group who should respond */
  character_ids: string[];
}

/**
 * Single character's response in a group chat.
 */
export interface CharacterResponse {
  /** ID of the character who generated this response */
  character_id: string;
  /** Name of the character (for display purposes) */
  character_name: string;
  /** The message content from this character */
  message: string;
  /** Emotional state detected in the response */
  emotions?: Emotions;
  /** Error message if this character's response failed */
  error?: string;
}

/**
 * Response from backend when sending a group message.
 * Returned from POST /api/groups/messages endpoint.
 */
export interface GroupMessageResponse {
  /** Array of responses from each character in the group */
  responses: CharacterResponse[];
  /** Optional statistics about the group message processing */
  statistics?: {
    /** Total time taken to process all responses (ms) */
    total_time_ms?: number;
    /** Number of successful responses */
    successful_count?: number;
    /** Number of failed responses */
    failed_count?: number;
  };
}

/**
 * Extended Message type for group contexts.
 * Includes character information for multi-character conversations.
 */
export interface GroupMessage extends Message {
  /** ID of the character who sent this message (undefined for user messages) */
  character_id?: string;
  /** Name of the character who sent this message (for display) */
  character_name?: string;
  /** Avatar URL of the character who sent this message */
  avatar_url?: string;
}
