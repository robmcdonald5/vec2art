/**
 * Accessibility utilities for the vec2art frontend application
 */

/**
 * Announces a message to screen readers using a temporary live region
 */
export function announceToScreenReader(
	message: string,
	priority: 'polite' | 'assertive' = 'polite'
): void {
	const announcement = document.createElement('div');
	announcement.setAttribute('aria-live', priority);
	announcement.setAttribute('aria-atomic', 'true');
	announcement.className = 'sr-only';
	announcement.textContent = message;

	document.body.appendChild(announcement);

	// Remove after announcement
	setTimeout(() => {
		document.body.removeChild(announcement);
	}, 1000);
}

/**
 * Traps focus within a container element
 */
export function trapFocus(container: HTMLElement): () => void {
	const focusableElements = container.querySelectorAll(
		'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
	);
	const firstFocusable = focusableElements[0] as HTMLElement;
	const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

	function handleTabKey(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;

		if (e.shiftKey) {
			// Shift + Tab
			if (document.activeElement === firstFocusable) {
				lastFocusable?.focus();
				e.preventDefault();
			}
		} else {
			// Tab
			if (document.activeElement === lastFocusable) {
				firstFocusable?.focus();
				e.preventDefault();
			}
		}
	}

	container.addEventListener('keydown', handleTabKey);

	// Focus first focusable element
	firstFocusable?.focus();

	// Return cleanup function
	return () => {
		container.removeEventListener('keydown', handleTabKey);
	};
}

/**
 * Manages focus for modals and overlays
 */
export class FocusManager {
	private lastFocusedElement: HTMLElement | null = null;
	private focusTrap: (() => void) | null = null;

	/**
	 * Store current focus and trap focus in container
	 */
	capture(container: HTMLElement): void {
		this.lastFocusedElement = document.activeElement as HTMLElement;
		this.focusTrap = trapFocus(container);
	}

