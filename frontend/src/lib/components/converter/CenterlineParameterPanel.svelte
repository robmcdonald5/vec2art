<script lang="ts">
	import {
		Settings2, // For Core Settings
		Brush, // For Artistic Effects
		Sparkles // For Advanced Settings
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
	let advancedExpanded = $state(false);

	// Get config from store
	const config = $derived(algorithmConfigStore.centerline) as any;

	// Handle parameter changes
	function handleParameterChange(name: string, value: any) {
		algorithmConfigStore.updateConfig('centerline', { [name]: value });
	}

	// Check if a parameter should be visible based on its full dependency chain
	function isParameterVisible(param: string): boolean {
		const metadata = CENTERLINE_METADATA[param];
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

	// Group parameters by category (excluding preprocessing which is handled by shared component)
	const layerProcessingParams = ['passCount', 'minBranchLength', 'enableAdaptiveThreshold', 'enableWidthModulation', 'widthMultiplier'];
	const colorOptionsParams = ['linePreserveColors', 'lineColorAccuracy', 'maxColorsPerPath', 'colorTolerance'];
	const advancedParams = ['handDrawnPreset', 'handDrawnVariableWeights', 'handDrawnTremorStrength', 'handDrawnTapering'];
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

	<!-- Advanced Settings -->
	<ParameterSectionAdvanced
		title="Advanced Settings"
		icon={Sparkles}
		iconColorClass="text-purple-600 dark:text-purple-400"
		backgroundGradient="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
		expanded={advancedExpanded}
		onToggle={() => (advancedExpanded = !advancedExpanded)}
		parameters={advancedParams}
		{config}
		metadata={CENTERLINE_METADATA}
		onParameterChange={handleParameterChange}
		{isParameterVisible}
		{disabled}
	/>
</div>
