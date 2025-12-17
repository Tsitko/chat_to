/**
 * UserMessage Component Tests.
 *
 * Tests for UserMessage component covering:
 * - Rendering content
 * - Timestamp formatting
 * - CSS classes
 * - Accessibility attributes
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserMessage } from '../UserMessage';

describe('UserMessage Component', () => {
  const defaultProps = {
    content: 'Hello, this is a user message',
    timestamp: '2025-01-10T10:00:00Z',
    messageId: 'msg-1',
  };

  describe('Rendering', () => {
    it('should render message content', () => {
      render(<UserMessage {...defaultProps} />);
      expect(screen.getByText('Hello, this is a user message')).toBeInTheDocument();
    });

    it('should render formatted timestamp', () => {
      render(<UserMessage {...defaultProps} />);
      // Timestamp should be formatted (e.g., "01:00 PM")
      const timestamp = screen.getByText(/\d{1,2}:\d{2}/);
      expect(timestamp).toBeInTheDocument();
    });

    it('should have correct test ID', () => {
      render(<UserMessage {...defaultProps} />);
      expect(screen.getByTestId('message-user-msg-1')).toBeInTheDocument();
    });

    it('should have user-message CSS class', () => {
      render(<UserMessage {...defaultProps} />);
      const messageElement = screen.getByTestId('message-user-msg-1');
      expect(messageElement).toHaveClass('user-message');
    });

    it('should have data-role attribute set to user', () => {
      render(<UserMessage {...defaultProps} />);
      const messageElement = screen.getByTestId('message-user-msg-1');
      expect(messageElement).toHaveAttribute('data-role', 'user');
    });
  });

  describe('Content Formatting', () => {
    it('should preserve line breaks', () => {
      const multilineContent = 'Line 1\nLine 2\nLine 3';
      render(<UserMessage {...defaultProps} content={multilineContent} />);
      const contentElement = screen.getByText(/Line 1/);
      expect(contentElement).toBeInTheDocument();
    });

    it('should handle empty content', () => {
      render(<UserMessage {...defaultProps} content="" />);
      expect(screen.getByTestId('message-user-msg-1')).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      const specialContent = 'Test & <html> "quotes" \'apostrophes\'';
      render(<UserMessage {...defaultProps} content={specialContent} />);
      expect(screen.getByText(/Test & <html>/)).toBeInTheDocument();
    });
  });

  describe('Timestamp Formatting', () => {
    it('should format timestamp in HH:MM format', () => {
      render(<UserMessage {...defaultProps} timestamp="2025-01-10T14:30:00Z" />);
      // Should show time in localized format
      const timestamp = screen.getByText(/\d{1,2}:\d{2}/);
      expect(timestamp).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should apply correct container class', () => {
      render(<UserMessage {...defaultProps} />);
      const messageElement = screen.getByTestId('message-user-msg-1');
      expect(messageElement).toHaveClass('user-message-container');
    });

    it('should have message class for backward compatibility', () => {
      render(<UserMessage {...defaultProps} />);
      const messageElement = screen.getByTestId('message-user-msg-1');
      expect(messageElement).toHaveClass('message');
    });
  });
});
