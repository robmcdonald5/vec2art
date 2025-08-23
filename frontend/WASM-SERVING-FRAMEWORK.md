# Pragmatic WASM Serving Framework for vec2art

## Problem Analysis

Currently, WASM initialization happens immediately on page load with these issues:
1. **Instant CPU saturation**: 12 threads spawn immediately, maxing out all CPU cores
2. **Poor UX**: Page appears frozen/unresponsive during initialization
3. **Unnecessary resource usage**: WASM loads even if user is just browsing
4. **No user control**: Users can't opt-out or control resource usage

## Framework Design Principles

### 1. Lazy Initialization
- **Don't initialize until needed**: WASM should only load when user actually wants to convert an image
- **Progressive enhancement**: Show UI immediately, load WASM on-demand
- **Graceful degradation**: Provide clear feedback if WASM fails to load

### 2. User-Controlled Resource Usage
- **Explicit consent**: Ask user before spawning threads
- **Configurable thread count**: Let users choose performance vs resource usage
- **Pause/resume capability**: Allow users to pause processing if needed

### 3. Progressive Loading Strategy
- **Three-stage initialization**:
  1. **Stage 1 - UI Ready**: Page loads with all UI elements (instant)
  2. **Stage 2 - WASM Loaded**: Load WASM module but don't initialize threads (on-demand)
  3. **Stage 3 - Threads Active**: Initialize thread pool when processing starts

## Implementation Architecture

### Component Structure

```typescript
// 1. WASM State Management
interface WasmState {
  stage: 'unloaded' | 'loading' | 'loaded' | 'initializing' | 'ready' | 'error';
  threadCount: number;
  maxThreads: number;
  isProcessing: boolean;
  cpuUsage?: number;
}

// 2. User Preferences
interface ProcessingPreferences {
  autoInitialize: boolean;        // Remember user's choice
  preferredThreadCount: number;   // User's preferred thread count
  lowPowerMode: boolean;         // Limit to 50% of cores
  backgroundProcessing: boolean;  // Allow processing when tab not visible
}
```

### Loading Strategies

#### Strategy 1: Click-to-Initialize (Recommended)
```svelte
<!-- Initial state: Show "Initialize Converter" button -->
{#if !wasmState.loaded}
  <div class="initialization-prompt">
    <h3>Ready to Convert Images?</h3>
    <p>Click below to initialize the converter with optimal performance settings</p>
    <Button onclick={initializeWasm}>
      Initialize Converter ({maxThreads} cores available)
    </Button>
    <label>
      <input type="checkbox" bind:checked={preferences.autoInitialize}>
      Always initialize automatically
    </label>
  </div>
{/if}
```

#### Strategy 2: Progressive Enhancement
```typescript
// Phase 1: Load WASM module without threads (lightweight)
async function preloadWasm() {
  const wasm = await import('./vectorize_wasm.js');
  await wasm.default(wasmUrl);
  // Don't initialize threads yet
  return wasm;
}

// Phase 2: Initialize threads only when needed
async function activateThreads(threadCount: number) {
  if (!wasm.initThreadPool) return;
  
  // Show user what's happening
  showNotification('Initializing high-performance mode...');
  
  const promise = wasm.initThreadPool(threadCount);
  await promise;
  wasm.confirm_threading_success();
}

// Phase 3: Process with active monitoring
async function processWithMonitoring(imageData: ImageData) {
  startCpuMonitor();
  try {
    const result = await vectorizer.process(imageData);
    return result;
  } finally {
    stopCpuMonitor();
  }
}
```

### Resource Management

#### Dynamic Thread Scaling
```typescript
class AdaptiveThreadManager {
  private optimalThreadCount(): number {
    const cores = navigator.hardwareConcurrency || 4;
    
    // Adaptive based on context
    if (document.hidden) return 1;                    // Background tab
    if (navigator.getBattery?.()?.charging === false) // On battery
      return Math.max(1, Math.floor(cores * 0.5));
    if (this.cpuPressure > 0.8) return 2;            // High CPU usage
    
    // Default: Leave 1-2 cores free for system
    return Math.max(1, cores - 2);
  }
  
  async adjustThreads() {
    const optimal = this.optimalThreadCount();
    if (optimal !== this.currentThreads) {
      await this.reinitializeThreadPool(optimal);
    }
  }
}
```

#### CPU Monitoring
```typescript
class CpuMonitor {
  private measurements: number[] = [];
  
  async measureCpuUsage(): Promise<number> {
    // Use Performance Observer API if available
    if ('PerformanceObserver' in window) {
      // Monitor long tasks
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Long task threshold
            this.measurements.push(entry.duration);
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    }
    
    // Estimate based on processing time vs wall time
    const processingRatio = this.processingTime / this.wallTime;
    return Math.min(1, processingRatio);
  }
}
```

### User Interface Components

#### 1. Initialization Dialog
```svelte
<script>
  let showAdvanced = false;
  let threadCount = $derived(Math.min(navigator.hardwareConcurrency - 1, 8));
</script>

<Modal bind:open={showInitDialog}>
  <h2>Initialize Image Converter</h2>
  
  <div class="quick-options">
    <button onclick={() => initWithThreads(1)}>
      🔋 Low Power (1 thread)
    </button>
    <button onclick={() => initWithThreads(threadCount)}>
      ⚡ Balanced ({threadCount} threads)
    </button>
    <button onclick={() => initWithThreads(maxThreads)}>
      🚀 Maximum ({maxThreads} threads)
    </button>
  </div>
  
  {#if showAdvanced}
    <div class="advanced-options">
      <label>
        Thread Count: {threadCount}
        <input type="range" min="1" max={maxThreads} bind:value={threadCount}>
      </label>
      <p class="hint">
        More threads = faster processing but higher CPU usage
      </p>
    </div>
  {/if}
  
  <button onclick={() => showAdvanced = !showAdvanced}>
    {showAdvanced ? 'Hide' : 'Show'} Advanced Options
  </button>
</Modal>
```

