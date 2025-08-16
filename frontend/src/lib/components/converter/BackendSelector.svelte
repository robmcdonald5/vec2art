<script lang="ts">
	import { Settings, PenTool, Palette, Grid, Sparkles } from 'lucide-svelte';
	import type { VectorizerBackend } from '$lib/types/vectorizer';
	import { BACKEND_DESCRIPTIONS } from '$lib/types/vectorizer';
	import CustomSelect from '$lib/components/ui/custom-select.svelte';

	interface BackendSelectorProps {
		selectedBackend: VectorizerBackend;
		onBackendChange: (backend: VectorizerBackend) => void;
		disabled?: boolean;
		compact?: boolean;
	}

	let { selectedBackend, onBackendChange, disabled = false, compact = false }: BackendSelectorProps = $props();

	const backendIcons = {
		edge: PenTool,
		centerline: Settings,
		superpixel: Grid,
		dots: Sparkles
	} as const;

	const backendTitles = {
		edge: 'Edge Tracing',
		centerline: 'Centerline',
		superpixel: 'Superpixel',
		dots: 'Stippling'
	} as const;

	const backendFeatures = {
		edge: ['Line art', 'Edge detection', 'Multi-pass', 'Hand-drawn style'],
		centerline: ['Skeleton extraction', 'Precise lines', 'Shape analysis', 'Technical drawings'],
		superpixel: ['Color regions', 'Artistic style', 'Bold shapes', 'Poster effects'],
		dots: ['Stippling', 'Pointillism', 'Color preservation', 'Texture effects']
	} as const;

	function handleBackendClick(backend: VectorizerBackend) {
		if (!disabled) {
			onBackendChange(backend);
		}
	}
</script>

{#if compact}
	<!-- Compact Mode: Dropdown Selection -->
	<div class="space-y-2">
		<CustomSelect
			value={selectedBackend}
			options={Object.keys(backendIcons).map(backend => ({
				value: backend,
				label: backendTitles[backend as VectorizerBackend]
			}))}
			onchange={(value) => handleBackendClick(value as VectorizerBackend)}
			{disabled}
			placeholder="Select an algorithm"
		/>
		
		<p class="text-xs text-muted-foreground">
			{BACKEND_DESCRIPTIONS[selectedBackend]}
		</p>
	</div>
{:else}
	<!-- Full Mode: Card Selection -->
	<section class="space-y-4" aria-labelledby="backend-selector-heading">
		<div class="flex items-center gap-2">
			<Palette class="text-primary h-5 w-5" aria-hidden="true" />
			<h3 id="backend-selector-heading" class="text-lg font-semibold">Processing Algorithm</h3>
		</div>

		<p class="text-muted-foreground text-sm">
			Choose the processing algorithm that best fits your image style and desired output.
		</p>

		<div
			class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
			role="radiogroup"
			aria-labelledby="backend-selector-heading"
		>
		{#each Object.keys(backendIcons) as backend (backend)}
			{@const BackendIcon = backendIcons[backend as VectorizerBackend]}
			{@const isSelected = selectedBackend === backend}

			<button
				class="group focus:ring-primary relative flex min-h-[120px] flex-col items-start gap-3 rounded-lg border p-4 text-left transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:outline-none
					{isSelected
					? 'border-primary bg-primary/5 shadow-sm'
					: 'border-border hover:border-primary/50 hover:bg-accent/50'} 
					{disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
				onclick={() => handleBackendClick(backend as VectorizerBackend)}
				role="radio"
				aria-checked={isSelected}
				aria-describedby="backend-{backend}-desc"
				{disabled}
			>
				<!-- Header with Icon and Title -->
				<div class="flex w-full items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg
						{isSelected
							? 'bg-primary text-primary-foreground'
							: 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'} 
						transition-colors duration-200"
					>
						<BackendIcon class="h-5 w-5" aria-hidden="true" />
					</div>
					<div class="min-w-0 flex-1">
						<h4 class="text-sm font-semibold {isSelected ? 'text-primary' : 'text-foreground'}">
							{backendTitles[backend as VectorizerBackend]}
						</h4>
					</div>
					{#if isSelected}
						<div
							class="bg-primary h-2 w-2 flex-shrink-0 rounded-full"
							aria-label="Selected"
							role="img"
						></div>
					{/if}
				</div>

				<!-- Description -->
				<p
					id="backend-{backend}-desc"
					class="text-muted-foreground line-clamp-2 text-xs leading-relaxed"
				>
					{BACKEND_DESCRIPTIONS[backend as VectorizerBackend]}
				</p>

				<!-- Feature Tags -->
				<div class="flex flex-wrap gap-1">
					{#each backendFeatures[backend as VectorizerBackend].slice(0, 3) as feature (feature)}
						<span
							class="inline-flex items-center rounded px-2 py-1 text-xs font-medium
							{isSelected
								? 'bg-primary/10 text-primary'
								: 'bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary/80'}
							transition-colors duration-200"
						>
							{feature}
						</span>
					{/each}
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

	<!-- Current Selection Summary -->
	{#if selectedBackend}
		{@const SelectedIcon = backendIcons[selectedBackend]}
		<div
			class="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/50"
			role="status"
			aria-live="polite"
		>
			<div class="flex items-start gap-2">
				<div class="flex h-6 w-6 items-center justify-center rounded bg-blue-100 dark:bg-blue-900">
					<SelectedIcon class="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
				</div>
				<div class="flex-1">
					<p class="text-sm font-medium text-blue-700 dark:text-blue-300">
						Selected: {backendTitles[selectedBackend]}
					</p>
					<div class="mt-1 flex flex-wrap gap-1">
						{#each backendFeatures[selectedBackend] as feature (feature)}
							<span
								class="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300"
							>
								{feature}
							</span>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}
	</section>
{/if}

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
