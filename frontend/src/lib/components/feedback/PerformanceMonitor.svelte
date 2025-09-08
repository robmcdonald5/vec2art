<!--
  Performance Monitor Component - Phase 3.4
  
  Real-time performance monitoring dashboard showing Phase 3 optimization metrics
  including validation cache performance, batch processing efficiency, WASM
  optimization stats, and frontend performance indicators.
-->

<script lang="ts">
	import { globalValidationCache } from '$lib/utils/validation-cache';
	import { globalImagePool } from '$lib/utils/image-pool';
	import { processingQueue } from '$lib/stores/processing-queue.svelte';
	import { converterWasm } from '$lib/stores/converter-wasm.svelte';
	import { 
		globalComponentMemoizer, 
		globalRenderThrottler, 
		globalStoreUpdater 
	} from '$lib/utils/component-optimizer';
	import { useMemo } from '$lib/utils/component-optimizer';

	interface PerformanceMetrics {
		validation: {
			hitRatio: number;
			cacheSize: number;
			totalValidations: number;
		};
		imagePool: {
			hitRatio: number;
			totalMemoryMB: number;
			utilizationPercent: number;
		};
		processingQueue: {
			activeJobs: number;
			queueLength: number;
			totalProcessed: number;
			averageProcessingTime: number;
		};
		wasmOptimization: {
			parallelEfficiency: number;
			sharedBufferUsage: number;
			averageJobTime: number;
		};
		frontend: {
			componentCacheHitRatio: number;
			pendingRenderUpdates: number;
			storeUpdatesPending: number;
		};
	}

	let showMonitor = $state(false);
	let updateInterval: number | null = null;
	let metricsHistory: PerformanceMetrics[] = $state([]);
	
	// Use memoization for expensive calculations
	const currentMetrics = $derived(useMemo(
		'performance_metrics',
		() => calculateCurrentMetrics(),
		[showMonitor] // Recalculate when monitor visibility changes
	));

	// Performance improvement since Phase 3 start
	const performanceGains = $derived(useMemo(
		'performance_gains',
		() => calculatePerformanceGains(),
		[metricsHistory.length]
	));

	function calculateCurrentMetrics(): PerformanceMetrics {
		const validationStats = globalValidationCache.getStats();
		const poolStats = globalImagePool.getStats();
		const queueStats = processingQueue.statistics;
		const wasmMetrics = converterWasm.wasmMetrics;
		const bufferStats = converterWasm.bufferPoolStats;
		
		return {
			validation: {
				hitRatio: validationStats.hitRatio,
				cacheSize: validationStats.cacheSize,
				totalValidations: validationStats.totalValidations
			},
			imagePool: {
				hitRatio: poolStats.hitRatio,
				totalMemoryMB: poolStats.totalMemoryMB,
				utilizationPercent: (poolStats.totalMemoryMB / 256) * 100 // Assuming 256MB max
			},
			processingQueue: {
				activeJobs: queueStats.activeJobs,
				queueLength: queueStats.queueLength,
				totalProcessed: queueStats.totalProcessed,
				averageProcessingTime: queueStats.averageProcessingTime
			},
			wasmOptimization: {
				parallelEfficiency: wasmMetrics.parallelEfficiency * 100,
				sharedBufferUsage: wasmMetrics.sharedBufferUsage,
				averageJobTime: wasmMetrics.averageJobTime
			},
			frontend: {
				componentCacheHitRatio: globalComponentMemoizer.getStats().hitRatio,
				pendingRenderUpdates: globalRenderThrottler.getStats().pendingUpdates,
				storeUpdatesPending: globalStoreUpdater.getStats().pendingUpdates
			}
		};
	}

	function calculatePerformanceGains(): Record<string, string> {
		if (metricsHistory.length < 2) {
			return {};
		}

		const current = metricsHistory[metricsHistory.length - 1];
		const baseline = metricsHistory[0];

		return {
			validationSpeed: `+${((current.validation.hitRatio - baseline.validation.hitRatio) * 100).toFixed(1)}%`,
			memoryEfficiency: `+${(current.imagePool.hitRatio * 100).toFixed(1)}%`,
			processingThroughput: current.processingQueue.averageProcessingTime > 0 && baseline.processingQueue.averageProcessingTime > 0
				? `+${(((baseline.processingQueue.averageProcessingTime - current.processingQueue.averageProcessingTime) / baseline.processingQueue.averageProcessingTime) * 100).toFixed(1)}%`
				: 'N/A',
			parallelization: `${current.wasmOptimization.parallelEfficiency.toFixed(1)}%`
		};
	}

	function startMonitoring(): void {
		if (updateInterval) return;
		
		updateInterval = window.setInterval(() => {
			const metrics = calculateCurrentMetrics();
			metricsHistory = [...metricsHistory.slice(-50), metrics]; // Keep last 50 entries
		}, 1000); // Update every second
	}

	function stopMonitoring(): void {
		if (updateInterval) {
			clearInterval(updateInterval);
			updateInterval = null;
		}
	}

	function toggleMonitor(): void {
		showMonitor = !showMonitor;
		if (showMonitor) {
			startMonitoring();
		} else {
			stopMonitoring();
		}
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	function getPerformanceColor(percentage: number): string {
		if (percentage >= 80) return 'text-green-500';
		if (percentage >= 60) return 'text-yellow-500';
		if (percentage >= 40) return 'text-orange-500';
		return 'text-red-500';
	}

	// Cleanup on unmount
	$effect(() => {
		return () => {
			stopMonitoring();
		};
	});
</script>

<!-- Performance Monitor Toggle Button -->
<button
	onclick={toggleMonitor}
	class="fixed top-4 right-4 z-50 px-3 py-2 bg-gray-800 text-white rounded-lg shadow-lg hover:bg-gray-700 transition-colors text-sm font-mono"
	title="Toggle Performance Monitor"
>
	{showMonitor ? '📊 Hide' : '📊 Show'} Perf
</button>

<!-- Performance Monitor Panel -->
{#if showMonitor}
	<div class="fixed top-16 right-4 z-40 w-96 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl font-mono text-xs">
		<!-- Header -->
		<div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-t-lg border-b border-gray-300 dark:border-gray-600">
			<h3 class="font-semibold text-gray-900 dark:text-white">
				🚀 Phase 3 Performance Monitor
			</h3>
			<p class="text-gray-600 dark:text-gray-300 text-xs">
				Real-time optimization metrics
			</p>
		</div>

		<!-- Metrics Content -->
		<div class="p-4 max-h-96 overflow-y-auto">
			<!-- Phase 3.1: Validation Cache -->
			<div class="mb-4">
				<h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-2">
					🧠 Validation Cache (Phase 3.1)
				</h4>
				<div class="grid grid-cols-2 gap-2 text-xs">
					<div class="flex justify-between">
						<span class="text-gray-600 dark:text-gray-400">Hit Ratio:</span>
						<span class={getPerformanceColor(currentMetrics.validation.hitRatio * 100)}>
							{(currentMetrics.validation.hitRatio * 100).toFixed(1)}%
						</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600 dark:text-gray-400">Cache Size:</span>
						<span class="text-gray-900 dark:text-white">
							{currentMetrics.validation.cacheSize}
						</span>
					</div>
					<div class="flex justify-between col-span-2">
						<span class="text-gray-600 dark:text-gray-400">Total Validations:</span>
						<span class="text-gray-900 dark:text-white">
							{currentMetrics.validation.totalValidations.toLocaleString()}
						</span>
					</div>
				</div>
			</div>

			<!-- Phase 3.2: Image Pool & Queue -->
			<div class="mb-4">
				<h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-2">
					🏊 Memory Pool (Phase 3.2)
				</h4>
				<div class="grid grid-cols-2 gap-2 text-xs">
					<div class="flex justify-between">
						<span class="text-gray-600 dark:text-gray-400">Hit Ratio:</span>
						<span class={getPerformanceColor(currentMetrics.imagePool.hitRatio * 100)}>
							{(currentMetrics.imagePool.hitRatio * 100).toFixed(1)}%
						</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600 dark:text-gray-400">Memory:</span>
						<span class="text-gray-900 dark:text-white">
							{formatBytes(currentMetrics.imagePool.totalMemoryMB * 1024 * 1024)}
						</span>
					</div>
					<div class="flex justify-between col-span-2">
						<span class="text-gray-600 dark:text-gray-400">Utilization:</span>
						<span class={getPerformanceColor(currentMetrics.imagePool.utilizationPercent)}>
							{currentMetrics.imagePool.utilizationPercent.toFixed(1)}%
						</span>
					</div>
				</div>
			</div>

			<!-- Processing Queue -->
			<div class="mb-4">
				<h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-2">
					📋 Processing Queue
				</h4>
				<div class="grid grid-cols-2 gap-2 text-xs">
					<div class="flex justify-between">
						<span class="text-gray-600 dark:text-gray-400">Active Jobs:</span>
						<span class="text-blue-500">
							{currentMetrics.processingQueue.activeJobs}
						</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600 dark:text-gray-400">Queued:</span>
						<span class="text-gray-900 dark:text-white">
							{currentMetrics.processingQueue.queueLength}
						</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600 dark:text-gray-400">Processed:</span>
						<span class="text-green-500">
							{currentMetrics.processingQueue.totalProcessed.toLocaleString()}
						</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600 dark:text-gray-400">Avg Time:</span>
						<span class="text-gray-900 dark:text-white">
							{currentMetrics.processingQueue.averageProcessingTime.toFixed(0)}ms
						</span>
					</div>
				</div>
			</div>

			<!-- Phase 3.3: WASM Optimizations -->
			<div class="mb-4">
				<h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-2">
					⚡ WASM Optimization (Phase 3.3)
				</h4>
				<div class="grid grid-cols-2 gap-2 text-xs">
					<div class="flex justify-between">
						<span class="text-gray-600 dark:text-gray-400">Parallel Eff:</span>
						<span class={getPerformanceColor(currentMetrics.wasmOptimization.parallelEfficiency)}>
							{currentMetrics.wasmOptimization.parallelEfficiency.toFixed(1)}%
						</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600 dark:text-gray-400">Shared Buf:</span>
						<span class={getPerformanceColor(currentMetrics.wasmOptimization.sharedBufferUsage)}>
							{currentMetrics.wasmOptimization.sharedBufferUsage.toFixed(1)}%
						</span>
					</div>
					<div class="flex justify-between col-span-2">
						<span class="text-gray-600 dark:text-gray-400">Avg Job Time:</span>
						<span class="text-gray-900 dark:text-white">
							{currentMetrics.wasmOptimization.averageJobTime.toFixed(0)}ms
						</span>
					</div>
				</div>
			</div>

			<!-- Phase 3.4: Frontend Performance -->
			<div class="mb-4">
				<h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-2">
					🖥️ Frontend (Phase 3.4)
				</h4>
				<div class="grid grid-cols-2 gap-2 text-xs">
					<div class="flex justify-between">
						<span class="text-gray-600 dark:text-gray-400">Comp Cache:</span>
						<span class={getPerformanceColor(currentMetrics.frontend.componentCacheHitRatio * 100)}>
							{(currentMetrics.frontend.componentCacheHitRatio * 100).toFixed(1)}%
						</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600 dark:text-gray-400">Pending:</span>
						<span class="text-gray-900 dark:text-white">
							{currentMetrics.frontend.pendingRenderUpdates}
						</span>
					</div>
					<div class="flex justify-between col-span-2">
						<span class="text-gray-600 dark:text-gray-400">Store Updates:</span>
						<span class="text-gray-900 dark:text-white">
							{currentMetrics.frontend.storeUpdatesPending}
						</span>
					</div>
				</div>
			</div>

			<!-- Performance Gains Summary -->
			{#if Object.keys(performanceGains).length > 0}
				<div class="border-t border-gray-200 dark:border-gray-600 pt-3">
					<h4 class="font-semibold text-green-600 dark:text-green-400 mb-2">
						📈 Phase 3 Improvements
					</h4>
					<div class="grid grid-cols-2 gap-2 text-xs">
						{#each Object.entries(performanceGains) as [metric, gain]}
							<div class="flex justify-between">
								<span class="text-gray-600 dark:text-gray-400 capitalize">
									{metric.replace(/([A-Z])/g, ' $1').toLowerCase()}:
								</span>
								<span class="text-green-500 font-semibold">
									{gain}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-b-lg border-t border-gray-300 dark:border-gray-600">
			<p class="text-xs text-gray-500 dark:text-gray-400">
				Updates every 1s • {metricsHistory.length} samples
			</p>
		</div>
	</div>
{/if}