<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';
	import AlgorithmParameterControl from './AlgorithmParameterControl.svelte';
	import { algorithmConfigStore } from '$lib/stores/algorithm-config-store.svelte';
	import { CENTERLINE_METADATA } from '$lib/types/algorithm-configs';

	interface Props {
		disabled?: boolean;
	}

	let { disabled = false }: Props = $props();

	// Section expansion states
	let coreExpanded = $state(true);
	let processingExpanded = $state(false);
	let artisticExpanded = $state(false);
	let advancedExpanded = $state(false);

	// Get config from store
	const config = $derived(algorithmConfigStore.centerline) as any;

	// Handle parameter changes
	function handleParameterChange(name: string, value: any) {
		algorithmConfigStore.updateConfig('centerline', { [name]: value });
	}

	// Group parameters by category
	const coreParams = ['strokeWidth', 'minPathLength', 'maxIterations'];
	const processingParams = ['morphRadius', 'pruneThreshold', 'smoothingFactor'];
	const artisticParams = ['simplifyTolerance', 'cornerThreshold'];
	const advancedParams = ['preserveDetails', 'connectComponents', 'removeIsolated'];
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
						{#if CENTERLINE_METADATA[param]}
							<AlgorithmParameterControl
								name={param}
								value={config[param]}
								metadata={CENTERLINE_METADATA[param]}
								onChange={(value) => handleParameterChange(param, value)}
								{disabled}
							/>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Processing Parameters -->
	<div
		class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 rounded-lg border"
	>
		<button
			type="button"
			onclick={() => (processingExpanded = !processingExpanded)}
			class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left"
		>
			<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-semibold">
				Processing
			</span>
			<ChevronDown
				class="text-speed-gray-500 dark:text-speed-gray-400 h-4 w-4 transition-transform {processingExpanded
					? 'rotate-180'
					: ''}"
			/>
		</button>

		{#if processingExpanded}
			<div class="border-speed-gray-200 dark:border-speed-gray-700 border-t px-4 py-4">
				<div class="space-y-4">
					{#each processingParams as param}
						{#if CENTERLINE_METADATA[param]}
							<AlgorithmParameterControl
								name={param}
								value={config[param]}
								metadata={CENTERLINE_METADATA[param]}
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
	<div
		class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 rounded-lg border"
	>
		<button
			type="button"
			onclick={() => (artisticExpanded = !artisticExpanded)}
			class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left"
		>
			<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-semibold">
				Artistic Effects
			</span>
			<ChevronDown
				class="text-speed-gray-500 dark:text-speed-gray-400 h-4 w-4 transition-transform {artisticExpanded
					? 'rotate-180'
					: ''}"
			/>
		</button>

		{#if artisticExpanded}
			<div class="border-speed-gray-200 dark:border-speed-gray-700 border-t px-4 py-4">
				<div class="space-y-4">
					{#each artisticParams as param}
						{#if CENTERLINE_METADATA[param]}
							<AlgorithmParameterControl
								name={param}
								value={config[param]}
								metadata={CENTERLINE_METADATA[param]}
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
						{#if CENTERLINE_METADATA[param]}
							<AlgorithmParameterControl
								name={param}
								value={config[param]}
								metadata={CENTERLINE_METADATA[param]}
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
