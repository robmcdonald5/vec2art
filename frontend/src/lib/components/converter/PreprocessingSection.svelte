<script lang="ts">
	import { Filter } from 'lucide-svelte';
	import ParameterSectionAdvanced from '$lib/components/ui/ParameterSectionAdvanced.svelte';
	import type { ParameterMetadata } from '$lib/types/algorithm-configs';

	interface Props {
		config: any;
		metadata: Record<string, ParameterMetadata>;
		onParameterChange: (name: string, value: any) => void;
		disabled?: boolean;
		expanded?: boolean;
		onToggle?: () => void;
	}

	let {
		config,
		metadata,
		onParameterChange,
		disabled = false,
		expanded = false,
		onToggle
	}: Props = $props();

	// Preprocessing parameters (universal for all algorithms)
	// Only include main controls - sub-controls are handled by custom renderers
	const preprocessingParams = ['noiseFiltering', 'enableBackgroundRemoval'];

	// Custom parameter rendering configurations for preprocessing
	const preprocessingCustomRenderers = {
		noiseFiltering: {
			type: 'checkbox-with-sub-controls',
			label: 'Noise Filtering',
			tooltip:
				'Apply bilateral filter to reduce image noise before processing. Helps create cleaner results from noisy photos.',
			subControls: ['noiseFilterSpatialSigma', 'noiseFilterRangeSigma']
		},
		enableBackgroundRemoval: {
			type: 'checkbox-with-sub-controls',
			label: 'Background Removal',
			tooltip:
				'Automatically removes background from images using advanced segmentation algorithms. Useful for isolating foreground objects.',
			subControls: ['backgroundRemovalAlgorithm', 'backgroundRemovalStrength']
		}
	};

	// Check if a parameter should be visible based on its dependency chain
	function isParameterVisible(param: string): boolean {
		const paramMetadata = metadata[param];
		if (!paramMetadata || !paramMetadata.dependsOn) {
			return true; // No dependencies, always visible
		}

		// Check immediate dependency
		const immediateParent = paramMetadata.dependsOn;
		if (!config[immediateParent]) {
			return false; // Immediate parent is disabled
		}

		// Recursively check parent dependencies to ensure the full chain is enabled
		return isParameterVisible(immediateParent);
	}
</script>

<ParameterSectionAdvanced
	title="Preprocessing"
	icon={Filter}
	iconColorClass="text-blue-600 dark:text-blue-400"
	backgroundGradient="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
	{expanded}
	{onToggle}
	parameters={preprocessingParams}
	{config}
	{metadata}
	{onParameterChange}
	{isParameterVisible}
	{disabled}
	customParameterRenderer={preprocessingCustomRenderers}
/>
