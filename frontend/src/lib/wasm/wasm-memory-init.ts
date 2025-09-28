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
 * Detects if the current browser is Safari (desktop or mobile)
 */
export function isSafari(): boolean {
	if (typeof window === 'undefined' || typeof navigator === 'undefined') {
		return false;
	}

	const userAgent = navigator.userAgent || '';
	// Safari detection: has Safari in UA but not Chrome/Chromium
	const isSafariBrowser = /Safari/.test(userAgent) && !/Chrome|Chromium/.test(userAgent);

	// Additional check for Safari on iOS
	const isIOSSafari = /iPad|iPhone|iPod/.test(userAgent) && !/CriOS|FxiOS|OPiOS/.test(userAgent);

	return isSafariBrowser || isIOSSafari;
}

/**
 * Detects if SharedArrayBuffer is available and functional
 */
export function hasSharedArrayBufferSupport(): boolean {
	if (typeof SharedArrayBuffer === 'undefined') {
		return false;
	}

	// Try to create a small SharedArrayBuffer to test actual support
	try {
		const sab = new SharedArrayBuffer(1);
		return sab.byteLength === 1;
	} catch {
		return false;
	}
}

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
	const safari = isSafari();
	const hasSharedMemory = hasSharedArrayBufferSupport();

	// Memory page size in WebAssembly (64KB per page)
	const PAGE_SIZE = 65536;

	// Safari-specific memory limits
	let maximum: number;
	if (safari && isMobile) {
		maximum = 4096; // 256MB - iOS Safari strict limit
	} else if (safari) {
		maximum = 16384; // 1GB - Desktop Safari conservative limit
	} else if (isMobile) {
		maximum = 4096; // 256MB - Mobile browsers safe limit
	} else {
		maximum = 32768; // 2GB - Desktop browsers (reduced from 4GB for stability)
	}

	// Configuration based on device and browser type
	const config = {
		initial: 40, // 40 pages = ~2.5MB initial (same for all devices)
		maximum,
		// Only use shared memory if supported and not on Safari (better compatibility)
		shared: hasSharedMemory && !safari
	};

	// Log the configuration being used
	console.log(`[WASM Memory] Browser: ${safari ? 'Safari' : 'Other'}, Mobile: ${isMobile}`);
	console.log(`[WASM Memory] SharedArrayBuffer: ${config.shared ? 'Enabled' : 'Disabled'}`);
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

		// Fallback 1: Try without shared memory (Safari compatibility)
		const fallbackConfig = {
			initial: 40,
			maximum: 4096, // 256MB - safe for all devices
			shared: false // Disable shared memory for Safari
		};

		console.log('[WASM Memory] Falling back to non-shared memory: 256MB max');

		try {
			return new WebAssembly.Memory(fallbackConfig);
		} catch (fallbackError) {
			console.error('[WASM Memory] Failed to allocate fallback memory:', fallbackError);

			// Last resort: Minimal non-shared memory
			const lastResortConfig = {
				initial: 16, // 1MB initial
				maximum: 2048 // 128MB maximum
			};

			console.log('[WASM Memory] Last resort: 128MB non-shared memory (minimal)');
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
