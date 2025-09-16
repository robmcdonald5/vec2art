<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';
	import AlgorithmParameterControl from './AlgorithmParameterControl.svelte';
	import { algorithmConfigStore } from '$lib/stores/algorithm-config-store.svelte';
	import { DOTS_METADATA } from '$lib/types/algorithm-configs';

	interface Props {
		disabled?: boolean;
	}

	let { disabled = false }: Props = $props();

	// Section expansion states
	let coreExpanded = $state(true);
	let dotStyleExpanded = $state(false);
	let colorExpanded = $state(false);
	let advancedExpanded = $state(false);

	// Get config from store
	const config = $derived(algorithmConfigStore.dots) as any;

	// Handle parameter changes
	function handleParameterChange(name: string, value: any) {
		algorithmConfigStore.updateConfig('dots', { [name]: value });
	}

	// Group parameters by category
	const coreParams = ['dotDensity', 'minRadius', 'maxRadius'];
	const dotStyleParams = ['dotShape', 'adaptiveSizing', 'sizeVariation'];
	const colorParams = ['preserveColors', 'colorMode', 'backgroundTolerance'];
	const advancedParams = ['gridType', 'jitterAmount', 'overlapHandling'];
</script>

<div class="space-y-4">
	<!-- Core Parameters -->
	<div
		class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 rounded-lg border"
	>
		<button
			type="button"
			onclick={() => (coreExpanded = !coreExpanded)}
			class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left"
		>
			<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-semibold">
				Core Settings
			</span>
			<ChevronDown
				class="text-speed-gray-500 dark:text-speed-gray-400 h-4 w-4 transition-transform {coreExpanded
					? 'rotate-180'
					: ''}"
			/>
		</button>

		{#if coreExpanded}
			<div class="border-speed-gray-200 dark:border-speed-gray-700 border-t px-4 py-4">
				<div class="space-y-4">
					{#each coreParams as param}
						{#if DOTS_METADATA[param]}
							<AlgorithmParameterControl
								name={param}
								value={config[param]}
								metadata={DOTS_METADATA[param]}
								onChange={(value) => handleParameterChange(param, value)}
								{disabled}
							/>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Dot Style Parameters -->
	<div
		class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 rounded-lg border"
	>
		<button
			type="button"
			onclick={() => (dotStyleExpanded = !dotStyleExpanded)}
			class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left"
		>
			<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-semibold">
				Dot Style
			</span>
			<ChevronDown
				class="text-speed-gray-500 dark:text-speed-gray-400 h-4 w-4 transition-transform {dotStyleExpanded
					? 'rotate-180'
					: ''}"
			/>
		</button>

		{#if dotStyleExpanded}
			<div class="border-speed-gray-200 dark:border-speed-gray-700 border-t px-4 py-4">
				<div class="space-y-4">
					{#each dotStyleParams as param}
						{#if DOTS_METADATA[param]}
							<AlgorithmParameterControl
								name={param}
								value={config[param]}
								metadata={DOTS_METADATA[param]}
								onChange={(value) => handleParameterChange(param, value)}
								{disabled}
							/>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Color Parameters -->
	<div
		class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 rounded-lg border"
	>
		<button
			type="button"
			onclick={() => (colorExpanded = !colorExpanded)}
			class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left"
		>
			<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-semibold">
				Color Options
			</span>
			<ChevronDown
				class="text-speed-gray-500 dark:text-speed-gray-400 h-4 w-4 transition-transform {colorExpanded
					? 'rotate-180'
					: ''}"
			/>
		</button>

		{#if colorExpanded}
			<div class="border-speed-gray-200 dark:border-speed-gray-700 border-t px-4 py-4">
				<div class="space-y-4">
					{#each colorParams as param}
						{#if DOTS_METADATA[param]}
							<AlgorithmParameterControl
								name={param}
								value={config[param]}
								metadata={DOTS_METADATA[param]}
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
	<div
		class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 rounded-lg border"
	>
		<button
			type="button"
			onclick={() => (advancedExpanded = !advancedExpanded)}
			class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left"
		>
			<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-semibold">
				Advanced Settings
			</span>
			<ChevronDown
				class="text-speed-gray-500 dark:text-speed-gray-400 h-4 w-4 transition-transform {advancedExpanded
					? 'rotate-180'
					: ''}"
			/>
		</button>

		{#if advancedExpanded}
			<div class="border-speed-gray-200 dark:border-speed-gray-700 border-t px-4 py-4">
				<div class="space-y-4">
					{#each advancedParams as param}
						{#if DOTS_METADATA[param]}
							<AlgorithmParameterControl
								name={param}
								value={config[param]}
								metadata={DOTS_METADATA[param]}
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
