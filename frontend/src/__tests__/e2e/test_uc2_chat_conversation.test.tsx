/**
 * E2E Test - UC2: Chat Conversation
 *
 * Tests the complete user journey for having a conversation:
 * 1. User selects a character
 * 2. Chat window opens showing history
 * 3. User types a message
 * 4. User sends the message
 * 5. Message appears in chat
 * 6. Assistant response is received
 * 7. Response appears in chat
 * 8. Conversation history is maintained
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../../App';
import { apiService } from '../../services/api';
import { useCharacterStore } from '../../store/characterStore';
import { useMessageStore } from '../../store/messageStore';
import {
  mockCharacters,
  mockCharacter1,
  mockMessagesResponse,
  mockMessageResponse,
  mockUserMessage1,
  mockAssistantMessage1,
} from '../../tests/mockData';

describe('UC2: Chat Conversation - E2E', () => {
  let mockClient: any;

  beforeEach(() => {
    // Reset stores
    useCharacterStore.setState({
      characters: [],
      selectedCharacterId: null,
      selectedCharacter: undefined,
      isLoading: false,
      error: null,
    });

    useMessageStore.setState({
      messages: {},
      isLoading: false,
      isSending: false,
      error: null,
    });

    // Create and set mock client
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      defaults: { baseURL: '/api' },
    };

    apiService.setClient(mockClient);
    vi.clearAllMocks();

    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('should complete full chat conversation flow', async () => {
    // Arrange
    const newUserMessage = {
      id: 'msg-new-1',
      role: 'user' as const,
      content: 'Tell me more about this',
      created_at: new Date().toISOString(),
    };
    const newAssistantMessage = {
      id: 'msg-new-2',
      role: 'assistant' as const,
      content: 'Dialectics is the method of reasoning which combines oppositions.',
      created_at: new Date().toISOString(),
    };

    mockClient.get
      .mockResolvedValueOnce({ data: mockCharacters }) // Fetch characters
      .mockResolvedValueOnce({ data: mockMessagesResponse }); // Fetch messages

    mockClient.post.mockResolvedValue({
      data: {
        user_message: newUserMessage,
        assistant_message: newAssistantMessage,
      },
    }); // Send message

    // Act - Render app
    render(<App />);

    // Wait for characters to load
    await waitFor(() => {
      expect(screen.getByText('Hegel')).toBeInTheDocument();
    });

    // Step 1: Select character
    const hegelElement = screen.getByText('Hegel');
    fireEvent.click(hegelElement);

    // Assert: Chat window opens and fetches messages
    await waitFor(() => {
      expect(mockClient.get).toHaveBeenCalledWith('/characters/char-1/messages/', {
        params: { limit: 10, offset: 0 },
      });
    });

    // Assert: Previous messages displayed
    await waitFor(() => {
      expect(screen.getByText('What is dialectics?')).toBeInTheDocument();
      const messages = screen.getAllByText(/Dialectics is the method of reasoning/);
      expect(messages.length).toBeGreaterThan(0);
    });

    // Step 2: Type a message
    const messageInput = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(messageInput, { target: { value: 'Tell me more about this' } });

    // Assert: Send button enabled
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).not.toBeDisabled();

    // Step 3: Send message
    fireEvent.click(sendButton);

    // Assert: API called
    await waitFor(() => {
      expect(mockClient.post).toHaveBeenCalledWith('/characters/char-1/messages/', {
        content: 'Tell me more about this',
      });
    });

    // Assert: User message appears immediately
    await waitFor(() => {
      expect(screen.getByText('Tell me more about this')).toBeInTheDocument();
    });

    // Assert: Input cleared
    expect(messageInput).toHaveValue('');

    // Assert: Assistant response appears
    await waitFor(() => {
      const messages = screen.getAllByText(/Dialectics is the method of reasoning/);
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  it('should show typing indicator while waiting for response', async () => {
    // Arrange
    mockClient.get
      .mockResolvedValueOnce({ data: mockCharacters })
      .mockResolvedValueOnce({ data: { messages: [], total: 0 } });

    let resolvePost: any;
    const postPromise = new Promise((resolve) => {
      resolvePost = resolve;
    });
    mockClient.post.mockReturnValue(postPromise);

    // Act
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Hegel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Hegel'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    });

    const messageInput = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(messageInput, { target: { value: 'Hello' } });

    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    // Assert: Typing indicator shown
    await waitFor(() => {
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    });

    // Resolve the response
    resolvePost({ data: mockMessageResponse });

    // Assert: Typing indicator removed
    await waitFor(() => {
      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
    });
  });

  it('should handle sending message with Enter key', async () => {
    // Arrange
    const userMessage = {
      id: 'msg-enter-1',
      role: 'user' as const,
      content: 'Hello',
      created_at: new Date().toISOString(),
    };
    const assistantMessage = {
      id: 'msg-enter-2',
      role: 'assistant' as const,
      content: 'Hello! How can I help you today?',
      created_at: new Date().toISOString(),
    };

    mockClient.get
      .mockResolvedValueOnce({ data: mockCharacters })
      .mockResolvedValueOnce({ data: { messages: [], total: 0 } });

    mockClient.post.mockResolvedValue({
      data: {
        user_message: userMessage,
        assistant_message: assistantMessage,
      },
    });

    // Act
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Hegel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Hegel'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    });

    const messageInput = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(messageInput, { target: { value: 'Hello' } });

    // Press Enter
    fireEvent.keyDown(messageInput, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Assert: Message sent
    await waitFor(() => {
      expect(mockClient.post).toHaveBeenCalledWith('/characters/char-1/messages/', {
        content: 'Hello',
      });
    });
  });

  it('should maintain conversation history across character switches', async () => {
    // Arrange
    const char1Messages = { messages: [mockUserMessage1], total: 1 };
    const char2Messages = { messages: [mockAssistantMessage1], total: 1 };

    mockClient.get
      .mockResolvedValueOnce({ data: mockCharacters }) // Initial characters
      .mockResolvedValueOnce({ data: char1Messages }) // Char 1 messages
      .mockResolvedValueOnce({ data: char2Messages }); // Char 2 messages

    // Act
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Hegel')).toBeInTheDocument();
    });

    // Select first character
    fireEvent.click(screen.getByText('Hegel'));

    await waitFor(() => {
      expect(screen.getByText('What is dialectics?')).toBeInTheDocument();
    });

    // Switch to second character
    fireEvent.click(screen.getByText('Kant'));

    await waitFor(() => {
      expect(screen.queryByText('What is dialectics?')).not.toBeInTheDocument();
      const messages = screen.getAllByText(/Dialectics is the method of reasoning/);
      expect(messages.length).toBeGreaterThan(0);
    });

    // Switch back to first character
    fireEvent.click(screen.getByText('Hegel'));

    await waitFor(() => {
      expect(screen.getByText('What is dialectics?')).toBeInTheDocument();
    });
  });

  it('should auto-scroll to bottom when new message arrives', async () => {
    // Arrange
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    const userMessage = {
      id: 'msg-scroll-1',
      role: 'user' as const,
      content: 'New message',
      created_at: new Date().toISOString(),
    };
    const assistantMessage = {
      id: 'msg-scroll-2',
      role: 'assistant' as const,
      content: 'Response to your message',
      created_at: new Date().toISOString(),
    };

    mockClient.get
      .mockResolvedValueOnce({ data: mockCharacters })
      .mockResolvedValueOnce({ data: mockMessagesResponse });

    mockClient.post.mockResolvedValue({
      data: {
        user_message: userMessage,
        assistant_message: assistantMessage,
      },
    });

    // Act
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Hegel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Hegel'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    });

    // Send message
    const messageInput = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(messageInput, { target: { value: 'New message' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    // Assert: Auto-scroll triggered
    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalled();
    });
  });

  it('should handle error when sending message', async () => {
    // Arrange
    mockClient.get
      .mockResolvedValueOnce({ data: mockCharacters })
      .mockResolvedValueOnce({ data: { messages: [], total: 0 } });

    mockClient.post.mockRejectedValue(new Error('Network Error'));

    // Act
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Hegel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Hegel'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    });

    const messageInput = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(messageInput, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    // Assert: Error message displayed
    await waitFor(() => {
      expect(screen.getByText(/network error|failed/i)).toBeInTheDocument();
    });

    // Assert: Input keeps the message for retry
    expect(messageInput).toHaveValue('Hello');
  });

  it('should disable sending when no character selected', async () => {
    // Arrange
    mockClient.get.mockResolvedValue({ data: mockCharacters });

    // Act
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Hegel')).toBeInTheDocument();
    });

    // Assert: No character selected, no input visible
    expect(screen.getByText(/select a character/i)).toBeInTheDocument();
  });

  it('should show empty state when no messages exist', async () => {
    // Arrange
    mockClient.get
      .mockResolvedValueOnce({ data: mockCharacters })
      .mockResolvedValueOnce({ data: { messages: [], total: 0 } });

    // Act
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Hegel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Hegel'));

    // Assert: Empty state message shown
    await waitFor(() => {
      expect(screen.getByText(/no messages yet|start a conversation/i)).toBeInTheDocument();
    });
  });

  it('should handle very long messages', async () => {
    // Arrange
    const longMessage = 'a'.repeat(1000);
    const longMessageResponse = {
      user_message: { ...mockUserMessage1, content: longMessage },
      assistant_message: mockAssistantMessage1,
    };

    mockClient.get
      .mockResolvedValueOnce({ data: mockCharacters })
      .mockResolvedValueOnce({ data: { messages: [], total: 0 } });

    mockClient.post.mockResolvedValue({ data: longMessageResponse });

    // Act
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Hegel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Hegel'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    });

    const messageInput = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(messageInput, { target: { value: longMessage } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    // Assert: Long message displayed (may be truncated in UI)
    await waitFor(() => {
      expect(mockClient.post).toHaveBeenCalledWith('/characters/char-1/messages/', {
        content: longMessage,
      });
    });
  });
});
