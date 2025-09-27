/**
 * @file accessibility.test.ts
 * Comprehensive tests for accessibility utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	announceToScreenReader,
	trapFocus,
	FocusManager,
	prefersReducedMotion,
	prefersHighContrast,
	getContrastRatio,
	meetsWCAGContrast,
	KeyboardNavigation,
	ScreenReader,
	FormAccessibility,
	setupGlobalAccessibility
} from './accessibility';
import { setupBrowserMocks, cleanupBrowserMocks } from '@tests/test-utils';

describe('Accessibility Utilities', () => {
	beforeEach(() => {
		setupBrowserMocks();
		vi.clearAllMocks();
		document.body.innerHTML = '';
	});

	afterEach(() => {
		cleanupBrowserMocks();
		document.body.innerHTML = '';
	});

	describe('announceToScreenReader', () => {
		it('should create temporary live region with message', () => {
			announceToScreenReader('Test announcement');

			const liveRegion = document.querySelector('[aria-live="polite"]');
			expect(liveRegion).toBeInTheDocument();
			expect(liveRegion).toHaveTextContent('Test announcement');
			expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
			expect(liveRegion).toHaveClass('sr-only');
		});

		it('should support assertive priority', () => {
			announceToScreenReader('Urgent message', 'assertive');

			const liveRegion = document.querySelector('[aria-live="assertive"]');
			expect(liveRegion).toBeInTheDocument();
			expect(liveRegion).toHaveTextContent('Urgent message');
		});

		it('should remove announcement after timeout', async () => {
			vi.useFakeTimers();

			announceToScreenReader('Temporary message');

			expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();

			// Fast forward time
			vi.advanceTimersByTime(1000);

			expect(document.querySelector('[aria-live="polite"]')).not.toBeInTheDocument();

			vi.useRealTimers();
		});

		it('should handle multiple announcements', () => {
			announceToScreenReader('First message');
			announceToScreenReader('Second message');

			const liveRegions = document.querySelectorAll('[aria-live="polite"]');
			expect(liveRegions).toHaveLength(2);
		});
	});

	describe('trapFocus', () => {
		let container: HTMLElement;
		let firstButton: HTMLButtonElement;
		let secondButton: HTMLButtonElement;
		let lastButton: HTMLButtonElement;

		beforeEach(() => {
			container = document.createElement('div');
			firstButton = document.createElement('button');
			firstButton.textContent = 'First';
			secondButton = document.createElement('button');
			secondButton.textContent = 'Second';
			lastButton = document.createElement('button');
			lastButton.textContent = 'Last';

			container.appendChild(firstButton);
			container.appendChild(secondButton);
			container.appendChild(lastButton);
			document.body.appendChild(container);
		});

		it('should focus first focusable element on setup', () => {
			const focusSpy = vi.spyOn(firstButton, 'focus');
			trapFocus(container);

			expect(focusSpy).toHaveBeenCalled();
		});

		it('should cycle focus forward on Tab', () => {
			trapFocus(container);
			lastButton.focus();

			const event = new KeyboardEvent('keydown', { key: 'Tab' });
			const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
			const focusSpy = vi.spyOn(firstButton, 'focus');

			container.dispatchEvent(event);

			expect(preventDefaultSpy).toHaveBeenCalled();
			expect(focusSpy).toHaveBeenCalled();
		});

		it('should cycle focus backward on Shift+Tab', () => {
			trapFocus(container);
			firstButton.focus();

			const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
			const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
			const focusSpy = vi.spyOn(lastButton, 'focus');

			container.dispatchEvent(event);

			expect(preventDefaultSpy).toHaveBeenCalled();
			expect(focusSpy).toHaveBeenCalled();
		});

		it('should ignore non-Tab keys', () => {
			trapFocus(container);

			const event = new KeyboardEvent('keydown', { key: 'Enter' });
			const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

			container.dispatchEvent(event);

			expect(preventDefaultSpy).not.toHaveBeenCalled();
		});

		it('should return cleanup function', () => {
			const cleanup = trapFocus(container);

			expect(typeof cleanup).toBe('function');

			cleanup();

			// After cleanup, tab events should not be handled
			lastButton.focus();
			const event = new KeyboardEvent('keydown', { key: 'Tab' });
			const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

			container.dispatchEvent(event);

			expect(preventDefaultSpy).not.toHaveBeenCalled();
		});

		it('should handle containers with no focusable elements', () => {
			const emptyContainer = document.createElement('div');
			emptyContainer.innerHTML = '<span>No focusable content</span>';
			document.body.appendChild(emptyContainer);

			expect(() => trapFocus(emptyContainer)).not.toThrow();
		});
	});

	describe('FocusManager', () => {
		let focusManager: FocusManager;
		let container: HTMLElement;
		let originalFocus: HTMLButtonElement;

		beforeEach(() => {
			focusManager = new FocusManager();

			originalFocus = document.createElement('button');
			originalFocus.textContent = 'Original';
			document.body.appendChild(originalFocus);

			container = document.createElement('div');
			const button = document.createElement('button');
			button.textContent = 'Modal Button';
			container.appendChild(button);
			document.body.appendChild(container);

			originalFocus.focus();
		});

		it('should capture current focus and trap focus in container', () => {
			const modalButton = container.querySelector('button') as HTMLButtonElement;
			const focusSpy = vi.spyOn(modalButton, 'focus');

			focusManager.capture(container);

			expect(focusSpy).toHaveBeenCalled();
		});

		it('should restore focus when requested', () => {
			const focusSpy = vi.spyOn(originalFocus, 'focus');

			focusManager.capture(container);
			focusManager.restore();

			expect(focusSpy).toHaveBeenCalled();
		});

		it('should handle multiple capture/restore cycles', () => {
			focusManager.capture(container);
			focusManager.restore();

			// Should be able to capture again
			expect(() => focusManager.capture(container)).not.toThrow();
		});

		it('should handle restore without capture', () => {
			expect(() => focusManager.restore()).not.toThrow();
		});
	});

	describe('Media Query Preferences', () => {
		describe('prefersReducedMotion', () => {
			it('should return true when user prefers reduced motion', () => {
				Object.defineProperty(window, 'matchMedia', {
					value: vi.fn().mockReturnValue({
						matches: true
					})
				});

				expect(prefersReducedMotion()).toBe(true);
				expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
			});

			it('should return false when user does not prefer reduced motion', () => {
				Object.defineProperty(window, 'matchMedia', {
					value: vi.fn().mockReturnValue({
						matches: false
					})
				});

				expect(prefersReducedMotion()).toBe(false);
			});
		});

		describe('prefersHighContrast', () => {
			it('should return true when user prefers high contrast', () => {
				Object.defineProperty(window, 'matchMedia', {
					value: vi.fn().mockReturnValue({
						matches: true
					})
				});

				expect(prefersHighContrast()).toBe(true);
				expect(window.matchMedia).toHaveBeenCalledWith('(prefers-contrast: high)');
			});

			it('should return false when user does not prefer high contrast', () => {
				Object.defineProperty(window, 'matchMedia', {
					value: vi.fn().mockReturnValue({
						matches: false
					})
				});

				expect(prefersHighContrast()).toBe(false);
			});
		});
	});

	describe('Color Contrast Utilities', () => {
		describe('getContrastRatio', () => {
			it('should calculate contrast ratio between white and black', () => {
				const ratio = getContrastRatio('#ffffff', '#000000');
				expect(ratio).toBeCloseTo(21, 0); // Maximum contrast ratio
			});

			it('should calculate contrast ratio between same colors', () => {
				const ratio = getContrastRatio('#ff0000', '#ff0000');
				expect(ratio).toBe(1); // No contrast
			});

			it('should handle typical UI colors', () => {
				const ratio = getContrastRatio('#2563eb', '#ffffff'); // Blue on white
				expect(ratio).toBeGreaterThan(4.5); // Should meet AA standards
			});

			it('should be symmetric', () => {
				const ratio1 = getContrastRatio('#ff0000', '#00ff00');
				const ratio2 = getContrastRatio('#00ff00', '#ff0000');
				expect(ratio1).toBeCloseTo(ratio2, 2);
			});
		});

		describe('meetsWCAGContrast', () => {
			it('should pass AA standard for good contrast', () => {
				expect(meetsWCAGContrast('#000000', '#ffffff')).toBe(true); // Black on white
			});

			it('should fail AA standard for poor contrast', () => {
				expect(meetsWCAGContrast('#cccccc', '#ffffff')).toBe(false); // Light gray on white
			});

			it('should handle large text requirements', () => {
				expect(meetsWCAGContrast('#666666', '#ffffff', 'AA', 'large')).toBe(true);
				expect(meetsWCAGContrast('#666666', '#ffffff', 'AA', 'normal')).toBe(false);
			});

			it('should handle AAA standard', () => {
				expect(meetsWCAGContrast('#000000', '#ffffff', 'AAA')).toBe(true);
				expect(meetsWCAGContrast('#333333', '#ffffff', 'AAA')).toBe(false);
			});
		});
	});

	describe('KeyboardNavigation', () => {
		let items: HTMLElement[];

		beforeEach(() => {
			items = Array.from({ length: 5 }, (_, i) => {
				const button = document.createElement('button');
				button.textContent = `Button ${i + 1}`;
				document.body.appendChild(button);
				return button;
			});
		});

		describe('handleArrowKeys', () => {
			it('should handle ArrowDown in vertical navigation', () => {
				const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
				const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
				const focusSpy = vi.spyOn(items[1], 'focus');

				const newIndex = KeyboardNavigation.handleArrowKeys(event, items, 0, 'vertical');

				expect(newIndex).toBe(1);
				expect(preventDefaultSpy).toHaveBeenCalled();
				expect(focusSpy).toHaveBeenCalled();
			});

			it('should handle ArrowUp in vertical navigation', () => {
				const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
				const focusSpy = vi.spyOn(items[4], 'focus');

				const newIndex = KeyboardNavigation.handleArrowKeys(event, items, 0, 'vertical');

				expect(newIndex).toBe(4); // Wraps to last item
				expect(focusSpy).toHaveBeenCalled();
			});

			it('should handle ArrowRight in horizontal navigation', () => {
				const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
				const focusSpy = vi.spyOn(items[1], 'focus');

				const newIndex = KeyboardNavigation.handleArrowKeys(event, items, 0, 'horizontal');

				expect(newIndex).toBe(1);
				expect(focusSpy).toHaveBeenCalled();
			});

			it('should handle ArrowLeft in horizontal navigation', () => {
				const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
				const focusSpy = vi.spyOn(items[4], 'focus');

				const newIndex = KeyboardNavigation.handleArrowKeys(event, items, 0, 'horizontal');

				expect(newIndex).toBe(4); // Wraps to last item
				expect(focusSpy).toHaveBeenCalled();
			});

			it('should handle Home key', () => {
				const event = new KeyboardEvent('keydown', { key: 'Home' });
				const focusSpy = vi.spyOn(items[0], 'focus');

				const newIndex = KeyboardNavigation.handleArrowKeys(event, items, 3);

				expect(newIndex).toBe(0);
				expect(focusSpy).toHaveBeenCalled();
			});

			it('should handle End key', () => {
				const event = new KeyboardEvent('keydown', { key: 'End' });
				const focusSpy = vi.spyOn(items[4], 'focus');

				const newIndex = KeyboardNavigation.handleArrowKeys(event, items, 1);

				expect(newIndex).toBe(4);
				expect(focusSpy).toHaveBeenCalled();
			});

			it('should ignore unsupported keys', () => {
				const event = new KeyboardEvent('keydown', { key: 'Enter' });
				const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

				const newIndex = KeyboardNavigation.handleArrowKeys(event, items, 2);

				expect(newIndex).toBe(2); // No change
				expect(preventDefaultSpy).not.toHaveBeenCalled();
			});

			it('should respect orientation restrictions', () => {
				const verticalEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
				const preventDefaultSpy = vi.spyOn(verticalEvent, 'preventDefault');

				KeyboardNavigation.handleArrowKeys(verticalEvent, items, 0, 'vertical');

				expect(preventDefaultSpy).not.toHaveBeenCalled(); // Should ignore horizontal keys
			});
		});

		describe('setupRovingTabindex', () => {
			it('should set correct tabindex values', () => {
				KeyboardNavigation.setupRovingTabindex(items, 2);

				items.forEach((item, index) => {
					expect(item.tabIndex).toBe(index === 2 ? 0 : -1);
				});
			});

			it('should default to first item active', () => {
				KeyboardNavigation.setupRovingTabindex(items);

				expect(items[0].tabIndex).toBe(0);
				items.slice(1).forEach((item) => {
					expect(item.tabIndex).toBe(-1);
				});
			});

			it('should handle empty array', () => {
				expect(() => KeyboardNavigation.setupRovingTabindex([])).not.toThrow();
			});
		});
	});

	describe('ScreenReader', () => {
		describe('createSROnly', () => {
			it('should create screen reader only element', () => {
				const element = ScreenReader.createSROnly('Hidden text');

				expect(element.tagName).toBe('SPAN');
				expect(element.textContent).toBe('Hidden text');
				expect(element).toHaveClass('sr-only');
			});
		});

		describe('updateLiveRegion', () => {
			it('should create new live region if it does not exist', () => {
				ScreenReader.updateLiveRegion('test-region', 'Test message');

				const region = document.getElementById('test-region');
				expect(region).toBeInTheDocument();
				expect(region).toHaveTextContent('Test message');
				expect(region).toHaveAttribute('aria-live', 'polite');
				expect(region).toHaveAttribute('aria-atomic', 'true');
				expect(region).toHaveClass('sr-only');
			});

			it('should update existing live region', () => {
				ScreenReader.updateLiveRegion('test-region', 'First message');
				ScreenReader.updateLiveRegion('test-region', 'Updated message');

				const regions = document.querySelectorAll('#test-region');
				expect(regions).toHaveLength(1);
				expect(regions[0]).toHaveTextContent('Updated message');
			});

			it('should support assertive priority', () => {
				ScreenReader.updateLiveRegion('urgent-region', 'Urgent message', 'assertive');

				const region = document.getElementById('urgent-region');
				expect(region).toHaveAttribute('aria-live', 'assertive');
			});
		});
	});

	describe('FormAccessibility', () => {
		let control: HTMLInputElement;
		let errorElement: HTMLElement;

		beforeEach(() => {
			control = document.createElement('input');
			control.type = 'text';
			control.id = 'test-input';

			errorElement = document.createElement('div');
			errorElement.textContent = 'This field is required';

			document.body.appendChild(control);
			document.body.appendChild(errorElement);
		});

		describe('associateError', () => {
			it('should associate error with control', () => {
				FormAccessibility.associateError(control, errorElement);

				expect(control).toHaveAttribute('aria-invalid', 'true');
				expect(control).toHaveAttribute('aria-describedby');
				expect(errorElement.id).toBeTruthy();

				const describedBy = control.getAttribute('aria-describedby');
				expect(describedBy).toContain(errorElement.id);
			});

			it('should handle existing aria-describedby', () => {
				control.setAttribute('aria-describedby', 'existing-description');
				FormAccessibility.associateError(control, errorElement);

				const describedBy = control.getAttribute('aria-describedby');
				expect(describedBy).toContain('existing-description');
				expect(describedBy).toContain(errorElement.id);
			});

			it('should not duplicate error IDs', () => {
				FormAccessibility.associateError(control, errorElement);
				FormAccessibility.associateError(control, errorElement);

				const describedBy = control.getAttribute('aria-describedby');
				const errorIds = describedBy?.split(' ').filter((id) => id === errorElement.id);
				expect(errorIds).toHaveLength(1);
			});

			it('should generate ID if error element has none', () => {
				FormAccessibility.associateError(control, errorElement);

				expect(errorElement.id).toBeTruthy();
				expect(errorElement.id).toMatch(/^error-\d+$/);
			});
		});

		describe('removeError', () => {
			it('should remove error association', () => {
				FormAccessibility.associateError(control, errorElement);
				FormAccessibility.removeError(control, errorElement);

				expect(control).toHaveAttribute('aria-invalid', 'false');

				const describedBy = control.getAttribute('aria-describedby');
				if (describedBy) {
					expect(describedBy).not.toContain(errorElement.id);
				}
			});

			it('should preserve other aria-describedby references', () => {
				control.setAttribute('aria-describedby', 'other-description');
				FormAccessibility.associateError(control, errorElement);
				FormAccessibility.removeError(control, errorElement);

				expect(control.getAttribute('aria-describedby')).toBe('other-description');
			});

			it('should remove aria-describedby if no other references', () => {
				FormAccessibility.associateError(control, errorElement);
				FormAccessibility.removeError(control, errorElement);

				expect(control).not.toHaveAttribute('aria-describedby');
			});

			it('should handle error element without ID', () => {
				const errorWithoutId = document.createElement('div');
				expect(() => FormAccessibility.removeError(control, errorWithoutId)).not.toThrow();
			});
		});
	});

	describe('setupGlobalAccessibility', () => {
		it('should add accessibility styles', () => {
			setupGlobalAccessibility();

			const styleElement = document.getElementById('accessibility-styles');
			expect(styleElement).toBeInTheDocument();
			expect(styleElement?.textContent).toContain('.sr-only');
			expect(styleElement?.textContent).toContain('.sr-only-focusable:focus');
		});

		it('should not duplicate styles on multiple calls', () => {
			setupGlobalAccessibility();
			setupGlobalAccessibility();

			const styleElements = document.querySelectorAll('#accessibility-styles');
			expect(styleElements).toHaveLength(1);
		});

		it('should add skip link', () => {
			setupGlobalAccessibility();

			const skipLink = document.querySelector('[data-skip-link]') as HTMLAnchorElement;
			expect(skipLink).toBeInTheDocument();
			expect(skipLink.href).toBe(`${window.location.origin}/#main-content`);
			expect(skipLink.textContent).toBe('Skip to main content');
		});

		it('should not duplicate skip link on multiple calls', () => {
			setupGlobalAccessibility();
			setupGlobalAccessibility();

			const skipLinks = document.querySelectorAll('[data-skip-link]');
			expect(skipLinks).toHaveLength(1);
		});

		it('should handle skip link focus events', () => {
			setupGlobalAccessibility();

			const skipLink = document.querySelector('[data-skip-link]') as HTMLElement;

			// Test focus event
			skipLink.dispatchEvent(new FocusEvent('focus'));
			expect(skipLink.style.transform).toBe('translateY(0)');

			// Test blur event
			skipLink.dispatchEvent(new FocusEvent('blur'));
			expect(skipLink.style.transform).toBe('translateY(-100%)');
		});
	});

	describe('Edge Cases and Error Handling', () => {
		it('should handle DOM manipulation errors gracefully', () => {
			// Mock appendChild to throw error
			const originalAppendChild = document.body.appendChild;
			document.body.appendChild = vi.fn().mockImplementation(() => {
				throw new Error('DOM manipulation failed');
			});

			expect(() => announceToScreenReader('Test')).toThrow();

			// Restore original method
			document.body.appendChild = originalAppendChild;
		});

		it('should handle invalid color values in contrast calculation', () => {
			expect(() => getContrastRatio('invalid', '#ffffff')).toThrow();
			expect(() => getContrastRatio('#ff', '#ffffff')).toThrow();
		});

		it('should handle elements without focus method', () => {
			const nonFocusableElement = document.createElement('div');
			// Remove focus method
			delete (nonFocusableElement as any).focus;

			expect(() => trapFocus(nonFocusableElement)).not.toThrow();
		});

		it('should handle keyboard events with missing properties', () => {
			const items = [document.createElement('button')];
			const incompleteEvent = {} as KeyboardEvent;

			expect(() => KeyboardNavigation.handleArrowKeys(incompleteEvent, items, 0)).not.toThrow();
		});
	});

	describe('Performance', () => {
		it('should handle large numbers of announcements efficiently', () => {
			const startTime = performance.now();

			for (let i = 0; i < 100; i++) {
				announceToScreenReader(`Message ${i}`);
			}

			const endTime = performance.now();
			expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
		});

		it('should handle focus trapping with many elements efficiently', () => {
			const container = document.createElement('div');

			// Create many focusable elements
			for (let i = 0; i < 1000; i++) {
				const button = document.createElement('button');
				button.textContent = `Button ${i}`;
				container.appendChild(button);
			}

			document.body.appendChild(container);

			const startTime = performance.now();
			const cleanup = trapFocus(container);
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(50); // Should setup within 50ms

			cleanup();
		});

		it('should handle rapid keyboard navigation efficiently', () => {
			const items = Array.from({ length: 100 }, () => document.createElement('button'));

			const startTime = performance.now();

			for (let i = 0; i < 50; i++) {
				const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
				KeyboardNavigation.handleArrowKeys(event, items, i % items.length);
			}

			const endTime = performance.now();
			expect(endTime - startTime).toBeLessThan(50); // Should handle 50 navigations within 50ms
		});
	});
});
