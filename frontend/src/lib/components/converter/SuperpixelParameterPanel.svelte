<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';
	import AlgorithmParameterControl from './AlgorithmParameterControl.svelte';
	import { algorithmConfigStore } from '$lib/stores/algorithm-config-store.svelte';
	import { SUPERPIXEL_METADATA } from '$lib/types/algorithm-configs';

	interface Props {
		disabled?: boolean;
	}

	let { disabled = false }: Props = $props();

	// Section expansion states
	let coreExpanded = $state(true);
	let segmentationExpanded = $state(false);
	let artisticExpanded = $state(false);
	let advancedExpanded = $state(false);

	// Get config from store
	const config = $derived(algorithmConfigStore.getConfig('superpixel')) as any;

	// Handle parameter changes
	function handleParameterChange(name: string, value: any) {
		algorithmConfigStore.updateConfig('superpixel', { [name]: value });
	}

	// Group parameters by category
	const coreParams = ['regionCount', 'compactness', 'strokeWidth'];
	const segmentationParams = ['iterations', 'colorImportance', 'spatialImportance'];
	const artisticParams = ['polygonMode', 'simplifyTolerance', 'minRegionSize'];
	const advancedParams = ['mergeThreshold', 'enhanceEdges', 'preserveBoundaries'];
</script>

<div class="space-y-4">
	<!-- Core Parameters -->
	<div class="rounded-lg border border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800">
		<button
			type="button"
			onclick={() => (coreExpanded = !coreExpanded)}
			class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700"
		>
			<span class="text-sm font-semibold text-speed-gray-900 dark:text-speed-gray-100">
				Core Settings
			</span>
			<ChevronDown
				class="h-4 w-4 text-speed-gray-500 transition-transform dark:text-speed-gray-400 {coreExpanded
					? 'rotate-180'
					: ''}"
			/>
		</button>

		{#if coreExpanded}
			<div class="border-t border-speed-gray-200 px-4 py-4 dark:border-speed-gray-700">
				<div class="space-y-4">
					{#each coreParams as param}
						{#if SUPERPIXEL_METADATA[param]}
							<AlgorithmParameterControl
								name={param}
								value={(config as any)[param]}
								metadata={SUPERPIXEL_METADATA[param]}
								onChange={(value) => handleParameterChange(param, value)}
								{disabled}
							/>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Segmentation Parameters -->
	<div class="rounded-lg border border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800">
		<button
			type="button"
			onclick={() => (segmentationExpanded = !segmentationExpanded)}
			class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700"
		>
			<span class="text-sm font-semibold text-speed-gray-900 dark:text-speed-gray-100">
				Segmentation
			</span>
			<ChevronDown
				class="h-4 w-4 text-speed-gray-500 transition-transform dark:text-speed-gray-400 {segmentationExpanded
					? 'rotate-180'
					: ''}"
			/>
		</button>

		{#if segmentationExpanded}
			<div class="border-t border-speed-gray-200 px-4 py-4 dark:border-speed-gray-700">
				<div class="space-y-4">
					{#each segmentationParams as param}
						{#if SUPERPIXEL_METADATA[param]}
							<AlgorithmParameterControl
								name={param}
								value={(config as any)[param]}
								metadata={SUPERPIXEL_METADATA[param]}
								onChange={(value) => handleParameterChange(param, value)}
								{disabled}
							/>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Artistic Parameters -->
	<div class="rounded-lg border border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800">
		<button
			type="button"
			onclick={() => (artisticExpanded = !artisticExpanded)}
			class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700"
		>
			<span class="text-sm font-semibold text-speed-gray-900 dark:text-speed-gray-100">
				Style Options
			</span>
			<ChevronDown
				class="h-4 w-4 text-speed-gray-500 transition-transform dark:text-speed-gray-400 {artisticExpanded
					? 'rotate-180'
					: ''}"
			/>
		</button>

		{#if artisticExpanded}
			<div class="border-t border-speed-gray-200 px-4 py-4 dark:border-speed-gray-700">
				<div class="space-y-4">
					{#each artisticParams as param}
						{#if SUPERPIXEL_METADATA[param]}
							<AlgorithmParameterControl
								name={param}
								value={(config as any)[param]}
								metadata={SUPERPIXEL_METADATA[param]}
								onChange={(value) => handleParameterChange(param, value)}
								{disabled}
							/>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Advanced Parameters -->
	<div class="rounded-lg border border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800">
		<button
			type="button"
			onclick={() => (advancedExpanded = !advancedExpanded)}
			class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700"
		>
			<span class="text-sm font-semibold text-speed-gray-900 dark:text-speed-gray-100">
				Advanced Settings
			</span>
			<ChevronDown
				class="h-4 w-4 text-speed-gray-500 transition-transform dark:text-speed-gray-400 {advancedExpanded
					? 'rotate-180'
					: ''}"
			/>
		</button>

		{#if advancedExpanded}
			<div class="border-t border-speed-gray-200 px-4 py-4 dark:border-speed-gray-700">
				<div class="space-y-4">
					{#each advancedParams as param}
						{#if SUPERPIXEL_METADATA[param]}
							<AlgorithmParameterControl
								name={param}
								value={(config as any)[param]}
								metadata={SUPERPIXEL_METADATA[param]}
								onChange={(value) => handleParameterChange(param, value)}
								{disabled}
							/>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>