<script lang="ts">
	import {
		Layers, // For Core Settings
		Brush, // For Dot Style
		Palette, // For Color Options
		Settings // For Advanced Settings
	} from 'lucide-svelte';
	import ParameterSectionAdvanced from '$lib/components/ui/ParameterSectionAdvanced.svelte';
	import { algorithmConfigStore } from '$lib/stores/algorithm-config-store.svelte';
	import { DOTS_METADATA } from '$lib/types/algorithm-configs';

	interface Props {
		disabled?: boolean;
	}

	let { disabled = false }: Props = $props();

	// Section expansion states
	let coreExpanded = $state(true);
	let dotStyleExpanded = $state(false);
	let colorExpanded = $state(false);
	let advancedExpanded = $state(false);

	// Get config from store
	const config = $derived(algorithmConfigStore.dots) as any;

	// Handle parameter changes with alias synchronization and cross-point clamping
	function handleParameterChange(name: string, value: any) {
		const updates: any = { [name]: value };

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
			case 'adaptiveSizing':
				updates.dotAdaptiveSizing = value;
				break;
			case 'dotAdaptiveSizing':
				updates.adaptiveSizing = value;
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
	const coreParams = ['minRadius', 'maxRadius'];
	const dotStyleParams = ['dotShape', 'adaptiveSizing', 'sizeVariation', 'dotAdaptiveSizing'];
	const colorParams = ['dotPreserveColors', 'dotBackgroundTolerance', 'dotOpacity'];
	const advancedParams = ['dotGridPattern', 'dotPoissonDiskSampling', 'dotGradientBasedSizing'];
</script>

<div class="space-y-4">
	<!-- Core Settings -->
	<ParameterSectionAdvanced
		title="Core Settings"
		icon={Layers}
		iconColorClass="text-blue-600 dark:text-blue-400"
		backgroundGradient="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
		expanded={coreExpanded}
		onToggle={() => (coreExpanded = !coreExpanded)}
		parameters={coreParams}
		{config}
		metadata={DOTS_METADATA}
		onParameterChange={handleParameterChange}
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
