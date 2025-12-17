/**
 * ProgressBar component - displays progress for book indexing operations.
 *
 * This component shows a visual progress bar with percentage
 * and status information for tracking book indexing progress.
 *
 * @example
 * <ProgressBar
 *   progress={75}
 *   status="indexing"
 *   label="Indexing book.pdf..."
 * />
 */

import React from 'react';
import type { IndexingStatus } from '../types/indexing';
import './ProgressBar.css';

export interface ProgressBarProps {
  progress: number; // 0-100
  status: IndexingStatus;
  label?: string;
  showPercentage?: boolean;
  className?: string;
  testId?: string;
}

/**
 * ProgressBar component for displaying indexing progress
 *
 * @param progress - Progress percentage (0-100)
 * @param status - Current indexing status
 * @param label - Optional label text to display
 * @param showPercentage - Whether to show percentage text (default: true)
 * @param className - Additional CSS classes
 * @param testId - Test identifier
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status,
  label,
  showPercentage = true,
  className = '',
  testId = 'progress-bar',
}) => {
  // Clamp progress between 0 and 100, handle NaN
  const clampedProgress = isNaN(progress) ? 0 : Math.max(0, Math.min(100, progress));

  // Round to 1 decimal place for display
  const displayProgress = Math.round(clampedProgress * 10) / 10;

  // Default aria-label includes percentage
  const ariaLabel = label || `Progress: ${displayProgress}%`;

  // Add animated class for indexing status
  const fillClasses = `progress-bar-fill status-${status}${
    status === 'indexing' ? ' progress-bar-fill-animated' : ''
  }`;

  return (
    <div
      className={`progress-bar-container progress-bar-${status} ${className}`}
      data-testid={testId}
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      {(label || showPercentage) && (
        <div className="progress-bar-info">
          {label && (
            <div className="progress-bar-label" data-testid={`${testId}-label`}>
              {label}
            </div>
          )}
          {showPercentage && (
            <div
              className="progress-bar-percentage"
              data-testid={`${testId}-percentage`}
            >
              {displayProgress}%
            </div>
          )}
        </div>
      )}
      <div className="progress-bar-track" data-testid={`${testId}-track`}>
        <div
          className={fillClasses}
          style={{ width: `${clampedProgress}%` }}
          data-testid={`${testId}-fill`}
        />
      </div>
    </div>
  );
};
