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
						<label class="text-converter-primary block text-sm font-medium"> Algorithm </label>
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
						<label class="text-converter-primary block text-sm font-medium"> Style Preset </label>
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
					<!-- Detail Level -->
					<div>
						<div class="mb-2 flex items-center gap-2">
							<label class="text-converter-primary block text-sm font-medium"> Detail Level </label>
							<Tooltip
								content="Controls how much detail is captured in the conversion. Lower values create simpler, cleaner lines. Higher values preserve more fine details and texture."
								position="top"
								size="md"
							/>
						</div>
						<input
							type="range"
							min="0.1"
							max="1"
							step="0.1"
							value={config.detail || 0.6}
							oninput={updateConfig('detail')}
							{disabled}
							class="slider-ferrari w-full"
							use:initializeSliderFill
						/>
						<div class="text-converter-secondary mt-1 flex justify-between text-xs">
							<span>Simple</span>
							<span class="font-medium">{Math.round((config.detail || 0) * 10)}/10</span>
							<span>Detailed</span>
						</div>
					</div>

					<!-- Line Width -->
					<div>
						<div class="mb-2 flex items-center gap-2">
							<label class="text-converter-primary block text-sm font-medium"> Line Width </label>
							<Tooltip
								content="Adjusts the thickness of traced lines in the SVG output. Thinner lines work better for detailed images, while thicker lines are good for bold, graphic styles."
								position="top"
								size="md"
							/>
						</div>
						<input
							type="range"
							min="0.5"
							max="5"
							step="0.1"
							value={config.line_width || 2.0}
							oninput={updateConfig('line_width')}
							{disabled}
							class="slider-ferrari w-full"
							use:initializeSliderFill
						/>
						<div class="text-converter-secondary mt-1 flex justify-between text-xs">
							<span>Thin</span>
							<span class="font-medium">{(config.line_width || 0).toFixed(1)}px</span>
							<span>Thick</span>
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
						<div class="flex items-center gap-3 mb-3">
							<div class="bg-ferrari-200/50 rounded-lg p-2">
								<Zap class="text-ferrari-600 h-5 w-5" />
							</div>
							<h4 class="text-converter-primary text-lg font-semibold">Performance</h4>
						</div>
						
						<!-- Status indicators row - better responsive layout -->
						<div class="flex flex-wrap items-center gap-2 mb-3">
							<div class="bg-ferrari-100 text-ferrari-800 inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium shadow-sm flex-shrink-0">
								<Cpu class="mr-1.5 h-4 w-4 flex-shrink-0" />
								<span class="font-mono">{threadCount}</span>
								<span class="ml-1 text-xs opacity-75">threads</span>
							</div>
							
							<!-- Enhanced status indicator with error handling -->
							{#if hasError}
								<button
									class="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium shadow-sm flex-shrink-0 bg-red-100 text-red-800 hover:bg-red-200 transition-colors duration-200 cursor-pointer"
									onclick={handleRetryInitialization}
									disabled={disabled}
									type="button"
									title="Click to retry WASM initialization"
								>
									<div class="mr-1.5 h-2 w-2 rounded-full flex-shrink-0 bg-red-500"></div>
									<span class="whitespace-nowrap">Retry</span>
								</button>
							{:else if threadsInitialized}
								<div class="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium shadow-sm flex-shrink-0 bg-green-100 text-green-800">
									<div class="mr-1.5 h-2 w-2 rounded-full flex-shrink-0 bg-green-500"></div>
									<span class="whitespace-nowrap">Active</span>
								</div>
							{:else}
								<div class="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium shadow-sm flex-shrink-0 bg-green-50 text-green-700 border border-green-200">
									<div class="mr-1.5 h-2 w-2 rounded-full flex-shrink-0 bg-green-400"></div>
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
								class="group flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 {currentPerformanceMode === 'economy' ? 'border-green-500 bg-gray-50 text-gray-700' : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'}"
								onclick={() => clickPerformanceMode('economy')}
								{disabled}
								type="button"
							>
								<div class="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
								<span>Economy</span>
							</button>
							
							<!-- Balanced Mode -->
							<button
								class="group flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 {currentPerformanceMode === 'balanced' ? 'border-blue-500 bg-gray-50 text-gray-700' : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'}"
								onclick={() => clickPerformanceMode('balanced')}
								{disabled}
								type="button"
							>
								<div class="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
								<span>Balanced</span>
							</button>
							
							<!-- Performance Mode -->
							<button
								class="group flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 {currentPerformanceMode === 'performance' ? 'border-yellow-500 bg-gray-50 text-gray-700' : 'border-gray-200 bg-white text-gray-700 hover:border-yellow-300'}"
								onclick={() => clickPerformanceMode('performance')}
								{disabled}
								type="button"
							>
								<div class="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0"></div>
								<span>Performance</span>
							</button>
							
							<!-- Custom Mode -->
							<button
								class="group flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 {currentPerformanceMode === 'custom' ? 'border-purple-500 bg-gray-50 text-gray-700' : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'}"
								onclick={() => clickPerformanceMode('custom')}
								{disabled}
								type="button"
							>
								<div class="w-3 h-3 rounded-full bg-purple-500 flex-shrink-0"></div>
								<span>Custom</span>
							</button>
						</div>

						<!-- Enhanced mode description with better visual treatment -->
						<div class="text-converter-secondary bg-gradient-to-r from-ferrari-50 to-ferrari-100/50 rounded-xl p-4 text-sm border border-ferrari-200/30">
							<div class="flex items-start gap-3">
								<div class="mt-0.5">
									{#if currentPerformanceMode === 'economy'}
										<div class="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
											<div class="w-1.5 h-1.5 rounded-full bg-white"></div>
										</div>
									{:else if currentPerformanceMode === 'balanced'}
										<div class="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
											<div class="w-1.5 h-1.5 rounded-full bg-white"></div>
										</div>
									{:else if currentPerformanceMode === 'performance'}
										<div class="w-3 h-3 rounded-full bg-yellow-500 flex items-center justify-center">
											<div class="w-1.5 h-1.5 rounded-full bg-white"></div>
										</div>
									{:else if currentPerformanceMode === 'custom'}
										<div class="w-3 h-3 rounded-full bg-purple-500 flex items-center justify-center">
											<div class="w-1.5 h-1.5 rounded-full bg-white"></div>
										</div>
									{/if}
								</div>
								<div>
									{#if currentPerformanceMode === 'economy'}
										<span class="text-ferrari-700 font-semibold">Economy Mode:</span>
										<span class="text-converter-secondary">Minimal CPU usage for background processing. Ideal when multitasking or on battery power.</span>
									{:else if currentPerformanceMode === 'balanced'}
										<span class="text-ferrari-700 font-semibold">Balanced Mode:</span>
										<span class="text-converter-secondary">Optimal speed and system responsiveness. Recommended for most users.</span>
									{:else if currentPerformanceMode === 'performance'}
										<span class="text-ferrari-700 font-semibold">Performance Mode:</span>
										<span class="text-converter-secondary">Maximum processing speed using all available cores. May temporarily slow other applications.</span>
									{:else if currentPerformanceMode === 'custom'}
										<span class="text-ferrari-700 font-semibold">Custom Mode:</span>
										<span class="text-converter-secondary">Fine-tune thread count for your specific hardware and workload requirements.</span>
									{/if}
								</div>
							</div>
						</div>
					</div>

					<!-- Enhanced Custom Thread Count Section -->
					{#if currentPerformanceMode === 'custom'}
						<div class="mt-6 space-y-4 bg-gradient-to-br from-purple-50/50 to-ferrari-50/30 rounded-xl p-4 border border-purple-200/30">
							<!-- Improved header layout with better spacing -->
							<div class="space-y-3">
								<!-- Title row -->
								<div class="flex items-center gap-2">
									<div class="bg-purple-100 rounded-lg p-1.5 flex-shrink-0">
										<Cpu class="text-purple-600 h-4 w-4" />
									</div>
									<label class="text-converter-primary text-base font-medium">Thread Configuration</label>
									<Tooltip
										content="Number of parallel processing threads. More threads = faster processing but higher CPU usage. Optimal number depends on your device's capabilities."
										position="top"
										size="md"
									/>
								</div>
								
								<!-- Counter display row -->
								<div class="flex justify-start">
									<span class="bg-purple-100 text-purple-800 rounded-full px-4 py-2 font-mono text-sm font-medium shadow-sm">
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
										class="slider-ferrari w-full h-2"
										use:initializeSliderFill
									/>
									<!-- Thread usage visualization -->
									<div class="flex justify-between mt-2 text-xs text-converter-secondary">
										<span class="flex items-center gap-1">
											<div class="w-2 h-2 rounded-full bg-green-500"></div>
											Light (1-2)
										</span>
										<span class="flex items-center gap-1">
											<div class="w-2 h-2 rounded-full bg-blue-500"></div>
											Optimal ({getOptimalThreadCount('balanced')})
										</span>
										<span class="flex items-center gap-1">
											<div class="w-2 h-2 rounded-full bg-orange-500"></div>
											Max ({systemCapabilities.cores})
										</span>
									</div>
								</div>
								
								<!-- Performance Impact Indicator -->
								<div class="bg-white/70 border border-purple-200/50 rounded-lg p-3 text-sm">
									<div class="flex items-center gap-2 mb-2">
										<div class="w-3 h-3 rounded-full {currentThreadCount <= 2 ? 'bg-green-500' : currentThreadCount <= getOptimalThreadCount('balanced') ? 'bg-blue-500' : 'bg-orange-500'}"></div>
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
