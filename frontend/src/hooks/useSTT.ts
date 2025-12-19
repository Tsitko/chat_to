/**
 * useSTT hook - Orchestrate recording, transcription, and message sending.
 *
 * Responsibilities:
 * - Coordinate useAudioRecorder hook for recording
 * - Call sttService for transcription
 * - Call messageStore for sending transcribed message
 * - Handle errors from all sources
 * - Provide unified state and controls to UI
 */

import { useState, useCallback } from 'react';
import { useAudioRecorder } from './useAudioRecorder';
import { useMessageStoreEnhanced } from '../store/messageStoreEnhanced';
import { sttService } from '../services/sttService';
import { RecordingState, STTError } from '../types/stt';

/**
 * Return type for useSTT hook.
 */
export interface UseSTTReturn {
  recordingState: RecordingState;
  isProcessing: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopAndTranscribe: () => Promise<void>;
  cancelRecording: () => void;
  duration: number;
}

/**
 * Hook for STT orchestration.
 *
 * @param characterId - ID of selected character (null if none selected)
 * @param onTranscription - Optional callback to receive transcribed text instead of auto-sending
 * @returns Object with STT state and control methods
 */
export function useSTT(characterId: string | null, onTranscription?: (text: string) => void): UseSTTReturn {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const recorder = useAudioRecorder();
  const { sendMessage } = useMessageStoreEnhanced();

  /**
   * Start audio recording.
   *
   * Validates character is selected, then starts recording.
   */
  const startRecording = useCallback(async (): Promise<void> => {
    // Validate characterId is selected (unless using callback mode)
    if (!characterId && !onTranscription) {
      setError('Please select a character first');
      return;
    }

    // Clear previous errors
    setError(null);

    // Start recording
    try {
      await recorder.startRecording();
    } catch (error) {
      // Error is already set by recorder hook
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  }, [characterId, onTranscription, recorder]);

  /**
   * Stop recording, transcribe audio, and send as message.
   *
   * Orchestrates the full flow: stop → transcribe → send message.
   */
  const stopAndTranscribe = useCallback(async (): Promise<void> => {
    if (!characterId && !onTranscription) {
      setError('Please select a character first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Stop recording and get audio
      const recording = await recorder.stopRecording();

      // Determine filename based on MIME type
      const extension = recording.mimeType.includes('webm') ? 'webm'
        : recording.mimeType.includes('ogg') ? 'ogg'
        : recording.mimeType.includes('mp4') ? 'm4a'
        : 'webm';
      const filename = `recording.${extension}`;

      // Transcribe audio
      const transcribedText = await sttService.transcribeAudio(recording.blob, filename);

      // If callback provided, use it; otherwise send as message
      if (onTranscription) {
        onTranscription(transcribedText);
      } else {
        await sendMessage(characterId, transcribedText);
      }

      // Success - state reset by recorder
    } catch (error) {
      // Handle different error types
      if (error instanceof STTError) {
        // Map STTError types to user-friendly messages
        switch (error.type) {
          case 'network':
            setError('Network error. Please check your connection.');
            break;
          case 'service':
            setError('STT service is offline. Please try again later.');
            break;
          case 'timeout':
            setError('Transcription timed out. Try a shorter recording.');
            break;
          default:
            setError('Transcription failed. Please try again.');
        }
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [characterId, onTranscription, recorder, sendMessage]);

  /**
   * Cancel recording without transcribing or sending.
   */
  const cancelRecording = useCallback((): void => {
    // Stop recording without processing
    recorder.stopRecording().catch(() => {
      // Ignore errors when canceling
    });

    // Clear errors
    setError(null);
    setIsProcessing(false);
  }, [recorder]);

  return {
    recordingState: recorder.state,
    isProcessing,
    error: error || recorder.error,
    startRecording,
    stopAndTranscribe,
    cancelRecording,
    duration: recorder.duration,
  };
}
