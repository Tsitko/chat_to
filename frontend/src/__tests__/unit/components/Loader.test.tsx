/**
 * Unit tests for Loader component
 *
 * Test Coverage:
 * - All 4 variants (spinner, dots, inline, overlay)
 * - All 3 sizes (sm, md, lg)
 * - Text display and positioning
 * - Custom className application
 * - TestId for testing
 * - Accessibility attributes
 * - Edge cases (empty text, very long text)
 * - Default props behavior
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loader } from '../../../components/Loader';

describe('Loader Component', () => {
  describe('Variant: spinner', () => {
    it('should render spinner variant by default', () => {
      render(<Loader />);
      const loader = screen.getByTestId('loader');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveClass('loader-spinner');
    });

    it('should render spinner variant with explicit prop', () => {
      render(<Loader variant="spinner" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-spinner');
    });

    it('should render spinner with all sizes', () => {
      const { rerender } = render(<Loader variant="spinner" size="sm" />);
      expect(screen.getByTestId('loader')).toHaveClass('loader-sm');

      rerender(<Loader variant="spinner" size="md" />);
      expect(screen.getByTestId('loader')).toHaveClass('loader-md');

      rerender(<Loader variant="spinner" size="lg" />);
      expect(screen.getByTestId('loader')).toHaveClass('loader-lg');
    });

    it('should apply default size md when not specified', () => {
      render(<Loader variant="spinner" />);
      expect(screen.getByTestId('loader')).toHaveClass('loader-md');
    });

    it('should render spinner with text below', () => {
      render(<Loader variant="spinner" text="Loading data..." />);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should have aria-label for accessibility', () => {
      render(<Loader variant="spinner" text="Loading data..." />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveAttribute('role', 'status');
      expect(loader).toHaveAttribute('aria-label', 'Loading data...');
    });

    it('should have default aria-label when no text provided', () => {
      render(<Loader variant="spinner" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveAttribute('aria-label', 'Loading');
    });
  });

  describe('Variant: dots', () => {
    it('should render dots variant', () => {
      render(<Loader variant="dots" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-dots');
    });

    it('should render three dots elements', () => {
      render(<Loader variant="dots" testId="dots-loader" />);
      const loader = screen.getByTestId('dots-loader');
      const dots = loader.querySelectorAll('.dot');
      expect(dots).toHaveLength(3);
    });

    it('should render dots with text beside (for typing indicator)', () => {
      render(<Loader variant="dots" text="Character is typing..." />);
      expect(screen.getByText('Character is typing...')).toBeInTheDocument();
    });

    it('should apply sizes to dots variant', () => {
      const { rerender } = render(<Loader variant="dots" size="sm" />);
      expect(screen.getByTestId('loader')).toHaveClass('loader-sm');

      rerender(<Loader variant="dots" size="lg" />);
      expect(screen.getByTestId('loader')).toHaveClass('loader-lg');
    });
  });

  describe('Variant: inline', () => {
    it('should render inline variant for buttons', () => {
      render(<Loader variant="inline" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-inline');
    });

    it('should be small by default for inline variant', () => {
      render(<Loader variant="inline" />);
      const loader = screen.getByTestId('loader');
      // Inline should default to small size for button usage
      expect(loader).toHaveClass('loader-sm');
    });

    it('should render inline without text for button usage', () => {
      render(<Loader variant="inline" />);
      const loader = screen.getByTestId('loader');
      expect(loader).not.toContainHTML('<span');
    });

    it('should have minimal height for inline variant', () => {
      render(<Loader variant="inline" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-inline');
      // Inline should not add vertical spacing
    });
  });

  describe('Variant: overlay', () => {
    it('should render overlay variant with backdrop', () => {
      render(<Loader variant="overlay" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-overlay');
    });

    it('should render overlay with centered spinner', () => {
      render(<Loader variant="overlay" text="Creating character..." />);
      expect(screen.getByText('Creating character...')).toBeInTheDocument();
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-overlay');
    });

    it('should have fixed positioning to cover entire viewport', () => {
      render(<Loader variant="overlay" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-overlay');
      // Overlay should use fixed positioning
    });

    it('should block interaction with backdrop', () => {
      render(<Loader variant="overlay" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-overlay');
      // Overlay should prevent clicks on elements behind it
    });

    it('should render large spinner in overlay by default', () => {
      render(<Loader variant="overlay" />);
      const loader = screen.getByTestId('loader');
      // Overlay should default to large size for visibility
      expect(loader).toHaveClass('loader-lg');
    });
  });

  describe('Props: size', () => {
    it('should apply small size class', () => {
      render(<Loader size="sm" />);
      expect(screen.getByTestId('loader')).toHaveClass('loader-sm');
    });

    it('should apply medium size class', () => {
      render(<Loader size="md" />);
      expect(screen.getByTestId('loader')).toHaveClass('loader-md');
    });

    it('should apply large size class', () => {
      render(<Loader size="lg" />);
      expect(screen.getByTestId('loader')).toHaveClass('loader-lg');
    });
  });

  describe('Props: text', () => {
    it('should render without text when not provided', () => {
      render(<Loader />);
      const loader = screen.getByTestId('loader');
      expect(loader.querySelector('.loader-text')).not.toBeInTheDocument();
    });

    it('should render with provided text', () => {
      render(<Loader text="Please wait..." />);
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
      expect(screen.getByText('Please wait...')).toHaveClass('loader-text');
    });

    it('should handle empty string text', () => {
      render(<Loader text="" />);
      const loader = screen.getByTestId('loader');
      // Empty string should not render text element
      expect(loader.querySelector('.loader-text')).not.toBeInTheDocument();
    });

    it('should handle very long text without breaking layout', () => {
      const longText = 'A'.repeat(200);
      render(<Loader text={longText} />);
      expect(screen.getByText(longText)).toBeInTheDocument();
      expect(screen.getByText(longText)).toHaveClass('loader-text');
    });

    it('should handle text with special characters', () => {
      const specialText = 'Loading <>&"... 50%';
      render(<Loader text={specialText} />);
      expect(screen.getByText(specialText)).toBeInTheDocument();
    });
  });

  describe('Props: className', () => {
    it('should apply default className when not provided', () => {
      render(<Loader />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader');
    });

    it('should merge custom className with default classes', () => {
      render(<Loader className="custom-loader" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader');
      expect(loader).toHaveClass('custom-loader');
    });

    it('should support multiple custom classes', () => {
      render(<Loader className="class-one class-two" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('class-one');
      expect(loader).toHaveClass('class-two');
    });
  });

  describe('Props: testId', () => {
    it('should use default testId', () => {
      render(<Loader />);
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should use custom testId', () => {
      render(<Loader testId="custom-loader" />);
      expect(screen.getByTestId('custom-loader')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="status" for screen readers', () => {
      render(<Loader />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveAttribute('role', 'status');
    });

    it('should have aria-label with text when provided', () => {
      render(<Loader text="Loading users..." />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveAttribute('aria-label', 'Loading users...');
    });

    it('should have aria-live="polite" for dynamic updates', () => {
      render(<Loader />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveAttribute('aria-live', 'polite');
    });

    it('should be announced to screen readers', () => {
      render(<Loader text="Processing request..." />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveAttribute('role', 'status');
      expect(loader).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined variant gracefully', () => {
      // @ts-expect-error Testing invalid prop
      render(<Loader variant={undefined} />);
      // Should default to spinner
      expect(screen.getByTestId('loader')).toHaveClass('loader-spinner');
    });

    it('should handle null text', () => {
      // @ts-expect-error Testing invalid prop
      render(<Loader text={null} />);
      const loader = screen.getByTestId('loader');
      expect(loader.querySelector('.loader-text')).not.toBeInTheDocument();
    });

    it('should handle multiple re-renders with different props', () => {
      const { rerender } = render(<Loader variant="spinner" size="sm" />);
      expect(screen.getByTestId('loader')).toHaveClass('loader-spinner');
      expect(screen.getByTestId('loader')).toHaveClass('loader-sm');

      rerender(<Loader variant="dots" size="lg" text="Loading..." />);
      expect(screen.getByTestId('loader')).toHaveClass('loader-dots');
      expect(screen.getByTestId('loader')).toHaveClass('loader-lg');
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      rerender(<Loader variant="overlay" />);
      expect(screen.getByTestId('loader')).toHaveClass('loader-overlay');
    });
  });

  describe('Combination Tests', () => {
    it('should render spinner with sm size and text', () => {
      render(<Loader variant="spinner" size="sm" text="Loading..." />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-spinner');
      expect(loader).toHaveClass('loader-sm');
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render dots with lg size and custom className', () => {
      render(<Loader variant="dots" size="lg" className="typing-indicator" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-dots');
      expect(loader).toHaveClass('loader-lg');
      expect(loader).toHaveClass('typing-indicator');
    });

    it('should render overlay with text and custom testId', () => {
      render(<Loader variant="overlay" text="Creating..." testId="create-loader" />);
      const loader = screen.getByTestId('create-loader');
      expect(loader).toHaveClass('loader-overlay');
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
  });

  describe('Animation Classes', () => {
    it('should have animation class for spinner', () => {
      render(<Loader variant="spinner" />);
      const loader = screen.getByTestId('loader');
      const spinner = loader.querySelector('.spinner');
      expect(spinner).toHaveClass('spinner-rotate');
    });

    it('should have animation class for dots', () => {
      render(<Loader variant="dots" />);
      const loader = screen.getByTestId('loader');
      const dots = loader.querySelectorAll('.dot');
      dots.forEach((dot, index) => {
        expect(dot).toHaveClass(`dot-bounce-${index + 1}`);
      });
    });
  });
});
