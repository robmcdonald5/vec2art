<script lang="ts">
	import {
		Settings2, // For Core Settings
		Brush // For Artistic Effects
	} from 'lucide-svelte';
	import FerrariParameterControl from '$lib/components/ui/FerrariParameterControl.svelte';
	import ParameterSectionAdvanced from '$lib/components/ui/ParameterSectionAdvanced.svelte';
	import PreprocessingSection from './PreprocessingSection.svelte';
	import { algorithmConfigStore } from '$lib/stores/algorithm-config-store.svelte';
	import { CENTERLINE_METADATA } from '$lib/types/algorithm-configs';

	interface Props {
		disabled?: boolean;
	}

	let { disabled = false }: Props = $props();

	// Section expansion states
	let preprocessingExpanded = $state(true);
	let layerProcessingExpanded = $state(false);
	let colorOptionsExpanded = $state(false);
	let artisticExpanded = $state(false);

	// Get config from store
	const config = $derived(algorithmConfigStore.centerline) as any;

	// Handle parameter changes
	function handleParameterChange(name: string, value: any) {
		console.log('[CenterlineParameterPanel] Updating parameter:', name, 'to value:', value);

		// Apply hand-drawn preset values when preset changes
		if (name === 'handDrawnPreset') {
			console.log('[CenterlineParameterPanel] Applying hand-drawn preset:', value);
			algorithmConfigStore.applyHandDrawnPreset(value);
		} else {
			algorithmConfigStore.updateConfig('centerline', { [name]: value });
		}
	}

	// Check if a parameter should be visible based on its full dependency chain
	function isParameterVisible(param: string): boolean {
		const metadata = CENTERLINE_METADATA[param];
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

	// Group parameters by category (excluding preprocessing which is handled by shared component)
	const layerProcessingParams = ['passCount', 'minBranchLength', 'enableAdaptiveThreshold', 'enableWidthModulation', 'widthMultiplier'];
	const colorOptionsParams = ['linePreserveColors', 'lineColorAccuracy', 'maxColorsPerPath', 'colorTolerance'];
	const artisticParams = ['handDrawnPreset', 'handDrawnVariableWeights', 'handDrawnTremorStrength', 'handDrawnTapering'];
</script>

<div class="space-y-4">
	<!-- Preprocessing (shared component) -->
	<PreprocessingSection
		{config}
		metadata={CENTERLINE_METADATA}
		onParameterChange={handleParameterChange}
		{disabled}
		expanded={preprocessingExpanded}
		onToggle={() => (preprocessingExpanded = !preprocessingExpanded)}
	/>

	<!-- Layer Processing -->
	<ParameterSectionAdvanced
		title="Layer Processing"
		icon={Settings2}
		iconColorClass="text-blue-600 dark:text-blue-400"
		backgroundGradient="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
		expanded={layerProcessingExpanded}
		onToggle={() => (layerProcessingExpanded = !layerProcessingExpanded)}
		parameters={layerProcessingParams}
		{config}
		metadata={CENTERLINE_METADATA}
		onParameterChange={handleParameterChange}
		{isParameterVisible}
		{disabled}
	/>

	<!-- Color Options -->
	<ParameterSectionAdvanced
		title="Color Options"
		icon={Brush}
		iconColorClass="text-orange-600 dark:text-orange-400"
		backgroundGradient="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20"
		expanded={colorOptionsExpanded}
		onToggle={() => (colorOptionsExpanded = !colorOptionsExpanded)}
		parameters={colorOptionsParams}
		{config}
		metadata={CENTERLINE_METADATA}
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
		metadata={CENTERLINE_METADATA}
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
					metadata={CENTERLINE_METADATA[param]}
					onChange={(value) => handleParameterChange(param, value)}
					{disabled}
				/>
			{:else if CENTERLINE_METADATA[param] && isParameterVisible(param)}
				<FerrariParameterControl
					name={param}
					value={config[param]}
					metadata={CENTERLINE_METADATA[param]}
					onChange={(value) => handleParameterChange(param, value)}
					{disabled}
				/>
			{/if}
		{/each}
	</ParameterSectionAdvanced>
</div>
