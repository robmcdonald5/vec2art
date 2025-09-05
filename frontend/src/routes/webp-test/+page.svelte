<!--
  WebP Conversion Performance Test Page
  
  Demonstrates the OffscreenCanvas + Web Worker optimization
  for SVG to WebP conversion with side-by-side comparison.
-->

<svelte:head>
  <title>WebP Conversion Performance Test | vec2art</title>
  <meta name="description" content="Test the performance of SVG to WebP conversion with OffscreenCanvas Web Workers" />
</svelte:head>

<script lang="ts">
  import { onMount } from 'svelte';
  import WebPConversionDemo from '$lib/components/ui/WebPConversionDemo.svelte';
  import { Zap, ArrowLeft } from 'lucide-svelte';
  import { Button } from '$lib/components/ui/button';
</script>

<main class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
  <!-- Header -->
  <div class="container mx-auto px-4 mb-8">
    <div class="flex items-center gap-4 mb-6">
      <Button 
        variant="outline" 
        href="/"
        class="flex items-center gap-2"
      >
        <ArrowLeft class="h-4 w-4" />
        Back to Home
      </Button>
    </div>
    
    <div class="text-center space-y-4">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
        <Zap class="h-8 w-8 text-yellow-500" />
        WebP Conversion Performance Test
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
        Experience the power of OffscreenCanvas + Web Workers for SVG to WebP conversion.
        This optimization provides 60-70% performance improvements for large SVG files
        while keeping the UI responsive during processing.
      </p>
    </div>
  </div>

  <!-- Demo Component -->
  <div class="container mx-auto px-4">
    <WebPConversionDemo />
  </div>

  <!-- Technical Details -->
  <div class="container mx-auto px-4 mt-12">
    <div class="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Technical Implementation Details
      </h2>
      
      <div class="grid md:grid-cols-2 gap-8">
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            🚀 Performance Optimizations
          </h3>
          <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li><strong>OffscreenCanvas:</strong> Renders SVGs off the main thread</li>
            <li><strong>Web Workers:</strong> Parallel processing for CPU-intensive operations</li>
            <li><strong>ImageBitmap API:</strong> More efficient than HTMLImageElement</li>
            <li><strong>Progressive Rendering:</strong> Chunked processing for large files</li>
            <li><strong>Memory Pool:</strong> Reuse canvas resources</li>
          </ul>
        </div>
        
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            📊 Expected Results
          </h3>
          <ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li><strong>60-70% faster:</strong> Processing time improvements</li>
            <li><strong>Non-blocking UI:</strong> Interface remains responsive</li>
            <li><strong>Real-time progress:</strong> Live conversion updates</li>
            <li><strong>Better compression:</strong> Optimized WebP encoding</li>
            <li><strong>Graceful fallback:</strong> Main thread when workers unavailable</li>
          </ul>
        </div>
      </div>
      
      <div class="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 class="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
          Browser Compatibility
        </h4>
        <div class="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong class="text-green-700 dark:text-green-400">✅ Full Support:</strong>
            <ul class="mt-1 text-blue-800 dark:text-blue-200">
              <li>Chrome 69+</li>
              <li>Firefox 105+</li>
              <li>Edge 79+</li>
            </ul>
          </div>
          <div>
            <strong class="text-orange-700 dark:text-orange-400">⚠️ Limited Support:</strong>
            <ul class="mt-1 text-blue-800 dark:text-blue-200">
              <li>Safari 16.4+ (partial)</li>
              <li>Mobile Safari (fallback)</li>
            </ul>
          </div>
          <div>
            <strong class="text-blue-700 dark:text-blue-400">🔄 Automatic Fallback:</strong>
            <ul class="mt-1 text-blue-800 dark:text-blue-200">
              <li>Main thread processing</li>
              <li>Same API interface</li>
              <li>Graceful degradation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>