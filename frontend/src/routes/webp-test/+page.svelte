<script lang="ts">
	// import { onMount } from "svelte";
	import WebPWebGPUDemo from '$lib/components/ui/WebPWebGPUDemo.svelte';
	import { Zap, ArrowLeft, Cpu, Activity } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<!--
  WebP Conversion Performance Test Page
  
  Demonstrates multiple optimization techniques for SVG to WebP conversion:
  1. OffscreenCanvas + Web Worker optimization
  2. WebGPU compute shader acceleration
  3. Side-by-side performance comparison
-->

<svelte:head>
	<title>WebP Conversion Performance Test | vec2art</title>
	<meta
		name="description"
		content="Test the performance of SVG to WebP conversion with OffscreenCanvas Web Workers"
	/>
</svelte:head>

<main class="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
	<!-- Header -->
	<div class="container mx-auto mb-8 px-4">
		<div class="mb-6 flex items-center gap-4">
			<Button variant="outline" href="/" class="flex items-center gap-2">
				<ArrowLeft class="h-4 w-4" />
				Back to Home
			</Button>
		</div>

		<div class="space-y-4 text-center">
			<h1
				class="flex items-center justify-center gap-3 text-4xl font-bold text-gray-900 dark:text-white"
			>
				<Zap class="h-8 w-8 text-yellow-500" />
				WebP Conversion Performance Test
			</h1>
			<p class="mx-auto max-w-3xl text-lg text-gray-600 dark:text-gray-400">
				Experience cutting-edge acceleration techniques for SVG to WebP conversion. Test WebGPU
				compute shaders (3-10x faster), OffscreenCanvas + Web Workers (60-70% improvement), and
				hybrid processing with automatic fallbacks for maximum compatibility.
			</p>
		</div>
	</div>

	<!-- Enhanced WebGPU Demo Component -->
	<div class="container mx-auto px-4">
		<WebPWebGPUDemo />
	</div>

	<!-- Technical Details -->
	<div class="container mx-auto mt-12 px-4">
		<div
			class="mx-auto max-w-4xl rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800"
		>
			<h2 class="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
				Technical Implementation Details
			</h2>

			<div class="grid gap-6 md:grid-cols-3">
				<div>
					<div class="mb-4 flex items-center gap-2">
						<Zap class="h-5 w-5 text-yellow-500" />
						<h3 class="text-lg font-medium text-gray-900 dark:text-white">WebGPU Acceleration</h3>
					</div>
					<ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
						<li>
							<strong>Compute Shaders:</strong> Parallel GPU processing with 64-thread workgroups
						</li>
						<li>
							<strong>Image Enhancement:</strong> GPU-accelerated brightness, contrast, gamma correction
						</li>
						<li><strong>Bilinear Filtering:</strong> High-quality GPU-based image scaling</li>
						<li><strong>Memory Optimization:</strong> Efficient buffer management and reuse</li>
						<li><strong>3-10x Performance:</strong> Dramatic speedup for large images</li>
					</ul>
				</div>

				<div>
					<div class="mb-4 flex items-center gap-2">
						<Cpu class="h-5 w-5 text-blue-500" />
						<h3 class="text-lg font-medium text-gray-900 dark:text-white">Multi-Threading</h3>
					</div>
					<ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
						<li><strong>OffscreenCanvas:</strong> Renders SVGs off the main thread</li>
						<li><strong>Web Workers:</strong> Parallel processing for CPU-intensive operations</li>
						<li>
							<strong>Hybrid Processing:</strong> SVG rasterization on main thread, encoding in worker
						</li>
						<li><strong>Progressive Rendering:</strong> Chunked processing for large files</li>
						<li><strong>60-70% Faster:</strong> Significant CPU optimization improvements</li>
					</ul>
				</div>

				<div>
					<div class="mb-4 flex items-center gap-2">
						<Activity class="h-5 w-5 text-green-500" />
						<h3 class="text-lg font-medium text-gray-900 dark:text-white">Smart Features</h3>
					</div>
					<ul class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
						<li>
							<strong>Automatic Fallback:</strong> Seamless CPU processing when GPU unavailable
						</li>
						<li>
							<strong>Real-time Progress:</strong> Live conversion updates and performance metrics
						</li>
						<li>
							<strong>Quality Control:</strong> Adaptive settings based on image size and complexity
						</li>
						<li><strong>Memory Management:</strong> Efficient resource pooling and cleanup</li>
						<li>
							<strong>Cross-Browser:</strong> Works on all modern browsers with graceful degradation
						</li>
					</ul>
				</div>
			</div>

			<div
				class="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20"
			>
				<h4 class="mb-3 text-lg font-medium text-blue-900 dark:text-blue-100">
					Browser Compatibility
				</h4>
				<div class="grid gap-4 text-sm md:grid-cols-4">
					<div>
						<strong class="text-green-700 dark:text-green-400">🚀 WebGPU (Latest):</strong>
						<ul class="mt-1 text-blue-800 dark:text-blue-200">
							<li>Chrome 113+</li>
							<li>Edge 113+</li>
							<li>Firefox 127+ (Windows)</li>
							<li>Safari 18+ (macOS)</li>
						</ul>
					</div>
					<div>
						<strong class="text-green-700 dark:text-green-400">✅ Web Workers:</strong>
						<ul class="mt-1 text-blue-800 dark:text-blue-200">
							<li>Chrome 69+</li>
							<li>Firefox 105+</li>
							<li>Edge 79+</li>
							<li>Safari 16.4+</li>
						</ul>
					</div>
					<div>
						<strong class="text-orange-700 dark:text-orange-400">⚠️ Limited Support:</strong>
						<ul class="mt-1 text-blue-800 dark:text-blue-200">
							<li>Mobile Safari (partial)</li>
							<li>Firefox Linux (no WebGPU)</li>
							<li>Older browsers</li>
						</ul>
					</div>
					<div>
						<strong class="text-blue-700 dark:text-blue-400">🔄 Smart Fallback:</strong>
						<ul class="mt-1 text-blue-800 dark:text-blue-200">
							<li>GPU → Worker → CPU</li>
							<li>Same API interface</li>
							<li>Performance monitoring</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</main>
