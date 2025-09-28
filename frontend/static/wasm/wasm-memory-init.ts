/**
 * WASM Memory Initialization with Mobile Detection
 *
 * This module provides adaptive memory configuration for WebAssembly
 * to prevent "Out of Memory" errors on iOS Safari and other mobile browsers.
 *
 * Mobile browsers (especially iOS Safari) have stricter memory limits:
 * - iOS Safari: ~256MB safe limit
 * - Android Chrome: ~300MB practical limit
 * - Desktop browsers: Can handle 2-4GB
 */

/**
 * Detects if the current browser is running on a mobile device
 */
export function isMobileDevice(): boolean {
	// Check if we're in a browser environment
	if (typeof window === 'undefined' || typeof navigator === 'undefined') {
		return false;
	}

	// Method 1: Check userAgent for mobile indicators
	const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
	const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

	// Method 2: Check for touch support (not definitive but helpful)
	const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

	// Method 3: Check screen size (mobile devices typically have smaller screens)
	const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 768;

	// Method 4: Specific iOS detection (most problematic for WASM memory)
	const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

	// Return true if any strong mobile indicator is present
	// iOS gets special treatment due to its strict memory limits
	if (isIOS) return true;

	// For other devices, use multiple indicators
	return mobileRegex.test(userAgent.toLowerCase()) || (hasTouchSupport && isSmallScreen);
}

/**
 * Gets the appropriate memory configuration based on device type
 */
export function getMemoryConfig() {
	const isMobile = isMobileDevice();

	// Memory page size in WebAssembly (64KB per page)
	const PAGE_SIZE = 65536;

	// Configuration based on device type
	const config = {
		initial: 40, // 40 pages = ~2.5MB initial (same for all devices)
		maximum: isMobile
			? 4096 // 4096 pages = 256MB for mobile (iOS Safari safe limit)
			: 65536, // 65536 pages = 4GB for desktop
		shared: true // Required for threading support
	};

	// Log the configuration being used
	console.log(`[WASM Memory] Device type: ${isMobile ? 'Mobile' : 'Desktop'}`);
	console.log(
		`[WASM Memory] Max memory: ${((config.maximum * PAGE_SIZE) / (1024 * 1024)).toFixed(0)}MB`
	);

	return config;
}

/**
 * Creates a WebAssembly.Memory instance with adaptive sizing
 */
export function createAdaptiveMemory(): WebAssembly.Memory {
	const config = getMemoryConfig();

	try {
		// Try to create memory with detected configuration
		return new WebAssembly.Memory(config);
	} catch (error) {
		console.warn('[WASM Memory] Failed to allocate memory with config:', config, error);

		// Fallback: Try with minimal mobile configuration
		const fallbackConfig = {
			initial: 40,
			maximum: 4096, // 256MB - safe for all devices
			shared: true
		};

		console.log('[WASM Memory] Falling back to minimal configuration: 256MB max');

		try {
			return new WebAssembly.Memory(fallbackConfig);
		} catch (fallbackError) {
			console.error('[WASM Memory] Failed to allocate even minimal memory:', fallbackError);

			// Last resort: Non-shared memory with small size
			const lastResortConfig = {
				initial: 40,
				maximum: 2048, // 128MB
				shared: false // Disable threading
			};

			console.log('[WASM Memory] Last resort: 128MB non-shared memory');
			return new WebAssembly.Memory(lastResortConfig);
		}
	}
}

/**
 * Patches the WASM initialization to use adaptive memory
 * This should be called before importing the WASM module
 */
export function patchWasmMemoryInit(wasmModule: any): void {
	if (!wasmModule || !wasmModule.__wbg_init_memory) {
		console.warn('[WASM Memory] Unable to patch memory initialization');
		return;
	}

	const originalInitMemory = wasmModule.__wbg_init_memory;

	wasmModule.__wbg_init_memory = function (imports: any, providedMemory?: WebAssembly.Memory) {
		// If memory is provided, use it
		if (providedMemory) {
			return originalInitMemory.call(this, imports, providedMemory);
		}

		// Otherwise, create adaptive memory
		const adaptiveMemory = createAdaptiveMemory();
		return originalInitMemory.call(this, imports, adaptiveMemory);
	};

	console.log('[WASM Memory] Memory initialization patched for adaptive sizing');
}

/**
 * Helper to get memory usage statistics
 */
export function getMemoryStats(memory: WebAssembly.Memory): {
	used: number;
	total: number;
	percentage: number;
	usedMB: number;
	totalMB: number;
} {
	const PAGE_SIZE = 65536;
	const buffer = memory.buffer;
	const used = buffer.byteLength;
	const total = (memory as any).maximum ? (memory as any).maximum * PAGE_SIZE : used;

	return {
		used,
		total,
		percentage: (used / total) * 100,
		usedMB: used / (1024 * 1024),
		totalMB: total / (1024 * 1024)
	};
}
