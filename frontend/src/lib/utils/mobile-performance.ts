/**
 * Mobile Performance Utilities
 *
 * Optimizations for mobile devices to improve scrolling performance
 * and reduce battery drain from unnecessary animations
 */

/**
 * Debounce function for performance-critical operations
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return function executedFunction(...args: Parameters<T>) {
		const later = () => {
			timeout = null;
			func(...args);
		};

		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(later, wait);
	};
}

/**
 * Throttle function for high-frequency events
 */
export function throttle<T extends (...args: any[]) => any>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle = false;

	return function executedFunction(...args: Parameters<T>) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => {
				inThrottle = false;
			}, limit);
		}
	};
}

/**
 * Initialize mobile performance optimizations
 * Adds is-scrolling class during scroll for CSS performance optimizations
 */
export function initMobilePerformance(): () => void {
	if (typeof window === 'undefined') {
		return () => {};
	}

	let scrollTimer: ReturnType<typeof setTimeout> | null = null;
	const scrollClass = 'is-scrolling';

	// Only apply on touch devices
	const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

	if (!isTouchDevice) {
		return () => {};
	}

	const handleScroll = () => {
		// Add class immediately on scroll start
		if (!document.body.classList.contains(scrollClass)) {
			document.body.classList.add(scrollClass);
		}

		// Clear existing timer
		if (scrollTimer) {
			clearTimeout(scrollTimer);
		}

		// Remove class 150ms after scrolling stops
		scrollTimer = setTimeout(() => {
			document.body.classList.remove(scrollClass);
		}, 150);
	};

	// Use passive listener for better scroll performance
	window.addEventListener('scroll', handleScroll, { passive: true });

	// Cleanup function
	return () => {
		window.removeEventListener('scroll', handleScroll);
		if (scrollTimer) {
			clearTimeout(scrollTimer);
		}
		document.body.classList.remove(scrollClass);
	};
}

/**
 * Check if device is mobile based on viewport width
 */
export function isMobileDevice(): boolean {
	return typeof window !== 'undefined' && window.innerWidth <= 768;
}

/**
 * Check if device is touch-capable
 */
export function isTouchDevice(): boolean {
	return typeof window !== 'undefined' &&
		('ontouchstart' in window || navigator.maxTouchPoints > 0);
}

/**
 * Request idle callback with fallback for Safari
 */
export function requestIdleCallback(
	callback: () => void,
	options?: { timeout?: number }
): number {
	if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
		return (window as any).requestIdleCallback(callback, options);
	}

	// Fallback for Safari and older browsers
	const timeout = options?.timeout || 1;
	return window.setTimeout(callback, timeout);
}

/**
 * Cancel idle callback with fallback
 */
export function cancelIdleCallback(id: number): void {
	if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
		(window as any).cancelIdleCallback(id);
	} else {
		clearTimeout(id);
	}
}