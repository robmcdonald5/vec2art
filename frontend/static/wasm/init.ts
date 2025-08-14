/**
 * WASM module initialization wrapper
 * Handles loading the WASM module from static assets
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
    
    initPromise = loadWasmModule();
    wasmModule = await initPromise;
    return wasmModule;
}

async function loadWasmModule() {
    try {
        // Use the new index module
        const { default: initWasmModule } = await import('./index');
        const wasmModule = await initWasmModule();
        
        console.log('✅ WASM module initialized successfully');
        
        // Check for available features
        if (wasmModule.WasmVectorizer) {
            console.log('✅ WasmVectorizer available');
        }
        
        if (wasmModule.is_threading_supported) {
            const threadingSupported = wasmModule.is_threading_supported();
            console.log(`🔧 Threading support: ${threadingSupported}`);
        }
        
        return wasmModule;
    } catch (error) {
        console.error('❌ Failed to initialize WASM module:', error);
        throw error;
    }
}

export async function createVectorizer(imageData: Uint8Array, width: number, height: number) {
    const wasm = await initWasm();
    
    if (!wasm.WasmVectorizer) {
        throw new Error('WasmVectorizer not available');
    }
    
    return new wasm.WasmVectorizer(imageData, width, height);
}

export async function getWasmBackends() {
    const wasm = await initWasm();
    return wasm.WasmBackend || {};
}

export async function getWasmPresets() {
    const wasm = await initWasm();
    return wasm.WasmPreset || {};
}

export async function checkCapabilities() {
    const wasm = await initWasm();
    
    return {
        threading: wasm.is_threading_supported ? wasm.is_threading_supported() : false,
        threadCount: wasm.get_thread_count ? wasm.get_thread_count() : 1,
        crossOriginIsolated: typeof window !== 'undefined' ? window.crossOriginIsolated : false,
        sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined'
    };
}