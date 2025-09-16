<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';
	import AlgorithmParameterControl from './AlgorithmParameterControl.svelte';
	import { algorithmConfigStore } from '$lib/stores/algorithm-config-store.svelte';
	import { EDGE_METADATA } from '$lib/types/algorithm-configs';

	interface Props {
		disabled?: boolean;
	}

	let { disabled = false }: Props = $props();

	// Section expansion states
	let preprocessingExpanded = $state(true);
	let layerProcessingExpanded = $state(false);
	let colorControlsExpanded = $state(false);
	let edgeDetectionExpanded = $state(false);
	let advancedExpanded = $state(false);
	let artisticExpanded = $state(false);

	// Get config from store
	const config = $derived(algorithmConfigStore.edge) as any;

	// Handle parameter changes
	function handleParameterChange(name: string, value: any) {
		algorithmConfigStore.updateConfig('edge', { [name]: value });
	}

	// Group parameters by category - new organization
	const preprocessingParams = [
		'noiseFiltering',
		'noiseFilterSpatialSigma',
		'enableBackgroundRemoval',
		'backgroundRemovalStrength'
	];
	const layerProcessingParams = ['enableMultipass', 'passCount'];
	const colorControlParams = [
		'linePreserveColors',
		'lineColorAccuracy',
		'maxColorsPerPath',
		'colorTolerance',
		'lineColorSampling'
	];
	const edgeDetectionParams = [
		'enableReversePass',
		'enableDiagonalPass',
		'nmsLow',
		'nmsHigh',
		'nmsSmoothBeforeNms'
	];
	const advancedParams = [
		'enableEtfFdog',
		'etfRadius',
		'etfIterations',
		'fdogSigmaS',
		'fdogTau',
		'enableFlowTracing',
		'enableBezierFitting'
	];
	const artisticParams = [
		'handDrawnPreset',
		'handDrawnVariableWeights',
		'handDrawnTremorStrength',
		'handDrawnTapering'
	];
</script>

<div class="space-y-4">
	<!-- Preprocessing -->
	<div
		class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 rounded-lg border"
	>
		<button
			type="button"
			onclick={() => (preprocessingExpanded = !preprocessingExpanded)}
			class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left"
		>
			<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-semibold">
				Preprocessing
			</span>
			<ChevronDown
				class="text-speed-gray-500 dark:text-speed-gray-400 h-4 w-4 transition-transform {preprocessingExpanded
					? 'rotate-180'
					: ''}"
			/>
		</button>

		{#if preprocessingExpanded}
			<div class="border-speed-gray-200 dark:border-speed-gray-700 border-t px-4 py-4">
				<div class="space-y-4">
					{#each preprocessingParams as param}
						{#if EDGE_METADATA[param] && (!EDGE_METADATA[param].dependsOn || config[EDGE_METADATA[param].dependsOn])}
							<AlgorithmParameterControl
								name={param}
								value={config[param]}
								metadata={EDGE_METADATA[param]}
								onChange={(value) => handleParameterChange(param, value)}
								{disabled}
							/>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Layer Processing -->
	<div
		class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 rounded-lg border"
	>
		<button
			type="button"
			onclick={() => (layerProcessingExpanded = !layerProcessingExpanded)}
			class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left"
		>
			<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-semibold">
				Layer Processing
			</span>
			<ChevronDown
				class="text-speed-gray-500 dark:text-speed-gray-400 h-4 w-4 transition-transform {layerProcessingExpanded
					? 'rotate-180'
					: ''}"
			/>
		</button>

		{#if layerProcessingExpanded}
			<div class="border-speed-gray-200 dark:border-speed-gray-700 border-t px-4 py-4">
				<div class="space-y-4">
					{#each layerProcessingParams as param}
						{#if EDGE_METADATA[param] && (!EDGE_METADATA[param].dependsOn || config[EDGE_METADATA[param].dependsOn])}
							<AlgorithmParameterControl
								name={param}
								value={config[param]}
								metadata={EDGE_METADATA[param]}
								onChange={(value) => handleParameterChange(param, value)}
								{disabled}
							/>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Color Controls -->
	<div
		class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 rounded-lg border"
	>
		<button
			type="button"
			onclick={() => (colorControlsExpanded = !colorControlsExpanded)}
			class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left"
		>
			<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-semibold">
				Color Controls
			</span>
			<ChevronDown
				class="text-speed-gray-500 dark:text-speed-gray-400 h-4 w-4 transition-transform {colorControlsExpanded
					? 'rotate-180'
					: ''}"
			/>
		</button>

		{#if colorControlsExpanded}
			<div class="border-speed-gray-200 dark:border-speed-gray-700 border-t px-4 py-4">
				<div class="space-y-4">
					{#each colorControlParams as param}
						{#if EDGE_METADATA[param] && (!EDGE_METADATA[param].dependsOn || config[EDGE_METADATA[param].dependsOn])}
							<AlgorithmParameterControl
								name={param}
								value={config[param]}
								metadata={EDGE_METADATA[param]}
								onChange={(value) => handleParameterChange(param, value)}
								{disabled}
							/>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Edge Detection -->
	<div
		class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 rounded-lg border"
	>
		<button
			type="button"
			onclick={() => (edgeDetectionExpanded = !edgeDetectionExpanded)}
			class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left"
		>
			<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-semibold">
				Edge Detection
			</span>
			<ChevronDown
				class="text-speed-gray-500 dark:text-speed-gray-400 h-4 w-4 transition-transform {edgeDetectionExpanded
					? 'rotate-180'
					: ''}"
			/>
		</button>

		{#if edgeDetectionExpanded}
			<div class="border-speed-gray-200 dark:border-speed-gray-700 border-t px-4 py-4">
				<div class="space-y-4">
					{#each edgeDetectionParams as param}
						{#if EDGE_METADATA[param] && (!EDGE_METADATA[param].dependsOn || config[EDGE_METADATA[param].dependsOn])}
							<AlgorithmParameterControl
								name={param}
								value={config[param]}
								metadata={EDGE_METADATA[param]}
								onChange={(value) => handleParameterChange(param, value)}
								{disabled}
							/>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Advanced Processing -->
	<div
		class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 rounded-lg border"
	>
		<button
			type="button"
			onclick={() => (advancedExpanded = !advancedExpanded)}
			class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left"
		>
			<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-semibold">
				Advanced Processing
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
						{#if EDGE_METADATA[param] && (!EDGE_METADATA[param].dependsOn || config[EDGE_METADATA[param].dependsOn])}
							<AlgorithmParameterControl
								name={param}
								value={config[param]}
								metadata={EDGE_METADATA[param]}
								onChange={(value) => handleParameterChange(param, value)}
								{disabled}
							/>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Artistic Effects -->
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
						{#if EDGE_METADATA[param] && (!EDGE_METADATA[param].dependsOn || config[EDGE_METADATA[param].dependsOn])}
							<AlgorithmParameterControl
								name={param}
								value={config[param]}
								metadata={EDGE_METADATA[param]}
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
