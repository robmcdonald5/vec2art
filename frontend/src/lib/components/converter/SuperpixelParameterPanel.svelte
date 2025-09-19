<script lang="ts">
	import {
		Square, // For Pixel Properties
		Palette, // For Color Options
		Layers // For Layer Processing
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
	let styleExpanded = $state(false);
	let colorExpanded = $state(false);
	let advancedExpanded = $state(false);

	// Get config from store
	const config = $derived(algorithmConfigStore.superpixel) as any;

	// Handle parameter changes
	function handleParameterChange(name: string, value: any) {
		const updates: any = { [name]: value };

		// No need to sync preserveColors - each algorithm has its own color preserve setting
		// The config transformer handles the mapping appropriately

		algorithmConfigStore.updateCurrentConfig(updates);
	}

	// Group parameters by category
	const _coreParams = []; // Empty - Region Count is in Quick Settings
	const styleParams = ['polygonMode', 'simplifyTolerance'];
	const colorParams = [
		'superpixelPreserveColors',
		'superpixelColorAccuracy',
		'superpixelMaxColorsPerRegion',
		'superpixelColorTolerance',
		'superpixelColorSampling',
		'enablePaletteReduction',
		'paletteTargetColors',
		'paletteMethod',
		'paletteDithering'
	];
	const advancedParams = [
		'iterations',
		'colorImportance',
		'spatialImportance',
		'minRegionSize',
		'mergeThreshold',
		'enhanceEdges',
		'preserveBoundaries'
	];

	// Parameter visibility logic - handles dependencies
	function isParameterVisible(param: string): boolean {
		const metadata = SUPERPIXEL_METADATA[param];
		return (
			metadata &&
			(!metadata.dependsOn ||
				(config[metadata.dependsOn] &&
					(metadata.dependsOn ? isParameterVisible(metadata.dependsOn) : true)))
		);
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

	<!-- Pixel Properties -->
	<ParameterSectionAdvanced
		title="Pixel Properties"
		icon={Square}
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

	<!-- Layer Processing -->
	<ParameterSectionAdvanced
		title="Layer Processing"
		icon={Layers}
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
