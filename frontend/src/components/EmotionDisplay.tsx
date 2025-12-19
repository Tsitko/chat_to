/**
 * EmotionDisplay component - displays character's emotional state.
 *
 * This component renders emotion values with color-coded intensity:
 * - 0-33: green (low intensity)
 * - 34-66: orange (medium intensity)
 * - 67-100: red (high intensity)
 *
 * Emotions are displayed horizontally with Russian labels.
 */

import React from 'react';
import { Emotions } from '../types/message';
import './EmotionDisplay.css';

export interface EmotionDisplayProps {
  /** Emotions data containing all five emotion values */
  emotions: Emotions;
}

/**
 * Type representing a single emotion entry for display.
 */
interface EmotionEntry {
  /** Russian label for the emotion */
  label: string;
  /** Numeric value of the emotion (0-100) */
  value: number;
  /** CSS class name for color coding */
  colorClass: string;
}

/**
 * Determines the CSS class based on emotion value.
 *
 * @param value - Emotion value (0-100)
 * @returns CSS class name for color coding
 */
const getEmotionColorClass = (value: number): string => {
  if (value >= 0 && value <= 33) return 'emotion-low';
  if (value >= 34 && value <= 66) return 'emotion-medium';
  return 'emotion-high';
};

/**
 * Converts Emotions object to array of EmotionEntry for rendering.
 *
 * @param emotions - Emotions data object
 * @returns Array of EmotionEntry objects with labels, values, and color classes
 */
const mapEmotionsToEntries = (emotions: Emotions): EmotionEntry[] => {
  return [
    { label: 'Страх', value: emotions.fear, colorClass: getEmotionColorClass(emotions.fear) },
    { label: 'Злость', value: emotions.anger, colorClass: getEmotionColorClass(emotions.anger) },
    { label: 'Печаль', value: emotions.sadness, colorClass: getEmotionColorClass(emotions.sadness) },
    { label: 'Отвращение', value: emotions.disgust, colorClass: getEmotionColorClass(emotions.disgust) },
    { label: 'Радость', value: emotions.joy, colorClass: getEmotionColorClass(emotions.joy) }
  ];
};

/**
 * EmotionDisplay component.
 *
 * Displays all five emotions with color-coded values and Russian labels.
 * Format: "Страх: 25  Злость: 50  Печаль: 10  Отвращение: 5  Радость: 80"
 */
export const EmotionDisplay: React.FC<EmotionDisplayProps> = ({ emotions }) => {
  const emotionEntries = mapEmotionsToEntries(emotions);

  // Map emotion labels to emotion keys for testid
  const emotionKeys = ['fear', 'anger', 'sadness', 'disgust', 'joy'];

  return (
    <div className="emotion-display" data-testid="emotion-display">
      {emotionEntries.map((emotion, index) => (
        <span
          key={emotion.label}
          className="emotion-item"
          data-testid={`emotion-${emotionKeys[index]}`}
        >
          <span className="emotion-label">{emotion.label}:</span>
          <span className={`emotion-value ${emotion.colorClass}`}>
            {emotion.value}
          </span>
        </span>
      ))}
    </div>
  );
};
