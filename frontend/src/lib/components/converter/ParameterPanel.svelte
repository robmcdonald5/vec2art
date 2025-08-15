<script lang="ts">
	import { Sliders, Eye, PenTool, Filter } from 'lucide-svelte';
	import type { VectorizerConfig, HandDrawnPreset } from '$lib/types/vectorizer';
	import { HAND_DRAWN_DESCRIPTIONS } from '$lib/types/vectorizer';

	interface ParameterPanelProps {
		config: VectorizerConfig;
		onConfigChange: (updates: Partial<VectorizerConfig>) => void;
		disabled?: boolean;
		onParameterChange?: () => void; // Called when any parameter changes to indicate custom mode
	}

	let {
		config,
		onConfigChange,
		disabled = false,
		onParameterChange
	}: ParameterPanelProps = $props();

	// Convert internal 0.0-1.0 detail to 1-10 UI range
	const detailToUI = (detail: number) => Math.round(detail * 9 + 1);
	const detailFromUI = (uiValue: number) => (uiValue - 1) / 9;

	// Convert internal tremor_strength and variable_weights to UI smoothness (inverted)
	const smoothnessToUI = (config: VectorizerConfig) => {
		const roughness = (config.tremor_strength + config.variable_weights) / 2;
		return Math.round((1 - roughness) * 9 + 1); // Invert: high smoothness = low roughness
	};

	const smoothnessFromUI = (uiValue: number) => {
		const roughness = (10 - uiValue) / 9;
		return roughness * 0.5; // Scale to reasonable range
	};

	function handleDetailChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const uiValue = parseInt(target.value);
		const internalValue = detailFromUI(uiValue);
		onConfigChange({ detail: internalValue });
		onParameterChange?.();
	}

	function handleStrokeWidthChange(event: Event) {
		const target = event.target as HTMLInputElement;
		onConfigChange({ stroke_width: parseFloat(target.value) });
		onParameterChange?.();
	}

	function handleSmoothnessChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const uiValue = parseInt(target.value);
		const roughnessValue = smoothnessFromUI(uiValue);

		onConfigChange({
			tremor_strength: Math.min(0.5, roughnessValue),
			variable_weights: Math.min(1.0, roughnessValue * 2)
		});
		onParameterChange?.();
	}

	function handleHandDrawnChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		onConfigChange({ hand_drawn_preset: target.value as HandDrawnPreset });
		onParameterChange?.();
	}

	function handleNoiseFilteringChange(event: Event) {
		const target = event.target as HTMLInputElement;
		onConfigChange({ noise_filtering: target.checked });
		onParameterChange?.();
	}

	// Backend-specific parameter handlers
	function handleDotDensityChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const uiValue = parseInt(target.value);
		const density = (10 - uiValue) / 90 + 0.05; // Map 1-10 to 0.15-0.05 (inverted)
		onConfigChange({ dot_density_threshold: density });
		onParameterChange?.();
	}

	function handlePreserveColorsChange(event: Event) {
		const target = event.target as HTMLInputElement;
		onConfigChange({ preserve_colors: target.checked });
		onParameterChange?.();
	}

	function handleRegionCountChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const uiValue = parseInt(target.value);
		const regions = Math.round(uiValue * 45 + 50); // Map 1-10 to 50-500
		onConfigChange({ num_superpixels: regions });
		onParameterChange?.();
	}

	function handleFillRegionsChange(event: Event) {
		const target = event.target as HTMLInputElement;
		onConfigChange({ fill_regions: target.checked });
		onParameterChange?.();
	}

	function handleAdaptiveThresholdChange(event: Event) {
		const target = event.target as HTMLInputElement;
		onConfigChange({ enable_adaptive_threshold: target.checked });
		onParameterChange?.();
	}

	// Derived values for UI display
	let detailUI = $derived(detailToUI(config.detail));
	let smoothnessUI = $derived(smoothnessToUI(config));
	let dotDensityUI = $derived(config.dot_density_threshold
		? Math.round((0.15 - config.dot_density_threshold) * 90 + 1)
		: 5);
	let regionCountUI = $derived(config.num_superpixels ? Math.round((config.num_superpixels - 50) / 45) : 3);
</script>

