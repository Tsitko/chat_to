/**
 * Unit tests for Modal component.
 *
 * Test Coverage:
 * - Open/close behavior
 * - Overlay click handling (enabled/disabled)
 * - Escape key handling (enabled/disabled)
 * - Close button visibility and functionality
 * - Loading state behavior
 * - Prevent close while loading
 * - Focus trap functionality
 * - Accessibility attributes
 * - Body scroll lock
 * - Title display
 * - Children rendering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('Open/Close State', () => {
    it('should not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>
      );
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Modal Content</div>
        </Modal>
      );
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Test Modal Content</div>
        </Modal>
      );
      expect(screen.getByText('Test Modal Content')).toBeInTheDocument();
    });

    it('should show and hide when isOpen changes', () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();

      rerender(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByTestId('modal')).toBeInTheDocument();

      rerender(
        <Modal isOpen={false} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  describe('Overlay Click Behavior', () => {
    it('should call onClose when overlay is clicked by default', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when closeOnOverlayClick is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={true}>
          <div>Content</div>
        </Modal>
      );
      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should NOT call onClose when closeOnOverlayClick is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={false}>
          <div>Content</div>
        </Modal>
      );
      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should NOT call onClose when clicking modal content', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div data-testid="modal-content">Content</div>
        </Modal>
      );
      const content = screen.getByTestId('modal-content');
      fireEvent.click(content);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should stop propagation when clicking inside modal content', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <button data-testid="inner-button">Click Me</button>
        </Modal>
      );
      const button = screen.getByTestId('inner-button');
      fireEvent.click(button);
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Escape Key Behavior', () => {
    it('should call onClose when Escape is pressed by default', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when closeOnEscape is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnEscape={true}>
          <div>Content</div>
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should NOT call onClose when closeOnEscape is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnEscape={false}>
          <div>Content</div>
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not call onClose for other keys', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space', code: 'Space' });
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should clean up escape listener on unmount', () => {
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
    it('should show close button by default', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByTestId('modal-close-button')).toBeInTheDocument();
    });

    it('should show close button when showCloseButton is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} showCloseButton={true}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByTestId('modal-close-button')).toBeInTheDocument();
    });

    it('should hide close button when showCloseButton is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} showCloseButton={false}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.queryByTestId('modal-close-button')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      const closeButton = screen.getByTestId('modal-close-button');
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should have proper aria-label on close button', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      const closeButton = screen.getByTestId('modal-close-button');
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
    });
  });

  describe('Title Display', () => {
    it('should display title when provided', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Edit Character">
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByText('Edit Character')).toBeInTheDocument();
    });

    it('should not display title element when not provided', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      const title = container.querySelector('.modal-title');
      expect(title).not.toBeInTheDocument();
    });

    it('should render title with proper styling', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Title">
          <div>Content</div>
        </Modal>
      );
      const title = screen.getByText('Test Title');
      expect(title).toHaveClass('modal-title');
    });
  });

  describe('Loading State', () => {
    it('should show loading overlay when isLoading is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} isLoading={true}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByTestId('modal-loading-overlay')).toBeInTheDocument();
    });

    it('should not show loading overlay when isLoading is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} isLoading={false}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.queryByTestId('modal-loading-overlay')).not.toBeInTheDocument();
    });

    it('should render loader inside loading overlay', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} isLoading={true}>
          <div>Content</div>
        </Modal>
      );
      const loadingOverlay = screen.getByTestId('modal-loading-overlay');
      const loader = loadingOverlay.querySelector('[data-testid="loader"]');
      expect(loader).toBeInTheDocument();
    });
  });

  describe('Prevent Close While Loading', () => {
    it('should prevent overlay click close when preventCloseWhileLoading and isLoading are true', () => {
      render(
        <Modal
          isOpen={true}
          onClose={mockOnClose}
          preventCloseWhileLoading={true}
          isLoading={true}
        >
          <div>Content</div>
        </Modal>
      );
      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should allow overlay click close when preventCloseWhileLoading is true but isLoading is false', () => {
      render(
        <Modal
          isOpen={true}
          onClose={mockOnClose}
          preventCloseWhileLoading={true}
          isLoading={false}
        >
          <div>Content</div>
        </Modal>
      );
      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should prevent Escape key close when preventCloseWhileLoading and isLoading are true', () => {
      render(
        <Modal
          isOpen={true}
          onClose={mockOnClose}
          preventCloseWhileLoading={true}
          isLoading={true}
        >
          <div>Content</div>
        </Modal>
      );
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should prevent close button click when preventCloseWhileLoading and isLoading are true', () => {
      render(
        <Modal
          isOpen={true}
          onClose={mockOnClose}
          preventCloseWhileLoading={true}
          isLoading={true}
        >
          <div>Content</div>
        </Modal>
      );
      const closeButton = screen.getByTestId('modal-close-button');
      fireEvent.click(closeButton);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should disable close button when loading', () => {
      render(
        <Modal
          isOpen={true}
          onClose={mockOnClose}
          preventCloseWhileLoading={true}
          isLoading={true}
        >
          <div>Content</div>
        </Modal>
      );
      const closeButton = screen.getByTestId('modal-close-button');
      expect(closeButton).toBeDisabled();
    });
  });

  describe('Focus Management', () => {
    it('should focus first focusable element when modal opens', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <input data-testid="first-input" type="text" />
          <button>Submit</button>
        </Modal>
      );
      await waitFor(() => {
        const firstInput = screen.getByTestId('first-input');
        expect(firstInput).toHaveFocus();
      });
    });

    it('should trap focus inside modal', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <input data-testid="input-1" type="text" />
          <input data-testid="input-2" type="text" />
          <button data-testid="button-1">Submit</button>
        </Modal>
      );

      const input1 = screen.getByTestId('input-1');
      const input2 = screen.getByTestId('input-2');
      const button1 = screen.getByTestId('button-1');

      await userEvent.tab();
      expect(input2).toHaveFocus();

      await userEvent.tab();
      expect(button1).toHaveFocus();

      // Should cycle back to first element
      await userEvent.tab();
      expect(input1).toHaveFocus();
    });

    it('should restore focus to previous element when modal closes', async () => {
      const trigger = document.createElement('button');
      trigger.setAttribute('data-testid', 'trigger');
      document.body.appendChild(trigger);
      trigger.focus();

      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <input type="text" />
        </Modal>
      );

      rerender(
        <Modal isOpen={false} onClose={mockOnClose}>
          <input type="text" />
        </Modal>
      );

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });

      document.body.removeChild(trigger);
    });
  });

  describe('Body Scroll Lock', () => {
    it('should lock body scroll when modal opens', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when modal closes', () => {
      document.body.style.overflow = 'auto';
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
      expect(document.body.style.overflow).toBe('auto');
    });

    it('should restore body scroll on unmount', () => {
      document.body.style.overflow = 'auto';
      const { unmount } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('auto');
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
        <Modal isOpen={true} onClose={mockOnClose} title="Edit Character">
          <div>Content</div>
        </Modal>
      );
      const modal = screen.getByTestId('modal');
      expect(modal).toHaveAttribute('aria-labelledby');
    });

    it('should have aria-label when no title provided', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      const modal = screen.getByTestId('modal');
      expect(modal).toHaveAttribute('aria-label', 'Modal dialog');
    });

    it('should mark overlay as aria-hidden', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>Content</div>
        </Modal>
      );
      const overlay = screen.getByTestId('modal-overlay');
      expect(overlay).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} className="custom-modal">
          <div>Content</div>
        </Modal>
      );
      const modal = screen.getByTestId('modal');
      expect(modal).toHaveClass('custom-modal');
    });

    it('should use custom testId', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} testId="my-modal">
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByTestId('my-modal')).toBeInTheDocument();
    });

    it('should combine custom className with default classes', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} className="custom">
          <div>Content</div>
        </Modal>
      );
      const modal = screen.getByTestId('modal');
      expect(modal).toHaveClass('modal', 'custom');
    });
  });

  describe('Edge Cases', () => {
    it('should handle onClose being undefined gracefully', () => {
      expect(() => {
        render(
          <Modal isOpen={true} onClose={undefined as any}>
            <div>Content</div>
          </Modal>
        );
      }).not.toThrow();
    });

    it('should handle empty children', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          {null}
        </Modal>
      );
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('should handle complex nested children', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <div>
            <form>
              <input type="text" />
              <div>
                <button>Submit</button>
              </div>
            </form>
          </div>
        </Modal>
      );
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('should handle very long title', () => {
      const longTitle = 'This is a very long modal title that should still render correctly';
      render(
        <Modal isOpen={true} onClose={mockOnClose} title={longTitle}>
          <div>Content</div>
        </Modal>
      );
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle rapid open/close cycles', () => {
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

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with form submission', async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Create Character">
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Name" />
            <button type="submit">Create</button>
          </form>
        </Modal>
      );

      const input = screen.getByPlaceholderText('Name');
      const submitButton = screen.getByText('Create');

      await userEvent.type(input, 'Hegel');
      await userEvent.click(submitButton);

      expect(handleSubmit).toHaveBeenCalled();
    });

    it('should work with loading state during form submission', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose} preventCloseWhileLoading={true} isLoading={false}>
          <form>
            <button>Submit</button>
          </form>
        </Modal>
      );

      // Start loading
      rerender(
        <Modal isOpen={true} onClose={mockOnClose} preventCloseWhileLoading={true} isLoading={true}>
          <form>
            <button>Submit</button>
          </form>
        </Modal>
      );

      // Try to close - should not work
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).not.toHaveBeenCalled();

      // Loading complete
      rerender(
        <Modal isOpen={true} onClose={mockOnClose} preventCloseWhileLoading={true} isLoading={false}>
          <form>
            <button>Submit</button>
          </form>
        </Modal>
      );

      // Now closing should work
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should work with character creation modal use case', () => {
      render(
        <Modal
          isOpen={true}
          onClose={mockOnClose}
          title="Create Character"
          closeOnOverlayClick={false}
          preventCloseWhileLoading={true}
          isLoading={false}
        >
          <form>
            <input type="text" placeholder="Character name" />
            <input type="file" accept=".jpg,.png" />
            <button type="submit">Create</button>
          </form>
        </Modal>
      );

      // Should not close on overlay click
      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);
      expect(mockOnClose).not.toHaveBeenCalled();

      // Should show title
      expect(screen.getByText('Create Character')).toBeInTheDocument();
    });
  });
});
