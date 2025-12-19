/**
 * EmotionDisplay Component Tests.
 *
 * Comprehensive TDD tests for EmotionDisplay component covering:
 * - Basic rendering with all emotion values
 * - Color class assignment for all ranges (0-33, 34-66, 67-100)
 * - Boundary value testing (33, 34, 66, 67)
 * - Russian label verification
 * - Edge cases (all zeros, all 100s, mixed values)
 * - Component structure and accessibility
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { EmotionDisplay } from '../EmotionDisplay';
import type { Emotions } from '../../types/message';

describe('EmotionDisplay Component', () => {
  describe('Basic Rendering', () => {
    it('should render the emotion display container', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      render(<EmotionDisplay emotions={emotions} />);

      const container = screen.getByTestId('emotion-display');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('emotion-display');
    });

    it('should render all five emotions', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      render(<EmotionDisplay emotions={emotions} />);

      expect(screen.getByTestId('emotion-fear')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-anger')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-sadness')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-disgust')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-joy')).toBeInTheDocument();
    });

    it('should display all emotion values correctly', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      render(<EmotionDisplay emotions={emotions} />);

      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('90')).toBeInTheDocument();
    });

    it('should render with correct HTML structure', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionDisplay = container.querySelector('.emotion-display');
      expect(emotionDisplay).toBeInTheDocument();

      const emotionItems = container.querySelectorAll('.emotion-item');
      expect(emotionItems).toHaveLength(5);
    });
  });

  describe('Russian Labels', () => {
    it('should display Russian label for fear (Страх)', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      render(<EmotionDisplay emotions={emotions} />);

      expect(screen.getByText(/Страх/)).toBeInTheDocument();
    });

    it('should display Russian label for anger (Злость)', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      render(<EmotionDisplay emotions={emotions} />);

      expect(screen.getByText(/Злость/)).toBeInTheDocument();
    });

    it('should display Russian label for sadness (Печаль)', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      render(<EmotionDisplay emotions={emotions} />);

      expect(screen.getByText(/Печаль/)).toBeInTheDocument();
    });

    it('should display Russian label for disgust (Отвращение)', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      render(<EmotionDisplay emotions={emotions} />);

      expect(screen.getByText(/Отвращение/)).toBeInTheDocument();
    });

    it('should display Russian label for joy (Радость)', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      render(<EmotionDisplay emotions={emotions} />);

      expect(screen.getByText(/Радость/)).toBeInTheDocument();
    });

    it('should display all labels in correct order', () => {
      const emotions: Emotions = {
        fear: 1,
        anger: 2,
        sadness: 3,
        disgust: 4,
        joy: 5,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const labels = container.querySelectorAll('.emotion-label');
      expect(labels[0]).toHaveTextContent('Страх');
      expect(labels[1]).toHaveTextContent('Злость');
      expect(labels[2]).toHaveTextContent('Печаль');
      expect(labels[3]).toHaveTextContent('Отвращение');
      expect(labels[4]).toHaveTextContent('Радость');
    });
  });

  describe('Color Class Assignment - Low Range (0-33)', () => {
    it('should apply emotion-low class for value 0', () => {
      const emotions: Emotions = {
        fear: 0,
        anger: 0,
        sadness: 0,
        disgust: 0,
        joy: 0,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-low');
      });
    });

    it('should apply emotion-low class for value 1', () => {
      const emotions: Emotions = {
        fear: 1,
        anger: 1,
        sadness: 1,
        disgust: 1,
        joy: 1,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-low');
      });
    });

    it('should apply emotion-low class for value 15', () => {
      const emotions: Emotions = {
        fear: 15,
        anger: 15,
        sadness: 15,
        disgust: 15,
        joy: 15,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-low');
      });
    });

    it('should apply emotion-low class for boundary value 33', () => {
      const emotions: Emotions = {
        fear: 33,
        anger: 33,
        sadness: 33,
        disgust: 33,
        joy: 33,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-low');
        expect(value).not.toHaveClass('emotion-medium');
      });
    });

    it('should apply emotion-low class for different values in range', () => {
      const emotions: Emotions = {
        fear: 5,
        anger: 10,
        sadness: 20,
        disgust: 25,
        joy: 33,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-low');
      });
    });
  });

  describe('Color Class Assignment - Medium Range (34-66)', () => {
    it('should apply emotion-medium class for boundary value 34', () => {
      const emotions: Emotions = {
        fear: 34,
        anger: 34,
        sadness: 34,
        disgust: 34,
        joy: 34,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-medium');
        expect(value).not.toHaveClass('emotion-low');
        expect(value).not.toHaveClass('emotion-high');
      });
    });

    it('should apply emotion-medium class for value 40', () => {
      const emotions: Emotions = {
        fear: 40,
        anger: 45,
        sadness: 50,
        disgust: 55,
        joy: 60,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-medium');
      });
    });

    it('should apply emotion-medium class for value 50', () => {
      const emotions: Emotions = {
        fear: 50,
        anger: 50,
        sadness: 50,
        disgust: 50,
        joy: 50,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-medium');
      });
    });

    it('should apply emotion-medium class for boundary value 66', () => {
      const emotions: Emotions = {
        fear: 66,
        anger: 66,
        sadness: 66,
        disgust: 66,
        joy: 66,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-medium');
        expect(value).not.toHaveClass('emotion-high');
      });
    });

    it('should apply emotion-medium class for value 35', () => {
      const emotions: Emotions = {
        fear: 35,
        anger: 35,
        sadness: 35,
        disgust: 35,
        joy: 35,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-medium');
      });
    });
  });

  describe('Color Class Assignment - High Range (67-100)', () => {
    it('should apply emotion-high class for boundary value 67', () => {
      const emotions: Emotions = {
        fear: 67,
        anger: 67,
        sadness: 67,
        disgust: 67,
        joy: 67,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-high');
        expect(value).not.toHaveClass('emotion-medium');
        expect(value).not.toHaveClass('emotion-low');
      });
    });

    it('should apply emotion-high class for value 70', () => {
      const emotions: Emotions = {
        fear: 70,
        anger: 75,
        sadness: 80,
        disgust: 85,
        joy: 90,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-high');
      });
    });

    it('should apply emotion-high class for value 100', () => {
      const emotions: Emotions = {
        fear: 100,
        anger: 100,
        sadness: 100,
        disgust: 100,
        joy: 100,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-high');
      });
    });

    it('should apply emotion-high class for value 68', () => {
      const emotions: Emotions = {
        fear: 68,
        anger: 68,
        sadness: 68,
        disgust: 68,
        joy: 68,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-high');
      });
    });

    it('should apply emotion-high class for value 95', () => {
      const emotions: Emotions = {
        fear: 95,
        anger: 95,
        sadness: 95,
        disgust: 95,
        joy: 95,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-high');
      });
    });
  });

  describe('Boundary Value Testing', () => {
    it('should correctly classify boundary values 33, 34', () => {
      const emotions: Emotions = {
        fear: 33,
        anger: 34,
        sadness: 50,
        disgust: 66,
        joy: 67,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const fearElement = screen.getByTestId('emotion-fear').querySelector('.emotion-value');
      const angerElement = screen.getByTestId('emotion-anger').querySelector('.emotion-value');

      expect(fearElement).toHaveClass('emotion-low');
      expect(angerElement).toHaveClass('emotion-medium');
    });

    it('should correctly classify boundary values 66, 67', () => {
      const emotions: Emotions = {
        fear: 33,
        anger: 34,
        sadness: 50,
        disgust: 66,
        joy: 67,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const disgustElement = screen.getByTestId('emotion-disgust').querySelector('.emotion-value');
      const joyElement = screen.getByTestId('emotion-joy').querySelector('.emotion-value');

      expect(disgustElement).toHaveClass('emotion-medium');
      expect(joyElement).toHaveClass('emotion-high');
    });

    it('should handle all boundary values in one render', () => {
      const emotions: Emotions = {
        fear: 0,
        anger: 33,
        sadness: 34,
        disgust: 66,
        joy: 67,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const fearValue = screen.getByTestId('emotion-fear').querySelector('.emotion-value');
      const angerValue = screen.getByTestId('emotion-anger').querySelector('.emotion-value');
      const sadnessValue = screen.getByTestId('emotion-sadness').querySelector('.emotion-value');
      const disgustValue = screen.getByTestId('emotion-disgust').querySelector('.emotion-value');
      const joyValue = screen.getByTestId('emotion-joy').querySelector('.emotion-value');

      expect(fearValue).toHaveClass('emotion-low');
      expect(angerValue).toHaveClass('emotion-low');
      expect(sadnessValue).toHaveClass('emotion-medium');
      expect(disgustValue).toHaveClass('emotion-medium');
      expect(joyValue).toHaveClass('emotion-high');
    });

    it('should handle upper boundary value 100', () => {
      const emotions: Emotions = {
        fear: 100,
        anger: 100,
        sadness: 100,
        disgust: 100,
        joy: 100,
      };
      render(<EmotionDisplay emotions={emotions} />);

      expect(screen.getAllByText('100')).toHaveLength(5);
    });

    it('should handle lower boundary value 0', () => {
      const emotions: Emotions = {
        fear: 0,
        anger: 0,
        sadness: 0,
        disgust: 0,
        joy: 0,
      };
      render(<EmotionDisplay emotions={emotions} />);

      expect(screen.getAllByText('0')).toHaveLength(5);
    });
  });

  describe('Mixed Emotion Values', () => {
    it('should correctly display mixed low, medium, and high values', () => {
      const emotions: Emotions = {
        fear: 15,
        anger: 45,
        sadness: 75,
        disgust: 5,
        joy: 90,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const fearValue = screen.getByTestId('emotion-fear').querySelector('.emotion-value');
      const angerValue = screen.getByTestId('emotion-anger').querySelector('.emotion-value');
      const sadnessValue = screen.getByTestId('emotion-sadness').querySelector('.emotion-value');
      const disgustValue = screen.getByTestId('emotion-disgust').querySelector('.emotion-value');
      const joyValue = screen.getByTestId('emotion-joy').querySelector('.emotion-value');

      expect(fearValue).toHaveClass('emotion-low');
      expect(angerValue).toHaveClass('emotion-medium');
      expect(sadnessValue).toHaveClass('emotion-high');
      expect(disgustValue).toHaveClass('emotion-low');
      expect(joyValue).toHaveClass('emotion-high');
    });

    it('should handle realistic emotion combination from task example', () => {
      const emotions: Emotions = {
        fear: 15,
        anger: 45,
        sadness: 10,
        disgust: 5,
        joy: 75,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const fearValue = screen.getByTestId('emotion-fear').querySelector('.emotion-value');
      const angerValue = screen.getByTestId('emotion-anger').querySelector('.emotion-value');
      const sadnessValue = screen.getByTestId('emotion-sadness').querySelector('.emotion-value');
      const disgustValue = screen.getByTestId('emotion-disgust').querySelector('.emotion-value');
      const joyValue = screen.getByTestId('emotion-joy').querySelector('.emotion-value');

      expect(fearValue).toHaveClass('emotion-low');
      expect(angerValue).toHaveClass('emotion-medium');
      expect(sadnessValue).toHaveClass('emotion-low');
      expect(disgustValue).toHaveClass('emotion-low');
      expect(joyValue).toHaveClass('emotion-high');
    });

    it('should handle all different ranges simultaneously', () => {
      const emotions: Emotions = {
        fear: 20,
        anger: 50,
        sadness: 80,
        disgust: 10,
        joy: 60,
      };
      render(<EmotionDisplay emotions={emotions} />);

      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('60')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle all emotions at zero', () => {
      const emotions: Emotions = {
        fear: 0,
        anger: 0,
        sadness: 0,
        disgust: 0,
        joy: 0,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      expect(emotionValues).toHaveLength(5);
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-low');
        expect(value).toHaveTextContent('0');
      });
    });

    it('should handle all emotions at maximum (100)', () => {
      const emotions: Emotions = {
        fear: 100,
        anger: 100,
        sadness: 100,
        disgust: 100,
        joy: 100,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      expect(emotionValues).toHaveLength(5);
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-high');
        expect(value).toHaveTextContent('100');
      });
    });

    it('should handle all emotions at lower medium boundary', () => {
      const emotions: Emotions = {
        fear: 34,
        anger: 34,
        sadness: 34,
        disgust: 34,
        joy: 34,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-medium');
      });
    });

    it('should handle single digit values', () => {
      const emotions: Emotions = {
        fear: 1,
        anger: 2,
        sadness: 3,
        disgust: 4,
        joy: 5,
      };
      render(<EmotionDisplay emotions={emotions} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should handle double digit values', () => {
      const emotions: Emotions = {
        fear: 10,
        anger: 25,
        sadness: 50,
        disgust: 75,
        joy: 99,
      };
      render(<EmotionDisplay emotions={emotions} />);

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('99')).toBeInTheDocument();
    });

    it('should handle triple digit value (100)', () => {
      const emotions: Emotions = {
        fear: 100,
        anger: 50,
        sadness: 25,
        disgust: 10,
        joy: 5,
      };
      render(<EmotionDisplay emotions={emotions} />);

      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should have correct emotion item structure', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const fearItem = screen.getByTestId('emotion-fear');
      expect(fearItem).toHaveClass('emotion-item');

      const label = fearItem.querySelector('.emotion-label');
      const value = fearItem.querySelector('.emotion-value');

      expect(label).toBeInTheDocument();
      expect(value).toBeInTheDocument();
    });

    it('should separate label and value with colon', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      render(<EmotionDisplay emotions={emotions} />);

      const labels = screen.getAllByText(/:/);
      expect(labels.length).toBeGreaterThanOrEqual(5);
    });

    it('should render emotions in correct order', () => {
      const emotions: Emotions = {
        fear: 1,
        anger: 2,
        sadness: 3,
        disgust: 4,
        joy: 5,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionItems = container.querySelectorAll('.emotion-item');
      const testIds = Array.from(emotionItems).map((item) => item.getAttribute('data-testid'));

      expect(testIds).toEqual([
        'emotion-fear',
        'emotion-anger',
        'emotion-sadness',
        'emotion-disgust',
        'emotion-joy',
      ]);
    });
  });

  describe('Accessibility', () => {
    it('should have testid attributes for all emotion elements', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      render(<EmotionDisplay emotions={emotions} />);

      expect(screen.getByTestId('emotion-display')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-fear')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-anger')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-sadness')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-disgust')).toBeInTheDocument();
      expect(screen.getByTestId('emotion-joy')).toBeInTheDocument();
    });

    it('should use semantic HTML structure', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const displayDiv = container.querySelector('div.emotion-display');
      expect(displayDiv).toBeInTheDocument();

      const spans = container.querySelectorAll('span');
      expect(spans.length).toBeGreaterThan(0);
    });
  });

  describe('Consistency Tests', () => {
    it('should render same output for same input', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };

      const { container: container1 } = render(<EmotionDisplay emotions={emotions} />);
      const { container: container2 } = render(<EmotionDisplay emotions={emotions} />);

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it('should update when props change', () => {
      const emotions1: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };

      const { rerender } = render(<EmotionDisplay emotions={emotions1} />);
      expect(screen.getByText('25')).toBeInTheDocument();

      const emotions2: Emotions = {
        fear: 80,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };

      rerender(<EmotionDisplay emotions={emotions2} />);
      expect(screen.getByText('80')).toBeInTheDocument();
      expect(screen.queryByText('25')).not.toBeInTheDocument();
    });
  });

  describe('CSS Class Validation', () => {
    it('should not apply multiple color classes to same value', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      emotionValues.forEach((value) => {
        const classes = Array.from(value.classList);
        const colorClasses = classes.filter((c) =>
          ['emotion-low', 'emotion-medium', 'emotion-high'].includes(c)
        );
        expect(colorClasses).toHaveLength(1);
      });
    });

    it('should always include base emotion-value class', () => {
      const emotions: Emotions = {
        fear: 25,
        anger: 50,
        sadness: 75,
        disgust: 10,
        joy: 90,
      };
      const { container } = render(<EmotionDisplay emotions={emotions} />);

      const emotionValues = container.querySelectorAll('.emotion-value');
      emotionValues.forEach((value) => {
        expect(value).toHaveClass('emotion-value');
      });
    });
  });
});
