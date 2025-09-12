<script lang="ts">
	import { Settings, Sliders, ChevronDown, ChevronUp } from 'lucide-svelte';
	import type {
		VectorizerConfig,
		VectorizerBackend,
		VectorizerPreset
	} from '$lib/types/vectorizer';
	import BackendSelector from './BackendSelector.svelte';
	import PresetSelector from './PresetSelector.svelte';
	import ParameterPanel from './ParameterPanel.svelte';
	import AdvancedControls from './AdvancedControls.svelte';
	import PortalTooltipFixed from '$lib/components/ui/tooltip/PortalTooltipFixed.svelte';
	import FerrariSlider from '$lib/components/ui/FerrariSlider.svelte';

	interface Props {
		config: VectorizerConfig;
		selectedPreset: VectorizerPreset | 'custom';
		disabled?: boolean;
		onConfigChange: (_config: Partial<VectorizerConfig>) => void;
		onPresetChange: (_presetValue: VectorizerPreset | 'custom') => void;
		onBackendChange: (_backendValue: VectorizerBackend) => void;
		onParameterChange: () => void;
	}

	let {
		config,
		disabled = false,
		onConfigChange,
		onBackendChange,
		onParameterChange
	}: Props = $props();

	// UI state management
	let isQuickSettingsExpanded = $state(true);
	let isAdvancedSettingsExpanded = $state(false);

	// Check if we're on mobile
	let isMobile = $state(false);

	// Update mobile detection
	if (typeof window !== 'undefined') {
		const checkMobile = () => {
			isMobile = window.innerWidth <= 768;
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);
	}

	// Parameter update handler
	function _updateConfig(key: keyof VectorizerConfig) {
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
	function updateDotDensity(value: number) {
		const uiValue = value; // UI slider value (1 to 10, same as Advanced Settings)

		// Apply the same mapping as Advanced Settings (1-10 to 0.4-0.02)
		// This ensures both Quick and Advanced Settings are perfectly synced
		const threshold = 0.4 - ((uiValue - 1) / 9) * (0.4 - 0.02);

		console.log(
			`🎯 Quick Settings Dot Density mapping (SYNC FIX): UI=${uiValue}/10 → threshold=${threshold.toFixed(3)}`
		);

		// Update both parameters for consistency (same as Advanced Settings)
		// Convert back to detail scale (0.1-1.0) for consistency
		const detailValue = uiValue / 10;
		onConfigChange({
			detail: detailValue, // Keep detail in sync for other logic
			dot_density_threshold: threshold
		});
		onParameterChange();
	}

	// Reactive values for FerrariSlider components
	let detailValue = $state(
		config.backend === 'dots' ? Math.round((config.detail || 0.5) * 10) : config.detail || 0.6
	);
	// eslint-disable-next-line svelte/prefer-writable-derived
	let strokeWidthValue = $state(config.stroke_width || 2.0);
	// eslint-disable-next-line svelte/prefer-writable-derived
	let regionComplexityValue = $state(config.num_superpixels || 150);

	// Update reactive values when config changes
	$effect(() => {
		if (config.backend === 'dots') {
			// For dots backend, convert from detail (0.1-1.0) to UI scale (1-10) to match Advanced Settings
			detailValue = Math.round((config.detail || 0.5) * 10);
		} else {
			// For other backends, use detail directly (0.1-1.0)
			detailValue = config.detail || 0.6;
		}
	});

	$effect(() => {
		strokeWidthValue = config.stroke_width || 2.0;
	});

	$effect(() => {
		regionComplexityValue = config.num_superpixels || 150;
	});
</script>

<div class="w-full max-w-sm space-y-4 space-y-6 md:space-y-4">
	<!-- Quick Settings Panel -->
	<div
		class="card-ferrari-static to-ferrari-50/20 border-ferrari-200/50 overflow-hidden rounded-2xl border bg-gradient-to-br from-white shadow-lg"
	>
		<button
			class="mobile-touch-target to-ferrari-50/30 hover:from-ferrari-50 hover:to-ferrari-100/50 flex w-full items-center justify-between bg-gradient-to-r from-transparent p-4 text-left transition-all duration-200 focus:outline-none active:scale-[0.98] {isQuickSettingsExpanded
				? 'ring-ferrari-500 ring-2 ring-offset-2'
				: ''}"
			style="z-index: 5; position: relative;"
			onclick={() => (isQuickSettingsExpanded = !isQuickSettingsExpanded)}
			type="button"
			aria-expanded={isQuickSettingsExpanded}
			aria-controls="quick-settings-content"
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
			<div id="quick-settings-content" class="space-y-6 bg-white/50 p-4 backdrop-blur-sm">
				<!-- Algorithm Selection - ALWAYS VISIBLE (Essential Level) -->
				<div>
					<div class="mb-3 flex items-center gap-2">
						<label for="backend-selector" class="text-converter-primary block text-sm font-medium">
							Algorithm
						</label>
						<PortalTooltipFixed
							content="Choose the line tracing algorithm. Edge Tracing is best for line art, Centerline for simple shapes, Superpixel for stylized art, and Stippling for highest detail."
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

				<!-- Style Preset (Disabled - Coming Soon) - STANDARD+ ONLY -->
				{#if !isMobile || settingsMode !== 'essential'}
					<div>
						<div class="mb-3 flex items-center gap-2">
							<label
								for="preset-selector"
								class="text-converter-secondary block text-sm font-medium opacity-60"
							>
								Style Preset
							</label>
							<span
								class="text-ferrari-600 bg-ferrari-50 border-ferrari-200 rounded-md border px-2 py-1 text-xs font-semibold"
							>
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
								onPresetSelect={() => {
									// Disabled - no action
								}}
								disabled={true}
								selectedAlgorithm={config.backend}
							/>
							<div class="absolute inset-0 cursor-not-allowed rounded-md bg-gray-100/50"></div>
						</div>
					</div>
				{/if}

				<!-- Essential Parameters - STANDARD+ LEVEL -->
				{#if !isMobile || settingsMode !== 'essential'}
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
								<FerrariSlider
									id="detail-level-slider"
									bind:value={detailValue}
									min={config.backend === 'dots' ? 1 : 0.1}
									max={config.backend === 'dots' ? 10 : 1}
									step={config.backend === 'dots' ? 1 : 0.1}
									oninput={config.backend === 'dots'
										? updateDotDensity
										: (value) => {
												onConfigChange({ detail: value });
												onParameterChange();
											}}
									{disabled}
									class="w-full"
								/>
								<div class="text-converter-secondary mt-1 flex justify-between text-xs">
									{#if config.backend === 'dots'}
										<span>Sparse</span>
										<span class="font-medium">{Math.round(detailValue)}/10</span>
										<span>Dense</span>
									{:else}
										<span>Simple</span>
										<span class="font-medium">{Math.round(detailValue * 10)}/10</span>
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
								<FerrariSlider
									id="region-complexity-slider"
									bind:value={regionComplexityValue}
									min={50}
									max={500}
									step={25}
									oninput={(value) => {
										onConfigChange({ num_superpixels: value });
										onParameterChange();
									}}
									{disabled}
									class="w-full"
								/>
								<div class="text-converter-secondary mt-1 flex justify-between text-xs">
									<span>Simple</span>
									<span class="font-medium">{regionComplexityValue}</span>
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
							<FerrariSlider
								id="stroke-width-slider"
								bind:value={strokeWidthValue}
								min={0.5}
								max={10}
								step={0.1}
								oninput={(value) => {
									onConfigChange({ stroke_width: value });
									onParameterChange();
								}}
								{disabled}
								class="w-full"
							/>
							<div class="text-converter-secondary mt-1 flex justify-between text-xs">
								<span>{config.backend === 'dots' ? 'Small' : 'Thin'}</span>
								<span class="font-medium">{strokeWidthValue.toFixed(1)}px</span>
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
				{/if}
			</div>
		{/if}
	</div>

	<!-- Advanced Settings Panel -->
	<div
		class="card-ferrari-static to-ferrari-50/20 border-ferrari-200/50 overflow-hidden rounded-2xl border bg-gradient-to-br from-white shadow-lg"
	>
		<button
			class="mobile-touch-target to-ferrari-50/30 hover:from-ferrari-50 hover:to-ferrari-100/50 flex w-full items-center justify-between bg-gradient-to-r from-transparent p-4 text-left transition-all duration-200 focus:outline-none active:scale-[0.98] {isAdvancedSettingsExpanded
				? 'ring-ferrari-500 ring-2 ring-offset-2'
				: ''}"
			style="z-index: 5; position: relative;"
			onclick={() => (isAdvancedSettingsExpanded = !isAdvancedSettingsExpanded)}
			type="button"
			aria-expanded={isAdvancedSettingsExpanded}
			aria-controls="advanced-settings-content"
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
			<div id="advanced-settings-content" class="space-y-6 bg-white/50 p-4 backdrop-blur-sm">
				<!-- Parameter Panel -->
				<ParameterPanel {config} {onConfigChange} {disabled} {onParameterChange} />

				<!-- Advanced Controls -->
				<AdvancedControls {config} {onConfigChange} {disabled} {onParameterChange} />
			</div>
		{/if}
	</div>
</div>
