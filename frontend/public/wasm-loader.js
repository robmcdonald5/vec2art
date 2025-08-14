// Raw WASM loader that bypasses Vite's module system
// This loads the wasm-bindgen generated files directly

let wasmModule = null;

async function loadWasmModule() {
    if (wasmModule) return wasmModule;
    
    try {
        // Load the JS wrapper as a script, not as an ES module
        const script = document.createElement('script');
        script.src = '/wasm/vectorize_wasm.js';
        
        // Create a promise that resolves when the script loads
        const scriptLoaded = new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
        });
        
        document.head.appendChild(script);
        await scriptLoaded;
        
        // The script should have created a global wasm_bindgen object
        if (typeof wasm_bindgen === 'undefined') {
            throw new Error('wasm_bindgen not found after loading script');
        }
        
        // Initialize the WASM module
        await wasm_bindgen('/wasm/vectorize_wasm_bg.wasm');
        
        // Store the module
        wasmModule = wasm_bindgen;
        
        console.log('✅ WASM module loaded successfully');
        return wasmModule;
        
    } catch (error) {
        console.error('Failed to load WASM module:', error);
        throw error;
    }
}

// Export for use in other scripts
window.loadWasmModule = loadWasmModule;