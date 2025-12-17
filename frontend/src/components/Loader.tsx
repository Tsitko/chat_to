/**
 * Loader component - reusable loading indicator with multiple variants.
 *
 * This component provides different loading visualizations:
 * - spinner: Circular spinning indicator
 * - dots: Three bouncing dots
 * - inline: Small inline spinner for buttons
 * - overlay: Full-screen overlay with spinner
 *
 * @example
 * <Loader variant="spinner" size="md" />
 * <Loader variant="dots" size="sm" text="Loading messages..." />
 * <Loader variant="overlay" text="Creating character..." />
 */

import React from 'react';
import './Loader.css';

export type LoaderVariant = 'spinner' | 'dots' | 'inline' | 'overlay';
export type LoaderSize = 'sm' | 'md' | 'lg';

export interface LoaderProps {
  variant?: LoaderVariant;
  size?: LoaderSize;
  text?: string;
  className?: string;
  testId?: string;
}

/**
 * Loader component for displaying loading states
 *
 * @param variant - Type of loader visualization (default: 'spinner')
 * @param size - Size of the loader (default: 'md')
 * @param text - Optional text to display below/beside loader
 * @param className - Additional CSS classes
 * @param testId - Test identifier for testing
 */
export const Loader: React.FC<LoaderProps> = ({
  variant = 'spinner',
  size = 'md',
  text,
  className = '',
  testId = 'loader',
}) => {
  const ariaLabel = text || 'Loading';

  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div
            className={`loader-spinner loader-${size} ${className}`}
            role="status"
            aria-label={ariaLabel}
            aria-live="polite"
            data-testid={testId}
          >
            {!text && <span className="loader-sr-only">Loading...</span>}
            {text && <span className="loader-text">{text}</span>}
          </div>
        );

      case 'dots':
        return (
          <div
            className={`loader-dots loader-${size} ${className}`}
            role="status"
            aria-label={ariaLabel}
            aria-live="polite"
            data-testid={testId}
          >
            <div className="loader-dot" />
            <div className="loader-dot" />
            <div className="loader-dot" />
            {!text && <span className="loader-sr-only">Loading...</span>}
            {text && <span className="loader-text">{text}</span>}
          </div>
        );

      case 'inline':
        return (
          <div
            className={`loader-inline ${className}`}
            role="status"
            aria-label={ariaLabel}
            aria-live="polite"
            data-testid={testId}
          >
            <div className={`loader-spinner loader-${size}`}>
              <span className="loader-sr-only">Loading...</span>
            </div>
          </div>
        );

      case 'overlay':
        return (
          <div
            className={`loader-overlay ${className}`}
            role="status"
            aria-label={ariaLabel}
            aria-live="assertive"
            data-testid={testId}
          >
            <div className="loader-backdrop" />
            <div className={`loader-spinner loader-${size}`}>
              <span className="loader-sr-only">Loading...</span>
            </div>
            {text && <div className="loader-text">{text}</div>}
          </div>
        );

      default:
        return null;
    }
  };

  return renderLoader();
};
