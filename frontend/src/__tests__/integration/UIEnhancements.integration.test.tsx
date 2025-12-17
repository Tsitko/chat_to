/**
 * Integration tests for UI improvements.
 *
 * Test Coverage:
 * - Modal with form and loading states
 * - IndexingStatusDisplay with real hook
 * - Character creation flow with loading indicators
 * - Message sending with typing indicator
 * - Multiple components working together
 * - Store integration with components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Modal } from '../../components/Modal';
import { Loader } from '../../components/Loader';
import { ProgressBar } from '../../components/ProgressBar';
import { IndexingStatusDisplay } from '../../components/IndexingStatusDisplay';
import { useCharacterStoreEnhanced } from '../../store/characterStoreEnhanced';
import { useMessageStoreEnhanced } from '../../store/messageStoreEnhanced';
import { apiService } from '../../services/api';
import type { Character } from '../../types/character';

// Mock API service
vi.mock('../../services/api');

describe('UI Enhancements Integration Tests', () => {
  const mockApiService = vi.mocked(apiService);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Modal with Loading State', () => {
    it('should prevent closing while loading', async () => {
      const onClose = vi.fn();
      let isLoading = false;

      const TestComponent = () => {
        const [loading, setLoading] = React.useState(isLoading);

        return (
          <Modal
            isOpen={true}
            onClose={onClose}
            title="Test Modal"
            preventCloseWhileLoading={true}
            isLoading={loading}
          >
            <button
              onClick={() => setLoading(true)}
              data-testid="start-loading"
            >
              Start Loading
            </button>
          </Modal>
        );
      };

      const { rerender } = render(<TestComponent />);

      // Click overlay - should close
      fireEvent.click(screen.getByTestId('modal-overlay'));
      expect(onClose).toHaveBeenCalledTimes(1);

      onClose.mockClear();

      // Start loading
      fireEvent.click(screen.getByTestId('start-loading'));
      isLoading = true;
      rerender(<TestComponent />);

      // Try to close while loading - should not work
      fireEvent.click(screen.getByTestId('modal-overlay'));
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should show loading overlay when isLoading is true', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} isLoading={true}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByTestId('modal-loading-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });
  });

  describe('Character Creation Flow', () => {
    it('should show loading state during character creation', async () => {
      const mockCharacter: Character = {
        id: 'char-1',
        name: 'Hegel',
        avatar_url: '/api/characters/char-1/avatar',
        created_at: '2024-01-01T00:00:00Z',
        books: [],
      };

      let resolveCreate: (value: Character) => void;
      const createPromise = new Promise<Character>((resolve) => {
        resolveCreate = resolve;
      });
      mockApiService.createCharacter.mockReturnValue(createPromise);

      const CreateCharacterForm = () => {
        const { createCharacter, isOperationLoading } = useCharacterStoreEnhanced();
        const [name, setName] = React.useState('');

        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          await createCharacter(name);
        };

        return (
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="name-input"
            />
            <button
              type="submit"
              disabled={isOperationLoading('create')}
              data-testid="submit-button"
            >
              {isOperationLoading('create') ? (
                <Loader variant="inline" size="sm" />
              ) : (
                'Create'
              )}
            </button>
          </form>
        );
      };

      render(<CreateCharacterForm />);

      const nameInput = screen.getByTestId('name-input');
      const submitButton = screen.getByTestId('submit-button');

      // Fill form
      fireEvent.change(nameInput, { target: { value: 'Hegel' } });

      // Submit
      fireEvent.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(screen.getByTestId('loader')).toBeInTheDocument();
      });

      // Complete creation
      await act(async () => {
        resolveCreate!(mockCharacter);
        await createPromise;
      });

      // Should no longer be loading
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Message Sending with Typing Indicator', () => {
    it('should show typing indicator while waiting for response', async () => {
      mockApiService.getMessages.mockResolvedValue({ messages: [], total: 0 });

      let resolveSend: (value: any) => void;
      const sendPromise = new Promise((resolve) => {
        resolveSend = resolve;
      });
      mockApiService.sendMessage.mockReturnValue(sendPromise);

      const MessageComponent = () => {
        const { sendMessage, isLoading } = useMessageStoreEnhanced();
        const [content, setContent] = React.useState('');

        const handleSend = async () => {
          await sendMessage('char-1', content);
        };

        return (
          <div>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              data-testid="message-input"
            />
            <button onClick={handleSend} data-testid="send-button">
              Send
            </button>
            {isLoading('char-1', 'send') && (
              <Loader variant="dots" size="sm" text="Character is typing..." />
            )}
          </div>
        );
      };

      render(<MessageComponent />);

      // Type message
      fireEvent.change(screen.getByTestId('message-input'), {
        target: { value: 'Hello' },
      });

      // Send message
      fireEvent.click(screen.getByTestId('send-button'));

      // Should show typing indicator
      await waitFor(() => {
        expect(screen.getByText('Character is typing...')).toBeInTheDocument();
      });

      // Complete send
      await act(async () => {
        resolveSend!({
          user_message: {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            created_at: new Date().toISOString(),
          },
          assistant_message: {
            id: 'msg-2',
            role: 'assistant',
            content: 'Response',
            created_at: new Date().toISOString(),
          },
        });
        await sendPromise;
      });

      // Typing indicator should be gone
      await waitFor(() => {
        expect(screen.queryByText('Character is typing...')).not.toBeInTheDocument();
      });
    });
  });

  describe('IndexingStatusDisplay Integration', () => {
    it('should poll and update progress bars', async () => {
      // Initial state - indexing
      mockApiService.getIndexingStatus.mockResolvedValueOnce({
        books_indexing: [
          {
            book_id: 'book-1',
            status: 'indexing',
            progress: 30,
          },
        ],
        overall_status: 'indexing',
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      // Should show progress bar
      await waitFor(() => {
        expect(screen.getByTestId('indexing-status')).toBeInTheDocument();
      });

      // Progress update
      mockApiService.getIndexingStatus.mockResolvedValueOnce({
        books_indexing: [
          {
            book_id: 'book-1',
            status: 'indexing',
            progress: 70,
          },
        ],
        overall_status: 'indexing',
      });

      // Advance timer to trigger polling
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        const progressBar = screen.getByTestId('progress-bar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '70');
      });

      // Completion
      mockApiService.getIndexingStatus.mockResolvedValueOnce({
        books_indexing: [
          {
            book_id: 'book-1',
            status: 'completed',
            progress: 100,
          },
        ],
        overall_status: 'completed',
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should hide when completed
      await waitFor(() => {
        expect(screen.queryByTestId('indexing-status')).not.toBeInTheDocument();
      });
    });

    it('should show multiple books being indexed', async () => {
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [
          {
            book_id: 'book-1',
            status: 'indexing',
            progress: 50,
          },
          {
            book_id: 'book-2',
            status: 'indexing',
            progress: 25,
          },
          {
            book_id: 'book-3',
            status: 'pending',
            progress: 0,
          },
        ],
        overall_status: 'indexing',
      });

      render(<IndexingStatusDisplay characterId="char-1" />);

      await waitFor(() => {
        const progressBars = screen.getAllByTestId('progress-bar');
        expect(progressBars).toHaveLength(3);
      });
    });
  });

  describe('Modal with IndexingStatusDisplay', () => {
    it('should show indexing progress in edit modal', async () => {
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [
          {
            book_id: 'book-1',
            status: 'indexing',
            progress: 45,
          },
        ],
        overall_status: 'indexing',
      });

      const EditModal = () => (
        <Modal isOpen={true} onClose={vi.fn()} title="Edit Character">
          <div>
            <h3>Edit Character</h3>
            <IndexingStatusDisplay characterId="char-1" />
            <button>Save</button>
          </div>
        </Modal>
      );

      render(<EditModal />);

      await waitFor(() => {
        expect(screen.getByText('Edit Character')).toBeInTheDocument();
        expect(screen.getByTestId('indexing-status')).toBeInTheDocument();
        expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
      });
    });
  });

  describe('ProgressBar with Different States', () => {
    it('should show animated stripes only during indexing', () => {
      const { rerender } = render(<ProgressBar progress={50} status="pending" />);

      let fill = screen.getByTestId('progress-bar').querySelector('.progress-bar-fill');
      expect(fill).not.toHaveClass('progress-bar-fill-animated');

      rerender(<ProgressBar progress={50} status="indexing" />);
      fill = screen.getByTestId('progress-bar').querySelector('.progress-bar-fill');
      expect(fill).toHaveClass('progress-bar-fill-animated');

      rerender(<ProgressBar progress={100} status="completed" />);
      fill = screen.getByTestId('progress-bar').querySelector('.progress-bar-fill');
      expect(fill).not.toHaveClass('progress-bar-fill-animated');

      rerender(<ProgressBar progress={50} status="failed" />);
      fill = screen.getByTestId('progress-bar').querySelector('.progress-bar-fill');
      expect(fill).not.toHaveClass('progress-bar-fill-animated');
    });
  });

  describe('Complete User Flow', () => {
    it('should handle complete character creation with books', async () => {
      // Setup: Create character
      const mockCharacter: Character = {
        id: 'char-1',
        name: 'Hegel',
        avatar_url: '/api/characters/char-1/avatar',
        created_at: '2024-01-01T00:00:00Z',
        books: [{ id: 'book-1', filename: 'philosophy.pdf' }] as any,
      };

      mockApiService.createCharacter.mockResolvedValue(mockCharacter);

      // Initial indexing status
      mockApiService.getIndexingStatus.mockResolvedValue({
        books_indexing: [
          {
            book_id: 'book-1',
            status: 'indexing',
            progress: 0,
          },
        ],
        overall_status: 'indexing',
      });

      const CompleteFlow = () => {
        const { createCharacter, isOperationLoading } = useCharacterStoreEnhanced();
        const [showStatus, setShowStatus] = React.useState(false);
        const [characterId, setCharacterId] = React.useState<string | null>(null);

        const handleCreate = async () => {
          const created = await createCharacter('Hegel');
          if (created) {
            setCharacterId(created.id);
            setShowStatus(true);
          }
        };

        return (
          <div>
            <button onClick={handleCreate} disabled={isOperationLoading('create')}>
              {isOperationLoading('create') ? (
                <Loader variant="inline" />
              ) : (
                'Create Character'
              )}
            </button>
            {showStatus && characterId && (
              <IndexingStatusDisplay characterId={characterId} />
            )}
          </div>
        );
      };

      render(<CompleteFlow />);

      // Create character
      fireEvent.click(screen.getByText('Create Character'));

      // Should show loader during creation
      await waitFor(() => {
        expect(screen.getByTestId('loader')).toBeInTheDocument();
      });

      // After creation, should show indexing status
      await waitFor(() => {
        expect(screen.getByTestId('indexing-status')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should show error in modal and allow retry', async () => {
      mockApiService.createCharacter.mockRejectedValueOnce(new Error('Network error'));
      mockApiService.createCharacter.mockResolvedValueOnce({
        id: 'char-1',
        name: 'Hegel',
        avatar_url: '/api/characters/char-1/avatar',
        created_at: '2024-01-01T00:00:00Z',
        books: [],
      });

      const CreateWithErrorHandling = () => {
        const { createCharacter, loadingStates, clearError } = useCharacterStoreEnhanced();

        const handleCreate = async () => {
          await createCharacter('Hegel');
        };

        return (
          <div>
            <button onClick={handleCreate}>Create</button>
            {loadingStates.create.error && (
              <div>
                <div data-testid="error-message">{loadingStates.create.error}</div>
                <button onClick={() => clearError('create')}>Dismiss</button>
              </div>
            )}
          </div>
        );
      };

      render(<CreateWithErrorHandling />);

      // First attempt - error
      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Network error');
      });

      // Dismiss error
      fireEvent.click(screen.getByText('Dismiss'));

      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      });

      // Retry - success
      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      });
    });
  });

  describe('Multiple Loaders', () => {
    it('should show different loaders for different operations simultaneously', async () => {
      mockApiService.getCharacters.mockImplementation(() => new Promise(() => {}));
      mockApiService.createCharacter.mockImplementation(() => new Promise(() => {}));

      const MultipleOperations = () => {
        const { fetchCharacters, createCharacter, isOperationLoading } =
          useCharacterStoreEnhanced();

        return (
          <div>
            <button onClick={() => fetchCharacters()}>
              {isOperationLoading('fetchAll') ? (
                <Loader variant="spinner" size="sm" />
              ) : (
                'Fetch All'
              )}
            </button>
            <button onClick={() => createCharacter('New')}>
              {isOperationLoading('create') ? (
                <Loader variant="inline" size="sm" />
              ) : (
                'Create'
              )}
            </button>
          </div>
        );
      };

      render(<MultipleOperations />);

      // Start both operations
      fireEvent.click(screen.getByText('Fetch All'));
      fireEvent.click(screen.getByText('Create'));

      // Both should show loaders
      await waitFor(() => {
        const loaders = screen.getAllByTestId('loader');
        expect(loaders).toHaveLength(2);
      });
    });
  });
});
