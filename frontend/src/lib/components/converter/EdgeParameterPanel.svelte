<script lang="ts">
	import {
		// Check, // For checkmark indicators (unused)
		Layers, // For Layer Processing
		Palette, // For Color Controls
		Sparkles, // For Advanced Processing
		Brush // For Artistic Effects
	} from 'lucide-svelte';
	import FerrariParameterControl from '$lib/components/ui/FerrariParameterControl.svelte';
	import ParameterSectionAdvanced from '$lib/components/ui/ParameterSectionAdvanced.svelte';
	import PreprocessingSection from './PreprocessingSection.svelte';
	// import PortalTooltipFixed from '$lib/components/ui/tooltip/PortalTooltipFixed.svelte';
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

		// Special case for handDrawnPreset - should be visible when not 'none'
		if (immediateParent === 'handDrawnPreset') {
			if (config[immediateParent] === 'none') {
				return false; // Hidden when preset is 'none'
			}
		} else {
			// Normal boolean dependency check
			if (!config[immediateParent]) {
				return false; // Immediate parent is disabled
			}
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

		// Ensure multipass features are disabled when pass count is 1
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

	// Group parameters by category (removed preprocessingParams - now handled by shared component)

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

	// Custom parameter rendering configurations (removed preprocessingCustomRenderers - now handled by shared component)

	const layerProcessingCustomRenderers = {
		enableReversePass: {
			type: 'conditional',
			condition: (config: any) => config.passCount > 1
		},
		enableDiagonalPass: {
			type: 'conditional',
			condition: (config: any) => config.passCount > 1
		}
	};
</script>

<div class="space-y-4">
	<!-- Preprocessing -->
	<PreprocessingSection
		{config}
		metadata={EDGE_METADATA}
		onParameterChange={handleParameterChange}
		{disabled}
		expanded={preprocessingExpanded}
		onToggle={() => (preprocessingExpanded = !preprocessingExpanded)}
	/>

	<!-- Layer Processing -->
	<ParameterSectionAdvanced
		title="Layer Processing"
		icon={Layers}
		iconColorClass="text-purple-600 dark:text-purple-400"
		backgroundGradient="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
		expanded={layerProcessingExpanded}
		onToggle={() => (layerProcessingExpanded = !layerProcessingExpanded)}
		parameters={layerProcessingParams}
		{config}
		metadata={EDGE_METADATA}
		onParameterChange={handleParameterChange}
		{isParameterVisible}
		{disabled}
		customParameterRenderer={layerProcessingCustomRenderers}
	/>

	<!-- Color Controls -->
	<ParameterSectionAdvanced
		title="Color Controls"
		icon={Palette}
		iconColorClass="text-pink-600 dark:text-pink-400"
		backgroundGradient="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20"
		expanded={colorControlsExpanded}
		onToggle={() => (colorControlsExpanded = !colorControlsExpanded)}
		parameters={colorControlParams}
		{config}
		metadata={EDGE_METADATA}
		onParameterChange={handleParameterChange}
		{isParameterVisible}
		{disabled}
	/>

	<!-- Advanced Processing -->
	<ParameterSectionAdvanced
		title="Advanced Processing"
		icon={Sparkles}
		iconColorClass="text-emerald-600 dark:text-emerald-400"
		backgroundGradient="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20"
		expanded={advancedExpanded}
		onToggle={() => (advancedExpanded = !advancedExpanded)}
		parameters={advancedParams}
		{config}
		metadata={EDGE_METADATA}
		onParameterChange={handleParameterChange}
		{isParameterVisible}
		{disabled}
	/>

	<!-- Artistic Effects -->
	<ParameterSectionAdvanced
		title="Artistic Effects"
		icon={Brush}
		iconColorClass="text-indigo-600 dark:text-indigo-400"
		backgroundGradient="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20"
		expanded={artisticExpanded}
		onToggle={() => (artisticExpanded = !artisticExpanded)}
		parameters={artisticParams}
		{config}
		metadata={EDGE_METADATA}
		onParameterChange={handleParameterChange}
		{isParameterVisible}
		{disabled}
	>
		<!-- Custom content for artistic effects (preset selector needs special handling) -->
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
			{:else if EDGE_METADATA[param] && isParameterVisible(param)}
				<FerrariParameterControl
					name={param}
					value={config[param]}
					metadata={EDGE_METADATA[param]}
					onChange={(value) => handleParameterChange(param, value)}
					{disabled}
				/>
			{/if}
		{/each}
	</ParameterSectionAdvanced>
</div>
