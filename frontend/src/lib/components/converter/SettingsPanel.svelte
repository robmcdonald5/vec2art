<script lang="ts">
	import {
		Settings,
		Sliders,
		ChevronDown,
		ChevronUp,
		Eye,
		PenTool,
		Puzzle,
		Droplets
	} from 'lucide-svelte';
	import { algorithmConfigStore } from '$lib/stores/algorithm-config-store.svelte';

	import BackendSelector from './BackendSelector.svelte';
	import PortalTooltipFixed from '$lib/components/ui/tooltip/PortalTooltipFixed.svelte';
	import FerrariSlider from '$lib/components/ui/FerrariSlider.svelte';
	import FerrariCheckbox from '$lib/components/ui/FerrariCheckbox.svelte';

	// Import algorithm-specific parameter panels
	import EdgeParameterPanel from './EdgeParameterPanel.svelte';
	import CenterlineParameterPanel from './CenterlineParameterPanel.svelte';
	import SuperpixelParameterPanel from './SuperpixelParameterPanel.svelte';
	import DotsParameterPanel from './DotsParameterPanel.svelte';

	interface Props {
		disabled?: boolean;
	}

	let { disabled = false }: Props = $props();

	// Get current algorithm from store
	const currentAlgorithm = $derived(algorithmConfigStore.currentAlgorithm);
	// Get the current config using the derived currentConfig property
	const config = $derived(algorithmConfigStore.currentConfig);

	// UI state management with persistence
	let isQuickSettingsExpanded = $state(loadPanelState('isQuickSettingsExpanded', true));
	let isAdvancedSettingsExpanded = $state(loadPanelState('isAdvancedSettingsExpanded', false));

	// Check if we're on mobile
	let isMobile = $state(false);

	// Settings mode for mobile - defaults to 'standard' to show all controls
	let settingsMode = $state('standard');

	// Update mobile detection
	if (typeof window !== 'undefined') {
		const checkMobile = () => {
			isMobile = window.innerWidth <= 768;
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);
	}

	// Handle algorithm change
	function handleBackendChange(backend: string) {
		algorithmConfigStore.setCurrentAlgorithm(backend as any);
	}

	// Handle quick setting changes
	function updateDetail(value: number) {
		algorithmConfigStore.updateConfig(currentAlgorithm, { detail: value });
	}

	function updateStrokeWidth(value: number) {
		algorithmConfigStore.updateConfig(currentAlgorithm, { strokeWidth: value });
	}

	function updatePreserveColors(value: boolean) {
		// Different algorithms use different property names for color preservation
		const colorProperty =
			currentAlgorithm === 'edge' || currentAlgorithm === 'centerline'
				? 'linePreserveColors'
				: currentAlgorithm === 'superpixel'
					? 'superpixelPreserveColors'
					: currentAlgorithm === 'dots'
						? 'dotPreserveColors'
						: 'preserveColors';

		algorithmConfigStore.updateConfig(currentAlgorithm, { [colorProperty]: value });
	}

	// Special handler for dots backend detail/density mapping
	function updateDotDensity(value: number) {
		const uiValue = value; // UI slider value (1 to 10)
		const threshold = 0.4 - ((uiValue - 1) / 9) * (0.4 - 0.02);
		const detailValue = uiValue / 10;
		algorithmConfigStore.updateConfig('dots', {
			detail: detailValue,
			dotDensity: uiValue
		});
	}

	// Handle superpixel region count
	function updateRegionCount(value: number) {
		algorithmConfigStore.updateConfig('superpixel', { regionCount: value });
	}

	// Reactive values for FerrariSlider components
	const detailValue = $derived(
		currentAlgorithm === 'dots'
			? (config as any).dotDensity || Math.round((config.detail || 0.5) * 10)
			: config.detail || 0.6
	);

	const strokeWidthValue = $derived(config.strokeWidth || 2.0);
	const regionComplexityValue = $derived(
		currentAlgorithm === 'superpixel'
			? (config as any).regionCount || (config as any).numSuperpixels || 150
			: 150
	);

	// Panel state persistence functions
	function loadPanelState(key: string, defaultValue: boolean): boolean {
		if (typeof window === 'undefined') return defaultValue;
		try {
			const saved = localStorage.getItem(`vec2art-panel-${key}`);
			return saved !== null ? JSON.parse(saved) : defaultValue;
		} catch {
			return defaultValue;
		}
	}

	function savePanelState(key: string, value: boolean): void {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(`vec2art-panel-${key}`, JSON.stringify(value));
		} catch (error) {
			console.warn('Failed to save panel state:', error);
		}
	}

	// Handler functions for panel toggles
	function toggleQuickSettings() {
		isQuickSettingsExpanded = !isQuickSettingsExpanded;
		savePanelState('isQuickSettingsExpanded', isQuickSettingsExpanded);
	}

	function toggleAdvancedSettings() {
		isAdvancedSettingsExpanded = !isAdvancedSettingsExpanded;
		savePanelState('isAdvancedSettingsExpanded', isAdvancedSettingsExpanded);
	}
