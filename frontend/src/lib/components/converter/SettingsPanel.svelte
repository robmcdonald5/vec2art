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
		disabled?: boolean;
		onConfigChange: (updates: Partial<VectorizerConfig>) => void;
		onPresetChange: (preset: VectorizerPreset | 'custom') => void;
		onBackendChange: (backend: VectorizerBackend) => void;
		onParameterChange: () => void;
		onPerformanceModeChange?: (mode: PerformanceMode, threadCount: number) => void;
	}

	let {
		config,
		selectedPreset,
		performanceMode = 'balanced',
		threadCount = 4,
		threadsInitialized = false,
		disabled = false,
		onConfigChange,
		onPresetChange,
		onBackendChange,
		onParameterChange,
		onPerformanceModeChange
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
							value={config.detail}
							oninput={updateConfig('detail')}
							{disabled}
							class="slider-ferrari w-full"
							use:initializeSliderFill
						/>
						<div class="text-converter-secondary mt-1 flex justify-between text-xs">
							<span>Simple</span>
							<span class="font-medium">{Math.round(config.detail * 10)}/10</span>
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
							value={config.stroke_width}
							oninput={updateConfig('stroke_width')}
							{disabled}
							class="slider-ferrari w-full"
							use:initializeSliderFill
						/>
						<div class="text-converter-secondary mt-1 flex justify-between text-xs">
							<span>Thin</span>
							<span class="font-medium">{config.stroke_width.toFixed(1)}px</span>
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
					class="from-ferrari-50 to-ferrari-100/30 border-ferrari-200/30 rounded-xl border bg-gradient-to-br p-4"
				>
					<div class="mb-4 flex items-center justify-between">
						<h4 class="text-converter-primary font-medium">Performance</h4>
						<div class="flex items-center gap-2">
							<span
								class="bg-ferrari-100 text-ferrari-800 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
							>
								<Cpu class="mr-1 h-3 w-3" />
								{threadCount}
							</span>
							<span
								class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {threadsInitialized
									? 'bg-green-100 text-green-800 '
									: 'bg-gray-100 text-gray-800 '}"
							>
								{threadsInitialized ? 'Active' : 'Ready'}
							</span>
						</div>
					</div>

					<!-- Performance Mode Buttons -->
					<div class="space-y-3">
						<div class="flex items-center gap-2">
							<label class="text-converter-primary block text-sm font-medium">
								Performance Mode
							</label>
							<Tooltip
								content="Controls CPU usage and processing speed. Economy uses fewer threads for background processing, Balanced provides optimal speed/resource balance, Performance maximizes speed using all available cores."
								position="top"
								size="md"
							/>
						</div>
						<div class="bg-ferrari-100 grid grid-cols-2 gap-2 rounded-lg p-1">
							<button
								class="focus:ring-ferrari-500 rounded-md px-3 py-2 text-xs font-medium transition-colors focus:ring-2 focus:outline-none {currentPerformanceMode ===
								'economy'
									? 'bg-ferrari-600 text-white'
									: 'text-ferrari-700 hover:bg-ferrari-50 bg-white '}"
								onclick={() => clickPerformanceMode('economy')}
								{disabled}
								type="button"
							>
								Economy
							</button>
							<button
								class="focus:ring-ferrari-500 rounded-md px-3 py-2 text-xs font-medium transition-colors focus:ring-2 focus:outline-none {currentPerformanceMode ===
								'balanced'
									? 'bg-ferrari-600 text-white'
									: 'text-ferrari-700 hover:bg-ferrari-50 bg-white '}"
								onclick={() => clickPerformanceMode('balanced')}
								{disabled}
								type="button"
							>
								Balanced
							</button>
							<button
								class="focus:ring-ferrari-500 rounded-md px-3 py-2 text-xs font-medium transition-colors focus:ring-2 focus:outline-none {currentPerformanceMode ===
								'performance'
									? 'bg-ferrari-600 text-white'
									: 'text-ferrari-700 hover:bg-ferrari-50 bg-white '}"
								onclick={() => clickPerformanceMode('performance')}
								{disabled}
								type="button"
							>
								<Zap class="mr-1 inline h-3 w-3" />
								Performance
							</button>
							<button
								class="focus:ring-ferrari-500 rounded-md px-3 py-2 text-xs font-medium transition-colors focus:ring-2 focus:outline-none {currentPerformanceMode ===
								'custom'
									? 'bg-ferrari-600 text-white'
									: 'text-ferrari-700 hover:bg-ferrari-50 bg-white '}"
								onclick={() => clickPerformanceMode('custom')}
								{disabled}
								type="button"
							>
								Custom
							</button>
						</div>

						<div class="text-converter-secondary bg-ferrari-100 rounded-lg p-3 text-xs">
							{#if currentPerformanceMode === 'economy'}
								<span class="text-ferrari-600 font-medium">Economy:</span> Minimal CPU usage, slower
								processing
							{:else if currentPerformanceMode === 'balanced'}
								<span class="text-ferrari-600 font-medium">Balanced:</span> Good balance of speed and
								system responsiveness
							{:else if currentPerformanceMode === 'performance'}
								<span class="text-ferrari-600 font-medium">Performance:</span> Maximum speed, may slow
								down browser
							{:else if currentPerformanceMode === 'custom'}
								<span class="text-ferrari-600 font-medium">Custom:</span> Manual thread count control
							{/if}
						</div>
					</div>

					<!-- Custom Thread Count -->
					{#if currentPerformanceMode === 'custom'}
						<div class="mt-4 space-y-3">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<label class="text-converter-primary text-sm font-medium">Thread Count</label>
									<Tooltip
										content="Number of parallel processing threads. More threads = faster processing but higher CPU usage. Optimal number depends on your device's capabilities."
										position="top"
										size="md"
									/>
								</div>
								<span class="bg-ferrari-100 rounded px-2 py-1 font-mono text-xs"
									>{currentThreadCount}</span
								>
							</div>
							<input
								type="range"
								min="1"
								max={systemCapabilities.cores}
								step="1"
								value={currentThreadCount}
								oninput={updateThreadCount}
								{disabled}
								class="slider-ferrari w-full"
								use:initializeSliderFill
							/>
							<p class="text-converter-secondary text-xs">
								Recommended: {getOptimalThreadCount('balanced')} threads for your system
							</p>
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
