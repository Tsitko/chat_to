/**
 * useGroupTTS - React hook for managing sequential TTS playback in group chats.
 *
 * Responsibilities:
 * - Manage sequential playback of multiple character responses
 * - Track which message is currently playing
 * - Provide controls to play/pause/skip through responses
 * - Reuse existing TTS infrastructure (useTTS hook)
 * - Handle playlist state (queue of messages to play)
 *
 * This hook extends useTTS for group chat scenarios where multiple
 * character responses need to be played in sequence.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTTS } from './useTTS';
import { TTSState, TTSError } from '../types/tts';
import type { GroupMessage } from '../types/group';

/**
 * Playlist item representing a message to be played.
 */
interface PlaylistItem {
  /** Message ID */
  messageId: string;
  /** Text content to synthesize */
  text: string;
  /** Character name for display */
  characterName?: string;
}

/**
 * Return type for useGroupTTS hook.
 */
export interface UseGroupTTSReturn {
  /**
   * Current TTS state (idle, loading, playing, error).
   */
  state: TTSState;

  /**
   * Error if TTS failed.
   */
  error: TTSError | null;

  /**
   * ID of the currently playing message (null if none).
   */
  currentMessageId: string | null;

  /**
   * Index of current message in playlist.
   */
  currentIndex: number;

  /**
   * Total number of messages in playlist.
   */
  totalMessages: number;

  /**
   * Whether playlist has more messages to play.
   */
  hasNext: boolean;

  /**
   * Whether playlist has previous messages.
   */
  hasPrevious: boolean;

  /**
   * Play a specific message by ID.
   * If already playing, stops current and starts new.
   */
  playMessage: (messageId: string, text: string, characterName?: string) => Promise<void>;

  /**
   * Play all character responses sequentially from a list of messages.
   * Filters out user messages and plays only assistant messages.
   */
  playAllResponses: (messages: GroupMessage[]) => Promise<void>;

  /**
   * Stop current playback and clear playlist.
   */
  stopPlayback: () => void;

  /**
   * Skip to next message in playlist.
   */
  playNext: () => Promise<void>;

  /**
   * Skip to previous message in playlist.
   */
  playPrevious: () => Promise<void>;

  /**
   * Pause current playback (keeps playlist position).
   */
  pause: () => void;

  /**
   * Resume playback from current position.
   */
  resume: () => Promise<void>;
}

/**
 * Custom hook for group TTS functionality.
 *
 * Manages sequential playback of multiple character responses
 * in group chat scenarios.
 *
 * @returns Object with state, playlist info, and control functions
 */
