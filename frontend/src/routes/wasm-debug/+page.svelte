<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  let logs: string[] = [];
  
  function log(msg: string) {
    logs = [...logs, `${new Date().toLocaleTimeString()}: ${msg}`];
    console.log(msg);
  }
  
  onMount(async () => {
    if (!browser) return;
    
    log('Starting WASM debug test...');
    log(`Environment: crossOriginIsolated=${window.crossOriginIsolated}, SharedArrayBuffer=${typeof SharedArrayBuffer !== 'undefined'}`);
    
    try {
      // Step 1: Use our proper initialization system
      log('Step 1: Importing proper initialization system...');
      const { initializeWasm, WasmVectorizer, is_threading_supported } = await import('$lib/wasm/proper-init.ts');
      log('✓ Proper init system imported');
      
      // Step 2: Initialize WASM with our proven system
      log('Step 2: Initializing WASM with proper-init system...');
      await initializeWasm();
      log('✓ WASM initialized successfully');
      
      // Step 3: Check threading support
      log('Step 3: Checking threading support...');
      if (is_threading_supported) {
        const supported = is_threading_supported();
        log(`Threading supported: ${supported}`);
      } else {
        log('is_threading_supported function not found');
      }
      
      // Step 4: Try to create a vectorizer
      if (WasmVectorizer) {
        log('Step 4: Creating a vectorizer instance...');
        const vectorizer = new WasmVectorizer();
        log('✓ Vectorizer created');
        
        // Try simple vectorization
        const pixels = new Uint8ClampedArray(16);
        pixels.fill(255);
        const imageData = new ImageData(pixels, 2, 2);
        
        const svg = vectorizer.vectorize(imageData);
        log(`✓ Vectorization successful, output: ${svg.length} chars`);
        
        vectorizer.free();
        log('✓ Vectorizer freed');
      } else {
        log('✗ WasmVectorizer class NOT available');
      }
      
      log('✅ All tests complete!');
      
    } catch (error: any) {
      log(`❌ Error: ${error.message}`);
      console.error('Full error:', error);
    }
  });
</script>

<div class="container">
  <h1>WASM Debug Test</h1>
  <p>Step-by-step WASM loading test with detailed logging</p>
  
  <div class="logs">
    {#each logs as logLine}
      <div class="log-line">{logLine}</div>
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
  }
  
  .logs {
    background: #1a1a1a;
    border: 1px solid #333;
    padding: 1rem;
    border-radius: 4px;
    max-height: 600px;
    overflow-y: auto;
    margin-top: 1rem;
  }
  
  .log-line {
    padding: 0.25rem 0;
    color: #0f0;
    white-space: pre-wrap;
    word-break: break-all;
  }
</style>