/**
 * WASM Module Initialization with Adaptive Memory for Mobile
 *
 * This module handles the initialization of the WebAssembly module
 * with automatic detection of mobile devices and adaptive memory limits.
 */

import wasmInit from './vectorize_wasm.js';
import { createAdaptiveMemory, isMobileDevice, getMemoryStats } from './wasm-memory-init';

let wasmInstance: any = null;
let initPromise: Promise<any> | null = null;

/**
 * Initialize the WASM module with adaptive memory configuration
 *
 * This function automatically detects mobile devices and adjusts
 * memory limits to prevent "Out of Memory" errors on iOS Safari.
 */
export async function initializeWasm(): Promise<any> {
	// Return existing instance if already initialized
	if (wasmInstance) {
		return wasmInstance;
	}

	// Return existing promise if initialization is in progress
	if (initPromise) {
		return initPromise;
	}

	// Start initialization
	initPromise = (async () => {
		try {
			console.log('[WASM Init] Starting initialization with adaptive memory...');

			// Detect device type
			const isMobile = isMobileDevice();
			console.log(`[WASM Init] Device type: ${isMobile ? 'Mobile' : 'Desktop'}`);

			// Create adaptive memory configuration
			const memory = createAdaptiveMemory();

			// Log memory configuration
			const stats = getMemoryStats(memory);
			console.log(`[WASM Init] Memory allocated: ${stats.totalMB.toFixed(0)}MB max`);

			// Initialize WASM with custom memory
			const wasmModule = await wasmInit({
				memory: memory
			});

			console.log('[WASM Init] WASM module initialized successfully');

			// Store instance
			wasmInstance = wasmModule;

			// Log available exports
			if (typeof wasmModule === 'object' && wasmModule !== null) {
				const exports = Object.keys(wasmModule);
				console.log('[WASM Init] Available exports:', exports.slice(0, 10), '...');
			}

			return wasmInstance;
		} catch (error) {
			console.error('[WASM Init] Initialization failed:', error);

			// Reset state on error
			wasmInstance = null;
			initPromise = null;

			// Provide helpful error message for iOS users
			if (isMobileDevice() && error instanceof Error && error.message.includes('memory')) {
				throw new Error(
					'Memory allocation failed on mobile device. This is a known limitation with iOS Safari. ' +
						'Please try: 1) Closing other browser tabs, 2) Restarting your browser, or ' +
						'3) Using a desktop browser for larger images.'
				);
			}

			throw error;
		}
	})();

	return initPromise;
}

/**
 * Get the WASM instance (must be initialized first)
 */
export function getWasmInstance(): any {
	if (!wasmInstance) {
		throw new Error('WASM not initialized. Call initializeWasm() first.');
	}
	return wasmInstance;
}

/**
 * Check if WASM is initialized
 */
export function isWasmInitialized(): boolean {
	return wasmInstance !== null;
}

/**
 * Reset WASM instance (useful for testing or memory cleanup)
 */
export function resetWasm(): void {
	wasmInstance = null;
	initPromise = null;
	console.log('[WASM Init] Instance reset');
}

/**
 * Get current memory usage statistics
 */
export function getWasmMemoryStats(): ReturnType<typeof getMemoryStats> | null {
	if (!wasmInstance || !wasmInstance.memory) {
		return null;
	}
	return getMemoryStats(wasmInstance.memory);
}

// Re-export the main initialization function as default
export default initializeWasm;
