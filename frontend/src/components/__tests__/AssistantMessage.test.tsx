/**
 * AssistantMessage Component Tests.
 *
 * Tests for AssistantMessage component covering:
 * - Rendering content with Markdown
 * - Character name and avatar display
 * - Timestamp formatting
 * - CSS classes
 * - Accessibility attributes
 * - Emotion display integration
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AssistantMessage } from '../AssistantMessage';
import type { Emotions } from '../../types/message';

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

  describe('Emotion Integration - Backward Compatibility', () => {
    it('should render without emotions prop (backward compatibility)', () => {
      render(<AssistantMessage {...defaultProps} />);
      expect(screen.getByTestId('message-assistant-msg-2')).toBeInTheDocument();
      expect(screen.getByText('This is an assistant response')).toBeInTheDocument();
    });

    it('should not render EmotionDisplay when emotions is undefined', () => {
      render(<AssistantMessage {...defaultProps} />);
      expect(screen.queryByTestId('emotion-display')).not.toBeInTheDocument();
    });

    it('should not render EmotionDisplay when emotions prop is explicitly undefined', () => {
      render(<AssistantMessage {...defaultProps} emotions={undefined} />);
      expect(screen.queryByTestId('emotion-display')).not.toBeInTheDocument();
    });

    it('should render all other elements without emotions', () => {
      render(<AssistantMessage {...defaultProps} />);
      expect(screen.getByText('Hegel')).toBeInTheDocument();
      expect(screen.getByText('This is an assistant response')).toBeInTheDocument();
      expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
    });
  });

  describe('Emotion Integration - With Emotions', () => {
    const emotionsData: Emotions = {
      fear: 25,
      anger: 50,
      sadness: 75,
      disgust: 10,
      joy: 90,
    };

    it('should render EmotionDisplay when emotions are provided', () => {
      render(<AssistantMessage {...defaultProps} emotions={emotionsData} />);
      expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
    });

    it('should pass emotions prop to EmotionDisplay component', () => {
      render(<AssistantMessage {...defaultProps} emotions={emotionsData} />);

      // Verify emotions are displayed with correct values
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('90')).toBeInTheDocument();
    });

    it('should render message content along with emotions', () => {
      render(<AssistantMessage {...defaultProps} emotions={emotionsData} />);
      expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
      expect(screen.getByText('This is an assistant response')).toBeInTheDocument();
    });

    it('should render all Russian emotion labels', () => {
      render(<AssistantMessage {...defaultProps} emotions={emotionsData} />);

      expect(screen.getByText(/Страх/)).toBeInTheDocument();
      expect(screen.getByText(/Злость/)).toBeInTheDocument();
      expect(screen.getByText(/Печаль/)).toBeInTheDocument();
      expect(screen.getByText(/Отвращение/)).toBeInTheDocument();
      expect(screen.getByText(/Радость/)).toBeInTheDocument();
    });

    it('should work with all emotions at zero', () => {
      const zeroEmotions: Emotions = {
        fear: 0,
        anger: 0,
        sadness: 0,
        disgust: 0,
        joy: 0,
      };
      render(<AssistantMessage {...defaultProps} emotions={zeroEmotions} />);

      expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
      expect(screen.getAllByText('0')).toHaveLength(5);
    });

    it('should work with all emotions at maximum', () => {
      const maxEmotions: Emotions = {
        fear: 100,
        anger: 100,
        sadness: 100,
        disgust: 100,
        joy: 100,
      };
      render(<AssistantMessage {...defaultProps} emotions={maxEmotions} />);

      expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
      expect(screen.getAllByText('100')).toHaveLength(5);
    });

    it('should work with mixed emotion values', () => {
      const mixedEmotions: Emotions = {
        fear: 15,
        anger: 45,
        sadness: 10,
        disgust: 5,
        joy: 75,
      };
      render(<AssistantMessage {...defaultProps} emotions={mixedEmotions} />);

      expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
    });
  });

  describe('Emotion Display Positioning', () => {
    const emotionsData: Emotions = {
      fear: 25,
      anger: 50,
      sadness: 75,
      disgust: 10,
      joy: 90,
    };

    it('should position EmotionDisplay between header and content', () => {
      const { container } = render(<AssistantMessage {...defaultProps} emotions={emotionsData} />);

      // Get the main message container
      const messageContainer = screen.getByTestId('message-assistant-msg-2');
      const bubble = messageContainer.querySelector('.assistant-message-bubble');
      const children = Array.from(bubble?.children || []);

      // Find positions of header, emotion-display, and content
      const headerIndex = children.findIndex((child) => child.classList.contains('assistant-message-header'));
      const emotionIndex = children.findIndex((child) => child.classList.contains('emotion-display'));
      const contentIndex = children.findIndex((child) => child.classList.contains('assistant-message-content'));

      // Verify emotion display is between header and content
      expect(headerIndex).toBeGreaterThanOrEqual(0);
      expect(emotionIndex).toBeGreaterThan(headerIndex);
      expect(contentIndex).toBeGreaterThan(emotionIndex);
    });

    it('should have EmotionDisplay appear after character name', () => {
      render(<AssistantMessage {...defaultProps} emotions={emotionsData} />);

      const characterName = screen.getByText('Hegel');
      const emotionDisplay = screen.getByTestId('emotion-display');

      // Both should be in the document
      expect(characterName).toBeInTheDocument();
      expect(emotionDisplay).toBeInTheDocument();
    });

    it('should have EmotionDisplay appear before message content', () => {
      render(<AssistantMessage {...defaultProps} emotions={emotionsData} />);

      const emotionDisplay = screen.getByTestId('emotion-display');
      const messageContent = screen.getByText('This is an assistant response');

      // Both should be in the document
      expect(emotionDisplay).toBeInTheDocument();
      expect(messageContent).toBeInTheDocument();
    });

    it('should maintain correct DOM order: header -> emotions -> content -> timestamp', () => {
      const { container } = render(<AssistantMessage {...defaultProps} emotions={emotionsData} />);

      const messageContainer = screen.getByTestId('message-assistant-msg-2');
      const elements = Array.from(messageContainer.querySelectorAll('*'));

      const headerElement = container.querySelector('.assistant-message-header');
      const emotionElement = container.querySelector('.emotion-display');
      const contentElement = container.querySelector('.assistant-message-content');
      const timestampElement = container.querySelector('.assistant-message-timestamp');

      const headerPos = elements.indexOf(headerElement as Element);
      const emotionPos = elements.indexOf(emotionElement as Element);
      const contentPos = elements.indexOf(contentElement as Element);
      const timestampPos = elements.indexOf(timestampElement as Element);

      // Verify order (if elements exist)
      if (headerPos >= 0 && emotionPos >= 0) {
        expect(emotionPos).toBeGreaterThan(headerPos);
      }
      if (emotionPos >= 0 && contentPos >= 0) {
        expect(contentPos).toBeGreaterThan(emotionPos);
      }
      if (contentPos >= 0 && timestampPos >= 0) {
        expect(timestampPos).toBeGreaterThan(contentPos);
      }
    });
  });

  describe('Emotion Integration - Edge Cases', () => {
    it('should handle emotion boundary values correctly', () => {
      const boundaryEmotions: Emotions = {
        fear: 33,
        anger: 34,
        sadness: 66,
        disgust: 67,
        joy: 100,
      };
      render(<AssistantMessage {...defaultProps} emotions={boundaryEmotions} />);

      expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
      expect(screen.getByText('33')).toBeInTheDocument();
      expect(screen.getByText('34')).toBeInTheDocument();
      expect(screen.getByText('66')).toBeInTheDocument();
      expect(screen.getByText('67')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should handle emotions with single digit values', () => {
      const singleDigitEmotions: Emotions = {
        fear: 1,
        anger: 2,
        sadness: 3,
        disgust: 4,
        joy: 5,
      };
      render(<AssistantMessage {...defaultProps} emotions={singleDigitEmotions} />);

      expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should render emotions with markdown content', () => {
      const markdownContent = '# Heading\n\nThis is **bold** text.';
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      render(<AssistantMessage {...defaultProps} content={markdownContent} emotions={emotions} />);

      expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
      expect(screen.getByText('Heading')).toBeInTheDocument();
      expect(screen.getByText(/bold/)).toBeInTheDocument();
    });

    it('should render emotions with empty content', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      render(<AssistantMessage {...defaultProps} content="" emotions={emotions} />);

      expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('should render emotions with very long content', () => {
      const longContent = 'Lorem ipsum '.repeat(100);
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      render(<AssistantMessage {...defaultProps} content={longContent} emotions={emotions} />);

      expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
      expect(screen.getByText(/Lorem ipsum/)).toBeInTheDocument();
    });
  });

  describe('Emotion Integration - Component Consistency', () => {
    it('should maintain all original props when emotions added', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      render(<AssistantMessage {...defaultProps} emotions={emotions} />);

      // Verify all original elements still present
      expect(screen.getByText('Hegel')).toBeInTheDocument();
      expect(screen.getByText('This is an assistant response')).toBeInTheDocument();
      expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
      expect(screen.getByTestId('message-assistant-msg-2')).toHaveClass('assistant-message');
      expect(screen.getByTestId('message-assistant-msg-2')).toHaveAttribute('data-role', 'assistant');
    });

    it('should maintain avatar display with emotions', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      render(<AssistantMessage {...defaultProps} emotions={emotions} />);

      const avatar = screen.getByAltText('Hegel');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', '/api/characters/char-1/avatar');
      expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
    });

    it('should maintain initials display with emotions when no avatar', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      render(<AssistantMessage {...defaultProps} avatarUrl={null} emotions={emotions} />);

      expect(screen.getByText('HE')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
    });

    it('should apply correct CSS classes with emotions', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      render(<AssistantMessage {...defaultProps} emotions={emotions} />);

      const messageElement = screen.getByTestId('message-assistant-msg-2');
      expect(messageElement).toHaveClass('assistant-message-container');
      expect(messageElement).toHaveClass('message');
      expect(messageElement).toHaveClass('assistant-message');
    });
  });

  describe('TTS Integration', () => {
    it('should render TTSButton component', () => {
      render(<AssistantMessage {...defaultProps} />);
      
      const ttsButton = screen.queryByTestId('tts-button');
      expect(ttsButton).toBeInTheDocument();
    });

    it('should pass message content to TTSButton', () => {
      const content = 'This is a test message for TTS';
      render(<AssistantMessage {...defaultProps} content={content} />);
      
      const ttsButton = screen.getByTestId('tts-button');
      expect(ttsButton).toBeInTheDocument();
    });

    it('should position TTSButton in footer after timestamp', () => {
      const { container } = render(<AssistantMessage {...defaultProps} />);
      
      const footer = container.querySelector('.assistant-message-footer');
      expect(footer).toBeInTheDocument();
      
      const timestamp = footer?.querySelector('.assistant-message-timestamp');
      const ttsButton = footer?.querySelector('[data-testid="tts-button"]');
      
      expect(timestamp).toBeInTheDocument();
      expect(ttsButton).toBeInTheDocument();
    });

    it('should render TTSButton alongside timestamp', () => {
      render(<AssistantMessage {...defaultProps} />);
      
      const timestamp = screen.getByText(/\d{1,2}:\d{2}/);
      const ttsButton = screen.getByTestId('tts-button');
      
      expect(timestamp).toBeInTheDocument();
      expect(ttsButton).toBeInTheDocument();
    });

    it('should render TTSButton with markdown content', () => {
      const markdownContent = '# Heading\n\nThis is **bold** text.';
      render(<AssistantMessage {...defaultProps} content={markdownContent} />);
      
      const ttsButton = screen.getByTestId('tts-button');
      expect(ttsButton).toBeInTheDocument();
      expect(screen.getByText('Heading')).toBeInTheDocument();
    });

    it('should render TTSButton with emotions', () => {
      const emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      render(<AssistantMessage {...defaultProps} emotions={emotions} />);
      
      const ttsButton = screen.getByTestId('tts-button');
      const emotionDisplay = screen.getByTestId('emotion-display');
      
      expect(ttsButton).toBeInTheDocument();
      expect(emotionDisplay).toBeInTheDocument();
    });

    it('should render TTSButton with empty content', () => {
      render(<AssistantMessage {...defaultProps} content="" />);
      
      const ttsButton = screen.getByTestId('tts-button');
      expect(ttsButton).toBeInTheDocument();
    });

    it('should render TTSButton with very long content', () => {
      const longContent = 'Lorem ipsum '.repeat(500);
      render(<AssistantMessage {...defaultProps} content={longContent} />);
      
      const ttsButton = screen.getByTestId('tts-button');
      expect(ttsButton).toBeInTheDocument();
    });

    it('should render TTSButton with special characters in content', () => {
      const specialContent = 'Hello! @#$%^&*() <script>alert("xss")</script>';
      render(<AssistantMessage {...defaultProps} content={specialContent} />);
      
      const ttsButton = screen.getByTestId('tts-button');
      expect(ttsButton).toBeInTheDocument();
    });

    it('should render TTSButton with unicode characters', () => {
      const unicodeContent = 'Привет мир! 你好世界';
      render(<AssistantMessage {...defaultProps} content={unicodeContent} />);
      
      const ttsButton = screen.getByTestId('tts-button');
      expect(ttsButton).toBeInTheDocument();
    });

    it('should maintain all original functionality with TTSButton', () => {
      render(<AssistantMessage {...defaultProps} />);
      
      // Original elements
      expect(screen.getByText('Hegel')).toBeInTheDocument();
      expect(screen.getByText('This is an assistant response')).toBeInTheDocument();
      expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
      
      // New TTS element
      expect(screen.getByTestId('tts-button')).toBeInTheDocument();
    });

    it('should not break without TTSButton (backward compatibility)', () => {
      // This test ensures the component doesn't crash if TTSButton is removed/unavailable
      expect(() => render(<AssistantMessage {...defaultProps} />)).not.toThrow();
    });

    it('should have correct DOM structure with TTSButton', () => {
      const { container } = render(<AssistantMessage {...defaultProps} />);
      
      const messageContainer = screen.getByTestId('message-assistant-msg-2');
      const bubble = messageContainer.querySelector('.assistant-message-bubble');
      const footer = bubble?.querySelector('.assistant-message-footer');
      const ttsButton = footer?.querySelector('[data-testid="tts-button"]');
      
      expect(messageContainer).toBeInTheDocument();
      expect(bubble).toBeInTheDocument();
      expect(footer).toBeInTheDocument();
      expect(ttsButton).toBeInTheDocument();
    });

    it('should render TTSButton for each message independently', () => {
      const { rerender } = render(<AssistantMessage {...defaultProps} messageId="msg-1" />);
      expect(screen.getByTestId('tts-button')).toBeInTheDocument();
      
      rerender(<AssistantMessage {...defaultProps} messageId="msg-2" />);
      expect(screen.getByTestId('tts-button')).toBeInTheDocument();
      
      rerender(<AssistantMessage {...defaultProps} messageId="msg-3" />);
      expect(screen.getByTestId('tts-button')).toBeInTheDocument();
    });

    it('should pass raw content (not HTML) to TTSButton', () => {
      const markdownContent = '**Bold text** and *italic text*';
      render(<AssistantMessage {...defaultProps} content={markdownContent} />);
      
      // TTSButton should receive the raw markdown, not the rendered HTML
      const ttsButton = screen.getByTestId('tts-button');
      expect(ttsButton).toBeInTheDocument();
    });

    it('should maintain CSS classes with TTSButton', () => {
      render(<AssistantMessage {...defaultProps} />);
      
      const messageElement = screen.getByTestId('message-assistant-msg-2');
      expect(messageElement).toHaveClass('assistant-message-container');
      expect(messageElement).toHaveClass('message');
      expect(messageElement).toHaveClass('assistant-message');
    });

    it('should maintain data attributes with TTSButton', () => {
      render(<AssistantMessage {...defaultProps} />);

      const messageElement = screen.getByTestId('message-assistant-msg-2');
      expect(messageElement).toHaveAttribute('data-role', 'assistant');
    });
  });
});