#### 2. Processing Status Bar
```svelte
<div class="processing-status">
  {#if isProcessing}
    <div class="status-bar">
      <span>Processing... ({activeThreads} threads active)</span>
      <button onclick={pauseProcessing}>Pause</button>
      <div class="cpu-meter" style="width: {cpuUsage * 100}%"></div>
    </div>
  {/if}
</div>
```

#### 3. Performance Settings Panel
```svelte
<div class="performance-settings">
  <h3>Performance Settings</h3>
  
  <label>
    <input type="radio" bind:group={perfMode} value="battery">
    🔋 Battery Saver (minimal CPU usage)
  </label>
  
  <label>
    <input type="radio" bind:group={perfMode} value="balanced">
    ⚖️ Balanced (moderate performance)
  </label>
  
  <label>
    <input type="radio" bind:group={perfMode} value="performance">
    🚀 High Performance (maximum speed)
  </label>
  
  <details>
    <summary>Advanced Settings</summary>
    <label>
      Max threads: {maxUserThreads}
      <input type="range" min="1" max={hardwareConcurrency} bind:value={maxUserThreads}>
    </label>
    <label>
      <input type="checkbox" bind:checked={backgroundProcessing}>
      Continue processing when tab is in background
    </label>
  </details>
</div>
```

### Error Handling & Recovery

```typescript
class WasmErrorHandler {
  async handleInitError(error: Error): Promise<void> {
    if (error.message.includes('SharedArrayBuffer')) {
      // Fallback to single-threaded mode
      this.showFallbackNotice(
        'Multi-threading unavailable. Using single-threaded mode.',
        'For better performance, ensure HTTPS and proper headers.'
      );
      await this.initSingleThreaded();
    } else if (error.message.includes('memory')) {
      // Suggest reducing thread count
      this.suggestLowerResources(
        'Low memory detected. Try reducing thread count or image size.'
      );
    } else {
      // Generic error with retry
      this.showRetryDialog(error);
    }
  }
}
```

## Recommended Implementation Path

### Phase 1: Immediate Fixes (Priority)
1. **Remove auto-initialization** from onMount in converter page
2. **Add initialization button** that explicitly starts WASM
3. **Show thread count selector** before initialization
4. **Add loading indicator** during WASM initialization

### Phase 2: Enhanced UX
1. **Implement progressive loading** (load WASM, then threads)
2. **Add performance presets** (Low/Medium/High)
3. **Store user preferences** in localStorage
4. **Add CPU usage indicator**

### Phase 3: Advanced Features
1. **Dynamic thread scaling** based on CPU pressure
2. **Background tab detection** with resource reduction
3. **Battery status integration** for laptops
4. **WebWorker offloading** for non-critical tasks

## Code Changes Required

### 1. Update converter page (`+page.svelte`)
```svelte
<script lang="ts">
  let wasmInitialized = $state(false);
  let initializationMode = $state<'prompt' | 'loading' | 'ready'>('prompt');
  
  async function handleInitialize(threadCount: number) {
    initializationMode = 'loading';
    try {
      await store.initialize({ threadCount });
      wasmInitialized = true;
      initializationMode = 'ready';
    } catch (error) {
      initializationMode = 'prompt';
      // Handle error
    }
  }
  
  // Don't auto-initialize in onMount!
</script>
```

### 2. Update loader.ts
```typescript
export async function loadVectorizer(options?: {
  threadCount?: number;
  autoStart?: boolean;
}) {
  // Load WASM module first
  const wasm = await loadWasmModule();
  
  // Only initialize threads if requested
  if (options?.autoStart) {
    await initializeThreads(options.threadCount);
  }
  
  return wasm;
}
```

### 3. Add performance monitoring
```typescript
export class PerformanceMonitor {
  private stats = {
    initTime: 0,
    processTime: 0,
    threadCount: 0,
    cpuUsage: 0
  };
  
  trackInitialization(start: number, end: number, threads: number) {
    this.stats.initTime = end - start;
    this.stats.threadCount = threads;
    this.reportMetrics();
  }
  
  private reportMetrics() {
    // Send to analytics or display to user
    console.log('Performance metrics:', this.stats);
  }
}
```

## Benefits of This Framework

1. **Better Initial Load**: Page loads instantly without CPU spike
2. **User Control**: Users decide when and how to use resources
3. **Adaptive Performance**: Adjusts to device capabilities and context
4. **Clear Feedback**: Users understand what's happening
5. **Graceful Degradation**: Falls back smoothly when features unavailable
6. **Battery Friendly**: Respects power constraints on mobile/laptop
7. **Professional UX**: No unexpected freezing or high CPU usage

## Next Steps

1. Implement Phase 1 fixes immediately to resolve CPU overload
2. Test with different device configurations
3. Gather user feedback on initialization preferences
4. Iterate on thread count recommendations based on real-world usage