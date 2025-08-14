/**
 * Proper WASM initialization for threading support
 * This handles the correct initialization sequence for --target web builds
 */

import { browser } from '$app/environment';

// Dynamic import to avoid SSR issues - these will be loaded only when needed
let wasmModule: any = null;

let initialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the WASM module with proper threading support
 */
export async function initializeWasm(): Promise<void> {
    if (!browser) {
        throw new Error('WASM can only be initialized in the browser');
    }
    
    if (initialized) {
        return;
    }
    
    if (initPromise) {
        return initPromise;
    }
    
    initPromise = doInit();
    await initPromise;
    initialized = true;
}

async function doInit(): Promise<void> {
    try {
        console.log('[WASM] Initializing module...');
        
        // Dynamically import the WASM module to avoid SSR issues
        wasmModule = await import('./pkg/vectorize_wasm.js');
        
        // Initialize the WASM module
        // For --target web, the init function handles all the imports internally
        await wasmModule.default();
        
        console.log('[WASM] Module initialized');
        
        // Check if we're cross-origin isolated for threading
        if (typeof window !== 'undefined' && window.crossOriginIsolated && wasmModule.initThreadPool) {
            try {
                const threadCount = navigator.hardwareConcurrency || 4;
                console.log(`[WASM] Initializing thread pool with ${threadCount} threads...`);
                
                // Initialize the thread pool
                await wasmModule.initThreadPool(threadCount);
                
                console.log('[WASM] ✅ Thread pool initialized');
            } catch (error) {
                console.warn('[WASM] ⚠️ Thread pool initialization failed:', error);
                console.log('[WASM] Continuing in single-threaded mode');
            }
        } else {
            if (typeof window !== 'undefined') {
                if (!window.crossOriginIsolated) {
                    console.log('[WASM] Not cross-origin isolated, running single-threaded');
                    console.log('[WASM] To enable threading, ensure COOP and COEP headers are set');
                } else if (!wasmModule.initThreadPool) {
                    console.log('[WASM] initThreadPool not available - built without threading support');
                }
            } else {
                console.log('[WASM] Running in single-threaded mode (server-side)');
            }
        }
        
    } catch (error) {
        console.error('[WASM] Failed to initialize:', error);
        throw error;
    }
}

// Helper to ensure initialization before use
export async function ensureInitialized(): Promise<void> {
    if (!initialized) {
        await initializeWasm();
    }
}

// Export WASM functions after initialization
export async function getWasmModule(): Promise<any> {
    await ensureInitialized();
    return wasmModule;
}

// Export specific WASM exports for convenience
export async function WasmVectorizer(...args: any[]): Promise<any> {
    await ensureInitialized();
    if (!wasmModule?.WasmVectorizer) {
        throw new Error('WasmVectorizer not available');
    }
    return new wasmModule.WasmVectorizer(...args);
}

export async function is_threading_supported(): Promise<boolean> {
    await ensureInitialized();
    if (typeof wasmModule?.is_threading_supported === 'function') {
        return wasmModule.is_threading_supported();
    }
    return false;
}