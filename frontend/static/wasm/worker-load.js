/**
 * Worker-safe WASM loader
 * This module can be imported in Web Workers as it doesn't use any SvelteKit imports
 */

let wasmModule = null;
let initPromise = null;

export async function initializeWasm() {
    if (wasmModule) {
        return wasmModule;
    }
    
    if (initPromise) {
        return initPromise;
    }
    
    initPromise = loadWasm();
    wasmModule = await initPromise;
    return wasmModule;
}

async function loadWasm() {
    try {
        console.log('[Worker WASM] Starting initialization...');
        
        // Import the WASM module - using dynamic import to avoid build issues
        const wasm = await import('./pkg/vectorize_wasm.js');
        
        console.log('[Worker WASM] Module imported, initializing...');
        
        // Initialize the WASM module
        await wasm.default();
        
        console.log('[Worker WASM] Module initialized');
        
        // Check if we're in a cross-origin isolated context
        const isIsolated = typeof self !== 'undefined' && self.crossOriginIsolated;
        
        // Initialize thread pool if possible
        if (isIsolated && typeof wasm.initThreadPool === 'function') {
            try {
                const threadCount = self.navigator?.hardwareConcurrency || 4;
                await wasm.initThreadPool(threadCount);
                console.log(`[Worker WASM] Thread pool initialized with ${threadCount} threads`);
            } catch (error) {
                console.warn('[Worker WASM] Thread pool initialization failed:', error);
            }
        }
        
        return wasm;
        
    } catch (error) {
        console.error('[Worker WASM] Initialization failed:', error);
        throw error;
    }
}