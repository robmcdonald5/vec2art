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
		// Handle undefined values with sensible defaults
		const tremor = config.tremor_strength ?? 0.1;
		const weights = config.variable_weights ?? 0.3;
		
		// Normalize to same scale: tremor is 0.0-0.5, weights is 0.0-1.0
		const normalizedTremor = tremor / 0.5; // Scale 0.0-0.5 to 0.0-1.0
		const normalizedWeights = weights; // Already 0.0-1.0
		const combinedRoughness = (normalizedTremor + normalizedWeights) / 2;
		
		// Reverse the exponential curve applied in smoothnessFromUI
		const linearRoughness = Math.pow(combinedRoughness, 1 / 1.5);
		
		return Math.round((1 - linearRoughness) * 9 + 1); // Invert: high smoothness = low roughness
	};

	const smoothnessFromUI = (uiValue: number) => {
		// Create a more dramatic curve for better visual impact
		// UI scale: 1 (rough) -> 10 (smooth)
		// Roughness: 1.0 (maximum effect) -> 0.0 (no effect)
		const normalizedInput = (10 - uiValue) / 9; // 0.0 to 1.0
		
		// Apply exponential curve for more dramatic effect at extremes
		const roughness = Math.pow(normalizedInput, 1.5);
		
		return roughness;
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

		// FIXED: Smoothness slider modifies parameters while respecting the preset
		// The slider provides fine-tuning WITHIN the chosen preset's style
		onConfigChange({
			// Keep tremor within WASM limits (0.0-0.5) but make it more dramatic
			tremor_strength: Math.min(0.5, roughnessValue * 0.5),
			// Make variable weights more dramatic  
			variable_weights: Math.min(1.0, roughnessValue * 1.5)
		});
		onParameterChange?.();
	}

	function handleHandDrawnChange(value: string) {
		const preset = value as HandDrawnPreset;
		
		// PROPER FIX: Hand-drawn preset sets base values, smoothness modifies them
		// Each preset defines a style foundation that smoothness can fine-tune
		const presetValues = {
			none: { tremor_strength: 0.0, variable_weights: 0.0, tapering: 0.0 },
			subtle: { tremor_strength: 0.05, variable_weights: 0.1, tapering: 0.2 },
			medium: { tremor_strength: 0.15, variable_weights: 0.3, tapering: 0.4 },
			strong: { tremor_strength: 0.3, variable_weights: 0.5, tapering: 0.6 },
			sketchy: { tremor_strength: 0.4, variable_weights: 0.7, tapering: 0.8 }
		};
		
		console.log(`[ParameterPanel] Hand-drawn preset "${preset}" - setting base values:`, presetValues[preset]);
		
		onConfigChange({
			hand_drawn_preset: preset,
			...presetValues[preset]
		});
		
		onParameterChange?.();
	}

	function handleNoiseFilteringChange(event: Event) {
		const target = event.target as HTMLInputElement;
		onConfigChange({ noise_filtering: target.checked });
		onParameterChange?.();
	}

	function handleSpatialSigmaChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseFloat(target.value);
		onConfigChange({ noise_filter_spatial_sigma: value });
		onParameterChange?.();
	}

	function handleRangeSigmaChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseFloat(target.value);
		onConfigChange({ noise_filter_range_sigma: value });
		onParameterChange?.();
	}

	// Backend-specific parameter handlers
	function handleDotDensityChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const uiValue = parseInt(target.value);
		const density = (10 - uiValue) / 9 * 0.1 + 0.05; // Map 1-10 to 0.15-0.05 (inverted)

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
		config.dot_density_threshold ? Math.round((0.15 - config.dot_density_threshold) / 0.1 * 9 + 1) : 5
	);
	let regionCountUI = $derived(
		config.num_superpixels ? Math.round((config.num_superpixels - 50) / 45) : 3
	);

	// Progressive slider functionality
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

	// Reactive effects to update slider fills when config changes externally
	let detailSliderRef = $state<HTMLInputElement>();
	let strokeWidthSliderRef = $state<HTMLInputElement>();
	let spatialSigmaSliderRef = $state<HTMLInputElement>();
	let rangeSigmaSliderRef = $state<HTMLInputElement>();

	$effect(() => {
		// Update detail slider fill when config.detail changes
		if (detailSliderRef && config.detail !== undefined) {
			updateSliderFill(detailSliderRef);
		}
	});

	$effect(() => {
		// Update stroke width slider fill when config.stroke_width changes
		if (strokeWidthSliderRef && config.stroke_width !== undefined) {
			updateSliderFill(strokeWidthSliderRef);
		}
	});

	$effect(() => {
		// Update spatial sigma slider fill when config.noise_filter_spatial_sigma changes
		if (spatialSigmaSliderRef && config.noise_filter_spatial_sigma !== undefined) {
			updateSliderFill(spatialSigmaSliderRef);
		}
	});

	$effect(() => {
		// Update range sigma slider fill when config.noise_filter_range_sigma changes
		if (rangeSigmaSliderRef && config.noise_filter_range_sigma !== undefined) {
			updateSliderFill(rangeSigmaSliderRef);
		}
	});