	/**
	 * Restore focus to previously focused element
	 */
	restore(): void {
		if (this.focusTrap) {
			this.focusTrap();
			this.focusTrap = null;
		}

		if (this.lastFocusedElement) {
			this.lastFocusedElement.focus();
			this.lastFocusedElement = null;
		}
	}
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user is using high contrast mode
 */
export function prefersHighContrast(): boolean {
	return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Calculate color contrast ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
	const getLuminance = (color: string): number => {
		// Convert hex to RGB
		const hex = color.replace('#', '');
		const r = parseInt(hex.substr(0, 2), 16) / 255;
		const g = parseInt(hex.substr(2, 2), 16) / 255;
		const b = parseInt(hex.substr(4, 2), 16) / 255;

		// Calculate relative luminance
		const sRGB = [r, g, b].map((c) => {
			return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
		});

		return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
	};

	const lum1 = getLuminance(color1);
	const lum2 = getLuminance(color2);
	const brightest = Math.max(lum1, lum2);
	const darkest = Math.min(lum1, lum2);

	return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if color combination meets WCAG standards
 */
export function meetsWCAGContrast(
	foreground: string,
	background: string,
	level: 'AA' | 'AAA' = 'AA',
	fontSize: 'normal' | 'large' = 'normal'
): boolean {
	const ratio = getContrastRatio(foreground, background);

	if (level === 'AAA') {
		return fontSize === 'large' ? ratio >= 4.5 : ratio >= 7;
	} else {
		return fontSize === 'large' ? ratio >= 3 : ratio >= 4.5;
	}
}

/**
 * Keyboard navigation helpers
 */
export const KeyboardNavigation = {
	/**
	 * Handle arrow key navigation in a group
	 */
	handleArrowKeys(
		event: KeyboardEvent,
		items: HTMLElement[],
		currentIndex: number,
		orientation: 'horizontal' | 'vertical' | 'both' = 'both'
	): number {
		let newIndex = currentIndex;

		switch (event.key) {
			case 'ArrowUp':
				if (orientation === 'vertical' || orientation === 'both') {
					newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
					event.preventDefault();
				}
				break;
			case 'ArrowDown':
				if (orientation === 'vertical' || orientation === 'both') {
					newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
					event.preventDefault();
				}
				break;
			case 'ArrowLeft':
				if (orientation === 'horizontal' || orientation === 'both') {
					newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
					event.preventDefault();
				}
				break;
			case 'ArrowRight':
				if (orientation === 'horizontal' || orientation === 'both') {
					newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
					event.preventDefault();
				}
				break;
			case 'Home':
				newIndex = 0;
				event.preventDefault();
				break;
			case 'End':
				newIndex = items.length - 1;
				event.preventDefault();
				break;
		}

		if (newIndex !== currentIndex) {
			items[newIndex]?.focus();
		}

		return newIndex;
	},

	/**
	 * Setup roving tabindex for a group of elements
	 */
	setupRovingTabindex(items: HTMLElement[], activeIndex: number = 0): void {
		items.forEach((item, index) => {
			item.tabIndex = index === activeIndex ? 0 : -1;
		});
	}
};

/**
 * Screen reader utilities
 */
export const ScreenReader = {
	/**
	 * Create a screen reader only element
	 */
	createSROnly(text: string): HTMLElement {
		const element = document.createElement('span');
		element.className = 'sr-only';
		element.textContent = text;
		return element;
	},

	/**
	 * Update or create a live region
	 */
	updateLiveRegion(id: string, message: string, priority: 'polite' | 'assertive' = 'polite'): void {
		let liveRegion = document.getElementById(id);

		if (!liveRegion) {
			liveRegion = document.createElement('div');
			liveRegion.id = id;
			liveRegion.setAttribute('aria-live', priority);
			liveRegion.setAttribute('aria-atomic', 'true');
			liveRegion.className = 'sr-only';
			document.body.appendChild(liveRegion);
		}

		liveRegion.textContent = message;
	}
};

/**
 * Form accessibility helpers
 */
export const FormAccessibility = {
	/**
	 * Associate form control with error message
	 */
	associateError(control: HTMLElement, errorElement: HTMLElement): void {
		const errorId = errorElement.id || `error-${Date.now()}`;
		errorElement.id = errorId;

		const describedBy = control.getAttribute('aria-describedby');
		const errorIds = describedBy ? describedBy.split(' ') : [];

		if (!errorIds.includes(errorId)) {
			errorIds.push(errorId);
			control.setAttribute('aria-describedby', errorIds.join(' '));
		}

		control.setAttribute('aria-invalid', 'true');
	},

	/**
	 * Remove error association
	 */
	removeError(control: HTMLElement, errorElement: HTMLElement): void {
		const errorId = errorElement.id;
		if (!errorId) return;

		const describedBy = control.getAttribute('aria-describedby');
		if (describedBy) {
			const errorIds = describedBy.split(' ').filter((id) => id !== errorId);
			if (errorIds.length > 0) {
				control.setAttribute('aria-describedby', errorIds.join(' '));
			} else {
				control.removeAttribute('aria-describedby');
			}
		}

		control.setAttribute('aria-invalid', 'false');
	}
};

/**
 * Global accessibility setup
 */
export function setupGlobalAccessibility(): void {
	// Add global CSS for screen reader only content
	if (!document.getElementById('accessibility-styles')) {
		const style = document.createElement('style');
		style.id = 'accessibility-styles';
		style.textContent = `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      .sr-only-focusable:focus {
        position: static;
        width: auto;
        height: auto;
        padding: 0.5rem;
        margin: 0;
        overflow: visible;
        clip: auto;
        white-space: normal;
      }
    `;
		document.head.appendChild(style);
	}

	// Setup skip links if they don't exist
	if (!document.querySelector('[data-skip-link]')) {
		const skipLink = document.createElement('a');
		skipLink.href = '#main-content';
		skipLink.textContent = 'Skip to main content';
		skipLink.className = 'sr-only-focusable';
		skipLink.setAttribute('data-skip-link', '');
		skipLink.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      z-index: 9999;
      padding: 0.5rem 1rem;
      background: #000;
      color: #fff;
      text-decoration: none;
      transform: translateY(-100%);
      transition: transform 0.2s;
    `;

		skipLink.addEventListener('focus', () => {
			skipLink.style.transform = 'translateY(0)';
		});

		skipLink.addEventListener('blur', () => {
			skipLink.style.transform = 'translateY(-100%)';
		});

		document.body.insertBefore(skipLink, document.body.firstChild);
	}
}

// Auto-setup when module is imported
if (typeof window !== 'undefined') {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', setupGlobalAccessibility);
	} else {
		setupGlobalAccessibility();
	}
}
