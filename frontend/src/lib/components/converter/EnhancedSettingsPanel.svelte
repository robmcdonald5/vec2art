<script lang="ts">
	import {
		Settings2,
		Zap,
		RotateCcw,
		ChevronDown,
		ChevronRight,
		Palette,
		Sliders,
		Eye,
		EyeOff
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { vectorizerSettings } from '$lib/stores/vectorizer-settings.svelte';
	// import PresetSelector from "./PresetSelector.svelte";
	import ParameterControl from './ParameterControl.svelte';
	import type { VectorizerConfig } from '$lib/stores/converter-settings.svelte';

	interface Props {
		onConfigChange: (_config: VectorizerConfig) => void;
		disabled?: boolean;
	}

	let { onConfigChange, disabled = false }: Props = $props();

	// Auto-sync configuration changes
	$effect(() => {
		onConfigChange(vectorizerSettings.finalConfig);
	});

	// Get parameter sections for current backend
	let parameterSections = $derived(vectorizerSettings.getParameterSections());

	// Mode indicator styling
	let modeIndicatorClass = $derived(() => {
		switch (vectorizerSettings.mode) {
			case 'preset':
				return 'bg-blue-100 text-blue-700 border-blue-200';
			case 'hybrid':
				return 'bg-purple-100 text-purple-700 border-purple-200';
			case 'manual':
				return 'bg-green-100 text-green-700 border-green-200';
			default:
				return 'bg-gray-100 text-gray-700 border-gray-200';
		}
	});

	let modeDescription = $derived(() => {
		switch (vectorizerSettings.mode) {
			case 'preset':
				return 'Using preset configuration';
			case 'hybrid':
				return 'Preset with custom overrides';
			case 'manual':
				return 'Full manual configuration';
			default:
				return 'Unknown mode';
		}
	});
</script>

<div class="space-y-6">
	<!-- Mode Indicator -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="flex items-center gap-2 rounded-full border px-3 py-1.5 {modeIndicatorClass}">
				<Settings2 class="h-4 w-4" />
				<span class="text-sm font-medium capitalize">{vectorizerSettings.mode} Mode</span>
			</div>
			<span class="text-muted-foreground text-xs">
				{modeDescription}
			</span>
		</div>

		<div class="flex items-center gap-2">
			{#if vectorizerSettings.mode !== 'manual'}
				<Button
					variant="ghost"
					size="sm"
					onclick={() => vectorizerSettings.resetToPreset()}
					{disabled}
					title="Reset to preset defaults"
				>
					<RotateCcw class="h-4 w-4" />
				</Button>
			{/if}

			<Button
				variant="ghost"
				size="sm"
				onclick={() => vectorizerSettings.toggleAdvancedSettings()}
				title="Toggle advanced settings"
			>
				{#if vectorizerSettings.showAdvancedSettings}
					<EyeOff class="h-4 w-4" />
				{:else}
					<Eye class="h-4 w-4" />
				{/if}
			</Button>
		</div>
	</div>

	<!-- Preset Selection Dropdown -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h3 class="text-foreground text-sm font-semibold">Style Presets</h3>
			{#if vectorizerSettings.selectedPreset && vectorizerSettings.mode === 'preset'}
				<Button
					variant="outline"
					size="sm"
					onclick={() => vectorizerSettings.enableHybridMode()}
					{disabled}
				>
					<Sliders class="mr-2 h-4 w-4" />
					Customize
				</Button>
			{/if}
		</div>

		<!-- Preset Dropdown -->
		<div class="space-y-2">
			<select
				class="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:outline-none"
				value={vectorizerSettings.selectedPreset?.metadata.id || ''}
				onchange={(e) => {
					const presetId = e.currentTarget.value;
					if (presetId) {
						import('$lib/presets').then(({ getPresetById }) => {
							const preset = getPresetById(presetId);
							if (preset) vectorizerSettings.selectPreset(preset);
						});
					} else {
						vectorizerSettings.selectPreset(null);
					}
				}}
				{disabled}
			>
				<option value="">Custom Settings</option>
				<optgroup label="Professional">
					<option value="corporate-logo">Corporate Logo</option>
					<option value="technical-drawing">Technical Drawing</option>
				</optgroup>
				<optgroup label="Artistic">
					<option value="hand-drawn-illustration">Hand-Drawn Illustration</option>
					<option value="photo-to-sketch">Photo to Sketch</option>
					<option value="fine-pointillism">Fine Pointillism</option>
				</optgroup>
				<optgroup label="Vintage">
					<option value="vintage-stippling">Vintage Stippling</option>
				</optgroup>
				<optgroup label="Modern">
					<option value="modern-abstract">Modern Abstract</option>
					<option value="minimalist-poster">Minimalist Poster</option>
				</optgroup>
			</select>

			{#if vectorizerSettings.selectedPreset}
				<div class="text-muted-foreground bg-muted/30 rounded p-2 text-xs">
					<strong>{vectorizerSettings.selectedPreset.metadata.name}:</strong>
					{vectorizerSettings.selectedPreset.metadata.description}
				</div>
			{/if}
		</div>

		{#if vectorizerSettings.mode === 'hybrid'}
			<div class="rounded-lg border border-purple-200 bg-purple-50/50 p-3">
				<div class="flex items-center gap-2 text-sm text-purple-700">
					<Zap class="h-4 w-4" />
					<span class="font-medium">Hybrid Mode Active</span>
				</div>
				<p class="mt-1 text-xs text-purple-600">
					Using {vectorizerSettings.selectedPreset?.metadata.name} as base with your custom adjustments
				</p>
			</div>
		{/if}
	</div>

	<!-- Parameter Sections -->
	{#if vectorizerSettings.mode !== 'preset' || vectorizerSettings.showAdvancedSettings}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-foreground text-sm font-semibold">
					{vectorizerSettings.mode === 'hybrid' ? 'Custom Overrides' : 'Manual Parameters'}
				</h3>
				<Button
					variant="ghost"
					size="sm"
					onclick={() => vectorizerSettings.enableManualMode()}
					{disabled}
					class={vectorizerSettings.mode === 'manual' ? 'text-green-600' : ''}
				>
					Full Manual
				</Button>
			</div>

			{#each parameterSections as section (section.id)}
				{@const isExpanded = vectorizerSettings.expandedSections.has(section.id)}

				<div class="overflow-hidden rounded-lg border">
					<button
						class="bg-muted/30 hover:bg-muted/50 flex w-full items-center justify-between px-4 py-3 transition-colors"
						onclick={() => vectorizerSettings.toggleSection(section.id)}
						{disabled}
					>
						<div class="flex items-center gap-3">
							{#if isExpanded}
								<ChevronDown class="text-muted-foreground h-4 w-4" />
							{:else}
								<ChevronRight class="text-muted-foreground h-4 w-4" />
							{/if}
							<div class="text-left">
								<div class="text-foreground text-sm font-medium">{section.title}</div>
								<div class="text-muted-foreground text-xs">{section.description}</div>
							</div>
						</div>
						<div class="text-muted-foreground text-xs">
							{section.parameters.length} parameters
						</div>
					</button>

					{#if isExpanded}
						<div class="bg-background space-y-4 border-t p-4">
							{#each section.parameters as param (param)}
								<ParameterControl
									parameter={param}
									value={vectorizerSettings.finalConfig[param]}
									onChange={(value) => vectorizerSettings.updateParameter(param, value)}
									{disabled}
									showOverride={vectorizerSettings.mode === 'hybrid' &&
										vectorizerSettings.manualOverrides[param] !== undefined}
								/>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Configuration Summary -->
	{#if vectorizerSettings.showAdvancedSettings}
		<div class="bg-muted/20 rounded-lg border p-4">
			<div class="mb-2 flex items-center gap-2">
				<Palette class="text-muted-foreground h-4 w-4" />
				<span class="text-foreground text-sm font-medium">Configuration Summary</span>
			</div>
			<div class="grid grid-cols-2 gap-2 text-xs">
				<div>
					<span class="text-muted-foreground">Backend:</span>
					<span class="ml-1 font-medium capitalize">{vectorizerSettings.finalConfig.backend}</span>
				</div>
				<div>
					<span class="text-muted-foreground">Detail:</span>
					<span class="ml-1 font-medium"
						>{(vectorizerSettings.finalConfig.detail * 100).toFixed(0)}%</span
					>
				</div>
				<div>
					<span class="text-muted-foreground">Multi-pass:</span>
					<span class="ml-1 font-medium"
						>{vectorizerSettings.finalConfig.multipass ? 'Yes' : 'No'}</span
					>
				</div>
				<div>
					<span class="text-muted-foreground">Colors:</span>
					<span class="ml-1 font-medium"
						>{vectorizerSettings.finalConfig.preserve_colors ? 'Preserved' : 'Mono'}</span
					>
				</div>
			</div>
		</div>
	{/if}
</div>
