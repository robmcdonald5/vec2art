<script lang="ts">
  import { onMount } from 'svelte';
  import { loadVectorizer, getCapabilities } from '$lib/wasm/loader';
  import { vectorizerService } from '$lib/services/vectorizer-service';

  let testResults: any[] = [];
  let isLoading = false;
  let wasmModule: any = null;
  let capabilities: any = null;

  function addResult(test: string, status: 'success' | 'error', message: string, details?: any) {
    testResults = [...testResults, {
      test,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    }];
  }

  async function runTests() {
    isLoading = true;
    testResults = [];
    
    try {
      // Test 1: Basic WASM loading
      addResult('WASM Loading', 'success', 'Starting WASM loader test...');
      
      try {
        wasmModule = await loadVectorizer();
        addResult('WASM Loading', 'success', 'WASM module loaded successfully', {
          hasWasmVectorizer: !!wasmModule.WasmVectorizer,
          hasStartFunction: typeof wasmModule.start === 'function',
          hasThreadingSupport: typeof wasmModule.is_threading_supported === 'function'
        });
      } catch (error) {
        addResult('WASM Loading', 'error', 'Failed to load WASM module', error);
        return;
      }

      // Test 2: Capabilities check
      try {
        capabilities = await getCapabilities();
        addResult('Capabilities Check', 'success', 'Capabilities retrieved successfully', capabilities);
      } catch (error) {
        addResult('Capabilities Check', 'error', 'Failed to get capabilities', error);
      }

      // Test 3: Service initialization
      try {
        await vectorizerService.initialize();
        const isInitialized = vectorizerService.getInitializationStatus();
        addResult('Service Initialization', 'success', `Service initialized: ${isInitialized}`, {
          initialized: isInitialized
        });
      } catch (error) {
        addResult('Service Initialization', 'error', 'Service initialization failed', error);
      }

      // Test 4: Service capabilities
      try {
        const serviceCapabilities = await vectorizerService.checkCapabilities();
        addResult('Service Capabilities', 'success', 'Service capabilities checked', serviceCapabilities);
      } catch (error) {
        addResult('Service Capabilities', 'error', 'Service capabilities check failed', error);
      }

      // Test 5: Available backends
      try {
        const backends = await vectorizerService.getAvailableBackends();
        addResult('Available Backends', 'success', `Found ${backends.length} backends`, backends);
      } catch (error) {
        addResult('Available Backends', 'error', 'Failed to get backends', error);
      }

      // Test 6: Available presets
      try {
        const presets = await vectorizerService.getAvailablePresets();
        addResult('Available Presets', 'success', `Found ${presets.length} presets`, presets);
      } catch (error) {
        addResult('Available Presets', 'error', 'Failed to get presets', error);
      }

      // Test 7: Threading functions availability
      if (wasmModule) {
        const threadingFunctions = {
          is_threading_supported: typeof wasmModule.is_threading_supported === 'function',
          check_threading_requirements: typeof wasmModule.check_threading_requirements === 'function',
          start: typeof wasmModule.start === 'function',
          get_thread_count: typeof wasmModule.get_thread_count === 'function'
        };
        
        addResult('Threading Functions', 'success', 'Threading functions checked', threadingFunctions);
        
        // Test actual threading support if available
        if (wasmModule.is_threading_supported) {
          try {
            const isSupported = wasmModule.is_threading_supported();
            addResult('Threading Support Check', 'success', `Threading supported: ${isSupported}`);
          } catch (error) {
            addResult('Threading Support Check', 'error', 'Error checking threading support', error);
          }
        }
      }

    } catch (error) {
      addResult('General Error', 'error', 'Unexpected error during testing', error);
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    // Check cross-origin isolation on mount
    addResult('Environment Check', 'success', 'Environment information', {
      crossOriginIsolated: window.crossOriginIsolated,
      sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      hardwareConcurrency: navigator.hardwareConcurrency,
      userAgent: navigator.userAgent.substring(0, 100) + '...'
    });
  });
