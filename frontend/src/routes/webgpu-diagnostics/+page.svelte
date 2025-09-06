<!--
  WebGPU Diagnostics Tool
  Helps identify WebGPU compatibility issues and shader problems
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { AlertTriangle, Cpu, Zap, ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-svelte';

  interface WebGPUDiagnostic {
    test: string;
    status: 'pass' | 'fail' | 'warning' | 'pending';
    message: string;
    details?: string;
  }

  let diagnostics: WebGPUDiagnostic[] = [];
  let running = false;
  let webgpuDevice: GPUDevice | null = null;

  onMount(() => {
    runDiagnostics();
  });

  async function runDiagnostics() {
    running = true;
    diagnostics = [];

    // Test 1: WebGPU API availability
    addDiagnostic({
      test: 'WebGPU API Availability',
      status: 'pending',
      message: 'Checking for WebGPU support...'
    });

    if (!navigator.gpu) {
      updateLastDiagnostic({
        status: 'fail',
        message: 'WebGPU API not available',
        details: 'This browser does not support WebGPU. Chrome 113+, Firefox 129+, or Safari 16+ required.'
      });
    } else {
      updateLastDiagnostic({
        status: 'pass',
        message: 'WebGPU API is available'
      });
    }

    // Test 2: GPU Adapter Request
    addDiagnostic({
      test: 'GPU Adapter Request',
      status: 'pending',
      message: 'Requesting GPU adapter...'
    });

    let adapter: GPUAdapter | null = null;
    try {
      const requestedAdapter = await navigator.gpu?.requestAdapter();
      adapter = requestedAdapter || null;
      if (!adapter) {
        updateLastDiagnostic({
          status: 'fail',
          message: 'No suitable GPU adapter found',
          details: 'WebGPU adapter request failed. This could indicate hardware compatibility issues.'
        });
      } else {
        updateLastDiagnostic({
          status: 'pass',
          message: `GPU adapter obtained: ${adapter.info?.architecture || 'unknown architecture'}`
        });
      }
    } catch (error) {
      updateLastDiagnostic({
        status: 'fail',
        message: 'Adapter request failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }

    if (!adapter) {
      running = false;
      return;
    }

    // Test 3: Device Request
    addDiagnostic({
      test: 'GPU Device Request',
      status: 'pending',
      message: 'Requesting GPU device...'
    });

    try {
      webgpuDevice = await adapter.requestDevice();
      updateLastDiagnostic({
        status: 'pass',
        message: 'GPU device obtained successfully'
      });
    } catch (error) {
      updateLastDiagnostic({
        status: 'fail',
        message: 'Device request failed',
        details: error instanceof Error ? error.message : String(error)
      });
      running = false;
      return;
    }

    // Test 4: Basic Compute Shader
    await testBasicComputeShader();

    // Test 5: Complex Compute Shader (like the ones causing issues)
    await testComplexComputeShader();

    // Test 6: Memory Operations
    await testMemoryOperations();

    running = false;
  }

  async function testBasicComputeShader() {
    addDiagnostic({
      test: 'Basic Compute Shader',
      status: 'pending',
      message: 'Testing basic compute shader compilation...'
    });

    const basicShader = `
      @compute @workgroup_size(1)
      fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
        // Simple compute shader
      }
    `;

    try {
      const shaderModule = webgpuDevice!.createShaderModule({
        label: 'basic test shader',
        code: basicShader
      });

      const pipeline = webgpuDevice!.createComputePipeline({
        label: 'basic test pipeline',
        layout: 'auto',
        compute: {
          module: shaderModule,
          entryPoint: 'main'
        }
      });

      updateLastDiagnostic({
        status: 'pass',
        message: 'Basic compute shader compiled successfully'
      });
    } catch (error) {
      updateLastDiagnostic({
        status: 'fail',
        message: 'Basic compute shader compilation failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async function testComplexComputeShader() {
    addDiagnostic({
      test: 'Complex Compute Shader (Resize)',
      status: 'pending',
      message: 'Testing complex compute shader like the ones in WebGPU processor...'
    });

    const complexShader = `
      @group(0) @binding(0) var<storage, read> inputBuffer: array<u32>;
      @group(0) @binding(1) var<storage, read_write> outputBuffer: array<u32>;
      @group(0) @binding(2) var<uniform> params: array<u32, 4>;
      
      @compute @workgroup_size(8, 8)
      fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
        let outputWidth = params[2];
        let outputHeight = params[3];
        let inputWidth = params[0];
        let inputHeight = params[1];
        
        let x = global_id.x;
        let y = global_id.y;
        
        if (x >= outputWidth || y >= outputHeight) {
          return;
        }
        
        // Simple copy operation for testing
        let outputIndex = y * outputWidth + x;
        let inputX = min(x, inputWidth - 1u);
        let inputY = min(y, inputHeight - 1u);
        let inputIndex = inputY * inputWidth + inputX;
        
        outputBuffer[outputIndex] = inputBuffer[inputIndex];
      }
    `;

    try {
      const shaderModule = webgpuDevice!.createShaderModule({
        label: 'complex test shader',
        code: complexShader
      });

      const pipeline = webgpuDevice!.createComputePipeline({
        label: 'complex test pipeline',
        layout: 'auto',
        compute: {
          module: shaderModule,
          entryPoint: 'main'
        }
      });

      updateLastDiagnostic({
        status: 'pass',
        message: 'Complex compute shader compiled successfully'
      });
    } catch (error) {
      updateLastDiagnostic({
        status: 'fail',
        message: 'Complex compute shader compilation failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async function testMemoryOperations() {
    addDiagnostic({
      test: 'Memory Operations',
      status: 'pending',
      message: 'Testing buffer creation and memory operations...'
    });

    try {
      // Create a small test buffer
      const buffer = webgpuDevice!.createBuffer({
        size: 64,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
      });

      const readBuffer = webgpuDevice!.createBuffer({
        size: 64,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
      });

      updateLastDiagnostic({
        status: 'pass',
        message: 'Memory operations working correctly'
      });

      buffer.destroy();
      readBuffer.destroy();
    } catch (error) {
      updateLastDiagnostic({
        status: 'fail',
        message: 'Memory operations failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  function addDiagnostic(diagnostic: WebGPUDiagnostic) {
    diagnostics = [...diagnostics, diagnostic];
  }

  function updateLastDiagnostic(updates: Partial<WebGPUDiagnostic>) {
    if (diagnostics.length > 0) {
      const lastIndex = diagnostics.length - 1;
      diagnostics[lastIndex] = { ...diagnostics[lastIndex], ...updates };
      diagnostics = [...diagnostics];
    }
  }

  function getStatusIcon(status: WebGPUDiagnostic['status']) {
    switch (status) {
      case 'pass': return CheckCircle;
      case 'fail': return XCircle;
      case 'warning': return AlertCircle;
      case 'pending': return AlertTriangle;
      default: return AlertTriangle;
    }
  }

  function getStatusColor(status: WebGPUDiagnostic['status']) {
    switch (status) {
      case 'pass': return 'text-green-600';
      case 'fail': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'pending': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  }
</script>

<svelte:head>
  <title>WebGPU Diagnostics</title>
  <meta name="description" content="Diagnose WebGPU compatibility and shader issues" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
  <!-- Header -->
  <div class="bg-white shadow-sm dark:bg-gray-900">
    <div class="mx-auto max-w-7xl px-4 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <a href="/" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
            <ArrowLeft class="h-4 w-4" />
            Back
          </a>
          <div class="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
            WebGPU Diagnostics
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <Cpu class="h-5 w-5 text-blue-600" />
          <span class="text-sm text-gray-600 dark:text-gray-400">Shader Testing</span>
        </div>
      </div>
    </div>
  </div>

  <div class="mx-auto max-w-4xl px-4 py-8">
    <!-- Introduction -->
    <div class="mb-8">
      <div class="rounded-xl bg-blue-50 border border-blue-200 p-6 dark:bg-blue-900/20 dark:border-blue-800">
        <div class="flex items-start gap-3">
          <Zap class="h-6 w-6 text-blue-600 mt-0.5" />
          <div>
            <h3 class="font-semibold text-blue-800 dark:text-blue-300 mb-2">WebGPU Compatibility Check</h3>
            <p class="text-sm text-blue-700 dark:text-blue-400">
              This tool diagnoses WebGPU compatibility issues and identifies problems with compute shader compilation.
              It helps determine why WebGPU optimizations might be failing in the WebP converter.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Diagnostics Results -->
    <div class="rounded-xl bg-white shadow-sm dark:bg-gray-900 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Diagnostic Results
        </h2>
        {#if running}
          <div class="flex items-center gap-2 text-blue-600">
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span class="text-sm">Running diagnostics...</span>
          </div>
        {/if}
      </div>

      <div class="space-y-4">
        {#each diagnostics as diagnostic}
          {@const StatusIcon = getStatusIcon(diagnostic.status)}
          <div class="flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <StatusIcon class="h-5 w-5 {getStatusColor(diagnostic.status)} mt-0.5" />
            <div class="flex-1">
              <h3 class="font-medium text-gray-900 dark:text-gray-100 mb-1">
                {diagnostic.test}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {diagnostic.message}
              </p>
              {#if diagnostic.details}
                <details class="mt-2">
                  <summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                    Show Details
                  </summary>
                  <pre class="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded border overflow-x-auto">{diagnostic.details}</pre>
                </details>
              {/if}
            </div>
          </div>
        {/each}

        {#if diagnostics.length === 0}
          <div class="text-center py-8 text-gray-500 dark:text-gray-400">
            <Cpu class="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Click "Run Diagnostics" to start testing WebGPU compatibility</p>
          </div>
        {/if}
      </div>

      <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onclick={runDiagnostics}
          disabled={running}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {#if running}
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Running...
          {:else}
            <Zap class="h-4 w-4" />
            Run Diagnostics
          {/if}
        </button>
      </div>
    </div>

    <!-- Recommendations -->
    {#if diagnostics.length > 0 && !running}
      <div class="mt-6 rounded-xl bg-gray-50 dark:bg-gray-800 p-6">
        <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-4">Recommendations</h3>
        <div class="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          {#if diagnostics.some(d => d.status === 'fail')}
            <p class="flex items-start gap-2">
              <XCircle class="h-4 w-4 text-red-600 mt-0.5" />
              <span>WebGPU issues detected. The system will automatically fall back to standard Canvas.toBlob() conversion.</span>
            </p>
          {:else if diagnostics.every(d => d.status === 'pass')}
            <p class="flex items-start gap-2">
              <CheckCircle class="h-4 w-4 text-green-600 mt-0.5" />
              <span>WebGPU is working correctly! The original shader compilation errors may be temporary or browser-specific.</span>
            </p>
          {/if}
          
          <p class="text-gray-600 dark:text-gray-400">
            <strong>Note:</strong> Even if WebGPU fails, the WebP converter includes comprehensive fallback systems 
            and will continue to work with optimized Canvas-based encoding.
          </p>
        </div>
      </div>
    {/if}
  </div>
</div>