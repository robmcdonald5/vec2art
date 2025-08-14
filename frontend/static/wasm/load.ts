/**
 * Official WASM module loader following wasm-bindgen-rayon documentation
 * This properly initializes WASM with threading support
 */

import { browser } from '$app/environment';

let wasmModule: any = null;
let initPromise: Promise<any> | null = null;

export async function initializeWasm() {
    if (!browser) {
        throw new Error('WASM can only be initialized in the browser');
    }
    
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
        console.log('[WASM] Starting initialization...');
        
        // Import the WASM module from the pkg directory
        const wasm = await import('./pkg/vectorize_wasm.js');
        
        console.log('[WASM] Module imported, initializing...');
        
        // Initialize the WASM module (required for --target web)
        await wasm.default();
        
        console.log('[WASM] Module initialized');
        
        // Check cross-origin isolation
        const isIsolated = typeof window !== 'undefined' && window.crossOriginIsolated;
        console.log(`[WASM] Cross-origin isolated: ${isIsolated}`);
        console.log(`[WASM] SharedArrayBuffer available: ${typeof SharedArrayBuffer !== 'undefined'}`);
        
        // Initialize thread pool if cross-origin isolated
        if (isIsolated && typeof wasm.initThreadPool === 'function') {
            try {
                const threadCount = navigator.hardwareConcurrency || 4;
                console.log(`[WASM] Initializing thread pool with ${threadCount} threads...`);
                await wasm.initThreadPool(threadCount);
                console.log('[WASM] ✅ Thread pool initialized successfully');
            } catch (error) {
                console.warn('[WASM] ⚠️ Thread pool initialization failed:', error);
                console.log('[WASM] Continuing in single-threaded mode');
            }
        } else if (!isIsolated) {
            console.log('[WASM] ℹ️ Not cross-origin isolated, running in single-threaded mode');
            console.log('[WASM] To enable threading, ensure COOP and COEP headers are set');
        } else {
            console.log('[WASM] ⚠️ initThreadPool function not available');
        }
        
        // Verify exports
        console.log('[WASM] Available exports:', {
            WasmVectorizer: !!wasm.WasmVectorizer,
            WasmBackend: !!wasm.WasmBackend,
            WasmPreset: !!wasm.WasmPreset,
            is_threading_supported: typeof wasm.is_threading_supported === 'function',
            initThreadPool: typeof wasm.initThreadPool === 'function'
        });
        
        return wasm;
        
    } catch (error) {
        console.error('[WASM] ❌ Initialization failed:', error);
        throw error;
    }
}

export async function getCapabilities() {
    const wasm = await initializeWasm();
    
    const capabilities = {
        crossOriginIsolated: typeof window !== 'undefined' ? window.crossOriginIsolated : false,
        sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
        threading: false,
        threadCount: 1,
        wasmAvailable: !!wasm.WasmVectorizer
    };
    
    if (typeof wasm.is_threading_supported === 'function') {
        capabilities.threading = wasm.is_threading_supported();
    }
    
    if (typeof wasm.get_thread_count === 'function') {
        capabilities.threadCount = wasm.get_thread_count();
    }
    
    return capabilities;
}

export async function createVectorizer() {
    const wasm = await initializeWasm();
    
    if (!wasm.WasmVectorizer) {
        throw new Error('WasmVectorizer not available');
    }
    
    return new wasm.WasmVectorizer();
}