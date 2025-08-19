<script lang="ts">
	import {
		Settings,
		Play,
		Download,
		RotateCcw,
		ChevronDown,
		ChevronUp,
		Sliders,
		Zap,
		Cpu,
		Menu,
		X
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
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

	interface Props {
		config: VectorizerConfig;
		selectedPreset: VectorizerPreset | 'custom';
		canConvert: boolean;
		canDownload: boolean;
		isProcessing: boolean;
		hasImages: boolean;
		performanceMode?: PerformanceMode;
		threadCount?: number;
		threadsInitialized?: boolean;
		onConfigChange: (updates: Partial<VectorizerConfig>) => void;
		onPresetChange: (preset: VectorizerPreset | 'custom') => void;
		onBackendChange: (backend: VectorizerBackend) => void;
		onParameterChange: () => void;
		onConvert: () => void;
		onDownload: () => void;
		onReset: () => void;
		onAbort: () => void;
		onPerformanceModeChange?: (mode: PerformanceMode, threadCount: number) => void;
	}

	let {
		config,
		selectedPreset,
		canConvert,
		canDownload,
		isProcessing,
		hasImages,
		performanceMode = 'balanced',
		threadCount = 4,
		threadsInitialized = false,
		onConfigChange,
		onPresetChange,
		onBackendChange,
		onParameterChange,
		onConvert,
		onDownload,
		onReset,
		onAbort,
		onPerformanceModeChange
	}: Props = $props();

	// Simple UI state management
	let isQuickSettingsExpanded = $state(true);
	let isAdvancedSettingsExpanded = $state(false);
	let isMobileMenuOpen = $state(false);

	// Performance state
	let currentPerformanceMode = $state<PerformanceMode>(performanceMode);
	let currentThreadCount = $state(threadCount);
	const systemCapabilities = performanceMonitor.getSystemCapabilities();

	// Simple button click handlers with explicit logging
	function clickQuickSettings() {
		console.log('🔵 Quick Settings button clicked!');
		isQuickSettingsExpanded = !isQuickSettingsExpanded;
	}

	function clickAdvancedSettings() {
		console.log('🔵 Advanced Settings button clicked!');
		isAdvancedSettingsExpanded = !isAdvancedSettingsExpanded;
	}

	function clickPerformanceMode(mode: PerformanceMode) {
		console.log('🔵 Performance Mode button clicked:', mode);
		currentPerformanceMode = mode;
		const optimalThreads = mode === 'custom' ? currentThreadCount : getOptimalThreadCount(mode);
		onPerformanceModeChange?.(mode, optimalThreads);
	}

	function clickMobileMenu() {
		console.log('🔵 Mobile Menu button clicked!');
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	function clickCloseMobileMenu() {
		console.log('🔵 Close Mobile Menu button clicked!');
		isMobileMenuOpen = false;
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
			
			console.log(`🔵 Config update: ${key} = ${value}`);
			onConfigChange({ [key]: value } as Partial<VectorizerConfig>);
			onParameterChange();
		};
	}
</script>

<!-- Screen reader announcements -->
<div aria-live="polite" class="sr-only">
	Performance mode: {currentPerformanceMode}
</div>

<div class="space-y-6">
	<!-- Quick Settings Panel -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
		<div class="p-4">
			<!-- Header Button -->
			<button 
				class="w-full flex items-center justify-between p-2 -m-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
				onclick={clickQuickSettings}
				type="button"
			>
				<div class="flex items-center gap-2">
					<Sliders class="h-4 w-4 text-blue-600" />
					<h3 class="font-medium text-gray-900 dark:text-white">Quick Settings</h3>
				</div>
				<div class="flex-shrink-0">
					{#if isQuickSettingsExpanded}
						<ChevronUp class="h-4 w-4 text-gray-500" />
					{:else}
						<ChevronDown class="h-4 w-4 text-gray-500" />
					{/if}
				</div>
			</button>

			<!-- Content -->
			{#if isQuickSettingsExpanded}
				<div class="mt-4 space-y-4">
					<!-- Algorithm Selection -->
					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Algorithm
						</label>
						<BackendSelector
							selectedBackend={config.backend}
							onBackendChange={onBackendChange}
							disabled={isProcessing}
							compact={true}
						/>
					</div>

					<!-- Style Preset -->
					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Style Preset
						</label>
						<PresetSelector
							{selectedPreset}
							onPresetChange={onPresetChange}
							disabled={isProcessing}
							isCustom={selectedPreset === 'custom'}
							compact={true}
						/>
					</div>

					<!-- Essential Parameters -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<!-- Detail Level -->
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Detail Level
							</label>
							<input
								type="range"
								min="0.1"
								max="1"
								step="0.1"
								value={config.detail}
								oninput={updateConfig('detail')}
								disabled={isProcessing}
								class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
							/>
							<div class="flex justify-between text-xs mt-1" style="color: #6b7280 !important;">
								<span>Simple</span>
								<span>{Math.round(config.detail * 10)}/10</span>
								<span>Detailed</span>
							</div>
						</div>

						<!-- Line Width -->
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Line Width
							</label>
							<input
								type="range"
								min="0.5"
								max="5"
								step="0.1"
								value={config.stroke_width}
								oninput={updateConfig('stroke_width')}
								disabled={isProcessing}
								class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
							/>
							<div class="flex justify-between text-xs mt-1" style="color: #6b7280 !important;">
								<span>Thin</span>
								<span>{config.stroke_width.toFixed(1)}px</span>
								<span>Thick</span>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Advanced Settings Panel -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
		<div class="p-4">
			<!-- Header Button -->
			<button 
				class="w-full flex items-center justify-between p-2 -m-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
				onclick={clickAdvancedSettings}
				type="button"
			>
				<div class="flex items-center gap-2">
					<Settings class="h-4 w-4 text-blue-600" />
					<h3 class="font-medium text-gray-900 dark:text-white">Advanced Settings</h3>
				</div>
				<div class="flex-shrink-0">
					{#if isAdvancedSettingsExpanded}
						<ChevronUp class="h-4 w-4 text-gray-500" />
					{:else}
						<ChevronDown class="h-4 w-4 text-gray-500" />
					{/if}
				</div>
			</button>

			<!-- Content -->
			{#if isAdvancedSettingsExpanded}
				<div class="mt-4 space-y-6">
					<!-- Performance Configuration -->
					<div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
						<div class="flex items-center justify-between mb-3">
							<h4 class="font-medium text-gray-900 dark:text-white">Performance Configuration</h4>
							<div class="flex items-center gap-2">
								<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
									<Cpu class="w-3 h-3 mr-1" />
									{threadCount}
								</span>
								<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium {threadsInitialized ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}">
									{threadsInitialized ? 'Active' : 'Ready'}
								</span>
							</div>
						</div>

						<!-- Performance Mode Buttons -->
						<div class="space-y-3">
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Performance Mode
							</label>
							<div class="grid grid-cols-2 lg:grid-cols-4 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-md">
								<button
									class="px-3 py-2 text-xs font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 {currentPerformanceMode === 'economy' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
									onclick={() => clickPerformanceMode('economy')}
									disabled={isProcessing}
									type="button"
								>
									Economy
								</button>
								<button
									class="px-3 py-2 text-xs font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 {currentPerformanceMode === 'balanced' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
									onclick={() => clickPerformanceMode('balanced')}
									disabled={isProcessing}
									type="button"
								>
									Balanced
								</button>
								<button
									class="px-3 py-2 text-xs font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 {currentPerformanceMode === 'performance' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
									onclick={() => clickPerformanceMode('performance')}
									disabled={isProcessing}
									type="button"
								>
									<Zap class="w-3 h-3 mr-1 inline" />
									Performance
								</button>
								<button
									class="px-3 py-2 text-xs font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 {currentPerformanceMode === 'custom' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
									onclick={() => clickPerformanceMode('custom')}
									disabled={isProcessing}
									type="button"
								>
									Custom
								</button>
							</div>
							
							<div class="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded p-2">
								{#if currentPerformanceMode === 'economy'}
									<span class="font-medium text-blue-600">Economy:</span> Minimal CPU usage, slower processing
								{:else if currentPerformanceMode === 'balanced'}
									<span class="font-medium text-blue-600">Balanced:</span> Good balance of speed and system responsiveness
								{:else if currentPerformanceMode === 'performance'}
									<span class="font-medium text-blue-600">Performance:</span> Maximum speed, may slow down browser
								{:else if currentPerformanceMode === 'custom'}
									<span class="font-medium text-blue-600">Custom:</span> Manual thread count control
								{/if}
							</div>
						</div>

						<!-- Custom Thread Count -->
						{#if currentPerformanceMode === 'custom'}
							<div class="mt-4 space-y-2">
								<div class="flex items-center justify-between">
									<label class="text-sm font-medium text-gray-700 dark:text-gray-300">Thread Count</label>
									<span class="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{currentThreadCount}</span>
								</div>
								<input
									type="range"
									min="1"
									max={systemCapabilities.cores}
									step="1"
									value={currentThreadCount}
									oninput={updateThreadCount}
									disabled={isProcessing}
									class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
								/>
								<p class="text-xs text-gray-600 dark:text-gray-400">
									Recommended: {getOptimalThreadCount('balanced')} threads for your system
								</p>
							</div>
						{/if}
					</div>

					<!-- Parameter Panel -->
					<ParameterPanel {config} onConfigChange={onConfigChange} disabled={isProcessing} onParameterChange={onParameterChange} />

					<!-- Advanced Controls -->
					<AdvancedControls {config} onConfigChange={onConfigChange} disabled={isProcessing} onParameterChange={onParameterChange} />
				</div>
			{/if}
		</div>
	</div>

	<!-- Mobile Action Bar -->
	<div class="lg:hidden {hasImages ? 'block' : 'hidden'} fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
		<div class="flex items-center gap-3">
			<Button 
				class="flex-1 bg-blue-600 hover:bg-blue-700 text-white" 
				onclick={onConvert} 
				disabled={!canConvert}
			>
				{#if isProcessing}
					<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
					Converting...
				{:else}
					<Play class="w-4 h-4 mr-2" />
					Convert
				{/if}
			</Button>

			{#if canDownload}
				<Button 
					variant="outline" 
					onclick={onDownload}
					class="border-gray-300 dark:border-gray-600"
				>
					<Download class="w-4 h-4" />
				</Button>
			{/if}

			<Button 
				variant="outline" 
				onclick={clickMobileMenu}
				class="border-gray-300 dark:border-gray-600"
			>
				<Menu class="w-4 h-4" />
			</Button>
		</div>
	</div>

	<!-- Mobile Settings Overlay -->
	{#if isMobileMenuOpen}
		<div class="lg:hidden fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-y-auto">
			<div class="p-4 space-y-6">
				<!-- Header -->
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-900 dark:text-white">Conversion Settings</h2>
					<Button variant="ghost" onclick={clickCloseMobileMenu}>
						<X class="w-4 h-4" />
					</Button>
				</div>

				<!-- Mobile Settings Content -->
				<div class="space-y-6">
					<!-- Algorithm Selection -->
					<BackendSelector
						selectedBackend={config.backend}
						onBackendChange={onBackendChange}
						disabled={isProcessing}
					/>

					<!-- Style Preset Selection -->
					<PresetSelector
						{selectedPreset}
						onPresetChange={onPresetChange}
						disabled={isProcessing}
						isCustom={selectedPreset === 'custom'}
					/>

					<!-- Essential Parameters -->
					<ParameterPanel {config} onConfigChange={onConfigChange} disabled={isProcessing} onParameterChange={onParameterChange} />

					<!-- Advanced Controls -->
					<AdvancedControls {config} onConfigChange={onConfigChange} disabled={isProcessing} onParameterChange={onParameterChange} />
				</div>

				<!-- Bottom padding -->
				<div class="h-20"></div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Simple styles for mobile safe area */
	@supports (padding-bottom: env(safe-area-inset-bottom)) {
		.fixed.bottom-0 {
			padding-bottom: calc(1rem + env(safe-area-inset-bottom));
		}
	}

	/* Screen reader only */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* CRITICAL FIX: Force visible text for slider values */
	.font-medium {
		color: #1f2937 !important;
		opacity: 1 !important;
		-webkit-text-fill-color: #1f2937 !important;
	}
</style>