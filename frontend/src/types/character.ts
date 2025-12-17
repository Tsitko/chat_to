/**
 * Type definitions for Character-related data structures.
 */

export interface Book {
  id: string;
  filename: string;
  file_size: number;
  uploaded_at: string;
  indexed: boolean;
}

export interface Character {
  id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  books: Book[];
}

export interface CharacterCreate {
  name: string;
  avatar?: File;
  books?: File[];
}

export interface CharacterUpdate {
  name?: string;
  avatar?: File;
  books?: File[];
}
