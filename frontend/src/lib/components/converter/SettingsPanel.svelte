<script lang="ts">
	import { Settings, Sliders, ChevronDown, ChevronUp } from 'lucide-svelte';
	import type {
		VectorizerConfig,
		VectorizerBackend,
		VectorizerPreset
	} from '$lib/types/vectorizer';
	import { getPresetById } from '$lib/presets/presets';
	import { presetToVectorizerConfig, getAlgorithmDefaults } from '$lib/presets/converter';
	import type { StylePreset } from '$lib/presets/types';
	import BackendSelector from './BackendSelector.svelte';
	import PresetSelector from './PresetSelector.svelte';
	import ParameterPanel from './ParameterPanel.svelte';
	import AdvancedControls from './AdvancedControls.svelte';
	import PortalTooltipFixed from '$lib/components/ui/tooltip/PortalTooltipFixed.svelte';

	interface Props {
		config: VectorizerConfig;
		selectedPreset: VectorizerPreset | 'custom';
		disabled?: boolean;
		onConfigChange: (updates: Partial<VectorizerConfig>) => void;
		onPresetChange: (preset: VectorizerPreset | 'custom') => void;
		onBackendChange: (backend: VectorizerBackend) => void;
		onParameterChange: () => void;
	}

	let {
		config,
		selectedPreset,
		disabled = false,
		onConfigChange,
		onPresetChange,
		onBackendChange,
		onParameterChange
	}: Props = $props();

	// UI state management
	let isQuickSettingsExpanded = $state(true);
	let isAdvancedSettingsExpanded = $state(false);


	// Parameter update handler
	function updateConfig(key: keyof VectorizerConfig) {
		return (event: Event) => {
			const target = event.target as HTMLInputElement;
			let value: any = target.value;

			// Convert value based on input type
			if (target.type === 'checkbox') {
				value = target.checked;
			} else if (target.type === 'range' || target.type === 'number') {
				value = parseFloat(target.value);
			}

			onConfigChange({ [key]: value } as Partial<VectorizerConfig>);
			onParameterChange();
		};
	}

	// Legacy mapping functions removed - using direct StylePreset ID tracking instead

	// Special handler for dots backend detail/density mapping
	function updateDotDensity(event: Event) {
		const target = event.target as HTMLInputElement;
		const uiValue = parseFloat(target.value); // UI slider value (0.1 to 1.0)

		// Convert to the 1-10 scale that matches Advanced Settings for consistency
		// 0.1-1.0 → 1-10 (multiply by 10)
		const advancedScaleValue = Math.round(uiValue * 10);

		// Apply the same mapping as Advanced Settings (1-10 to 0.4-0.02)
		// This ensures both Quick and Advanced Settings are perfectly synced
		const threshold = 0.4 - ((advancedScaleValue - 1) / 9) * (0.4 - 0.02);

		console.log(`🎯 Dot Density mapping (FIXED): UI=${uiValue} (${advancedScaleValue}/10) → threshold=${threshold.toFixed(3)}`);

		// Update both parameters for consistency
		onConfigChange({
			detail: uiValue, // Keep detail in sync for other logic
			dot_density_threshold: threshold
		});
		onParameterChange();
	}

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
	let regionComplexitySliderRef = $state<HTMLInputElement>();

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
		// Update region complexity slider fill when config.num_superpixels changes
		if (regionComplexitySliderRef && config.num_superpixels !== undefined) {
			updateSliderFill(regionComplexitySliderRef);
		}
	});
</script>

