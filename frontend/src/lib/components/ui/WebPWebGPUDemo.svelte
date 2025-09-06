<!--
  Enhanced WebP Conversion Demo with WebGPU Acceleration
  
  Provides interactive testing of multiple acceleration techniques.
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Zap, Cpu, Activity, Settings } from 'lucide-svelte';

	// Component state
	let isRunning = false;
	let progress = 0;
	let progressStage = '';
	let testResults: any[] = [];

	// System info
	let webgpuAvailable = false;
	let workerAvailable = false;

	onMount(async () => {
		// Check WebGPU availability
		if (typeof navigator !== 'undefined' && navigator.gpu) {
			try {
				const adapter = await navigator.gpu.requestAdapter();
				webgpuAvailable = !!adapter;
			} catch (error) {
				webgpuAvailable = false;
			}
		}

		// Check Worker availability
		workerAvailable = typeof Worker !== 'undefined';
	});

	async function runBenchmark() {
		isRunning = true;
		progress = 0;
		progressStage = 'Initializing benchmark...';
		testResults = [];

		try {
			// Mock benchmark results for demo
			for (let i = 0; i < 3; i++) {
				progress = (i + 1) * 33;
				progressStage = `Running test ${i + 1}/3...`;
				await new Promise((resolve) => setTimeout(resolve, 1000));

				testResults.push({
					method: i === 0 ? 'WebGPU' : i === 1 ? 'Worker' : 'CPU',
					time: Math.random() * 1000 + 500,
					success: true
				});
			}

			progressStage = 'Complete';
			progress = 100;
		} catch (error) {
			console.error('Benchmark failed:', error);
		} finally {
			isRunning = false;
		}
	}
</script>

<div class="rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
	<div class="mb-6 flex items-center gap-3">
		<Zap class="h-6 w-6 text-blue-500" />
		<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
			WebP WebGPU Performance Demo
		</h2>
	</div>

	<!-- System Status -->
	<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
		<div class="flex items-center gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
			<Cpu class="h-4 w-4" />
			<span class="text-sm">WebGPU: {webgpuAvailable ? '✅ Available' : '❌ Not Available'}</span>
		</div>
		<div class="flex items-center gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
			<Activity class="h-4 w-4" />
			<span class="text-sm">Workers: {workerAvailable ? '✅ Available' : '❌ Not Available'}</span>
		</div>
	</div>

	<!-- Controls -->
	<div class="mb-6 flex gap-4">
		<Button on:click={runBenchmark} disabled={isRunning} class="flex items-center gap-2">
			<Settings class="h-4 w-4" />
			{isRunning ? 'Running...' : 'Run Benchmark'}
		</Button>
	</div>

	<!-- Progress -->
	{#if isRunning}
		<div class="mb-6">
			<div class="mb-2 flex justify-between text-sm">
				<span>{progressStage}</span>
				<span>{progress}%</span>
			</div>
			<div class="h-2 w-full rounded-full bg-gray-200">
				<div
					class="h-2 rounded-full bg-blue-600 transition-all duration-300"
					style="width: {progress}%"
				></div>
			</div>
		</div>
	{/if}

	<!-- Results -->
	{#if testResults.length > 0}
		<div class="space-y-4">
			<h3 class="font-medium text-gray-900 dark:text-gray-100">Test Results</h3>
			<div class="grid gap-3">
				{#each testResults as result (result.method)}
					<div class="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
						<span class="font-medium">{result.method}</span>
						<span class="text-sm text-gray-600 dark:text-gray-400">
							{result.time.toFixed(0)}ms
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
