/**
 * WASM module initialization and management
 * Provides a clean interface for the vectorize WASM module
 */

import { browser } from '$app/environment';

// Module state
let wasmModule: any = null;
let initPromise: Promise<any> | null = null;

/**
 * Initialize the WASM module
 */
export async function initWasm() {
	if (!browser) {
		throw new Error('WASM can only be initialized in the browser');
	}

	if (wasmModule) {
		return wasmModule;
	}

	if (initPromise) {
		return initPromise;
	}

	initPromise = loadWasmModule();
	wasmModule = await initPromise;
	return wasmModule;
}

async function loadWasmModule() {
	try {
		console.log('Loading WASM module...');

		// Import the WASM module
		const wasm = await import('./vectorize_wasm.js');

		console.log('WASM module imported, initializing...');

		// Initialize with the WASM binary
		const wasmBinaryUrl = new URL('./vectorize_wasm_bg.wasm', import.meta.url);

		// Call default export to initialize wasm-bindgen glue
		// This loads the .wasm file and sets up the proper bindings
		await wasm.default(wasmBinaryUrl);

		console.log('✅ WASM module initialized');

		// Initialize thread pool if available
		if (typeof window !== 'undefined' && window.crossOriginIsolated) {
			if (typeof wasm.initThreadPool === 'function') {
				try {
					const threadCount = navigator.hardwareConcurrency || 4;
					const promise = wasm.initThreadPool(threadCount);
					await promise;

					// Confirm success after promise resolves (important for state management)
					if (typeof wasm.confirm_threading_success === 'function') {
						wasm.confirm_threading_success();
					}

					console.log(`✅ Thread pool initialized with ${threadCount} threads`);
				} catch (error) {
					console.warn('⚠️ Thread pool initialization failed:', error);

					// Mark threading as failed for proper fallback
					if (typeof wasm.mark_threading_failed === 'function') {
						wasm.mark_threading_failed();
					}
				}
			} else {
				console.log('ℹ️ initThreadPool not available');
			}
		} else {
			console.log('ℹ️ Not cross-origin isolated, running single-threaded');
		}

		return wasm;
	} catch (error) {
		console.error('❌ Failed to load WASM module:', error);
		throw error;
	}
}

/**
 * Create a vectorizer instance
 */
export async function createVectorizer(imageData: Uint8Array, width: number, height: number) {
	const wasm = await initWasm();

	if (!wasm.WasmVectorizer) {
		throw new Error('WasmVectorizer not available');
	}

	return new wasm.WasmVectorizer(imageData, width, height);
}

/**
 * Get available backends
 */
export async function getWasmBackends() {
	const wasm = await initWasm();
	return wasm.WasmBackend || {};
}

/**
 * Get available presets
 */
export async function getWasmPresets() {
	const wasm = await initWasm();
	return wasm.WasmPreset || {};
}

/**
 * Check WASM capabilities
 */
export async function checkCapabilities() {
	const wasm = await initWasm();

	return {
		threading:
			typeof wasm.is_threading_supported === 'function' ? wasm.is_threading_supported() : false,
		threadCount: typeof wasm.get_thread_count === 'function' ? wasm.get_thread_count() : 1,
		crossOriginIsolated: typeof window !== 'undefined' ? window.crossOriginIsolated : false,
		sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
		wasmAvailable: !!wasm.WasmVectorizer
	};
}

/**
 * Re-export threading functions needed by workers
 * These are required by wasm-bindgen-rayon worker helpers
 */
export { initSync } from './vectorize_wasm.js';

/**
 * Export the main initialization function as default
 */
export default initWasm;
