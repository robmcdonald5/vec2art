<script lang="ts">
	import {
		Settings2, // For Core Settings
		Cpu, // For Processing
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
	let coreExpanded = $state(false);
	let processingExpanded = $state(false);
	let artisticExpanded = $state(false);
	let advancedExpanded = $state(false);

	// Get config from store
	const config = $derived(algorithmConfigStore.centerline) as any;

	// Handle parameter changes
	function handleParameterChange(name: string, value: any) {
		algorithmConfigStore.updateConfig('centerline', { [name]: value });
	}

	// Group parameters by category (excluding preprocessing which is handled by shared component)
	const coreParams = ['strokeWidth', 'minPathLength', 'maxIterations'];
	const processingParams = ['morphRadius', 'pruneThreshold', 'smoothingFactor'];
	const artisticParams = ['simplifyTolerance', 'cornerThreshold'];
	const advancedParams = ['preserveDetails', 'connectComponents', 'removeIsolated'];
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

	<!-- Core Settings -->
	<ParameterSectionAdvanced
		title="Core Settings"
		icon={Settings2}
		iconColorClass="text-blue-600 dark:text-blue-400"
		expanded={coreExpanded}
		onToggle={() => (coreExpanded = !coreExpanded)}
		{disabled}
	>
		<div class="space-y-4">
			{#each coreParams as param}
				{#if CENTERLINE_METADATA[param]}
					<FerrariParameterControl
						name={param}
						value={config[param]}
						metadata={CENTERLINE_METADATA[param]}
						onChange={(value) => handleParameterChange(param, value)}
						{disabled}
					/>
				{/if}
			{/each}
		</div>
	</ParameterSectionAdvanced>

	<!-- Processing -->
	<ParameterSectionAdvanced
		title="Processing"
		icon={Cpu}
		iconColorClass="text-green-600 dark:text-green-400"
		expanded={processingExpanded}
		onToggle={() => (processingExpanded = !processingExpanded)}
		{disabled}
	>
		<div class="space-y-4">
			{#each processingParams as param}
				{#if CENTERLINE_METADATA[param]}
					<FerrariParameterControl
						name={param}
						value={config[param]}
						metadata={CENTERLINE_METADATA[param]}
						onChange={(value) => handleParameterChange(param, value)}
						{disabled}
					/>
				{/if}
			{/each}
		</div>
	</ParameterSectionAdvanced>

	<!-- Artistic Effects -->
	<ParameterSectionAdvanced
		title="Artistic Effects"
		icon={Brush}
		iconColorClass="text-orange-600 dark:text-orange-400"
		expanded={artisticExpanded}
		onToggle={() => (artisticExpanded = !artisticExpanded)}
		{disabled}
	>
		<div class="space-y-4">
			{#each artisticParams as param}
				{#if CENTERLINE_METADATA[param]}
					<FerrariParameterControl
						name={param}
						value={config[param]}
						metadata={CENTERLINE_METADATA[param]}
						onChange={(value) => handleParameterChange(param, value)}
						{disabled}
					/>
				{/if}
			{/each}
		</div>
	</ParameterSectionAdvanced>

	<!-- Advanced Settings -->
	<ParameterSectionAdvanced
		title="Advanced Settings"
		icon={Sparkles}
		iconColorClass="text-purple-600 dark:text-purple-400"
		expanded={advancedExpanded}
		onToggle={() => (advancedExpanded = !advancedExpanded)}
		{disabled}
	>
		<div class="space-y-4">
			{#each advancedParams as param}
				{#if CENTERLINE_METADATA[param]}
					<FerrariParameterControl
						name={param}
						value={config[param]}
						metadata={CENTERLINE_METADATA[param]}
						onChange={(value) => handleParameterChange(param, value)}
						{disabled}
					/>
				{/if}
			{/each}
		</div>
	</ParameterSectionAdvanced>
</div>
