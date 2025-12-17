/**
 * Unit tests for ProgressBar component.
 *
 * Test Coverage:
 * - Progress value handling (0-100, edge cases)
 * - All status values (pending, indexing, completed, failed)
 * - Label display
 * - Percentage display
 * - Status-based styling
 * - Edge cases (negative, >100, decimal values)
 * - Accessibility attributes
 * - Animated stripes for indexing status
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../ProgressBar';
import type { IndexingStatus } from '../../types/indexing';

describe('ProgressBar Component', () => {
  describe('Progress Value Rendering', () => {
    it('should render with 0% progress', () => {
      render(<ProgressBar progress={0} status="pending" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toBeInTheDocument();
      const fill = progressBar.querySelector('.progress-bar-fill');
      expect(fill).toHaveStyle({ width: '0%' });
    });

    it('should render with 50% progress', () => {
      render(<ProgressBar progress={50} status="indexing" />);
      const progressBar = screen.getByTestId('progress-bar');
      const fill = progressBar.querySelector('.progress-bar-fill');
      expect(fill).toHaveStyle({ width: '50%' });
    });

    it('should render with 100% progress', () => {
      render(<ProgressBar progress={100} status="completed" />);
      const progressBar = screen.getByTestId('progress-bar');
      const fill = progressBar.querySelector('.progress-bar-fill');
      expect(fill).toHaveStyle({ width: '100%' });
    });

    it('should render with intermediate progress values', () => {
      const progressValues = [25, 33, 67, 75, 99];
      progressValues.forEach((progress) => {
        const { unmount } = render(
          <ProgressBar progress={progress} status="indexing" testId={`progress-${progress}`} />
        );
        const progressBar = screen.getByTestId(`progress-${progress}`);
        const fill = progressBar.querySelector('.progress-bar-fill');
        expect(fill).toHaveStyle({ width: `${progress}%` });
        unmount();
      });
    });

    it('should handle decimal progress values', () => {
      render(<ProgressBar progress={45.5} status="indexing" />);
      const progressBar = screen.getByTestId('progress-bar');
      const fill = progressBar.querySelector('.progress-bar-fill');
      expect(fill).toHaveStyle({ width: '45.5%' });
    });
  });

  describe('Status-Based Styling', () => {
    it('should apply pending status class', () => {
      render(<ProgressBar progress={0} status="pending" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-pending');
    });

    it('should apply indexing status class', () => {
      render(<ProgressBar progress={50} status="indexing" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-indexing');
    });

    it('should apply completed status class', () => {
      render(<ProgressBar progress={100} status="completed" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-completed');
    });

    it('should apply failed status class', () => {
      render(<ProgressBar progress={50} status="failed" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-failed');
    });

    it('should have animated stripes for indexing status', () => {
      render(<ProgressBar progress={50} status="indexing" />);
      const fill = screen.getByTestId('progress-bar').querySelector('.progress-bar-fill');
      expect(fill).toHaveClass('progress-bar-fill-animated');
    });

    it('should not have animated stripes for completed status', () => {
      render(<ProgressBar progress={100} status="completed" />);
      const fill = screen.getByTestId('progress-bar').querySelector('.progress-bar-fill');
      expect(fill).not.toHaveClass('progress-bar-fill-animated');
    });

    it('should not have animated stripes for failed status', () => {
      render(<ProgressBar progress={50} status="failed" />);
      const fill = screen.getByTestId('progress-bar').querySelector('.progress-bar-fill');
      expect(fill).not.toHaveClass('progress-bar-fill-animated');
    });

    it('should not have animated stripes for pending status', () => {
      render(<ProgressBar progress={0} status="pending" />);
      const fill = screen.getByTestId('progress-bar').querySelector('.progress-bar-fill');
      expect(fill).not.toHaveClass('progress-bar-fill-animated');
    });
  });

  describe('Label Display', () => {
    it('should display label when provided', () => {
      render(<ProgressBar progress={50} status="indexing" label="Indexing book.pdf..." />);
      expect(screen.getByText('Indexing book.pdf...')).toBeInTheDocument();
    });

    it('should not display label when not provided', () => {
      const { container } = render(<ProgressBar progress={50} status="indexing" />);
      const label = container.querySelector('.progress-bar-label');
      expect(label).not.toBeInTheDocument();
    });

    it('should display label with proper styling', () => {
      render(<ProgressBar progress={50} status="indexing" label="Processing..." />);
      const label = screen.getByText('Processing...');
      expect(label).toHaveClass('progress-bar-label');
    });

    it('should handle empty label string', () => {
      const { container } = render(<ProgressBar progress={50} status="indexing" label="" />);
      const label = container.querySelector('.progress-bar-label');
      expect(label).not.toBeInTheDocument();
    });

    it('should handle long labels without breaking layout', () => {
      const longLabel =
        'Indexing a very long book title that should not break the progress bar layout.txt';
      render(<ProgressBar progress={50} status="indexing" label={longLabel} />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('should handle special characters in label', () => {
      const specialLabel = 'Indexing "book" & <file>.pdf';
      render(<ProgressBar progress={50} status="indexing" label={specialLabel} />);
      expect(screen.getByText(specialLabel)).toBeInTheDocument();
    });
  });

  describe('Percentage Display', () => {
    it('should show percentage by default', () => {
      render(<ProgressBar progress={75} status="indexing" />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should show percentage when showPercentage is true', () => {
      render(<ProgressBar progress={50} status="indexing" showPercentage={true} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should hide percentage when showPercentage is false', () => {
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

    it('should display percentage with proper styling', () => {
      render(<ProgressBar progress={65} status="indexing" />);
      const percentage = screen.getByText('65%');
      expect(percentage).toHaveClass('progress-bar-percentage');
    });

    it('should round decimal percentages to 1 decimal place', () => {
      render(<ProgressBar progress={45.678} status="indexing" />);
      expect(screen.getByText('45.7%')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should clamp negative progress to 0', () => {
      render(<ProgressBar progress={-10} status="pending" />);
      const fill = screen.getByTestId('progress-bar').querySelector('.progress-bar-fill');
      expect(fill).toHaveStyle({ width: '0%' });
    });

    it('should clamp progress > 100 to 100', () => {
      render(<ProgressBar progress={150} status="completed" />);
      const fill = screen.getByTestId('progress-bar').querySelector('.progress-bar-fill');
      expect(fill).toHaveStyle({ width: '100%' });
    });

    it('should handle NaN progress gracefully', () => {
      render(<ProgressBar progress={NaN} status="pending" />);
      const fill = screen.getByTestId('progress-bar').querySelector('.progress-bar-fill');
      // Should default to 0
      expect(fill).toHaveStyle({ width: '0%' });
    });

    it('should handle Infinity progress gracefully', () => {
      render(<ProgressBar progress={Infinity} status="indexing" />);
      const fill = screen.getByTestId('progress-bar').querySelector('.progress-bar-fill');
      // Should clamp to 100
      expect(fill).toHaveStyle({ width: '100%' });
    });

    it('should handle very small positive progress', () => {
      render(<ProgressBar progress={0.1} status="indexing" />);
      const fill = screen.getByTestId('progress-bar').querySelector('.progress-bar-fill');
      expect(fill).toHaveStyle({ width: '0.1%' });
    });

    it('should handle very close to 100 progress', () => {
      render(<ProgressBar progress={99.9} status="indexing" />);
      const fill = screen.getByTestId('progress-bar').querySelector('.progress-bar-fill');
      expect(fill).toHaveStyle({ width: '99.9%' });
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      render(<ProgressBar progress={50} status="indexing" className="custom-progress" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('custom-progress');
    });

    it('should apply multiple custom classes', () => {
      render(
        <ProgressBar progress={50} status="indexing" className="custom-progress another-class" />
      );
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('custom-progress', 'another-class');
    });

    it('should use custom testId', () => {
      render(
        <ProgressBar progress={50} status="indexing" testId="my-custom-progress" />
      );
      expect(screen.getByTestId('my-custom-progress')).toBeInTheDocument();
    });

    it('should combine custom className with status classes', () => {
      render(
        <ProgressBar progress={50} status="indexing" className="custom" />
      );
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-indexing', 'custom');
    });
  });

  describe('Accessibility', () => {
    it('should have role="progressbar"', () => {
      render(<ProgressBar progress={50} status="indexing" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('role', 'progressbar');
    });

    it('should have aria-valuenow attribute', () => {
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

    it('should have aria-label from label prop', () => {
      render(<ProgressBar progress={50} status="indexing" label="Indexing book.pdf" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-label', 'Indexing book.pdf');
    });

    it('should have default aria-label when no label provided', () => {
      render(<ProgressBar progress={50} status="indexing" />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-label', 'Progress: 50%');
    });

    it('should update aria-valuenow when progress changes', () => {
      const { rerender } = render(<ProgressBar progress={30} status="indexing" />);
      let progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '30');

      rerender(<ProgressBar progress={70} status="indexing" />);
      progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '70');
    });
  });

  describe('Status Transitions', () => {
    it('should update styling when status changes from pending to indexing', () => {
      const { rerender } = render(<ProgressBar progress={0} status="pending" />);
      let progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-pending');

      rerender(<ProgressBar progress={25} status="indexing" />);
      progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-indexing');
      expect(progressBar).not.toHaveClass('progress-bar-pending');
    });

    it('should update styling when status changes from indexing to completed', () => {
      const { rerender } = render(<ProgressBar progress={75} status="indexing" />);
      let progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-indexing');

      rerender(<ProgressBar progress={100} status="completed" />);
      progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-completed');
      expect(progressBar).not.toHaveClass('progress-bar-indexing');
    });

    it('should update styling when status changes to failed', () => {
      const { rerender } = render(<ProgressBar progress={50} status="indexing" />);
      let progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-indexing');

      rerender(<ProgressBar progress={50} status="failed" />);
      progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-failed');
      expect(progressBar).not.toHaveClass('progress-bar-indexing');
    });

    it('should remove animation when status changes from indexing to completed', () => {
      const { rerender } = render(<ProgressBar progress={75} status="indexing" />);
      let fill = screen.getByTestId('progress-bar').querySelector('.progress-bar-fill');
      expect(fill).toHaveClass('progress-bar-fill-animated');

      rerender(<ProgressBar progress={100} status="completed" />);
      fill = screen.getByTestId('progress-bar').querySelector('.progress-bar-fill');
      expect(fill).not.toHaveClass('progress-bar-fill-animated');
    });
  });

  describe('Integration Scenarios', () => {
    it('should work for book indexing with label and percentage', () => {
      render(
        <ProgressBar
          progress={45}
          status="indexing"
          label="philosophy.pdf"
          showPercentage={true}
        />
      );
      expect(screen.getByText('philosophy.pdf')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('should show completed state with 100% progress', () => {
      render(
        <ProgressBar progress={100} status="completed" label="Complete!" showPercentage={true} />
      );
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-completed');
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('Complete!')).toBeInTheDocument();
    });

    it('should show failed state with error indication', () => {
      render(
        <ProgressBar progress={30} status="failed" label="Failed to index" showPercentage={true} />
      );
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-failed');
      expect(screen.getByText('Failed to index')).toBeInTheDocument();
    });

    it('should work for initial pending state', () => {
      render(
        <ProgressBar progress={0} status="pending" label="Waiting..." showPercentage={true} />
      );
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('progress-bar-pending');
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Rendering Consistency', () => {
    it('should render consistently with same props', () => {
      const { rerender } = render(
        <ProgressBar progress={50} status="indexing" label="Test" />
      );
      const progressBar1 = screen.getByTestId('progress-bar');
      const classes1 = progressBar1.className;

      rerender(<ProgressBar progress={50} status="indexing" label="Test" />);
      const progressBar2 = screen.getByTestId('progress-bar');
      const classes2 = progressBar2.className;

      expect(classes1).toBe(classes2);
    });

    it('should update visual representation when progress changes', () => {
      const { rerender } = render(<ProgressBar progress={20} status="indexing" />);
      let fill = screen.getByTestId('progress-bar').querySelector('.progress-bar-fill');
      expect(fill).toHaveStyle({ width: '20%' });

      rerender(<ProgressBar progress={80} status="indexing" />);
      fill = screen.getByTestId('progress-bar').querySelector('.progress-bar-fill');
      expect(fill).toHaveStyle({ width: '80%' });
    });
  });

  describe('Visual Elements Structure', () => {
    it('should have progress track container', () => {
      render(<ProgressBar progress={50} status="indexing" />);
      const progressBar = screen.getByTestId('progress-bar');
      const track = progressBar.querySelector('.progress-bar-track');
      expect(track).toBeInTheDocument();
    });

    it('should have progress fill element', () => {
      render(<ProgressBar progress={50} status="indexing" />);
      const progressBar = screen.getByTestId('progress-bar');
      const fill = progressBar.querySelector('.progress-bar-fill');
      expect(fill).toBeInTheDocument();
    });

    it('should have label and percentage in proper container', () => {
      render(
        <ProgressBar progress={50} status="indexing" label="Test" showPercentage={true} />
      );
      const info = screen
        .getByTestId('progress-bar')
        .querySelector('.progress-bar-info');
      expect(info).toBeInTheDocument();
    });
  });
});
