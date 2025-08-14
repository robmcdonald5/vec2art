<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  interface TestResult {
    message: string;
    status: 'pass' | 'fail' | 'info' | 'warn';
    timestamp: string;
  }
  
  let results: TestResult[] = [];
  let isLoading = true;
  
  function log(message: string, status: TestResult['status'] = 'info') {
    results = [...results, {
      message,
      status,
      timestamp: new Date().toLocaleTimeString()
    }];
  }
  
  onMount(async () => {
    if (!browser) return;
    
    // Environment checks
    log('=== Environment Check ===', 'info');
    const crossOrigin = window.crossOriginIsolated;
    const sharedBuffer = typeof SharedArrayBuffer !== 'undefined';
    
    log(`Cross-origin isolated: ${crossOrigin}`, crossOrigin ? 'pass' : 'fail');
    log(`SharedArrayBuffer available: ${sharedBuffer}`, sharedBuffer ? 'pass' : 'fail');
    log(`CPU cores: ${navigator.hardwareConcurrency}`, 'info');
    log(`User Agent: ${navigator.userAgent.substring(0, 50)}...`, 'info');
    
    // WASM loading test
    log('', 'info');
    log('=== WASM Module Test ===', 'info');
    
    try {
      const { initializeWasm, getCapabilities, createVectorizer } = await import('$lib/wasm/load');
      
      // Initialize WASM
      log('Initializing WASM module...', 'info');
      const wasm = await initializeWasm();
      log('✅ WASM module initialized', 'pass');
      
      // Check capabilities
      log('', 'info');
      log('=== Capabilities ===', 'info');
      const caps = await getCapabilities();
      
      log(`WASM available: ${caps.wasmAvailable}`, caps.wasmAvailable ? 'pass' : 'fail');
      log(`Threading enabled: ${caps.threading}`, caps.threading ? 'pass' : 'warn');
      log(`Thread count: ${caps.threadCount}`, caps.threadCount > 1 ? 'pass' : 'warn');
      
      // Test vectorization
      if (caps.wasmAvailable) {
        log('', 'info');
        log('=== Vectorization Test ===', 'info');
        
        const vectorizer = await createVectorizer();
        log('✅ Vectorizer created', 'pass');
        
        // Create test image
        const pixels = new Uint8ClampedArray(16); // 2x2 image
        pixels.fill(255); // White image
        const imageData = new ImageData(pixels, 2, 2);
        
        const svg = vectorizer.vectorize(imageData);
        log(`✅ Vectorization successful`, 'pass');
        log(`Output size: ${svg.length} characters`, 'info');
        
        vectorizer.free();
        log('✅ Memory freed', 'pass');
      }
      
      // Summary
      log('', 'info');
      if (caps.threading && caps.threadCount > 1) {
        log(`🎉 Success! WASM with ${caps.threadCount} threads is ready!`, 'pass');
      } else if (caps.wasmAvailable) {
        log('✅ WASM is working (single-threaded mode)', 'pass');
        if (!crossOrigin) {
          log('ℹ️ To enable threading, cross-origin isolation is required', 'info');
        }
      } else {
        log('❌ WASM initialization failed', 'fail');
      }
      
    } catch (error: any) {
      log(`❌ Error: ${error.message}`, 'fail');
      console.error('Full error:', error);
    }
    
    isLoading = false;
  });
</script>

<div class="container">
  <h1>WASM Threading Test</h1>
  <p class="subtitle">Official implementation test following wasm-bindgen-rayon documentation</p>
  
  {#if isLoading}
    <div class="loading">Loading...</div>
  {:else}
    <div class="results">
      {#each results as result}
        <div class="result {result.status}">
          <span class="time">[{result.timestamp}]</span>
          <span class="message">{result.message}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: 'Courier New', monospace;
  }
  
  h1 {
    color: #e0e0e0;
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    color: #888;
    margin-bottom: 2rem;
  }
  
  .loading {
    color: #2196f3;
    font-size: 1.2rem;
  }
  
  .results {
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 1rem;
    max-height: 600px;
    overflow-y: auto;
  }
  
  .result {
    padding: 0.25rem 0;
    font-size: 0.9rem;
  }
  
  .time {
    color: #666;
    margin-right: 0.5rem;
  }
  
  .pass { color: #4caf50; }
  .fail { color: #f44336; }
  .info { color: #2196f3; }
  .warn { color: #ff9800; }
  
  .pass .message { font-weight: bold; }
  .fail .message { font-weight: bold; }
</style>