<section class="space-y-6" aria-labelledby="parameter-panel-heading">
	<div class="flex items-center gap-2">
		<Sliders class="text-primary h-5 w-5" aria-hidden="true" />
		<h3 id="parameter-panel-heading" class="text-lg font-semibold">Essential Controls</h3>
	</div>

	<!-- Core Parameters (Always Visible) -->
	<div class="space-y-4">
		<!-- Detail Level -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<label for="detail-level" class="flex items-center gap-2 text-sm font-medium">
					<Eye class="text-muted-foreground h-4 w-4" aria-hidden="true" />
					Detail Level
				</label>
				<span
					class="text-muted-foreground bg-muted rounded px-2 py-1 font-mono text-sm"
					aria-live="polite">{detailUI}/10</span
				>
			</div>
			<input
				id="detail-level"
				type="range"
				min="1"
				max="10"
				value={detailUI}
				onchange={handleDetailChange}
				oninput={handleDetailChange}
				{disabled}
				class="bg-muted focus:ring-primary slider-thumb:appearance-none slider-thumb:w-5 slider-thumb:h-5 slider-thumb:rounded-full slider-thumb:bg-primary slider-thumb:cursor-pointer slider-thumb:shadow-md h-2
					w-full cursor-pointer appearance-none rounded-lg focus:ring-2 focus:ring-offset-2 focus:outline-none"
				aria-describedby="detail-level-desc"
			/>
			<div id="detail-level-desc" class="text-muted-foreground text-xs">
				Controls line density and sensitivity. Higher values capture more details but may include
				noise.
			</div>
		</div>

		<!-- Stroke Width -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<label for="stroke-width" class="flex items-center gap-2 text-sm font-medium">
					<PenTool class="text-muted-foreground h-4 w-4" aria-hidden="true" />
					Stroke Width
				</label>
				<span
					class="text-muted-foreground bg-muted rounded px-2 py-1 font-mono text-sm"
					aria-live="polite">{config.stroke_width.toFixed(1)}px</span
				>
			</div>
			<input
				id="stroke-width"
				type="range"
				min="0.5"
				max="5.0"
				step="0.1"
				value={config.stroke_width}
				onchange={handleStrokeWidthChange}
				oninput={handleStrokeWidthChange}
				{disabled}
				class="bg-muted focus:ring-primary h-2 w-full cursor-pointer appearance-none rounded-lg focus:ring-2 focus:ring-offset-2 focus:outline-none"
				aria-describedby="stroke-width-desc"
			/>
			<div id="stroke-width-desc" class="text-muted-foreground text-xs">
				Base thickness of generated lines at standard resolution.
			</div>
		</div>

		<!-- Smoothness (only for edge backend) -->
		{#if config.backend === 'edge'}
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<label for="smoothness" class="flex items-center gap-2 text-sm font-medium">
						<Filter class="text-muted-foreground h-4 w-4" aria-hidden="true" />
						Smoothness
					</label>
					<span
						class="text-muted-foreground bg-muted rounded px-2 py-1 font-mono text-sm"
						aria-live="polite">{smoothnessUI}/10</span
					>
				</div>
				<input
					id="smoothness"
					type="range"
					min="1"
					max="10"
					value={smoothnessUI}
					onchange={handleSmoothnessChange}
					oninput={handleSmoothnessChange}
					{disabled}
					class="bg-muted focus:ring-primary h-2 w-full cursor-pointer appearance-none rounded-lg focus:ring-2 focus:ring-offset-2 focus:outline-none"
					aria-describedby="smoothness-desc"
				/>
				<div id="smoothness-desc" class="text-muted-foreground text-xs">
					Controls line character from smooth and clean to rough and textured.
				</div>
			</div>
		{/if}

		<!-- Hand-drawn Style (only for edge backend) -->
		{#if config.backend === 'edge'}
			<div class="space-y-2">
				<label for="hand-drawn-preset" class="text-sm font-medium">Hand-drawn Style</label>
				<select
					id="hand-drawn-preset"
					value={config.hand_drawn_preset}
					onchange={handleHandDrawnChange}
					{disabled}
					class="border-border bg-background focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
					aria-describedby="hand-drawn-desc"
				>
					{#each Object.entries(HAND_DRAWN_DESCRIPTIONS) as [preset] (preset)}
						<option value={preset}>{preset.charAt(0).toUpperCase() + preset.slice(1)}</option>
					{/each}
				</select>
				<div id="hand-drawn-desc" class="text-muted-foreground text-xs">
					{HAND_DRAWN_DESCRIPTIONS[config.hand_drawn_preset]}
				</div>
			</div>
		{/if}
	</div>

	<!-- Backend-Specific Controls -->
	{#if config.backend === 'dots'}
		<div class="space-y-4 border-t pt-4">
			<h4 class="text-muted-foreground text-sm font-medium">Stippling Controls</h4>

			<!-- Dot Density -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<label for="dot-density" class="text-sm font-medium">Dot Density</label>
					<span
						class="text-muted-foreground bg-muted rounded px-2 py-1 font-mono text-sm"
						aria-live="polite">{dotDensityUI}/10</span
					>
				</div>
				<input
					id="dot-density"
					type="range"
					min="1"
					max="10"
					value={dotDensityUI}
					onchange={handleDotDensityChange}
					oninput={handleDotDensityChange}
					{disabled}
					class="bg-muted focus:ring-primary h-2 w-full cursor-pointer appearance-none rounded-lg focus:ring-2 focus:ring-offset-2 focus:outline-none"
					aria-describedby="dot-density-desc"
				/>
				<div id="dot-density-desc" class="text-muted-foreground text-xs">
					Controls dot placement density. Higher values create denser stippling patterns.
				</div>
			</div>

			<!-- Preserve Colors -->
			<div class="flex items-center space-x-3">
				<input
					id="preserve-colors"
					type="checkbox"
					checked={config.preserve_colors ?? true}
					onchange={handlePreserveColorsChange}
					{disabled}
					class="border-border text-primary focus:ring-primary h-4 w-4 rounded focus:ring-2 focus:ring-offset-2"
				/>
				<label for="preserve-colors" class="cursor-pointer text-sm font-medium">
					Preserve Colors
				</label>
			</div>
			<div class="text-muted-foreground ml-7 text-xs">
				Keep original image colors in the stippling effect instead of monochrome dots.
			</div>
		</div>
	{:else if config.backend === 'superpixel'}
		<div class="space-y-4 border-t pt-4">
			<h4 class="text-muted-foreground text-sm font-medium">Region Controls</h4>

			<!-- Region Count -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<label for="region-count" class="text-sm font-medium">Region Complexity</label>
					<span
						class="text-muted-foreground bg-muted rounded px-2 py-1 font-mono text-sm"
						aria-live="polite">{regionCountUI}/10</span
					>
				</div>
				<input
					id="region-count"
					type="range"
					min="1"
					max="10"
					value={regionCountUI}
					onchange={handleRegionCountChange}
					oninput={handleRegionCountChange}
					{disabled}
					class="bg-muted focus:ring-primary h-2 w-full cursor-pointer appearance-none rounded-lg focus:ring-2 focus:ring-offset-2 focus:outline-none"
					aria-describedby="region-count-desc"
				/>
				<div id="region-count-desc" class="text-muted-foreground text-xs">
					Controls number of color regions. Higher values create more detailed segmentation.
				</div>
			</div>

			<!-- Fill Regions -->
			<div class="flex items-center space-x-3">
				<input
					id="fill-regions"
					type="checkbox"
					checked={config.fill_regions ?? true}
					onchange={handleFillRegionsChange}
					{disabled}
					class="border-border text-primary focus:ring-primary h-4 w-4 rounded focus:ring-2 focus:ring-offset-2"
				/>
				<label for="fill-regions" class="cursor-pointer text-sm font-medium"> Fill Regions </label>
			</div>
			<div class="text-muted-foreground ml-7 text-xs">
				Fill color regions instead of showing only outlines for bolder poster-style effects.
			</div>
		</div>
	{:else if config.backend === 'centerline'}
		<div class="space-y-4 border-t pt-4">
			<h4 class="text-muted-foreground text-sm font-medium">Precision Controls</h4>

			<!-- Adaptive Threshold -->
			<div class="flex items-center space-x-3">
				<input
					id="adaptive-threshold"
					type="checkbox"
					checked={config.enable_adaptive_threshold ?? true}
					onchange={handleAdaptiveThresholdChange}
					{disabled}
					class="border-border text-primary focus:ring-primary h-4 w-4 rounded focus:ring-2 focus:ring-offset-2"
				/>
				<label for="adaptive-threshold" class="cursor-pointer text-sm font-medium">
					Adaptive Threshold
				</label>
			</div>
			<div class="text-muted-foreground ml-7 text-xs">
				Use adaptive thresholding for better extraction from images with varying lighting.
			</div>
		</div>
	{/if}

	<!-- Noise Filtering (All Backends) -->
	<div class="space-y-2 border-t pt-4">
		<div class="flex items-center space-x-3">
			<input
				id="noise-filtering"
				type="checkbox"
				checked={config.noise_filtering}
				onchange={handleNoiseFilteringChange}
				{disabled}
				class="border-border text-primary focus:ring-primary h-4 w-4 rounded focus:ring-2 focus:ring-offset-2"
			/>
			<label for="noise-filtering" class="cursor-pointer text-sm font-medium">
				Noise Filtering
			</label>
		</div>
		<div class="text-muted-foreground ml-7 text-xs">
			Apply content-aware noise reduction to clean up the output.
		</div>
	</div>
</section>

<style>
	/* Custom range slider styling */
	input[type='range'] {
		-webkit-appearance: none;
		background: transparent;
	}

	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: hsl(var(--primary));
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		border: 2px solid white;
	}

	input[type='range']::-webkit-slider-thumb:hover {
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
	}

	input[type='range']::-moz-range-thumb {
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: hsl(var(--primary));
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		border: 2px solid white;
	}

	input[type='range']::-webkit-slider-track {
		background: hsl(var(--muted));
		height: 8px;
		border-radius: 4px;
	}

	input[type='range']::-moz-range-track {
		background: hsl(var(--muted));
		height: 8px;
		border-radius: 4px;
		border: none;
	}

	input[type='range']:focus {
		outline: none;
	}

	input[type='range']:focus::-webkit-slider-thumb {
		box-shadow:
			0 0 0 2px hsl(var(--primary)),
			0 2px 6px rgba(0, 0, 0, 0.3);
	}

	input[type='range']:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	input[type='range']:disabled::-webkit-slider-thumb {
		cursor: not-allowed;
	}
</style>
