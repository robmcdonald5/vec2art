<script lang="ts">
	import { Settings, Sliders, ChevronDown, ChevronUp, Zap, Cpu } from 'lucide-svelte';
	import type {
		VectorizerConfig,
		VectorizerBackend,
		VectorizerPreset
	} from '$lib/types/vectorizer';
	import type { PerformanceMode } from '$lib/utils/performance-monitor';
	import { performanceMonitor, getOptimalThreadCount } from '$lib/utils/performance-monitor';
	import BackendSelector from './BackendSelector.svelte';
	import PresetSelector from './PresetSelector.svelte';
	import ParameterPanel from './ParameterPanel.svelte';
	import AdvancedControls from './AdvancedControls.svelte';
	import Tooltip from '$lib/components/ui/tooltip/Tooltip.svelte';

	interface Props {
		config: VectorizerConfig;
		selectedPreset: VectorizerPreset | 'custom';
		performanceMode?: PerformanceMode;
		threadCount?: number;
		threadsInitialized?: boolean;
		hasError?: boolean;
		disabled?: boolean;
		onConfigChange: (updates: Partial<VectorizerConfig>) => void;
		onPresetChange: (preset: VectorizerPreset | 'custom') => void;
		onBackendChange: (backend: VectorizerBackend) => void;
		onParameterChange: () => void;
		onPerformanceModeChange?: (mode: PerformanceMode, threadCount: number) => void;
		onRetryInitialization?: () => void;
	}

	let {
		config,
		selectedPreset,
		performanceMode = 'balanced',
		threadCount = 4,
		threadsInitialized = false,
		hasError = false,
		disabled = false,
		onConfigChange,
		onPresetChange,
		onBackendChange,
		onParameterChange,
		onPerformanceModeChange,
		onRetryInitialization
	}: Props = $props();

	// UI state management
	let isQuickSettingsExpanded = $state(true);
	let isAdvancedSettingsExpanded = $state(false);

	// Performance state
	let currentPerformanceMode = $state<PerformanceMode>(performanceMode);
	let currentThreadCount = $state(threadCount);
	const systemCapabilities = performanceMonitor.getSystemCapabilities();

	// Update performance mode
	function clickPerformanceMode(mode: PerformanceMode) {
		console.log('🔧 Performance Mode selected:', mode);
		currentPerformanceMode = mode;
		const optimalThreads = mode === 'custom' ? currentThreadCount : getOptimalThreadCount(mode);
		onPerformanceModeChange?.(mode, optimalThreads);
	}

	// Thread count handler
	function updateThreadCount(event: Event) {
		const target = event.target as HTMLInputElement;
		currentThreadCount = parseInt(target.value);
		if (currentPerformanceMode === 'custom') {
			onPerformanceModeChange?.('custom', currentThreadCount);
		}
	}

	// Retry initialization handler
	function handleRetryInitialization() {
		console.log('🔄 Retrying WASM initialization...');
		onRetryInitialization?.();
	}

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

			console.log(`🔧 Config update: ${key} = ${value}`);
			onConfigChange({ [key]: value } as Partial<VectorizerConfig>);
			onParameterChange();
		};
	}

	// Special handler for dots backend detail/density mapping
	function updateDotDensity(event: Event) {
		const target = event.target as HTMLInputElement;
		const uiValue = parseFloat(target.value); // UI slider value (0.1 to 1.0)

		// INVERT for intuitive UX: Higher UI value = More dots = Lower density threshold
		// Map UI range (0.1-1.0) to density threshold range (0.4-0.02)
		const minThreshold = 0.02; // More dots
		const maxThreshold = 0.4; // Fewer dots
		const invertedValue =
			maxThreshold - ((uiValue - 0.1) / (1.0 - 0.1)) * (maxThreshold - minThreshold);

		console.log(`🎯 Dot Density mapping: UI=${uiValue} → threshold=${invertedValue.toFixed(3)}`);

		// Update both parameters for proper functionality
		onConfigChange({
			detail: uiValue, // Keep detail in sync for other logic
			dot_density_threshold: invertedValue
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
						<Tooltip
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

				<!-- Style Preset -->
				<div>
					<div class="mb-3 flex items-center gap-2">
						<label for="preset-selector" class="text-converter-primary block text-sm font-medium">
							Style Preset
						</label>
						<Tooltip
							content="Pre-configured settings for different art styles. Photo for realistic images, Logo for sharp graphics, Artistic for creative effects, and Sketch for hand-drawn appearance."
							position="right"
							size="md"
						/>
					</div>
					<PresetSelector
						{selectedPreset}
						{onPresetChange}
						{disabled}
						isCustom={selectedPreset === 'custom'}
						compact={true}
					/>
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
									<Tooltip
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
									<Tooltip
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
								<Tooltip
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
							<Tooltip
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
							max="5"
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
							<Tooltip
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
				<!-- Performance Configuration -->
				<div
					class="from-ferrari-50 to-ferrari-100/30 border-ferrari-200/30 rounded-xl border bg-gradient-to-br p-5"
				>
					<!-- Enhanced Header with improved responsive layout -->
					<div class="mb-6">
						<!-- Title row -->
						<div class="mb-3 flex items-center gap-3">
							<div class="bg-ferrari-200/50 rounded-lg p-2">
								<Zap class="text-ferrari-600 h-5 w-5" />
							</div>
							<h4 class="text-converter-primary text-lg font-semibold">Performance</h4>
						</div>

						<!-- Status indicators row - better responsive layout -->
						<div class="mb-3 flex flex-wrap items-center gap-2">
							<div
								class="bg-ferrari-100 text-ferrari-800 inline-flex flex-shrink-0 items-center rounded-full px-3 py-1.5 text-sm font-medium shadow-sm"
							>
								<Cpu class="mr-1.5 h-4 w-4 flex-shrink-0" />
								<span class="font-mono">{threadCount}</span>
								<span class="ml-1 text-xs opacity-75">threads</span>
							</div>

							<!-- Enhanced status indicator with error handling -->
							{#if hasError}
								<button
									class="inline-flex flex-shrink-0 cursor-pointer items-center rounded-full bg-red-100 px-3 py-1.5 text-sm font-medium text-red-800 shadow-sm transition-colors duration-200 hover:bg-red-200"
									onclick={handleRetryInitialization}
									{disabled}
									type="button"
									title="Click to retry WASM initialization"
								>
									<div class="mr-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-500"></div>
									<span class="whitespace-nowrap">Retry</span>
								</button>
							{:else if threadsInitialized}
								<div
									class="inline-flex flex-shrink-0 items-center rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-800 shadow-sm"
								>
									<div class="mr-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
									<span class="whitespace-nowrap">Active</span>
								</div>
							{:else}
								<div
									class="inline-flex flex-shrink-0 items-center rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 shadow-sm"
								>
									<div class="mr-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-green-400"></div>
									<span class="whitespace-nowrap">Ready</span>
								</div>
							{/if}
						</div>

						<!-- Performance description -->
						<p class="text-converter-secondary text-sm leading-relaxed">
							Optimize processing speed and system resource usage for your device capabilities.
						</p>
					</div>

					<!-- Performance Mode Selection with enhanced visual hierarchy -->
					<div class="space-y-4">
						<div class="flex items-center gap-2">
							<label class="text-converter-primary block text-base font-medium">
								Performance Mode
							</label>
							<Tooltip
								content="Controls CPU usage and processing speed. Economy uses fewer threads for background processing, Balanced provides optimal speed/resource balance, Performance maximizes speed using all available cores."
								position="top"
								size="md"
							/>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<!-- Economy Mode -->
							<button
								class="group flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 focus:outline-none {currentPerformanceMode ===
								'economy'
									? 'border-green-500 bg-gray-50 text-gray-700'
									: 'border-gray-200 bg-white text-gray-700 hover:border-green-300'}"
								onclick={() => clickPerformanceMode('economy')}
								{disabled}
								type="button"
							>
								<div class="h-3 w-3 flex-shrink-0 rounded-full bg-green-500"></div>
								<span>Economy</span>
							</button>

							<!-- Balanced Mode -->
							<button
								class="group flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 focus:outline-none {currentPerformanceMode ===
								'balanced'
									? 'border-blue-500 bg-gray-50 text-gray-700'
									: 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'}"
								onclick={() => clickPerformanceMode('balanced')}
								{disabled}
								type="button"
							>
								<div class="h-3 w-3 flex-shrink-0 rounded-full bg-blue-500"></div>
								<span>Balanced</span>
							</button>

							<!-- Performance Mode -->
							<button
								class="group flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 focus:outline-none {currentPerformanceMode ===
								'performance'
									? 'border-yellow-500 bg-gray-50 text-gray-700'
									: 'border-gray-200 bg-white text-gray-700 hover:border-yellow-300'}"
								onclick={() => clickPerformanceMode('performance')}
								{disabled}
								type="button"
							>
								<div class="h-3 w-3 flex-shrink-0 rounded-full bg-yellow-500"></div>
								<span>Performance</span>
							</button>

							<!-- Custom Mode -->
							<button
								class="group flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 focus:outline-none {currentPerformanceMode ===
								'custom'
									? 'border-purple-500 bg-gray-50 text-gray-700'
									: 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'}"
								onclick={() => clickPerformanceMode('custom')}
								{disabled}
								type="button"
							>
								<div class="h-3 w-3 flex-shrink-0 rounded-full bg-purple-500"></div>
								<span>Custom</span>
							</button>
						</div>

						<!-- Enhanced mode description with better visual treatment -->
						<div
							class="text-converter-secondary from-ferrari-50 to-ferrari-100/50 border-ferrari-200/30 rounded-xl border bg-gradient-to-r p-4 text-sm"
						>
							<div class="flex items-start gap-3">
								<div class="mt-0.5">
									{#if currentPerformanceMode === 'economy'}
										<div class="flex h-3 w-3 items-center justify-center rounded-full bg-green-500">
											<div class="h-1.5 w-1.5 rounded-full bg-white"></div>
										</div>
									{:else if currentPerformanceMode === 'balanced'}
										<div class="flex h-3 w-3 items-center justify-center rounded-full bg-blue-500">
											<div class="h-1.5 w-1.5 rounded-full bg-white"></div>
										</div>
									{:else if currentPerformanceMode === 'performance'}
										<div
											class="flex h-3 w-3 items-center justify-center rounded-full bg-yellow-500"
										>
											<div class="h-1.5 w-1.5 rounded-full bg-white"></div>
										</div>
									{:else if currentPerformanceMode === 'custom'}
										<div
											class="flex h-3 w-3 items-center justify-center rounded-full bg-purple-500"
										>
											<div class="h-1.5 w-1.5 rounded-full bg-white"></div>
										</div>
									{/if}
								</div>
								<div>
									{#if currentPerformanceMode === 'economy'}
										<span class="text-ferrari-700 font-semibold">Economy Mode:</span>
										<span class="text-converter-secondary"
											>Minimal CPU usage for background processing. Ideal when multitasking or on
											battery power.</span
										>
									{:else if currentPerformanceMode === 'balanced'}
										<span class="text-ferrari-700 font-semibold">Balanced Mode:</span>
										<span class="text-converter-secondary"
											>Optimal speed and system responsiveness. Recommended for most users.</span
										>
									{:else if currentPerformanceMode === 'performance'}
										<span class="text-ferrari-700 font-semibold">Performance Mode:</span>
										<span class="text-converter-secondary"
											>Maximum processing speed using all available cores. May temporarily slow
											other applications.</span
										>
									{:else if currentPerformanceMode === 'custom'}
										<span class="text-ferrari-700 font-semibold">Custom Mode:</span>
										<span class="text-converter-secondary"
											>Fine-tune thread count for your specific hardware and workload requirements.</span
										>
									{/if}
								</div>
							</div>
						</div>
					</div>

					<!-- Enhanced Custom Thread Count Section -->
					{#if currentPerformanceMode === 'custom'}
						<div
							class="to-ferrari-50/30 mt-6 space-y-4 rounded-xl border border-purple-200/30 bg-gradient-to-br from-purple-50/50 p-4"
						>
							<!-- Improved header layout with better spacing -->
							<div class="space-y-3">
								<!-- Title row -->
								<div class="flex items-center gap-2">
									<div class="flex-shrink-0 rounded-lg bg-purple-100 p-1.5">
										<Cpu class="h-4 w-4 text-purple-600" />
									</div>
									<label class="text-converter-primary text-base font-medium"
										>Thread Configuration</label
									>
									<Tooltip
										content="Number of parallel processing threads. More threads = faster processing but higher CPU usage. Optimal number depends on your device's capabilities."
										position="top"
										size="md"
									/>
								</div>

								<!-- Counter display row -->
								<div class="flex justify-start">
									<span
										class="rounded-full bg-purple-100 px-4 py-2 font-mono text-sm font-medium text-purple-800 shadow-sm"
									>
										{currentThreadCount}
										<span class="ml-1 text-xs opacity-75">of {systemCapabilities.cores}</span>
									</span>
								</div>
							</div>

							<!-- Thread Count Slider with Visual Progress -->
							<div class="space-y-3">
								<div class="relative">
									<input
										type="range"
										min="1"
										max={systemCapabilities.cores}
										step="1"
										value={currentThreadCount}
										oninput={updateThreadCount}
										{disabled}
										class="slider-ferrari h-2 w-full"
										use:initializeSliderFill
									/>
									<!-- Thread usage visualization -->
									<div class="text-converter-secondary mt-2 flex justify-between text-xs">
										<span class="flex items-center gap-1">
											<div class="h-2 w-2 rounded-full bg-green-500"></div>
											Light (1-2)
										</span>
										<span class="flex items-center gap-1">
											<div class="h-2 w-2 rounded-full bg-blue-500"></div>
											Optimal ({getOptimalThreadCount('balanced')})
										</span>
										<span class="flex items-center gap-1">
											<div class="h-2 w-2 rounded-full bg-orange-500"></div>
											Max ({systemCapabilities.cores})
										</span>
									</div>
								</div>

								<!-- Performance Impact Indicator -->
								<div class="rounded-lg border border-purple-200/50 bg-white/70 p-3 text-sm">
									<div class="mb-2 flex items-center gap-2">
										<div
											class="h-3 w-3 rounded-full {currentThreadCount <= 2
												? 'bg-green-500'
												: currentThreadCount <= getOptimalThreadCount('balanced')
													? 'bg-blue-500'
													: 'bg-orange-500'}"
										></div>
										<span class="text-converter-primary font-medium">
											{#if currentThreadCount <= 2}
												Light Usage
											{:else if currentThreadCount <= getOptimalThreadCount('balanced')}
												Optimal Performance
											{:else}
												High Performance
											{/if}
										</span>
									</div>
									<p class="text-converter-secondary text-xs leading-relaxed">
										{#if currentThreadCount <= 2}
											Minimal CPU impact, suitable for background processing and multitasking.
										{:else if currentThreadCount <= getOptimalThreadCount('balanced')}
											Balanced speed and resource usage, recommended for most workflows.
										{:else}
											Maximum processing speed but may temporarily affect other applications.
										{/if}
									</p>
								</div>
							</div>
						</div>
					{/if}
				</div>

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
