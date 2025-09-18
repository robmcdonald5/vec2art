<script lang="ts">
	import {
		Layers, // For Dot Geometry
		Brush, // For Dot Style
		Palette, // For Color Options
		Settings // For Advanced Settings
	} from 'lucide-svelte';
	import ParameterSectionAdvanced from '$lib/components/ui/ParameterSectionAdvanced.svelte';
	import PreprocessingSection from './PreprocessingSection.svelte';
	import { algorithmConfigStore } from '$lib/stores/algorithm-config-store.svelte';
	import { DOTS_METADATA } from '$lib/types/algorithm-configs';

	interface Props {
		disabled?: boolean;
	}

	let { disabled = false }: Props = $props();

	// Section expansion states
	let preprocessingExpanded = $state(false);
	let coreExpanded = $state(true);
	let dotStyleExpanded = $state(false);
	let colorExpanded = $state(false);
	let advancedExpanded = $state(false);

	// Get config from store
	const config = $derived(algorithmConfigStore.dots) as any;

	// Handle parameter changes with alias synchronization and cross-point clamping
	function handleParameterChange(name: string, value: any) {
		const updates: any = { [name]: value };

		// Handle three-way mutual exclusion for dot sizing modes
		if (name === 'dotSizingMode') {
			// Set the appropriate flags based on the selected mode
			switch (value) {
				case 'adaptive':
					updates.adaptiveSizing = true;
					updates.dotAdaptiveSizing = true;
					updates.dotGradientBasedSizing = false;
					updates.sizeVariation = 0;
					updates.dotSizeVariation = 0;
					break;
				case 'gradient':
					updates.adaptiveSizing = false;
					updates.dotAdaptiveSizing = false;
					updates.dotGradientBasedSizing = true;
					updates.sizeVariation = 0;
					updates.dotSizeVariation = 0;
					break;
				case 'static':
					updates.adaptiveSizing = false;
					updates.dotAdaptiveSizing = false;
					updates.dotGradientBasedSizing = false;
					// Keep current size variation value or set to 0.3 if currently 0
					if (config.sizeVariation === 0) {
						updates.sizeVariation = 0.3;
						updates.dotSizeVariation = 0.3;
					}
					break;
			}
		}

		// Synchronize aliases to keep both UI and base properties in sync
		switch (name) {
			case 'dotDensity':
				// Map UI scale (1-10) to threshold (0.02-0.4)
				// Higher UI value = lower threshold = more dots
				updates.dotDensityThreshold = 0.4 - ((value - 1) / 9) * (0.4 - 0.02);
				break;
			case 'minRadius':
				updates.dotMinRadius = value;
				// Cross-point clamping: ensure min is always < max
				if (value >= config.maxRadius) {
					updates.maxRadius = value + 0.1; // At least 0.1 units above min
					updates.dotMaxRadius = value + 0.1;
				}
				// Also update strokeWidth to reflect the change
				updates.strokeWidth = value / 0.3; // Reverse of the derivation formula
				break;
			case 'maxRadius':
				updates.dotMaxRadius = value;
				// Cross-point clamping: ensure max is always > min
				if (value <= config.minRadius) {
					updates.minRadius = Math.max(0.1, value - 0.1); // At least 0.1 units below max, but not below 0.1
					updates.dotMinRadius = Math.max(0.1, value - 0.1);
				}
				// Also update strokeWidth to reflect the change
				updates.strokeWidth = value / 1.5; // Reverse of the derivation formula
				break;
			case 'dotMinRadius':
				updates.minRadius = value;
				// Cross-point clamping: ensure min is always < max
				if (value >= config.dotMaxRadius) {
					updates.maxRadius = value + 0.1;
					updates.dotMaxRadius = value + 0.1;
				}
				updates.strokeWidth = value / 0.3;
				break;
			case 'dotMaxRadius':
				updates.maxRadius = value;
				// Cross-point clamping: ensure max is always > min
				if (value <= config.dotMinRadius) {
					updates.minRadius = Math.max(0.1, value - 0.1);
					updates.dotMinRadius = Math.max(0.1, value - 0.1);
				}
				updates.strokeWidth = value / 1.5;
				break;
			case 'sizeVariation':
				updates.dotSizeVariation = value;
				break;
			case 'dotSizeVariation':
				updates.sizeVariation = value;
				break;
		}

		algorithmConfigStore.updateConfig('dots', updates);
	}

	// Group parameters by category - using actual DOTS_METADATA keys
	const coreParams = ['minRadius', 'maxRadius', 'dotSizingMode', 'sizeVariation'];
	const dotStyleParams = ['dotShape'];
	const colorParams = ['dotPreserveColors', 'dotBackgroundTolerance', 'dotOpacity'];
	const advancedParams = ['dotGridPattern', 'dotPoissonDiskSampling'];

	// Parameter visibility logic - Size Variation only shows when Static Sizing is selected
	function isParameterVisible(param: string): boolean {
		if (param === 'sizeVariation') {
			return config.dotSizingMode === 'static'; // Only show size variation for static sizing
		}
		return true; // All other parameters are always visible
	}
</script>

<div class="space-y-4">
	<!-- Preprocessing -->
	<PreprocessingSection
		{config}
		metadata={DOTS_METADATA}
		onParameterChange={handleParameterChange}
		{disabled}
		expanded={preprocessingExpanded}
		onToggle={() => (preprocessingExpanded = !preprocessingExpanded)}
	/>

	<!-- Dot Geometry -->
	<ParameterSectionAdvanced
		title="Dot Geometry"
		icon={Layers}
		iconColorClass="text-blue-600 dark:text-blue-400"
		backgroundGradient="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
		expanded={coreExpanded}
		onToggle={() => (coreExpanded = !coreExpanded)}
		parameters={coreParams}
		{config}
		metadata={DOTS_METADATA}
		onParameterChange={handleParameterChange}
		{isParameterVisible}
		{disabled}
	/>

	<!-- Dot Style -->
	<ParameterSectionAdvanced
		title="Dot Style"
		icon={Brush}
		iconColorClass="text-purple-600 dark:text-purple-400"
		backgroundGradient="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
		expanded={dotStyleExpanded}
		onToggle={() => (dotStyleExpanded = !dotStyleExpanded)}
		parameters={dotStyleParams}
		{config}
		metadata={DOTS_METADATA}
		onParameterChange={handleParameterChange}
		{disabled}
	/>

	<!-- Color Options -->
	<ParameterSectionAdvanced
		title="Color Options"
		icon={Palette}
		iconColorClass="text-pink-600 dark:text-pink-400"
		backgroundGradient="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20"
		expanded={colorExpanded}
		onToggle={() => (colorExpanded = !colorExpanded)}
		parameters={colorParams}
		{config}
		metadata={DOTS_METADATA}
		onParameterChange={handleParameterChange}
		{disabled}
	/>

	<!-- Advanced Settings -->
	<ParameterSectionAdvanced
		title="Advanced Settings"
		icon={Settings}
		iconColorClass="text-emerald-600 dark:text-emerald-400"
		backgroundGradient="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20"
		expanded={advancedExpanded}
		onToggle={() => (advancedExpanded = !advancedExpanded)}
		parameters={advancedParams}
		{config}
		metadata={DOTS_METADATA}
		onParameterChange={handleParameterChange}
		{disabled}
	/>
</div>
