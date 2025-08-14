/**
 * Simple WASM initialization without workers
 * This is a direct approach that loads WASM in the main thread
 */

import { browser } from '$app/environment';

let wasmModule: any = null;
let initPromise: Promise<any> | null = null;

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
    
    initPromise = loadWasm();
    wasmModule = await initPromise;
    return wasmModule;
}

async function loadWasm() {
    try {
        console.log('[WASM] Initializing...');
        
        // Import the WASM module directly
        const wasm = await import('./pkg/vectorize_wasm.js');
        
        // Initialize it
        await wasm.default();
        
        console.log('[WASM] Initialized successfully');
        
        // Try to initialize threading if available
        if (window.crossOriginIsolated && typeof wasm.initThreadPool === 'function') {
            try {
                const threads = navigator.hardwareConcurrency || 4;
                await wasm.initThreadPool(threads);
                console.log(`[WASM] Thread pool initialized with ${threads} threads`);
            } catch (e) {
                console.warn('[WASM] Thread pool failed:', e);
            }
        }
        
        return wasm;
    } catch (error) {
        console.error('[WASM] Failed to initialize:', error);
        throw error;
    }
}

export async function createVectorizer() {
    const wasm = await initWasm();
    
    if (!wasm.WasmVectorizer) {
        throw new Error('WasmVectorizer not available');
    }
    
    return new wasm.WasmVectorizer();
}

export async function vectorizeImage(imageData: ImageData, config?: any) {
    const wasm = await initWasm();
    const vectorizer = new wasm.WasmVectorizer();
    
    try {
        // Apply configuration if provided
        if (config) {
            // Set backend, detail level, etc.
            if (config.backend) vectorizer.set_backend(config.backend);
            if (config.detail) vectorizer.set_detail(config.detail);
            if (config.stroke_width) vectorizer.set_stroke_width(config.stroke_width);
        }
        
        // Vectorize the image
        const svg = vectorizer.vectorize(imageData);
        return svg;
    } finally {
        // Clean up
        vectorizer.free();
    }
}

export async function getCapabilities() {
    const wasm = await initWasm();
    
    return {
        wasmAvailable: !!wasm.WasmVectorizer,
        crossOriginIsolated: window.crossOriginIsolated,
        sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
        threading: typeof wasm.is_threading_supported === 'function' ? wasm.is_threading_supported() : false,
        backends: wasm.WasmBackend || {},
        presets: wasm.WasmPreset || {}
    };
}