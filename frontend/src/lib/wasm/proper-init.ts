/**
 * Proper WASM initialization for threading support
 * Updated to use new start() function for thread pool initialization
 */

import { browser } from '$app/environment';
import { loadVectorizer } from './loader';

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
        console.log('[WASM] Initializing module using new loader...');
        
        // Use the new loader which follows proper wasm-bindgen patterns
        wasmModule = await loadVectorizer();
        
        console.log('[WASM] ✅ Module initialized successfully');
        
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