/**
 * ChatWindow Component Tests.
 *
 * Comprehensive tests for ChatWindow component covering:
 * - Rendering messages
 * - Auto-scrolling behavior
 * - Empty state
 * - Loading state
 * - Message formatting
 * - User vs assistant message display
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ChatWindow } from '../ChatWindow';
import { useMessageStoreEnhanced } from '../../store/messageStoreEnhanced';
import {
  mockMessages,
  mockUserMessage1,
  mockAssistantMessage1,
  mockUserMessage2,
  mockAssistantMessage2,
} from '../../tests/mockData';

// Mock the message store
vi.mock('../../store/messageStoreEnhanced');
const mockedUseMessageStore = vi.mocked(useMessageStoreEnhanced);

describe('ChatWindow Component', () => {
  const mockFetchMessages = vi.fn();
  const mockSendMessage = vi.fn();
  const mockClearMessages = vi.fn();

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementation for enhanced store
    mockedUseMessageStore.mockReturnValue({
      messages: {},
      loadingStates: {},
      isLoading: vi.fn(() => false), // Function that returns false by default
      getLoadingState: vi.fn(() => ({ state: 'idle' })),
      clearError: vi.fn(),
      fetchMessages: mockFetchMessages,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
    });

    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render chat window container', () => {
      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      const container = screen.getByTestId('chat-window') || screen.getByRole('region');
      expect(container).toBeInTheDocument();
    });

    it('should render all messages for character', () => {
      // Arrange
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': mockMessages },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      expect(screen.getByText('What is dialectics?')).toBeInTheDocument();
      expect(
        screen.getByText(/Dialectics is the method of reasoning/)
      ).toBeInTheDocument();
      expect(screen.getByText('Can you explain thesis-antithesis-synthesis?')).toBeInTheDocument();
    });

    it('should render messages in correct order (chronological)', () => {
      // Arrange
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': mockMessages },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      const messageElements = screen.getAllByTestId(/message-/);
      expect(messageElements[0]).toHaveTextContent('What is dialectics?');
      expect(messageElements[1]).toHaveTextContent(/Dialectics is the method/);
    });

    it('should distinguish between user and assistant messages visually', () => {
      // Arrange
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': mockMessages },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      const userMessages = screen.getAllByTestId(/message-user/);
      const assistantMessages = screen.getAllByTestId(/message-assistant/);
      expect(userMessages.length).toBe(2);
      expect(assistantMessages.length).toBe(2);
      expect(userMessages[0]).toHaveClass('user-message');
      expect(assistantMessages[0]).toHaveClass('assistant-message');
    });

    it('should display message timestamps', () => {
      // Arrange
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': [mockUserMessage1] },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      // Timestamps should be formatted (e.g., "01:00 PM" or similar)
      const timestamp = screen.getByText(/\d{1,2}:\d{2}\s*(AM|PM)?/i);
      expect(timestamp).toBeInTheDocument();
    });

    it('should handle character without messages', () => {
      // Arrange
      mockedUseMessageStore.mockReturnValue({
        messages: {},
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-new" />);

      // Assert
      expect(screen.queryByTestId(/message-/)).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state message when no messages exist', () => {
      // Arrange
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': [] },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
    });

    it('should suggest starting conversation in empty state', () => {
      // Arrange
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': [] },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator when fetching messages', () => {
      // Arrange
      const mockIsLoading = vi.fn((charId: string, operation: string) => {
        return operation === 'fetch';
      });
      mockedUseMessageStore.mockReturnValue({
        messages: {},
        loadingStates: {},
        isLoading: mockIsLoading,
        getLoadingState: vi.fn(() => ({ state: 'loading' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      // The loading-state div should be present (even without visible text)
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    it('should not display messages while loading', () => {
      // Arrange
      const mockIsLoading = vi.fn((charId: string, operation: string) => {
        return operation === 'fetch';
      });
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': mockMessages },
        loadingStates: {},
        isLoading: mockIsLoading,
        getLoadingState: vi.fn(() => ({ state: 'loading' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      expect(screen.queryByText('What is dialectics?')).not.toBeInTheDocument();
    });

    it('should show typing indicator when assistant is responding', () => {
      // Arrange
      const mockIsLoading = vi.fn((charId: string, operation: string) => {
        return operation === 'send';
      });
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': [mockUserMessage1] },
        loadingStates: {},
        isLoading: mockIsLoading,
        getLoadingState: vi.fn(() => ({ state: 'loading' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    });
  });

  describe('Auto-Scrolling', () => {
    it('should scroll to bottom when messages are loaded', async () => {
      // Arrange
      const scrollIntoViewMock = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': mockMessages },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });
    });

    it('should scroll to bottom when new message is added', async () => {
      // Arrange
      const scrollIntoViewMock = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      const { rerender } = render(<ChatWindow characterId="char-1" />);

      // Initial state
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': [mockUserMessage1] },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Update with new message
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': [mockUserMessage1, mockAssistantMessage1] },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      rerender(<ChatWindow characterId="char-1" />);

      // Assert
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });
    });

    it('should scroll smoothly', () => {
      // Arrange
      const scrollIntoViewMock = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': mockMessages },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'end',
      });
    });
  });

  describe('Character Switching', () => {
    it('should fetch messages when characterId changes', () => {
      // Arrange
      const { rerender } = render(<ChatWindow characterId="char-1" />);

      // Act
      rerender(<ChatWindow characterId="char-2" />);

      // Assert
      expect(mockFetchMessages).toHaveBeenCalledWith('char-1');
      expect(mockFetchMessages).toHaveBeenCalledWith('char-2');
      expect(mockFetchMessages).toHaveBeenCalledTimes(2);
    });

    it('should display messages for the current character only', () => {
      // Arrange
      mockedUseMessageStore.mockReturnValue({
        messages: {
          'char-1': [mockUserMessage1],
          'char-2': [mockUserMessage2],
        },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      expect(screen.getByText('What is dialectics?')).toBeInTheDocument();
      expect(screen.queryByText('Can you explain thesis-antithesis-synthesis?')).not.toBeInTheDocument();
    });

    it('should clear previous messages when switching characters', () => {
      // Arrange
      const { rerender } = render(<ChatWindow characterId="char-1" />);

      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': [mockUserMessage1] },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });
      rerender(<ChatWindow characterId="char-1" />);

      // Act - switch to char-2
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-2': [mockUserMessage2] },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });
      rerender(<ChatWindow characterId="char-2" />);

      // Assert
      expect(screen.queryByText('What is dialectics?')).not.toBeInTheDocument();
      expect(screen.getByText('Can you explain thesis-antithesis-synthesis?')).toBeInTheDocument();
    });
  });

  describe('Message Formatting', () => {
    it('should preserve line breaks in messages', () => {
      // Arrange
      const multilineMessage = {
        ...mockUserMessage1,
        content: 'Line 1\nLine 2\nLine 3',
      };
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': [multilineMessage] },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      const messageElements = screen.getAllByText(/Line 1/);
      expect(messageElements.length).toBeGreaterThan(0);
      const messageElement = messageElements[0];
      expect(messageElement.innerHTML).toContain('Line 1');
      expect(messageElement.innerHTML).toContain('Line 2');
    });

    it('should handle extremely long messages', () => {
      // Arrange
      const longMessage = {
        ...mockUserMessage1,
        content: 'a'.repeat(10000),
      };
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': [longMessage] },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act & Assert - should not crash
      expect(() => render(<ChatWindow characterId="char-1" />)).not.toThrow();
    });

    it('should handle special characters in messages', () => {
      // Arrange
      const specialMessage = {
        ...mockUserMessage1,
        content: 'Test & <html> "quotes" \'apostrophes\'',
      };
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': [specialMessage] },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      const elements = screen.getAllByText(/Test & <html>/);
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should handle empty message content gracefully', () => {
      // Arrange
      const emptyMessage = {
        ...mockUserMessage1,
        content: '',
      };
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': [emptyMessage] },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act & Assert - should not crash
      expect(() => render(<ChatWindow characterId="char-1" />)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large message history (100+ messages)', () => {
      // Arrange
      const manyMessages = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: `Message ${i}`,
        created_at: `2025-01-10T10:00:${String(i).padStart(2, '0')}Z`,
      }));
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': manyMessages },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act & Assert - should render without crashing
      expect(() => render(<ChatWindow characterId="char-1" />)).not.toThrow();
    });

    it('should handle rapid character switching', () => {
      // Arrange
      const { rerender } = render(<ChatWindow characterId="char-1" />);

      // Act - rapidly switch characters
      for (let i = 1; i <= 10; i++) {
        rerender(<ChatWindow characterId={`char-${i}`} />);
      }

      // Assert
      expect(mockFetchMessages).toHaveBeenCalledTimes(10);
    });

    it('should handle null or undefined characterId gracefully', () => {
      // Act & Assert - should not crash
      expect(() => render(<ChatWindow characterId={null as any} />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      // Arrange
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': mockMessages },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      const container = screen.getByRole('region') || screen.getByTestId('chat-window');
      const ariaLabel = container.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/chat/i);
    });

    it('should mark user messages with appropriate role', () => {
      // Arrange
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': [mockUserMessage1] },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      const userMessage = screen.getByTestId('message-user-msg-1');
      expect(userMessage).toHaveAttribute('data-role', 'user');
    });

    it('should mark assistant messages with appropriate role', () => {
      // Arrange
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': [mockAssistantMessage1] },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      const assistantMessage = screen.getByTestId('message-assistant-msg-2');
      expect(assistantMessage).toHaveAttribute('data-role', 'assistant');
    });

    it('should provide screen reader announcements for new messages', () => {
      // Arrange
      mockedUseMessageStore.mockReturnValue({
        messages: { 'char-1': [mockUserMessage1] },
        loadingStates: {},
        isLoading: vi.fn(() => false),
        getLoadingState: vi.fn(() => ({ state: 'idle' })),
        clearError: vi.fn(),
        fetchMessages: mockFetchMessages,
        sendMessage: mockSendMessage,
        clearMessages: mockClearMessages,
      });

      // Act
      render(<ChatWindow characterId="char-1" />);

      // Assert
      const liveRegion = screen.queryByRole('status');
      expect(liveRegion).toBeInTheDocument();
    });
  });
});
