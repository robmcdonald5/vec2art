/**
 * Wrapper for WASM module that handles imports correctly
 * This ensures the module can be imported from any location
 */

// Re-export everything from the WASM module
export * from './vectorize_wasm.js';
export { default } from './vectorize_wasm.js';

// Additional helper for easy initialization
export async function initializeWasm() {
    const init = (await import('./vectorize_wasm.js')).default;
    const wasmUrl = new URL('./vectorize_wasm_bg.wasm', import.meta.url);
    await init(wasmUrl);
    
    // Get the module exports
    const wasm = await import('./vectorize_wasm.js');
    
    // Initialize threading if available
    if (typeof window !== 'undefined' && window.crossOriginIsolated && wasm.initThreadPool) {
        const threads = navigator.hardwareConcurrency || 4;
        await wasm.initThreadPool(threads);
        console.log(`Thread pool initialized with ${threads} threads`);
    }
    
    return wasm;
}