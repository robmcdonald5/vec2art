<script lang="ts">
import {
	Settings,
	Sliders,
	ChevronDown,
	ChevronUp,
	Zap,
	Cpu
} from 'lucide-svelte';
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
</script>

<div class="w-full max-w-sm space-y-4">
	<!-- Quick Settings Panel -->
	<div class="card-ferrari-static overflow-hidden rounded-2xl">
		<button 
			class="w-full flex items-center justify-between p-4 text-left hover:bg-ferrari-50 dark:hover:bg-ferrari-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ferrari-500"
			onclick={() => isQuickSettingsExpanded = !isQuickSettingsExpanded}
			type="button"
		>
			<div class="flex items-center gap-3">
				<div class="icon-ferrari-bg rounded-lg p-2">
					<Sliders class="h-4 w-4 text-white" />
				</div>
				<h3 class="text-converter-primary text-lg font-semibold">Quick Settings</h3>
			</div>
			<div class="flex-shrink-0">
				{#if isQuickSettingsExpanded}
					<ChevronUp class="h-5 w-5 text-converter-secondary" />
				{:else}
					<ChevronDown class="h-5 w-5 text-converter-secondary" />
				{/if}
			</div>
		</button>

		{#if isQuickSettingsExpanded}
			<div class="border-t border-ferrari-200 dark:border-ferrari-800 p-4 space-y-6">
				<!-- Algorithm Selection -->
				<div>
					<div class="flex items-center gap-2 mb-3">
						<label class="block text-sm font-medium text-converter-primary">
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
						onBackendChange={onBackendChange}
						disabled={disabled}
						compact={true}
					/>
				</div>

				<!-- Style Preset -->
				<div>
					<div class="flex items-center gap-2 mb-3">
						<label class="block text-sm font-medium text-converter-primary">
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
						onPresetChange={onPresetChange}
						disabled={disabled}
						isCustom={selectedPreset === 'custom'}
						compact={true}
					/>
				</div>

				<!-- Essential Parameters -->
				<div class="grid grid-cols-1 gap-6">
					<!-- Detail Level -->
					<div>
						<div class="flex items-center gap-2 mb-2">
							<label class="block text-sm font-medium text-converter-primary">
								Detail Level
							</label>
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
							disabled={disabled}
							class="w-full h-2 bg-ferrari-100 dark:bg-ferrari-800 rounded-lg appearance-none cursor-pointer accent-ferrari-600"
						/>
						<div class="flex justify-between text-xs text-converter-secondary mt-1">
							<span>Simple</span>
							<span class="font-medium">{Math.round(config.detail * 10)}/10</span>
							<span>Detailed</span>
						</div>
					</div>

					<!-- Line Width -->
					<div>
						<div class="flex items-center gap-2 mb-2">
							<label class="block text-sm font-medium text-converter-primary">
								Line Width
							</label>
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
							disabled={disabled}
							class="w-full h-2 bg-ferrari-100 dark:bg-ferrari-800 rounded-lg appearance-none cursor-pointer accent-ferrari-600"
						/>
						<div class="flex justify-between text-xs text-converter-secondary mt-1">
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
	<div class="card-ferrari-static overflow-hidden rounded-2xl">
		<button 
			class="w-full flex items-center justify-between p-4 text-left hover:bg-ferrari-50 dark:hover:bg-ferrari-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ferrari-500"
			onclick={() => isAdvancedSettingsExpanded = !isAdvancedSettingsExpanded}
			type="button"
		>
			<div class="flex items-center gap-3">
				<div class="icon-ferrari-bg rounded-lg p-2">
					<Settings class="h-4 w-4 text-white" />
				</div>
				<h3 class="text-converter-primary text-lg font-semibold">Advanced Settings</h3>
			</div>
			<div class="flex-shrink-0">
				{#if isAdvancedSettingsExpanded}
					<ChevronUp class="h-5 w-5 text-converter-secondary" />
				{:else}
					<ChevronDown class="h-5 w-5 text-converter-secondary" />
				{/if}
			</div>
		</button>

		{#if isAdvancedSettingsExpanded}
			<div class="border-t border-ferrari-200 dark:border-ferrari-800 p-4 space-y-6">
				<!-- Performance Configuration -->
				<div class="bg-ferrari-50 dark:bg-ferrari-950/50 rounded-xl p-4">
					<div class="flex items-center justify-between mb-4">
						<h4 class="text-converter-primary font-medium">Performance</h4>
						<div class="flex items-center gap-2">
							<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-ferrari-100 text-ferrari-800 dark:bg-ferrari-900 dark:text-ferrari-200">
								<Cpu class="w-3 h-3 mr-1" />
								{threadCount}
							</span>
							<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {threadsInitialized ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}">
								{threadsInitialized ? 'Active' : 'Ready'}
							</span>
						</div>
					</div>

					<!-- Performance Mode Buttons -->
					<div class="space-y-3">
						<div class="flex items-center gap-2">
							<label class="block text-sm font-medium text-converter-primary">
								Performance Mode
							</label>
							<Tooltip 
								content="Controls CPU usage and processing speed. Economy uses fewer threads for background processing, Balanced provides optimal speed/resource balance, Performance maximizes speed using all available cores."
								position="top"
								size="md"
							/>
						</div>
						<div class="grid grid-cols-2 gap-2 p-1 bg-ferrari-100 dark:bg-ferrari-900 rounded-lg">
							<button
								class="px-3 py-2 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ferrari-500 {currentPerformanceMode === 'economy' ? 'bg-ferrari-600 text-white' : 'bg-white text-ferrari-700 hover:bg-ferrari-50 dark:bg-ferrari-800 dark:text-ferrari-300 dark:hover:bg-ferrari-700'}"
								onclick={() => clickPerformanceMode('economy')}
								disabled={disabled}
								type="button"
							>
								Economy
							</button>
							<button
								class="px-3 py-2 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ferrari-500 {currentPerformanceMode === 'balanced' ? 'bg-ferrari-600 text-white' : 'bg-white text-ferrari-700 hover:bg-ferrari-50 dark:bg-ferrari-800 dark:text-ferrari-300 dark:hover:bg-ferrari-700'}"
								onclick={() => clickPerformanceMode('balanced')}
								disabled={disabled}
								type="button"
							>
								Balanced
							</button>
							<button
								class="px-3 py-2 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ferrari-500 {currentPerformanceMode === 'performance' ? 'bg-ferrari-600 text-white' : 'bg-white text-ferrari-700 hover:bg-ferrari-50 dark:bg-ferrari-800 dark:text-ferrari-300 dark:hover:bg-ferrari-700'}"
								onclick={() => clickPerformanceMode('performance')}
								disabled={disabled}
								type="button"
							>
								<Zap class="w-3 h-3 mr-1 inline" />
								Performance
							</button>
							<button
								class="px-3 py-2 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ferrari-500 {currentPerformanceMode === 'custom' ? 'bg-ferrari-600 text-white' : 'bg-white text-ferrari-700 hover:bg-ferrari-50 dark:bg-ferrari-800 dark:text-ferrari-300 dark:hover:bg-ferrari-700'}"
								onclick={() => clickPerformanceMode('custom')}
								disabled={disabled}
								type="button"
							>
								Custom
							</button>
						</div>
						
						<div class="text-xs text-converter-secondary bg-ferrari-100 dark:bg-ferrari-900 rounded-lg p-3">
							{#if currentPerformanceMode === 'economy'}
								<span class="font-medium text-ferrari-600">Economy:</span> Minimal CPU usage, slower processing
							{:else if currentPerformanceMode === 'balanced'}
								<span class="font-medium text-ferrari-600">Balanced:</span> Good balance of speed and system responsiveness
							{:else if currentPerformanceMode === 'performance'}
								<span class="font-medium text-ferrari-600">Performance:</span> Maximum speed, may slow down browser
							{:else if currentPerformanceMode === 'custom'}
								<span class="font-medium text-ferrari-600">Custom:</span> Manual thread count control
							{/if}
						</div>
					</div>

					<!-- Custom Thread Count -->
					{#if currentPerformanceMode === 'custom'}
						<div class="mt-4 space-y-3">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<label class="text-sm font-medium text-converter-primary">Thread Count</label>
									<Tooltip 
										content="Number of parallel processing threads. More threads = faster processing but higher CPU usage. Optimal number depends on your device's capabilities."
										position="top"
										size="md"
									/>
								</div>
								<span class="text-xs font-mono bg-ferrari-100 dark:bg-ferrari-900 px-2 py-1 rounded">{currentThreadCount}</span>
							</div>
							<input
								type="range"
								min="1"
								max={systemCapabilities.cores}
								step="1"
								value={currentThreadCount}
								oninput={updateThreadCount}
								disabled={disabled}
								class="w-full h-2 bg-ferrari-100 dark:bg-ferrari-800 rounded-lg appearance-none cursor-pointer accent-ferrari-600"
							/>
							<p class="text-xs text-converter-secondary">
								Recommended: {getOptimalThreadCount('balanced')} threads for your system
							</p>
						</div>
					{/if}
				</div>

				<!-- Parameter Panel -->
				<ParameterPanel {config} onConfigChange={onConfigChange} disabled={disabled} onParameterChange={onParameterChange} />

				<!-- Advanced Controls -->
				<AdvancedControls {config} onConfigChange={onConfigChange} disabled={disabled} onParameterChange={onParameterChange} />
			</div>
		{/if}
	</div>
</div>