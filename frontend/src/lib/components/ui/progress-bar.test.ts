/**
 * @file progress-bar.test.ts
 * Comprehensive tests for ProgressBar component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import ProgressBar from './progress-bar.svelte';
import { assertionUtils, setupBrowserMocks, cleanupBrowserMocks } from '@tests/test-utils';

describe('ProgressBar Component', () => {
	beforeEach(() => {
		setupBrowserMocks();
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
		cleanupBrowserMocks();
	});

	describe('Basic Rendering', () => {
		it('should render with minimum required props', () => {
			render(ProgressBar, {
				props: { value: 50 }
			});

			const progressBar = screen.getByRole('progressbar');
			expect(progressBar).toBeInTheDocument();
			expect(progressBar).toHaveAttribute('aria-valuenow', '50');
			expect(progressBar).toHaveAttribute('aria-valuemin', '0');
			expect(progressBar).toHaveAttribute('aria-valuemax', '100');
		});

		it('should render with label when provided', () => {
			render(ProgressBar, {
				props: {
					value: 75,
					label: 'Processing Image'
				}
			});

			expect(screen.getByText('Processing Image')).toBeInTheDocument();
			expect(screen.getByLabelText('Processing Image')).toBeInTheDocument();
		});

		it('should show percentage value by default', () => {
			render(ProgressBar, {
				props: {
					value: 42,
					label: 'Test Progress'
				}
			});

			expect(screen.getByText('42%')).toBeInTheDocument();
		});

		it('should hide percentage value when showValue is false', () => {
			render(ProgressBar, {
				props: {
					value: 42,
					label: 'Test Progress',
					showValue: false
				}
			});

			expect(screen.queryByText('42%')).not.toBeInTheDocument();
		});

		it('should use custom id when provided', () => {
			render(ProgressBar, {
				props: {
					value: 50,
					id: 'custom-progress'
				}
			});

			const progressBar = screen.getByRole('progressbar');
			expect(progressBar).toHaveAttribute('id', 'custom-progress');
		});
	});

	describe('Value Handling', () => {
		it('should clamp negative values to 0', () => {
			render(ProgressBar, {
				props: { value: -25 }
			});

			const progressBar = screen.getByRole('progressbar');
			expect(progressBar).toHaveAttribute('aria-valuenow', '0');

			const progressFill = progressBar.querySelector('div[aria-hidden="true"]') as HTMLElement;
			expect(progressFill).toHaveStyle('width: 0%');
		});

		it('should clamp values over 100 to 100', () => {
			render(ProgressBar, {
				props: { value: 150 }
			});

			const progressBar = screen.getByRole('progressbar');
			expect(progressBar).toHaveAttribute('aria-valuenow', '100');

			const progressFill = progressBar.querySelector('div[aria-hidden="true"]') as HTMLElement;
			expect(progressFill).toHaveStyle('width: 100%');
		});

		it('should handle decimal values correctly', () => {
			render(ProgressBar, {
				props: {
					value: 33.7,
					label: 'Test'
				}
			});

			const progressBar = screen.getByRole('progressbar');
			expect(progressBar).toHaveAttribute('aria-valuenow', '33.7');
			expect(screen.getByText('34%')).toBeInTheDocument(); // Rounded
		});

		it('should handle zero value', () => {
			render(ProgressBar, {
				props: { value: 0 }
			});

			const progressBar = screen.getByRole('progressbar');
			expect(progressBar).toHaveAttribute('aria-valuenow', '0');

			const progressFill = progressBar.querySelector('div[aria-hidden="true"]') as HTMLElement;
			expect(progressFill).toHaveStyle('width: 0%');
		});

		it('should handle 100% completion', () => {
			render(ProgressBar, {
				props: { value: 100 }
			});

			const progressBar = screen.getByRole('progressbar');
			expect(progressBar).toHaveAttribute('aria-valuenow', '100');

			const progressFill = progressBar.querySelector('div[aria-hidden="true"]') as HTMLElement;
			expect(progressFill).toHaveStyle('width: 100%');
		});
	});

	describe('Size Variants', () => {
		it('should apply small size classes', () => {
			render(ProgressBar, {
				props: {
					value: 50,
					size: 'sm'
				}
			});

			const progressBar = screen.getByRole('progressbar');
			expect(progressBar).toHaveClass('h-2');

			const progressFill = progressBar.querySelector('div[aria-hidden="true"]') as HTMLElement;
			expect(progressFill).toHaveClass('h-2');
		});

		it('should apply medium size classes (default)', () => {
			render(ProgressBar, {
				props: { value: 50 }
			});

			const progressBar = screen.getByRole('progressbar');
			expect(progressBar).toHaveClass('h-3');
		});

		it('should apply large size classes', () => {
			render(ProgressBar, {
				props: {
					value: 50,
					size: 'lg'
				}
			});

			const progressBar = screen.getByRole('progressbar');
			expect(progressBar).toHaveClass('h-4');
		});
	});

	describe('Color Variants', () => {
		it('should apply default variant styling', () => {
			render(ProgressBar, {
				props: { value: 50 }
			});

			const progressFill = screen
				.getByRole('progressbar')
				.querySelector('div[aria-hidden="true"]') as HTMLElement;
			expect(progressFill).toHaveClass('bg-blue-500');
		});

		it('should apply success variant styling', () => {
			render(ProgressBar, {
				props: {
					value: 50,
					variant: 'success'
				}
			});

			const progressFill = screen
				.getByRole('progressbar')
				.querySelector('div[aria-hidden="true"]') as HTMLElement;
			expect(progressFill).toHaveClass('bg-green-500');
		});

		it('should apply warning variant styling', () => {
			render(ProgressBar, {
				props: {
					value: 50,
					variant: 'warning'
				}
			});

			const progressFill = screen
				.getByRole('progressbar')
				.querySelector('div[aria-hidden="true"]') as HTMLElement;
			expect(progressFill).toHaveClass('bg-yellow-500');
		});

		it('should apply error variant styling', () => {
			render(ProgressBar, {
				props: {
					value: 50,
					variant: 'error'
				}
			});

			const progressFill = screen
				.getByRole('progressbar')
				.querySelector('div[aria-hidden="true"]') as HTMLElement;
			expect(progressFill).toHaveClass('bg-red-500');
		});
	});

	describe('Accessibility Features', () => {
		it('should have proper ARIA attributes', () => {
			render(ProgressBar, {
				props: {
					value: 65,
					label: 'Upload Progress'
				}
			});

			const progressBar = screen.getByRole('progressbar');

			expect(progressBar).toHaveAttribute('role', 'progressbar');
			expect(progressBar).toHaveAttribute('aria-valuenow', '65');
			expect(progressBar).toHaveAttribute('aria-valuemin', '0');
			expect(progressBar).toHaveAttribute('aria-valuemax', '100');
			expect(progressBar).toHaveAttribute('aria-label', 'Upload Progress');
		});

		it('should have default aria-label when no label provided', () => {
			render(ProgressBar, {
				props: { value: 50 }
			});

			const progressBar = screen.getByRole('progressbar');
			expect(progressBar).toHaveAttribute('aria-label', 'Progress');
		});

		it('should have live region for screen reader announcements', () => {
			render(ProgressBar, {
				props: {
					value: 75,
					label: 'Processing'
				}
			});

			const liveRegion = document.querySelector('[aria-live="polite"]');
			expect(liveRegion).toBeInTheDocument();
			expect(liveRegion).toHaveAttribute('aria-atomic', 'false');
		});

		it('should announce progress to screen readers when showValue is true', () => {
			render(ProgressBar, {
				props: {
					value: 45,
					label: 'Loading',
					showValue: true
				}
			});

			const liveRegion = document.querySelector('[aria-live="polite"]');
			expect(liveRegion).toHaveTextContent('45% Loading');
		});

		it('should not announce progress when showValue is false', () => {
			render(ProgressBar, {
				props: {
					value: 45,
					label: 'Loading',
					showValue: false
				}
			});

			const liveRegion = document.querySelector('[aria-live="polite"]');
			expect(liveRegion).toBeEmptyDOMElement();
		});

		it('should pass basic accessibility check', async () => {
			render(ProgressBar, {
				props: {
					value: 50,
					label: 'Test Progress'
				}
			});

			const progressBar = screen.getByRole('progressbar');
			await assertionUtils.expectAccessibility(progressBar);
		});

		it('should properly associate label with progress bar', () => {
			render(ProgressBar, {
				props: {
					value: 50,
					label: 'File Upload',
					id: 'file-upload-progress'
				}
			});

			const label = screen.getByText('File Upload');
			const progressBar = screen.getByRole('progressbar');

			expect(label).toHaveAttribute('for', 'file-upload-progress');
			expect(progressBar).toHaveAttribute('id', 'file-upload-progress');
		});
	});

	describe('Visual Styling', () => {
		it('should have proper CSS classes for container', () => {
			render(ProgressBar, {
				props: { value: 50 }
			});

			const progressBar = screen.getByRole('progressbar');
			expect(progressBar).toHaveClass('w-full', 'rounded-full', 'bg-muted');
		});

		it('should have transition classes on progress fill', () => {
			render(ProgressBar, {
				props: { value: 50 }
			});

			const progressFill = screen
				.getByRole('progressbar')
				.querySelector('div[aria-hidden="true"]') as HTMLElement;
			expect(progressFill).toHaveClass('transition-all', 'duration-300', 'ease-out');
		});

		it('should hide percentage from assistive technology', () => {
			render(ProgressBar, {
				props: {
					value: 50,
					label: 'Test'
				}
			});

			const percentageSpan = screen.getByText('50%');
			expect(percentageSpan).toHaveAttribute('aria-hidden', 'true');
		});

		it('should hide progress fill from assistive technology', () => {
			render(ProgressBar, {
				props: { value: 50 }
			});

			const progressFill = screen.getByRole('progressbar').querySelector('div') as HTMLElement;
			expect(progressFill).toHaveAttribute('aria-hidden', 'true');
		});
	});

	describe('Indeterminate State', () => {
		it('should handle indeterminate progress (NaN value)', () => {
			render(ProgressBar, {
				props: { value: NaN }
			});

			const progressBar = screen.getByRole('progressbar');
			// NaN gets clamped to 0
			expect(progressBar).toHaveAttribute('aria-valuenow', '0');
		});

		it('should handle Infinity values', () => {
			render(ProgressBar, {
				props: { value: Infinity }
			});

			const progressBar = screen.getByRole('progressbar');
			// Infinity gets clamped to 100
			expect(progressBar).toHaveAttribute('aria-valuenow', '100');
		});
	});

	describe('Integration Scenarios', () => {
		it('should work with rapid value updates', () => {
			const { rerender } = render(ProgressBar, {
				props: { value: 0, label: 'Processing' }
			});

			// Simulate rapid progress updates
			const values = [10, 25, 50, 75, 90, 100];

			values.forEach((value) => {
				rerender({ value, label: 'Processing' });
				const progressBar = screen.getByRole('progressbar');
				expect(progressBar).toHaveAttribute('aria-valuenow', value.toString());
			});
		});

		it('should maintain consistent ID across re-renders', () => {
			const { rerender } = render(ProgressBar, {
				props: {
					value: 25,
					id: 'consistent-id'
				}
			});

			let progressBar = screen.getByRole('progressbar');
			expect(progressBar).toHaveAttribute('id', 'consistent-id');

			rerender({
				value: 75,
				id: 'consistent-id'
			});

			progressBar = screen.getByRole('progressbar');
			expect(progressBar).toHaveAttribute('id', 'consistent-id');
		});

		it('should handle all size and variant combinations', () => {
			const sizes = ['sm', 'md', 'lg'] as const;
			const variants = ['default', 'success', 'warning', 'error'] as const;

			sizes.forEach((size) => {
				variants.forEach((variant) => {
					const { unmount } = render(ProgressBar, {
						props: {
							value: 50,
							size,
							variant
						}
					});

					const progressBar = screen.getByRole('progressbar');
					expect(progressBar).toBeInTheDocument();

					unmount();
				});
			});
		});
	});

	describe('Performance', () => {
		it('should render within performance budget', async () => {
			await assertionUtils.expectPerformance(async () => {
				render(ProgressBar, {
					props: {
						value: 50,
						label: 'Test Progress'
					}
				});
			}, 16); // Should render within 16ms
		});

		it('should handle rapid re-renders efficiently', async () => {
			const { rerender } = render(ProgressBar, {
				props: { value: 0 }
			});

			await assertionUtils.expectPerformance(async () => {
				// Simulate 100 rapid updates
				for (let i = 0; i <= 100; i++) {
					rerender({ value: i });
				}
			}, 100); // Should complete 100 updates within 100ms
		});
	});

	describe('Edge Cases', () => {
		it('should handle undefined label gracefully', () => {
			render(ProgressBar, {
				props: {
					value: 50,
					label: undefined
				}
			});

			const progressBar = screen.getByRole('progressbar');
			expect(progressBar).toHaveAttribute('aria-label', 'Progress');
		});

		it('should handle empty string label', () => {
			render(ProgressBar, {
				props: {
					value: 50,
					label: ''
				}
			});

			const progressBar = screen.getByRole('progressbar');
			expect(progressBar).toHaveAttribute('aria-label', 'Progress');
		});

		it('should handle very large numbers', () => {
			render(ProgressBar, {
				props: { value: Number.MAX_SAFE_INTEGER }
			});

			const progressBar = screen.getByRole('progressbar');
			expect(progressBar).toHaveAttribute('aria-valuenow', '100');
		});

		it('should handle very small numbers', () => {
			render(ProgressBar, {
				props: { value: Number.MIN_VALUE }
			});

			const progressBar = screen.getByRole('progressbar');
			expect(progressBar).toHaveAttribute('aria-valuenow', String(Number.MIN_VALUE));
		});
	});
});