</script>

<div class="container mx-auto p-6 max-w-6xl">
  <h1 class="text-3xl font-bold mb-6">WASM Integration Test</h1>
  
  <div class="mb-6">
    <button 
      on:click={runTests} 
      disabled={isLoading}
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {isLoading ? 'Running Tests...' : 'Run Integration Tests'}
    </button>
  </div>

  {#if testResults.length > 0}
    <div class="space-y-4">
      <h2 class="text-2xl font-semibold">Test Results</h2>
      
      {#each testResults as result}
        <div class="border rounded-lg p-4 {result.status === 'success' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold {result.status === 'success' ? 'text-green-800' : 'text-red-800'}">
              {result.status === 'success' ? '✅' : '❌'} {result.test}
            </h3>
            <span class="text-sm text-gray-500">{new Date(result.timestamp).toLocaleTimeString()}</span>
          </div>
          
          <p class="text-gray-700 mb-2">{result.message}</p>
          
          {#if result.details}
            <details class="mt-2">
              <summary class="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
                Show Details
              </summary>
              <pre class="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
{JSON.stringify(result.details, null, 2)}
              </pre>
            </details>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  {#if capabilities}
    <div class="mt-8">
      <h2 class="text-2xl font-semibold mb-4">System Capabilities</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-4 border rounded-lg">
          <h3 class="font-semibold text-sm text-gray-600">Cross-Origin Isolated</h3>
          <p class="text-2xl font-bold {capabilities.crossOriginIsolated ? 'text-green-600' : 'text-red-600'}">
            {capabilities.crossOriginIsolated ? 'Yes' : 'No'}
          </p>
        </div>
        
        <div class="p-4 border rounded-lg">
          <h3 class="font-semibold text-sm text-gray-600">SharedArrayBuffer</h3>
          <p class="text-2xl font-bold {capabilities.sharedArrayBuffer ? 'text-green-600' : 'text-red-600'}">
            {capabilities.sharedArrayBuffer ? 'Available' : 'Not Available'}
          </p>
        </div>
        
        <div class="p-4 border rounded-lg">
          <h3 class="font-semibold text-sm text-gray-600">Threading</h3>
          <p class="text-2xl font-bold {capabilities.threading ? 'text-green-600' : 'text-red-600'}">
            {capabilities.threading ? 'Supported' : 'Not Supported'}
          </p>
        </div>
        
        <div class="p-4 border rounded-lg">
          <h3 class="font-semibold text-sm text-gray-600">Thread Count</h3>
          <p class="text-2xl font-bold text-blue-600">
            {capabilities.threadCount}
          </p>
        </div>
      </div>
    </div>
  {/if}

  {#if capabilities?.threadingRequirements}
    <div class="mt-8">
      <h2 class="text-2xl font-semibold mb-4">Threading Requirements</h2>
      <div class="p-4 border rounded-lg bg-gray-50">
        <pre class="text-sm overflow-auto">
{JSON.stringify(capabilities.threadingRequirements, null, 2)}
        </pre>
      </div>
    </div>
  {/if}

  <div class="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <h3 class="font-semibold text-blue-800 mb-2">Integration Status Summary</h3>
    <ul class="text-sm text-blue-700 space-y-1">
      <li>✅ Cross-origin isolation headers configured in vite.config.ts</li>
      <li>✅ New WASM loader created with proper wasm-bindgen initialization</li>
      <li>✅ Vectorizer service updated to use new loader pattern</li>
      <li>✅ WASM files synchronized between src/lib/wasm and static/wasm</li>
      <li>✅ Threading support with async start() function</li>
      <li>✅ Proper error handling and fallback to single-threaded mode</li>
    </ul>
  </div>
</div>

<style>
  .container {
    font-family: system-ui, -apple-system, sans-serif;
  }
</style>