</script>

<div class="w-full max-w-sm space-y-4 space-y-6 md:space-y-4">
	<!-- Quick Settings Panel -->
	<div
		class="card-ferrari-static to-ferrari-50/20 border-ferrari-200/50 overflow-hidden rounded-2xl border bg-gradient-to-br from-white shadow-lg"
	>
		<button
			class="mobile-touch-target to-ferrari-50/30 hover:from-ferrari-50 hover:to-ferrari-100/50 flex w-full items-center justify-between bg-gradient-to-r from-transparent p-4 text-left transition-all duration-200 focus:outline-none active:scale-[0.98]"
			style="z-index: 5; position: relative;"
			onclick={toggleQuickSettings}
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
						selectedBackend={currentAlgorithm}
						onBackendChange={handleBackendChange}
						{disabled}
						compact={true}
					/>
				</div>

				<!-- Essential Parameters - STANDARD+ LEVEL -->
				{#if !isMobile || settingsMode !== 'essential'}
					<div class="grid grid-cols-1 gap-6">
						<!-- Detail Level (Edge/Centerline backends) OR Dot Density (Dots backend) -->
						{#if currentAlgorithm !== 'superpixel'}
							<div>
								<div class="mb-2 flex items-center gap-2">
									{#if currentAlgorithm === 'dots'}
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
									value={detailValue}
									min={currentAlgorithm === 'dots' ? 1 : 0.1}
									max={currentAlgorithm === 'dots' ? 10 : 1}
									step={currentAlgorithm === 'dots' ? 1 : 0.1}
									oninput={(value) => {
										if (currentAlgorithm === 'dots') {
											updateDotDensity(value);
										} else {
											updateDetail(value);
										}
									}}
									{disabled}
									class="w-full"
								/>
								<div class="text-converter-secondary mt-1 flex justify-between text-xs">
									{#if currentAlgorithm === 'dots'}
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
						{#if currentAlgorithm === 'superpixel'}
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
									value={regionComplexityValue}
									min={50}
									max={500}
									step={25}
									oninput={(value) => updateRegionCount(value)}
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
									{currentAlgorithm === 'dots' ? 'Dot Width' : 'Line Width'}
								</label>
								<PortalTooltipFixed
									content={currentAlgorithm === 'dots'
										? 'Controls the size of dots in stippling output. Smaller dots create finer detail, while larger dots create bold effects.'
										: 'Adjusts the thickness of traced lines in the SVG output. Thinner lines work better for detailed images, while thicker lines are good for bold, graphic styles.'}
									position="top"
									size="md"
								/>
							</div>
							<FerrariSlider
								id="stroke-width-slider"
								value={strokeWidthValue}
								min={0.5}
								max={10}
								step={0.1}
								oninput={(value) => updateStrokeWidth(value)}
								{disabled}
								class="w-full"
							/>
							<div class="text-converter-secondary mt-1 flex justify-between text-xs">
								<span>{currentAlgorithm === 'dots' ? 'Small' : 'Thin'}</span>
								<span class="font-medium">{strokeWidthValue.toFixed(1)}px</span>
								<span>{currentAlgorithm === 'dots' ? 'Large' : 'Thick'}</span>
							</div>
						</div>

						<!-- Unified Color Toggle (All backends) -->
						<div class="flex items-center gap-2">
							<FerrariCheckbox
								id="preserve-colors-unified"
								checked={config.preserveColors ?? false}
								{disabled}
								label="Enable Color"
								onchange={(checked) => updatePreserveColors(checked)}
							/>
							<PortalTooltipFixed
								content={currentAlgorithm === 'edge' || currentAlgorithm === 'centerline'
									? 'Enable to preserve original image colors in line strokes. Disable for traditional black line art.'
									: currentAlgorithm === 'superpixel'
										? 'Enable to preserve original image colors in regions. Disable for monochrome grayscale output with enhanced contrast.'
										: 'Enable to preserve original image colors in stippled dots. Disable for monochrome grayscale stippling with enhanced contrast.'}
								position="top"
								size="md"
							/>
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
			class="mobile-touch-target to-ferrari-50/30 hover:from-ferrari-50 hover:to-ferrari-100/50 flex w-full items-center justify-between bg-gradient-to-r from-transparent p-4 text-left transition-all duration-200 focus:outline-none active:scale-[0.98]"
			style="z-index: 5; position: relative;"
			onclick={toggleAdvancedSettings}
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
				<!-- Algorithm-Specific Parameters -->
				{#if currentAlgorithm === 'edge'}
					<EdgeParameterPanel {disabled} />
				{:else if currentAlgorithm === 'centerline'}
					<CenterlineParameterPanel {disabled} />
				{:else if currentAlgorithm === 'superpixel'}
					<SuperpixelParameterPanel {disabled} />
				{:else if currentAlgorithm === 'dots'}
					<DotsParameterPanel {disabled} />
				{/if}
			</div>
		{/if}
	</div>
</div>
