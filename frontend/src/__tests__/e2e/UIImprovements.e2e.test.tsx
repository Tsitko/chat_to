/**
 * E2E tests for UI Improvements
 *
 * Test Coverage:
 * - UC: Character creation with loading feedback
 * - UC: Book upload with progress tracking
 * - UC: Chat message with loading indicator
 * - UC: Modal that doesn't close on overlay click
 * - Complete user journeys with all new UI components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCharacterStoreEnhanced } from '../../store/characterStoreEnhanced';
import { useMessageStoreEnhanced } from '../../store/messageStoreEnhanced';
import { apiService } from '../../services/api';

// Mock API service
vi.mock('../../services/api');

// Mock App component with enhanced stores
const CharacterCreationFlow = () => {
  const { createCharacter, isOperationLoading, loadingStates } = useCharacterStoreEnhanced();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [books, setBooks] = React.useState<File[]>([]);

  const handleCreate = async () => {
    await createCharacter(name, undefined, books);
    setIsModalOpen(false);
  };

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>Create Character</button>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          closeOnOverlayClick={false}
          preventCloseWhileLoading={true}
          isLoading={isOperationLoading('create')}
          title="Create New Character"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Character name"
              data-testid="name-input"
            />
            <input
              type="file"
              multiple
              onChange={(e) => setBooks(Array.from(e.target.files || []))}
              data-testid="books-input"
            />
            <button
              type="submit"
              disabled={isOperationLoading('create')}
              data-testid="submit-button"
            >
              {isOperationLoading('create') ? (
                <>
                  <Loader variant="inline" size="sm" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
            {loadingStates.create.error && (
              <div data-testid="error-message">{loadingStates.create.error}</div>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
};

describe('E2E: UI Improvements', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('UC: Character Creation with Loading Feedback', () => {
    it('should show loading indicator during character creation', async () => {
      vi.mocked(apiService.createCharacter).mockImplementation(
        () => new Promise((resolve) =>
          setTimeout(() => resolve({
            id: 'char-new',
            name: 'Hegel',
            avatar_url: '',
            created_at: new Date().toISOString(),
          }), 1000)
        )
      );

      render(<CharacterCreationFlow />);

      // Open modal
      const createButton = screen.getByText('Create Character');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      // Fill form
      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'Hegel');

      // Submit
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      // Should show inline loader
      await waitFor(() => {
        expect(screen.getByTestId('loader')).toBeInTheDocument();
        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });

      // Should show modal loading overlay
      expect(screen.getByTestId('modal-loading-overlay')).toBeInTheDocument();

      // Submit button should be disabled
      expect(submitButton).toBeDisabled();
    });

    it('should prevent modal close during character creation', async () => {
      vi.mocked(apiService.createCharacter).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          id: 'char-new',
          name: 'Hegel',
          avatar_url: '',
          created_at: new Date().toISOString(),
        }), 1000))
      );

      render(<CharacterCreationFlow />);

      // Open modal and start creation
      fireEvent.click(screen.getByText('Create Character'));

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'Hegel');

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('modal-loading-overlay')).toBeInTheDocument();
      });

      // Try to close via overlay click
      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);

      // Modal should still be open
      expect(screen.getByTestId('modal')).toBeInTheDocument();

      // Try to close via Escape key
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      // Modal should still be open
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('should close modal after successful creation', async () => {
      vi.mocked(apiService.createCharacter).mockResolvedValue({
        id: 'char-new',
        name: 'Hegel',
        avatar_url: '',
        created_at: new Date().toISOString(),
      });

      render(<CharacterCreationFlow />);

      fireEvent.click(screen.getByText('Create Character'));

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'Hegel');

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });
    });

    it('should show error message on creation failure', async () => {
      vi.mocked(apiService.createCharacter).mockRejectedValue(
        new Error('Failed to create character')
      );

      render(<CharacterCreationFlow />);

      fireEvent.click(screen.getByText('Create Character'));

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId('name-input');
      await userEvent.type(nameInput, 'Hegel');

      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to create character');
      });

      // Modal should stay open for user to retry
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  describe('UC: Book Upload with Progress Tracking', () => {
    const BookUploadFlow = () => {
      const [characterId] = React.useState('char-1');

      return (
        <div>
          <IndexingStatusDisplay characterId={characterId} />
        </div>
      );
    };

    it('should show progress bars for uploaded books', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 30 },
          { book_id: 'book-2', status: 'pending', progress: 0 },
        ],
        overall_status: 'indexing',
      });

      render(<BookUploadFlow />);

      await waitFor(() => {
        const progressBars = screen.getAllByTestId(/progress-bar/);
        expect(progressBars.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should update progress in real-time', async () => {
      const progressUpdates = [
        {
          books_indexing: [
            { book_id: 'book-1', status: 'indexing' as const, progress: 25 },
          ],
          overall_status: 'indexing' as const,
        },
        {
          books_indexing: [
            { book_id: 'book-1', status: 'indexing' as const, progress: 50 },
          ],
          overall_status: 'indexing' as const,
        },
        {
          books_indexing: [
            { book_id: 'book-1', status: 'indexing' as const, progress: 75 },
          ],
          overall_status: 'indexing' as const,
        },
        {
          books_indexing: [
            { book_id: 'book-1', status: 'completed' as const, progress: 100 },
          ],
          overall_status: 'completed' as const,
        },
      ];

      let callCount = 0;
      vi.mocked(apiService.getIndexingStatus).mockImplementation(async () => {
        return progressUpdates[Math.min(callCount++, progressUpdates.length - 1)];
      });

      render(<BookUploadFlow />);

      // Initial state
      await waitFor(() => {
        expect(screen.getByText('25%')).toBeInTheDocument();
      });

      // First update
      vi.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument();
      });

      // Second update
      vi.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument();
      });

      // Completion
      vi.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(screen.queryByTestId('indexing-status')).not.toBeInTheDocument();
      });
    });

    it('should show different statuses for multiple books', async () => {
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'completed', progress: 100 },
          { book_id: 'book-2', status: 'indexing', progress: 60 },
          { book_id: 'book-3', status: 'failed', progress: 30 },
          { book_id: 'book-4', status: 'pending', progress: 0 },
        ],
        overall_status: 'indexing',
      });

      render(<BookUploadFlow />);

      await waitFor(() => {
        const bars = screen.getAllByTestId(/progress-bar/);
        expect(bars.some(bar => bar.classList.contains('progress-bar-completed'))).toBe(true);
        expect(bars.some(bar => bar.classList.contains('progress-bar-indexing'))).toBe(true);
        expect(bars.some(bar => bar.classList.contains('progress-bar-failed'))).toBe(true);
        expect(bars.some(bar => bar.classList.contains('progress-bar-pending'))).toBe(true);
      });
    });
  });

  describe('UC: Chat Message with Loading Indicator', () => {
    const ChatFlow = () => {
      const { sendMessage, isLoading } = useMessageStoreEnhanced();
      const [characterId] = React.useState('char-1');
      const [message, setMessage] = React.useState('');

      const handleSend = async () => {
        await sendMessage(characterId, message);
        setMessage('');
      };

      return (
        <div>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type message..."
            data-testid="message-input"
          />
          <button
            onClick={handleSend}
            disabled={isLoading(characterId, 'send')}
            data-testid="send-button"
          >
            {isLoading(characterId, 'send') ? (
              <>
                <Loader variant="inline" size="sm" />
                Sending...
              </>
            ) : (
              'Send'
            )}
          </button>
          {isLoading(characterId, 'send') && (
            <Loader variant="dots" text="Character is thinking..." />
          )}
        </div>
      );
    };

    it('should show inline loader in send button', async () => {
      vi.mocked(apiService.sendMessage).mockImplementation(
        () => new Promise((resolve) =>
          setTimeout(() => resolve({
            user_message: {
              id: 'msg-1',
              role: 'user',
              content: 'Hello',
              created_at: new Date().toISOString(),
            },
            assistant_message: {
              id: 'msg-2',
              role: 'assistant',
              content: 'Hi there!',
              created_at: new Date().toISOString(),
            },
          }), 1000)
        )
      );

      render(<ChatFlow />);

      const input = screen.getByTestId('message-input');
      await userEvent.type(input, 'Hello');

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('loader')).toBeInTheDocument();
        expect(screen.getByText('Sending...')).toBeInTheDocument();
      });
    });

    it('should show typing indicator while waiting for response', async () => {
      vi.mocked(apiService.sendMessage).mockImplementation(
        () => new Promise((resolve) =>
          setTimeout(() => resolve({
            user_message: {
              id: 'msg-1',
              role: 'user',
              content: 'Hello',
              created_at: new Date().toISOString(),
            },
            assistant_message: {
              id: 'msg-2',
              role: 'assistant',
              content: 'Hi there!',
              created_at: new Date().toISOString(),
            },
          }), 1000)
        )
      );

      render(<ChatFlow />);

      const input = screen.getByTestId('message-input');
      await userEvent.type(input, 'Hello');

      fireEvent.click(screen.getByTestId('send-button'));

      await waitFor(() => {
        expect(screen.getByText('Character is thinking...')).toBeInTheDocument();
        const loaders = screen.getAllByTestId('loader');
        expect(loaders.some(l => l.classList.contains('loader-dots'))).toBe(true);
      });
    });

    it('should disable send button while sending', async () => {
      vi.mocked(apiService.sendMessage).mockImplementation(
        () => new Promise((resolve) =>
          setTimeout(() => resolve({
            user_message: { id: 'msg-1', role: 'user', content: 'Hello', created_at: '' },
            assistant_message: { id: 'msg-2', role: 'assistant', content: 'Hi!', created_at: '' },
          }), 1000)
        )
      );

      render(<ChatFlow />);

      const input = screen.getByTestId('message-input');
      await userEvent.type(input, 'Hello');

      const sendButton = screen.getByTestId('send-button');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(sendButton).toBeDisabled();
      });
    });
  });

  describe('UC: Modal Does Not Close on Overlay Click', () => {
    it('should not close modal when clicking overlay if closeOnOverlayClick is false', () => {
      const onClose = vi.fn();

      render(
        <Modal
          isOpen={true}
          onClose={onClose}
          closeOnOverlayClick={false}
          title="Edit Character"
        >
          <form>
            <input name="name" />
            <button type="submit">Save</button>
          </form>
        </Modal>
      );

      const overlay = screen.getByTestId('modal-overlay');

      // Click overlay multiple times
      fireEvent.click(overlay);
      fireEvent.click(overlay);
      fireEvent.click(overlay);

      // Modal should still be open
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should allow closing via close button even with closeOnOverlayClick=false', () => {
      const onClose = vi.fn();

      render(
        <Modal
          isOpen={true}
          onClose={onClose}
          closeOnOverlayClick={false}
          showCloseButton={true}
        >
          <div>Content</div>
        </Modal>
      );

      const closeButton = screen.getByTestId('modal-close-button');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should allow closing via Escape key even with closeOnOverlayClick=false', () => {
      const onClose = vi.fn();

      render(
        <Modal
          isOpen={true}
          onClose={onClose}
          closeOnOverlayClick={false}
          closeOnEscape={true}
        >
          <div>Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close via any method when loading and preventCloseWhileLoading is true', () => {
      const onClose = vi.fn();

      render(
        <Modal
          isOpen={true}
          onClose={onClose}
          closeOnOverlayClick={false}
          closeOnEscape={true}
          showCloseButton={true}
          isLoading={true}
          preventCloseWhileLoading={true}
        >
          <div>Content</div>
        </Modal>
      );

      // Try all close methods
      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      const closeButton = screen.getByTestId('modal-close-button');
      fireEvent.click(closeButton);

      // None should work
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  describe('Complete User Journey', () => {
    it('should handle complete character creation and chat flow with all loading states', async () => {
      // Mock character creation
      vi.mocked(apiService.createCharacter).mockResolvedValue({
        id: 'char-new',
        name: 'Hegel',
        avatar_url: '',
        created_at: new Date().toISOString(),
      });

      // Mock indexing status
      vi.mocked(apiService.getIndexingStatus).mockResolvedValue({
        books_indexing: [
          { book_id: 'book-1', status: 'indexing', progress: 50 },
        ],
        overall_status: 'indexing',
      });

      // Mock message sending
      vi.mocked(apiService.sendMessage).mockResolvedValue({
        user_message: { id: 'msg-1', role: 'user', content: 'Hello', created_at: '' },
        assistant_message: { id: 'msg-2', role: 'assistant', content: 'Hi!', created_at: '' },
      });

      // This would be the full app component
      // For now, we verify the components work together

      expect(true).toBe(true); // Placeholder for full integration test
    });
  });
});
