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
		Cpu
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Slider } from '$lib/components/ui/slider';
	import { Badge } from '$lib/components/ui/badge';
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

	// UI State
	let showAdvanced = $state(false);
	let showQuickSettings = $state(true);
	let isMobileSettingsOpen = $state(false);

	// Performance state
	let localPerformanceMode = $state<PerformanceMode>(performanceMode);
	let customThreadCount = $state(threadCount);
	let announcePerformanceChange = $state<string>('');
	const systemCapabilities = performanceMonitor.getSystemCapabilities();

	function handlePerformanceModeChange(mode: PerformanceMode) {
		localPerformanceMode = mode;
		const optimalThreads = mode === 'custom' ? customThreadCount : getOptimalThreadCount(mode);
		onPerformanceModeChange?.(mode, optimalThreads);

		// Announce change to screen readers
		announcePerformanceChange = `Performance mode changed to ${mode}`;
		setTimeout(() => (announcePerformanceChange = ''), 1000);
	}

	function handleCustomThreadChange(value: number) {
		customThreadCount = value;
		if (localPerformanceMode === 'custom') {
			onPerformanceModeChange?.('custom', value);
		}
	}

	// Keep quick settings visible when images are uploaded
</script>

<!-- Screen reader announcements -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
	{announcePerformanceChange}
</div>