</script>

<section class="space-y-6">
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
				bind:this={detailSliderRef}
				id="detail-level"
				type="range"
				min="1"
				max="10"
				value={detailUI}
				onchange={handleDetailChange}
				oninput={handleDetailChange}
				{disabled}
				class="slider-ferrari w-full"
				aria-describedby="detail-level-desc"
				use:initializeSliderFill
			/>
			<div id="detail-level-desc" class="text-converter-muted text-xs">
				Controls line density and sensitivity. Higher values capture more details but may include
				noise.
			</div>
		</div>

		<!-- Line Width / Dot Width -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<label
					for="stroke-width"
					class="text-converter-primary flex items-center gap-2 text-sm font-medium"
				>
					<PenTool class="text-converter-secondary h-4 w-4" aria-hidden="true" />
					{config.backend === 'dots' ? 'Dot Width' : 'Line Width'}
				</label>
				<span
					class="text-converter-secondary bg-muted rounded px-2 py-1 font-mono text-sm"
					aria-live="polite">{(config.stroke_width || 0).toFixed(1)}px</span
				>
			</div>
			<input
				bind:this={strokeWidthSliderRef}
				id="stroke-width"
				type="range"
				min="0.5"
				max="5.0"
				step="0.1"
				value={config.stroke_width}
				onchange={handleStrokeWidthChange}
				oninput={handleStrokeWidthChange}
				{disabled}
				class="slider-ferrari w-full"
				aria-describedby="stroke-width-desc"
				use:initializeSliderFill
			/>
			<div id="stroke-width-desc" class="text-converter-muted text-xs">
				{config.backend === 'dots' 
					? 'Controls the size of dots in stippling output. Smaller dots create finer detail.'
					: 'Base thickness of generated lines at standard resolution.'}
			</div>
		</div>

		<!-- Smoothness (fine-tuning for hand-drawn effects) -->
		{#if config.backend === 'edge' && config.hand_drawn_preset !== 'none'}
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
					class="slider-ferrari w-full"
					aria-describedby="smoothness-desc"
					use:initializeSliderFill
				/>
				<div id="smoothness-desc" class="text-converter-muted text-xs">
					Fine-tune the roughness within the "{config.hand_drawn_preset}" style.
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
					class="slider-ferrari w-full"
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
					class="slider-ferrari w-full"
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
			Apply edge-preserving bilateral filtering to reduce noise while preserving important edges.
		</div>
		
		<!-- Advanced Noise Filtering Controls (shown when noise filtering is enabled) -->
		{#if config.noise_filtering}
			<div class="ml-7 space-y-3 pt-2">
				<!-- Spatial Sigma (Smoothing Strength) -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<label
							for="spatial-sigma"
							class="text-converter-primary flex items-center gap-2 text-sm font-medium"
						>
							<Filter class="text-converter-secondary h-4 w-4" aria-hidden="true" />
							Smoothing Strength
						</label>
						<span
							class="text-converter-secondary bg-muted rounded px-2 py-1 font-mono text-sm"
							aria-live="polite">{config.noise_filter_spatial_sigma?.toFixed(1) ?? '1.2'}</span
						>
					</div>
					<input
						bind:this={spatialSigmaSliderRef}
						id="spatial-sigma"
						type="range"
						min="0.5"
						max="1.5"
						step="0.1"
						value={config.noise_filter_spatial_sigma ?? 1.2}
						onchange={handleSpatialSigmaChange}
						oninput={handleSpatialSigmaChange}
						{disabled}
						class="slider-ferrari w-full"
						aria-describedby="spatial-sigma-desc"
						use:initializeSliderFill
					/>
					<div id="spatial-sigma-desc" class="text-converter-muted text-xs">
						Higher values provide more smoothing but may blur fine details.
					</div>
				</div>
				
				<!-- Range Sigma (Edge Preservation) -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<label
							for="range-sigma"
							class="text-converter-primary flex items-center gap-2 text-sm font-medium"
						>
							<Eye class="text-converter-secondary h-4 w-4" aria-hidden="true" />
							Edge Preservation
						</label>
						<span
							class="text-converter-secondary bg-muted rounded px-2 py-1 font-mono text-sm"
							aria-live="polite">{config.noise_filter_range_sigma?.toFixed(0) ?? '50'}</span
						>
					</div>
					<input
						bind:this={rangeSigmaSliderRef}
						id="range-sigma"
						type="range"
						min="10"
						max="100"
						step="5"
						value={config.noise_filter_range_sigma ?? 50.0}
						onchange={handleRangeSigmaChange}
						oninput={handleRangeSigmaChange}
						{disabled}
						class="slider-ferrari w-full"
						aria-describedby="range-sigma-desc"
						use:initializeSliderFill
					/>
					<div id="range-sigma-desc" class="text-converter-muted text-xs">
						Higher values preserve fewer edges (less selective filtering).
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>

<style>
	/* Unified Progressive Ferrari Slider Styles */
	.slider-ferrari {
		-webkit-appearance: none;
		appearance: none;
		background: linear-gradient(
			to right,
			#dc143c 0%,
			#dc143c var(--value, 0%),
			#ffe5e0 var(--value, 0%),
			#ffe5e0 100%
		);
		height: 8px;
		border-radius: 4px;
		cursor: pointer;
		outline: none;
		transition: all 0.2s ease;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.slider-ferrari:hover {
		background: linear-gradient(
			to right,
			#ff2800 0%,
			#ff2800 var(--value, 0%),
			#ffb5b0 var(--value, 0%),
			#ffb5b0 100%
		);
	}

	.slider-ferrari::-webkit-slider-track {
		background: transparent;
	}

	.slider-ferrari::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		background: linear-gradient(135deg, #ff2800, #dc2626);
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
		transition:
			transform 0.2s,
			box-shadow 0.2s;
		cursor: pointer;
	}

	.slider-ferrari::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		box-shadow:
			0 4px 8px rgba(255, 40, 0, 0.3),
			0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.slider-ferrari::-moz-range-track {
		background: transparent;
		height: 8px;
		border-radius: 4px;
	}

	.slider-ferrari::-moz-range-thumb {
		background: linear-gradient(135deg, #ff2800, #dc2626);
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
		transition:
			transform 0.2s,
			box-shadow 0.2s;
		cursor: pointer;
		border: none;
	}

	.slider-ferrari::-moz-range-thumb:hover {
		transform: scale(1.1);
		box-shadow:
			0 4px 8px rgba(255, 40, 0, 0.3),
			0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.slider-ferrari:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.slider-ferrari:disabled::-webkit-slider-thumb {
		cursor: not-allowed;
	}
</style>
