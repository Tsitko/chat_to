/**
 * AssistantMessage Component Tests.
 *
 * Tests for AssistantMessage component covering:
 * - Rendering content with Markdown
 * - Character name and avatar display
 * - Timestamp formatting
 * - CSS classes
 * - Accessibility attributes
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AssistantMessage } from '../AssistantMessage';

describe('AssistantMessage Component', () => {
  const defaultProps = {
    content: 'This is an assistant response',
    timestamp: '2025-01-10T10:00:00Z',
    characterName: 'Hegel',
    avatarUrl: '/api/characters/char-1/avatar',
    messageId: 'msg-2',
  };

  describe('Rendering', () => {
    it('should render message content', () => {
      render(<AssistantMessage {...defaultProps} />);
      expect(screen.getByText('This is an assistant response')).toBeInTheDocument();
    });

    it('should render character name', () => {
      render(<AssistantMessage {...defaultProps} />);
      expect(screen.getByText('Hegel')).toBeInTheDocument();
    });

    it('should render formatted timestamp', () => {
      render(<AssistantMessage {...defaultProps} />);
      // Timestamp should be formatted (e.g., "01:00 PM")
      const timestamp = screen.getByText(/\d{1,2}:\d{2}/);
      expect(timestamp).toBeInTheDocument();
    });

    it('should have correct test ID', () => {
      render(<AssistantMessage {...defaultProps} />);
      expect(screen.getByTestId('message-assistant-msg-2')).toBeInTheDocument();
    });

    it('should have assistant-message CSS class', () => {
      render(<AssistantMessage {...defaultProps} />);
      const messageElement = screen.getByTestId('message-assistant-msg-2');
      expect(messageElement).toHaveClass('assistant-message');
    });

    it('should have data-role attribute set to assistant', () => {
      render(<AssistantMessage {...defaultProps} />);
      const messageElement = screen.getByTestId('message-assistant-msg-2');
      expect(messageElement).toHaveAttribute('data-role', 'assistant');
    });
  });

  describe('Avatar Display', () => {
    it('should render avatar image when avatarUrl is provided', () => {
      render(<AssistantMessage {...defaultProps} />);
      const avatar = screen.getByAltText('Hegel');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', '/api/characters/char-1/avatar');
    });

    it('should render initials when avatarUrl is null', () => {
      render(<AssistantMessage {...defaultProps} avatarUrl={null} />);
      expect(screen.getByText('HE')).toBeInTheDocument();
    });

    it('should render initials when avatarUrl is undefined', () => {
      render(<AssistantMessage {...defaultProps} avatarUrl={undefined} />);
      expect(screen.getByText('HE')).toBeInTheDocument();
    });

    it('should handle single-word name for initials', () => {
      render(<AssistantMessage {...defaultProps} characterName="Socrates" avatarUrl={null} />);
      expect(screen.getByText('SO')).toBeInTheDocument();
    });

    it('should handle multi-word name for initials', () => {
      render(<AssistantMessage {...defaultProps} characterName="Karl Marx" avatarUrl={null} />);
      expect(screen.getByText('KM')).toBeInTheDocument();
    });
  });

  describe('Markdown Rendering', () => {
    it('should render markdown headings', () => {
      const markdownContent = '# Heading 1\n## Heading 2';
      render(<AssistantMessage {...defaultProps} content={markdownContent} />);
      expect(screen.getByText('Heading 1')).toBeInTheDocument();
      expect(screen.getByText('Heading 2')).toBeInTheDocument();
    });

    it('should render markdown bold text', () => {
      const markdownContent = 'This is **bold** text';
      render(<AssistantMessage {...defaultProps} content={markdownContent} />);
      expect(screen.getByText(/bold/)).toBeInTheDocument();
    });

    it('should render markdown italic text', () => {
      const markdownContent = 'This is *italic* text';
      render(<AssistantMessage {...defaultProps} content={markdownContent} />);
      expect(screen.getByText(/italic/)).toBeInTheDocument();
    });

    it('should render markdown lists', () => {
      const markdownContent = '- Item 1\n- Item 2\n- Item 3';
      render(<AssistantMessage {...defaultProps} content={markdownContent} />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should render markdown code blocks', () => {
      const markdownContent = '```\nconst x = 5;\n```';
      render(<AssistantMessage {...defaultProps} content={markdownContent} />);
      expect(screen.getByText(/const x = 5/)).toBeInTheDocument();
    });

    it('should render inline code', () => {
      const markdownContent = 'Use `console.log()` to debug';
      render(<AssistantMessage {...defaultProps} content={markdownContent} />);
      expect(screen.getByText(/console.log\(\)/)).toBeInTheDocument();
    });

    it('should render markdown links', () => {
      const markdownContent = '[Click here](https://example.com)';
      render(<AssistantMessage {...defaultProps} content={markdownContent} />);
      const link = screen.getByText('Click here');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', 'https://example.com');
    });
  });

  describe('Content Formatting', () => {
    it('should handle empty content', () => {
      render(<AssistantMessage {...defaultProps} content="" />);
      expect(screen.getByTestId('message-assistant-msg-2')).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      const specialContent = 'Test & <html> "quotes" \'apostrophes\'';
      render(<AssistantMessage {...defaultProps} content={specialContent} />);
      expect(screen.getByText(/Test & <html>/)).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should apply correct container class', () => {
      render(<AssistantMessage {...defaultProps} />);
      const messageElement = screen.getByTestId('message-assistant-msg-2');
      expect(messageElement).toHaveClass('assistant-message-container');
    });

    it('should have message class for backward compatibility', () => {
      render(<AssistantMessage {...defaultProps} />);
      const messageElement = screen.getByTestId('message-assistant-msg-2');
      expect(messageElement).toHaveClass('message');
    });
  });
});
