<script lang="ts">
	import { Sliders, Eye, PenTool, Filter } from 'lucide-svelte';
	import type { VectorizerConfig, HandDrawnPreset } from '$lib/types/vectorizer';
	import { HAND_DRAWN_DESCRIPTIONS } from '$lib/types/vectorizer';
	import { CustomSelect } from '$lib/components/ui/custom-select';

	interface ParameterPanelProps {
		config: VectorizerConfig;
		// eslint-disable-next-line no-unused-vars
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

		// Update progressive fill
		updateSliderFill(target);

		onConfigChange({ detail: internalValue });
		onParameterChange?.();
	}

	function handleStrokeWidthChange(event: Event) {
		const target = event.target as HTMLInputElement;

		// Update progressive fill
		updateSliderFill(target);

		onConfigChange({ stroke_width: parseFloat(target.value) });
		onParameterChange?.();
	}

	function handleSmoothnessChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const uiValue = parseInt(target.value);
		const roughnessValue = smoothnessFromUI(uiValue);

		// Update progressive fill
		updateSliderFill(target);

		onConfigChange({
			tremor_strength: Math.min(0.5, roughnessValue),
			variable_weights: Math.min(1.0, roughnessValue * 2)
		});
		onParameterChange?.();
	}

	function handleHandDrawnChange(value: string) {
		onConfigChange({ hand_drawn_preset: value as HandDrawnPreset });
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

		// Update progressive fill
		updateSliderFill(target);

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

		// Update progressive fill
		updateSliderFill(target);

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
	let dotDensityUI = $derived(
		config.dot_density_threshold ? Math.round((0.15 - config.dot_density_threshold) * 90 + 1) : 5
	);
	let regionCountUI = $derived(
		config.num_superpixels ? Math.round((config.num_superpixels - 50) / 45) : 3
	);

	// Progressive slider fill functions
	function updateSliderFill(slider: HTMLInputElement) {
		const min = parseFloat(slider.min);
		const max = parseFloat(slider.max);
		const value = parseFloat(slider.value);
		const percentage = ((value - min) / (max - min)) * 100;
		slider.style.setProperty('--value', `${percentage}%`);
	}

	function initializeSliderFill(slider: HTMLInputElement) {
		updateSliderFill(slider);
		slider.addEventListener('input', () => updateSliderFill(slider));
	}
</script>

<section class="space-y-6" aria-labelledby="parameter-panel-heading">
	<div class="flex items-center gap-2">
		<div class="bg-ferrari-100 rounded-lg p-1.5">
			<Sliders class="h-4 w-4 text-ferrari-600" aria-hidden="true" />
		</div>
		<h3 id="parameter-panel-heading" class="text-lg font-semibold text-converter-primary">Essential Controls</h3>
	</div>

	<!-- Core Parameters (Always Visible) -->
	<div class="space-y-4">
		<!-- Detail Level -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<label
					for="detail-level"
					class="text-converter-primary flex items-center gap-2 text-sm font-medium"
				>
					<Eye class="text-converter-secondary h-4 w-4" aria-hidden="true" />
					Detail Level
				</label>
				<span
					class="text-converter-secondary bg-muted rounded px-2 py-1 font-mono text-sm"
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
				class="bg-muted progressive-slider h-2 w-full cursor-pointer appearance-none rounded-lg focus:outline-none"
				aria-describedby="detail-level-desc"
				use:initializeSliderFill
			/>
			<div id="detail-level-desc" class="text-converter-muted text-xs">
				Controls line density and sensitivity. Higher values capture more details but may include
				noise.
			</div>
		</div>

		<!-- Stroke Width -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<label
					for="stroke-width"
					class="text-converter-primary flex items-center gap-2 text-sm font-medium"
				>
					<PenTool class="text-converter-secondary h-4 w-4" aria-hidden="true" />
					Stroke Width
				</label>
				<span
					class="text-converter-secondary bg-muted rounded px-2 py-1 font-mono text-sm"
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
				class="bg-muted progressive-slider h-2 w-full cursor-pointer appearance-none rounded-lg focus:outline-none"
				aria-describedby="stroke-width-desc"
				use:initializeSliderFill
			/>
			<div id="stroke-width-desc" class="text-converter-muted text-xs">
				Base thickness of generated lines at standard resolution.
			</div>
		</div>

		<!-- Smoothness (only for edge backend) -->
		{#if config.backend === 'edge'}
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<label
						for="smoothness"
						class="text-converter-primary flex items-center gap-2 text-sm font-medium"
					>
						<Filter class="text-converter-secondary h-4 w-4" aria-hidden="true" />
						Smoothness
					</label>
					<span
						class="text-converter-secondary bg-muted rounded px-2 py-1 font-mono text-sm"
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
					class="bg-muted progressive-slider h-2 w-full cursor-pointer appearance-none rounded-lg focus:outline-none"
					aria-describedby="smoothness-desc"
					use:initializeSliderFill
				/>
				<div id="smoothness-desc" class="text-converter-muted text-xs">
					Controls line character from smooth and clean to rough and textured.
				</div>
			</div>
		{/if}

		<!-- Hand-drawn Style (only for edge backend) -->
		{#if config.backend === 'edge'}
			<div class="space-y-2">
				<label for="hand-drawn-preset" class="text-converter-primary text-sm font-medium"
					>Hand-drawn Style</label
				>
				<CustomSelect
					value={config.hand_drawn_preset}
					options={Object.keys(HAND_DRAWN_DESCRIPTIONS).map((preset) => ({
						value: preset,
						label: preset.charAt(0).toUpperCase() + preset.slice(1)
					}))}
					onchange={handleHandDrawnChange}
					{disabled}
					placeholder="Select hand-drawn style"
				/>
				<div id="hand-drawn-desc" class="text-converter-muted text-xs">
					{HAND_DRAWN_DESCRIPTIONS[config.hand_drawn_preset]}
				</div>
			</div>
		{/if}
	</div>

	<!-- Backend-Specific Controls -->
	{#if config.backend === 'dots'}
		<div class="space-y-4 border-t pt-4">
			<h4 class="text-converter-secondary text-sm font-medium">Stippling Controls</h4>

			<!-- Dot Density -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<label for="dot-density" class="text-converter-primary text-sm font-medium"
						>Dot Density</label
					>
					<span
						class="text-converter-secondary bg-muted rounded px-2 py-1 font-mono text-sm"
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
					class="bg-muted progressive-slider h-2 w-full cursor-pointer appearance-none rounded-lg focus:outline-none"
					aria-describedby="dot-density-desc"
					use:initializeSliderFill
				/>
				<div id="dot-density-desc" class="text-converter-muted text-xs">
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
					class="border-border text-primary h-4 w-4 rounded focus:outline-none"
				/>
				<label
					for="preserve-colors"
					class="text-converter-primary cursor-pointer text-sm font-medium"
				>
					Preserve Colors
				</label>
			</div>
			<div class="text-converter-muted ml-7 text-xs">
				Keep original image colors in the stippling effect instead of monochrome dots.
			</div>
		</div>
	{:else if config.backend === 'superpixel'}
		<div class="space-y-4 border-t pt-4">
			<h4 class="text-converter-secondary text-sm font-medium">Region Controls</h4>

			<!-- Region Count -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<label for="region-count" class="text-converter-primary text-sm font-medium"
						>Region Complexity</label
					>
					<span
						class="text-converter-secondary bg-muted rounded px-2 py-1 font-mono text-sm"
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
					class="bg-muted progressive-slider h-2 w-full cursor-pointer appearance-none rounded-lg focus:outline-none"
					aria-describedby="region-count-desc"
					use:initializeSliderFill
				/>
				<div id="region-count-desc" class="text-converter-muted text-xs">
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
					class="border-border text-primary h-4 w-4 rounded focus:outline-none"
				/>
				<label for="fill-regions" class="text-converter-primary cursor-pointer text-sm font-medium">
					Fill Regions
				</label>
			</div>
			<div class="text-converter-muted ml-7 text-xs">
				Fill color regions instead of showing only outlines for bolder poster-style effects.
			</div>
		</div>
	{:else if config.backend === 'centerline'}
		<div class="space-y-4 border-t pt-4">
			<h4 class="text-converter-secondary text-sm font-medium">Precision Controls</h4>

			<!-- Adaptive Threshold -->
			<div class="flex items-center space-x-3">
				<input
					id="adaptive-threshold"
					type="checkbox"
					checked={config.enable_adaptive_threshold ?? true}
					onchange={handleAdaptiveThresholdChange}
					{disabled}
					class="border-border text-primary h-4 w-4 rounded focus:outline-none"
				/>
				<label
					for="adaptive-threshold"
					class="text-converter-primary cursor-pointer text-sm font-medium"
				>
					Adaptive Threshold
				</label>
			</div>
			<div class="text-converter-muted ml-7 text-xs">
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
				class="border-border text-primary h-4 w-4 rounded focus:outline-none"
			/>
			<label
				for="noise-filtering"
				class="text-converter-primary cursor-pointer text-sm font-medium"
			>
				Noise Filtering
			</label>
		</div>
		<div class="text-converter-muted ml-7 text-xs">
			Apply content-aware noise reduction to clean up the output.
		</div>
	</div>
</section>

<style>
	/* Progressive slider styling to match Quick Settings */
	.progressive-slider {
		-webkit-appearance: none;
		background: linear-gradient(
			to right,
			#3b82f6 0%,
			#3b82f6 var(--value, 0%),
			#f1f5f9 var(--value, 0%),
			#f1f5f9 100%
		);
		border-radius: 4px;
		outline: none;
		transition: all 0.2s ease;
	}

	.progressive-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: white;
		border: 3px solid #94a3b8;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.progressive-slider:hover::-webkit-slider-thumb {
		border-color: #cbd5e1;
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
	}

	.progressive-slider:hover {
		background: linear-gradient(
			to right,
			#60a5fa 0%,
			#60a5fa var(--value, 0%),
			#e2e8f0 var(--value, 0%),
			#e2e8f0 100%
		);
	}

	.progressive-slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: white;
		border: 3px solid #94a3b8;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.progressive-slider:hover::-moz-range-thumb {
		border-color: #cbd5e1;
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
	}

	.progressive-slider::-moz-range-track {
		background: linear-gradient(
			to right,
			#3b82f6 0%,
			#3b82f6 var(--value, 0%),
			#f1f5f9 var(--value, 0%),
			#f1f5f9 100%
		);
		height: 8px;
		border-radius: 4px;
		border: none;
	}

	.progressive-slider:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.progressive-slider:disabled::-webkit-slider-thumb {
		cursor: not-allowed;
	}

	/* Legacy slider styling for non-progressive sliders */
	input[type='range']:not(.progressive-slider) {
		-webkit-appearance: none;
		background: transparent;
	}

	input[type='range']:not(.progressive-slider)::-webkit-slider-thumb {
		-webkit-appearance: none;
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: hsl(var(--primary));
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		border: 2px solid white;
	}

	input[type='range']:not(.progressive-slider)::-webkit-slider-thumb:hover {
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
	}

	input[type='range']:not(.progressive-slider)::-moz-range-thumb {
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: hsl(var(--primary));
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		border: 2px solid white;
	}

	input[type='range']:not(.progressive-slider)::-webkit-slider-track {
		background: hsl(var(--muted));
		height: 8px;
		border-radius: 4px;
	}

	input[type='range']:not(.progressive-slider)::-moz-range-track {
		background: hsl(var(--muted));
		height: 8px;
		border-radius: 4px;
		border: none;
	}

	input[type='range']:focus {
		outline: none;
	}

	input[type='range']:not(.progressive-slider):focus::-webkit-slider-thumb {
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
