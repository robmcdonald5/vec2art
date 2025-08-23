<script lang="ts">
	import { Wand2, Pencil, Ruler, Palette, BookOpen, Settings } from 'lucide-svelte';
	import type { VectorizerPreset } from '$lib/types/vectorizer';
	import { PRESET_DESCRIPTIONS, PRESET_CONFIGS } from '$lib/types/vectorizer';
	import { CustomSelect } from '$lib/components/ui/custom-select';

	interface PresetSelectorProps {
		selectedPreset: VectorizerPreset | 'custom';
		onPresetChange: (preset: VectorizerPreset | 'custom') => void;
		disabled?: boolean;
		isCustom?: boolean;
		compact?: boolean;
	}

	let {
		selectedPreset,
		onPresetChange,
		disabled = false,
		isCustom = false,
		compact = false
	}: PresetSelectorProps = $props();

	const presetIcons = {
		sketch: Pencil,
		technical: Ruler,
		artistic: Palette,
		poster: BookOpen,
		comic: Wand2
	} as const;

	const presetTitles = {
		sketch: 'Sketch',
		technical: 'Technical',
		artistic: 'Artistic',
		poster: 'Poster',
		comic: 'Comic'
	} as const;

	const presetUseCases = {
		sketch: ['Photos to sketches', 'Hand-drawn style', 'Natural irregularities'],
		technical: ['Logos & diagrams', 'Precise lines', 'Clean extraction'],
		artistic: ['Pointillism effects', 'Color preservation', 'Creative styling'],
		poster: ['Bold illustrations', 'Color regions', 'Modern graphics'],
		comic: ['Character art', 'Strong effects', 'Expressive lines']
	} as const;

	function handlePresetClick(preset: VectorizerPreset | 'custom') {
		if (!disabled) {
			onPresetChange(preset);
		}
	}

	const allPresets = [...(Object.keys(presetIcons) as VectorizerPreset[]), 'custom' as const];
</script>

