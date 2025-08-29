<!--
  GPU Status Debug Component
  Shows GPU acceleration capabilities and status
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { gpuService, type GpuCapabilities } from '$lib/services/gpu-service';
	
	let capabilities: GpuCapabilities | null = $state(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let performanceSummary = $state('');
	
	onMount(async () => {
		try {
			await gpuService.initialize();
			capabilities = await gpuService.getCapabilities();
			performanceSummary = gpuService.getPerformanceSummary();
			loading = false;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			loading = false;
		}
	});
</script>

<div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
	<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
		<span class="w-3 h-3 rounded-full {capabilities?.available ? 'bg-green-500' : 'bg-red-500'}"></span>
		GPU Acceleration Status
	</h3>
	
	{#if loading}
		<div class="text-gray-500 dark:text-gray-400">Loading GPU status...</div>
	{:else if error}
		<div class="text-red-600 dark:text-red-400">
			<strong>Error:</strong> {error}
		</div>
	{:else if capabilities}
		<div class="space-y-2 text-sm">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<strong>Status:</strong> 
					<span class="{capabilities.available ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
						{capabilities.available ? 'Available' : 'Not Available'}
					</span>
				</div>
				<div>
					<strong>Backend:</strong> 
					<span class="font-mono">{capabilities.backend}</span>
				</div>
			</div>
			
			<div>
				<strong>Image Processing:</strong> 
				<span class="{capabilities.supports_image_processing ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}">
					{capabilities.supports_image_processing ? 'Supported' : 'Not Supported'}
				</span>
			</div>
			
			{#if capabilities.device_info}
				<div>
					<strong>Device:</strong> 
					<span class="text-gray-600 dark:text-gray-300">{capabilities.device_info}</span>
				</div>
			{/if}
			
			<div>
				<strong>Message:</strong> 
				<span class="text-gray-600 dark:text-gray-300">{capabilities.message}</span>
			</div>
		</div>
		
		{#if performanceSummary && performanceSummary !== 'No performance data available'}
			<div class="mt-4">
				<h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Performance History</h4>
				<pre class="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">{performanceSummary}</pre>
			</div>
		{/if}
		
		{#if capabilities.available}
			<div class="mt-3 text-xs text-green-600 dark:text-green-400">
				✅ GPU acceleration will be automatically used for suitable images
			</div>
		{:else}
			<div class="mt-3 text-xs text-gray-500 dark:text-gray-400">
				💻 Processing will use CPU-only mode
			</div>
		{/if}
	{/if}
</div>