export const useGroupTTS = (): UseGroupTTSReturn => {
  const { state, error, synthesizeAndPlay, stopAudio } = useTTS();

  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [prevState, setPrevState] = useState<string>('idle');

  const currentMessageId = currentIndex >= 0 && currentIndex < playlist.length
    ? playlist[currentIndex].messageId
    : null;

  const totalMessages = playlist.length;
  const hasNext = currentIndex < totalMessages - 1;
  const hasPrevious = currentIndex > 0;

  /**
   * Play a specific message.
   */
  const playMessage = useCallback(
    async (messageId: string, text: string, characterName?: string) => {
      // Create single-item playlist
      const newPlaylist: PlaylistItem[] = [{ messageId, text, characterName }];
      setPlaylist(newPlaylist);
      setCurrentIndex(0);
      setIsPaused(false);
      setIsPlaying(true);
      setPrevState('playing'); // Set prev state to playing to enable auto-advance

      // Start playback
      await synthesizeAndPlay(text);
    },
    [synthesizeAndPlay]
  );

  /**
   * Play all assistant messages from a group message list.
   */
  const playAllResponses = useCallback(
    async (messages: GroupMessage[]) => {
      // Filter only assistant messages
      const assistantMessages = messages.filter((msg) => msg.role === 'assistant');

      if (assistantMessages.length === 0) {
        console.warn('[useGroupTTS] No assistant messages to play');
        return;
      }

      // Create playlist
      const newPlaylist: PlaylistItem[] = assistantMessages.map((msg) => ({
        messageId: msg.id,
        text: msg.content,
        characterName: msg.character_name,
      }));

      setPlaylist(newPlaylist);
      setCurrentIndex(0);
      setIsPaused(false);
      setIsPlaying(true);
      setPrevState('playing'); // Set prev state to playing to enable auto-advance

      // Start playback of first message
      await synthesizeAndPlay(newPlaylist[0].text);
    },
    [synthesizeAndPlay]
  );

  /**
   * Stop playback and clear playlist.
   */
  const stopPlayback = useCallback(() => {
    stopAudio();
    setPlaylist([]);
    setCurrentIndex(-1);
    setIsPaused(false);
    setIsPlaying(false);
  }, [stopAudio]);

  /**
   * Play next message in playlist.
   */
  const playNext = useCallback(async () => {
    if (!hasNext) {
      console.warn('[useGroupTTS] No next message in playlist');
      return;
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setIsPaused(false);
    setIsPlaying(true);
    setPrevState('playing'); // Set prev state to playing to enable auto-advance

    await synthesizeAndPlay(playlist[nextIndex].text);
  }, [hasNext, currentIndex, playlist, synthesizeAndPlay]);

  /**
   * Play previous message in playlist.
   */
  const playPrevious = useCallback(async () => {
    if (!hasPrevious) {
      console.warn('[useGroupTTS] No previous message in playlist');
      return;
    }

    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    setIsPaused(false);
    setIsPlaying(true);
    setPrevState('playing'); // Set prev state to playing to enable auto-advance

    await synthesizeAndPlay(playlist[prevIndex].text);
  }, [hasPrevious, currentIndex, playlist, synthesizeAndPlay]);

  /**
   * Pause current playback.
   */
  const pause = useCallback(() => {
    stopAudio();
    setIsPaused(true);
  }, [stopAudio]);

  /**
   * Resume playback from current position.
   */
  const resume = useCallback(async () => {
    if (currentIndex < 0 || currentIndex >= playlist.length) {
      console.warn('[useGroupTTS] No message to resume');
      return;
    }

    setIsPaused(false);
    setIsPlaying(true);
    setPrevState('playing'); // Set prev state to playing to enable auto-advance
    await synthesizeAndPlay(playlist[currentIndex].text);
  }, [currentIndex, playlist, synthesizeAndPlay]);

  /**
   * Auto-play next message when current finishes.
   */
  useEffect(() => {
    // Track state transitions for debugging
    if (prevState !== state) {
      setPrevState(state);
    }

    // Only auto-play if we just transitioned from playing/loading to idle
    // This prevents auto-play from triggering when state is already idle
    const justFinished = (prevState === 'playing' || prevState === 'loading') && state === 'idle';

    // Only auto-play if:
    // 1. Just finished playing (transitioned to idle)
    // 2. Not paused
    // 3. Has next message
    // 4. Playlist is not empty
    // 5. Current index is valid (>= 0)
    // 6. Is currently in a playing session
    if (justFinished && !isPaused && isPlaying && hasNext && playlist.length > 0 && currentIndex >= 0) {
      const nextIndex = currentIndex + 1;
      if (nextIndex < playlist.length) {
        setCurrentIndex(nextIndex);
        setIsPaused(false);
        setPrevState('playing'); // Reset to playing for next auto-advance
        synthesizeAndPlay(playlist[nextIndex].text);
      } else {
        // Reached end of playlist
        setIsPlaying(false);
      }
    } else if (justFinished && isPlaying && !hasNext) {
      // Finished last track
      setIsPlaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, prevState, isPaused, isPlaying, hasNext, playlist.length, currentIndex]);

  return {
    state,
    error,
    currentMessageId,
    currentIndex,
    totalMessages,
    hasNext,
    hasPrevious,
    playMessage,
    playAllResponses,
    stopPlayback,
    playNext,
    playPrevious,
    pause,
    resume,
  };
};
