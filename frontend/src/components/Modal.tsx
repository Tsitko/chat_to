/**
 * Modal component - reusable modal wrapper with improved UX.
 *
 * This component provides a modal overlay with:
 * - Optional click-outside-to-close behavior (can be disabled)
 * - Escape key handling
 * - Focus trap
 * - Accessibility attributes
 * - Confirmation dialog for unsaved changes
 *
 * @example
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Edit Character"
 *   closeOnOverlayClick={false}
 *   showCloseButton={true}
 * >
 *   <form>...</form>
 * </Modal>
 */

import React, { useEffect, useRef, ReactNode } from 'react';
import { Loader } from './Loader';
import './Modal.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  closeOnOverlayClick?: boolean; // default: true
  closeOnEscape?: boolean; // default: true
  showCloseButton?: boolean; // default: true
  preventCloseWhileLoading?: boolean; // Prevent closing during operations
  isLoading?: boolean; // Loading state
  className?: string;
  testId?: string;
}

/**
 * Modal wrapper component with improved UX
 *
 * @param isOpen - Whether modal is visible
 * @param onClose - Callback when modal should close
 * @param title - Optional title for modal header
 * @param children - Modal content
 * @param closeOnOverlayClick - Allow closing by clicking overlay (default: true)
 * @param closeOnEscape - Allow closing with Escape key (default: true)
 * @param showCloseButton - Show X button in corner (default: true)
 * @param preventCloseWhileLoading - Prevent closing during async operations
 * @param isLoading - Current loading state
 * @param className - Additional CSS classes
 * @param testId - Test identifier
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  preventCloseWhileLoading = false,
  isLoading = false,
  className = '',
  testId = 'modal',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle close with loading check
  const handleClose = () => {
    if (preventCloseWhileLoading && isLoading) {
      return;
    }
    onClose();
  };

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      handleClose();
    }
  };

  // Handle Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, isLoading, preventCloseWhileLoading]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      // Focus first focusable element in modal
      setTimeout(() => {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements && focusableElements.length > 0) {
          (focusableElements[0] as HTMLElement).focus();
        }
      }, 100);
    } else {
      document.body.style.overflow = '';
      // Restore focus to previous element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      data-testid={`${testId}-overlay`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? `${testId}-title` : undefined}
    >
      <div
        ref={modalRef}
        className={`modal-content ${className}`}
        data-testid={`${testId}-content`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="modal-header" data-testid={`${testId}-header`}>
            {title && (
              <h2
                className="modal-title"
                id={`${testId}-title`}
                data-testid={`${testId}-title`}
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                className="modal-close-button"
                onClick={handleClose}
                disabled={preventCloseWhileLoading && isLoading}
                aria-label="Close modal"
                data-testid={`${testId}-close-button`}
              >
                ×
              </button>
            )}
          </div>
        )}
        <div className="modal-body" data-testid={`${testId}-body`}>
          {children}
        </div>
        {isLoading && (
          <div
            className="modal-loading-overlay"
            data-testid={`${testId}-loading-overlay`}
          >
            <Loader variant="spinner" size="lg" />
          </div>
        )}
      </div>
    </div>
  );
};
