/**
 * Unit tests for Modal component
 *
 * Test Coverage:
 * - Open/close behavior
 * - Overlay click handling (with closeOnOverlayClick prop)
 * - Escape key handling (with closeOnEscape prop)
 * - Close button rendering and functionality
 * - Focus trap on open
 * - Body scroll lock when modal is open
 * - Loading state overlay
 * - Prevent closing during loading (preventCloseWhileLoading)
 * - Title rendering
 * - Children rendering
 * - Accessibility attributes (role, aria-modal, etc.)
 * - Edge cases (rapid open/close, nested modals)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../../../components/Modal';

describe('Modal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal content</div>
        </Modal>
      );
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Test modal content</div>
        </Modal>
      );
      expect(screen.getByText('Test modal content')).toBeInTheDocument();
    });

    it('should render with title when provided', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Create Character">
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByText('Create Character')).toBeInTheDocument();
    });

    it('should render without title when not provided', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.queryByTestId('modal-title')).not.toBeInTheDocument();
    });
  });

  describe('Overlay Click Behavior', () => {
    it('should close on overlay click by default', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close on overlay click when closeOnOverlayClick is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={true}>
          <div>Content</div>
        </Modal>
      );

      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should NOT close on overlay click when closeOnOverlayClick is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={false}>
          <div>Content</div>
        </Modal>
      );

      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should NOT close when clicking on modal content', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={true}>
          <div data-testid="modal-content">Content</div>
        </Modal>
      );

      const content = screen.getByTestId('modal-content');
      fireEvent.click(content);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should distinguish between overlay and content clicks', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={true}>
          <div>
            <button>Button inside modal</button>
          </div>
        </Modal>
      );

      // Click button inside modal - should not close
      const button = screen.getByText('Button inside modal');
      fireEvent.click(button);
      expect(mockOnClose).not.toHaveBeenCalled();

      // Click overlay - should close
      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Escape Key Behavior', () => {
    it('should close on Escape key by default', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close on Escape key when closeOnEscape is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnEscape={true}>
          <div>Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should NOT close on Escape key when closeOnEscape is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnEscape={false}>
          <div>Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not trigger on other keys', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnEscape={true}>
          <div>Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space', code: 'Space' });
      fireEvent.keyDown(document, { key: 'a', code: 'KeyA' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should clean up escape key listener on unmount', () => {
      const { unmount } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      unmount();

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Close Button', () => {
    it('should render close button by default', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByTestId('modal-close-button')).toBeInTheDocument();
    });

    it('should render close button when showCloseButton is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} showCloseButton={true}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByTestId('modal-close-button')).toBeInTheDocument();
    });

    it('should NOT render close button when showCloseButton is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} showCloseButton={false}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.queryByTestId('modal-close-button')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} showCloseButton={true}>
          <div>Content</div>
        </Modal>
      );

      const closeButton = screen.getByTestId('modal-close-button');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should have aria-label on close button', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} showCloseButton={true}>
          <div>Content</div>
        </Modal>
      );

      const closeButton = screen.getByTestId('modal-close-button');
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
    });
  });

  describe('Loading State', () => {
    it('should not show loading overlay when isLoading is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} isLoading={false}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.queryByTestId('modal-loading-overlay')).not.toBeInTheDocument();
    });

    it('should show loading overlay when isLoading is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} isLoading={true}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByTestId('modal-loading-overlay')).toBeInTheDocument();
    });

    it('should render loader in loading overlay', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} isLoading={true}>
          <div>Content</div>
        </Modal>
      );

      const overlay = screen.getByTestId('modal-loading-overlay');
      expect(overlay).toBeInTheDocument();
      // Should contain a loader component
      expect(overlay.querySelector('[data-testid="loader"]')).toBeInTheDocument();
    });

    it('should allow closing when not loading', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} preventCloseWhileLoading={true} isLoading={false}>
          <div>Content</div>
        </Modal>
      );

      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should prevent closing when loading and preventCloseWhileLoading is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} preventCloseWhileLoading={true} isLoading={true}>
          <div>Content</div>
        </Modal>
      );

      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should prevent Escape key when loading and preventCloseWhileLoading is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} preventCloseWhileLoading={true} isLoading={true}>
          <div>Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should prevent close button click when loading and preventCloseWhileLoading is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} preventCloseWhileLoading={true} isLoading={true}>
          <div>Content</div>
        </Modal>
      );

      const closeButton = screen.getByTestId('modal-close-button');
      fireEvent.click(closeButton);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should disable close button visually when loading', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} preventCloseWhileLoading={true} isLoading={true}>
          <div>Content</div>
        </Modal>
      );

      const closeButton = screen.getByTestId('modal-close-button');
      expect(closeButton).toBeDisabled();
    });
  });

  describe('Focus Management', () => {
    it('should focus first focusable element on mount', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <input data-testid="first-input" />
          <button>Submit</button>
        </Modal>
      );

      await waitFor(() => {
        const firstInput = screen.getByTestId('first-input');
        expect(document.activeElement).toBe(firstInput);
      });
    });

    it('should focus close button if no focusable content', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} showCloseButton={true}>
          <div>Non-focusable content</div>
        </Modal>
      );

      await waitFor(() => {
        const closeButton = screen.getByTestId('modal-close-button');
        expect(document.activeElement).toBe(closeButton);
      });
    });

    it('should trap focus within modal', async () => {
      const user = userEvent.setup();

      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <input data-testid="input-1" />
          <input data-testid="input-2" />
          <button data-testid="button-1">Submit</button>
        </Modal>
      );

      const input1 = screen.getByTestId('input-1');
      const input2 = screen.getByTestId('input-2');
      const button1 = screen.getByTestId('button-1');
      const closeButton = screen.getByTestId('modal-close-button');

      // Tab through elements
      await user.tab();
      expect(document.activeElement).toBe(input2);

      await user.tab();
      expect(document.activeElement).toBe(button1);

      await user.tab();
      expect(document.activeElement).toBe(closeButton);

      // Tab should wrap back to first element
      await user.tab();
      expect(document.activeElement).toBe(input1);
    });

    it('should restore focus to previously focused element on close', async () => {
      const button = document.createElement('button');
      button.textContent = 'Open Modal';
      document.body.appendChild(button);
      button.focus();

      const { rerender } = render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(document.activeElement).toBe(button);

      rerender(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      await waitFor(() => {
        expect(document.activeElement).not.toBe(button);
      });

      rerender(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      await waitFor(() => {
        expect(document.activeElement).toBe(button);
      });

      document.body.removeChild(button);
    });
  });

  describe('Body Scroll Lock', () => {
    it('should lock body scroll when modal opens', () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.overflow).not.toBe('hidden');

      rerender(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should unlock body scroll when modal closes', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.overflow).not.toBe('hidden');
    });

    it('should unlock body scroll on unmount', () => {
      const { unmount } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).not.toBe('hidden');
    });
  });

  describe('Accessibility', () => {
    it('should have role="dialog"', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      const modal = screen.getByTestId('modal');
      expect(modal).toHaveAttribute('role', 'dialog');
    });

    it('should have aria-modal="true"', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      const modal = screen.getByTestId('modal');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby when title is provided', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Create Character">
          <div>Content</div>
        </Modal>
      );

      const modal = screen.getByTestId('modal');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should have aria-label when no title is provided', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      const modal = screen.getByTestId('modal');
      expect(modal).toHaveAttribute('aria-label', 'Modal dialog');
    });
  });

  describe('Props: className', () => {
    it('should apply custom className to modal content', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} className="custom-modal">
          <div>Content</div>
        </Modal>
      );

      const modal = screen.getByTestId('modal');
      expect(modal).toHaveClass('custom-modal');
    });

    it('should merge custom className with default classes', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} className="my-modal">
          <div>Content</div>
        </Modal>
      );

      const modal = screen.getByTestId('modal');
      expect(modal).toHaveClass('modal');
      expect(modal).toHaveClass('my-modal');
    });
  });

  describe('Props: testId', () => {
    it('should use default testId', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('should use custom testId', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} testId="character-modal">
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByTestId('character-modal')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid open/close toggling', () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );

      for (let i = 0; i < 10; i++) {
        rerender(
          <Modal isOpen={true} onClose={mockOnClose}>
            <div>Content</div>
          </Modal>
        );

        rerender(
          <Modal isOpen={false} onClose={mockOnClose}>
            <div>Content</div>
          </Modal>
        );
      }

      // Should not throw errors or leak memory
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should handle changing onClose callback', () => {
      const onClose1 = vi.fn();
      const onClose2 = vi.fn();

      const { rerender } = render(
        <Modal isOpen={true} onClose={onClose1}>
          <div>Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      expect(onClose1).toHaveBeenCalledTimes(1);
      expect(onClose2).not.toHaveBeenCalled();

      onClose1.mockClear();

      rerender(
        <Modal isOpen={true} onClose={onClose2}>
          <div>Content</div>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      expect(onClose1).not.toHaveBeenCalled();
      expect(onClose2).toHaveBeenCalledTimes(1);
    });

    it('should handle complex children with forms', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <form onSubmit={handleSubmit}>
            <input name="name" />
            <button type="submit">Submit</button>
          </form>
        </Modal>
      );

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should handle null children gracefully', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          {null}
        </Modal>
      );

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('should handle multiple modals (last one wins for escape)', () => {
      const onClose1 = vi.fn();
      const onClose2 = vi.fn();

      render(
        <>
          <Modal isOpen={true} onClose={onClose1} testId="modal-1">
            <div>Modal 1</div>
          </Modal>
          <Modal isOpen={true} onClose={onClose2} testId="modal-2">
            <div>Modal 2</div>
          </Modal>
        </>
      );

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      // Only the last mounted modal should respond to escape
      expect(onClose2).toHaveBeenCalledTimes(1);
      expect(onClose1).not.toHaveBeenCalled();
    });
  });

  describe('Combination Tests', () => {
    it('should work with all features disabled', () => {
      render(
        <Modal
          isOpen={true}
          onClose={mockOnClose}
          closeOnOverlayClick={false}
          closeOnEscape={false}
          showCloseButton={false}
        >
          <div>Content</div>
        </Modal>
      );

      // Try to close in various ways
      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should work with all features enabled during loading', () => {
      render(
        <Modal
          isOpen={true}
          onClose={mockOnClose}
          closeOnOverlayClick={true}
          closeOnEscape={true}
          showCloseButton={true}
          preventCloseWhileLoading={true}
          isLoading={true}
          title="Creating Character"
        >
          <form>
            <input name="name" />
          </form>
        </Modal>
      );

      expect(screen.getByText('Creating Character')).toBeInTheDocument();
      expect(screen.getByTestId('modal-loading-overlay')).toBeInTheDocument();

      // Try all close methods - should be blocked
      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      const closeButton = screen.getByTestId('modal-close-button');
      fireEvent.click(closeButton);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
