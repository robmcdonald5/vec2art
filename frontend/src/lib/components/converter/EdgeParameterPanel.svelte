<script lang="ts">
	import {
		ChevronDown,
		Check, // For checkmark indicators
		Filter, // For Preprocessing
		Layers, // For Layer Processing
		Palette, // For Color Controls
		Sparkles, // For Advanced Processing
		Brush // For Artistic Effects
	} from 'lucide-svelte';
	import FerrariParameterControl from '$lib/components/ui/FerrariParameterControl.svelte';
	import PortalTooltipFixed from '$lib/components/ui/tooltip/PortalTooltipFixed.svelte';
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
	let advancedExpanded = $state(false);
	let artisticExpanded = $state(false);

	// Get reactive config from the store using $derived
	const config = $derived(algorithmConfigStore.edge) as Record<string, any>;

	// Handle parameter changes with dependency chain management
	function handleParameterChange(name: string, value: any) {
		console.log('[EdgeParameterPanel] Updating parameter:', name, 'to value:', value);

		// Apply hand-drawn preset values when preset changes
		if (name === 'handDrawnPreset') {
			console.log('[EdgeParameterPanel] Applying hand-drawn preset:', value);
			algorithmConfigStore.applyHandDrawnPreset(value);
		} else {
			// Handle dependency chain collapse when disabling settings
			const updates: Record<string, any> = { [name]: value };

			// Handle dependency chain collapse when disabling settings
			if (value === false) {
				if (name === 'enableEtfFdog') {
					// ETF/FDoG disabled -> disable Flow Tracing and Bezier Fitting
					updates.enableFlowTracing = false;
					updates.enableBezierFitting = false;
					console.log(
						'[EdgeParameterPanel] ETF/FDoG disabled, cascading to disable Flow Tracing and Bezier Fitting'
					);
				} else if (name === 'enableFlowTracing') {
					// Flow Tracing disabled -> disable Bezier Fitting
					updates.enableBezierFitting = false;
					console.log(
						'[EdgeParameterPanel] Flow Tracing disabled, cascading to disable Bezier Fitting'
					);
				}
			}

			// Handle Pass Count changes - disable multipass features when count is 1
			if (name === 'passCount' && value === 1) {
				updates.enableReversePass = false;
				updates.enableDiagonalPass = false;
				console.log(
					'[EdgeParameterPanel] Pass Count set to 1, disabling Reverse and Diagonal Pass'
				);
			}

			// Use updateCurrentConfig to trigger auto-switching for hand-drawn sliders
			algorithmConfigStore.updateCurrentConfig(updates);
		}
	}

	// Check if a parameter should be visible based on its full dependency chain
	function isParameterVisible(param: string): boolean {
		const metadata = EDGE_METADATA[param];
		if (!metadata || !metadata.dependsOn) {
			return true; // No dependencies, always visible
		}

		// Check immediate dependency
		const immediateParent = metadata.dependsOn;
		if (!config[immediateParent]) {
			return false; // Immediate parent is disabled
		}

		// Recursively check parent dependencies to ensure the full chain is enabled
		return isParameterVisible(immediateParent);
	}

	// Validate and enforce dependency constraints on config changes
	function validateDependencyConstraints() {
		const updates: Record<string, any> = {};
		let hasUpdates = false;

		// Ensure Flow Tracing is disabled if ETF/FDoG is disabled
		if (!config.enableEtfFdog && config.enableFlowTracing) {
			updates.enableFlowTracing = false;
			hasUpdates = true;
		}

		// Ensure Bezier Fitting is disabled if Flow Tracing is disabled
		if (!config.enableFlowTracing && config.enableBezierFitting) {
			updates.enableBezierFitting = false;
			hasUpdates = true;
		}

		// Ensure multipass features are disabled when Pass Count is 1
		if (config.passCount === 1) {
			if (config.enableReversePass) {
				updates.enableReversePass = false;
				hasUpdates = true;
			}
			if (config.enableDiagonalPass) {
				updates.enableDiagonalPass = false;
				hasUpdates = true;
			}
		}

		// Apply constraint fixes if needed
		if (hasUpdates) {
			console.log('[EdgeParameterPanel] Applying dependency constraint fixes:', updates);
			algorithmConfigStore.updateCurrentConfig(updates);
		}
	}

	// Validate constraints whenever config changes
	$effect(() => {
		validateDependencyConstraints();
	});

	// Group parameters by category - new organization
	const _preprocessingParams: string[] = [
		'noiseFiltering',
		'noiseFilterSpatialSigma',
		'noiseFilterRangeSigma',
		'enableBackgroundRemoval',
		'backgroundRemovalStrength',
		'backgroundRemovalAlgorithm'
	];
	const layerProcessingParams: string[] = [
		'passCount',
		'enableReversePass',
		'enableDiagonalPass',
		'directionalStrengthThreshold'
	];
	const colorControlParams: string[] = [
		'linePreserveColors',
		'lineColorAccuracy',
		'maxColorsPerPath',
		'colorTolerance',
		'lineColorSampling'
	];
	const advancedParams: string[] = [
		'enableEtfFdog',
		'etfRadius',
		'etfIterations',
		'etfCoherencyTau',
		'fdogSigmaS',
		'fdogSigmaC',
		'fdogTau',
		'enableFlowTracing',
		'enableBezierFitting'
	];
	const artisticParams: string[] = [
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
								<div class="flex items-center gap-2">
									<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-medium">
										Noise Filtering
									</span>
									<PortalTooltipFixed
										content="Advanced bilateral filtering to reduce image noise while preserving edges. Helps create cleaner line art from noisy input images."
										position="top"
										size="md"
									/>
								</div>
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
								<FerrariParameterControl
									name="noiseFilterSpatialSigma"
									value={config.noiseFilterSpatialSigma}
									metadata={EDGE_METADATA.noiseFilterSpatialSigma}
									onChange={(value) => handleParameterChange('noiseFilterSpatialSigma', value)}
									{disabled}
								/>
								<FerrariParameterControl
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
								<div class="flex items-center gap-2">
									<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-medium">
										Background Removal
									</span>
									<PortalTooltipFixed
										content="Automatically removes background from images using advanced segmentation algorithms. Useful for isolating foreground objects before line tracing."
										position="top"
										size="md"
									/>
								</div>
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
								<FerrariParameterControl
									name="backgroundRemovalAlgorithm"
									value={config.backgroundRemovalAlgorithm}
									metadata={EDGE_METADATA.backgroundRemovalAlgorithm}
									onChange={(value) => handleParameterChange('backgroundRemovalAlgorithm', value)}
									{disabled}
								/>
								<FerrariParameterControl
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
					{#each layerProcessingParams as param (param)}
						{#if EDGE_METADATA[param]}
							{#if param === 'enableReversePass' || param === 'enableDiagonalPass'}
								{#if config.passCount > 1}
									<FerrariParameterControl
										name={param}
										value={config[param]}
										metadata={EDGE_METADATA[param]}
										onChange={(value) => handleParameterChange(param, value)}
										{disabled}
									/>
								{/if}
							{:else if param === 'directionalStrengthThreshold'}
								{#if config.passCount > 1 && (config.enableReversePass || config.enableDiagonalPass)}
									<FerrariParameterControl
										name={param}
										value={config[param]}
										metadata={EDGE_METADATA[param]}
										onChange={(value) => handleParameterChange(param, value)}
										{disabled}
									/>
								{/if}
							{:else if isParameterVisible(param)}
								<FerrariParameterControl
									name={param}
									value={config[param]}
									metadata={EDGE_METADATA[param]}
									onChange={(value) => handleParameterChange(param, value)}
									{disabled}
								/>
							{/if}
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
					{#each colorControlParams as param (param)}
						{#if EDGE_METADATA[param] && isParameterVisible(param)}
							<FerrariParameterControl
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
					{#each artisticParams as param (param)}
						{#if param === 'handDrawnPreset'}
							<!-- Always show the preset selector -->
							<FerrariParameterControl
								name={param}
								value={config[param]}
								metadata={EDGE_METADATA[param]}
								onChange={(value) => handleParameterChange(param, value)}
								{disabled}
							/>
						{:else if config.handDrawnPreset !== 'none' && EDGE_METADATA[param] && isParameterVisible(param)}
							<!-- Only show sliders when preset is not 'none' -->
							<FerrariParameterControl
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
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20"
				>
					<Sparkles class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
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
					{#each advancedParams as param (param)}
						{#if EDGE_METADATA[param] && isParameterVisible(param)}
							<FerrariParameterControl
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
