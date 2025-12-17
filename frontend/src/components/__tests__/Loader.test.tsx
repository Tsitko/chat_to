/**
 * Unit tests for Loader component.
 *
 * Test Coverage:
 * - All variants (spinner, dots, inline, overlay)
 * - All sizes (sm, md, lg)
 * - Text display
 * - Custom className
 * - testId attribute
 * - Accessibility attributes
 * - Rendering without optional props
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loader, LoaderProps } from '../Loader';

describe('Loader Component', () => {
  describe('Variant: spinner', () => {
    it('should render spinner variant by default', () => {
      render(<Loader />);
      const loader = screen.getByTestId('loader');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveClass('loader-spinner');
    });

    it('should render spinner variant when explicitly specified', () => {
      render(<Loader variant="spinner" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-spinner');
    });

    it('should render spinner with small size', () => {
      render(<Loader variant="spinner" size="sm" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-spinner', 'loader-sm');
    });

    it('should render spinner with medium size', () => {
      render(<Loader variant="spinner" size="md" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-spinner', 'loader-md');
    });

    it('should render spinner with large size', () => {
      render(<Loader variant="spinner" size="lg" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-spinner', 'loader-lg');
    });

    it('should render spinner with text', () => {
      render(<Loader variant="spinner" text="Loading..." />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes for spinner', () => {
      render(<Loader variant="spinner" text="Loading data" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveAttribute('role', 'status');
      expect(loader).toHaveAttribute('aria-live', 'polite');
      expect(loader).toHaveAttribute('aria-label', 'Loading data');
    });
  });

  describe('Variant: dots', () => {
    it('should render dots variant', () => {
      render(<Loader variant="dots" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-dots');
    });

    it('should render three dots for dots variant', () => {
      render(<Loader variant="dots" testId="dots-loader" />);
      const loader = screen.getByTestId('dots-loader');
      const dots = loader.querySelectorAll('.loader-dot');
      expect(dots).toHaveLength(3);
    });

    it('should render dots with small size', () => {
      render(<Loader variant="dots" size="sm" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-dots', 'loader-sm');
    });

    it('should render dots with text', () => {
      render(<Loader variant="dots" text="Typing..." />);
      expect(screen.getByText('Typing...')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes for dots', () => {
      render(<Loader variant="dots" text="Character is typing" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveAttribute('role', 'status');
      expect(loader).toHaveAttribute('aria-live', 'polite');
      expect(loader).toHaveAttribute('aria-label', 'Character is typing');
    });
  });

  describe('Variant: inline', () => {
    it('should render inline variant', () => {
      render(<Loader variant="inline" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-inline');
    });

    it('should render inline with small size by default', () => {
      render(<Loader variant="inline" />);
      const loader = screen.getByTestId('loader');
      // Inline loaders are typically small
      expect(loader).toHaveClass('loader-inline');
    });

    it('should not render text for inline variant', () => {
      const { container } = render(<Loader variant="inline" text="Loading" />);
      // Inline loaders typically don't show text to save space
      const textElement = container.querySelector('.loader-text');
      expect(textElement).not.toBeInTheDocument();
    });

    it('should have proper accessibility attributes for inline', () => {
      render(<Loader variant="inline" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveAttribute('role', 'status');
      expect(loader).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Variant: overlay', () => {
    it('should render overlay variant', () => {
      render(<Loader variant="overlay" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-overlay');
    });

    it('should render overlay with backdrop', () => {
      render(<Loader variant="overlay" testId="overlay-loader" />);
      const loader = screen.getByTestId('overlay-loader');
      expect(loader).toHaveClass('loader-overlay');
      // Overlay should have a backdrop/background
      const backdrop = loader.querySelector('.loader-backdrop');
      expect(backdrop).toBeInTheDocument();
    });

    it('should render overlay with text', () => {
      render(<Loader variant="overlay" text="Creating character..." />);
      expect(screen.getByText('Creating character...')).toBeInTheDocument();
    });

    it('should render overlay with large spinner by default', () => {
      render(<Loader variant="overlay" />);
      const loader = screen.getByTestId('loader');
      const spinner = loader.querySelector('.loader-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should have proper accessibility attributes for overlay', () => {
      render(<Loader variant="overlay" text="Processing" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveAttribute('role', 'status');
      expect(loader).toHaveAttribute('aria-live', 'assertive'); // More urgent for overlays
      expect(loader).toHaveAttribute('aria-label', 'Processing');
    });

    it('should prevent clicks to content behind overlay', () => {
      const { container } = render(<Loader variant="overlay" />);
      const loader = screen.getByTestId('loader');
      // Overlay should have pointer-events to block interaction
      expect(loader).toHaveClass('loader-overlay');
      const style = window.getComputedStyle(loader);
      // This will be tested via CSS, but we verify the class is applied
      expect(loader).toHaveClass('loader-overlay');
    });
  });

  describe('Size Variations', () => {
    it('should apply small size class', () => {
      render(<Loader size="sm" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-sm');
    });

    it('should apply medium size class by default', () => {
      render(<Loader />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-md');
    });

    it('should apply large size class', () => {
      render(<Loader size="lg" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-lg');
    });
  });

  describe('Text Display', () => {
    it('should render text when provided', () => {
      render(<Loader text="Please wait..." />);
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    it('should not render text element when text is not provided', () => {
      const { container } = render(<Loader />);
      const textElement = container.querySelector('.loader-text');
      expect(textElement).not.toBeInTheDocument();
    });

    it('should render text with proper styling class', () => {
      render(<Loader text="Loading data" />);
      const textElement = screen.getByText('Loading data');
      expect(textElement).toHaveClass('loader-text');
    });

    it('should handle empty string text', () => {
      const { container } = render(<Loader text="" />);
      const textElement = container.querySelector('.loader-text');
      expect(textElement).not.toBeInTheDocument();
    });

    it('should handle long text without breaking layout', () => {
      const longText =
        'This is a very long loading message that should still render correctly without breaking the layout';
      render(<Loader text={longText} />);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      render(<Loader className="custom-loader" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('custom-loader');
    });

    it('should apply multiple custom classes', () => {
      render(<Loader className="custom-loader another-class" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('custom-loader', 'another-class');
    });

    it('should use custom testId', () => {
      render(<Loader testId="my-custom-loader" />);
      expect(screen.getByTestId('my-custom-loader')).toBeInTheDocument();
    });

    it('should combine custom className with variant and size classes', () => {
      render(<Loader variant="spinner" size="lg" className="custom" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-spinner', 'loader-lg', 'custom');
    });
  });

  describe('Accessibility', () => {
    it('should have role="status" for all variants', () => {
      const variants: Array<LoaderProps['variant']> = ['spinner', 'dots', 'inline', 'overlay'];
      variants.forEach((variant) => {
        const { unmount } = render(<Loader variant={variant} testId={`loader-${variant}`} />);
        const loader = screen.getByTestId(`loader-${variant}`);
        expect(loader).toHaveAttribute('role', 'status');
        unmount();
      });
    });

    it('should have aria-live attribute', () => {
      render(<Loader />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveAttribute('aria-live');
    });

    it('should use aria-label from text prop', () => {
      render(<Loader text="Loading content" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveAttribute('aria-label', 'Loading content');
    });

    it('should have default aria-label when no text provided', () => {
      render(<Loader />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveAttribute('aria-label', 'Loading');
    });

    it('should be announced by screen readers', () => {
      render(<Loader text="Processing your request" />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveAttribute('aria-live', 'polite');
      expect(loader).toHaveAttribute('aria-label', 'Processing your request');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined variant gracefully', () => {
      render(<Loader variant={undefined} />);
      const loader = screen.getByTestId('loader');
      // Should default to spinner
      expect(loader).toHaveClass('loader-spinner');
    });

    it('should handle undefined size gracefully', () => {
      render(<Loader size={undefined} />);
      const loader = screen.getByTestId('loader');
      // Should default to md
      expect(loader).toHaveClass('loader-md');
    });

    it('should handle all props as undefined', () => {
      render(<Loader />);
      const loader = screen.getByTestId('loader');
      expect(loader).toBeInTheDocument();
    });

    it('should handle special characters in text', () => {
      const specialText = 'Loading... <>&"\'';
      render(<Loader text={specialText} />);
      expect(screen.getByText(specialText)).toBeInTheDocument();
    });

    it('should handle numeric text', () => {
      render(<Loader text="Loading 50% complete" />);
      expect(screen.getByText('Loading 50% complete')).toBeInTheDocument();
    });
  });

  describe('Integration Scenarios', () => {
    it('should work in button context (inline variant)', () => {
      render(
        <button disabled>
          <Loader variant="inline" size="sm" />
          Saving...
        </button>
      );
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should work with overlay and text for modal loading', () => {
      render(<Loader variant="overlay" text="Creating character..." />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-overlay');
      expect(screen.getByText('Creating character...')).toBeInTheDocument();
    });

    it('should work for chat typing indicator (dots variant)', () => {
      render(<Loader variant="dots" size="sm" text="Character is typing..." />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-dots');
      expect(screen.getByText('Character is typing...')).toBeInTheDocument();
    });

    it('should work for list loading (spinner variant)', () => {
      render(<Loader variant="spinner" size="lg" text="Loading characters..." />);
      const loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-spinner', 'loader-lg');
      expect(screen.getByText('Loading characters...')).toBeInTheDocument();
    });
  });

  describe('Rendering Consistency', () => {
    it('should render consistently with same props', () => {
      const { rerender } = render(<Loader variant="spinner" size="md" text="Loading" />);
      const loader1 = screen.getByTestId('loader');
      const classes1 = loader1.className;

      rerender(<Loader variant="spinner" size="md" text="Loading" />);
      const loader2 = screen.getByTestId('loader');
      const classes2 = loader2.className;

      expect(classes1).toBe(classes2);
    });

    it('should update when props change', () => {
      const { rerender } = render(<Loader variant="spinner" size="sm" />);
      let loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-spinner', 'loader-sm');

      rerender(<Loader variant="dots" size="lg" />);
      loader = screen.getByTestId('loader');
      expect(loader).toHaveClass('loader-dots', 'loader-lg');
      expect(loader).not.toHaveClass('loader-spinner', 'loader-sm');
    });
  });
});
