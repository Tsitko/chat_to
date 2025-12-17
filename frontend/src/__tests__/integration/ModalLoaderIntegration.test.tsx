/**
 * Integration tests for Modal + Loader combination
 *
 * Test Coverage:
 * - Modal with loading overlay and Loader component
 * - Modal prevents closing while loading
 * - Loader variants within modal content
 * - Loading state transitions in modal
 * - User interactions blocked during loading
 * - Complex scenarios (form submission with loading)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Modal } from '../../components/Modal';
import { Loader } from '../../components/Loader';
import { useState } from 'react';

describe('Modal + Loader Integration', () => {
  describe('Loading Overlay with Loader', () => {
    it('should render Loader in modal loading overlay', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} isLoading={true}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByTestId('modal-loading-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should use overlay variant for modal loading', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} isLoading={true}>
          <div>Content</div>
        </Modal>
      );

      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-overlay');
    });

    it('should show loading text in modal overlay', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} isLoading={true}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should hide loading overlay when not loading', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={vi.fn()} isLoading={true}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByTestId('modal-loading-overlay')).toBeInTheDocument();

      rerender(
        <Modal isOpen={true} onClose={vi.fn()} isLoading={false}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.queryByTestId('modal-loading-overlay')).not.toBeInTheDocument();
    });
  });

  describe('Loader in Modal Content', () => {
    it('should render inline Loader in modal buttons', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <form>
            <button disabled>
              <Loader variant="inline" size="sm" />
              Saving...
            </button>
          </form>
        </Modal>
      );

      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-inline');
      expect(loader).toHaveClass('loader-sm');
    });

    it('should render spinner Loader in modal content area', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <div>
            <Loader variant="spinner" size="md" text="Loading data..." />
          </div>
        </Modal>
      );

      expect(screen.getByTestId('loader')).toHaveClass('loader-spinner');
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should render dots Loader for typing indicator in modal', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <div className="chat">
            <Loader variant="dots" text="Character is thinking..." />
          </div>
        </Modal>
      );

      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-dots');
    });
  });

  describe('Prevent Close While Loading', () => {
    it('should prevent overlay click when loading and preventCloseWhileLoading is true', () => {
      const onClose = vi.fn();

      render(
        <Modal
          isOpen={true}
          onClose={onClose}
          isLoading={true}
          preventCloseWhileLoading={true}
        >
          <div>Content</div>
        </Modal>
      );

      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should prevent Escape key when loading and preventCloseWhileLoading is true', () => {
      const onClose = vi.fn();

      render(
        <Modal
          isOpen={true}
          onClose={onClose}
          isLoading={true}
          preventCloseWhileLoading={true}
        >
          <div>Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should prevent close button when loading and preventCloseWhileLoading is true', () => {
      const onClose = vi.fn();

      render(
        <Modal
          isOpen={true}
          onClose={onClose}
          isLoading={true}
          preventCloseWhileLoading={true}
        >
          <div>Content</div>
        </Modal>
      );

      const closeButton = screen.getByTestId('modal-close-button');
      expect(closeButton).toBeDisabled();

      fireEvent.click(closeButton);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should allow close after loading completes', () => {
      const onClose = vi.fn();

      const { rerender } = render(
        <Modal
          isOpen={true}
          onClose={onClose}
          isLoading={true}
          preventCloseWhileLoading={true}
        >
          <div>Content</div>
        </Modal>
      );

      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);
      expect(onClose).not.toHaveBeenCalled();

      rerender(
        <Modal
          isOpen={true}
          onClose={onClose}
          isLoading={false}
          preventCloseWhileLoading={true}
        >
          <div>Content</div>
        </Modal>
      );

      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Submission with Loading', () => {
    const FormWithLoading = () => {
      const [isLoading, setIsLoading] = useState(false);
      const [isOpen, setIsOpen] = useState(true);

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 100));

        setIsLoading(false);
        setIsOpen(false);
      };

      return (
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          isLoading={isLoading}
          preventCloseWhileLoading={true}
          title="Create Character"
        >
          <form onSubmit={handleSubmit} data-testid="character-form">
            <input name="name" placeholder="Character name" />
            <button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader variant="inline" size="sm" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
          </form>
        </Modal>
      );
    };

    it('should show inline loader in button during form submission', async () => {
      render(<FormWithLoading />);

      const form = screen.getByTestId('character-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByTestId('loader')).toBeInTheDocument();
        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });
    });

    it('should show loading overlay during form submission', async () => {
      render(<FormWithLoading />);

      const form = screen.getByTestId('character-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByTestId('modal-loading-overlay')).toBeInTheDocument();
      });
    });

    it('should prevent modal close during form submission', async () => {
      render(<FormWithLoading />);

      const form = screen.getByTestId('character-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByTestId('modal-loading-overlay')).toBeInTheDocument();
      });

      // Try to close modal
      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);

      // Modal should still be open
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('should close modal after form submission completes', async () => {
      render(<FormWithLoading />);

      const form = screen.getByTestId('character-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByTestId('modal-loading-overlay')).toBeInTheDocument();
      });

      await waitFor(
        () => {
          expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
        },
        { timeout: 200 }
      );
    });
  });

  describe('Loading State Transitions', () => {
    const StatefulModal = () => {
      const [isLoading, setIsLoading] = useState(false);
      const [isOpen, setIsOpen] = useState(true);

      const startLoading = () => setIsLoading(true);
      const stopLoading = () => setIsLoading(false);

      return (
        <div>
          <button onClick={startLoading}>Start Loading</button>
          <button onClick={stopLoading}>Stop Loading</button>
          <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            isLoading={isLoading}
            preventCloseWhileLoading={true}
          >
            <div>
              {isLoading ? (
                <Loader variant="spinner" text="Processing..." />
              ) : (
                <div>Ready</div>
              )}
            </div>
          </Modal>
        </div>
      );
    };

    it('should transition from idle to loading state', async () => {
      render(<StatefulModal />);

      expect(screen.queryByTestId('modal-loading-overlay')).not.toBeInTheDocument();

      const startButton = screen.getByText('Start Loading');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByTestId('modal-loading-overlay')).toBeInTheDocument();
        expect(screen.getByText('Processing...')).toBeInTheDocument();
      });
    });

    it('should transition from loading to idle state', async () => {
      render(<StatefulModal />);

      const startButton = screen.getByText('Start Loading');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByTestId('modal-loading-overlay')).toBeInTheDocument();
      });

      const stopButton = screen.getByText('Stop Loading');
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(screen.queryByTestId('modal-loading-overlay')).not.toBeInTheDocument();
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });
    });

    it('should handle rapid loading state changes', async () => {
      render(<StatefulModal />);

      const startButton = screen.getByText('Start Loading');
      const stopButton = screen.getByText('Stop Loading');

      for (let i = 0; i < 5; i++) {
        fireEvent.click(startButton);
        await waitFor(() => {
          expect(screen.getByTestId('modal-loading-overlay')).toBeInTheDocument();
        });

        fireEvent.click(stopButton);
        await waitFor(() => {
          expect(screen.queryByTestId('modal-loading-overlay')).not.toBeInTheDocument();
        });
      }

      // Should handle without errors
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });

  describe('Multiple Loaders in Modal', () => {
    it('should render multiple different loader variants simultaneously', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <div>
            <Loader variant="spinner" size="sm" testId="spinner-loader" />
            <div className="buttons">
              <button disabled>
                <Loader variant="inline" testId="inline-loader" />
              </button>
            </div>
            <div className="status">
              <Loader variant="dots" testId="dots-loader" />
            </div>
          </div>
        </Modal>
      );

      expect(screen.getByTestId('spinner-loader')).toBeInTheDocument();
      expect(screen.getByTestId('inline-loader')).toBeInTheDocument();
      expect(screen.getByTestId('dots-loader')).toBeInTheDocument();
    });
  });

  describe('Accessibility with Loading States', () => {
    it('should have accessible loading indicators', () => {
      render(
        <Modal
          isOpen={true}
          onClose={vi.fn()}
          isLoading={true}
          title="Creating Character"
        >
          <div>Content</div>
        </Modal>
      );

      const loader = screen.getByTestId('loader');
      expect(loader).toHaveAttribute('role', 'status');
      expect(loader).toHaveAttribute('aria-live', 'polite');
    });

    it('should announce loading state changes to screen readers', async () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={vi.fn()} isLoading={false}>
          <div>Content</div>
        </Modal>
      );

      rerender(
        <Modal isOpen={true} onClose={vi.fn()} isLoading={true}>
          <div>Content</div>
        </Modal>
      );

      await waitFor(() => {
        const overlay = screen.getByTestId('modal-loading-overlay');
        expect(overlay).toHaveAttribute('role', 'alert');
      });
    });
  });
});
