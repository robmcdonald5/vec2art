<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  let status = 'Initializing...';
  let results: Array<{message: string, type: 'pass' | 'fail' | 'info' | 'warn'}> = [];
  
  function log(message: string, type: 'pass' | 'fail' | 'info' | 'warn' = 'info') {
    results = [...results, { message, type }];
  }
  
  onMount(async () => {
    if (!browser) return;
    
    log('=== Environment Check ===', 'info');
    log(`crossOriginIsolated: ${window.crossOriginIsolated}`, window.crossOriginIsolated ? 'pass' : 'fail');
    log(`SharedArrayBuffer: ${typeof SharedArrayBuffer !== 'undefined'}`, typeof SharedArrayBuffer !== 'undefined' ? 'pass' : 'fail');
    log(`CPU cores: ${navigator.hardwareConcurrency}`, 'info');
    
    try {
      log('', 'info');
      log('=== WASM Module Loading ===', 'info');
      
      // Import the WASM initialization
      const { initWasm, checkCapabilities } = await import('$lib/wasm');
      
      // Initialize WASM
      const wasmModule = await initWasm();
      log('✓ WASM module initialized', 'pass');
      
      // Check capabilities
      const capabilities = await checkCapabilities();
      log(`Threading: ${capabilities.threading}`, capabilities.threading ? 'pass' : 'warn');
      log(`Thread count: ${capabilities.threadCount}`, 'info');
      log(`Cross-origin isolated: ${capabilities.crossOriginIsolated}`, capabilities.crossOriginIsolated ? 'pass' : 'warn');
      log(`SharedArrayBuffer: ${capabilities.sharedArrayBuffer}`, capabilities.sharedArrayBuffer ? 'pass' : 'warn');
      
      // Test vectorization
      if (wasmModule.WasmVectorizer) {
        log('', 'info');
        log('=== Vectorization Test ===', 'info');
        
        const pixels = new Uint8ClampedArray(16);
        pixels.fill(255);
        const imageData = new ImageData(pixels, 2, 2);
        
        const vectorizer = new wasmModule.WasmVectorizer();
        const svg = vectorizer.vectorize(imageData);
        vectorizer.free();
        
        log(`✓ Vectorization successful, output: ${svg.length} chars`, 'pass');
      }
      
      // Test worker
      log('', 'info');
      log('=== Worker Test ===', 'info');
      
      try {
        const { WorkerManager } = await import('$lib/services/worker-manager');
        const manager = WorkerManager.getInstance();
        const workerCaps = await manager.initialize();
        
        log('✓ Worker initialized', 'pass');
        log(`Worker threading: ${workerCaps.threading_supported}`, workerCaps.threading_supported ? 'pass' : 'warn');
        log(`Worker cross-origin: ${workerCaps.cross_origin_isolated}`, workerCaps.cross_origin_isolated ? 'pass' : 'warn');
      } catch (error) {
        log(`✗ Worker error: ${error.message}`, 'fail');
      }
      
      status = '✅ All tests complete!';
      
    } catch (error) {
      status = '❌ Test failed';
      log(`Error: ${error.message}`, 'fail');
      console.error('Full error:', error);
    }
  });
</script>

<div class="container">
  <h1>WASM Threading Test Page</h1>
  <p class="status">{status}</p>
  
  <div class="results">
    {#each results as result}
      <div class="result {result.type}">
        {result.message}
      </div>
    {/each}
  </div>
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: monospace;
  }
  
  h1 {
    color: #e0e0e0;
    margin-bottom: 1rem;
  }
  
  .status {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    color: #2196f3;
  }
  
  .results {
    background: #2a2a2a;
    padding: 1rem;
    border-radius: 8px;
  }
  
  .result {
    padding: 0.25rem 0;
  }
  
  .pass { color: #4caf50; font-weight: bold; }
  .fail { color: #f44336; font-weight: bold; }
  .info { color: #2196f3; }
  .warn { color: #ff9800; }
</style>