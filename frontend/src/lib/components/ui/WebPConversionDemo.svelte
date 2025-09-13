<!--
  WebP Conversion Performance Demo Component
  
  Demonstrates the OffscreenCanvas + Web Worker optimization
  for SVG to WebP conversion with real-time progress feedback.
-->

<script lang="ts">
	import { SvgToWebPConverter } from '$lib/services/svg-to-webp-converter';
	import { generateLargeSvg } from '$lib/services/svg-webp-converter-test';
	import { Button } from '$lib/components/ui/button';
	import ProgressBar from '$lib/components/ui/progress-bar/progress-bar.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Download, Zap, Cpu, Clock, FileImage } from 'lucide-svelte';

	interface ConversionResult {
		method: 'worker' | 'main-thread';
		success: boolean;
		timeMs: number;
		compressionRatio: number;
		webpDataUrl?: string;
		error?: string;
	}

	// Component state
	let converter: SvgToWebPConverter | null = null;
	let isConverting = $state(false);
	let currentStage = $state('');
	let progress = $state(0);
	let svgContent = $state('');
	let results = $state<ConversionResult[]>([]);
	let elementCount = $state(10000);
	let workerSupported = $state(false);

	// Initialize converter on mount
	$effect(() => {
		if (typeof window !== 'undefined') {
			converter = new SvgToWebPConverter();
			workerSupported = SvgToWebPConverter.isWorkerSupported();
		}

		return () => {
			converter?.dispose();
		};
	});

	function generateTestSvg() {
		currentStage = 'Generating test SVG...';
		progress = 0;
		svgContent = generateLargeSvg(elementCount);
		currentStage = `Generated SVG with ${elementCount.toLocaleString()} elements (${Math.round(svgContent.length / 1024)}KB)`;
		progress = 100;
	}

	async function runPerformanceTest() {
		if (!converter || !svgContent) return;

		isConverting = true;
		results = [];

		try {
			// Test with Web Worker (if supported)
			if (workerSupported) {
				await testConversionMethod('worker');
			}

			// Test with main thread
			await testConversionMethod('main-thread');
		} catch (error) {
			console.error('Performance test failed:', error);
		} finally {
			isConverting = false;
			progress = 0;
			currentStage = '';
		}
	}

	async function testConversionMethod(method: 'worker' | 'main-thread') {
		if (!converter || !svgContent) return;

		const useWorker = method === 'worker';
		currentStage = `Testing ${method === 'worker' ? 'OffscreenCanvas Worker' : 'Main Thread'}`;
		progress = 0;

		try {
			const startTime = performance.now();

			const result = await converter.convertSvgToWebP(svgContent, {
				useWorker,
				quality: 0.8,
				maxWidth: 1024,
				maxHeight: 1024,
				onProgress: (stage, percent) => {
					currentStage = `${method === 'worker' ? '⚡ Worker' : '🖥️ Main'}: ${stage}`;
					progress = percent;
				}
			});

			const timeMs = performance.now() - startTime;

			results = [
				...results,
				{
					method,
					success: true,
					timeMs,
					compressionRatio: result.compressionRatio,
					webpDataUrl: result.webpDataUrl
				}
			];
		} catch (error) {
			results = [
				...results,
				{
					method,
					success: false,
					timeMs: 0,
					compressionRatio: 0,
					error: String(error)
				}
			];
		}
	}

	function downloadWebP(result: ConversionResult) {
		if (!result.webpDataUrl) return;

		const link = document.createElement('a');
		link.href = result.webpDataUrl;
		link.download = `test-${result.method}-${Date.now()}.webp`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function getImprovementPercent(): number {
		const workerResult = results.find((r) => r.method === 'worker' && r.success);
		const mainThreadResult = results.find((r) => r.method === 'main-thread' && r.success);

		if (!workerResult || !mainThreadResult) return 0;

		return ((mainThreadResult.timeMs - workerResult.timeMs) / mainThreadResult.timeMs) * 100;
	}
</script>

<div class="mx-auto w-full max-w-4xl space-y-6 p-6">
	<!-- Header -->
	<div class="space-y-2 text-center">
		<h2
			class="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900 dark:text-white"
		>
			<Zap class="h-6 w-6 text-yellow-500" />
			SVG to WebP Performance Demo
		</h2>
		<p class="text-gray-600 dark:text-gray-400">
			Test the OffscreenCanvas + Web Worker optimization with real-time progress feedback
		</p>
	</div>

	<!-- Browser Support Status -->
	<div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Cpu class="h-5 w-5 text-blue-500" />
				<span class="font-medium">Browser Support</span>
			</div>
			<Badge variant={workerSupported ? 'default' : 'secondary'}>
				{workerSupported ? '✅ OffscreenCanvas + Workers Supported' : '⚠️ Fallback Mode Only'}
			</Badge>
		</div>
		{#if workerSupported}
			<p class="mt-2 text-sm text-green-600 dark:text-green-400">
				Your browser supports OffscreenCanvas Web Workers for optimal performance!
			</p>
		{:else}
			<p class="mt-2 text-sm text-orange-600 dark:text-orange-400">
				Your browser will use main thread processing (may cause UI blocking).
			</p>
		{/if}
	</div>

	<!-- Test Configuration -->
	<div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
		<div class="space-y-4">
			<div>
				<label
					for="element-count"
					class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					SVG Complexity (number of elements)
				</label>
				<input
					id="element-count"
					type="range"
					min="1000"
					max="50000"
					step="1000"
					bind:value={elementCount}
					disabled={isConverting}
					class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
				/>
				<div class="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
					<span>1K elements</span>
					<span class="font-medium">{elementCount.toLocaleString()} elements</span>
					<span>50K elements</span>
				</div>
			</div>

			<div class="flex gap-2">
				<Button onclick={generateTestSvg} disabled={isConverting} variant="outline">
					<FileImage class="mr-2 h-4 w-4" />
					Generate Test SVG
				</Button>

				<Button
					onclick={runPerformanceTest}
					disabled={!svgContent || isConverting}
					class="bg-blue-600 hover:bg-blue-700"
				>
					<Zap class="mr-2 h-4 w-4" />
					{isConverting ? 'Testing...' : 'Run Performance Test'}
				</Button>
			</div>
		</div>
	</div>

	<!-- Progress Display -->
	{#if isConverting && (progress > 0 || currentStage)}
		<div
			class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="space-y-3">
				<div class="flex items-center gap-2">
					<Clock class="h-4 w-4 animate-spin text-blue-500" />
					<span class="text-sm font-medium">{currentStage}</span>
				</div>
				<ProgressBar value={progress} class="w-full" />
				<div class="text-right text-xs text-gray-500 dark:text-gray-400">
					{progress}%
				</div>
			</div>
		</div>
	{/if}

	<!-- Results -->
	{#if results.length > 0}
		<div
			class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
		>
			<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
				Performance Test Results
			</h3>

			<!-- Performance Improvement Summary -->
			{#if getImprovementPercent() > 0}
				<div
					class="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
				>
					<div class="flex items-center gap-2 text-green-800 dark:text-green-200">
						<Zap class="h-5 w-5" />
						<span class="font-semibold"
							>Performance Improvement: {getImprovementPercent().toFixed(1)}%</span
						>
					</div>
					<p class="mt-1 text-sm text-green-700 dark:text-green-300">
						OffscreenCanvas Web Workers provide significant performance benefits for large SVGs!
					</p>
				</div>
			{/if}

			<!-- Results Table -->
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-200 dark:border-gray-700">
							<th class="py-3 text-left font-medium text-gray-700 dark:text-gray-300">Method</th>
							<th class="py-3 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
							<th class="py-3 text-left font-medium text-gray-700 dark:text-gray-300">Time</th>
							<th class="py-3 text-left font-medium text-gray-700 dark:text-gray-300"
								>Compression</th
							>
							<th class="py-3 text-left font-medium text-gray-700 dark:text-gray-300">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each results as result, index (index)}
							<tr class="border-b border-gray-100 dark:border-gray-800">
								<td class="py-3">
									<div class="flex items-center gap-2">
										{#if result.method === 'worker'}
											<Zap class="h-4 w-4 text-yellow-500" />
											<span class="font-medium">OffscreenCanvas Worker</span>
										{:else}
											<Cpu class="h-4 w-4 text-gray-500" />
											<span>Main Thread</span>
										{/if}
									</div>
								</td>
								<td class="py-3">
									<Badge variant={result.success ? 'default' : 'destructive'}>
										{result.success ? '✅ Success' : '❌ Failed'}
									</Badge>
								</td>
								<td class="py-3">
									{#if result.success}
										<span class="font-mono">{Math.round(result.timeMs)}ms</span>
									{:else}
										<span class="text-gray-400">-</span>
									{/if}
								</td>
								<td class="py-3">
									{#if result.success}
										<span>{result.compressionRatio.toFixed(2)}x</span>
									{:else}
										<span class="text-gray-400">-</span>
									{/if}
								</td>
								<td class="py-3">
									{#if result.success && result.webpDataUrl}
										<Button size="sm" variant="outline" onclick={() => downloadWebP(result)}>
											<Download class="mr-1 h-3 w-3" />
											Download
										</Button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- Information -->
	<div
		class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
	>
		<h4 class="mb-2 font-medium text-blue-900 dark:text-blue-100">How the Optimization Works</h4>
		<ul class="space-y-1 text-sm text-blue-800 dark:text-blue-200">
			<li>
				• <strong>OffscreenCanvas:</strong> Renders SVG off the main thread to prevent UI blocking
			</li>
			<li>• <strong>Web Workers:</strong> Parallel processing for CPU-intensive operations</li>
			<li>
				• <strong>ImageBitmap API:</strong> More efficient image handling than HTMLImageElement
			</li>
			<li>• <strong>Progressive Rendering:</strong> Chunked processing for very large SVGs</li>
			<li>
				• <strong>Automatic Fallback:</strong> Uses main thread processing when workers unavailable
			</li>
		</ul>
	</div>
</div>
