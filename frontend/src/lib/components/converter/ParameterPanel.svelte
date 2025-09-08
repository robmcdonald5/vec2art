<script lang="ts">
	import { Eye, PenTool, Filter, Target, Puzzle, Droplets } from 'lucide-svelte';
	import type { VectorizerConfig, HandDrawnPreset } from '$lib/types/vectorizer';
	import { HAND_DRAWN_DESCRIPTIONS } from '$lib/types/vectorizer';
	import { CustomSelect } from '$lib/components/ui/custom-select';
	import FerrariSlider from '$lib/components/ui/FerrariSlider.svelte';

	// Import dots backend architecture
	import { mapUIConfigToDotsConfig, validateDotsConfig } from '$lib/utils/dots-mapping.js';
	import type { UISliderConfig } from '$lib/types/dots-backend.js';

	// Import generated parameter types and validation
	import { 
		validateLegacyConfig,
		processConfigWithGenerated,
		type ValidationResult,
		type EnhancedConfigResult
	} from '$lib/types/parameter-adapter';
	import { getParameterMetadata } from '$lib/types/generated-parameters';

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

	// Enhanced validation using generated parameter registry
	let validationResult: EnhancedConfigResult = $derived(processConfigWithGenerated(config));
	let hasValidationErrors = $derived(validationResult.errors.length > 0);
	let hasValidationWarnings = $derived(validationResult.warnings.length > 0);

	// Get parameter metadata for dynamic ranges and validation
	const detailMetadata = $derived(getParameterMetadata('detail'));
	const strokeMetadata = $derived(getParameterMetadata('stroke_px_at_1080p'));
	const noiseFilterSpatialMetadata = $derived(getParameterMetadata('noise_filter_spatial_sigma'));
	const noiseFilterRangeMetadata = $derived(getParameterMetadata('noise_filter_range_sigma'));

	// Convert detail using metadata ranges instead of hardcoded values
	// UI: 1-10 scale, Internal: uses metadata min/max
	const detailToUI = (detail: number) => {
		if (!detailMetadata) return Math.round(detail * 10);
		const { min, max } = detailMetadata;
		return Math.round(((detail - min) / (max - min)) * 9 + 1);
	};
	const detailFromUI = (uiValue: number) => {
		if (!detailMetadata) return uiValue / 10;
		const { min, max } = detailMetadata;
		return min + ((uiValue - 1) / 9) * (max - min);
	};

	function handleInitializationPatternChange(value: string) {
		console.log(`[ParameterPanel] Initialization pattern changed to: ${value}`);
		onConfigChange({ dot_initialization_pattern: value as 'square' | 'hexagonal' | 'poisson' });
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

	// REMOVED: Backend-specific parameter handlers are no longer needed
	// The architectural system handles all parameter mapping in the WASM worker

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

	// UI state for sliders - separate from derived to allow two-way binding
	// Note: detailUI converted to derived value for better sync
	let detailUI = $derived(detailToUI(config.detail));
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

	// Reactive state for FerrariSlider components
	let detailValue = $state(0.6);
	let dotDensityValue = $state(5);
	let regionComplexityValue = $state(250);
	let strokeWidthValue = $state(2.0);
	let variableWeightsValue = $state(0.0);
	let tremorStrengthValue = $state(0.0);
	let taperingValue = $state(0.0);
	let spatialSigmaValue = $state(1.2);
	let rangeSigmaValue = $state(50.0);

	// Update reactive values when config changes
	$effect(() => {
		detailValue = detailToUI(config.detail);
		dotDensityValue =
			config.dot_density_threshold !== undefined
				? Math.round(((0.4 - config.dot_density_threshold) / (0.4 - 0.02)) * 9 + 1)
				: 5;
		regionComplexityValue = config.num_superpixels || 250;
		strokeWidthValue = config.stroke_width || 2.0;
		variableWeightsValue = config.variable_weights ?? 0.0;
		tremorStrengthValue = config.tremor_strength ?? 0.0;
		taperingValue = config.tapering ?? 0.0;
		spatialSigmaValue = config.noise_filter_spatial_sigma ?? 1.2;
		rangeSigmaValue = config.noise_filter_range_sigma ?? 50.0;
	});
</script>

<section class="space-y-6">
	<!-- Parameter Validation Status -->
	{#if hasValidationErrors || hasValidationWarnings}
		<div class="space-y-2 rounded-lg border p-3">
			{#if hasValidationErrors}
				<div class="text-sm text-red-600 dark:text-red-400">
					<div class="font-medium">Configuration Errors:</div>
					<ul class="mt-1 list-inside list-disc space-y-1">
						{#each validationResult.errors as error}
							<li>{error.field}: {error.message}</li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if hasValidationWarnings}
				<div class="text-sm text-amber-600 dark:text-amber-400">
					<div class="font-medium">Configuration Warnings:</div>
					<ul class="mt-1 list-inside list-disc space-y-1">
						{#each validationResult.warnings as warning}
							<li>{warning.field}: {warning.message}</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{/if}

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
				<FerrariSlider
					id="detail-level"
					bind:value={detailValue}
					min={1}
					max={10}
					step={1}
					oninput={(value) => {
						const uiValue = parseInt(value.toString());
						const internalValue = detailFromUI(uiValue);
						// PROPER ARCHITECTURE: Always use generic parameters
						// The WASM worker will handle backend-specific mapping using the architectural system
						console.log(`🔧 Detail slider changed: UI=${uiValue} → internal=${internalValue}`);
						onConfigChange({ detail: internalValue });
						onParameterChange?.();
					}}
					{disabled}
					class="w-full"
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
				<FerrariSlider
					id="dot-density"
					bind:value={dotDensityValue}
					min={1}
					max={10}
					step={1}
					oninput={(value) => {
						const uiValue = parseInt(value.toString());
						// Convert UI value (1-10) to dot density threshold (0.4-0.02, inverted)
						// UI: 1 = sparse dots (high threshold), 10 = dense dots (low threshold)
						const threshold = 0.4 - ((uiValue - 1) / 9) * (0.4 - 0.02);
						// Set dot density threshold directly
						onConfigChange({ dot_density_threshold: threshold });
						onParameterChange?.();
					}}
					{disabled}
					class="w-full"
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
				<FerrariSlider
					id="region-complexity"
					bind:value={regionComplexityValue}
					min={50}
					max={500}
					step={25}
					oninput={(value) => {
						const regions = parseInt(value.toString());
						onConfigChange({ num_superpixels: regions });
						onParameterChange?.();
					}}
					{disabled}
					class="w-full"
				/>
				<div id="region-complexity-desc" class="text-converter-muted text-xs">
					Controls the number of regions in the superpixel segmentation. Higher values create more
					detailed segmentation.
				</div>
			</div>

			<!-- Initialization Pattern for Superpixel -->
			<div class="space-y-2">
				<label
					for="initialization-pattern"
					class="text-converter-primary flex items-center gap-2 text-sm font-medium"
				>
					<Target class="text-converter-secondary h-4 w-4" aria-hidden="true" />
					Initialization Pattern
				</label>
				<CustomSelect
					value={config.dot_initialization_pattern || 'poisson'}
					onchange={handleInitializationPatternChange}
					{disabled}
					options={[
						{
							value: 'square',
							label: 'Square Grid'
						},
						{
							value: 'hexagonal',
							label: 'Hexagonal'
						},
						{
							value: 'poisson',
							label: 'Poisson Disk'
						}
					]}
				/>
				<div class="text-converter-muted text-xs">
					Controls how superpixel centers are initially placed. Poisson disk sampling provides the
					best artifact reduction.
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
					aria-live="polite">{(config.stroke_width || 2.0).toFixed(1)}px</span
				>
			</div>
			<FerrariSlider
				id="stroke-width"
				bind:value={strokeWidthValue}
				min={strokeMetadata?.min ?? 0.5}
				max={strokeMetadata?.max ?? 10.0}
				step={0.1}
				oninput={(value) => {
					// PROPER ARCHITECTURE: Always use generic parameters
					// The WASM worker will handle backend-specific mapping using the architectural system
					console.log(`🔧 Line width slider changed: UI=${value}`);
					onConfigChange({ stroke_width: value });
					onParameterChange?.();
				}}
				{disabled}
				class="w-full"
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
					<FerrariSlider
						id="variable-weights"
						bind:value={variableWeightsValue}
						min={0}
						max={1}
						step={0.1}
						oninput={(value) => {
							console.log(`🟡 Parameter Panel - Range change: variable_weights = ${value}`);
							// Update the config with the new value
							const detectedPreset = checkForCustomPreset({ variable_weights: value });
							const newConfig = { variable_weights: value, hand_drawn_preset: detectedPreset };
							console.log(`🟡 Parameter Panel - Detected preset: ${detectedPreset}`);
							onConfigChange(newConfig);
							onParameterChange?.();
						}}
						{disabled}
						class="w-full"
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
					<FerrariSlider
						id="tremor-strength"
						bind:value={tremorStrengthValue}
						min={0}
						max={0.5}
						step={0.1}
						oninput={(value) => {
							console.log(`🟡 Parameter Panel - Range change: tremor_strength = ${value}`);
							// Update the config with the new value
							const detectedPreset = checkForCustomPreset({ tremor_strength: value });
							const newConfig = { tremor_strength: value, hand_drawn_preset: detectedPreset };
							console.log(`🟡 Parameter Panel - Detected preset: ${detectedPreset}`);
							onConfigChange(newConfig);
							onParameterChange?.();
						}}
						{disabled}
						class="w-full"
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
					<FerrariSlider
						id="tapering"
						bind:value={taperingValue}
						min={0}
						max={1}
						step={0.1}
						oninput={(value) => {
							console.log(`🟡 Parameter Panel - Range change: tapering = ${value}`);
							// Update the config with the new value
							const detectedPreset = checkForCustomPreset({ tapering: value });
							const newConfig = { tapering: value, hand_drawn_preset: detectedPreset };
							console.log(`🟡 Parameter Panel - Detected preset: ${detectedPreset}`);
							onConfigChange(newConfig);
							onParameterChange?.();
						}}
						{disabled}
						class="w-full"
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
						<FerrariSlider
							id="spatial-sigma"
							bind:value={spatialSigmaValue}
							min={noiseFilterSpatialMetadata?.min ?? 0.5}
							max={noiseFilterSpatialMetadata?.max ?? 1.5}
							step={0.1}
							oninput={(value) => {
								onConfigChange({ noise_filter_spatial_sigma: value });
								onParameterChange?.();
							}}
							{disabled}
							class="w-full"
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
						<FerrariSlider
							id="range-sigma"
							bind:value={rangeSigmaValue}
							min={noiseFilterRangeMetadata?.min ?? 10}
							max={noiseFilterRangeMetadata?.max ?? 100}
							step={5}
							oninput={(value) => {
								onConfigChange({ noise_filter_range_sigma: value });
								onParameterChange?.();
							}}
							{disabled}
							class="w-full"
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
