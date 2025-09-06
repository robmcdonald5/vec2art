<!--
  Integrated WebP Converter Test
  Tests the main SvgToWebPConverter with Ultimate WebP optimizations
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import {
		SvgToWebPConverter,
		type WebPConversionOptions,
		type WebPResult
	} from '$lib/services/svg-to-webp-converter';
	import { Activity, Zap, Settings, Download, Upload, ArrowLeft, Info } from 'lucide-svelte';

	let converter: SvgToWebPConverter;
	let converting = false;
	let result: WebPResult | null = null;
	let error: string | null = null;
	let progress = { stage: '', percent: 0 };
	let systemInfo: any = null;

	// Test options that showcase the integration
	let quality = 0.8;
	let enableUltimateOptimizations = true;
	let preferWebGPU = true;
	let enableWasm = true;
	let wasmLossless = false;
	let enableEnhancement = false;
	let enableProgressiveStreaming = true;
	let optimizationMode = 'auto';

	// Sample SVG for testing
	const testSvg = `
    <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(138,43,226);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(30,144,255);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      <circle cx="300" cy="200" r="80" fill="rgba(255,255,255,0.9)" stroke="white" stroke-width="4" />
      <text x="300" y="210" text-anchor="middle" font-family="Arial" font-size="24" fill="purple">
        Integrated Test
      </text>
      <g transform="translate(100,100)">
        <polygon points="100,10 40,180 190,60 10,60 160,180" fill="rgba(255,215,0,0.8)" stroke="orange" stroke-width="3" />
      </g>
    </svg>
  `;

	onMount(async () => {
		try {
			converter = new SvgToWebPConverter();

			// Wait for initialization
			setTimeout(() => {
				try {
					systemInfo = converter.getSystemInfo();
				} catch (err) {
					console.warn('System info not available yet:', err);
				}
			}, 1000);
		} catch (err) {
			error = `Failed to initialize converter: ${err}`;
			console.error('Converter initialization error:', err);
		}
	});

	async function runConversion() {
		if (!converter) return;

		converting = true;
		result = null;
		error = null;
		progress = { stage: '', percent: 0 };

		try {
			const options: WebPConversionOptions = {
				quality,
				maxWidth: 800,
				maxHeight: 600,
				enableUltimateOptimizations,
				preferWebGPU,
				enableWasm,
				wasmLossless,
				enableEnhancement,
				enableProgressiveStreaming,
				optimizationMode: optimizationMode as any,
				onProgress: (stage, percent) => {
					progress = { stage, percent };
				},
				onOptimizationSelected: (method, reason) => {
					console.log(`✅ Selected: ${method} - ${reason}`);
				},
				onPerformanceWarning: (warning, impact) => {
					console.warn(`⚠️ Warning: ${warning} - ${impact}`);
				}
			};

			console.log('🚀 Starting integrated WebP conversion...');
			result = await converter.convertSvgToWebP(testSvg, options);
			console.log('✅ Conversion result:', result);
		} catch (err) {
			error = `Conversion failed: ${err}`;
			console.error('Conversion error:', err);
		} finally {
			converting = false;
		}
	}

	function downloadResult() {
		if (!result) return;

		const link = document.createElement('a');
		link.href = result.webpDataUrl;
		link.download = `integrated-webp-${result.conversionMethod || 'test'}.webp`;
		link.click();
	}

	function formatTime(ms: number): string {
		if (ms < 1000) return `${Math.round(ms)}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes}B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
	}
</script>

<svelte:head>
	<title>Integrated WebP Converter Test</title>
	<meta name="description" content="Test main SvgToWebPConverter with Ultimate optimizations" />
</svelte:head>

<div
	class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 dark:from-gray-900 dark:to-gray-800"
>
	<!-- Header -->
	<div class="bg-white shadow-sm dark:bg-gray-900">
		<div class="mx-auto max-w-7xl px-4 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<a
						href="/"
						class="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
					>
						<ArrowLeft class="h-4 w-4" />
						Back
					</a>
					<div class="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
					<h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">Integrated WebP Test</h1>
				</div>
				<div class="flex items-center gap-2">
					<Activity class="h-5 w-5 text-purple-600" />
					<span class="text-sm text-gray-600 dark:text-gray-400">Main + Ultimate</span>
				</div>
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-7xl px-4 py-8">
		<div class="mb-6">
			<div
				class="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
			>
				<div class="flex items-start gap-3">
					<Info class="mt-0.5 h-5 w-5 text-blue-600" />
					<div>
						<h3 class="mb-1 font-medium text-blue-800 dark:text-blue-300">Integration Test</h3>
						<p class="text-sm text-blue-700 dark:text-blue-400">
							This tests the main <code class="rounded bg-blue-100 px-1 font-mono dark:bg-blue-800"
								>SvgToWebPConverter</code
							>
							with Ultimate WebP optimizations integrated. All existing components now automatically
							benefit from WebGPU acceleration, WASM encoding, and progressive streaming.
						</p>
					</div>
				</div>
			</div>
		</div>

		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Controls -->
			<div class="space-y-6">
				<!-- System Info -->
				{#if systemInfo}
					<div class="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900">
						<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
							<Activity class="h-5 w-5 text-green-600" />
							Integrated System Status
						</h2>
						<div class="space-y-2 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-600 dark:text-gray-400">Ultimate Optimizations:</span>
								<span
									class="font-mono {systemInfo.capabilities.ultimateOptimizationsAvailable
										? 'text-green-600'
										: 'text-red-600'}"
								>
									{systemInfo.capabilities.ultimateOptimizationsAvailable
										? 'AVAILABLE'
										: 'NOT AVAILABLE'}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600 dark:text-gray-400">WebGPU:</span>
								<span
									class="font-mono {systemInfo.capabilities.webgpuAvailable
										? 'text-green-600'
										: 'text-red-600'}"
								>
									{systemInfo.capabilities.webgpuAvailable ? 'YES' : 'NO'}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600 dark:text-gray-400">WASM:</span>
								<span
									class="font-mono {systemInfo.capabilities.wasmAvailable
										? 'text-green-600'
										: 'text-red-600'}"
								>
									{systemInfo.capabilities.wasmAvailable ? 'YES' : 'NO'}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600 dark:text-gray-400">Progressive:</span>
								<span
									class="font-mono {systemInfo.capabilities.progressiveSupported
										? 'text-green-600'
										: 'text-red-600'}"
								>
									{systemInfo.capabilities.progressiveSupported ? 'YES' : 'NO'}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600 dark:text-gray-400">Performance:</span>
								<span class="font-mono text-blue-600"
									>{systemInfo.capabilities.estimatedPerformance?.toUpperCase() || 'UNKNOWN'}</span
								>
							</div>
						</div>

						{#if systemInfo.recommendations?.length > 0}
							<div class="mt-4 space-y-1">
								<h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
									Recommendations:
								</h3>
								{#each systemInfo.recommendations as rec, index (index)}
									<p class="text-xs text-gray-600 dark:text-gray-400">• {rec}</p>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				<!-- Test Options -->
				<div class="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900">
					<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold">
						<Settings class="h-5 w-5 text-blue-600" />
						Integration Options
					</h2>

					<div class="space-y-4">
						<!-- Quality -->
						<div>
							<label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
								Quality: {quality.toFixed(2)}
							</label>
							<input
								type="range"
								bind:value={quality}
								min="0.1"
								max="1.0"
								step="0.1"
								class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
							/>
						</div>

						<!-- Optimization Mode -->
						<div>
							<label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
								Optimization Mode
							</label>
							<select
								bind:value={optimizationMode}
								class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
							>
								<option value="auto">Auto (Smart Selection)</option>
								<option value="performance">Performance (Speed Focus)</option>
								<option value="quality">Quality (Best Result)</option>
								<option value="compatibility">Compatibility (Safe Mode)</option>
							</select>
						</div>

						<!-- Advanced Options -->
						<div class="space-y-3">
							<label class="flex items-center gap-2">
								<input
									type="checkbox"
									bind:checked={enableUltimateOptimizations}
									class="rounded border-gray-300"
								/>
								<span class="text-sm text-gray-700 dark:text-gray-300"
									>Enable Ultimate Optimizations</span
								>
							</label>

							{#if enableUltimateOptimizations}
								<div class="ml-6 space-y-2">
									<label class="flex items-center gap-2">
										<input
											type="checkbox"
											bind:checked={preferWebGPU}
											class="rounded border-gray-300"
										/>
										<span class="text-sm text-gray-600 dark:text-gray-400">Prefer WebGPU</span>
									</label>

									<label class="flex items-center gap-2">
										<input
											type="checkbox"
											bind:checked={enableWasm}
											class="rounded border-gray-300"
										/>
										<span class="text-sm text-gray-600 dark:text-gray-400"
											>Enable WASM Encoding</span
										>
									</label>

									{#if enableWasm}
										<label class="ml-6 flex items-center gap-2">
											<input
												type="checkbox"
												bind:checked={wasmLossless}
												class="rounded border-gray-300"
											/>
											<span class="text-sm text-gray-500 dark:text-gray-500">Lossless Quality</span>
										</label>
									{/if}

									<label class="flex items-center gap-2">
										<input
											type="checkbox"
											bind:checked={enableEnhancement}
											class="rounded border-gray-300"
										/>
										<span class="text-sm text-gray-600 dark:text-gray-400">GPU Enhancement</span>
									</label>

									<label class="flex items-center gap-2">
										<input
											type="checkbox"
											bind:checked={enableProgressiveStreaming}
											class="rounded border-gray-300"
										/>
										<span class="text-sm text-gray-600 dark:text-gray-400"
											>Progressive Streaming</span
										>
									</label>
								</div>
							{/if}
						</div>

						<!-- Test Button -->
						<button
							onclick={runConversion}
							disabled={converting || !converter}
							class="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if converting}
								<div
									class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
								></div>
								Converting...
							{:else}
								<Upload class="h-4 w-4" />
								Test Integrated Converter
							{/if}
						</button>
					</div>
				</div>

				<!-- Progress -->
				{#if converting}
					<div class="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900">
						<h3 class="mb-3 font-medium text-gray-900 dark:text-gray-100">Conversion Progress</h3>
						<div class="space-y-2">
							<div class="flex justify-between text-sm">
								<span class="text-gray-600 dark:text-gray-400">{progress.stage}</span>
								<span class="font-medium">{Math.round(progress.percent)}%</span>
							</div>
							<div class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
								<div
									class="h-2 rounded-full bg-purple-600 transition-all duration-300"
									style="width: {progress.percent}%"
								></div>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Results -->
			<div class="space-y-6">
				{#if error}
					<div
						class="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20"
					>
						<h3 class="mb-2 font-medium text-red-800 dark:text-red-300">Error</h3>
						<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
					</div>
				{/if}

				{#if result}
					<div class="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="font-semibold text-gray-900 dark:text-gray-100">Integration Result</h3>
							<button
								onclick={downloadResult}
								class="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-green-700"
							>
								<Download class="h-4 w-4" />
								Download
							</button>
						</div>

						<!-- Result Image -->
						<div class="mb-4">
							<img
								src={result.webpDataUrl}
								alt="Converted WebP"
								class="mx-auto w-full max-w-sm rounded-lg border border-gray-200 dark:border-gray-700"
							/>
						</div>

						<!-- Metrics -->
						<div class="space-y-3 text-sm">
							{#if result.conversionMethod}
								<div class="flex justify-between">
									<span class="text-gray-600 dark:text-gray-400">Conversion Method:</span>
									<span class="font-mono text-purple-600">{result.conversionMethod}</span>
								</div>
							{/if}
							<div class="flex justify-between">
								<span class="text-gray-600 dark:text-gray-400">Total Time:</span>
								<span class="font-mono text-green-600">{formatTime(result.conversionTimeMs)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600 dark:text-gray-400">Compression Ratio:</span>
								<span class="font-mono text-green-600">{result.compressionRatio}x</span>
							</div>
							{#if result.actualQuality}
								<div class="flex justify-between">
									<span class="text-gray-600 dark:text-gray-400">Actual Quality:</span>
									<span class="font-mono">{(result.actualQuality * 100).toFixed(0)}%</span>
								</div>
							{/if}
						</div>

						<!-- Applied Optimizations -->
						{#if result.optimizations && result.optimizations.length > 0}
							<div class="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
								<h4 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
									Applied Optimizations
								</h4>
								<div class="flex flex-wrap gap-1">
									{#each result.optimizations as opt, index (index)}
										<span
											class="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800 dark:bg-purple-900 dark:text-purple-300"
										>
											{opt}
										</span>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Performance Details -->
						{#if result.performance}
							<div class="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
								<h4 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
									Performance Details
								</h4>
								<div class="space-y-1 text-xs">
									{#if result.performance.analysisTime}
										<div class="flex justify-between">
											<span class="text-gray-500">Analysis:</span>
											<span>{formatTime(result.performance.analysisTime)}</span>
										</div>
									{/if}
									{#if result.performance.processingTime}
										<div class="flex justify-between">
											<span class="text-gray-500">Processing:</span>
											<span>{formatTime(result.performance.processingTime)}</span>
										</div>
									{/if}
									{#if result.performance.streamingTime}
										<div class="flex justify-between">
											<span class="text-gray-500">Streaming:</span>
											<span>{formatTime(result.performance.streamingTime)}</span>
										</div>
									{/if}
									{#if result.performance.firstFrameTime}
										<div class="flex justify-between">
											<span class="text-gray-500">First Frame:</span>
											<span>{formatTime(result.performance.firstFrameTime)}</span>
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
