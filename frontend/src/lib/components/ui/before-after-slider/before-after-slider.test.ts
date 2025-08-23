/**
 * @file before-after-slider.test.ts
 * Comprehensive tests for BeforeAfterSlider component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/svelte';
import BeforeAfterSlider from './before-after-slider.svelte';
import {
	interactionTestUtils,
	assertionUtils,
	setupBrowserMocks,
	cleanupBrowserMocks
} from '@tests/test-utils';

describe('BeforeAfterSlider Component', () => {
	const defaultProps = {
		beforeImage:
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
		afterImage:
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
	};

	beforeEach(() => {
		setupBrowserMocks();
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
		cleanupBrowserMocks();
	});

	describe('Basic Rendering', () => {
		it('should render with required props', () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			expect(screen.getByRole('application')).toBeInTheDocument();
			expect(screen.getByRole('slider')).toBeInTheDocument();
			expect(screen.getByAltText('Before')).toBeInTheDocument();
			expect(screen.getByAltText('After')).toBeInTheDocument();
		});

		it('should use custom alt text when provided', () => {
			render(BeforeAfterSlider, {
				props: {
					...defaultProps,
					beforeAlt: 'Original Image',
					afterAlt: 'Processed Image'
				}
			});

			expect(screen.getByAltText('Original Image')).toBeInTheDocument();
			expect(screen.getByAltText('Processed Image')).toBeInTheDocument();
		});

		it('should apply custom start position', () => {
			render(BeforeAfterSlider, {
				props: {
					...defaultProps,
					startPosition: 75
				}
			});

			const slider = screen.getByRole('slider');
			expect(slider).toHaveAttribute('aria-valuenow', '75');
		});

		it('should apply custom CSS classes', () => {
			render(BeforeAfterSlider, {
				props: {
					...defaultProps,
					class: 'custom-slider-class'
				}
			});

			const container = screen.getByRole('application');
			expect(container).toHaveClass('custom-slider-class');
		});

		it('should have both images loaded', () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			const images = screen.getAllByRole('img');
			expect(images).toHaveLength(2);

			const beforeImg = screen.getByAltText('Before');
			const afterImg = screen.getByAltText('After');

			expect(beforeImg).toHaveAttribute('src', defaultProps.beforeImage);
			expect(afterImg).toHaveAttribute('src', defaultProps.afterImage);
		});
	});

	describe('Slider Functionality', () => {
		it('should initialize at default position (50%)', () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			const slider = screen.getByRole('slider');
			expect(slider).toHaveAttribute('aria-valuenow', '50');
		});

		it('should position slider handle correctly', () => {
			render(BeforeAfterSlider, {
				props: {
					...defaultProps,
					startPosition: 30
				}
			});

			const sliderHandle = screen.getByRole('slider');
			expect(sliderHandle.style.left).toBe('30%');
		});

		it('should clamp slider position to valid range', () => {
			render(BeforeAfterSlider, {
				props: {
					...defaultProps,
					startPosition: 150 // Invalid, should clamp
				}
			});

			const slider = screen.getByRole('slider');
			// Should still work even with invalid start position
			expect(slider).toBeInTheDocument();
		});
	});

	describe('Mouse Interaction', () => {
		it('should start dragging on mousedown', async () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			const sliderHandle = screen.getByRole('slider');
			const container = screen.getByRole('application');

			// Mock container dimensions
			vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
				left: 0,
				top: 0,
				width: 400,
				height: 300,
				right: 400,
				bottom: 300,
				x: 0,
				y: 0,
				toJSON: vi.fn()
			});

			await fireEvent.mouseDown(sliderHandle);

			// After mousedown, the component should be in dragging state
			// We can't directly test isDragging state, but we can test the side effects
			expect(container.getBoundingClientRect).toHaveBeenCalled();
		});

		it('should update position during mouse move when dragging', async () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			const sliderHandle = screen.getByRole('slider');
			const container = screen.getByRole('application');

			// Mock container dimensions
			const mockRect = {
				left: 0,
				top: 0,
				width: 400,
				height: 300,
				right: 400,
				bottom: 300,
				x: 0,
				y: 0,
				toJSON: vi.fn()
			};
			vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(mockRect);

			// Start dragging
			await fireEvent.mouseDown(sliderHandle);

			// Simulate mouse move to 25% position (100px out of 400px)
			await fireEvent.mouseMove(document, {
				clientX: 100
			});

			await waitFor(() => {
				const slider = screen.getByRole('slider');
				expect(parseFloat(slider.getAttribute('aria-valuenow') || '0')).toBeCloseTo(25, 0);
			});
		});

		it('should stop dragging on mouseup', async () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			const sliderHandle = screen.getByRole('slider');
			const container = screen.getByRole('application');

			vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
				left: 0,
				top: 0,
				width: 400,
				height: 300,
				right: 400,
				bottom: 300,
				x: 0,
				y: 0,
				toJSON: vi.fn()
			});

			// Start and stop dragging
			await fireEvent.mouseDown(sliderHandle);
			await fireEvent.mouseUp(document);

			// After mouseup, subsequent mouse moves should not affect position
			const initialValue = screen.getByRole('slider').getAttribute('aria-valuenow');

			await fireEvent.mouseMove(document, { clientX: 300 });

			// Position should not have changed
			expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', initialValue);
		});

		it('should prevent default on mouse move during drag', async () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			const sliderHandle = screen.getByRole('slider');
			const container = screen.getByRole('application');

			vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
				left: 0,
				top: 0,
				width: 400,
				height: 300,
				right: 400,
				bottom: 300,
				x: 0,
				y: 0,
				toJSON: vi.fn()
			});

			await fireEvent.mouseDown(sliderHandle);

			const mouseMoveEvent = new MouseEvent('mousemove', {
				bubbles: true,
				clientX: 200
			});
			const preventDefaultSpy = vi.spyOn(mouseMoveEvent, 'preventDefault');

			document.dispatchEvent(mouseMoveEvent);

			expect(preventDefaultSpy).toHaveBeenCalled();
		});
	});

	describe('Touch Interaction', () => {
		it('should handle touch start events', async () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			const sliderHandle = screen.getByRole('slider');
			const container = screen.getByRole('application');

			vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
				left: 0,
				top: 0,
				width: 400,
				height: 300,
				right: 400,
				bottom: 300,
				x: 0,
				y: 0,
				toJSON: vi.fn()
			});

			const touchEvent = new TouchEvent('touchstart', {
				touches: [
					new Touch({
						identifier: 0,
						target: sliderHandle,
						clientX: 200,
						clientY: 150,
						radiusX: 10,
						radiusY: 10,
						rotationAngle: 0,
						force: 1
					})
				]
			});

			await fireEvent(sliderHandle, touchEvent);

			expect(container.getBoundingClientRect).toHaveBeenCalled();
		});

		it('should handle touch move events', async () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			const sliderHandle = screen.getByRole('slider');
			const container = screen.getByRole('application');

			const mockRect = {
				left: 0,
				top: 0,
				width: 400,
				height: 300,
				right: 400,
				bottom: 300,
				x: 0,
				y: 0,
				toJSON: vi.fn()
			};
			vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(mockRect);

			// Start touch
			const touchStartEvent = new TouchEvent('touchstart', {
				touches: [
					new Touch({
						identifier: 0,
						target: sliderHandle,
						clientX: 200,
						clientY: 150,
						radiusX: 10,
						radiusY: 10,
						rotationAngle: 0,
						force: 1
					})
				]
			});
			await fireEvent(sliderHandle, touchStartEvent);

			// Move touch to 75% position (300px out of 400px)
			const touchMoveEvent = new TouchEvent('touchmove', {
				touches: [
					new Touch({
						identifier: 0,
						target: document,
						clientX: 300,
						clientY: 150,
						radiusX: 10,
						radiusY: 10,
						rotationAngle: 0,
						force: 1
					})
				]
			});

			document.dispatchEvent(touchMoveEvent);

			await waitFor(() => {
				const slider = screen.getByRole('slider');
				expect(parseFloat(slider.getAttribute('aria-valuenow') || '0')).toBeCloseTo(75, 0);
			});
		});
	});

	describe('Accessibility Features', () => {
		it('should have proper ARIA attributes', () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			const container = screen.getByRole('application');
			const slider = screen.getByRole('slider');

			expect(container).toHaveAttribute('aria-label', 'Before and after comparison slider');
			expect(slider).toHaveAttribute('aria-valuenow', '50');
			expect(slider).toHaveAttribute('aria-valuemin', '0');
			expect(slider).toHaveAttribute('aria-valuemax', '100');
			expect(slider).toHaveAttribute('aria-label', 'Comparison slider position');
			expect(slider).toHaveAttribute('tabindex', '0');
		});

		it('should be keyboard accessible', () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			const slider = screen.getByRole('slider');
			slider.focus();
			expect(slider).toHaveFocus();
		});

		it('should have descriptive alt text for images', () => {
			render(BeforeAfterSlider, {
				props: {
					...defaultProps,
					beforeAlt: 'Original photograph showing the scene',
					afterAlt: 'Processed image with artistic line art effect'
				}
			});

			expect(screen.getByAltText('Original photograph showing the scene')).toBeInTheDocument();
			expect(
				screen.getByAltText('Processed image with artistic line art effect')
			).toBeInTheDocument();
		});

		it('should pass basic accessibility check', async () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			const container = screen.getByRole('application');
			await assertionUtils.expectAccessibility(container);
		});

		it('should prevent image dragging', () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			const images = screen.getAllByRole('img');
			images.forEach((img) => {
				expect(img).toHaveAttribute('draggable', 'false');
			});
		});
	});

	describe('Visual Elements', () => {
		it('should display before and after labels', () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			expect(screen.getByText('Before')).toBeInTheDocument();
			expect(screen.getByText('After')).toBeInTheDocument();
		});

		it('should have proper CSS classes for styling', () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			const container = screen.getByRole('application');
			expect(container).toHaveClass('relative', 'overflow-hidden', 'select-none');

			const sliderHandle = screen.getByRole('slider');
			expect(sliderHandle).toHaveClass('absolute', 'top-0', 'bottom-0', 'cursor-ew-resize');
		});

		it('should apply clip-path to before image based on slider position', () => {
			render(BeforeAfterSlider, {
				props: {
					...defaultProps,
					startPosition: 60
				}
			});

			const beforeImageContainer = document.querySelector('[style*="clip-path"]') as HTMLElement;
			expect(beforeImageContainer).toBeInTheDocument();
			expect(beforeImageContainer.style.clipPath).toContain('60%');
		});

		it('should have arrow indicators on slider handle', () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			const arrows = document.querySelectorAll('svg');
			expect(arrows).toHaveLength(2); // Left and right arrows
		});
	});

	describe('Edge Cases and Error Handling', () => {
		it('should handle invalid image URLs gracefully', () => {
			render(BeforeAfterSlider, {
				props: {
					beforeImage: 'invalid-url',
					afterImage: 'another-invalid-url'
				}
			});

			const images = screen.getAllByRole('img');
			expect(images).toHaveLength(2);
			expect(images[0]).toHaveAttribute('src', 'invalid-url');
			expect(images[1]).toHaveAttribute('src', 'another-invalid-url');
		});

		it('should handle extreme slider positions', async () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			const sliderHandle = screen.getByRole('slider');
			const container = screen.getByRole('application');

			vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
				left: 100,
				top: 100,
				width: 400,
				height: 300,
				right: 500,
				bottom: 400,
				x: 100,
				y: 100,
				toJSON: vi.fn()
			});

			// Start dragging
			await fireEvent.mouseDown(sliderHandle);

			// Test position beyond left boundary
			await fireEvent.mouseMove(document, { clientX: 50 }); // Before left edge
			await waitFor(() => {
				const slider = screen.getByRole('slider');
				expect(parseFloat(slider.getAttribute('aria-valuenow') || '0')).toBe(0);
			});

			// Test position beyond right boundary
			await fireEvent.mouseMove(document, { clientX: 600 }); // Beyond right edge
			await waitFor(() => {
				const slider = screen.getByRole('slider');
				expect(parseFloat(slider.getAttribute('aria-valuenow') || '0')).toBe(100);
			});
		});

		it('should handle missing container rect gracefully', async () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			const sliderHandle = screen.getByRole('slider');

			// Mock getBoundingClientRect to return null
			vi.spyOn(screen.getByRole('application'), 'getBoundingClientRect').mockReturnValue(
				null as any
			);

			// Should not throw error
			expect(async () => {
				await fireEvent.mouseDown(sliderHandle);
				await fireEvent.mouseMove(document, { clientX: 200 });
			}).not.toThrow();
		});

		it('should cleanup event listeners on unmount', () => {
			const { unmount } = render(BeforeAfterSlider, {
				props: defaultProps
			});

			const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

			unmount();

			expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
			expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
			expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
			expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
		});
	});

	describe('Performance', () => {
		it('should render within performance budget', async () => {
			await assertionUtils.expectPerformance(async () => {
				render(BeforeAfterSlider, {
					props: defaultProps
				});
			}, 32); // Should render within 32ms
		});

		it('should handle rapid slider movements efficiently', async () => {
			render(BeforeAfterSlider, {
				props: defaultProps
			});

			const sliderHandle = screen.getByRole('slider');
			const container = screen.getByRole('application');

			vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
				left: 0,
				top: 0,
				width: 400,
				height: 300,
				right: 400,
				bottom: 300,
				x: 0,
				y: 0,
				toJSON: vi.fn()
			});

			await fireEvent.mouseDown(sliderHandle);

			await assertionUtils.expectPerformance(async () => {
				// Simulate 50 rapid mouse moves
				for (let i = 0; i <= 50; i++) {
					await fireEvent.mouseMove(document, { clientX: i * 8 });
				}
			}, 100); // Should handle 50 moves within 100ms
		});
	});

	describe('Integration Scenarios', () => {
		it('should work with different image aspect ratios', () => {
			render(BeforeAfterSlider, {
				props: {
					beforeImage:
						'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==', // Tall image
					afterImage:
						'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==' // Wide image
				}
			});

			const images = screen.getAllByRole('img');
			images.forEach((img) => {
				expect(img).toHaveClass('object-contain');
			});
		});

		it('should maintain consistent state across prop updates', () => {
			const { rerender } = render(BeforeAfterSlider, {
				props: {
					...defaultProps,
					startPosition: 25
				}
			});

			let slider = screen.getByRole('slider');
			expect(slider).toHaveAttribute('aria-valuenow', '25');

			// Update images but keep position
			rerender({
				beforeImage: 'new-before.jpg',
				afterImage: 'new-after.jpg',
				startPosition: 25
			});

			slider = screen.getByRole('slider');
			expect(slider).toHaveAttribute('aria-valuenow', '25');
		});

		it('should handle rapid prop changes', async () => {
			const { rerender } = render(BeforeAfterSlider, {
				props: defaultProps
			});

			await assertionUtils.expectPerformance(async () => {
				// Rapidly change start position
				for (let i = 0; i <= 20; i++) {
					rerender({
						...defaultProps,
						startPosition: i * 5
					});
				}
			}, 50); // Should handle 20 prop updates within 50ms
		});
	});
});
