/**
 * Proper WASM module loader following wasm-bindgen documentation
 * This implementation follows the research findings to avoid LinkError issues
 */

import { browser } from '$app/environment';

let wasmModule: any = null;
let initPromise: Promise<any> | null = null;

/**
 * Load and initialize the WASM vectorizer module with threading support
 * This function follows the correct wasm-bindgen initialization pattern:
 * 1. Import the generated JS module (not raw .wasm)
 * 2. Call the default export to initialize wasm-bindgen glue
 * 3. Initialize thread pool if cross-origin isolated
 */
export async function loadVectorizer() {
  if (!browser) {
    throw new Error('WASM must load in the browser');
  }
  
  if (wasmModule) {
    return wasmModule;
  }
  
  if (initPromise) {
    return initPromise;
  }
  
  initPromise = (async () => {
    try {
      console.log('[WASM Loader] Starting initialization...');
      
      // Import the wasm-bindgen generated JS (NOT the .wasm file directly)
      // This is critical to avoid LinkError - must use the JS wrapper
      const wasmJs = await import('./vectorize_wasm.js');
      console.log('[WASM Loader] JS module imported');
      
      // Call default export to initialize wasm-bindgen glue
      // This loads the .wasm file and sets up the proper bindings
      await wasmJs.default(new URL('./vectorize_wasm_bg.wasm', import.meta.url));
      console.log('[WASM Loader] WASM module initialized');
      
      // Check cross-origin isolation status for threading
      const isIsolated = typeof window !== 'undefined' && window.crossOriginIsolated;
      const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
      
      console.log('[WASM Loader] Environment check:', {
        crossOriginIsolated: isIsolated,
        sharedArrayBuffer: hasSharedArrayBuffer,
        hardwareConcurrency: navigator.hardwareConcurrency || 1
      });
      
      // Initialize thread pool if supported and cross-origin isolated
      if (isIsolated && hasSharedArrayBuffer && wasmJs.start) {
        try {
          console.log('[WASM Loader] Initializing thread pool...');
          await wasmJs.start(); // This calls the new async start() function
          console.log('[WASM Loader] ✅ Thread pool initialized successfully');
        } catch (error) {
          console.warn('[WASM Loader] ⚠️ Thread pool initialization failed, continuing in single-threaded mode:', error);
        }
      } else if (!isIsolated) {
        console.log('[WASM Loader] ℹ️ Not cross-origin isolated, running in single-threaded mode');
      } else if (!wasmJs.start) {
        console.log('[WASM Loader] ℹ️ Thread pool start function not available');
      }
      
      // Verify key exports are available
      const exports = {
        WasmVectorizer: !!wasmJs.WasmVectorizer,
        WasmBackend: !!wasmJs.WasmBackend,
        WasmPreset: !!wasmJs.WasmPreset,
        start: typeof wasmJs.start === 'function',
        is_threading_supported: typeof wasmJs.is_threading_supported === 'function',
        check_threading_requirements: typeof wasmJs.check_threading_requirements === 'function'
      };
      
      console.log('[WASM Loader] Available exports:', exports);
      
      if (!wasmJs.WasmVectorizer) {
        throw new Error('WasmVectorizer not found in WASM exports');
      }
      
      wasmModule = wasmJs;
      console.log('[WASM Loader] ✅ Initialization complete');
      
      return wasmModule;
    } catch (error) {
      console.error('[WASM Loader] ❌ Initialization failed:', error);
      initPromise = null; // Reset on failure to allow retry
      throw error;
    }
  })();
  
  return initPromise;
}

/**
 * Get threading capabilities and requirements
 */
export async function getCapabilities() {
  const wasm = await loadVectorizer();
  
  const capabilities = {
    crossOriginIsolated: typeof window !== 'undefined' ? window.crossOriginIsolated : false,
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    threading: false,
    threadCount: 1,
    wasmAvailable: !!wasm.WasmVectorizer,
    threadingRequirements: null as any
  };
  
  // Check threading support
  if (typeof wasm.is_threading_supported === 'function') {
    try {
      capabilities.threading = wasm.is_threading_supported();
    } catch (error) {
      console.warn('[WASM Loader] Error checking threading support:', error);
    }
  }
  
  // Get detailed threading requirements if available
  if (typeof wasm.check_threading_requirements === 'function') {
    try {
      capabilities.threadingRequirements = wasm.check_threading_requirements();
    } catch (error) {
      console.warn('[WASM Loader] Error checking threading requirements:', error);
    }
  }
  
  // Get thread count if available
  if (typeof wasm.get_thread_count === 'function') {
    try {
      capabilities.threadCount = wasm.get_thread_count();
    } catch (error) {
      console.warn('[WASM Loader] Error getting thread count:', error);
    }
  }
  
  return capabilities;
}

/**
 * Create a new vectorizer instance
 */
export async function createVectorizer() {
  const wasm = await loadVectorizer();
  
  if (!wasm.WasmVectorizer) {
    throw new Error('WasmVectorizer not available');
  }
  
  return new wasm.WasmVectorizer();
}

/**
 * Get available backends from WASM module
 */
export async function getAvailableBackends() {
  const wasm = await loadVectorizer();
  
  if (typeof wasm.get_available_backends === 'function') {
    return wasm.get_available_backends();
  }
  
  // Fallback to known backends
  return ['edge', 'centerline', 'superpixel', 'dots'];
}

/**
 * Get available presets from WASM module
 */
export async function getAvailablePresets() {
  const wasm = await loadVectorizer();
  
  if (typeof wasm.get_available_presets === 'function') {
    return wasm.get_available_presets();
  }
  
  // Fallback to known presets
  return ['default', 'detailed', 'fast', 'artistic'];
}

/**
 * Reset the WASM module (for testing or error recovery)
 */
export function resetWasm() {
  wasmModule = null;
  initPromise = null;
  console.log('[WASM Loader] Module reset');
}