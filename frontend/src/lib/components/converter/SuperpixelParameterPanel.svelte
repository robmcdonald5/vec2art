<script lang="ts">
	import {
		Grid3x3, // For Region Properties
		Brush, // For Style Options
		Palette, // For Color Options
		Settings // For Advanced Settings
	} from 'lucide-svelte';
	import ParameterSectionAdvanced from '$lib/components/ui/ParameterSectionAdvanced.svelte';
	import PreprocessingSection from './PreprocessingSection.svelte';
	import { algorithmConfigStore } from '$lib/stores/algorithm-config-store.svelte';
	import { SUPERPIXEL_METADATA } from '$lib/types/algorithm-configs';

	interface Props {
		disabled?: boolean;
	}

	let { disabled = false }: Props = $props();

	// Section expansion states
	let preprocessingExpanded = $state(false);
	let coreExpanded = $state(true);
	let styleExpanded = $state(false);
	let colorExpanded = $state(false);
	let advancedExpanded = $state(false);

	// Get config from store
	const config = $derived(algorithmConfigStore.superpixel) as any;

	// Handle parameter changes
	function handleParameterChange(name: string, value: any) {
		const updates: any = { [name]: value };

		// Handle color preserve checkbox sync
		if (name === 'superpixelPreserveColors') {
			updates.preserveColors = value; // Sync with base property
		}

		algorithmConfigStore.updateConfig('superpixel', updates);
	}

	// Group parameters by category
	const coreParams = ['regionCount', 'compactness'];
	const styleParams = ['strokeWidth', 'polygonMode', 'simplifyTolerance'];
	const colorParams = ['superpixelPreserveColors'];
	const advancedParams = ['iterations', 'colorImportance', 'spatialImportance', 'minRegionSize', 'mergeThreshold', 'enhanceEdges', 'preserveBoundaries'];

	// Parameter visibility logic - handles dependencies
	function isParameterVisible(param: string): boolean {
		const metadata = SUPERPIXEL_METADATA[param];

		// Check dependency chain for parameters
		if (metadata?.dependsOn) {
			// Check immediate dependency
			const immediateParent = metadata.dependsOn;
			if (!config[immediateParent]) {
				return false; // Immediate parent is disabled
			}

			// Recursively check parent dependencies to ensure the full chain is enabled
			return isParameterVisible(immediateParent);
		}

		return true; // Parameters without dependencies are always visible
	}
</script>

<div class="space-y-4">
	<!-- Preprocessing -->
	<PreprocessingSection
		{config}
		metadata={SUPERPIXEL_METADATA}
		onParameterChange={handleParameterChange}
		{disabled}
		expanded={preprocessingExpanded}
		onToggle={() => (preprocessingExpanded = !preprocessingExpanded)}
	/>

	<!-- Region Properties -->
	<ParameterSectionAdvanced
		title="Region Properties"
		icon={Grid3x3}
		iconColorClass="text-purple-600 dark:text-purple-400"
		backgroundGradient="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
		expanded={coreExpanded}
		onToggle={() => (coreExpanded = !coreExpanded)}
		parameters={coreParams}
		{config}
		metadata={SUPERPIXEL_METADATA}
		onParameterChange={handleParameterChange}
		{isParameterVisible}
		{disabled}
	/>

	<!-- Style Options -->
	<ParameterSectionAdvanced
		title="Style Options"
		icon={Brush}
		iconColorClass="text-pink-600 dark:text-pink-400"
		backgroundGradient="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20"
		expanded={styleExpanded}
		onToggle={() => (styleExpanded = !styleExpanded)}
		parameters={styleParams}
		{config}
		metadata={SUPERPIXEL_METADATA}
		onParameterChange={handleParameterChange}
		{isParameterVisible}
		{disabled}
	/>

	<!-- Color Options -->
	<ParameterSectionAdvanced
		title="Color Options"
		icon={Palette}
		iconColorClass="text-orange-600 dark:text-orange-400"
		backgroundGradient="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20"
		expanded={colorExpanded}
		onToggle={() => (colorExpanded = !colorExpanded)}
		parameters={colorParams}
		{config}
		metadata={SUPERPIXEL_METADATA}
		onParameterChange={handleParameterChange}
		{isParameterVisible}
		{disabled}
	/>

	<!-- Advanced Settings -->
	<ParameterSectionAdvanced
		title="Advanced Settings"
		icon={Settings}
		iconColorClass="text-gray-600 dark:text-gray-400"
		backgroundGradient="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20"
		expanded={advancedExpanded}
		onToggle={() => (advancedExpanded = !advancedExpanded)}
		parameters={advancedParams}
		{config}
		metadata={SUPERPIXEL_METADATA}
		onParameterChange={handleParameterChange}
		{isParameterVisible}
		{disabled}
	/>
</div>
