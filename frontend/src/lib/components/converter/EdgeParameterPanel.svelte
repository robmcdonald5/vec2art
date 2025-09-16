<script lang="ts">
	import {
		ChevronDown,
		Check, // For checkmark indicators
		Filter, // For Preprocessing
		Layers, // For Layer Processing
		Palette, // For Color Controls
		ScanLine, // For Edge Detection
		Sparkles, // For Advanced Processing
		Brush // For Artistic Effects
	} from 'lucide-svelte';
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
		'noiseFilterRangeSigma',
		'enableBackgroundRemoval',
		'backgroundRemovalStrength',
		'backgroundRemovalAlgorithm'
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
		class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 overflow-hidden rounded-lg border"
	>
		<button
			type="button"
			onclick={() => (preprocessingExpanded = !preprocessingExpanded)}
			class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
				>
					<Filter class="h-4 w-4 text-blue-600 dark:text-blue-400" />
				</div>
				<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-medium">
					Preprocessing
				</span>
			</div>
			<ChevronDown
				class="text-speed-gray-400 h-4 w-4 transition-transform duration-200 {preprocessingExpanded
					? 'rotate-180'
					: ''}"
			/>
		</button>

		{#if preprocessingExpanded}
			<div class="border-speed-gray-200 dark:border-speed-gray-700 border-t px-4 py-4">
				<div class="space-y-4">
					<!-- Noise Filtering -->
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<label class="flex cursor-pointer items-center gap-2">
								<input
									type="checkbox"
									checked={config.noiseFiltering ?? false}
									onchange={(e) =>
										handleParameterChange('noiseFiltering', (e.target as HTMLInputElement).checked)}
									{disabled}
									class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
								/>
								<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-medium">
									Noise Filtering
								</span>
							</label>
							{#if config.noiseFiltering}
								<div class="flex items-center gap-1">
									<Check class="h-4 w-4 text-green-500" />
									<span class="text-xs font-medium text-green-600 dark:text-green-400">Active</span>
								</div>
							{/if}
						</div>

						{#if config.noiseFiltering}
							<div class="ml-6 space-y-3 border-l-2 border-blue-100 pl-2 dark:border-blue-900">
								<AlgorithmParameterControl
									name="noiseFilterSpatialSigma"
									value={config.noiseFilterSpatialSigma}
									metadata={EDGE_METADATA.noiseFilterSpatialSigma}
									onChange={(value) => handleParameterChange('noiseFilterSpatialSigma', value)}
									{disabled}
								/>
								<AlgorithmParameterControl
									name="noiseFilterRangeSigma"
									value={config.noiseFilterRangeSigma}
									metadata={EDGE_METADATA.noiseFilterRangeSigma}
									onChange={(value) => handleParameterChange('noiseFilterRangeSigma', value)}
									{disabled}
								/>
							</div>
						{/if}
					</div>

					<!-- Background Removal -->
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<label class="flex cursor-pointer items-center gap-2">
								<input
									type="checkbox"
									checked={config.enableBackgroundRemoval ?? false}
									onchange={(e) =>
										handleParameterChange(
											'enableBackgroundRemoval',
											(e.target as HTMLInputElement).checked
										)}
									{disabled}
									class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
								/>
								<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-medium">
									Background Removal
								</span>
							</label>
							{#if config.enableBackgroundRemoval}
								<div class="flex items-center gap-1">
									<Check class="h-4 w-4 text-green-500" />
									<span class="text-xs font-medium text-green-600 dark:text-green-400">Active</span>
								</div>
							{/if}
						</div>

						{#if config.enableBackgroundRemoval}
							<div class="ml-6 space-y-3 border-l-2 border-blue-100 pl-2 dark:border-blue-900">
								<AlgorithmParameterControl
									name="backgroundRemovalAlgorithm"
									value={config.backgroundRemovalAlgorithm}
									metadata={EDGE_METADATA.backgroundRemovalAlgorithm}
									onChange={(value) => handleParameterChange('backgroundRemovalAlgorithm', value)}
									{disabled}
								/>
								<AlgorithmParameterControl
									name="backgroundRemovalStrength"
									value={config.backgroundRemovalStrength}
									metadata={EDGE_METADATA.backgroundRemovalStrength}
									onChange={(value) => handleParameterChange('backgroundRemovalStrength', value)}
									{disabled}
								/>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Layer Processing -->
	<div
		class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 overflow-hidden rounded-lg border"
	>
		<button
			type="button"
			onclick={() => (layerProcessingExpanded = !layerProcessingExpanded)}
			class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
				>
					<Layers class="h-4 w-4 text-purple-600 dark:text-purple-400" />
				</div>
				<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-medium">
					Layer Processing
				</span>
			</div>
			<ChevronDown
				class="text-speed-gray-400 h-4 w-4 transition-transform duration-200 {layerProcessingExpanded
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
		class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 overflow-hidden rounded-lg border"
	>
		<button
			type="button"
			onclick={() => (colorControlsExpanded = !colorControlsExpanded)}
			class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20"
				>
					<Palette class="h-4 w-4 text-pink-600 dark:text-pink-400" />
				</div>
				<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-medium">
					Color Controls
				</span>
			</div>
			<ChevronDown
				class="text-speed-gray-400 h-4 w-4 transition-transform duration-200 {colorControlsExpanded
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
		class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 overflow-hidden rounded-lg border"
	>
		<button
			type="button"
			onclick={() => (edgeDetectionExpanded = !edgeDetectionExpanded)}
			class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
				>
					<ScanLine class="h-4 w-4 text-green-600 dark:text-green-400" />
				</div>
				<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-medium">
					Edge Detection
				</span>
			</div>
			<ChevronDown
				class="text-speed-gray-400 h-4 w-4 transition-transform duration-200 {edgeDetectionExpanded
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
		class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 overflow-hidden rounded-lg border"
	>
		<button
			type="button"
			onclick={() => (advancedExpanded = !advancedExpanded)}
			class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20"
				>
					<Sparkles class="h-4 w-4 text-amber-600 dark:text-amber-400" />
				</div>
				<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-medium">
					Advanced Processing
				</span>
			</div>
			<ChevronDown
				class="text-speed-gray-400 h-4 w-4 transition-transform duration-200 {advancedExpanded
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
		class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 overflow-hidden rounded-lg border"
	>
		<button
			type="button"
			onclick={() => (artisticExpanded = !artisticExpanded)}
			class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20"
				>
					<Brush class="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
				</div>
				<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-medium">
					Artistic Effects
				</span>
			</div>
			<ChevronDown
				class="text-speed-gray-400 h-4 w-4 transition-transform duration-200 {artisticExpanded
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
