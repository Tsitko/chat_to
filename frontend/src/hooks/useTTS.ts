/**
 * useTTS - React hook for managing Text-to-Speech state and audio playback.
 *
 * Responsibilities:
 * - Manage TTS state machine: idle → loading → playing → idle/error
 * - Call TTSService to synthesize speech
 * - Create and manage Audio objects for playback
 * - Provide functions to start and stop audio
 * - Clean up resources on unmount
 * - Prevent multiple simultaneous playbacks
 * - Cache generated audio paths to avoid regeneration
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { TTSState, TTSError } from '../types/tts';
import { ttsService } from '../services/ttsService';

export interface UseTTSReturn {
  state: TTSState;
  error: TTSError | null;
  synthesizeAndPlay: (text: string) => Promise<void>;
  stopAudio: () => void;
}

/**
 * Global cache for mapping text content to generated audio paths.
 * This prevents regenerating audio for the same text content.
 */
const audioCache = new Map<string, string>();

/**
 * Clear the audio cache. This is exposed for testing purposes.
 * In production, the cache persists for the application lifetime.
 */
export const clearAudioCache = (): void => {
  audioCache.clear();
};

/**
 * Custom React hook for TTS functionality.
 *
 * @returns Object with state, error, and control functions
 */
export const useTTS = (): UseTTSReturn => {
  const [state, setState] = useState<TTSState>('idle');
  const [error, setError] = useState<TTSError | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Stop the currently playing audio.
   */
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeEventListener('play', handleAudioPlay);
      audioRef.current.removeEventListener('ended', handleAudioEnded);
      audioRef.current.removeEventListener('error', handleAudioError);
      audioRef.current = null;
    }
    setState('idle');
  }, []);

  /**
   * Event handler for audio 'play' event.
   */
  const handleAudioPlay = useCallback(() => {
    setState('playing');
  }, []);

  /**
   * Event handler for audio 'ended' event.
   */
  const handleAudioEnded = useCallback(() => {
    setState('idle');
    if (audioRef.current) {
      audioRef.current = null;
    }
  }, []);

  /**
   * Event handler for audio 'error' event.
   */
  const handleAudioError = useCallback(() => {
    setState('error');
    setError(new TTSError('playback', 'Audio playback failed'));
  }, []);

  /**
   * Synthesize speech and play audio.
   *
   * Process:
   * 1. Check if audio path is already cached for this text
   * 2. If cached, use cached path; otherwise synthesize and cache
   * 3. Set state to 'loading'
   * 4. Call TTSService.synthesizeSpeech(text) if not cached
   * 5. Create Audio object with returned path
   * 6. Set up event listeners (play, ended, error)
   * 7. Call audio.play()
   * 8. Set state to 'playing'
   *
   * @param text - The text to synthesize into speech
   */
  const synthesizeAndPlay = useCallback(async (text: string) => {
    try {
      // Stop any currently playing audio
      stopAudio();

      // Reset error state
      setError(null);
      setState('loading');

      // Check if audio path is already cached
      let audioPath: string;
      if (audioCache.has(text)) {
        // Use cached audio path
        audioPath = audioCache.get(text)!;
      } else {
        // Synthesize speech and cache the result
        audioPath = await ttsService.synthesizeSpeech(text);
        audioCache.set(text, audioPath);
      }

      // Create audio element
      const audio = new Audio(audioPath);
      audioRef.current = audio;

      // Set up event listeners
      audio.addEventListener('play', handleAudioPlay);
      audio.addEventListener('ended', handleAudioEnded);
      audio.addEventListener('error', handleAudioError);

      // Start playback
      await audio.play();
    } catch (err) {
      if (err instanceof TTSError) {
        setError(err);
      } else {
        setError(new TTSError('unknown', 'An unexpected error occurred'));
      }
      setState('error');
    }
  }, [stopAudio, handleAudioPlay, handleAudioEnded, handleAudioError]);

  /**
   * Cleanup on unmount.
   */
  useEffect(() => {
    return () => {
      if (audioRef.current && typeof audioRef.current.pause === 'function') {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { state, error, synthesizeAndPlay, stopAudio };
};
