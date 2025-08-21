/**
 * Worker-compatible WASM loader
 * Simplified loader for use in Web Workers where some browser APIs may not be available
 */

/**
 * Initialize WASM module in worker context
 * This is a simplified version that doesn't rely on browser-specific APIs
 */
export async function initializeWasm() {
	try {
		console.log('[Worker WASM] Loading WASM module in worker context...');

		// Import the wasm-bindgen generated JS module
		const wasmJs = await import('./vectorize_wasm.js');
		console.log('[Worker WASM] JS module imported');

		// Initialize with the WASM binary using importScripts-compatible URL
		// In workers, we need to use a different approach for the URL
		const wasmUrl = new URL('./vectorize_wasm_bg.wasm', import.meta.url);
		await wasmJs.default(wasmUrl);
		console.log('[Worker WASM] WASM module initialized');

		// Verify key exports are available
		if (!wasmJs.WasmVectorizer) {
			throw new Error('WasmVectorizer not found in WASM exports');
		}

		console.log('[Worker WASM] ✅ Worker initialization complete');
		return wasmJs;
	} catch (error) {
		console.error('[Worker WASM] ❌ Worker initialization failed:', error);
		throw error;
	}
}