<div class="space-y-6">
	<!-- Quick Settings Bar (Collapsible) -->
	<div class="bg-card rounded-lg border">
		<div class="p-4">
			<button
				class="hover:bg-muted/50 -m-2 flex w-full items-center justify-between rounded-md p-2 transition-colors focus:outline-none"
				onclick={() => (showQuickSettings = !showQuickSettings)}
				aria-label={showQuickSettings ? 'Hide quick settings' : 'Show quick settings'}
			>
				<h3 class="flex items-center gap-2 font-medium">
					<Sliders class="h-4 w-4" />
					Quick Settings
				</h3>
				<div class="flex-shrink-0">
					{#if showQuickSettings}
						<ChevronUp class="h-4 w-4" />
					{:else}
						<ChevronDown class="h-4 w-4" />
					{/if}
				</div>
			</button>

			{#if showQuickSettings}
				<div class="mt-4 space-y-4">
					<!-- Algorithm Selection - Most Important -->
					<div>
						<div class="mb-2 text-sm font-medium">Algorithm</div>
						<BackendSelector
							selectedBackend={config.backend}
							{onBackendChange}
							disabled={isProcessing}
							compact={true}
						/>
					</div>

					<!-- Style Preset Selection -->
					<div>
						<div class="mb-2 text-sm font-medium">Style Preset</div>
						<PresetSelector
							{selectedPreset}
							{onPresetChange}
							disabled={isProcessing}
							isCustom={selectedPreset === 'custom'}
							compact={true}
						/>
					</div>

					<!-- Essential Parameters -->
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label for="detail-slider" class="mb-1 block text-sm font-medium">Detail Level</label>
							<input
								id="detail-slider"
								type="range"
								min="0.1"
								max="1"
								step="0.1"
								value={config.detail}
								oninput={(e) => onConfigChange({ detail: parseFloat(e.currentTarget.value) })}
								disabled={isProcessing}
								class="w-full"
							/>
							<div class="text-muted-foreground mt-1 flex justify-between text-xs">
								<span>Simple</span>
								<span>{Math.round(config.detail * 10)}/10</span>
								<span>Detailed</span>
							</div>
						</div>

						<div>
							<label for="stroke-width-slider" class="mb-1 block text-sm font-medium"
								>Line Width</label
							>
							<input
								id="stroke-width-slider"
								type="range"
								min="0.5"
								max="5"
								step="0.1"
								value={config.stroke_width}
								oninput={(e) => onConfigChange({ stroke_width: parseFloat(e.currentTarget.value) })}
								disabled={isProcessing}
								class="w-full"
							/>
							<div class="text-muted-foreground mt-1 flex justify-between text-xs">
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

	<!-- Advanced Settings (Collapsible) -->
	<div class="bg-card rounded-lg border">
		<div class="p-4">
			<button
				class="hover:bg-muted/50 -m-2 flex w-full items-center justify-between rounded-md p-2 transition-colors focus:outline-none"
				onclick={() => (showAdvanced = !showAdvanced)}
				aria-label={showAdvanced ? 'Hide advanced settings' : 'Show advanced settings'}
			>
				<h3 class="flex items-center gap-2 font-medium">
					<Settings class="h-4 w-4" />
					Advanced Settings
				</h3>
				<div class="flex-shrink-0">
					{#if showAdvanced}
						<ChevronUp class="h-4 w-4" />
					{:else}
						<ChevronDown class="h-4 w-4" />
					{/if}
				</div>
			</button>

			{#if showAdvanced}
				<div class="mt-4 space-y-6">
					<!-- Performance Configuration Section -->
					<Card.Root>
						<Card.Header>
							<div class="flex items-center justify-between">
								<div>
									<Card.Title class="text-base">Performance Configuration</Card.Title>
									<Card.Description>Optimize processing settings for your system</Card.Description>
								</div>
								<div class="flex items-center gap-2">
									<Badge variant="outline" class="font-mono">
										<Cpu class="mr-1 h-3 w-3" />
										{threadCount}
									</Badge>
									<Badge variant={threadsInitialized ? 'default' : 'secondary'}>
										{threadsInitialized ? 'Active' : 'Ready'}
									</Badge>
								</div>
							</div>
						</Card.Header>
						<Card.Content class="space-y-6">
							<!-- Performance Mode Selection -->
							<div class="space-y-3">
								<div>
									<div class="mb-2 text-sm font-medium">Performance Mode</div>
									<div
										role="group"
										aria-label="Performance mode selection"
										class="bg-muted/20 grid grid-cols-2 gap-1 rounded-md border p-1 lg:grid-cols-4"
									>
										<Button
											variant={localPerformanceMode === 'economy' ? 'default' : 'ghost'}
											size="sm"
											onclick={() => handlePerformanceModeChange('economy')}
											disabled={isProcessing}
											class="h-8 text-xs {localPerformanceMode === 'economy' ? 'shadow-sm' : ''}"
											aria-pressed={localPerformanceMode === 'economy'}
										>
											Economy
										</Button>
										<Button
											variant={localPerformanceMode === 'balanced' ? 'default' : 'ghost'}
											size="sm"
											onclick={() => handlePerformanceModeChange('balanced')}
											disabled={isProcessing}
											class="h-8 text-xs {localPerformanceMode === 'balanced' ? 'shadow-sm' : ''}"
											aria-pressed={localPerformanceMode === 'balanced'}
										>
											Balanced
										</Button>
										<Button
											variant={localPerformanceMode === 'performance' ? 'default' : 'ghost'}
											size="sm"
											onclick={() => handlePerformanceModeChange('performance')}
											disabled={isProcessing}
											class="h-8 text-xs {localPerformanceMode === 'performance'
												? 'shadow-sm'
												: ''}"
											aria-pressed={localPerformanceMode === 'performance'}
										>
											<Zap class="mr-1 h-3 w-3" />
											Performance
										</Button>
										<Button
											variant={localPerformanceMode === 'custom' ? 'default' : 'ghost'}
											size="sm"
											onclick={() => handlePerformanceModeChange('custom')}
											disabled={isProcessing}
											class="h-8 text-xs {localPerformanceMode === 'custom' ? 'shadow-sm' : ''}"
											aria-pressed={localPerformanceMode === 'custom'}
										>
											Custom
										</Button>
									</div>
								</div>
								<div class="bg-muted/30 rounded-md p-3">
									<p class="text-muted-foreground text-xs">
										{#if localPerformanceMode === 'economy'}
											<span class="font-medium text-blue-700 dark:text-blue-400">Economy:</span> Minimal
											CPU usage, slower processing
										{:else if localPerformanceMode === 'balanced'}
											<span class="font-medium text-green-700 dark:text-green-400">Balanced:</span> Good
											balance of speed and system responsiveness
										{:else if localPerformanceMode === 'performance'}
											<span class="font-medium text-orange-700 dark:text-orange-400"
												>Performance:</span
											> Maximum speed, may slow down browser
										{:else if localPerformanceMode === 'custom'}
											<span class="font-medium text-purple-700 dark:text-purple-400">Custom:</span> Manual
											thread count control
										{/if}
									</p>
								</div>
							</div>

							<!-- Thread Count Slider (for custom mode) -->
							{#if localPerformanceMode === 'custom'}
								<div class="space-y-3">
									<div
										class="rounded-md border border-purple-200 bg-purple-50/50 p-3 dark:border-purple-800 dark:bg-purple-950/50"
									>
										<div class="mb-2 flex items-center justify-between">
											<div class="text-sm font-medium text-purple-900 dark:text-purple-100">
												Thread Count
											</div>
											<Badge
												variant="outline"
												class="border-purple-300 text-purple-700 dark:border-purple-600 dark:text-purple-300"
											>
												{customThreadCount} threads
											</Badge>
										</div>
										<Slider
											value={customThreadCount}
											onValueChange={handleCustomThreadChange}
											min={1}
											max={systemCapabilities.cores}
											step={1}
											disabled={isProcessing}
											class="mb-2 w-full"
										/>
										<p class="text-xs text-purple-600 dark:text-purple-400">
											Recommended: {getOptimalThreadCount('balanced')} threads for your system
										</p>
									</div>
								</div>
							{/if}

							<!-- System Status -->
							<div
								class="rounded-md border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/50"
							>
								<div class="mb-3 flex items-center justify-between">
									<h4 class="text-sm font-medium text-slate-900 dark:text-slate-100">
										System Status
									</h4>
									<Badge variant="outline" class="font-mono text-xs">
										{systemCapabilities.cores} cores
									</Badge>
								</div>

								<div class="space-y-2">
									<div class="flex items-center justify-between text-sm">
										<span class="text-slate-600 dark:text-slate-400">WebAssembly</span>
										<span class="font-medium text-green-700 dark:text-green-400">Ready</span>
									</div>
									<div class="flex items-center justify-between text-sm">
										<span class="text-slate-600 dark:text-slate-400">Active Mode</span>
										<span class="font-medium text-blue-700 capitalize dark:text-blue-400">
											{localPerformanceMode}
										</span>
									</div>
									{#if threadsInitialized}
										<div class="flex items-center justify-between text-sm">
											<span class="text-slate-600 dark:text-slate-400">Thread Pool</span>
											<span class="font-medium text-green-700 dark:text-green-400">
												{threadCount} threads active
											</span>
										</div>
									{/if}
								</div>
							</div>
						</Card.Content>
					</Card.Root>

					<!-- Essential Parameters Panel -->
					<ParameterPanel {config} {onConfigChange} disabled={isProcessing} {onParameterChange} />

					<!-- Advanced Controls -->
					<AdvancedControls {config} {onConfigChange} disabled={isProcessing} {onParameterChange} />
				</div>
			{/if}
		</div>
	</div>

	<!-- Mobile Sticky Action Bar -->
	<div
		class="bg-background fixed right-0 bottom-0 left-0 z-40 border-t p-4 lg:hidden"
		class:hidden={!hasImages}
	>
		<div class="flex items-center gap-3">
			<Button class="flex-1" onclick={onConvert} disabled={!canConvert}>
				{#if isProcessing}
					<div
						class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
					></div>
					Converting...
				{:else}
					<Play class="mr-2 h-4 w-4" />
					Convert
				{/if}
			</Button>

			{#if canDownload}
				<Button variant="outline" onclick={onDownload}>
					<Download class="h-4 w-4" />
				</Button>
			{/if}

			<Button
				variant="outline"
				onclick={() => (isMobileSettingsOpen = !isMobileSettingsOpen)}
				aria-label="Toggle settings"
			>
				<Settings class="h-4 w-4" />
			</Button>
		</div>
	</div>

	<!-- Mobile Settings Overlay -->
	{#if isMobileSettingsOpen}
		<div class="bg-background fixed inset-0 z-50 overflow-y-auto lg:hidden">
			<div class="space-y-6 p-4">
				<!-- Header -->
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold">Conversion Settings</h2>
					<Button variant="ghost" onclick={() => (isMobileSettingsOpen = false)}>Done</Button>
				</div>

				<!-- Mobile Settings Content -->
				<div class="space-y-6">
					<!-- Algorithm Selection -->
					<BackendSelector
						selectedBackend={config.backend}
						{onBackendChange}
						disabled={isProcessing}
					/>

					<!-- Style Preset Selection -->
					<PresetSelector
						{selectedPreset}
						{onPresetChange}
						disabled={isProcessing}
						isCustom={selectedPreset === 'custom'}
					/>

					<!-- Essential Parameters -->
					<ParameterPanel {config} {onConfigChange} disabled={isProcessing} {onParameterChange} />

					<!-- Advanced Controls -->
					<AdvancedControls {config} {onConfigChange} disabled={isProcessing} {onParameterChange} />
				</div>

				<!-- Mobile Bottom Padding -->
				<div class="h-20"></div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Add safe area padding for mobile */
	@supports (padding-bottom: env(safe-area-inset-bottom)) {
		.fixed.bottom-0 {
			padding-bottom: calc(1rem + env(safe-area-inset-bottom));
		}
	}

	/* Screen reader only text */
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
</style>
