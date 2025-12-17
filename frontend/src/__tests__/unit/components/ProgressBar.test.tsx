/**
 * Unit tests for ProgressBar component
 *
 * Test Coverage:
 * - All 4 statuses (pending, indexing, completed, failed)
 * - Progress values (0, 50, 100, negative, over 100)
 * - Label display
 * - Percentage display toggle
 * - Status-based styling
 * - Animated stripes during indexing
 * - Edge cases (invalid progress values)
 * - Accessibility attributes
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../../../components/ProgressBar';

describe('ProgressBar Component', () => {
  describe('Status: pending', () => {
    it('should render pending status with 0 progress', () => {
      render(<ProgressBar progress={0} status="pending" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveClass('progress-bar-pending');
    });

    it('should show correct width for pending status', () => {
      render(<ProgressBar progress={0} status="pending" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveStyle({ width: '0%' });
    });

    it('should not have animated stripes for pending status', () => {
      render(<ProgressBar progress={0} status="pending" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).not.toHaveClass('progress-bar-animated');
    });
  });

  describe('Status: indexing', () => {
    it('should render indexing status with progress', () => {
      render(<ProgressBar progress={45} status="indexing" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-indexing');
    });

    it('should show correct width for indexing status', () => {
      render(<ProgressBar progress={75} status="indexing" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveStyle({ width: '75%' });
    });

    it('should have animated stripes for indexing status', () => {
      render(<ProgressBar progress={50} status="indexing" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveClass('progress-bar-animated');
    });

    it('should update progress dynamically during indexing', () => {
      const { rerender } = render(<ProgressBar progress={10} status="indexing" />);
      let fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveStyle({ width: '10%' });

      rerender(<ProgressBar progress={50} status="indexing" />);
      fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveStyle({ width: '50%' });

      rerender(<ProgressBar progress={90} status="indexing" />);
      fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveStyle({ width: '90%' });
    });
  });

  describe('Status: completed', () => {
    it('should render completed status with 100% progress', () => {
      render(<ProgressBar progress={100} status="completed" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-completed');
    });

    it('should show full width for completed status', () => {
      render(<ProgressBar progress={100} status="completed" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveStyle({ width: '100%' });
    });

    it('should not have animated stripes for completed status', () => {
      render(<ProgressBar progress={100} status="completed" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).not.toHaveClass('progress-bar-animated');
    });

    it('should have success color for completed status', () => {
      render(<ProgressBar progress={100} status="completed" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveClass('progress-bar-success');
    });
  });

  describe('Status: failed', () => {
    it('should render failed status', () => {
      render(<ProgressBar progress={50} status="failed" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-failed');
    });

    it('should maintain progress width on failure', () => {
      render(<ProgressBar progress={65} status="failed" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveStyle({ width: '65%' });
    });

    it('should have error color for failed status', () => {
      render(<ProgressBar progress={50} status="failed" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveClass('progress-bar-error');
    });

    it('should not have animated stripes for failed status', () => {
      render(<ProgressBar progress={50} status="failed" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).not.toHaveClass('progress-bar-animated');
    });
  });

  describe('Props: progress', () => {
    it('should render 0% progress', () => {
      render(<ProgressBar progress={0} status="indexing" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveStyle({ width: '0%' });
    });

    it('should render 50% progress', () => {
      render(<ProgressBar progress={50} status="indexing" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveStyle({ width: '50%' });
    });

    it('should render 100% progress', () => {
      render(<ProgressBar progress={100} status="indexing" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveStyle({ width: '100%' });
    });

    it('should clamp negative progress to 0', () => {
      render(<ProgressBar progress={-10} status="indexing" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveStyle({ width: '0%' });
    });

    it('should clamp progress over 100 to 100', () => {
      render(<ProgressBar progress={150} status="indexing" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveStyle({ width: '100%' });
    });

    it('should handle decimal progress values', () => {
      render(<ProgressBar progress={66.67} status="indexing" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveStyle({ width: '66.67%' });
    });

    it('should handle very small progress values', () => {
      render(<ProgressBar progress={0.5} status="indexing" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveStyle({ width: '0.5%' });
    });
  });

  describe('Props: label', () => {
    it('should render without label when not provided', () => {
      render(<ProgressBar progress={50} status="indexing" />);
      expect(screen.queryByTestId('progress-bar-label')).not.toBeInTheDocument();
    });

    it('should render with provided label', () => {
      render(<ProgressBar progress={50} status="indexing" label="Indexing book.pdf..." />);
      expect(screen.getByText('Indexing book.pdf...')).toBeInTheDocument();
    });

    it('should handle empty label', () => {
      render(<ProgressBar progress={50} status="indexing" label="" />);
      expect(screen.queryByTestId('progress-bar-label')).not.toBeInTheDocument();
    });

    it('should handle very long label', () => {
      const longLabel = 'Indexing ' + 'a'.repeat(200) + '.pdf...';
      render(<ProgressBar progress={50} status="indexing" label={longLabel} />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('should handle label with special characters', () => {
      const label = 'Indexing <file> & "quotes".txt...';
      render(<ProgressBar progress={50} status="indexing" label={label} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  describe('Props: showPercentage', () => {
    it('should show percentage by default', () => {
      render(<ProgressBar progress={75} status="indexing" />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should show percentage when explicitly true', () => {
      render(<ProgressBar progress={45} status="indexing" showPercentage={true} />);
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('should hide percentage when false', () => {
      render(<ProgressBar progress={50} status="indexing" showPercentage={false} />);
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });

    it('should show 0% for zero progress', () => {
      render(<ProgressBar progress={0} status="pending" />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should show 100% for complete progress', () => {
      render(<ProgressBar progress={100} status="completed" />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should round decimal percentages', () => {
      render(<ProgressBar progress={66.67} status="indexing" />);
      expect(screen.getByText('67%')).toBeInTheDocument();
    });
  });

  describe('Props: className', () => {
    it('should apply custom className', () => {
      render(<ProgressBar progress={50} status="indexing" className="custom-progress" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('custom-progress');
    });

    it('should merge custom className with default classes', () => {
      render(<ProgressBar progress={50} status="indexing" className="my-class" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar');
      expect(progressBar).toHaveClass('my-class');
    });
  });

  describe('Props: testId', () => {
    it('should use default testId', () => {
      render(<ProgressBar progress={50} status="indexing" />);
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });

    it('should use custom testId', () => {
      render(<ProgressBar progress={50} status="indexing" testId="book-progress" />);
      expect(screen.getByTestId('book-progress')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="progressbar" for screen readers', () => {
      render(<ProgressBar progress={50} status="indexing" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('role', 'progressbar');
    });

    it('should have aria-valuenow with current progress', () => {
      render(<ProgressBar progress={75} status="indexing" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });

    it('should have aria-valuemin="0"', () => {
      render(<ProgressBar progress={50} status="indexing" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    });

    it('should have aria-valuemax="100"', () => {
      render(<ProgressBar progress={50} status="indexing" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have aria-label with status and progress', () => {
      render(<ProgressBar progress={50} status="indexing" label="Indexing book.pdf" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-label', 'Indexing book.pdf: 50%');
    });

    it('should have aria-label without label prop', () => {
      render(<ProgressBar progress={75} status="indexing" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-label', 'Progress: 75%');
    });
  });

  describe('Status Transitions', () => {
    it('should transition from pending to indexing', () => {
      const { rerender } = render(<ProgressBar progress={0} status="pending" />);
      expect(screen.getByTestId('progress-bar')).toHaveClass('progress-bar-pending');

      rerender(<ProgressBar progress={10} status="indexing" />);
      expect(screen.getByTestId('progress-bar')).toHaveClass('progress-bar-indexing');
    });

    it('should transition from indexing to completed', () => {
      const { rerender } = render(<ProgressBar progress={50} status="indexing" />);
      expect(screen.getByTestId('progress-bar')).toHaveClass('progress-bar-indexing');

      rerender(<ProgressBar progress={100} status="completed" />);
      expect(screen.getByTestId('progress-bar')).toHaveClass('progress-bar-completed');
    });

    it('should transition from indexing to failed', () => {
      const { rerender } = render(<ProgressBar progress={50} status="indexing" />);
      expect(screen.getByTestId('progress-bar')).toHaveClass('progress-bar-indexing');

      rerender(<ProgressBar progress={50} status="failed" />);
      expect(screen.getByTestId('progress-bar')).toHaveClass('progress-bar-failed');
    });
  });

  describe('Animation Behavior', () => {
    it('should only animate during indexing status', () => {
      const { rerender } = render(<ProgressBar progress={0} status="pending" />);
      expect(screen.getByTestId('progress-bar-fill')).not.toHaveClass('progress-bar-animated');

      rerender(<ProgressBar progress={50} status="indexing" />);
      expect(screen.getByTestId('progress-bar-fill')).toHaveClass('progress-bar-animated');

      rerender(<ProgressBar progress={100} status="completed" />);
      expect(screen.getByTestId('progress-bar-fill')).not.toHaveClass('progress-bar-animated');

      rerender(<ProgressBar progress={50} status="failed" />);
      expect(screen.getByTestId('progress-bar-fill')).not.toHaveClass('progress-bar-animated');
    });
  });

  describe('Edge Cases', () => {
    it('should handle NaN progress', () => {
      render(<ProgressBar progress={NaN} status="indexing" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveStyle({ width: '0%' });
    });

    it('should handle Infinity progress', () => {
      render(<ProgressBar progress={Infinity} status="indexing" />);
      const fill = screen.getByTestId('progress-bar-fill');
      expect(fill).toHaveStyle({ width: '100%' });
    });

    it('should handle undefined status gracefully', () => {
      // @ts-expect-error Testing invalid prop
      render(<ProgressBar progress={50} status={undefined} />);
      // Should have some default status class
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });

    it('should handle multiple rapid updates', () => {
      const { rerender } = render(<ProgressBar progress={0} status="indexing" />);

      for (let i = 0; i <= 100; i += 10) {
        rerender(<ProgressBar progress={i} status="indexing" />);
        const fill = screen.getByTestId('progress-bar-fill');
        expect(fill).toHaveStyle({ width: `${i}%` });
      }
    });
  });

  describe('Combination Tests', () => {
    it('should render complete progress bar with all props', () => {
      render(
        <ProgressBar
          progress={75}
          status="indexing"
          label="Indexing philosophy.pdf..."
          showPercentage={true}
          className="book-progress"
          testId="philosophy-progress"
        />
      );

      const progressBar = screen.getByTestId('philosophy-progress');
      expect(progressBar).toHaveClass('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-indexing');
      expect(progressBar).toHaveClass('book-progress');
      expect(screen.getByText('Indexing philosophy.pdf...')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar-fill')).toHaveStyle({ width: '75%' });
    });

    it('should render minimal progress bar', () => {
      render(<ProgressBar progress={50} status="indexing" showPercentage={false} />);

      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar-fill')).toHaveStyle({ width: '50%' });
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });
  });
});
