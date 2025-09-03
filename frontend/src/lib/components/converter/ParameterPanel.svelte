<script lang="ts">
	import { Sliders, Eye, PenTool, Filter, AlertTriangle, Grid3X3, Target, Puzzle, Droplets } from 'lucide-svelte';
	import type { VectorizerConfig, HandDrawnPreset } from '$lib/types/vectorizer';
	import { HAND_DRAWN_DESCRIPTIONS } from '$lib/types/vectorizer';
	import { CustomSelect } from '$lib/components/ui/custom-select';

	// Import dots backend architecture
	import {
		mapUIConfigToDotsConfig,
		validateDotsConfig,
		describeDotsConfig
	} from '$lib/utils/dots-mapping.js';
	import type { UISliderConfig } from '$lib/types/dots-backend.js';

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

	// Convert internal 0.1-1.0 detail to 1-10 UI range  
	// FIXED: Higher UI numbers = higher detail (higher internal values for proper mapping)
	const detailToUI = (detail: number) => Math.round((detail - 0.1) / 0.9 * 9 + 1); // detail 0.1 → UI 1, detail 1.0 → UI 10  
	const detailFromUI = (uiValue: number) => 0.1 + (uiValue - 1) / 9 * 0.9;         // UI 1 → detail 0.1, UI 10 → detail 1.0

	// Validation state for dots backend
	let dotsValidation = $state({ isValid: true, errors: [], warnings: [] });

	// Update dots validation when config changes
	$effect(() => {
		if (config.backend === 'dots') {
			const uiConfig: UISliderConfig = {
				detail_level: config.detail || 0.5,
				dot_width: config.stroke_width || 2.0,
				color_mode: config.preserve_colors || true
			};

			// Note: We don't have image dimensions in the UI panel, but the WASM worker will handle size-aware adjustment
			const dotsConfig = mapUIConfigToDotsConfig(uiConfig);
			dotsValidation = validateDotsConfig(dotsConfig);
		}
	});

	function handleDetailChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const uiValue = parseInt(target.value);
		const internalValue = detailFromUI(uiValue);

		// Update progressive fill
		updateSliderFill(target);

		// PROPER ARCHITECTURE: Always use generic parameters
		// The WASM worker will handle backend-specific mapping using the architectural system
		console.log(`🔧 Detail slider changed: UI=${uiValue} → internal=${internalValue}`);
		onConfigChange({ detail: internalValue });
		onParameterChange?.();
	}

	function handleStrokeWidthChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseFloat(target.value);

		// Update progressive fill
		updateSliderFill(target);

		// PROPER ARCHITECTURE: Always use generic parameters
		// The WASM worker will handle backend-specific mapping using the architectural system
		console.log(`🔧 Line width slider changed: UI=${value}`);
		onConfigChange({ stroke_width: value });
		onParameterChange?.();
	}

	function handleDotDensityChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const uiValue = parseInt(target.value);
		
		// Convert UI value (1-10) to dot density threshold (0.4-0.02, inverted)
		// UI: 1 = sparse dots (high threshold), 10 = dense dots (low threshold)
		const threshold = 0.4 - ((uiValue - 1) / 9) * (0.4 - 0.02);

		// Update progressive fill
		updateSliderFill(target);

		// Set dot density threshold directly
		onConfigChange({ dot_density_threshold: threshold });
		onParameterChange?.();
	}

	function handleInitializationPatternChange(value: string) {
		console.log(`[ParameterPanel] Initialization pattern changed to: ${value}`);
		onConfigChange({ initialization_pattern: value });
		onParameterChange?.();
	}

	function handleHandDrawnChange(value: string) {
		const preset = value as HandDrawnPreset;

		// If custom is selected, just update the preset without changing the values
		if (preset === 'custom') {
			console.log(`[ParameterPanel] Hand-drawn preset "${preset}" - keeping current custom values`);
			onConfigChange({ hand_drawn_preset: preset });
			onParameterChange?.();
			return;
		}

		// PROPER FIX: Hand-drawn preset sets base values, hand-drawn intensity modifies them
		// Each preset defines a style foundation that hand-drawn intensity can fine-tune
		const presetValues = {
			none: { tremor_strength: 0.0, variable_weights: 0.0, tapering: 0.0 },
			subtle: { tremor_strength: 0.05, variable_weights: 0.1, tapering: 0.2 },
			medium: { tremor_strength: 0.15, variable_weights: 0.3, tapering: 0.4 },
			strong: { tremor_strength: 0.3, variable_weights: 0.5, tapering: 0.6 },
			sketchy: { tremor_strength: 0.4, variable_weights: 0.7, tapering: 0.8 }
		};

		console.log(
			`[ParameterPanel] Hand-drawn preset "${preset}" - setting base values:`,
			presetValues[preset]
		);

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

	// REMOVED: Backend-specific parameter handlers are no longer needed
	// The architectural system handles all parameter mapping in the WASM worker

	function handleRegionComplexityChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const regions = parseInt(target.value);

		// Update progressive fill
		updateSliderFill(target);

		onConfigChange({ num_superpixels: regions });
		onParameterChange?.();
	}

	function handleAdaptiveThresholdChange(event: Event) {
		const target = event.target as HTMLInputElement;
		onConfigChange({ enable_adaptive_threshold: target.checked });
		onParameterChange?.();
	}


	// Check if current artistic effect values match a preset
	function checkForCustomPreset(newConfig: Partial<VectorizerConfig>): HandDrawnPreset {
		const currentConfig = { ...config, ...newConfig };
		const currentValues = {
			tremor_strength: currentConfig.tremor_strength ?? 0,
			variable_weights: currentConfig.variable_weights ?? 0,
			tapering: currentConfig.tapering ?? 0
		};

		// Check against all presets (except custom)
		const presetValues = {
			none: { tremor_strength: 0.0, variable_weights: 0.0, tapering: 0.0 },
			subtle: { tremor_strength: 0.05, variable_weights: 0.1, tapering: 0.2 },
			medium: { tremor_strength: 0.15, variable_weights: 0.3, tapering: 0.4 },
			strong: { tremor_strength: 0.3, variable_weights: 0.5, tapering: 0.6 },
			sketchy: { tremor_strength: 0.4, variable_weights: 0.7, tapering: 0.8 }
		};

		// Check if current values match any preset (with small tolerance for floating point)
		for (const [preset, values] of Object.entries(presetValues)) {
			const tolerance = 0.01;
			if (
				Math.abs(currentValues.tremor_strength - values.tremor_strength) < tolerance &&
				Math.abs(currentValues.variable_weights - values.variable_weights) < tolerance &&
				Math.abs(currentValues.tapering - values.tapering) < tolerance
			) {
				return preset as HandDrawnPreset;
			}
		}

		return 'custom';
	}

	// Generic range input handler for artistic effects
	function handleRangeChange(configKey: keyof VectorizerConfig) {
		return (event: Event) => {
			const input = event.target as HTMLInputElement;
			const value = parseFloat(input.value);

			// Update progressive fill
			updateSliderFill(input);

			console.log(`🟡 Parameter Panel - Range change: ${configKey} = ${value}`);

			// Update the config with the new value
			const newConfig = { [configKey]: value } as Partial<VectorizerConfig>;

			// Check if this change makes it a custom preset
			if (['variable_weights', 'tremor_strength', 'tapering'].includes(configKey)) {
				const detectedPreset = checkForCustomPreset(newConfig);
				newConfig.hand_drawn_preset = detectedPreset;
				console.log(`🟡 Parameter Panel - Detected preset: ${detectedPreset}`);
			}

			onConfigChange(newConfig);
			onParameterChange?.();
		};
	}

	// UI state for sliders - separate from derived to allow two-way binding
	let detailUI = $state(detailToUI(config.detail));
	let strokeWidthUI = $state(config.stroke_width || 2.0);
	
	// Sync UI state when config changes externally
	$effect(() => {
		detailUI = detailToUI(config.detail);
		strokeWidthUI = config.stroke_width || 2.0;
	});
	let dotDensityUI = $derived(
		config.dot_density_threshold !== undefined
			? Math.round(((0.4 - config.dot_density_threshold) / (0.4 - 0.02)) * 9 + 1)
			: 5
	);

	// Hand-drawn preset options (with custom at the bottom)
	const handDrawnOptions = (() => {
		const allKeys = Object.keys(HAND_DRAWN_DESCRIPTIONS) as HandDrawnPreset[];
		const nonCustomKeys = allKeys.filter((key) => key !== 'custom');
		const orderedKeys = [...nonCustomKeys, 'custom'];

		return orderedKeys.map((preset) => ({
			value: preset,
			label: preset.charAt(0).toUpperCase() + preset.slice(1)
		}));
	})();


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
	let dotDensitySliderRef = $state<HTMLInputElement>();
	let strokeWidthSliderRef = $state<HTMLInputElement>();
	let regionComplexitySliderRef = $state<HTMLInputElement>();
	let spatialSigmaSliderRef = $state<HTMLInputElement>();
	let rangeSigmaSliderRef = $state<HTMLInputElement>();
	let variableWeightsSliderRef = $state<HTMLInputElement>();
	let tremorStrengthSliderRef = $state<HTMLInputElement>();
	let taperingSliderRef = $state<HTMLInputElement>();

	$effect(() => {
		// Update detail slider fill when config.detail changes
		if (detailSliderRef && config.detail !== undefined) {
			updateSliderFill(detailSliderRef);
		}
	});

	$effect(() => {
		// Update dot density slider fill when config.dot_density_threshold changes
		if (dotDensitySliderRef && config.dot_density_threshold !== undefined) {
			updateSliderFill(dotDensitySliderRef);
		}
	});

	$effect(() => {
		// Update stroke width slider fill when config.stroke_width changes
		if (strokeWidthSliderRef && config.stroke_width !== undefined) {
			updateSliderFill(strokeWidthSliderRef);
		}
	});

	$effect(() => {
		// Update region complexity slider fill when config.num_superpixels changes
		if (regionComplexitySliderRef && config.num_superpixels !== undefined) {
			updateSliderFill(regionComplexitySliderRef);
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

	$effect(() => {
		// Update variable weights slider fill when config.variable_weights changes
		if (variableWeightsSliderRef && config.variable_weights !== undefined) {
			updateSliderFill(variableWeightsSliderRef);
		}
	});

	$effect(() => {
		// Update tremor strength slider fill when config.tremor_strength changes
		if (tremorStrengthSliderRef && config.tremor_strength !== undefined) {
			updateSliderFill(tremorStrengthSliderRef);
		}
	});

	$effect(() => {
		// Update tapering slider fill when config.tapering changes
		if (taperingSliderRef && config.tapering !== undefined) {
			updateSliderFill(taperingSliderRef);
		}
	});

</script>

<section class="space-y-6">
	<!-- Core Parameters (Always Visible) -->
	<div class="space-y-4">
		<!-- Detail Level (Edge/Centerline backends only) -->
		{#if config.backend === 'edge' || config.backend === 'centerline'}
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
					bind:value={detailUI}
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
		{/if}

		<!-- Dot Density (Dots backend only) -->
		{#if config.backend === 'dots'}
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<label
						for="dot-density"
						class="text-converter-primary flex items-center gap-2 text-sm font-medium"
					>
						<Droplets class="text-converter-secondary h-4 w-4" aria-hidden="true" />
						Dot Density
					</label>
					<span
						class="text-converter-secondary bg-muted rounded px-2 py-1 font-mono text-sm"
						aria-live="polite">{dotDensityUI}/10</span
					>
				</div>
				<input
					bind:this={dotDensitySliderRef}
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
					Controls how many dots are placed. Higher values create denser stippling with more detail.
				</div>
			</div>
		{/if}

		<!-- Region Complexity (Superpixel backend only) -->
		{#if config.backend === 'superpixel'}
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<label
						for="region-complexity"
						class="text-converter-primary flex items-center gap-2 text-sm font-medium"
					>
						<Puzzle class="text-converter-secondary h-4 w-4" aria-hidden="true" />
						Region Complexity
					</label>
					<span
						class="text-converter-secondary bg-muted rounded px-2 py-1 font-mono text-sm"
						aria-live="polite">{config.num_superpixels || 250}</span
					>
				</div>
				<input
					bind:this={regionComplexitySliderRef}
					id="region-complexity"
					type="range"
					min="50"
					max="500"
					step="25"
					value={config.num_superpixels || 250}
					onchange={handleRegionComplexityChange}
					oninput={handleRegionComplexityChange}
					{disabled}
					class="slider-ferrari w-full"
					aria-describedby="region-complexity-desc"
					use:initializeSliderFill
				/>
				<div id="region-complexity-desc" class="text-converter-muted text-xs">
					Controls the number of regions in the superpixel segmentation. Higher values create more
					detailed segmentation.
				</div>
			</div>

			<!-- Initialization Pattern for Superpixel -->
			<div class="space-y-2">
				<label for="initialization-pattern" class="text-converter-primary flex items-center gap-2 text-sm font-medium">
					<Target class="text-converter-secondary h-4 w-4" aria-hidden="true" />
					Initialization Pattern
				</label>
				<CustomSelect
					id="initialization-pattern"
					value={config.initialization_pattern || 'poisson'}
					onchange={handleInitializationPatternChange}
					{disabled}
					options={[
						{ value: 'square', label: 'Square Grid', description: 'Traditional grid pattern - may create diagonal artifacts' },
						{ value: 'hexagonal', label: 'Hexagonal', description: 'Reduces diagonal artifacts, more natural clustering' },
						{ value: 'poisson', label: 'Poisson Disk', description: 'Random distribution, eliminates grid artifacts' }
					]}
				>
					<span slot="selectedLabel">
						{config.initialization_pattern === 'square' ? 'Square Grid' : 
						 config.initialization_pattern === 'hexagonal' ? 'Hexagonal' :
						 config.initialization_pattern === 'poisson' ? 'Poisson Disk' : 'Poisson Disk'}
					</span>
				</CustomSelect>
				<div class="text-converter-muted text-xs">
					Controls how superpixel centers are initially placed. Poisson disk sampling provides the best artifact reduction.
				</div>
			</div>
		{/if}

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
					aria-live="polite">{strokeWidthUI.toFixed(1)}px</span
				>
			</div>
			<input
				bind:this={strokeWidthSliderRef}
				id="stroke-width"
				type="range"
				min="0.5"
				max="10.0"
				step="0.1"
				bind:value={strokeWidthUI}
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

		<!-- Artistic Effects (independent controls for hand-drawn effects) -->
		{#if config.backend === 'edge' && config.hand_drawn_preset !== 'none'}
			<div class="space-y-4">
				<div class="text-converter-primary flex items-center gap-2 text-sm font-medium">
					<Filter class="text-converter-secondary h-4 w-4" aria-hidden="true" />
					Artistic Effects
				</div>

				<!-- Variable Line Weights -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<label for="variable-weights" class="text-converter-primary text-sm"
							>Variable Line Weights</label
						>
						<span class="text-converter-secondary bg-muted rounded px-2 py-1 font-mono text-xs">
							{(config.variable_weights ?? 0).toFixed(1)}
						</span>
					</div>
					<input
						bind:this={variableWeightsSliderRef}
						type="range"
						id="variable-weights"
						min="0"
						max="1"
						step="0.1"
						value={config.variable_weights ?? 0}
						oninput={handleRangeChange('variable_weights')}
						{disabled}
						class="slider-ferrari w-full"
						use:initializeSliderFill
					/>
					<div class="text-converter-muted text-xs">
						Line thickness variation based on image features and curvature.
					</div>
				</div>

				<!-- Tremor Strength -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<label for="tremor-strength" class="text-converter-primary text-sm"
							>Tremor Strength</label
						>
						<span class="text-converter-secondary bg-muted rounded px-2 py-1 font-mono text-xs">
							{(config.tremor_strength ?? 0).toFixed(1)}
						</span>
					</div>
					<input
						bind:this={tremorStrengthSliderRef}
						type="range"
						id="tremor-strength"
						min="0"
						max="0.5"
						step="0.1"
						value={config.tremor_strength ?? 0}
						oninput={handleRangeChange('tremor_strength')}
						{disabled}
						class="slider-ferrari w-full"
						use:initializeSliderFill
					/>
					<div class="text-converter-muted text-xs">
						Subtle hand-drawn irregularities for organic line appearance.
					</div>
				</div>

				<!-- Line Tapering -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<label for="tapering" class="text-converter-primary text-sm">Line Tapering</label>
						<span class="text-converter-secondary bg-muted rounded px-2 py-1 font-mono text-xs">
							{(config.tapering ?? 0).toFixed(1)}
						</span>
					</div>
					<input
						bind:this={taperingSliderRef}
						type="range"
						id="tapering"
						min="0"
						max="1"
						step="0.1"
						value={config.tapering ?? 0}
						oninput={handleRangeChange('tapering')}
						{disabled}
						class="slider-ferrari w-full"
						use:initializeSliderFill
					/>
					<div class="text-converter-muted text-xs">
						Natural line endpoint tapering for smoother line endings.
					</div>
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
					options={handDrawnOptions}
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

	<!-- Backend-Specific Configuration and Validation -->
	{#if config.backend === 'centerline'}
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

	<!-- Noise Filtering (Edge/Centerline/Dots backends only - Superpixel has natural noise reduction) -->
	{#if config.backend !== 'superpixel'}
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
	{/if}

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
