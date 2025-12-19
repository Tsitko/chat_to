/**
 * useAudioRecorder hook - Manage audio recording state using browser MediaRecorder API.
 *
 * Responsibilities:
 * - Request microphone permission via getUserMedia
 * - Create and manage MediaRecorder instance
 * - Accumulate audio chunks during recording
 * - Track recording duration
 * - Handle recording errors
 * - Cleanup resources on unmount
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { RecordingState, AudioRecording } from '../types/stt';

/**
 * Audio constraints for getUserMedia.
 */
const AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

/**
 * Preferred MIME types in order of preference.
 */
const MIME_TYPE_PREFERENCE = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
];

/**
 * Return type for useAudioRecorder hook.
 */
export interface UseAudioRecorderReturn {
  state: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<AudioRecording>;
  error: string | null;
  duration: number;
}

/**
 * Hook for managing audio recording state.
 *
 * @returns Object with recording state and control methods
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Start audio recording.
   *
   * Requests microphone permission, creates MediaRecorder instance,
   * and starts recording.
   *
   * @throws Error with user-friendly message for different failure modes
   */
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      // Clear previous errors
      setError(null);

      // Ensure any previous stream is cleaned up before starting new recording
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      streamRef.current = stream;

      // Find supported MIME type
      let mimeType = '';
      for (const type of MIME_TYPE_PREFERENCE) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up event listeners
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        setError('Recording error occurred');
        setState('idle');
      };

      // Start recording
      mediaRecorder.start();
      startTimeRef.current = Date.now();
      setState('recording');
    } catch (error) {
      let errorMessage = 'Failed to start recording';

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone permission denied';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Audio recording not supported in this browser';
        }
      }

      // Ensure cleanup on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current = null;
      }
      audioChunksRef.current = [];
      startTimeRef.current = null;

      setError(errorMessage);
      setState('idle');
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Stop audio recording and return the recording.
   *
   * Stops MediaRecorder, waits for onstop event, creates Blob from chunks,
   * and returns AudioRecording object.
   *
   * @returns Promise resolving to AudioRecording object
   * @throws Error if no active recording
   */
  const stopRecording = useCallback(async (): Promise<AudioRecording> => {
    const mediaRecorder = mediaRecorderRef.current;

    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      throw new Error('No active recording');
    }

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        try {
          // Create Blob from chunks
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: mimeType });

          // Calculate duration
          const recordingDuration = startTimeRef.current
            ? Date.now() - startTimeRef.current
            : 0;

          // Always cleanup stream and state, regardless of success or error
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }

          audioChunksRef.current = [];
          startTimeRef.current = null;
          mediaRecorderRef.current = null;
          setState('idle');
          setDuration(0);

          resolve({
            blob,
            mimeType,
            duration: recordingDuration,
          });
        } catch (error) {
          // Ensure cleanup happens even on error
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }

          audioChunksRef.current = [];
          startTimeRef.current = null;
          mediaRecorderRef.current = null;
          setState('idle');
          setDuration(0);
          reject(error);
        }
      };

      // Stop the recorder
      mediaRecorder.stop();
    });
  }, []);

  /**
   * Effect to update duration during recording.
   */
  useEffect(() => {
    if (state !== 'recording') {
      return;
    }

    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setDuration(Date.now() - startTimeRef.current);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [state]);

  /**
   * Cleanup effect: stop recording and release resources on unmount.
   */
  useEffect(() => {
    return () => {
      // Stop MediaRecorder if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Stop all media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Clear refs
      mediaRecorderRef.current = null;
      streamRef.current = null;
      audioChunksRef.current = [];
      startTimeRef.current = null;
    };
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    error,
    duration,
  };
}