{#if compact}
	<!-- Compact Mode: Dropdown Selection -->
	<div class="space-y-2">
		<CustomSelect
			value={selectedPreset}
			options={allPresets.map((preset) => ({
				value: preset,
				label: preset === 'custom' ? 'Custom Settings' : presetTitles[preset as VectorizerPreset]
			}))}
			onchange={(value) => handlePresetClick(value as VectorizerPreset | 'custom')}
			{disabled}
			placeholder="Select a preset"
		/>

		<p class="text-converter-secondary text-xs">
			{#if selectedPreset === 'custom'}
				Fine-tuned custom settings
			{:else}
				{PRESET_DESCRIPTIONS[selectedPreset as VectorizerPreset]}
			{/if}
		</p>
	</div>
{:else}
	<!-- Full Mode: Card Selection -->
	<section class="space-y-4" aria-labelledby="preset-selector-heading">
		<div class="flex items-center gap-2">
			<Wand2 class="text-primary h-5 w-5" aria-hidden="true" />
			<h3 id="preset-selector-heading" class="text-lg font-semibold">Style Presets</h3>
		</div>

		<p class="text-muted-foreground text-sm">
			Quick start with optimized settings for common use cases, or create custom settings.
		</p>

		<div
			class="grid gap-2 sm:grid-cols-2 lg:grid-cols-1"
			role="radiogroup"
			aria-labelledby="preset-selector-heading"
		>
			{#each allPresets as preset (preset)}
				{@const isSelected = selectedPreset === preset}
				{@const isCustomPreset = preset === 'custom'}

				<button
					class="group focus:ring-primary relative flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 hover:shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none
					{isSelected
						? 'border-primary bg-primary/5 shadow-sm'
						: 'border-border hover:border-primary/50 hover:bg-accent/50'} 
					{disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
					onclick={() => handlePresetClick(preset)}
					role="radio"
					aria-checked={isSelected}
					aria-describedby="preset-{preset}-desc"
					{disabled}
				>
					<!-- Icon -->
					<div
						class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg
					{isSelected
							? 'bg-primary text-primary-foreground'
							: 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'} 
					transition-colors duration-200"
					>
						{#if !isCustomPreset}
							{@const PresetIcon = presetIcons[preset as VectorizerPreset]}
							<PresetIcon class="h-5 w-5" aria-hidden="true" />
						{:else}
							<Settings class="h-5 w-5" aria-hidden="true" />
						{/if}
					</div>

					<!-- Content -->
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<h4 class="text-sm font-semibold {isSelected ? 'text-primary' : 'text-foreground'}">
								{#if !isCustomPreset}
									{presetTitles[preset as VectorizerPreset]}
								{:else}
									Custom
								{/if}
							</h4>
							{#if isSelected}
								<div
									class="bg-primary h-2 w-2 flex-shrink-0 rounded-full"
									aria-label="Selected"
									role="img"
								></div>
							{/if}
						</div>

						<p id="preset-{preset}-desc" class="text-muted-foreground mt-1 line-clamp-1 text-xs">
							{#if !isCustomPreset}
								{PRESET_DESCRIPTIONS[preset as VectorizerPreset]}
							{:else}
								Fine-tune all parameters for your specific needs
							{/if}
						</p>

						<!-- Use Cases -->
						{#if !isCustomPreset}
							<div class="mt-2 flex flex-wrap gap-1">
								{#each presetUseCases[preset as VectorizerPreset] as useCase (useCase)}
									<span
										class="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium
									{isSelected
											? 'bg-primary/10 text-primary'
											: 'bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary/80'}
									transition-colors duration-200"
									>
										{useCase}
									</span>
								{/each}
							</div>
						{:else if isCustom}
							<div class="mt-2 flex items-center gap-1">
								<span
									class="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300"
								>
									Settings modified
								</span>
							</div>
						{/if}
					</div>

					<!-- Selection Indicator -->
					{#if isSelected}
						<div
							class="border-primary pointer-events-none absolute inset-0 rounded-lg border-2 opacity-20"
							aria-hidden="true"
						></div>
					{/if}
				</button>
			{/each}
		</div>

		<!-- Preset Details -->
		{#if selectedPreset && selectedPreset !== 'custom'}
			{@const config = PRESET_CONFIGS[selectedPreset]}
			{@const SelectedIcon = presetIcons[selectedPreset]}
			<div
				class="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/50"
				role="status"
				aria-live="polite"
			>
				<div class="flex items-start gap-2">
					<div
						class="flex h-6 w-6 items-center justify-center rounded bg-green-100 dark:bg-green-900"
					>
						<SelectedIcon
							class="h-3.5 w-3.5 text-green-600 dark:text-green-400"
							aria-hidden="true"
						/>
					</div>
					<div class="flex-1">
						<p class="text-sm font-medium text-green-700 dark:text-green-300">
							{presetTitles[selectedPreset]} Preset Active
						</p>
						<div class="mt-1 space-y-1 text-xs text-green-600 dark:text-green-400">
							<p>
								Algorithm: <span class="font-medium capitalize"
									>{config.backend?.replace('_', ' ')}</span
								>
							</p>
							{#if config.detail !== undefined}
								<p>Detail: <span class="font-medium">{Math.round(config.detail * 10)}/10</span></p>
							{/if}
							{#if config.hand_drawn_preset}
								<p>Style: <span class="font-medium capitalize">{config.hand_drawn_preset}</span></p>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{:else if selectedPreset === 'custom'}
			<div
				class="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/50"
				role="status"
				aria-live="polite"
			>
				<div class="flex items-start gap-2">
					<div
						class="flex h-6 w-6 items-center justify-center rounded bg-amber-100 dark:bg-amber-900"
					>
						<Settings class="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
					</div>
					<div class="flex-1">
						<p class="text-sm font-medium text-amber-700 dark:text-amber-300">
							Custom Configuration
						</p>
						<p class="mt-1 text-xs text-amber-600 dark:text-amber-400">
							You can fine-tune all parameters below. Changes will automatically switch to custom
							mode.
						</p>
					</div>
				</div>
			</div>
		{/if}
	</section>
{/if}

<style>
	.line-clamp-1 {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