<div class="w-full max-w-sm space-y-4">
	<!-- Quick Settings Panel -->
	<div
		class="card-ferrari-static to-ferrari-50/20 border-ferrari-200/50 overflow-hidden rounded-2xl border bg-gradient-to-br from-white shadow-lg"
	>
		<button
			class="to-ferrari-50/30 hover:from-ferrari-50 hover:to-ferrari-100/50 flex w-full items-center justify-between bg-gradient-to-r from-transparent p-4 text-left transition-all duration-200 focus:outline-none {isQuickSettingsExpanded
				? 'ring-ferrari-500 ring-2 ring-offset-2'
				: ''}"
			style="z-index: 5; position: relative;"
			onclick={() => (isQuickSettingsExpanded = !isQuickSettingsExpanded)}
			type="button"
		>
			<div class="flex items-center gap-3">
				<div class="bg-ferrari-100 rounded-lg p-2">
					<Sliders class="text-ferrari-600 h-4 w-4" />
				</div>
				<h3 class="text-converter-primary text-lg font-semibold">Quick Settings</h3>
			</div>
			<div class="flex-shrink-0">
				{#if isQuickSettingsExpanded}
					<ChevronUp class="text-converter-secondary h-5 w-5" />
				{:else}
					<ChevronDown class="text-converter-secondary h-5 w-5" />
				{/if}
			</div>
		</button>

		{#if isQuickSettingsExpanded}
			<div class="space-y-6 bg-white/50 p-4 backdrop-blur-sm">
				<!-- Algorithm Selection -->
				<div>
					<div class="mb-3 flex items-center gap-2">
						<label for="backend-selector" class="text-converter-primary block text-sm font-medium">
							Algorithm
						</label>
						<PortalTooltipFixed
							content="Choose the line tracing algorithm. Edge is best for detailed drawings, Centerline for simple shapes, Superpixel for stylized art, and Dots for stippling effects."
							position="right"
							size="md"
						/>
					</div>
					<BackendSelector
						selectedBackend={config.backend}
						{onBackendChange}
						{disabled}
						compact={true}
					/>
				</div>

				<!-- Style Preset (Disabled - Coming Soon) -->
				<div>
					<div class="mb-3 flex items-center gap-2">
						<label for="preset-selector" class="text-converter-secondary block text-sm font-medium opacity-60">
							Style Preset
						</label>
						<span class="text-ferrari-600 text-xs font-semibold px-2 py-1 bg-ferrari-50 border border-ferrari-200 rounded-md">
							COMING SOON
						</span>
						<PortalTooltipFixed
							content="Advanced style presets are currently being refined and will be available in a future update. Use the manual parameter controls below for now."
							position="right"
							size="md"
						/>
					</div>
					<div class="relative">
						<PresetSelector
							selectedPresetId={undefined}
							onPresetSelect={(preset) => {
								// Disabled - no action
							}}
							disabled={true}
							selectedAlgorithm={config.backend}
						/>
						<div class="absolute inset-0 bg-gray-100/50 rounded-md cursor-not-allowed"></div>
					</div>
				</div>

				<!-- Essential Parameters -->
				<div class="grid grid-cols-1 gap-6">
					<!-- Detail Level (Edge/Centerline backends) OR Dot Density (Dots backend) -->
					{#if config.backend !== 'superpixel'}
						<div>
							<div class="mb-2 flex items-center gap-2">
								{#if config.backend === 'dots'}
									<label
										for="detail-level-slider"
										class="text-converter-primary block text-sm font-medium"
									>
										Dot Density
									</label>
									<PortalTooltipFixed
										content="Controls how many dots are placed in the stippling output. Lower values create fewer, sparse dots. Higher values create denser, more detailed stippling."
										position="top"
										size="md"
									/>
								{:else}
									<label
										for="detail-level-slider"
										class="text-converter-primary block text-sm font-medium"
									>
										Detail Level
									</label>
									<PortalTooltipFixed
										content="Controls how much detail is captured in the conversion. Lower values create simpler, cleaner lines. Higher values preserve more fine details and texture."
										position="top"
										size="md"
									/>
								{/if}
							</div>
							<input
								id="detail-level-slider"
								bind:this={detailSliderRef}
								type="range"
								min="0.1"
								max="1"
								step="0.1"
								value={config.detail || 0.6}
								oninput={config.backend === 'dots' ? updateDotDensity : updateConfig('detail')}
								{disabled}
								class="slider-ferrari w-full"
								use:initializeSliderFill
							/>
							<div class="text-converter-secondary mt-1 flex justify-between text-xs">
								{#if config.backend === 'dots'}
									<span>Sparse</span>
									<span class="font-medium">{Math.round((config.detail || 0) * 10)}/10</span>
									<span>Dense</span>
								{:else}
									<span>Simple</span>
									<span class="font-medium">{Math.round((config.detail || 0) * 10)}/10</span>
									<span>Detailed</span>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Region Complexity (Superpixel backend only) -->
					{#if config.backend === 'superpixel'}
						<div>
							<div class="mb-2 flex items-center gap-2">
								<label
									for="region-complexity-slider"
									class="text-converter-primary block text-sm font-medium"
								>
									Region Complexity
								</label>
								<PortalTooltipFixed
									content="Controls the number of regions in the superpixel segmentation. Lower values create fewer, larger regions. Higher values create more detailed segmentation with smaller regions."
									position="top"
									size="md"
								/>
							</div>
							<input
								id="region-complexity-slider"
								bind:this={regionComplexitySliderRef}
								type="range"
								min="50"
								max="500"
								step="25"
								value={config.num_superpixels || 150}
								oninput={updateConfig('num_superpixels')}
								{disabled}
								class="slider-ferrari w-full"
								use:initializeSliderFill
							/>
							<div class="text-converter-secondary mt-1 flex justify-between text-xs">
								<span>Simple</span>
								<span class="font-medium">{config.num_superpixels || 150}</span>
								<span>Complex</span>
							</div>
						</div>
					{/if}

					<!-- Line Width / Dot Width -->
					<div>
						<div class="mb-2 flex items-center gap-2">
							<label
								for="stroke-width-slider"
								class="text-converter-primary block text-sm font-medium"
							>
								{config.backend === 'dots' ? 'Dot Width' : 'Line Width'}
							</label>
							<PortalTooltipFixed
								content={config.backend === 'dots'
									? 'Controls the size of dots in stippling output. Smaller dots create finer detail, while larger dots create bold effects.'
									: 'Adjusts the thickness of traced lines in the SVG output. Thinner lines work better for detailed images, while thicker lines are good for bold, graphic styles.'}
								position="top"
								size="md"
							/>
						</div>
						<input
							id="stroke-width-slider"
							bind:this={strokeWidthSliderRef}
							type="range"
							min="0.5"
							max="10"
							step="0.1"
							value={config.stroke_width || 2.0}
							oninput={updateConfig('stroke_width')}
							{disabled}
							class="slider-ferrari w-full"
							use:initializeSliderFill
						/>
						<div class="text-converter-secondary mt-1 flex justify-between text-xs">
							<span>{config.backend === 'dots' ? 'Small' : 'Thin'}</span>
							<span class="font-medium">{(config.stroke_width || 0).toFixed(1)}px</span>
							<span>{config.backend === 'dots' ? 'Large' : 'Thick'}</span>
						</div>
					</div>

					<!-- Unified Color Toggle (All backends) -->
					<div>
						<div class="mb-2 flex items-center gap-2">
							<label
								for="preserve-colors-unified"
								class="text-converter-primary block text-sm font-medium">Color Mode</label
							>
							<PortalTooltipFixed
								content={config.backend === 'edge' || config.backend === 'centerline'
									? 'Enable to preserve original image colors in line strokes. Disable for traditional black line art.'
									: config.backend === 'superpixel'
										? 'Enable to preserve original image colors in regions. Disable for monochrome grayscale output with enhanced contrast.'
										: 'Enable to preserve original image colors in stippled dots. Disable for monochrome grayscale stippling with enhanced contrast.'}
								position="top"
								size="md"
							/>
						</div>
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="preserve-colors-unified"
								checked={config.preserve_colors ?? false}
								onchange={(event) => {
									const target = event.target as HTMLInputElement;
									onConfigChange({ preserve_colors: target.checked });
									onParameterChange();
								}}
								{disabled}
								class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded"
							/>
							<label
								for="preserve-colors-unified"
								class="text-converter-primary cursor-pointer text-sm font-medium"
							>
								Enable Color
							</label>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Advanced Settings Panel -->
	<div
		class="card-ferrari-static to-ferrari-50/20 border-ferrari-200/50 overflow-hidden rounded-2xl border bg-gradient-to-br from-white shadow-lg"
	>
		<button
			class="to-ferrari-50/30 hover:from-ferrari-50 hover:to-ferrari-100/50 flex w-full items-center justify-between bg-gradient-to-r from-transparent p-4 text-left transition-all duration-200 focus:outline-none {isAdvancedSettingsExpanded
				? 'ring-ferrari-500 ring-2 ring-offset-2'
				: ''}"
			style="z-index: 5; position: relative;"
			onclick={() => (isAdvancedSettingsExpanded = !isAdvancedSettingsExpanded)}
			type="button"
		>
			<div class="flex items-center gap-3">
				<div class="bg-ferrari-100 rounded-lg p-2">
					<Settings class="text-ferrari-600 h-4 w-4" />
				</div>
				<h3 class="text-converter-primary text-lg font-semibold">Advanced Settings</h3>
			</div>
			<div class="flex-shrink-0">
				{#if isAdvancedSettingsExpanded}
					<ChevronUp class="text-converter-secondary h-5 w-5" />
				{:else}
					<ChevronDown class="text-converter-secondary h-5 w-5" />
				{/if}
			</div>
		</button>

		{#if isAdvancedSettingsExpanded}
			<div class="space-y-6 bg-white/50 p-4 backdrop-blur-sm">

				<!-- Parameter Panel -->
				<ParameterPanel {config} {onConfigChange} {disabled} {onParameterChange} />

				<!-- Advanced Controls -->
				<AdvancedControls {config} {onConfigChange} {disabled} {onParameterChange} />
			</div>
		{/if}
	</div>
</div>

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
